-- ═══════════════════════════════════════════════════════════════════════════
-- Moderation hardening v2
-- 1. Extend moderation_logs (tier, layer_triggered, alert_resolved, user_email)
-- 2. Extend ai_generations (review_status, review_reason, reviewed_by, reviewed_at)
-- 3. generation_rate_limits table + atomic RPC
-- 4. gambling_whitelist table
-- 5. Admin UPDATE policy on profiles (fix compliance console actions)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Extend moderation_logs ─────────────────────────────────────────────────
ALTER TABLE public.moderation_logs
  ADD COLUMN IF NOT EXISTS tier          smallint   NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS layer_triggered text,
  ADD COLUMN IF NOT EXISTS alert_resolved boolean    NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_email    text;

CREATE INDEX IF NOT EXISTS moderation_logs_tier1_alert_idx
  ON public.moderation_logs (tier, alert_resolved, created_at DESC)
  WHERE tier = 1 AND alert_resolved = false;

-- ── 2. Extend ai_generations ──────────────────────────────────────────────────
ALTER TABLE public.ai_generations
  ADD COLUMN IF NOT EXISTS review_status text,       -- null | 'pending_review' | 'approved' | 'rejected'
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by  uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at  timestamptz;

CREATE INDEX IF NOT EXISTS ai_generations_review_idx
  ON public.ai_generations (review_status, created_at DESC)
  WHERE review_status = 'pending_review';

-- ── 3. Rate-limit table + atomic RPC ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generation_rate_limits (
  user_id      uuid        NOT NULL,
  window_start timestamptz NOT NULL,
  attempt_count integer    NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, window_start)
);

-- Auto-purge rows older than 2 minutes (tiny table, not a concern)
-- Edge function cleans on each call via the windowed key.

-- Atomic increment + over-limit check (returns true = BLOCKED)
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(uid uuid, max_per_minute integer DEFAULT 10)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  window_ts  timestamptz := date_trunc('minute', now() AT TIME ZONE 'UTC');
  new_count  integer;
BEGIN
  INSERT INTO public.generation_rate_limits (user_id, window_start, attempt_count)
  VALUES (uid, window_ts, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET attempt_count = generation_rate_limits.attempt_count + 1
  RETURNING attempt_count INTO new_count;

  -- Clean previous windows for this user (keep table small)
  DELETE FROM public.generation_rate_limits
  WHERE user_id = uid AND window_start < window_ts;

  RETURN new_count > max_per_minute;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.check_and_increment_rate_limit(uuid, integer) TO service_role;

-- ── 4. Gambling whitelist ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.gambling_whitelist (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes       text,                                      -- license doc / reason
  approved_by uuid        REFERENCES public.profiles(id),
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gambling_whitelist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage gambling whitelist" ON public.gambling_whitelist;
CREATE POLICY "Admins manage gambling whitelist"
  ON public.gambling_whitelist FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Edge function (service_role) needs to read whitelist
GRANT SELECT ON public.gambling_whitelist TO service_role;

-- ── 5. Admin UPDATE policy on profiles ───────────────────────────────────────
-- The protect_moderation_columns trigger already guards flag values; admins
-- need an UPDATE policy to reach the trigger at all.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ── 6. Admin RLS for new columns in ai_generations ───────────────────────────
-- Admins need to UPDATE review_status/reviewed_by/reviewed_at on any generation.
DROP POLICY IF EXISTS "Admins can update any generation" ON public.ai_generations;
CREATE POLICY "Admins can update any generation"
  ON public.ai_generations FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins need to SELECT any generation for the pending-review queue.
DROP POLICY IF EXISTS "Admins can view all generations" ON public.ai_generations;
CREATE POLICY "Admins can view all generations"
  ON public.ai_generations FOR SELECT
  USING (public.is_admin());

-- ── 7. Expose new RPC to types ────────────────────────────────────────────────
-- (No additional grants needed — all existing RPCs retain their grants.)
