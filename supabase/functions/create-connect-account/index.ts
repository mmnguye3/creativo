import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check=true";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("User not authenticated");

    const body = await req.json();
    const action: "onboard" | "sync" = body.action ?? "onboard";
    const returnUrl: string = body.returnUrl ?? "";

    // Load agency settings
    const { data: agency, error: agencyError } = await supabase
      .from("agency_settings")
      .select("id, agency_name, contact_email, stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (agencyError) throw agencyError;
    if (!agency) throw new Error("Agency settings not found — please save your agency settings first");

    // ── SYNC: retrieve current account status and update DB ──────────────────
    if (action === "sync") {
      if (!agency.stripe_account_id) {
        return new Response(JSON.stringify({ connected: false, onboardingComplete: false }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      const account = await stripe.accounts.retrieve(agency.stripe_account_id);
      const onboardingComplete = !!(account.charges_enabled && account.details_submitted);

      if (onboardingComplete !== agency.stripe_onboarding_complete) {
        await supabase
          .from("agency_settings")
          .update({ stripe_onboarding_complete: onboardingComplete })
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({
          connected: true,
          stripeAccountId: agency.stripe_account_id,
          onboardingComplete,
          chargesEnabled: account.charges_enabled,
          detailsSubmitted: account.details_submitted,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ── ONBOARD: create Express account if needed, return onboarding link ────
    let stripeAccountId = agency.stripe_account_id;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: agency.contact_email || user.email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        business_profile: {
          name: agency.agency_name || "Agency",
          url: returnUrl ? new URL(returnUrl).origin : undefined,
        },
        metadata: { supabase_user_id: user.id, agency_id: agency.id },
      });
      stripeAccountId = account.id;

      const { error: updateError } = await supabase
        .from("agency_settings")
        .update({ stripe_account_id: stripeAccountId })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    }

    // Verify onboarding status for existing accounts
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const onboardingComplete = !!(account.charges_enabled && account.details_submitted);

    if (onboardingComplete !== agency.stripe_onboarding_complete) {
      await supabase
        .from("agency_settings")
        .update({ stripe_onboarding_complete: onboardingComplete })
        .eq("user_id", user.id);
    }

    if (onboardingComplete) {
      return new Response(
        JSON.stringify({ connected: true, onboardingComplete: true, stripeAccountId }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return new Response(
      JSON.stringify({ connected: true, onboardingComplete: false, accountLinkUrl: accountLink.url, stripeAccountId }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("[create-connect-account]", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
