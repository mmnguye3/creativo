-- Re-enable RLS on customer order tables with proper security policies
-- This fixes the critical security vulnerability while maintaining functionality

-- Re-enable RLS on customer_orders table
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on customer_order_items table  
ALTER TABLE public.customer_order_items ENABLE ROW LEVEL SECURITY;

-- Create secure policies for customer_orders
CREATE POLICY "Allow anonymous order creation" 
ON public.customer_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all orders" 
ON public.customer_orders 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Agency owners can view their orders" 
ON public.customer_orders 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM agency_settings 
    WHERE agency_settings.id = customer_orders.agency_id 
    AND agency_settings.user_id = auth.uid()
  )
);

CREATE POLICY "Agency owners can update their orders" 
ON public.customer_orders 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM agency_settings 
    WHERE agency_settings.id = customer_orders.agency_id 
    AND agency_settings.user_id = auth.uid()
  )
);

-- Create secure policies for customer_order_items
CREATE POLICY "Allow anonymous order item creation" 
ON public.customer_order_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all order items" 
ON public.customer_order_items 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Agency owners can view their order items" 
ON public.customer_order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM customer_orders co
    JOIN agency_settings a ON a.id = co.agency_id
    WHERE co.id = customer_order_items.order_id 
    AND a.user_id = auth.uid()
  )
);