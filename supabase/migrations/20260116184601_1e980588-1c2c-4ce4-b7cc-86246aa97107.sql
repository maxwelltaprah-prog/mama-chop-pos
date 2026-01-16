-- Allow admins to view all employee profiles (needed for Employees view)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
