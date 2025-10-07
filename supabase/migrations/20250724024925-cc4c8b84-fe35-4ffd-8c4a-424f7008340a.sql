-- Create a default admin user
-- Note: This creates a user with email admin@terrix.com and password 'admin123'
-- You should change this password after first login

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@terrix.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Admin","last_name":"User","company":"Terrix Creative Studio"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the admin user ID and create admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'admin@terrix.com';

-- Create profile for the admin user
INSERT INTO public.profiles (id, first_name, last_name, company)
SELECT id, 'Admin', 'User', 'Terrix Creative Studio'
FROM auth.users 
WHERE email = 'admin@terrix.com';