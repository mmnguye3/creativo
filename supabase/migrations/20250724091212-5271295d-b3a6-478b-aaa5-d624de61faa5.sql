-- The issue might be that the policy isn't applying to anonymous users properly
-- Let's create a more explicit policy that definitely targets anonymous users

-- Drop the current policy
DROP POLICY IF EXISTS "Enable INSERT for all users" ON public.customer_orders;

-- Create a policy that explicitly allows anonymous access
CREATE POLICY "Allow all inserts including anonymous" 
ON public.customer_orders 
FOR INSERT 
TO public
WITH CHECK (true);

-- Also ensure the customer_order_items table has proper anonymous access
DROP POLICY IF EXISTS "Anyone can create order items" ON public.customer_order_items;

CREATE POLICY "Allow all inserts for order items" 
ON public.customer_order_items 
FOR INSERT 
TO public
WITH CHECK (true);

-- Verify both policies
SELECT 'customer_orders' as table_name, policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'customer_orders' AND cmd = 'INSERT'
UNION ALL
SELECT 'customer_order_items' as table_name, policyname, cmd, roles, with_check 
FROM pg_policies 
WHERE tablename = 'customer_order_items' AND cmd = 'INSERT';