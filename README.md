# Project It

Screening platform where Companies publish short Projects, Candidates submit work with a Walkthrough, and AI turns that into Evidence and Matches — with reasons, never a percentage.

Domain language: [`CONTEXT.md`](CONTEXT.md). Decisions: [`docs/adr/`](docs/adr/). MVP scope: [`.scratch/project-it-mvp/spec.md`](.scratch/project-it-mvp/spec.md).

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind
- **Postgres** via `DATABASE_URL` + `pg` (Homebrew locally; host Postgres on staging)
- Optional **Supabase JS** admin client when `DATABASE_BACKEND=supabase` (shared team cloud DB)
- Architecture mirrors **Prometheus Portal**: client MVVM over HTTP + server routes/controllers/services/DAO

### Local vs staging DB

Same SQL migrations everywhere; only `DATABASE_URL` (and optional Supabase env) changes.

| Environment | What runs where |
|---|---|
| **Local** | `npm run dev` → Homebrew Postgres (`DATABASE_URL` in `.env.local`) |
| **Staging** | EC2 + PM2 at [project-it.samirrodriguez.click](https://project-it.samirrodriguez.click) → Postgres on that host (`DATABASE_URL` in remote `.env`) |

### Database backend

DAOs pick a backend from env (default **`pg`**):

| Mode | When to use | Required env |
|---|---|---|
| `pg` (default) | Local Homebrew, EC2 Postgres, or Supabase **direct / pooler** connection string | `DATABASE_URL` |
| `supabase` | Joey-style `.from()` + service-role bypass of RLS | `DATABASE_BACKEND=supabase`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

Teammates on a shared Supabase project can often stay on **`pg`** and set `DATABASE_URL` to the Supabase connection string — no JS client required.

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
app/api/*/route.ts → controllers → services → database/dao → Postgres (pg) or Supabase admin
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
| **`src/server/database/dao/`** | Data access (`pg/` and `supabase/` implementations) |
| **`src/shared/`** | Domain types, public env |

## Setup

1. **Install** — `npm install`
2. **Env** — `cp .env.example .env.local` and set `DATABASE_URL` (Homebrew user + `projectit` DB). For optional Supabase JS mode, set `DATABASE_BACKEND=supabase` and the Supabase vars.
3. **DB** — `npm run db:create` then `npm run db:reset` (Person A after migration changes). Seeded demo accounts and fixed IDs live in `src/shared/constants/seedIds.ts`.
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
| GET | `/api/review` |
| PATCH | `/api/review/[submissionId]` |
| POST | `/api/shortlist` |

## Candidate review (Ticket 06)

- Company portal → `/company/review` lists reviewable seeded Submissions.
- `/company/review/[submissionId]` shows deliverables, a Walkthrough, per-skill Evidence, a step-by-step Rubric, notes, follow-up questions, and Shortlisting.
- Sample mode works without a DB write path: edits persist in browser local storage. The video/repo URL are placeholders.
- Live review uses the configured database backend (`pg` via `DATABASE_URL` by default, or `DATABASE_BACKEND=supabase` with service-role keys). Person A owns seed/migrations — run `npm run db:reset` after schema changes.
- A seeded `company_admin` must link to its Company via `users.company_id` (or `profile_data.companyId` / `company_id`). That Company must own or Sponsor the Project through `company_projects`.
- Prefer the role-switcher cookie for the current reviewer. `GET /api/review` and `GET /api/review/[submissionId]` also accept `?reviewerId=<seeded-user-id>`. Writes include `reviewerId`; Company ownership/Sponsorship is checked server-side.
- `PATCH /api/review/[submissionId]` accepts `action: "override"` with `reviewerId`, `skill`, `level`, `rationale`, or `action: "evaluation"` with `reviewerId`, `rubricResults`, `notes`, `interviewRecommended`.
- `POST /api/shortlist` accepts `companyId`, `candidateId`, `submissionId`, `reviewerId`, and optional `jobId`. Repeated sequential requests reuse an existing Shortlist entry.
- Overrides preserve AI Evidence and save separate Company-reviewed Evidence. The latest Company-reviewed row wins for that Submission's skill, even when its level is lower.
- Run focused tests with `npm test -- src/server/services/review.test.ts` (no DB required).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest tests |
| `npm run db:create` | Create the `projectit` database if missing |
| `npm run db:reset` | Drop public schema, apply migrations + seed |
| `npm run db:psql` | Open `psql` on `DATABASE_URL` |
| `npm run deploy:staging` | Lint, optional commit/push, publish to EC2 staging |
| `npm run publish:staging` | Build standalone + PM2 restart on EC2 |
| `npm run ssh:ec2` | SSH into the staging EC2 host |
