-- Pending orders captured before Paystack redirect; only converted to real orders on successful payment
CREATE TABLE IF NOT EXISTS public.pending_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),

  -- Paystack fields
  reference text UNIQUE,
  customer_email text,
  amount numeric,
  currency text NOT NULL DEFAULT 'GHS',
  payment_channel text,

  -- Idempotency / linkage
  created_order_id uuid,
  created_order_number text,
  status text NOT NULL DEFAULT 'initiated',

  -- Full order payload (order fields + items) to be materialized on successful payment
  payload jsonb NOT NULL
);

ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;

-- Prevent reading pending orders from the client (contains PII + full cart)
DROP POLICY IF EXISTS "No direct select pending_orders" ON public.pending_orders;
CREATE POLICY "No direct select pending_orders"
ON public.pending_orders
FOR SELECT
USING (false);

-- Allow anyone to create a pending order (needed for public customer checkout)
DROP POLICY IF EXISTS "Anyone can create pending_orders" ON public.pending_orders;
CREATE POLICY "Anyone can create pending_orders"
ON public.pending_orders
FOR INSERT
WITH CHECK (true);

-- Disallow client-side updates/deletes
DROP POLICY IF EXISTS "No direct update pending_orders" ON public.pending_orders;
CREATE POLICY "No direct update pending_orders"
ON public.pending_orders
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "No direct delete pending_orders" ON public.pending_orders;
CREATE POLICY "No direct delete pending_orders"
ON public.pending_orders
FOR DELETE
USING (false);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_pending_orders_updated_at ON public.pending_orders;
CREATE TRIGGER update_pending_orders_updated_at
BEFORE UPDATE ON public.pending_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_pending_orders_reference ON public.pending_orders(reference);
CREATE INDEX IF NOT EXISTS idx_pending_orders_expires_at ON public.pending_orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_pending_orders_created_at ON public.pending_orders(created_at);