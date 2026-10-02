# Project It

Screening platform where Companies publish short Projects, Candidates submit work with a Walkthrough, and AI turns that into Evidence and Matches — with reasons, never a percentage.

Domain language: [`CONTEXT.md`](CONTEXT.md). Decisions: [`docs/adr/`](docs/adr/). MVP scope: [`.scratch/project-it-mvp/spec.md`](.scratch/project-it-mvp/spec.md).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Postgres everywhere** via Supabase — **not SQLite**
- **MVVM:** `src/client` · `src/server` · `src/shared` · thin `src/app` routes

### Local vs staging / production DB

**Default: no Docker.** Your laptop runs Next.js; the database is your Supabase cloud project (Postgres).

| Environment | What runs where |
|---|---|
| **Local** | `npm run dev` on your machine → remote Supabase (`.env.local`) |
| **Staging / Prod** | Deployed Next.js → same or separate Supabase project (host env vars) |

Optional later: `npm run db:start` (Docker) for a fully offline local Postgres. Not required.

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

2. **Environment (cloud Supabase — no Docker)**

   ```bash
   cp .env.example .env.local
   ```

   Fill from [Supabase](https://supabase.com/dashboard) → **Project Settings → API**:

   | Variable | Where |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` (server only; for seed/admin) |
   | `OPENAI_API_KEY` | Optional |
   | `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` locally |

3. **Push schema to your Supabase project**

   ```bash
   npx supabase login
   npx supabase link --project-ref opsbbycugtvmprytabxb
   npm run db:push
   ```

4. **Dev server**

   ```bash
   npm run dev
   ```

   Optional offline DB (Docker only if you want it later): `npm run db:start`.

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
| `npm run db:push` | Push migrations to linked remote Supabase |
| `npm run db:start` | Optional local Supabase stack (needs Docker) |
| `npm run db:stop` | Stop optional local stack |
| `npm run db:status` | Print local URL + keys (if Docker stack is running) |
| `npm run db:reset` | Reset optional local DB |
