-- Update default hero text to remove AI references
UPDATE public.agency_settings 
SET 
  hero_title = 'Professional Design Services That Drive Results',
  hero_subtitle = 'Partner with our creative team to build a brand that stands out and converts'
WHERE hero_title = 'AI-Powered Solutions for Your Business';