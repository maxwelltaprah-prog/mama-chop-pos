-- Fix function search path issues for update_updated_at_column and generate_order_number
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO today_count
  FROM public.orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  NEW.order_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
  RETURN NEW;
END;
$$;