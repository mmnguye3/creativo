-- The Oct 2025 baseline migration recreated ai_generations without image_url
-- (originally added in July 2025). The generate-ai-content edge function
-- persists image_url on every image generation, so restore it.
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS image_url text;
