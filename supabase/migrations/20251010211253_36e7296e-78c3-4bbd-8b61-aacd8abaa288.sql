-- Add customer_company column to customer_orders table
ALTER TABLE public.customer_orders 
ADD COLUMN customer_company TEXT;