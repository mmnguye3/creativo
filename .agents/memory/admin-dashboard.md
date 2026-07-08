---
name: Admin Dashboard Layout
description: Architecture of the /admin route — sidebar layout, section routing, data sources.
---

## Layout
- File: `src/pages/AdminDashboard.tsx` (standalone page, not embedded in Dashboard.tsx)
- Route: `/admin` (in App.tsx, before the main Layout wrapper)
- Auth guard: `useAdmin()` hook; redirects to `/` if not admin
- Structure: left sidebar (zinc-950) + main content area (bg-[#FDF8F4] warm cream)

## Sidebar
- Logo: `/cretivo-logo.png` at `h-8 w-auto` (collapsed: shows orange "C" chip)
- Collapse: `sidebarCollapsed` state; auto-collapses on screens ≤1024px via MediaQueryList listener
- Mobile: overlay drawer triggered by hamburger; bottom nav bar shows 5 key sections
- Nav sections: overview, orders, agencies, ai-generations, users, subdomains, settings

## Overview panel
- File: `src/components/admin/AdminOverview.tsx`
- Receives `onNavigate(section)` prop to switch sections from within cards
- Data: parallel queries to customer_orders, ai_generations (count this month), agency_settings
- Components: StatCard, SemiCircleGauge (SVG-based), ProgressRing, workload bar + circle stacks

## Section content
- overview → AdminOverview
- orders → AllOrdersSection (inline, fetches all customer_orders, allows status updates)
- agencies / subdomains → SubdomainManagement (existing component, wrapped in white card)
- ai-generations → AIGenerationsSection (inline table with image preview dialog)
- users → UserManagement (existing component)
- settings → SettingsSection (platform health info)

## Why
The admin panel was redesigned from a simple tab interface to a full-screen sidebar layout matching a Promage-style reference screenshot, adapted to Cretivo orange accent.
