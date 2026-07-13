-- Migration: must_change_password + agency role
-- Adds the must_change_password column to profiles so the first-login
-- password-change gate can read it via RLS-compliant queries.
-- Also adds 'agency' to the app_role enum used by user_roles.

-- ── 1. Add 'agency' value to the app_role enum (idempotent) ──────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_enum e
    JOIN   pg_type t ON t.oid = e.enumtypid
    WHERE  t.typname = 'app_role'
    AND    e.enumlabel = 'agency'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'agency';
  END IF;
END $$;

-- ── 2. Add must_change_password to profiles ───────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.must_change_password IS
  'TRUE for newly provisioned agency accounts. Cleared after the agency sets a permanent password on first login.';
