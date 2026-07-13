import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check=true";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_RATE = 0.10; // 10%

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

    const { orderId, priceCents, successUrl, cancelUrl, sendEmail } = await req.json() as {
      orderId: string;
      priceCents: number;
      successUrl: string;
      cancelUrl: string;
      sendEmail?: boolean;
    };

    if (!orderId) throw new Error("orderId is required");
    if (!priceCents || priceCents < 50) throw new Error("priceCents must be at least 50 (50¢)");
    if (!successUrl || !cancelUrl) throw new Error("successUrl and cancelUrl are required");

    // Load the agency for this user
    const { data: agency, error: agencyError } = await supabase
      .from("agency_settings")
      .select("id, agency_name, stripe_account_id, stripe_onboarding_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (agencyError) throw agencyError;
    if (!agency) throw new Error("Agency settings not found");
    if (!agency.stripe_account_id) throw new Error("Stripe account not connected — complete onboarding first");
    if (!agency.stripe_onboarding_complete) throw new Error("Stripe onboarding is not complete — finish setting up your payment account first");

    // Verify the order belongs to this agency
    const { data: order, error: orderError } = await supabase
      .from("customer_orders")
      .select("id, customer_name, customer_email, status, payment_status, stripe_session_id")
      .eq("id", orderId)
      .eq("agency_id", agency.id)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found or access denied");
    if (order.payment_status === "paid") throw new Error("This order has already been paid");

    const applicationFeeAmount = Math.round(priceCents * PLATFORM_FEE_RATE);

    // Create Stripe Checkout Session (destination charge)
    // Platform account creates the session; funds flow to the connected account minus the fee.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: order.customer_email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${agency.agency_name} — Services`,
              description: `Order ${orderId.slice(0, 8).toUpperCase()}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: agency.stripe_account_id,
        },
        metadata: {
          order_id: orderId,
          agency_id: agency.id,
        },
      },
      success_url: `${successUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelUrl}?payment=cancelled`,
      metadata: {
        order_id: orderId,
        agency_id: agency.id,
      },
    });

    // Persist the session id and update order state
    const { error: updateError } = await supabase
      .from("customer_orders")
      .update({
        stripe_session_id: session.id,
        price_cents: priceCents,
        status: "awaiting_payment",
        payment_status: "awaiting_payment",
      })
      .eq("id", orderId);

    if (updateError) throw updateError;

    // Optionally email the checkout link to the customer
    let emailSent = false;
    if (sendEmail && session.url) {
      try {
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
        const dollars = (priceCents / 100).toFixed(2);
        await resend.emails.send({
          from: `${agency.agency_name} <onboarding@resend.dev>`,
          to: [order.customer_email],
          subject: `Your payment link from ${agency.agency_name} — $${dollars}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#f97316;">Your Payment Link</h2>
              <p>Hi ${order.customer_name},</p>
              <p>${agency.agency_name} has sent you a secure payment link for your order.</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <tr><td style="padding:8px 0;color:#666;">Order</td><td style="padding:8px 0;font-weight:bold;">${orderId.slice(0,8).toUpperCase()}</td></tr>
                <tr><td style="padding:8px 0;color:#666;">Amount due</td><td style="padding:8px 0;font-weight:bold;color:#16a34a;">$${dollars}</td></tr>
              </table>
              <p>
                <a href="${session.url}" style="display:inline-block;background:#f97316;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                  Pay Now
                </a>
              </p>
              <p style="margin-top:20px;font-size:13px;color:#666;">
                Or copy this link into your browser:<br>
                <code style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:12px;">${session.url}</code>
              </p>
              <p style="color:#999;font-size:12px;">This link is powered by Stripe and secured with SSL. You can pay safely with any major credit or debit card.</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (emailErr) {
        console.error("[create-checkout-session] Email failed (non-fatal):", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        priceCents,
        applicationFeeAmount,
        emailSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("[create-checkout-session]", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
