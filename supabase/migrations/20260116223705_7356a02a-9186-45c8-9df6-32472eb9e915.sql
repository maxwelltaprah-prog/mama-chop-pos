-- Drop the overly restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can create pending_orders" ON public.pending_orders;

-- Create a simpler INSERT policy that just checks payload is valid
-- The triggers will handle defaults for expires_at and created_at
CREATE POLICY "Anyone can insert pending_orders" 
ON public.pending_orders 
FOR INSERT 
WITH CHECK (
  payload IS NOT NULL 
  AND jsonb_typeof(payload) = 'object'
);