import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Payment gateway not configured');
    }

    const { reference } = await req.json();
    
    if (!reference) {
      throw new Error('Payment reference is required');
    }

    console.log('Verifying Paystack payment:', reference);

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Paystack verification response:', JSON.stringify(data, null, 2));

    if (!data.status) {
      throw new Error(data.message || 'Verification failed');
    }

    const transaction = data.data;
    const isSuccessful = transaction.status === 'success';
    
    // Get order number from metadata (most reliable) or extract from reference
    let orderNumber = transaction.metadata?.order_number;
    
    // Fallback: Extract order number from reference (format: EK-{orderNumber}-{timestamp})
    // Order number format is ORD-YYMMDD-XXX
    if (!orderNumber) {
      const orderNumberMatch = reference.match(/^EK-(ORD-\d{6}-\d+)-/);
      orderNumber = orderNumberMatch ? orderNumberMatch[1] : null;
    }

    console.log('Transaction status:', transaction.status, 'Order:', orderNumber);

    // Update order payment status in database if successful
    if (isSuccessful && orderNumber && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Determine payment method from channel
      let paymentMethod = 'online';
      if (transaction.channel === 'mobile_money') {
        paymentMethod = 'momo';
      } else if (transaction.channel === 'card') {
        paymentMethod = 'card';
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid',
          payment_method: paymentMethod,
        })
        .eq('order_number', orderNumber);

      if (updateError) {
        console.error('Failed to update order:', updateError);
      } else {
        console.log('Order updated successfully:', orderNumber);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: isSuccessful,
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount / 100, // Convert pesewas to GHS
          currency: transaction.currency,
          status: transaction.status,
          channel: transaction.channel,
          paid_at: transaction.paid_at,
          customer_email: transaction.customer?.email,
          order_number: orderNumber,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payment verification failed';
    console.error('Payment verification error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        verified: false,
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
