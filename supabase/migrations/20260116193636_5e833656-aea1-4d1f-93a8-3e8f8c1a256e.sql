-- Drop existing policy and recreate with 15 minute window
DROP POLICY IF EXISTS "Orders read access" ON public.orders;

CREATE POLICY "Orders read access" 
ON public.orders 
FOR SELECT 
USING (
  has_any_role(auth.uid()) 
  OR (created_at > now() - interval '15 minutes' AND created_by IS NULL)
);