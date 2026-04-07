# Cretivo — White-Label Design Agency Platform

## Project Overview
A white-label agency platform where users can launch their own branded design agency site. Built with React + Vite + Tailwind CSS + shadcn/ui, using Supabase for authentication, database, and Edge Functions.

## Architecture
- **Frontend**: React 18 + TypeScript, Vite build tool
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Backend/BaaS**: Supabase (Auth, Postgres DB, Edge Functions, Storage)
- **Routing**: React Router DOM v7
- **State**: TanStack Query (server state), React Context (Auth, Cart, WhiteLabel)

## Key Features
- Main marketing site (Home, Services, Features, Pricing, About, Contact)
- User authentication (Sign up, Sign in, Reset password)
- User dashboard with AI content generator, generation history, client projects, order management, agency settings
- White-label agency sites accessible via `/:agencySlug` URL paths
- Admin dashboard for user/subdomain management and analytics
- Shopping cart and order submission for agency customers
- Invoice generation and email sending via Supabase Edge Functions

## Directory Structure
```
src/
  components/      # Reusable UI components (ui/, admin/, white-label specific)
  contexts/        # React contexts (AuthContext, CartContext, WhiteLabelContext)
  hooks/           # Custom hooks (useAdmin, useAgencySlug, useAuth)
  integrations/    # Supabase client setup
  pages/           # Route-level page components
  lib/             # Utility functions
supabase/
  functions/       # Edge Functions (generate-ai-content, send-invoice, submit-contact-form, admin-*)
  migrations/      # SQL migration files
```

## Supabase Configuration
- Project ID: `ukabvhdvfajudrtqnfpm`
- URL: `https://ukabvhdvfajudrtqnfpm.supabase.co`
- Anon key stored in `.env` as `VITE_SUPABASE_PUBLISHABLE_KEY`

## Development
- Dev server: `npm run dev` (runs on port 5000)
- Build: `npm run build`
- Preview built app: `npm run preview`

## Deployment
- Deployment target: Autoscale
- Build command: `npm run build`
- Run command: `npm run preview -- --port 5000 --host 0.0.0.0`

## Migration Notes (Lovable → Replit)
- Removed `lovable-tagger` dev dependency (Lovable-specific build plugin)
- Updated `vite.config.ts`: removed `componentTagger`, set host to `0.0.0.0`, port to `5000`, `allowedHosts: "all"` for Replit proxy compatibility
- The project remains a pure frontend Vite/React app connecting to the existing Supabase backend
- No server-side code needed — all backend logic lives in Supabase Edge Functions
