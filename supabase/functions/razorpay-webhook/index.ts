
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const razorpayWebhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';

    if (!razorpayWebhookSecret) {
      throw new Error('Missing Razorpay webhook secret');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body and headers
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature provided' }), { status: 400 });
    }

    // Verify the webhook signature
    const hmac = createHmac("sha256", razorpayWebhookSecret);
    hmac.update(body);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature !== signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    // Parse the webhook payload
    const payload = JSON.parse(body);
    console.log(`Processing Razorpay webhook: ${payload.event}`);

    // Handle payment success events
    if (payload.event === 'payment.captured' || payload.event === 'payment.authorized') {
      const paymentEntity = payload.payload.payment.entity;
      const orderId = paymentEntity.order_id;
      
      // Fetch the order to get the metadata
      const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
        headers: {
          'Authorization': 'Basic ' + btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_KEY_SECRET')}`)
        }
      });
      
      const orderData = await response.json();
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${orderData.error?.description || 'Unknown error'}`);
      }
      
      const userId = orderData.notes.userId;
      const planName = orderData.notes.planName;
      
      if (!userId || !planName) {
        throw new Error('Missing user ID or plan name in order notes');
      }
      
      console.log(`User ${userId} subscribed to plan ${planName}`);
      
      // Update the user's profile with the new plan
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan_type: planName,
          // Reset trial expiration date for paid plans
          trial_expiration_date: planName !== 'Free Trial' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log(`Successfully updated profile for user ${userId} to plan ${planName}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
});
