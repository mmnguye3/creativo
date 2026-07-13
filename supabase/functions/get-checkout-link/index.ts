// get-checkout-link
// Returns a valid Stripe Checkout URL for an order.
// If the stored session is still open, returns its URL directly.
// If expired or missing, creates a fresh session (same price / 10% fee).
// Optionally emails the link to the customer.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check=true";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_FEE_RATE = 0.10;

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

    const { orderId, sendEmail = false } = await req.json() as {
      orderId: string;
      sendEmail?: boolean;
    };

    if (!orderId) throw new Error("orderId is required");

    // Verify order belongs to this agency
    const { data: order, error: orderError } = await supabase
      .from("customer_orders")
      .select("id, customer_name, customer_email, stripe_session_id, price_cents, status, payment_status")
      .eq("id", orderId)
      .eq("agency_id", user.id)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) throw new Error("Order not found or access denied");
    if (order.payment_status === "paid") {
      return new Response(
        JSON.stringify({ success: true, paid: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Load agency Stripe info
    const { data: agency, error: agencyError } = await supabase
      .from("agency_settings")
      .select("id, agency_name, stripe_account_id, stripe_onboarding_complete, contact_email")
      .eq("user_id", user.id)
      .maybeSingle();

    if (agencyError) throw agencyError;
    if (!agency) throw new Error("Agency settings not found");
    if (!agency.stripe_account_id || !agency.stripe_onboarding_complete) {
      throw new Error("Stripe account not fully set up. Complete onboarding in Settings first.");
    }

    let checkoutUrl: string | null = null;
    let sessionId: string | null = order.stripe_session_id;
    let isNew = false;

    // Try to reuse existing open session
    if (sessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.status === "open" && session.url) {
          checkoutUrl = session.url;
        }
        // status === 'complete' means paid — shouldn't happen since we checked payment_status above
        // status === 'expired' means we need a new one
      } catch {
        // Session ID not found in Stripe (wrong env, etc.) — create new
        sessionId = null;
      }
    }

    // Create fresh session if needed
    if (!checkoutUrl) {
      if (!order.price_cents || order.price_cents < 50) {
        throw new Error("No price set for this order. Set a quote before sending a payment link.");
      }

      const origin = req.headers.get("origin") ?? "https://cretivo.io";
      const applicationFeeAmount = Math.round(order.price_cents * PLATFORM_FEE_RATE);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: order.customer_email,
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: {
              name: `${agency.agency_name} — Services`,
              description: `Order ${orderId.slice(0, 8).toUpperCase()}`,
            },
            unit_amount: order.price_cents,
          },
          quantity: 1,
        }],
        payment_intent_data: {
          application_fee_amount: applicationFeeAmount,
          transfer_data: { destination: agency.stripe_account_id },
          metadata: { order_id: orderId, agency_id: agency.id },
        },
        success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard?payment=cancelled`,
        metadata: { order_id: orderId, agency_id: agency.id },
      });

      checkoutUrl = session.url!;
      sessionId = session.id;
      isNew = true;

      // Persist new session ID and mark status
      await supabase
        .from("customer_orders")
        .update({ stripe_session_id: sessionId, status: "awaiting_payment", payment_status: "awaiting_payment" })
        .eq("id", orderId);
    }

    // Optionally email the link to the customer
    let emailSent = false;
    if (sendEmail && checkoutUrl) {
      try {
        const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
        const dollars = ((order.price_cents ?? 0) / 100).toFixed(2);
        const emailResult = await resend.emails.send({
          from: `${agency.agency_name} <invoices@cretivo.io>`,
          to: [order.customer_email],
          reply_to: agency.contact_email || undefined,
          subject: `Payment link from ${agency.agency_name} — $${dollars}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
              <div style="border-bottom:2px solid #f97316;padding-bottom:16px;margin-bottom:24px;">
                <h2 style="color:#f97316;margin:0;">Payment Request</h2>
              </div>
              <p>Hi ${order.customer_name},</p>
              <p><strong>${agency.agency_name}</strong> has sent you a secure payment link for your order.</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8f9fa;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 16px;color:#666;font-size:14px;">Order reference</td>
                  <td style="padding:12px 16px;font-weight:bold;font-size:14px;">#${orderId.slice(0, 8).toUpperCase()}</td>
                </tr>
                <tr style="border-top:1px solid #e9ecef;">
                  <td style="padding:12px 16px;color:#666;font-size:14px;">Amount due</td>
                  <td style="padding:12px 16px;font-weight:bold;font-size:18px;color:#16a34a;">$${dollars}</td>
                </tr>
              </table>
              <p style="text-align:center;margin:32px 0;">
                <a href="${checkoutUrl}" style="display:inline-block;background:#f97316;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">
                  Pay Now →
                </a>
              </p>
              <p style="font-size:12px;color:#888;margin-top:24px;padding-top:16px;border-top:1px solid #eee;">
                Or copy this link into your browser:<br>
                <span style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:11px;word-break:break-all;">${checkoutUrl}</span>
              </p>
              <p style="font-size:11px;color:#aaa;">Powered by Stripe · SSL secured · Your payment details are never stored by ${agency.agency_name}</p>
            </div>
          `,
        });
        if (!emailResult.error) emailSent = true;
        else console.error("[get-checkout-link] Resend error:", emailResult.error);
      } catch (emailErr) {
        console.error("[get-checkout-link] Email failed (non-fatal):", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, checkoutUrl, sessionId, isNew, emailSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("[get-checkout-link]", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message ?? "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
