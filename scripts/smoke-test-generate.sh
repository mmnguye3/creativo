#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Smoke test: generate-ai-content edge function (fal.ai routing + fallback)
#
# PREREQUISITES:
#   1. Deploy the function first (see DEPLOYMENT INSTRUCTIONS below).
#   2. Run in Supabase SQL Editor:
#        ALTER TABLE public.ai_generations
#        ADD COLUMN IF NOT EXISTS image_model TEXT;
#   3. Set SUPABASE_SERVICE_ROLE_KEY and TEST_USER_ID below.
#   4. chmod +x scripts/smoke-test-generate.sh && bash scripts/smoke-test-generate.sh
#
# DEPLOYMENT INSTRUCTIONS (run from workspace root):
#   export SUPABASE_ACCESS_TOKEN="<your-personal-access-token>"
#   # Token: https://supabase.com/dashboard/account/tokens
#   supabase functions deploy generate-ai-content \
#     --project-ref ukabvhdvfajudrtqnfpm \
#     --no-verify-jwt
#
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT_REF="ukabvhdvfajudrtqnfpm"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
FUNCTION_URL="${SUPABASE_URL}/functions/v1/generate-ai-content"

# ── Set these before running ──────────────────────────────────────────────────
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"   # must be set
TEST_USER_ID="${TEST_USER_ID:-}"                     # a valid UUID from auth.users

if [[ -z "$SERVICE_ROLE_KEY" || -z "$TEST_USER_ID" ]]; then
  echo "❌  Set SUPABASE_SERVICE_ROLE_KEY and TEST_USER_ID before running."
  exit 1
fi

REST_URL="${SUPABASE_URL}/rest/v1"

# ── Helper: create a pending generation row ───────────────────────────────────
create_generation() {
  local service_type="$1"
  curl -s -X POST "${REST_URL}/ai_generations" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{
      \"user_id\": \"${TEST_USER_ID}\",
      \"service_type\": \"${service_type}\",
      \"description\": \"Smoke test for ${service_type}\",
      \"content_type\": \"combo\",
      \"status\": \"pending\"
    }" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if isinstance(d,list) else d.get('id',''))"
}

# ── Helper: fetch a row ───────────────────────────────────────────────────────
fetch_generation() {
  local gen_id="$1"
  curl -s "${REST_URL}/ai_generations?id=eq.${gen_id}&select=id,status,image_url,image_model" \
    -H "apikey: ${SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}"
}

# ── Test 1: ad-campaign → Ideogram v3 ────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo " TEST 1: ad-campaign should route to Ideogram v3"
echo "══════════════════════════════════════════════════"

GEN_ID=$(create_generation "ad-campaign")
echo "Created generation row: ${GEN_ID}"

RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceType\": \"ad-campaign\",
    \"description\": \"Premium organic coffee subscription — first bag free\",
    \"userId\": \"${TEST_USER_ID}\",
    \"generationId\": \"${GEN_ID}\",
    \"platform\": \"facebook-instagram\",
    \"objective\": \"conversions\",
    \"tone\": \"professional\",
    \"targetAudience\": \"Coffee lovers aged 25-45\"
  }")

echo "Function response:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

IMAGE_URL=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('imageUrl','MISSING'))" 2>/dev/null)
IMAGE_MODEL=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('imageModel','MISSING'))" 2>/dev/null)

echo ""
echo "✓ imageUrl  : ${IMAGE_URL:0:80}..."
echo "✓ imageModel: ${IMAGE_MODEL}"

if [[ "$IMAGE_MODEL" == "fal-ai/ideogram/v3" ]]; then
  echo "✅ PASS — routed to Ideogram v3 as expected"
elif [[ "$IMAGE_MODEL" == "dall-e-3" ]]; then
  echo "⚠️  FALLBACK — fal.ai failed or FAL_KEY missing; OpenAI dall-e-3 used"
else
  echo "❌ FAIL — unexpected model: ${IMAGE_MODEL}"
fi

# Verify DB row was updated
DB_ROW=$(fetch_generation "$GEN_ID")
echo ""
echo "DB row after generation:"
echo "$DB_ROW" | python3 -m json.tool 2>/dev/null || echo "$DB_ROW"

DB_MODEL=$(echo "$DB_ROW" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0].get('image_model','MISSING') if d else 'EMPTY')" 2>/dev/null)
if [[ "$DB_MODEL" != "MISSING" && "$DB_MODEL" != "EMPTY" ]]; then
  echo "✅ PASS — image_model column saved: ${DB_MODEL}"
else
  echo "❌ FAIL — image_model not saved in DB row (column may not exist yet — run the migration SQL)"
fi

# ── Test 2: Force OpenAI fallback via modelOverride ───────────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo " TEST 2: modelOverride = dall-e-3 (explicit fallback)"
echo "══════════════════════════════════════════════════"

GEN2_ID=$(create_generation "ad-campaign")
echo "Created generation row: ${GEN2_ID}"

RESPONSE2=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceType\": \"ad-campaign\",
    \"description\": \"Fallback path test\",
    \"userId\": \"${TEST_USER_ID}\",
    \"generationId\": \"${GEN2_ID}\",
    \"platform\": \"facebook-instagram\",
    \"objective\": \"traffic\",
    \"tone\": \"bold\",
    \"modelOverride\": \"dall-e-3\"
  }")

MODEL2=$(echo "$RESPONSE2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('imageModel','MISSING'))" 2>/dev/null)
echo "imageModel returned: ${MODEL2}"

# Note: modelOverride='dall-e-3' will be passed to fal.run/dall-e-3 which will
# fail, then fall back to OpenAI natively. The correct way to test the explicit
# OpenAI path is to temporarily unset FAL_KEY in the edge function secrets.

echo ""
echo "══════════════════════════════════════════════════"
echo " SUMMARY"
echo "══════════════════════════════════════════════════"
echo " Test 1 model returned : ${IMAGE_MODEL}"
echo " DB image_model column : ${DB_MODEL}"
echo " Test 2 model returned : ${MODEL2}"
echo ""
echo "To test the FAL_KEY-missing fallback path:"
echo "  1. Temporarily remove FAL_KEY from Supabase edge function secrets"
echo "  2. Re-deploy the function"  
echo "  3. Run this script again — IMAGE_MODEL should be 'dall-e-3'"
echo "  4. Restore FAL_KEY and re-deploy"
