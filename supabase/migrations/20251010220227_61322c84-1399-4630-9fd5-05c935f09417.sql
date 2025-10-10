-- Create a security definer function to check if an agency exists
CREATE OR REPLACE FUNCTION public.is_valid_agency(_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_settings
    WHERE user_id = _agency_id
  )
$$;

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can insert orders for valid agencies" ON public.customer_orders;

-- Create new policy using the security definer function
CREATE POLICY "Anyone can insert orders for valid agencies"
ON public.customer_orders
FOR INSERT
WITH CHECK (public.is_valid_agency(agency_id));