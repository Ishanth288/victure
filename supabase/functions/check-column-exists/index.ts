
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { table_name, column_name } = await req.json();

    if (!table_name || !column_name) {
      throw new Error('Table name and column name are required');
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if the column exists
    const { data, error } = await supabaseAdmin.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = '${table_name}'
        AND column_name = '${column_name}'
      );
    `);

    if (error) {
      throw new Error(`Error checking column existence: ${error.message}`);
    }

    // Return true if the column exists, false otherwise
    return new Response(
      JSON.stringify({ 
        success: true, 
        exists: data[0].exists 
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in check-column-exists function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 400, headers: corsHeaders }
    );
  }
});
