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
| **Staging** | EC2 + PM2 at [project-it.samirrodriguez.click](https://project-it.samirrodriguez.click) → same Supabase |
| **Prod** | Deployed Next.js → Supabase (host env vars) |

### Deploy staging (EC2)

Same host/key pattern as Prometheus (`ec2-user` + `prometheus_key.pem`).

```bash
# One-time on the server: DNS + nginx (scripts/nginx/) + certbot,
# then create ~/project-it-staging/.env from scripts/env.staging.example

npm run deploy:staging              # lint → optional commit → publish
npm run deploy:staging -- --no-commit
npm run publish:staging             # build + scp + pm2 only
npm run ssh:ec2                     # shell on the box
```

Override key/host with `EC2_KEY=...` / `EC2_HOST=...` if needed. Remote `.env` is never overwritten by publish.

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
3. **Schema** — `npx supabase link --project-ref <ref> && npm run db:push`
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
| `npm run db:push` | Push migrations to linked remote Supabase |
| `npm run db:start` | Optional local Supabase (Docker) |
| `npm run deploy:staging` | Lint, optional commit/push, publish to EC2 staging |
| `npm run publish:staging` | Build standalone + PM2 restart on EC2 |
| `npm run ssh:ec2` | SSH into the staging EC2 host |
