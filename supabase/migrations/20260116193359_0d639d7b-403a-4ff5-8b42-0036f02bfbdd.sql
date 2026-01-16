-- Drop the conflicting policies and create a single comprehensive one
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their own order by id" ON public.orders;

-- Create a single policy that handles both cases
CREATE POLICY "Orders read access" 
ON public.orders 
FOR SELECT 
USING (
  -- Staff can view all orders
  has_any_role(auth.uid()) 
  OR 
  -- Allow customers to view their recently created order (for order number retrieval)
  (created_at > now() - interval '5 minutes' AND created_by IS NULL)
);