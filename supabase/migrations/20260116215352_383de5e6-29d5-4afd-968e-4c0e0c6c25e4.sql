-- Fix order number generation to be concurrency-safe and remove duplicate triggers

-- 1) Replace generate_order_number() with an advisory-lock based implementation
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  today_count INTEGER;
  lock_key BIGINT;
BEGIN
  -- Serialize order_number generation per-day to avoid duplicate ORD-YYMMDD-### under concurrent inserts
  lock_key := hashtextextended(to_char(current_date, 'YYYY-MM-DD'), 0);
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT COUNT(*) + 1 INTO today_count
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;

  NEW.order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

-- 2) Ensure exactly one BEFORE INSERT trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'generate_order_number_trigger'
      AND tgrelid = 'public.orders'::regclass
      AND NOT tgisinternal
  ) THEN
    DROP TRIGGER generate_order_number_trigger ON public.orders;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_generate_order_number'
      AND tgrelid = 'public.orders'::regclass
      AND NOT tgisinternal
  ) THEN
    DROP TRIGGER trg_generate_order_number ON public.orders;
  END IF;

  CREATE TRIGGER trg_generate_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();
END;
$$;

-- 3) Ensure exactly one updated_at trigger exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_orders_updated_at'
      AND tgrelid = 'public.orders'::regclass
      AND NOT tgisinternal
  ) THEN
    DROP TRIGGER trg_orders_updated_at ON public.orders;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_orders_updated_at'
      AND tgrelid = 'public.orders'::regclass
      AND NOT tgisinternal
  ) THEN
    DROP TRIGGER update_orders_updated_at ON public.orders;
  END IF;

  CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
END;
$$;