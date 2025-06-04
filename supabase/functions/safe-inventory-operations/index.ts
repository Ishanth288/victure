import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { operation, payload } = await req.json()

    switch (operation) {
      case 'delete_inventory_item_safe':
        return await handleSafeInventoryDeletion(supabaseClient, payload)
      
      case 'update_inventory_quantity_safe':
        return await handleSafeInventoryUpdate(supabaseClient, payload)
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleSafeInventoryDeletion(supabaseClient: any, payload: any) {
  const { item_id, requesting_user_id } = payload

  if (!item_id || !requesting_user_id) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Missing required parameters: item_id and requesting_user_id' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Start a transaction by using a single RPC call
    const { data: result, error } = await supabaseClient.rpc('delete_inventory_item_atomic', {
      p_item_id: item_id,
      p_user_id: requesting_user_id
    })

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: error.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Item deleted successfully',
        result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Deletion error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to delete inventory item safely' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleSafeInventoryUpdate(supabaseClient: any, payload: any) {
  const { updates, conditions } = payload

  if (!updates || !conditions) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Missing required parameters: updates and conditions' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Use an atomic update function
    const { data: result, error } = await supabaseClient.rpc('update_inventory_atomic', {
      p_updates: updates,
      p_conditions: conditions
    })

    if (error) {
      console.error('Update error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: error.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Inventory updated successfully',
        result 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Update error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to update inventory safely' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
} 