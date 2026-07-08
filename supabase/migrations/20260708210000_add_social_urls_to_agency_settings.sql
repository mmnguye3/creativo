-- Add social media URL columns to agency_settings
ALTER TABLE public.agency_settings
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- No RLS changes needed — existing policies (users can only read/update their own row)
-- already cover new columns because they are row-level.
