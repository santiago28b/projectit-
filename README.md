# Project It

Screening platform where Companies publish short Projects, Candidates submit work with a Walkthrough, and AI turns that into Evidence and Matches — with reasons, never a percentage.

Domain language: [`CONTEXT.md`](CONTEXT.md). Decisions: [`docs/adr/`](docs/adr/). MVP scope: [`.scratch/project-it-mvp/spec.md`](.scratch/project-it-mvp/spec.md).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Supabase** (Postgres + ready for Auth/Storage)
- **MVVM:** `src/client` · `src/server` · `src/shared` · thin `src/app` routes

## What each folder is

| Folder | Role |
|---|---|
| **`src/app/`** | Next.js **routing only** — pages and layouts. Thin: import a View, render it. Not where business logic lives. |
| **`src/client/`** | **UI layer (View + ViewModel)** — React components and hooks that call server actions. |
| **`src/server/`** | **Model / backend layer** — services, repositories, server actions, service-role Supabase admin. Runs on the server. |
| **`src/shared/`** | Code **both** client and server can import — domain types, constants, browser/SSR Supabase clients. No secrets. |

```
Views → ViewModels → Server Actions → Services → Repositories → Supabase
         (client)        (server)      (server)     (server)
```

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` → `.env.local` (already gitignored) and fill from Supabase → **Project Settings → API**:

   | Variable | Where |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (server only; needed for seed/admin) |
   | `OPENAI_API_KEY` | Optional — AIService mocks when empty |
   | `NEXT_PUBLIC_APP_URL` | Defaults to `http://localhost:3000` |

3. **Database**

   ```bash
   npx supabase login
   npx supabase link --project-ref opsbbycugtvmprytabxb
   npm run db:push
   ```

4. **Dev server**

   ```bash
   npm run dev
   ```

## Layout

```
src/
  app/                    # Next.js routes (landing, portals)
  client/
    views/                # presentational UI
    viewmodels/           # hooks → server actions
    components/           # UI primitives
  server/
    models/               # re-exports shared domain types
    repositories/         # Supabase data access
    services/             # business rules + AIService
    actions/              # server actions
    lib/supabase/admin.ts # service-role client only
  shared/
    models/               # domain types (CONTEXT.md)
    constants/
    env.ts                # public env helpers
    supabase/             # browser + SSR clients + session helper
supabase/migrations/      # Postgres schema + RLS stubs
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push migrations to linked Supabase |
| `npm run db:start` | Local Supabase (Docker) |
