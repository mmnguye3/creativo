-- Debug the RLS issue by temporarily disabling RLS to confirm that's the problem
-- Then re-enable with a more explicit policy

-- First, let's see all policies on customer_orders
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'customer_orders';

-- Drop all existing policies and recreate them properly
DROP POLICY IF EXISTS "Allow anonymous and authenticated users to create orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Agency owners can view their orders" ON public.customer_orders;
DROP POLICY IF EXISTS "Agency owners can update their orders" ON public.customer_orders;

-- Create a simple, explicit INSERT policy that definitely allows anonymous users
CREATE POLICY "Anonymous users can create orders" 
ON public.customer_orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Recreate the other policies
CREATE POLICY "Admins can view all orders" 
ON public.customer_orders 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Agency owners can view their orders" 
ON public.customer_orders 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM agency_settings 
  WHERE agency_settings.id = customer_orders.agency_id 
  AND agency_settings.user_id = auth.uid()
));

CREATE POLICY "Agency owners can update their orders" 
ON public.customer_orders 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM agency_settings 
  WHERE agency_settings.id = customer_orders.agency_id 
  AND agency_settings.user_id = auth.uid()
));