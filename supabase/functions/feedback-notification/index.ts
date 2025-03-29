
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Resend client for email notifications
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const resend = new Resend(resendApiKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { record, type } = await req.json();
    console.log("Webhook received:", { type, record });

    if (type === "INSERT" && record && record.id) {
      // A new feedback has been inserted
      const { data: feedback, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("id", record.id)
        .single();

      if (error) {
        throw error;
      }

      console.log("New feedback received:", feedback);

      // Send email notification
      if (resendApiKey) {
        try {
          const emailResult = await sendEmailNotification(feedback);
          console.log("Email notification sent:", emailResult);
        } catch (emailError) {
          console.error("Failed to send email notification:", emailError);
          // Continue execution even if email fails
        }
      } else {
        console.log("Resend API key not configured. Skipping email notification.");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Feedback notification processed",
          feedback,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Webhook processed but no action taken",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
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
});

/**
 * Send an email notification for new feedback
 */
async function sendEmailNotification(feedback) {
  if (!resendApiKey) {
    return { skipped: true, reason: "No API key configured" };
  }

  const { email, message, created_at } = feedback;
  const date = new Date(created_at).toLocaleString();
  
  return await resend.emails.send({
    from: "Feedback Notification <onboarding@resend.dev>",
    to: ["admin@yourdomain.com"], // Replace with your actual email
    subject: "New Website Feedback Received",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
        <h2 style="color: #333; border-bottom: 1px solid #e9e9e9; padding-bottom: 10px;">New Feedback Submitted</h2>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>From:</strong> ${email || "No email provided"}</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px; border-left: 4px solid #4a90e2;">
          <p style="margin: 0;"><strong>Message:</strong></p>
          <p style="margin: 10px 0 0 0;">${message}</p>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          This is an automated notification from your website feedback system.
        </p>
      </div>
    `,
  });
}
