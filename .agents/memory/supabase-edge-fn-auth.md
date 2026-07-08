---
name: Supabase edge function identity
description: Edge functions must derive user identity from the JWT, never from the request body
---

Rule: In Supabase Edge Functions using the service-role client, never trust a `userId` (or record IDs implying ownership) from the request body. Derive the caller via `supabase.auth.getUser(jwt)` from the `Authorization` header, and verify ownership of any body-supplied record IDs before mutating/logging.

**Why:** The service-role client bypasses RLS; a body-supplied userId lets any caller impersonate other users (e.g. bypass suspension, poison moderation logs). Caught by architect review on the moderation gate.

**How to apply:** Any new/edited edge function that reads a user id or per-user record id from the body: authenticate from JWT first, reject on mismatch, check record ownership with a select before update. Also: SECURITY DEFINER SQL functions default to PUBLIC EXECUTE — add `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` unless end users must call them (functions used inside RLS policies still need EXECUTE for anon/authenticated).
