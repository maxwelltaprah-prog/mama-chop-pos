-- Fix orders table: Remove public access to customer data
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;

CREATE POLICY "Staff can view all orders" 
ON public.orders 
FOR SELECT 
USING (has_any_role(auth.uid()));

-- Fix order_items table: Remove unrestricted public read access
DROP POLICY IF EXISTS "Anyone can view order items" ON public.order_items;

CREATE POLICY "Staff can view order items" 
ON public.order_items 
FOR SELECT 
USING (has_any_role(auth.uid()));