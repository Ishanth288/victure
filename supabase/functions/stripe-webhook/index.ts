
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";
import Stripe from "https://esm.sh/stripe@12.18.0";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error('Missing Stripe configuration');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'No signature provided' }), { status: 400 });
    }

    // Get the raw body
    const body = await req.text();

    // Verify and construct the event
    const event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const planName = session.metadata?.planName;

      if (!userId || !planName) {
        throw new Error('Missing userId or planName in session');
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
