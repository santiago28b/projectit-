# Project It

Screening platform where Companies publish short Projects, Candidates submit work with a Walkthrough, and AI turns that into Evidence and Matches — with reasons, never a percentage.

Domain language: [`CONTEXT.md`](CONTEXT.md). Decisions: [`docs/adr/`](docs/adr/). MVP scope: [`.scratch/project-it-mvp/spec.md`](.scratch/project-it-mvp/spec.md).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Postgres** via Supabase (cloud by default; Docker optional)
- Architecture mirrors **Prometheus Portal**: client MVVM over HTTP + server routes/controllers/services/DAO

### Local vs staging / production DB

**Default: no Docker.** Next.js on your machine → remote Supabase Postgres (`.env.local`).

| Environment | What runs where |
|---|---|
| **Local** | `npm run dev` → remote Supabase (`.env.local`) |
| **Staging / Prod** | Deployed Next.js → Supabase (host env vars) |

## Architecture (Prometheus-style)

**Client (MVVM)** — views never call the DB:

```
views → viewmodels → services → repos (HTTP) → /api/*
```

**Server (not MVVM)** — App Router handlers are the route layer:

```
app/api/*/route.ts → controllers → services → database/dao → Supabase
```

| Folder | Role |
|---|---|
| **`src/app/`** | Pages (thin) + **`api/`** route handlers |
| **`src/client/views/`** | Presentational UI |
| **`src/client/viewmodels/`** | Hooks / screen state |
| **`src/client/services/`** | Thin wrappers over repos |
| **`src/client/repos/`** | HTTP clients to `/api/*` |
| **`src/server/controllers/`** | Parse request, call services, JSON response |
| **`src/server/services/`** | Business rules + AIService |
| **`src/server/database/dao/`** | Supabase data access |
| **`src/shared/`** | Domain types, public env, browser/SSR Supabase helpers |

## Setup

1. **Install** — `npm install`
2. **Env** — `cp .env.example .env.local` and fill Supabase URL + publishable key (+ service role for admin/seed)
3. **Schema + seed** — `npx supabase login && npx supabase link --project-ref <ref>`, then (Person A only) `npm run db:reseed`. Seeded IDs are in `src/shared/constants/seedIds.ts`
4. **Dev** — `npm run dev`

## Layout

```
src/
  app/
    api/                  # HTTP routes (marketplace, matching, submissions, …)
    candidate|company|admin/
  client/
    views/
    viewmodels/
    services/             # → repos
    repos/                # fetch /api/*
  server/
    controllers/
    services/
    database/dao/
    lib/supabase/admin.ts
  shared/
supabase/migrations/
```

## API stubs

| Method | Path |
|---|---|
| GET | `/api/marketplace?candidateId=` |
| GET | `/api/projects/[id]` |
| GET | `/api/matching/recommendations?candidateId=` |
| POST | `/api/submissions` |
| GET | `/api/review/[submissionId]` |
| POST | `/api/shortlist` |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:push` | Push migrations to linked remote Supabase (**Person A only**) |
| `npm run db:reseed` | **Person A only.** Wipes the shared DB, re-runs every migration, and loads `supabase/seed.sql` |
| `npm run db:start` | Optional local Supabase (Docker) |
