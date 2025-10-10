-- Drop the restrictive policy that requires authentication
DROP POLICY IF EXISTS "Agencies can insert orders" ON public.customer_orders;

-- Create a new policy that allows anyone to insert orders for valid agencies
-- This is safe because customers are anonymous and placing public orders
CREATE POLICY "Anyone can insert orders for valid agencies"
ON public.customer_orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_settings
    WHERE agency_settings.user_id = customer_orders.agency_id
  )
);

-- Also ensure anonymous users can insert order items
DROP POLICY IF EXISTS "Users can insert order items for their orders" ON public.customer_order_items;

CREATE POLICY "Anyone can insert order items"
ON public.customer_order_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.customer_orders
    WHERE customer_orders.id = customer_order_items.order_id
  )
);