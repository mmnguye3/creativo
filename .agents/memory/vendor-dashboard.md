---
name: Vendor Dashboard Layout
description: Architecture of the /dashboard route after Promage-inspired redesign.
---

## Layout
- File: `src/pages/Dashboard.tsx` (full-page, no Navbar wrapper)
- Auth guard: `useAuth()` → Navigate to /auth if !user
- Structure: zinc-950 sidebar + bg-[#FDF8F4] warm cream main area (identical shell to AdminDashboard)

## Nav sections (type Section)
overview | ai-generator | ai-ads | history | orders | projects | agency-settings | profile

## CTA button
"New Generation" → navigates to ai-generator section

## Overview component
- File: `src/components/dashboard/VendorOverview.tsx`
- Props: `onNavigate(section: string)`
- Queries: ai_generations WHERE user_id = user.id (count month + ad-campaign count + recent 6)
- Agency orders: agency_settings WHERE user_id = user.id → .id → customer_orders WHERE agency_id = that id
- Uses `.maybeSingle()` for agency query to avoid PGRST116 when no agency set up

## Existing components reused as-is
AIGenerator, AIAdsGenerator, GenerationHistory, OrderManagement, ClientProjects, AgencySettingsForm
- ProfileSection is inlined in Dashboard.tsx (not a separate file)
- selectedAdGeneration state + handleViewAdCampaign wired History → AI Ads (same as before)

## Responsive
- Desktop (>1024px): sidebar expanded (w-60)
- Tablet (≤1024px): sidebar auto-collapses to icons (w-[72px]) via MediaQueryList
- Mobile (<768px): sidebar hidden; hamburger opens overlay drawer; bottom nav shows first 5 sections
- main pb-20 on mobile to clear bottom nav bar

## Why
Vendors primarily on phones; same visual language as admin for brand consistency; warm cream bg
makes white content cards pop cleanly without needing dark glass cards.
