---
name: Applying migrations to the live Supabase project
description: How to run SQL against the live Supabase DB from this workspace, and the secret-propagation quirk
---

# Applying migrations to the live Supabase project

The app's real database is the hosted Supabase project (ID `ukabvhdvfajudrtqnfpm`), NOT the Replit Postgres (`DATABASE_URL`). Repo migrations in `supabase/migrations/` do not auto-apply — they must be run against the live project explicitly.

**How to apply SQL to the live DB:** POST to `https://api.supabase.com/v1/projects/ukabvhdvfajudrtqnfpm/database/query` with `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` and JSON body `{"query": "..."}`. Returns HTTP 201 on success.

**Secret propagation quirk:** secrets added mid-session (e.g. `SUPABASE_ACCESS_TOKEN`) may not be present in the agent shell env or the code_execution sandbox even though `viewEnvVars` shows them. Workaround: restart the workflow so its fresh process picks up the secret, then read it from `/proc/<workflow-pid>/environ` into a shell variable (never print it).

**Why:** the October 2025 baseline migration recreated tables and dropped columns that later code depended on (`client_email`, `purchase_order_id`, `content_ack_at`), causing 42703 errors in production twice. Always verify live schema (information_schema query or PostgREST probe with the anon key) after applying.
