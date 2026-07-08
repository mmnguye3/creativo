-- Gate 2 columns: admin holds, releases, rejects gray-zone generations
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS admin_image_url      TEXT,
  ADD COLUMN IF NOT EXISTS admin_image_model    TEXT,
  ADD COLUMN IF NOT EXISTS admin_generated_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_generated_by   UUID,
  ADD COLUMN IF NOT EXISTS released_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_by          UUID,
  ADD COLUMN IF NOT EXISTS rejection_reason     TEXT;
