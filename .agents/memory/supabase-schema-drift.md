---
name: Live Supabase schema drift
description: Live DB schema follows the 20251010201625 baseline; repo migrations and generated types.ts can both be out of sync with it.
---
The rule: never assume a column exists on the live Supabase DB just because it appears in `src/integrations/supabase/types.ts` or in a repo migration. Probe first (e.g. `curl "$URL/rest/v1/<table>?select=<col>&limit=1"` with the anon key — 42703 means missing).

**Why:** The 20251010201625 baseline migration recreated core tables (e.g. `ai_generations`) without columns added by earlier July-2025 migrations (`client_email`, `purchase_order_id`, `image_url`), and later repo-only migrations (image_model, moderation) are also unapplied. types.ts is hand-drifted in both directions.

**How to apply:** With a SUPABASE_ACCESS_TOKEN secret set, DDL can be applied via the Management API (`POST https://api.supabase.com/v1/projects/<ref>/database/query` with curl — python urllib gets Cloudflare-403'd) and edge functions deployed via `supabase functions deploy <fn> --project-ref <ref> --use-api`. Still ship schema changes as idempotent migration files so the repo matches the live DB. As of July 2026 the moderation migrations, image_model, image_url, client_email, and purchase_order_id are all applied live.
