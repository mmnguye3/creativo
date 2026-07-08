---
name: Testing the image-fallback alert end-to-end
description: How to force a fal.ai fallback in the live edge function and verify Resend delivery
---
The rule: to e2e-test the fallback alert against the live `generate-ai-content` function, pass `modelOverride: "dall-e-3"` — modelOverride is not allowlisted, fal.run/dall-e-3 404s, and the function falls back to OpenAI, incrementing `image_fallback_alert_state`. Seed `consecutive_fallbacks=2` first so one call crosses the threshold of 3.

**Why:** verified July 8, 2026 — alert email arrived (Resend `last_event: delivered` to the admin inbox) and a subsequent normal generation (fal succeeded) reset the row to 0/null. No secret juggling (removing FAL_KEY) is needed to force a fallback.

**How to apply:**
- Choice params `platform`/`objective`/`tone` require title-case display values ("Instagram", "Conversions", "Professional") — lowercase-hyphen values are rejected 400.
- The function requires a real user JWT (service-role bearer fails `auth.getUser`); create a confirmed throwaway user via the admin API, sign in with password grant, and delete the user + its `ai_generations` rows afterwards.
- Confirm delivery via Resend `GET https://api.resend.com/emails` (shows to/subject/last_event) instead of asking the user to check their inbox.
- `RESEND_API_KEY` was absent from all secret stores until July 8, 2026; it is now set in the Supabase edge-function secrets (required by generate-ai-content, send-invoice, submit-contact-form, notify-account-status). It is NOT in Replit secrets.
