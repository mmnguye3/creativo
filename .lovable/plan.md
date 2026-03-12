

## Problem

All blog hero images use raw file paths like `/src/assets/resources/design-agency-hero.jpg` in the `resources.ts` data file. Vite's dev server serves these directly, but in **production builds**, the `/src/` directory doesn't exist — assets must be imported so Vite hashes and copies them to the build output.

## Solution

Import all hero images at the top of `src/data/resources.ts` and reference the imported variables instead of string paths.

### Changes in `src/data/resources.ts`:

1. Add imports at the top:
```ts
import designAgencyHero from "@/assets/resources/design-agency-hero.jpg";
import designTrends2025Hero from "@/assets/resources/design-trends-2025-hero.jpg";
import pricingDesignServicesHero from "@/assets/resources/pricing-design-services-hero.jpg";
import socialMediaMarketingHero from "@/assets/resources/social-media-marketing-hero.jpg";
import agencySuccessStoryHero from "@/assets/resources/agency-success-story-hero.jpg";
import uxUiBestPracticesHero from "@/assets/resources/ux-ui-best-practices-hero.jpg";
```

2. Replace each `heroImage: "/src/assets/resources/..."` string with the corresponding imported variable (e.g., `heroImage: designAgencyHero`).

No other files need changes.

