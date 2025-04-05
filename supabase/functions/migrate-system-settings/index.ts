
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

    // Check if the table has the new columns
    const { data: columnData, error: columnError } = await supabaseAdmin
      .rpc('check_column_exists', { 
        table_name: 'system_settings', 
        column_name: 'maintenance_announcement' 
      });

    if (columnError) {
      throw new Error(`Error checking columns: ${columnError.message}`);
    }

    // If the column doesn't exist, add it
    if (!columnData) {
      // Add new columns to system_settings table
      const { error: alterError } = await supabaseAdmin.query(`
        ALTER TABLE public.system_settings 
        ADD COLUMN IF NOT EXISTS maintenance_announcement TEXT,
        ADD COLUMN IF NOT EXISTS maintenance_announced_at TIMESTAMP WITH TIME ZONE;
      `);

      if (alterError) {
        throw new Error(`Error adding columns: ${alterError.message}`);
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'System settings table updated successfully'
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in migrate-system-settings function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 400, headers: corsHeaders }
    );
  }
});
