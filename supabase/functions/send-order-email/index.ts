// send-order-email
// Handles the "Order Received" transactional email sent to the customer
// immediately after they submit a request on a white-label agency site.
//
// No user auth required — called from the public white-label OrderForm.
// Uses service-role key server-side to fetch order + agency branding.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  sendAgencyEmail,
  buildOrderReceivedBody,
} from "../_shared/agencyOrderEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Service-role client — used only to READ data, not mutate
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, orderId } = (await req.json()) as {
      action: string;
      orderId: string;
    };

    if (!orderId) throw new Error("orderId is required");
    if (action !== "order_received") throw new Error(`Unknown action: ${action}`);

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("customer_orders")
      .select(`
        id, customer_name, customer_email, notes, agency_id,
        customer_order_items (service_name, quantity, price)
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      throw new Error(`Order not found: ${orderErr?.message ?? "no data"}`);
    }

    // Fetch agency branding via agency_id (= agency_settings.id)
    const { data: agency, error: agencyErr } = await supabase
      .from("agency_settings")
      .select("agency_name, logo_url, primary_color, contact_email")
      .eq("id", order.agency_id)
      .maybeSingle();

    if (agencyErr || !agency) {
      throw new Error(`Agency not found: ${agencyErr?.message ?? "no data"}`);
    }

    const orderRef = order.id.slice(0, 8).toUpperCase();
    const items = (order as any).customer_order_items ?? [];

    const bodyHtml = buildOrderReceivedBody({
      customerName: order.customer_name,
      orderRef,
      items,
      notes: order.notes,
      contactEmail: agency.contact_email,
      agencyName: agency.agency_name,
    });

    const result = await sendAgencyEmail({
      resendApiKey: Deno.env.get("RESEND_API_KEY") ?? "",
      brand: agency,
      to: order.customer_email,
      subject: `We've received your order, ${order.customer_name}! (#${orderRef})`,
      bodyHtml,
    });

    if (!result.ok) {
      console.error("[send-order-email] Resend error:", result.error);
      // Non-fatal: order is already saved, email failure shouldn't block UX
    } else {
      console.log(`[send-order-email] ✓ order_received sent to ${order.customer_email}`);
    }

    return new Response(
      JSON.stringify({ success: true, emailSent: result.ok }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err: any) {
    console.error("[send-order-email]", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
