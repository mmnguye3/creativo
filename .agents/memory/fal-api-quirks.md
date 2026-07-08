---
name: fal.ai API quirks
description: fal.ai error semantics and ideogram v3 parameter changes that break the primary image path.
---
The rule: when fal.ai rejects requests, read the error detail — 401 "Cannot access application" means the API key is invalid/revoked (not just balance), while 403 "Exhausted balance" means the account needs a top-up. A silent gpt-image-1 fallback can also hide a 422 parameter error.

**Why:** After a balance top-up (July 2026) the stored key still returned 401 — the key itself had been invalidated and needed regeneration. Then fal kept failing with 422 because ideogram v3 renamed its `rendering_speed` values: `STANDARD` is no longer accepted; valid values are `TURBO`, `BALANCED`, `QUALITY`. The fallback chain masked this as "still using gpt-image-1".

**How to apply:** Fallbacks are no longer silent — the fal error is persisted to `ai_generations.image_fallback_error` and surfaced as a red alert on the admin dashboard overview (7-day rate + classified cause). For older rows or deeper debugging, check the edge function logs for `[fal] Generation failed` — the real cause (auth vs. balance vs. schema drift in fal model params) is in that line. FAL_KEY lives in Supabase edge secrets; the Management API `/secrets` endpoint returns real values for user secrets but only digests for reserved SUPABASE_* ones (use `/api-keys?reveal=true` for those). Edge function code changes require `supabase functions deploy <slug> --project-ref <ref> --use-api`.
