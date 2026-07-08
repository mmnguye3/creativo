---
name: Live Supabase schema drift
description: Live DB schema follows the 20251010201625 baseline; repo migrations and generated types.ts can both be out of sync with it.
---
The rule: never assume a column exists on the live Supabase DB just because it appears in `src/integrations/supabase/types.ts` or in a repo migration. Probe first (e.g. `curl "$URL/rest/v1/<table>?select=<col>&limit=1"` with the anon key — 42703 means missing).

**Why:** The 20251010201625 baseline migration recreated core tables (e.g. `ai_generations`) without columns added by earlier July-2025 migrations (`client_email`, `purchase_order_id`, `image_url`), and later repo-only migrations (image_model, moderation) are also unapplied. types.ts is hand-drifted in both directions.

**How to apply:** Only the anon key is available in this environment — DDL cannot be run here. Ship schema changes as migration files (use `IF NOT EXISTS`) for the user to apply via the Supabase SQL editor, and make frontend queries degrade gracefully on 42703 in the interim.
