-- Create customer_profiles table for customers (separate from staff profiles)
CREATE TABLE public.customer_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Customers can view their own profile
CREATE POLICY "Customers can view own profile"
ON public.customer_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Customers can update their own profile
CREATE POLICY "Customers can update own profile"
ON public.customer_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow inserting own profile during signup (via edge function)
CREATE POLICY "Allow insert via service role only"
ON public.customer_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_customer_profiles_updated_at
BEFORE UPDATE ON public.customer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add customer_user_id column to orders table to link orders to customer accounts
ALTER TABLE public.orders ADD COLUMN customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update orders RLS to allow customers to view their own orders
DROP POLICY IF EXISTS "Orders read access" ON public.orders;

CREATE POLICY "Orders read access"
ON public.orders
FOR SELECT
USING (
  has_any_role(auth.uid()) 
  OR (auth.uid() IS NOT NULL AND customer_user_id = auth.uid())
  OR (created_at > now() - interval '15 minutes' AND created_by IS NULL AND customer_user_id IS NULL)
);

-- Allow authenticated customers to create orders with their user_id
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  order_type IN ('dine-in', 'takeaway', 'delivery')
  AND status = 'pending'
  AND payment_status IN ('pending', 'paid')
);

-- Create index for faster customer order lookups
CREATE INDEX idx_orders_customer_user_id ON public.orders(customer_user_id);

-- Function to check if user is a customer (not staff)
CREATE OR REPLACE FUNCTION public.is_customer(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer_profiles
    WHERE user_id = _user_id
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;