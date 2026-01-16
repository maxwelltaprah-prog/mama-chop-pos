-- Tighten pending_orders INSERT policy to avoid permissive (true) check

-- Ensure created_at/updated_at/expires_at are server-controlled
CREATE OR REPLACE FUNCTION public.pending_orders_set_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_at := now();
  NEW.updated_at := now();
  NEW.expires_at := now() + interval '2 hours';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_pending_orders_defaults ON public.pending_orders;
CREATE TRIGGER set_pending_orders_defaults
BEFORE INSERT ON public.pending_orders
FOR EACH ROW
EXECUTE FUNCTION public.pending_orders_set_defaults();

-- Replace overly-permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can create pending_orders" ON public.pending_orders;
CREATE POLICY "Anyone can create pending_orders"
ON public.pending_orders
FOR INSERT
WITH CHECK (
  payload IS NOT NULL
  AND jsonb_typeof(payload) = 'object'
  AND expires_at > created_at
  AND expires_at <= created_at + interval '2 hours'
);