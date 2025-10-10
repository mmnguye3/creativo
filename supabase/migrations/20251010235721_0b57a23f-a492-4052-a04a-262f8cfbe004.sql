-- Drop the problematic policy on customer_order_items
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.customer_order_items;

-- Create a simple policy allowing anon and authenticated to insert order items
CREATE POLICY "Allow order item insertion"
ON public.customer_order_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Add a policy to allow anon to view orders (needed for order completion flow)
CREATE POLICY "Allow anon to view orders"
ON public.customer_orders
FOR SELECT
TO anon
USING (true);