-- Re-add client tracking columns to ai_generations.
-- The 20251010201625 baseline migration recreated ai_generations without the
-- client_email / purchase_order_id columns originally added on 2025-07-24,
-- which breaks the Client Projects page (42703: column does not exist) and
-- the "save to history" flow that writes these fields.
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS purchase_order_id TEXT;
