-- Record why the image pipeline fell back off fal.ai so the owner can see it.
-- NULL means the primary (fal.ai) generator was used or no image was generated.
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS image_fallback_error text;

COMMENT ON COLUMN public.ai_generations.image_fallback_error IS
  'fal.ai error message captured when generation fell back to the OpenAI backup generator. NULL = no fallback.';
