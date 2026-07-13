// deliver-order
// Agency-authenticated endpoint that:
//   1. Verifies the order belongs to the calling agency
//   2. Generates 7-day signed download URLs for uploaded deliverable files
//   3. Updates the order: status → 'delivered', saves file refs + optional note
//   4. Sends the branded "Order Delivered" email to the customer
//
// Expects: { orderId: string, filePaths: Array<{path, name, size}>, deliveryNote?: string }
// Files must already be uploaded to the 'deliverables' bucket by the client
// before calling this function.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  sendAgencyEmail,
  buildOrderDeliveredBody,
} from "../_shared/agencyOrderEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: require agency user JWT ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Admin client: used for signed URL generation and order update
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) throw new Error("Not authenticated");

    // ── Parse body ─────────────────────────────────────────────────────────
    const { orderId, filePaths, deliveryNote } = (await req.json()) as {
      orderId: string;
      filePaths: Array<{ path: string; name: string; size?: number }>;
      deliveryNote?: string;
    };

    if (!orderId) throw new Error("orderId is required");
    if (!filePaths || filePaths.length === 0) throw new Error("At least one file is required");

    // ── Get agency for this user ───────────────────────────────────────────
    const { data: agency, error: agencyErr } = await supabaseUser
      .from("agency_settings")
      .select("id, agency_name, logo_url, primary_color, contact_email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (agencyErr || !agency) {
      throw new Error(`Agency not found: ${agencyErr?.message ?? "no data"}`);
    }

    // ── Verify order belongs to this agency ───────────────────────────────
    const { data: order, error: orderErr } = await supabaseUser
      .from("customer_orders")
      .select("id, customer_name, customer_email, status")
      .eq("id", orderId)
      .eq("agency_id", agency.id)
      .maybeSingle();

    if (orderErr || !order) {
      throw new Error("Order not found or access denied");
    }

    if (!["paid", "in_progress"].includes(order.status)) {
      throw new Error(`Cannot deliver order with status '${order.status}' — must be paid or in_progress`);
    }

    // ── Generate signed download URLs (server-side, service role) ─────────
    const signedFiles: Array<{ path: string; name: string; size?: number; signedUrl: string }> = [];

    for (const file of filePaths) {
      const { data: signed, error: signErr } = await supabaseAdmin.storage
        .from("deliverables")
        .createSignedUrl(file.path, SIGNED_URL_EXPIRY_SECONDS);

      if (signErr) {
        throw new Error(`Failed to sign URL for "${file.name}": ${signErr.message}`);
      }

      signedFiles.push({
        path: file.path,
        name: file.name,
        size: file.size,
        signedUrl: signed.signedUrl,
      });
    }

    // ── Update order ───────────────────────────────────────────────────────
    const deliverableFilesRecord = filePaths.map(f => ({
      path: f.path,
      name: f.name,
      size: f.size ?? null,
    }));

    const { error: updateErr } = await supabaseAdmin
      .from("customer_orders")
      .update({
        status: "delivered",
        deliverable_files: deliverableFilesRecord,
        delivery_note: deliveryNote?.trim() || null,
      })
      .eq("id", orderId);

    if (updateErr) throw updateErr;

    console.log(`[deliver-order] ✓ Order ${orderId} marked as delivered`);

    // ── Log delivery activity (non-fatal) ─────────────────────────────────
    try {
      await supabaseAdmin.from("order_activity" as any).insert({
        order_id:       orderId,
        agency_user_id: user.id,
        event_type:     "delivered",
        description:    `${filePaths.length} file${filePaths.length !== 1 ? "s" : ""} delivered to ${order.customer_email}`,
        metadata:       {
          file_count: filePaths.length,
          file_names: filePaths.map(f => f.name),
          delivery_note_preview: deliveryNote ? deliveryNote.trim().slice(0, 120) : null,
        },
      });
    } catch (actErr) {
      console.error("[deliver-order] activity log failed (non-fatal):", actErr);
    }

    // ── Send delivery email to customer ───────────────────────────────────
    const orderRef = order.id.slice(0, 8).toUpperCase();

    const bodyHtml = buildOrderDeliveredBody({
      customerName: order.customer_name,
      orderRef,
      deliveryNote: deliveryNote?.trim() || null,
      signedFiles,
      agencyName: agency.agency_name,
      contactEmail: agency.contact_email,
    });

    const emailResult = await sendAgencyEmail({
      resendApiKey: Deno.env.get("RESEND_API_KEY") ?? "",
      brand: agency,
      to: order.customer_email,
      subject: `Your project is ready, ${order.customer_name}! (#${orderRef})`,
      bodyHtml,
    });

    if (!emailResult.ok) {
      console.error("[deliver-order] Delivery email failed (non-fatal):", emailResult.error);
    } else {
      console.log(`[deliver-order] ✓ Delivery email sent to ${order.customer_email}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailSent: emailResult.ok }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("[deliver-order]", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
