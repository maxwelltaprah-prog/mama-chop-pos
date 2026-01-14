-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true);

-- Policy: Anyone can view menu images
CREATE POLICY "Anyone can view menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Policy: Authenticated admins can upload menu images
CREATE POLICY "Admins can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Policy: Admins can update menu images
CREATE POLICY "Admins can update menu images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Policy: Admins can delete menu images
CREATE POLICY "Admins can delete menu images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-images' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;