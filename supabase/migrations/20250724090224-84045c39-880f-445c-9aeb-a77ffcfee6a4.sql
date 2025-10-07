-- Fix RLS policy for customer_orders to allow anonymous order creation
-- This resolves the "failed to submit order" error on mobile devices

-- Drop existing INSERT policy that's blocking anonymous users
DROP POLICY IF EXISTS "Anyone can create orders" ON public.customer_orders;

-- Create new INSERT policy that explicitly allows all users (including anonymous) to create orders
CREATE POLICY "Allow anonymous and authenticated users to create orders" 
ON public.customer_orders 
FOR INSERT 
WITH CHECK (true);

-- Ensure the policy allows order creation from white-label sites without authentication
COMMENT ON POLICY "Allow anonymous and authenticated users to create orders" ON public.customer_orders 
IS 'Allows both authenticated and anonymous users to create orders for white-label functionality';