import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePendingOrderRequest {
  customerEmail: string;
  amount: number;
  paymentChannel: "mobile_money" | "card";
  payload: Record<string, unknown>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing backend env vars", {
        hasUrl: Boolean(supabaseUrl),
        hasServiceRole: Boolean(serviceRoleKey),
      });
      return new Response(JSON.stringify({ error: "Backend not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Partial<CreatePendingOrderRequest>;

    if (!body.customerEmail || !String(body.customerEmail).includes("@")) {
      return new Response(JSON.stringify({ error: "Invalid customerEmail" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.paymentChannel !== "mobile_money" && body.paymentChannel !== "card") {
      return new Response(JSON.stringify({ error: "Invalid paymentChannel" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabaseAdmin
      .from("pending_orders")
      .insert({
        payload: body.payload,
        customer_email: body.customerEmail,
        amount: body.amount,
        payment_channel: body.paymentChannel,
      })
      .select("id")
      .single();

    if (error) {
      console.error("create-pending-order insert error", {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
      });
      return new Response(JSON.stringify({ error: error.message, code: (error as any).code }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, pendingOrderId: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-pending-order error", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
