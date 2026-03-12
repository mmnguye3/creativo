

# Plan: Add "10 Design Trends That Will Dominate 2025" Article

## What to build
A full SEO-optimized article (~1300 words) for the existing resource entry `10-design-trends-2025`, matching the established style (hero image, orange italic h2s, stat cards, callouts, pull quotes, dividers).

## Changes

### 1. Generate hero image
Create `src/assets/resources/design-trends-2025-hero.jpg` — a vibrant, modern abstract design composition representing 2025 trends.

### 2. Update `src/data/resources.ts`
Replace the placeholder entry for `10-design-trends-2025` with:
- `heroImage` pointing to the new image
- Full HTML content covering all 10 trends with:
  - Introduction with stat grid (market size, AI adoption %, trend cycle speed)
  - 10 h2 sections, each with: what it is, why it matters, implementation tips
  - Visual example descriptions woven into each section
  - Callout boxes and pull quotes for key insights
  - Conclusion with actionable prep steps (key-takeaway block)
  - CTA linking to Creativo plans
- Uses same HTML classes: `article-stat-grid`, `article-callout`, `article-pullquote`, `article-divider`, `article-key-takeaway`

No other files need changes — the ResourceDetail page and CSS already support this format.

