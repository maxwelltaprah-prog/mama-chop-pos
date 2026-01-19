-- Allow cashiers to insert tables
CREATE POLICY "Cashiers can insert tables"
ON public.restaurant_tables
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'cashier'::app_role));

-- Allow cashiers to update tables
CREATE POLICY "Cashiers can update tables"
ON public.restaurant_tables
FOR UPDATE
USING (has_role(auth.uid(), 'cashier'::app_role));