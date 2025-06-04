
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { 
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
        auth: { persistSession: false }
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 401,
      });
    }

    if (req.method === "POST") {
      const { prescription_number, patient_id, doctor_name, user_id, timestamp } = await req.json();

      console.log("Creating prescription with data:", { prescription_number, patient_id, doctor_name, user_id });

      // Check if prescription number already exists for this user
      const { data: existingPrescription, error: checkError } = await supabaseClient
        .from("prescriptions")
        .select("id")
        .eq("prescription_number", prescription_number)
        .eq("user_id", user_id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing prescription:", checkError);
        return new Response(JSON.stringify({ error: checkError.message }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        });
      }

      if (existingPrescription) {
        console.log("Prescription number already exists, returning existing prescription");
        return new Response(JSON.stringify(existingPrescription), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 200,
        });
      }

      // Create new prescription
      const { data, error } = await supabaseClient
        .from("prescriptions")
        .insert({
          prescription_number,
          patient_id,
          doctor_name,
          user_id,
          date: timestamp || new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting prescription:", error);
        // If it's a unique constraint violation, try to fetch the existing record
        if (error.code === '23505') {
          const { data: existing } = await supabaseClient
            .from("prescriptions")
            .select("*")
            .eq("prescription_number", prescription_number)
            .eq("user_id", user_id)
            .single();
          
          if (existing) {
            return new Response(JSON.stringify(existing), {
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
              status: 200,
            });
          }
        }
        
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        });
      }

      console.log("Successfully created prescription:", data);
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 201,
      });
    }

    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 405,
    });
  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 500,
    });
  }
});
