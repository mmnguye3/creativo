-- Let's try temporarily disabling RLS entirely to confirm this is the issue
-- This will help us determine if it's truly an RLS problem

-- Disable RLS temporarily for testing
ALTER TABLE public.customer_orders DISABLE ROW LEVEL SECURITY;

-- We'll re-enable it after testing