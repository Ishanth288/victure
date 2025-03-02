
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.2.1";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const configuration = new Configuration({ apiKey: openaiApiKey });
const openai = new OpenAIApi(configuration);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    console.log("Received question:", message);

    // First check if we have an answer in our knowledge base
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from("pharmacy_knowledge")
      .select("answer")
      .ilike("question", `%${message}%`)
      .limit(1);

    console.log("Knowledge base search result:", knowledgeData);

    if (knowledgeError) {
      console.error("Error querying knowledge base:", knowledgeError);
    }

    // If we found an answer in our knowledge base, return it
    if (knowledgeData && knowledgeData.length > 0) {
      return new Response(
        JSON.stringify({ text: knowledgeData[0].answer, source: "database" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no answer in knowledge base, use OpenAI
    console.log("No answer found in knowledge base, querying OpenAI...");
    const openaiResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `You are Victure AI, a helpful assistant for pharmacy management. Answer the following question about pharmacy management, medications, or healthcare:\n\nQuestion: ${message}\n\nAnswer:`,
      max_tokens: 150,
      temperature: 0.7,
    });

    const aiAnswer = openaiResponse.data.choices[0].text.trim();
    console.log("OpenAI response:", aiAnswer);

    return new Response(
      JSON.stringify({ text: aiAnswer, source: "openai" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
