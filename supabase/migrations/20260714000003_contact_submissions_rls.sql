-- Tighten contact_submissions RLS (applied to live project 2026-07-13)
-- The original 2025-07-23 migration used USING (true) policies, which let any
-- role (including anon) read every contact submission. Inserts happen through
-- the submit-contact-form edge function with the service role (bypasses RLS),
-- so no public insert policy is required.

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contact submissions are viewable by authenticated users" ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can create contact submissions" ON public.contact_submissions;

CREATE POLICY "admin_select_contact_submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
