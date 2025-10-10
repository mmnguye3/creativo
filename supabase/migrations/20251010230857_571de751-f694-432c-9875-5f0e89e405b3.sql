-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can insert orders for valid agencies" ON public.customer_orders;

-- Create new policy that explicitly allows anonymous and authenticated users
CREATE POLICY "Allow order insertion for valid agencies"
ON public.customer_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (is_valid_agency(agency_id));