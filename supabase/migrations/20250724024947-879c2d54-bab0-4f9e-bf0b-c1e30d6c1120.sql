-- First, let's create a simple admin user using Supabase's built-in functions
-- We'll use a different approach that's safer

-- Create admin role for existing users if needed
-- Check if admin user exists, if not we'll handle it through the application

-- For now, let's just ensure we have the admin role capability
-- We'll create the admin user through the application interface

-- Grant yourself admin privileges by running this after you sign up normally:
-- UPDATE: Let's create a simpler approach

-- First check if there are any existing users and make the first one admin
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID from auth.users
    SELECT id INTO first_user_id 
    FROM auth.users 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If we found a user, make them admin
    IF first_user_id IS NOT NULL THEN
        -- Insert admin role if it doesn't exist
        INSERT INTO public.user_roles (user_id, role)
        VALUES (first_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;