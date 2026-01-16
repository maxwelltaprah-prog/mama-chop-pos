import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const secretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('Missing Paystack signature');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the signature
    const hash = createHmac('sha512', secretKey)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('Invalid Paystack signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the event
    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event);

    // Initialize Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const data = event.data;
      const reference = data.reference;
      const orderNumber = data.metadata?.order_number;

      console.log('Processing successful payment:', { reference, orderNumber, amount: data.amount });

      if (orderNumber) {
        // Update order payment status
        const { data: updatedOrder, error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            payment_method: data.channel === 'mobile_money' ? 'momo' : data.channel
          })
          .eq('order_number', orderNumber)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating order:', updateError);
          // Still return 200 to acknowledge receipt
        } else {
          console.log('Order updated successfully:', updatedOrder?.id);
        }
      } else {
        console.warn('No order_number in metadata, trying reference lookup');
        // Try to find order by matching reference pattern
      }
    }

    // Handle other events if needed
    if (event.event === 'charge.failed') {
      const data = event.data;
      const orderNumber = data.metadata?.order_number;
      
      console.log('Payment failed:', { orderNumber, reason: data.gateway_response });

      if (orderNumber) {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('order_number', orderNumber);
      }
    }

    // Always return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    // Return 200 even on error to prevent Paystack from retrying
    return new Response(
      JSON.stringify({ received: true, error: 'Processing error' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
