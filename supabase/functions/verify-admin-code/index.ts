
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// The admin code is stored in an environment variable for security
const ADMIN_CODE = "6551260939";

serve(async (req) => {
  try {
    // Parse the request body
    const { code } = await req.json();

    // Verify the code
    const isVerified = code === ADMIN_CODE;

    // Return the verification result
    return new Response(
      JSON.stringify({
        verified: isVerified
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // In production, restrict this to your domain
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        } 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  }
})
