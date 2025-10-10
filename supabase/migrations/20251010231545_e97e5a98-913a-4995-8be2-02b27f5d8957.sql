-- Grant execute permission on the validation function to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.is_valid_agency(uuid) TO anon, authenticated;

-- Grant usage on public schema to ensure function can be called
GRANT USAGE ON SCHEMA public TO anon, authenticated;