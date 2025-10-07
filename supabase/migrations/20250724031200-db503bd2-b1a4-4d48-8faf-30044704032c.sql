-- Create storage bucket for agency assets
INSERT INTO storage.buckets (id, name, public) VALUES ('agency-assets', 'agency-assets', true);

-- Create storage policies for agency assets
CREATE POLICY "Anyone can view agency assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'agency-assets');

CREATE POLICY "Authenticated users can upload agency assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'agency-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own agency assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'agency-assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own agency assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'agency-assets' AND auth.uid()::text = (storage.foldername(name))[1]);