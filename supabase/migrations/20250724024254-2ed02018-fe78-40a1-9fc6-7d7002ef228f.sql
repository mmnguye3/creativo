-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'customer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create agency_subdomains table
CREATE TABLE public.agency_subdomains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agency_settings table for white-label customization
CREATE TABLE public.agency_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e40af',
  contact_email TEXT,
  contact_phone TEXT,
  custom_domain TEXT,
  hide_powered_by BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subdomains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can create user roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin());

-- RLS Policies for agency_subdomains
CREATE POLICY "Admins can view all subdomains"
ON public.agency_subdomains
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Users can view their own subdomain"
ON public.agency_subdomains
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create subdomains"
ON public.agency_subdomains
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update subdomains"
ON public.agency_subdomains
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete subdomains"
ON public.agency_subdomains
FOR DELETE
USING (public.is_admin());

-- RLS Policies for agency_settings
CREATE POLICY "Admins can view all agency settings"
ON public.agency_settings
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Users can view their own agency settings"
ON public.agency_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create agency settings"
ON public.agency_settings
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Users can create their own agency settings"
ON public.agency_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update agency settings"
ON public.agency_settings
FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Users can update their own agency settings"
ON public.agency_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_subdomains_updated_at
BEFORE UPDATE ON public.agency_subdomains
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_settings_updated_at
BEFORE UPDATE ON public.agency_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();