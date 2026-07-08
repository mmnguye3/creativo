-- Singleton state row for image-fallback email alerting.
-- Tracks consecutive fal.ai -> OpenAI fallbacks and when the last alert email
-- was sent, so the generate-ai-content edge function can email the admin after
-- N consecutive fallbacks without spamming (one alert per incident window).

CREATE TABLE IF NOT EXISTS public.image_fallback_alert_state (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  consecutive_fallbacks integer NOT NULL DEFAULT 0,
  last_fallback_error text,
  alerted_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.image_fallback_alert_state (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS enabled with no policies: only the service role (which bypasses RLS)
-- can read or write this table. It is edge-function-internal state.
ALTER TABLE public.image_fallback_alert_state ENABLE ROW LEVEL SECURITY;
