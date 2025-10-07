-- Create ai_generations table for storing user AI-generated content
CREATE TABLE public.ai_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  generated_content TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'combo')),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own generations" 
ON public.ai_generations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generations" 
ON public.ai_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations" 
ON public.ai_generations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" 
ON public.ai_generations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_ai_generations_updated_at
BEFORE UPDATE ON public.ai_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();