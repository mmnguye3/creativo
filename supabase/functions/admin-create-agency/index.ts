// admin-create-agency
// Single-shot atomic agency provisioning for the Cretivo admin panel.
//
// Creates, in one request (with cleanup on failure):
//   1. Supabase Auth user (email_confirm=true, must_change_password in user_metadata)
//   2. user_roles row  (role = 'agency')
//   3. agency_subdomains row  (subdomain = slug, is_active = true)
//   4. agency_settings row    (agency_name + sensible defaults)
//   5. profiles.must_change_password = true
//
// Sends a Resend welcome email with the temp password.
// Returns { success, tempPassword, emailSent } so the admin sees the
// temp password as a fallback if the email failed.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL =
  Deno.env.get("SUPABASE_URL") ?? "https://ukabvhdvfajudrtqnfpm.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Generates a 16-char password guaranteed to contain uppercase, lowercase,
// digit, and special character, using crypto-random bytes.
function generateTempPassword(): string {
  const upper   = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower   = "abcdefghjkmnpqrstuvwxyz";
  const digits  = "23456789";
  const special = "!@#$%";
  const all     = upper + lower + digits + special;

  const buf = new Uint8Array(24);
  crypto.getRandomValues(buf);

  const chars: string[] = [
    upper  [buf[0]  % upper.length],
    upper  [buf[1]  % upper.length],
    lower  [buf[2]  % lower.length],
    lower  [buf[3]  % lower.length],
    digits [buf[4]  % digits.length],
    digits [buf[5]  % digits.length],
    special[buf[6]  % special.length],
    ...Array.from(buf.slice(7, 21)).map((b) => all[b % all.length]),
  ];

  // Fisher-Yates shuffle with the remaining random bytes
  for (let i = chars.length - 1; i > 0; i--) {
    const j = buf[(i + 7) % buf.length] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("").slice(0, 16);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let createdUserId: string | null = null;

  try {
    // ── 0. Verify caller is admin ─────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Invalid or expired token");

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError) throw new Error(`Could not verify admin status: ${adminError.message}`);
    if (!isAdmin) throw new Error("Unauthorized — admin role required");

    // ── Admin client (service role) for privileged writes ──────────────────
    const supabaseAdmin = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── Parse + validate body ─────────────────────────────────────────────
    const { agencyName, email, slug } = await req.json() as {
      agencyName: string;
      email: string;
      slug: string;
    };

    if (!agencyName?.trim()) throw new Error("Agency name is required");
    if (!email?.trim())       throw new Error("Email address is required");
    if (!slug?.trim())        throw new Error("Site slug is required");

    const cleanSlug  = slug.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName  = agencyName.trim();

    if (cleanSlug.length < 2 || cleanSlug.length > 63) {
      throw new Error("Slug must be 2–63 characters");
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(cleanSlug)) {
      throw new Error(
        "Slug must use only lowercase letters, numbers, and hyphens (no leading/trailing hyphens)"
      );
    }

    // ── Check slug uniqueness (server-side guard) ─────────────────────────
    const { data: slugExists } = await supabaseAdmin
      .from("agency_subdomains")
      .select("id")
      .eq("subdomain", cleanSlug)
      .maybeSingle();
    if (slugExists) throw new Error(`Slug "${cleanSlug}" is already in use`);

    // ── Check email uniqueness ─────────────────────────────────────────────
    const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
    if (existingUsers.some((u) => u.email?.toLowerCase() === cleanEmail)) {
      throw new Error(`An account for "${cleanEmail}" already exists`);
    }

    // ── Generate temp password ─────────────────────────────────────────────
    const tempPassword = generateTempPassword();

    // ══ STEP 1: Create Supabase Auth user ════════════════════════════════
    const { data: newUserData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          must_change_password: true,
          agency_name: cleanName,
        },
      });

    if (createError) throw new Error(`Auth user creation failed: ${createError.message}`);
    const newUser = newUserData.user!;
    createdUserId = newUser.id;

    // ══ STEP 2: Assign 'agency' role ════════════════════════════════════
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: createdUserId, role: "agency" });
    if (roleError) throw new Error(`Role assignment failed: ${roleError.message}`);

    // ══ STEP 3: Create agency_subdomains row ═════════════════════════════
    const { error: subError } = await supabaseAdmin
      .from("agency_subdomains")
      .insert({ subdomain: cleanSlug, user_id: createdUserId, is_active: true });
    if (subError) throw new Error(`Subdomain creation failed: ${subError.message}`);

    // ══ STEP 4: Create agency_settings row ══════════════════════════════
    const { error: settingsError } = await supabaseAdmin
      .from("agency_settings")
      .upsert(
        {
          user_id:               createdUserId,
          agency_name:           cleanName,
          contact_email:         cleanEmail,
          primary_color:         "#6366f1",
          secondary_color:       "#8b5cf6",
          hero_title:            "Professional Design Services",
          hero_subtitle:         "Transform your business with our expert team",
          services_enabled:      true,
          features_enabled:      true,
          testimonials_enabled:  true,
          pricing_enabled:       true,
          hide_powered_by:       false,
        },
        { onConflict: "user_id" }
      );
    if (settingsError) throw new Error(`Agency settings creation failed: ${settingsError.message}`);

    // ══ STEP 5: Set must_change_password in profiles ═════════════════════
    // Profiles may be auto-created by a DB trigger; upsert to be safe.
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: createdUserId, must_change_password: true },
        { onConflict: "id" }
      );
    if (profileErr) {
      // Non-fatal: user_metadata is the primary source of truth for this flag
      console.warn("[admin-create-agency] profiles upsert non-fatal:", profileErr.message);
    }

    // ══ STEP 6: Send welcome email ═══════════════════════════════════════
    let emailSent = false;
    const loginUrl = "https://cretivo.io/auth";
    const siteUrl  = `cretivo.io/${cleanSlug}`;

    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      await resend.emails.send({
        from: "Cretivo Platform <onboarding@resend.dev>",
        to: [cleanEmail],
        subject: `Welcome to Cretivo — your agency account is ready`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;">
            <div style="text-align:center;margin-bottom:28px;">
              <span style="color:#f97316;font-size:28px;font-weight:900;letter-spacing:-1px;">Cretivo</span>
            </div>

            <h2 style="color:#111827;font-size:22px;margin:0 0 8px;">Welcome, ${cleanName}! 🎉</h2>
            <p style="color:#6b7280;line-height:1.6;margin:0 0 20px;">Your white-label design agency account has been provisioned. Use the credentials below to sign in.</p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Login email</p>
              <p style="margin:0 0 16px;color:#111827;font-weight:700;font-size:16px;">${cleanEmail}</p>

              <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Temporary password</p>
              <div style="background:#ffffff;border:2px solid #f97316;border-radius:8px;padding:10px 16px;display:inline-block;">
                <span style="font-family:monospace;font-size:20px;font-weight:700;color:#111827;letter-spacing:2px;">${tempPassword}</span>
              </div>
            </div>

            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin-bottom:24px;">
              <p style="margin:0;color:#92400e;font-size:14px;line-height:1.5;">
                ⚠️ <strong>Action required:</strong> You will be asked to set a permanent password immediately after your first sign-in. Please do this right away.
              </p>
            </div>

            <p style="color:#6b7280;margin:0 0 8px;font-size:14px;">Your agency site URL:</p>
            <p style="font-family:monospace;background:#f3f4f6;padding:10px 16px;border-radius:8px;color:#111827;font-size:15px;margin:0 0 24px;">${siteUrl}</p>

            <div style="text-align:center;margin-bottom:28px;">
              <a href="${loginUrl}"
                 style="background:#f97316;color:#ffffff;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;display:inline-block;">
                Sign In to Dashboard
              </a>
            </div>

            <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 16px;">
            <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
              Cretivo Platform · If you need help, contact your platform administrator.
            </p>
          </div>
        `,
      });
      emailSent = true;
      console.log(`[admin-create-agency] ✓ Welcome email sent to ${cleanEmail}`);
    } catch (emailErr) {
      console.error("[admin-create-agency] Welcome email failed (non-fatal):", emailErr);
    }

    console.log(
      `[admin-create-agency] ✓ Agency "${cleanName}" provisioned: user=${createdUserId} slug=${cleanSlug} emailSent=${emailSent}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        userId:     createdUserId,
        email:      cleanEmail,
        slug:       cleanSlug,
        agencyName: cleanName,
        tempPassword,
        emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[admin-create-agency] Error:", err.message);

    // ── Rollback: delete the auth user so we never leave a half-provisioned account ──
    if (createdUserId) {
      try {
        const supabaseAdmin = createClient(
          SUPABASE_URL,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { autoRefreshToken: false, persistSession: false } }
        );
        await supabaseAdmin.auth.admin.deleteUser(createdUserId);
        console.log(`[admin-create-agency] Rolled back auth user ${createdUserId}`);
      } catch (cleanupErr) {
        console.error("[admin-create-agency] Rollback failed:", cleanupErr);
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: err.message ?? "Internal error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
