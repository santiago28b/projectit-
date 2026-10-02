# Project It

Screening platform where Companies publish short Projects, Candidates submit work with a Walkthrough, and AI turns that into Evidence and Matches — with reasons, never a percentage.

Domain language: [`CONTEXT.md`](CONTEXT.md). Decisions: [`docs/adr/`](docs/adr/). MVP scope: [`.scratch/project-it-mvp/spec.md`](.scratch/project-it-mvp/spec.md).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Postgres** via `DATABASE_URL` + `pg` (Homebrew locally; host Postgres on staging)
- Architecture mirrors **Prometheus Portal**: client MVVM over HTTP + server routes/controllers/services/DAO

### Local vs staging DB

**No Docker. No Supabase.** Same SQL migrations everywhere; only `DATABASE_URL` changes.

| Environment | What runs where |
|---|---|
| **Local** | `npm run dev` → Homebrew Postgres (`DATABASE_URL` in `.env.local`) |
| **Staging** | EC2 + PM2 at [project-it.samirrodriguez.click](https://project-it.samirrodriguez.click) → Postgres on that host (`DATABASE_URL` in remote `.env`) |

### Deploy staging (EC2)

Same host/key pattern as Prometheus (`ec2-user` + `prometheus_key.pem`).

```bash
# One-time on the server: DNS + nginx (scripts/nginx/) + certbot,
# Postgres + DATABASE_URL in ~/project-it-staging/.env from scripts/env.staging.example

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
app/api/*/route.ts → controllers → services → database/dao → Postgres (pg)
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
| **`src/server/database/dao/`** | Postgres data access via `db` / `query` |
| **`src/shared/`** | Domain types, public env |

## Setup

1. **Install** — `npm install`
2. **Env** — `cp .env.example .env.local` and set `DATABASE_URL` (Homebrew user + `projectit` DB)
3. **DB** — `npm run db:create` then `npm run db:reset`
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
    lib/db.ts             # pg Pool
  shared/
supabase/migrations/      # SQL applied by npm run db:reset
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
| `npm run db:create` | Create the `projectit` database if missing |
| `npm run db:reset` | Drop public schema, apply migrations + seed |
| `npm run db:psql` | Open `psql` on `DATABASE_URL` |
| `npm run deploy:staging` | Lint, optional commit/push, publish to EC2 staging |
| `npm run publish:staging` | Build standalone + PM2 restart on EC2 |
| `npm run ssh:ec2` | SSH into the staging EC2 host |
