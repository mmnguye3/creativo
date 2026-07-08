# Cretivo — White-Label Design Agency Platform

A white-label agency platform where users can launch their own branded design agency site.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend/BaaS:** Supabase (Auth, Postgres, Edge Functions, Storage)
- **Routing:** React Router DOM v7
- **State:** TanStack Query + React Context

## Getting Started

```sh
# Install dependencies
npm install

# Start the development server
npm run dev
```

The dev server runs on port 5000.

## Build

```sh
npm run build
```

Output goes to the `dist/` folder.

## Project Structure

```
src/
  components/      # Reusable UI components
  contexts/        # React contexts (Auth, Cart, WhiteLabel)
  hooks/           # Custom hooks
  integrations/    # Supabase client setup
  pages/           # Route-level page components
  lib/             # Utility functions
supabase/
  functions/       # Edge Functions
  migrations/      # SQL migration files
```

## Environment Variables

Create a `.env` file with:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```
