import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check=true";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Service-role client — no user JWT needed for webhook processing
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new Response("No stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[stripe-webhook] Signature verification failed:", err.message);
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
  }

  console.log(`[stripe-webhook] Processing event type=${event.type} id=${event.id}`);

  try {
    switch (event.type) {
      // ── Payment completed ──────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;

        if (!orderId) {
          console.warn("[stripe-webhook] checkout.session.completed: no order_id in metadata, skipping");
          break;
        }

        // Idempotency guard: skip if already paid
        const { data: order } = await supabase
          .from("customer_orders")
          .select("id, payment_status, customer_email, customer_name, agency_id")
          .eq("id", orderId)
          .maybeSingle();

        if (!order) {
          console.warn(`[stripe-webhook] Order ${orderId} not found`);
          break;
        }

        if (order.payment_status === "paid") {
          console.log(`[stripe-webhook] Order ${orderId} already paid — skipping`);
          break;
        }

        const { error: updateError } = await supabase
          .from("customer_orders")
          .update({ payment_status: "paid", status: "paid" })
          .eq("id", orderId);

        if (updateError) {
          console.error(`[stripe-webhook] Failed to update order ${orderId}:`, updateError);
          throw updateError;
        }

        console.log(`[stripe-webhook] ✓ Order ${orderId} marked as paid`);

        // Resolve the agency owner's user_id for the activity log
        // customer_orders.agency_id = agency_settings.id — look up the user_id
        const { data: agencyOwner } = await supabase
          .from("agency_settings")
          .select("user_id")
          .eq("id", order.agency_id)
          .maybeSingle();

        if (agencyOwner?.user_id) {
          const dollars = ((session.amount_total ?? 0) / 100).toFixed(2);
          await supabase.from("order_activity" as any).insert({
            order_id:       orderId,
            agency_user_id: agencyOwner.user_id,
            event_type:     "paid",
            description:    `Payment of $${dollars} received via Stripe`,
            metadata:       {
              stripe_session_id: session.id,
              amount_cents:      session.amount_total,
            },
          });
        }

        // Notify the agency via email
        await notifyAgencyOfPayment(order.agency_id, orderId, order.customer_name, session.amount_total ?? 0);
        break;
      }

      // ── Connected account onboarding status changed ────────────────────────
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        const stripeAccountId = account.id;
        const onboardingComplete = !!(account.charges_enabled && account.details_submitted);

        const { error: updateError } = await supabase
          .from("agency_settings")
          .update({ stripe_onboarding_complete: onboardingComplete })
          .eq("stripe_account_id", stripeAccountId);

        if (updateError) {
          console.error(`[stripe-webhook] Failed to update agency for account ${stripeAccountId}:`, updateError);
        } else {
          console.log(`[stripe-webhook] ✓ Agency onboarding synced for ${stripeAccountId} → complete=${onboardingComplete}`);
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err: any) {
    console.error(`[stripe-webhook] Error processing ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying on application errors
    return new Response(JSON.stringify({ received: true, error: err.message }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

async function notifyAgencyOfPayment(
  agencyId: string,
  orderId: string,
  customerName: string,
  amountTotal: number
) {
  try {
    const { data: agency } = await supabase
      .from("agency_settings")
      .select("agency_name, contact_email")
      .eq("id", agencyId)
      .maybeSingle();

    if (!agency?.contact_email) return;

    const dollars = (amountTotal / 100).toFixed(2);

    await resend.emails.send({
      from: "Cretivo Payments <onboarding@resend.dev>",
      to: [agency.contact_email],
      subject: `💰 Payment received — $${dollars} from ${customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f97316;">Payment Received</h2>
          <p>Great news! <strong>${customerName}</strong> has paid their invoice.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Order ID</td>
              <td style="padding: 8px 0; font-weight: bold;">${orderId.slice(0, 8).toUpperCase()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Amount paid</td>
              <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">$${dollars}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Platform fee (10%)</td>
              <td style="padding: 8px 0;">$${(amountTotal * 0.10 / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Net to your account</td>
              <td style="padding: 8px 0; font-weight: bold;">$${(amountTotal * 0.90 / 100).toFixed(2)}</td>
            </tr>
          </table>
          <p style="color: #666; font-size: 14px;">Log in to your Cretivo dashboard to manage this order.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">Cretivo Platform · Payments powered by Stripe</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[stripe-webhook] Agency notification email failed:", err);
  }
}
