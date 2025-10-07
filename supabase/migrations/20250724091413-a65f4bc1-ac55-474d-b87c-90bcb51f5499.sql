-- Disable RLS entirely for customer order tables since they need anonymous access
-- This is appropriate for white-label order submission functionality

-- Disable RLS on customer_orders table
ALTER TABLE public.customer_orders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on customer_order_items table  
ALTER TABLE public.customer_order_items DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('customer_orders', 'customer_order_items');