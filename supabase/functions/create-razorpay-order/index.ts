
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Missing Razorpay API keys');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { planId, planName, amount, currency, userId } = await req.json();

    if (!planId || !amount || !currency || !userId || !planName) {
      throw new Error('Missing required parameters');
    }

    // Get the user's email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      throw new Error('Failed to retrieve user data');
    }

    // Create a Razorpay order
    const orderData = {
      amount: amount * 100, // Razorpay expects amount in smallest currency unit (paise)
      currency: currency,
      receipt: `order_${Date.now()}`,
      notes: {
        userId: userId,
        planName: planName,
        planId: planId
      }
    };

    // Make request to Razorpay API
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${razorpayKeyId}:${razorpayKeySecret}`)
      },
      body: JSON.stringify(orderData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Razorpay error: ${data.error?.description || 'Failed to create order'}`);
    }

    console.log('Created Razorpay order:', data.id);

    return new Response(
      JSON.stringify({ 
        orderId: data.id,
        amount: data.amount / 100, // Convert back to rupees for display
        keyId: razorpayKeyId,
        currency: 'INR',
        userEmail: userData.user.email,
        userName: userData.user.user_metadata?.name || userData.user.email
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      }
    );
  }
});
