-- Tighten overly permissive INSERT policies while keeping public ordering working

-- orders: public insert allowed only for known order types and safe defaults
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  order_type IN ('dine-in', 'takeaway', 'delivery')
  AND status = 'pending'
  AND payment_status IN ('pending', 'paid')
);

-- order_items: public insert allowed only when the order exists
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;
CREATE POLICY "Public can create order items"
ON public.order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = order_id
  )
);
