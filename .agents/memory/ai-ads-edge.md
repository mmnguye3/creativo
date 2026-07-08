---
name: AI Ads Edge Function
description: How ad-campaign service type works in the generate-ai-content edge function.
---

## Service type: ad-campaign
- Added dynamically AFTER destructuring all request params
- Extra params accepted: platform, objective, tone, targetAudience, promoDetail
- Uses `response_format: { type: 'json_object' }` (GPT JSON mode) — no markdown stripping needed but fallback strip is included
- TikTok platform: imageSize = '1024x1792' (portrait); others: '1024x1024'
- JSON response shape: { headlines[3], primaryTextShort, primaryTextLong, description, ctaButton, hashtags[5], videoHooks[3] }

## Data storage
- generated_content: raw JSON string of AdPackage
- metadata JSONB: { platform, objective, tone, targetAudience, promoDetail }
- service_type: 'ad-campaign'
- content_type: 'combo'

## Frontend component
- `src/components/AIAdsGenerator.tsx` — parses generated_content as JSON via parseAdPackage()
- Accepts initialGeneration prop to reopen from history
- GenerationHistory shows ad-campaign rows with thumbnail + Open button (calls onViewAdCampaign prop)
- Dashboard wires the callback: sets selectedAdGeneration state + switches to 'ai-ads' tab

## Why
ad-campaign needed structured JSON output (multiple fields) rather than freeform text, requiring a different GPT call mode and custom post-processing.
