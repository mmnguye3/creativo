-- Allow public access to view active agency subdomains
CREATE POLICY "Anyone can view active subdomains"
ON public.agency_subdomains
FOR SELECT
TO anon
USING (is_active = true);

-- Allow public access to view agency settings
CREATE POLICY "Anyone can view agency settings"
ON public.agency_settings
FOR SELECT
TO anon
USING (true);