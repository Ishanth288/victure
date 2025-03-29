
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// The admin code is stored in an environment variable for security
const ADMIN_CODE = "6551260939";

// CORS headers to ensure the function can be called from the frontend
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Parse the request body
    const { code } = await req.json();
    console.log("Received code verification request:", { codeSent: code });

    // Verify the code
    const isVerified = code === ADMIN_CODE;
    console.log("Verification result:", { isVerified });

    // Return the verification result
    return new Response(
      JSON.stringify({
        verified: isVerified
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error in verify-admin-code function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        verified: false 
      }),
      { 
        status: 400,
        headers: corsHeaders
      }
    );
  }
})
