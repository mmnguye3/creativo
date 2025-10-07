-- Update the ai_generations table to support draft status
-- First, update the status constraint to include 'draft'
ALTER TABLE public.ai_generations 
DROP CONSTRAINT IF EXISTS ai_generations_status_check;

ALTER TABLE public.ai_generations 
ADD CONSTRAINT ai_generations_status_check 
CHECK (status IN ('pending', 'draft', 'completed', 'failed'));