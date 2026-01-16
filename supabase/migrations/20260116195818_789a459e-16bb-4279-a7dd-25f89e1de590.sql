-- Update payment method check constraint to include 'card' and 'momo'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method = ANY (ARRAY['cash', 'card', 'momo', 'mtn-momo', 'vodafone-cash', 'airteltigo']));