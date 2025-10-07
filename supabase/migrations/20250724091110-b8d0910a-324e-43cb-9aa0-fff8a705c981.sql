-- Re-enable RLS and create a working policy for anonymous users
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anonymous users can create orders" ON public.customer_orders;

-- Create a new INSERT policy that explicitly works for all users including anonymous
-- Using a different approach - target all roles and use true condition
CREATE POLICY "Enable INSERT for all users" 
ON public.customer_orders 
FOR INSERT 
WITH CHECK (true);

-- Verify the policy was created correctly
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'customer_orders' AND cmd = 'INSERT';