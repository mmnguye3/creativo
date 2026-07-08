import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Contact form submission received");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const formData: ContactFormData = await req.json();
    console.log("Form data received:", { ...formData, message: "[REDACTED]" });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store form submission in database
    const { data: submission, error: dbError } = await supabase
      .from("contact_submissions")
      .insert({
        name: formData.name,
        email: formData.email,
        company: formData.company || null,
        subject: formData.subject,
        message: formData.message,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save form submission");
    }

    console.log("Form submission saved to database");

    // Initialize Resend
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "Cretivo <onboarding@resend.dev>",
      to: [formData.email],
      subject: "Thank you for contacting us!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; margin-bottom: 20px;">Thank You for Reaching Out!</h1>
          
          <p style="color: #666; line-height: 1.6;">Dear ${formData.name},</p>
          
          <p style="color: #666; line-height: 1.6;">
            Thank you for contacting Cretivo. We have received your message and will get back to you within 24 hours.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Message Details:</h3>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${formData.subject}</p>
            ${formData.company ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${formData.company}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Message:</strong></p>
            <p style="color: #666; white-space: pre-wrap;">${formData.message}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            In the meantime, feel free to explore our services and recent work on our website.
          </p>
          
          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            The Cretivo Team
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px;">
            This is an automated confirmation email. Please do not reply to this message.
          </p>
        </div>
      `,
    });

    // Send notification email to support team
    const supportEmailResponse = await resend.emails.send({
      from: "Website Contact Form <onboarding@resend.dev>",
      to: ["support@cretivo.io"],
      subject: `New Contact Form Submission: ${formData.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h1>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Contact Details:</h3>
            <p style="margin: 5px 0;"><strong>Name:</strong> ${formData.name}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${formData.email}">${formData.email}</a></p>
            ${formData.company ? `<p style="margin: 5px 0;"><strong>Company:</strong> ${formData.company}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${formData.subject}</p>
            <p style="margin: 5px 0;"><strong>Submission ID:</strong> ${submission.id}</p>
            <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date(submission.created_at).toLocaleString()}</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="color: #666; white-space: pre-wrap; line-height: 1.6;">${formData.message}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-top: 20px;">
            Please respond to this inquiry within 24 hours to maintain our service standards.
          </p>
        </div>
      `,
    });

    console.log("Emails sent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Form submitted successfully",
        submissionId: submission.id,
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
    console.error("Error in submit-contact-form function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);