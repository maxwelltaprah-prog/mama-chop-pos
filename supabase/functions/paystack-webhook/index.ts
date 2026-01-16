import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

function paymentMethodFromChannel(channel: string | null | undefined): string {
  if (channel === "card") return "card";
  if (channel === "mobile_money") return "mtn-momo";
  return "card";
}

function serverOrderNumberFallback(pendingId: string) {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
  return `ORD-${dateStr}-${pendingId.slice(0, 8).toUpperCase()}`;
}

async function materializeOrderFromPending(params: {
  supabase: any;
  pendingOrderId: string;
  reference: string;
  channel: string | null | undefined;
}) {
  const { supabase, pendingOrderId, reference, channel } = params;

  const { data: pending, error: pendingErr } = await supabase
    .from("pending_orders")
    .select("id, payload, created_order_id, created_order_number")
    .eq("id", pendingOrderId)
    .maybeSingle();

  if (pendingErr) throw pendingErr;
  if (!pending) throw new Error("Pending order not found");

  if (pending.created_order_number) {
    return { order_number: pending.created_order_number, order_id: pending.created_order_id };
  }

  const payload = pending.payload as any;
  const order = payload?.order;
  const items = (payload?.items ?? []) as any[];
  if (!order || !Array.isArray(items)) throw new Error("Invalid pending order payload");

  const payment_method = paymentMethodFromChannel(channel);

  const { data: createdOrder, error: createOrderErr } = await supabase
    .from("orders")
    .insert({
      ...order,
      order_number: serverOrderNumberFallback(pendingOrderId),
      created_by: null,
      payment_status: "paid",
      payment_method,
      status: order.status ?? "pending",
    })
    .select("id, order_number")
    .single();

  if (createOrderErr) throw createOrderErr;

  if (items.length > 0) {
    const orderItems = items.map((it) => ({ ...it, order_id: createdOrder.id }));
    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) throw itemsErr;
  }

  await supabase
    .from("pending_orders")
    .update({
      reference,
      created_order_id: createdOrder.id,
      created_order_number: createdOrder.order_number,
      status: "completed",
    })
    .eq("id", pendingOrderId);

  return { order_number: createdOrder.order_number, order_id: createdOrder.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const secretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hash = createHmac("sha512", secretKey).update(body).digest("hex");
    if (hash !== signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: any = createClient(supabaseUrl, supabaseServiceKey);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const orderNumber = data.metadata?.order_number ?? null;
      const pendingOrderId = data.metadata?.pending_order_id ?? null;

      if (pendingOrderId) {
        await materializeOrderFromPending({
          supabase,
          pendingOrderId,
          reference,
          channel: data.channel,
        });
      } else if (orderNumber) {
        const payment_method = paymentMethodFromChannel(data.channel);
        await supabase
          .from("orders")
          .update({ payment_status: "paid", payment_method })
          .eq("order_number", orderNumber);
      }
    }

    if (event.event === "charge.failed") {
      const data = event.data;
      const reference = data.reference;
      const pendingOrderId = data.metadata?.pending_order_id ?? null;

      if (pendingOrderId) {
        await supabase.from("pending_orders").update({ reference, status: "failed" }).eq("id", pendingOrderId);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    // Return 200 even on error to prevent retries
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
