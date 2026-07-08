-- Add image_model column to ai_generations to track which AI model produced each image
ALTER TABLE public.ai_generations
ADD COLUMN IF NOT EXISTS image_model TEXT;

COMMENT ON COLUMN public.ai_generations.image_model IS 'The AI model used to generate the image (e.g. fal-ai/ideogram/v3, dall-e-3)';
