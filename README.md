# Project It

Screening platform where Companies publish short Projects, Candidates submit work with a Walkthrough, and AI turns that into Evidence and Matches — with reasons, never a percentage.

Domain language: [`CONTEXT.md`](CONTEXT.md). Decisions: [`docs/adr/`](docs/adr/). MVP scope: [`.scratch/project-it-mvp/spec.md`](.scratch/project-it-mvp/spec.md).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Supabase** (Postgres + ready-for Auth/Storage)
- **MVVM layout:** `src/client` (Views + ViewModels) · `src/server` (models, repositories, services, actions)

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill values from your [Supabase project](https://supabase.com/dashboard) → **Project Settings → API**:

   | Variable | Where |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (server only) |
   | `OPENAI_API_KEY` | Optional — AIService uses a mock when empty |
   | `NEXT_PUBLIC_APP_URL` | Defaults to `http://localhost:3000` |

3. **Database**

   Apply the initial migration to your linked project:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run db:push
   ```

   Or run a local stack: `npm run db:start`, then put the printed URL/keys into `.env.local`.

4. **Dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Layout

```
src/
  app/                 # thin routes (compose Views)
  client/
    views/             # presentational UI
    viewmodels/        # hooks → server actions
    components/        # shared UI
  server/
    models/            # domain types
    repositories/      # Supabase data access
    services/          # business rules + AIService
    actions/           # server actions
    lib/supabase/      # browser / SSR / admin clients
supabase/migrations/   # Postgres schema + RLS stubs
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push migrations to linked Supabase |
| `npm run db:start` | Local Supabase (Docker) |
