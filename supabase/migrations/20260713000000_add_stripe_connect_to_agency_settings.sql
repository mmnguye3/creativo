-- Add Stripe Connect fields to agency_settings
-- stripe_account_id: the connected Express account ID (acct_...)
-- stripe_onboarding_complete: true once charges_enabled AND details_submitted

ALTER TABLE public.agency_settings
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.agency_settings.stripe_account_id IS 'Stripe Express connected account ID (acct_...)';
COMMENT ON COLUMN public.agency_settings.stripe_onboarding_complete IS 'True when the connected account has completed onboarding (charges_enabled AND details_submitted)';
