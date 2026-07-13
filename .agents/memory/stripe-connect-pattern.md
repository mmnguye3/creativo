---
name: Stripe Connect pattern
description: How Stripe Connect Express is wired in the Cretivo Supabase edge functions — destination charges, SDK import, webhook handling.
---

## Pattern: Destination charges (not direct charges)

Platform Stripe account creates the Checkout Session. Funds flow: customer → platform account → connected account (minus application_fee_amount). This keeps ALL webhook events on the platform account, so a single webhook endpoint + secret covers everything.

```ts
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check=true";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});
// Checkout Session — destination charge
const session = await stripe.checkout.sessions.create({
  payment_intent_data: {
    application_fee_amount: Math.round(priceCents * 0.10),
    transfer_data: { destination: stripeAccountId },
  },
  ...
});
```

## Webhook signature verification in Deno
```ts
const body = await req.text();  // must be raw text, not parsed
const event = await stripe.webhooks.constructEventAsync(body, sig!, webhookSecret);
```

## Required Supabase edge function secrets
- `STRIPE_SECRET_KEY` — `sk_test_…` for test mode, swap to `sk_live_…` for production
- `STRIPE_WEBHOOK_SECRET` — `whsec_…` from Stripe Dashboard → Webhooks (register the stripe-webhook fn URL)

**Why:** `constructEventAsync` needs the raw body before JSON parsing. Direct charges would require per-connected-account webhooks — too complex. Destination charges + platform-level webhook is simpler and sufficient.

**How to apply:** Any new payment-related edge functions in this project should follow the same destination-charge model and import from esm.sh with `?target=deno&no-check=true`.
