-- Allow public access to view agency subdomains (needed for white-label site lookup)
CREATE POLICY "Public can view active subdomains" 
ON public.agency_subdomains 
FOR SELECT 
USING (is_active = true);

-- Allow public access to view agency settings (needed for white-label site display)
CREATE POLICY "Public can view agency settings for white-label sites" 
ON public.agency_settings 
FOR SELECT 
USING (true);