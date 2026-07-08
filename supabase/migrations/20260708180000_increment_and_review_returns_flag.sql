-- increment_and_review now reports whether the account was NEWLY flagged
-- (false -> true transition), so the edge function can email the user exactly
-- once when their account enters review — not on every subsequent violation.
DROP FUNCTION IF EXISTS public.increment_and_review(uuid);

CREATE FUNCTION public.increment_and_review(uid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  violation_count integer;
  newly_flagged boolean := false;
BEGIN
  SELECT count(*) INTO violation_count
  FROM public.moderation_logs
  WHERE user_id = uid
    AND action_taken = 'blocked'
    AND created_at >= now() - interval '30 days';

  IF violation_count >= 3 THEN
    UPDATE public.profiles
    SET under_review = true
    WHERE id = uid
      AND under_review = false
      AND suspended = false;
    newly_flagged := FOUND;
  END IF;

  RETURN newly_flagged;
END;
$$;

-- Only the service role (edge functions) may call this — never end users,
-- otherwise anyone could force arbitrary accounts into review.
REVOKE EXECUTE ON FUNCTION public.increment_and_review(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_and_review(uuid) TO service_role;
