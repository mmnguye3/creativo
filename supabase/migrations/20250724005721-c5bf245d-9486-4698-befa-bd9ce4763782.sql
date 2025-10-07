-- Add client email and purchase order ID columns to ai_generations table
ALTER TABLE public.ai_generations 
ADD COLUMN client_email TEXT,
ADD COLUMN purchase_order_id TEXT;