---
name: OpenAI image model fallback
description: Newer OpenAI project keys lack dall-e-3; gpt-image-1 is the fallback but returns base64 only.
---
The rule: don't assume an OpenAI key can use `dall-e-3` — newer project-scoped keys often return "model does not exist". The generation fallback chain is fal.ai → dall-e-3 → gpt-image-1.

**Why:** The user's live OpenAI key has no dall-e-3 access, and the fal.ai account can hit "Exhausted balance" (403), so gpt-image-1 became the only working image path in production (July 2026).

**How to apply:** gpt-image-1 returns `b64_json` only (no hosted URL) and supports only 1024x1024/1024x1536/1536x1024 sizes; the edge function converts to a `data:image/png;base64,...` URL, which OpenAI image moderation and `ai_generations.image_url` both accept. If fal.ai is topped up, it becomes the primary again automatically.
