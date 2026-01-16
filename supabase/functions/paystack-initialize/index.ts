import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaystackInitRequest {
  email: string;
  amount: number; // Amount in GHS (will be converted to pesewas)
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  paymentChannel?: 'mobile_money' | 'card';
  mobileMoneyProvider?: 'mtn' | 'vod' | 'tgo'; // MTN, Vodafone, AirtelTigo
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    if (!PAYSTACK_SECRET_KEY) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      throw new Error('Payment gateway not configured');
    }

    const body: PaystackInitRequest = await req.json();
    console.log('Initializing Paystack payment:', { 
      orderNumber: body.orderNumber, 
      amount: body.amount,
      channel: body.paymentChannel 
    });

    // Validate required fields
    if (!body.email || !body.amount || !body.orderNumber) {
      throw new Error('Missing required fields: email, amount, orderNumber');
    }

    // Convert GHS to pesewas (Paystack requires amount in lowest currency unit)
    const amountInPesewas = Math.round(body.amount * 100);

    // Build Paystack payload
    const paystackPayload: Record<string, any> = {
      email: body.email,
      amount: amountInPesewas,
      currency: 'GHS',
      reference: `EK-${body.orderNumber}-${Date.now()}`,
      callback_url: `${req.headers.get('origin') || 'https://eidikoskouzina.com'}/order?payment=success`,
      metadata: {
        order_number: body.orderNumber,
        customer_name: body.customerName || '',
        customer_phone: body.customerPhone || '',
        custom_fields: [
          {
            display_name: "Order Number",
            variable_name: "order_number",
            value: body.orderNumber
          }
        ]
      }
    };

    // Add mobile money specific channels if requested
    if (body.paymentChannel === 'mobile_money') {
      paystackPayload.channels = ['mobile_money'];
      
      // Add mobile money provider if specified
      if (body.mobileMoneyProvider && body.customerPhone) {
        paystackPayload.mobile_money = {
          phone: body.customerPhone,
          provider: body.mobileMoneyProvider
        };
      }
    }

    console.log('Sending to Paystack:', JSON.stringify(paystackPayload, null, 2));

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    });

    const data = await response.json();
    console.log('Paystack response:', JSON.stringify(data, null, 2));

    if (!data.status) {
      console.error('Paystack error:', data.message);
      throw new Error(data.message || 'Failed to initialize payment');
    }

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Payment initialization failed';
    console.error('Payment initialization error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
