import { serve } from "@supabase/functions";
import { createClient } from "@supabase/supabase-js";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 401,
      });
    }

    if (req.method === "POST") {
      const { prescription_number, patient_id, doctor_name, user_id, timestamp } = await req.json();

      const { data, error } = await supabaseClient
        .from("prescriptions")
        .insert({
          prescription_number,
          patient_id,
          doctor_name,
          user_id,
          timestamp,
        })
        .select();

      if (error) {
        console.error("Error inserting prescription:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        });
      }

      return new Response(JSON.stringify(data[0]), {
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