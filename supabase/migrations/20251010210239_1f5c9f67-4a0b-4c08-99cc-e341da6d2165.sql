-- Allow admins to insert agency settings for any user
CREATE POLICY "Admins can insert any agency settings"
ON public.agency_settings
FOR INSERT
TO authenticated
WITH CHECK (is_admin());