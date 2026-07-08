---
name: Testing the image-fallback alert end-to-end
description: How to force a fal.ai fallback in the live edge function and verify Resend delivery
---
The rule: `modelOverride` with an OpenAI model (`dall-e-3`, `dall-e-2`, `gpt-image-1`) now bypasses fal.ai entirely AND skips fal-health tracking (`bypassedFal` flag) — it can no longer be used to force a fallback for e2e-testing the alert. To force a real fal fallback, pass a non-OpenAI model string that doesn't exist on fal.run (e.g. `modelOverride: "fal-ai/nonexistent-model"`). Seed `image_fallback_alert_state.consecutive_fallbacks=2` first so one call crosses the threshold of 3.

**Why:** direct-OpenAI requests say nothing about fal.ai health; routing them through fal caused 404s that triggered false "image quality degraded" admin alerts (fixed July 8, 2026). The alert + recovery-email paths were verified live earlier the same day (Resend `last_event: delivered`, state reset to 0/null on next fal success).

**How to apply:**
- Choice params `platform`/`objective`/`tone` require title-case display values ("Instagram", "Conversions", "Professional") — lowercase-hyphen values are rejected 400.
- The function requires a real user JWT (service-role bearer fails `auth.getUser`); create a confirmed throwaway user via the admin API, sign in with password grant, and delete the user + its `ai_generations` rows afterwards.
- Confirm delivery via Resend `GET https://api.resend.com/emails` (shows to/subject/last_event) instead of asking the user to check their inbox.
- `RESEND_API_KEY` lives in both Supabase edge-function secrets (required by generate-ai-content, send-invoice, submit-contact-form, notify-account-status) and Replit secrets. The key was once exposed in chat; the user declined rotation — an open follow-up task covers rotating it.
