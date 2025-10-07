import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  orderId: string;
}

interface OrderData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_company: string | null;
  total_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  customer_order_items: Array<{
    id: string;
    service_name: string;
    service_description: string | null;
    price: number;
    quantity: number;
  }>;
}

interface AgencySettings {
  agency_name: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string | null;
}

const generateInvoiceHTML = (order: OrderData, agency: AgencySettings, invoiceNumber: string) => {
  const invoiceDate = new Date().toLocaleDateString();
  const orderDate = new Date(order.created_at).toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { max-height: 60px; }
        .company-info { text-align: right; }
        .invoice-title { color: #f97316; font-size: 28px; font-weight: bold; margin: 0; }
        .invoice-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .billing-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .billing-section { flex: 1; }
        .billing-section h3 { color: #f97316; margin-bottom: 10px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .items-table th, .items-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .items-table th { background: #f8f9fa; font-weight: bold; color: #f97316; }
        .total-section { text-align: right; }
        .total-amount { font-size: 24px; font-weight: bold; color: #f97316; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
        .status-badge { 
          display: inline-block; 
          padding: 4px 12px; 
          border-radius: 20px; 
          font-size: 12px; 
          font-weight: bold; 
          text-transform: uppercase;
          background: #f97316;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          ${agency.logo_url ? `<img src="${agency.logo_url}" alt="${agency.agency_name}" class="logo">` : ''}
          <h1>${agency.agency_name}</h1>
        </div>
        <div class="company-info">
          <h2 class="invoice-title">INVOICE</h2>
          <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
          <p><strong>Date:</strong> ${invoiceDate}</p>
        </div>
      </div>

      <div class="invoice-details">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>Order ID:</strong> ${order.id.slice(0, 8).toUpperCase()}<br>
            <strong>Order Date:</strong> ${orderDate}
          </div>
          <div>
            <span class="status-badge">${order.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <div class="billing-info">
        <div class="billing-section">
          <h3>Bill To:</h3>
          <p>
            <strong>${order.customer_name}</strong><br>
            ${order.customer_company ? `${order.customer_company}<br>` : ''}
            ${order.customer_email}<br>
            ${order.customer_phone ? `${order.customer_phone}<br>` : ''}
          </p>
        </div>
        <div class="billing-section">
          <h3>From:</h3>
          <p>
            <strong>${agency.agency_name}</strong><br>
            ${agency.contact_email ? `${agency.contact_email}<br>` : ''}
            ${agency.contact_phone ? `${agency.contact_phone}<br>` : ''}
          </p>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${order.customer_order_items.map(item => `
            <tr>
              <td><strong>${item.service_name}</strong></td>
              <td>${item.service_description || '-'}</td>
              <td>${item.quantity}</td>
              <td>$${item.price.toFixed(2)}</td>
              <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <p><strong>Total Amount: <span class="total-amount">$${order.total_amount.toFixed(2)}</span></strong></p>
      </div>

      ${order.notes ? `
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h3 style="color: #f97316; margin-bottom: 10px;">Project Notes:</h3>
          <p>${order.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p><strong>Payment Instructions:</strong></p>
        <p>Please contact us at ${agency.contact_email || 'contact email'} to arrange payment for this invoice.</p>
        <p>Thank you for choosing ${agency.agency_name}!</p>
        <hr style="margin: 20px 0;">
        <p style="text-align: center; color: #999;">
          This invoice was generated automatically. If you have any questions, please contact us.
        </p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with the user's token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { orderId }: InvoiceEmailRequest = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Get the user's agency settings
    const { data: agencyData, error: agencyError } = await supabaseClient
      .from('agency_settings')
      .select('id, agency_name, contact_email, contact_phone, logo_url')
      .eq('user_id', user.id)
      .single();

    if (agencyError || !agencyData) {
      throw new Error("Agency settings not found");
    }

    // Get the order details with items
    const { data: orderData, error: orderError } = await supabaseClient
      .from('customer_orders')
      .select(`
        *,
        customer_order_items (
          id,
          service_name,
          service_description,
          price,
          quantity
        )
      `)
      .eq('id', orderId)
      .eq('agency_id', agencyData.id)
      .single();

    if (orderError || !orderData) {
      throw new Error("Order not found or access denied");
    }

    // Generate invoice number (using timestamp + order ID)
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${orderData.id.slice(0, 4).toUpperCase()}`;

    // Generate the invoice HTML
    const invoiceHTML = generateInvoiceHTML(orderData, agencyData, invoiceNumber);

    // Send the invoice email
    const emailResponse = await resend.emails.send({
      from: `${agencyData.agency_name} <onboarding@resend.dev>`,
      to: [orderData.customer_email],
      subject: `Invoice ${invoiceNumber} from ${agencyData.agency_name}`,
      html: invoiceHTML,
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invoice sent successfully",
        invoiceNumber,
        emailId: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error sending invoice:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Failed to send invoice" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);