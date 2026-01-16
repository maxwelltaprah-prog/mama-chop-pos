-- Create restaurant_settings table for storing configuration
CREATE TABLE public.restaurant_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Authenticated users can view settings" 
ON public.restaurant_settings 
FOR SELECT 
TO authenticated
USING (true);

-- Allow admin users to update settings
CREATE POLICY "Admin users can update settings" 
ON public.restaurant_settings 
FOR UPDATE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admin users to insert settings
CREATE POLICY "Admin users can insert settings" 
ON public.restaurant_settings 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.restaurant_settings (setting_key, setting_value) VALUES
  ('restaurant_name', 'Eidikos Kouzina'),
  ('location', 'Accra, Ghana'),
  ('phone', '+233 24 123 4567'),
  ('email', 'info@eidikoskouzina.com'),
  ('hours_weekday_open', '8:00 AM'),
  ('hours_weekday_close', '10:00 PM'),
  ('hours_saturday_open', '8:00 AM'),
  ('hours_saturday_close', '10:00 PM'),
  ('hours_sunday_open', '10:00 AM'),
  ('hours_sunday_close', '8:00 PM'),
  ('auto_print_receipts', 'true'),
  ('include_tax_breakdown', 'true'),
  ('qr_code_on_receipt', 'false'),
  ('new_order_alerts', 'true'),
  ('low_stock_warnings', 'true'),
  ('daily_summary_email', 'false');

-- Create trigger for updated_at
CREATE TRIGGER update_restaurant_settings_updated_at
BEFORE UPDATE ON public.restaurant_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();