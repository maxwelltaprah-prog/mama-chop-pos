import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function paymentMethodFromChannel(channel: string | null | undefined): string {
  // Values must match DB constraint
  if (channel === "card") return "card";
  if (channel === "mobile_money") return "mtn-momo";
  return "card";
}

function getServiceClient(): any {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
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

  // Idempotent: if already created, just return
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

  const { error: updErr } = await supabase
    .from("pending_orders")
    .update({
      reference,
      created_order_id: createdOrder.id,
      created_order_number: createdOrder.order_number,
      status: "completed",
    })
    .eq("id", pendingOrderId);

  if (updErr) console.error("Failed to update pending order", updErr);

  return { order_number: createdOrder.order_number, order_id: createdOrder.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!PAYSTACK_SECRET_KEY) throw new Error("Payment gateway not configured");

    const { reference } = await req.json();
    if (!reference) throw new Error("Payment reference is required");

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (!data.status) throw new Error(data.message || "Verification failed");

    const transaction = data.data;
    const isSuccessful = transaction.status === "success";

    let orderNumber = transaction.metadata?.order_number ?? null;
    const pendingOrderId = transaction.metadata?.pending_order_id ?? null;

    const supabase = getServiceClient();

    if (isSuccessful && supabase) {
      if (pendingOrderId) {
        const created = await materializeOrderFromPending({
          supabase,
          pendingOrderId,
          reference,
          channel: transaction.channel,
        });
        orderNumber = created.order_number;
      } else if (orderNumber) {
        const payment_method = paymentMethodFromChannel(transaction.channel);
        await supabase
          .from("orders")
          .update({ payment_status: "paid", payment_method })
          .eq("order_number", orderNumber);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: isSuccessful,
        transaction: {
          reference: transaction.reference,
          amount: transaction.amount / 100,
          currency: transaction.currency,
          status: transaction.status,
          channel: transaction.channel,
          paid_at: transaction.paid_at,
          customer_email: transaction.customer?.email,
          order_number: orderNumber,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Payment verification failed";
    return new Response(
      JSON.stringify({ success: false, verified: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
