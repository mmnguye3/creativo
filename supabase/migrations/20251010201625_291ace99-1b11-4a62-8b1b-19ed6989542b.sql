-- Create agency_subdomains table
CREATE TABLE public.agency_subdomains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create agency_settings table
CREATE TABLE public.agency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  contact_email TEXT,
  contact_phone TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  about_content TEXT,
  services_enabled BOOLEAN DEFAULT true,
  features_enabled BOOLEAN DEFAULT true,
  testimonials_enabled BOOLEAN DEFAULT true,
  pricing_enabled BOOLEAN DEFAULT true,
  meta_title TEXT,
  meta_description TEXT,
  favicon_url TEXT,
  hide_powered_by BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create ai_generations table
CREATE TABLE public.ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT,
  generated_content TEXT,
  content_type TEXT,
  status TEXT DEFAULT 'pending',
  project_name TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_orders table
CREATE TABLE public.customer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customer_order_items table
CREATE TABLE public.customer_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.customer_orders(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.agency_subdomains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agency_subdomains
CREATE POLICY "Users can view their own subdomains"
  ON public.agency_subdomains FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subdomains"
  ON public.agency_subdomains FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Users can insert their own subdomains"
  ON public.agency_subdomains FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert any subdomain"
  ON public.agency_subdomains FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can update their own subdomains"
  ON public.agency_subdomains FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any subdomain"
  ON public.agency_subdomains FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete subdomains"
  ON public.agency_subdomains FOR DELETE
  USING (public.is_admin());

-- RLS Policies for agency_settings
CREATE POLICY "Users can view their own settings"
  ON public.agency_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON public.agency_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.agency_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all settings"
  ON public.agency_settings FOR SELECT
  USING (public.is_admin());

-- RLS Policies for ai_generations
CREATE POLICY "Users can view their own generations"
  ON public.ai_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations"
  ON public.ai_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations"
  ON public.ai_generations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all generations"
  ON public.ai_generations FOR SELECT
  USING (public.is_admin());

-- RLS Policies for customer_orders
CREATE POLICY "Agencies can view their own orders"
  ON public.customer_orders FOR SELECT
  USING (auth.uid() = agency_id);

CREATE POLICY "Agencies can insert orders"
  ON public.customer_orders FOR INSERT
  WITH CHECK (auth.uid() = agency_id);

CREATE POLICY "Agencies can update their own orders"
  ON public.customer_orders FOR UPDATE
  USING (auth.uid() = agency_id);

CREATE POLICY "Admins can view all orders"
  ON public.customer_orders FOR SELECT
  USING (public.is_admin());

-- RLS Policies for customer_order_items
CREATE POLICY "Users can view order items for their orders"
  ON public.customer_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_orders
      WHERE customer_orders.id = customer_order_items.order_id
      AND customer_orders.agency_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert order items for their orders"
  ON public.customer_order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.customer_orders
      WHERE customer_orders.id = customer_order_items.order_id
      AND customer_orders.agency_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all order items"
  ON public.customer_order_items FOR SELECT
  USING (public.is_admin());