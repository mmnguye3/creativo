-- Delivery flow: adds deliverable_files + delivery_note to customer_orders,
-- creates private 'deliverables' storage bucket, and wires RLS so only the
-- owning agency can upload / read files for their orders.

-- 1. New columns on customer_orders
ALTER TABLE public.customer_orders
  ADD COLUMN IF NOT EXISTS deliverable_files JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS delivery_note TEXT;

COMMENT ON COLUMN public.customer_orders.deliverable_files IS
  'Array of {path, name, size} objects stored in the deliverables bucket';
COMMENT ON COLUMN public.customer_orders.delivery_note IS
  'Optional note from the agency sent with the delivery email';

-- 2. Private storage bucket for deliverables
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliverables',
  'deliverables',
  false,
  52428800, -- 50 MB per file
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/quicktime',
    'application/zip', 'application/x-zip-compressed',
    'application/illustrator', 'image/vnd.adobe.photoshop',
    'application/postscript',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS policies: agency users can only access files inside their own agency_id prefix
--    Path structure: deliverables/{agency_settings.id}/{order_id}/{filename}

-- INSERT: agency owner can upload
CREATE POLICY "agency_owner_upload_deliverables"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deliverables'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.agency_settings WHERE user_id = auth.uid()
    )
  );

-- SELECT: agency owner can list / download
CREATE POLICY "agency_owner_read_deliverables"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.agency_settings WHERE user_id = auth.uid()
    )
  );

-- DELETE: agency owner can remove their files
CREATE POLICY "agency_owner_delete_deliverables"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.agency_settings WHERE user_id = auth.uid()
    )
  );
