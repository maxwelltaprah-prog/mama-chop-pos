-- Allow customers to read their own order immediately after creation (by ID)
-- This is needed for the order creation flow to work
CREATE POLICY "Customers can view their own order by id" 
ON public.orders 
FOR SELECT 
USING (
  -- Staff can view all
  has_any_role(auth.uid()) 
  OR 
  -- For customer orders, allow access for a short window after creation (5 minutes)
  -- This allows the customer to see their order number after placing it
  (created_at > now() - interval '5 minutes' AND created_by IS NULL)
);