
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

      // Mark feedback as unread to display it prominently in the admin panel
      await supabase
        .from("feedback")
        .update({ is_read: false })
        .eq("id", record.id);

      // For now, we're just logging the feedback and storing it in the database
      // It can be accessed through an admin panel in your application

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
