-- Create orders table for white-label customer orders
CREATE TABLE public.customer_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table for individual services in an order
CREATE TABLE public.customer_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.customer_orders(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for customer orders
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

CREATE POLICY "Anyone can create orders" 
ON public.customer_orders 
FOR INSERT 
WITH CHECK (true);

-- Create policies for order items
CREATE POLICY "Admins can view all order items" 
ON public.customer_order_items 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Agency owners can view their order items" 
ON public.customer_order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM customer_orders co
  JOIN agency_settings a ON a.id = co.agency_id
  WHERE co.id = customer_order_items.order_id 
  AND a.user_id = auth.uid()
));

CREATE POLICY "Anyone can create order items" 
ON public.customer_order_items 
FOR INSERT 
WITH CHECK (true);

-- Add triggers for updated_at
CREATE TRIGGER update_customer_orders_updated_at
  BEFORE UPDATE ON public.customer_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_customer_orders_agency_id ON public.customer_orders(agency_id);
CREATE INDEX idx_customer_orders_status ON public.customer_orders(status);
CREATE INDEX idx_customer_order_items_order_id ON public.customer_order_items(order_id);