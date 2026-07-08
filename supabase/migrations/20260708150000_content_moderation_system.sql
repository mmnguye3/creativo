-- ═══════════════════════════════════════════════════════════════════════════
-- Content compliance & moderation system
-- 1. moderation_logs table (admin-read-only, service-role writes)
-- 2. profiles: under_review / suspended / content_ack_at columns
-- 3. increment_and_review() — auto-flag accounts with 3+ blocks in 30 days
-- 4. Suspension enforcement on customer_orders inserts
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Profiles columns ──────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS under_review boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS content_ack_at timestamptz;

-- Prevent non-admins from flipping their own moderation flags
-- (the existing "Users can update their own profile" policy allows all columns)
CREATE OR REPLACE FUNCTION public.protect_moderation_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.suspended IS DISTINCT FROM OLD.suspended
      OR NEW.under_review IS DISTINCT FROM OLD.under_review) THEN
    IF NOT (auth.role() = 'service_role' OR public.is_admin()) THEN
      RAISE EXCEPTION 'Not authorized to modify moderation flags';
    END IF;
  END IF;
  -- content_ack_at may only be set once (first acknowledgment), never cleared
  IF (OLD.content_ack_at IS NOT NULL
      AND NEW.content_ack_at IS DISTINCT FROM OLD.content_ack_at) THEN
    IF NOT (auth.role() = 'service_role' OR public.is_admin()) THEN
      RAISE EXCEPTION 'Content acknowledgment cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_moderation_columns_trg ON public.profiles;
CREATE TRIGGER protect_moderation_columns_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_moderation_columns();

-- ── 2. moderation_logs table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agency_name text,
  prompt text NOT NULL,
  service_type text,
  flagged_categories text[] NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'prompt',          -- 'prompt' | 'image' | 'suspension'
  action_taken text NOT NULL DEFAULT 'blocked',   -- 'blocked' | 'cleared' | 'warned'
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS moderation_logs_user_created_idx
  ON public.moderation_logs (user_id, created_at DESC);

ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read / update (clear, warn) / delete; service role bypasses RLS for inserts
DROP POLICY IF EXISTS "Admins can view moderation logs" ON public.moderation_logs;
CREATE POLICY "Admins can view moderation logs"
  ON public.moderation_logs FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update moderation logs" ON public.moderation_logs;
CREATE POLICY "Admins can update moderation logs"
  ON public.moderation_logs FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete moderation logs" ON public.moderation_logs;
CREATE POLICY "Admins can delete moderation logs"
  ON public.moderation_logs FOR DELETE
  USING (public.is_admin());

-- ── 3. Auto-review function ──────────────────────────────────────────────────
-- Counts blocked attempts in the rolling 30-day window; flags at 3 or more.
CREATE OR REPLACE FUNCTION public.increment_and_review(uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  violation_count integer;
BEGIN
  SELECT count(*) INTO violation_count
  FROM public.moderation_logs
  WHERE user_id = uid
    AND action_taken = 'blocked'
    AND created_at >= now() - interval '30 days';

  IF violation_count >= 3 THEN
    UPDATE public.profiles SET under_review = true WHERE id = uid;
  END IF;
END;
$$;

-- Only the service role (edge functions) may call this — never end users,
-- otherwise anyone could force arbitrary accounts into review.
REVOKE EXECUTE ON FUNCTION public.increment_and_review(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_and_review(uuid) TO service_role;

-- ── 4. Suspension enforcement on orders ──────────────────────────────────────
-- Security-definer helper so the RLS check works for anonymous customers too.
CREATE OR REPLACE FUNCTION public.is_agency_suspended(aid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_settings ags
    JOIN public.profiles p ON p.id = ags.user_id
    WHERE ags.id = aid AND p.suspended = true
  );
$$;

-- Must be executable by anon + authenticated: it runs inside the RLS policy
-- below with the invoking role's privileges. It only returns a boolean.
GRANT EXECUTE ON FUNCTION public.is_agency_suspended(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "Block orders for suspended agencies" ON public.customer_orders;
CREATE POLICY "Block orders for suspended agencies"
  ON public.customer_orders
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (NOT public.is_agency_suspended(agency_id));
