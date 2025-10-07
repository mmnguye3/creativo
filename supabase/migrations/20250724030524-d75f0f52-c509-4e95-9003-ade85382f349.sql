-- Enhance agency_settings table with additional white-label fields
ALTER TABLE public.agency_settings 
ADD COLUMN hero_title TEXT DEFAULT 'AI-Powered Solutions for Your Business',
ADD COLUMN hero_subtitle TEXT DEFAULT 'Transform your business with cutting-edge artificial intelligence',
ADD COLUMN about_content TEXT,
ADD COLUMN services_enabled BOOLEAN DEFAULT true,
ADD COLUMN features_enabled BOOLEAN DEFAULT true,
ADD COLUMN testimonials_enabled BOOLEAN DEFAULT true,
ADD COLUMN pricing_enabled BOOLEAN DEFAULT true,
ADD COLUMN custom_css TEXT,
ADD COLUMN meta_title TEXT,
ADD COLUMN meta_description TEXT,
ADD COLUMN favicon_url TEXT;

-- Create agency_content table for customizable content sections
CREATE TABLE public.agency_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agency_settings(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- 'service', 'feature', 'testimonial', 'faq'
  title TEXT NOT NULL,
  description TEXT,
  content JSONB, -- flexible content structure
  display_order INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_inquiries table for white-label lead capture
CREATE TABLE public.customer_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agency_settings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  inquiry_type TEXT DEFAULT 'general', -- 'general', 'quote', 'support'
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'closed'
  source TEXT DEFAULT 'website', -- tracking source
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.agency_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;

-- RLS policies for agency_content
CREATE POLICY "Admins can manage all agency content" 
ON public.agency_content 
FOR ALL 
USING (is_admin());

CREATE POLICY "Users can manage their agency content" 
ON public.agency_content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.agency_settings 
    WHERE id = agency_content.agency_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Public can view enabled agency content" 
ON public.agency_content 
FOR SELECT 
USING (is_enabled = true);

-- RLS policies for customer_inquiries  
CREATE POLICY "Admins can view all customer inquiries" 
ON public.customer_inquiries 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can view their agency inquiries" 
ON public.customer_inquiries 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.agency_settings 
    WHERE id = customer_inquiries.agency_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create customer inquiries" 
ON public.customer_inquiries 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Agency owners can update their inquiries" 
ON public.customer_inquiries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.agency_settings 
    WHERE id = customer_inquiries.agency_id 
    AND user_id = auth.uid()
  )
);

-- Add update triggers
CREATE TRIGGER update_agency_content_updated_at
BEFORE UPDATE ON public.agency_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_inquiries_updated_at
BEFORE UPDATE ON public.customer_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_agency_content_agency_id ON public.agency_content(agency_id);
CREATE INDEX idx_agency_content_section_type ON public.agency_content(section_type);
CREATE INDEX idx_customer_inquiries_agency_id ON public.customer_inquiries(agency_id);
CREATE INDEX idx_customer_inquiries_status ON public.customer_inquiries(status);