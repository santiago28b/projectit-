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
| GET | `/api/review` |
| PATCH | `/api/review/[submissionId]` |
| POST | `/api/shortlist` |

## Candidate review (Ticket 06)

- Company portal -> `/company/review` lists reviewable seeded Submissions.
- `/company/review/[submissionId]` shows deliverables, a Walkthrough, per-skill Evidence, a step-by-step Rubric, notes, follow-up questions, and Shortlisting.
- `/company/review/sample` works without Supabase. Sample edits persist in browser local storage and never write to the shared DB. The video is an illustrative reference, not a real Candidate Walkthrough; the repository URL is a placeholder.
- Live review needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Person A owns seed data and migrations; do not reset the shared DB.
- A seeded `company_admin` must link to its Company via `users.company_id` (once added by Person A), `profile_data.companyId`, or `profile_data.company_id`. That Company must own or Sponsor the Project through `company_projects`.
- Until Ticket 01's role switcher lands, reads choose a linked seeded reviewer. `GET /api/review` and `GET /api/review/[submissionId]` also accept `?reviewerId=<seeded-user-id>`. Writes include `reviewerId`; Company ownership/Sponsorship is checked server-side. This is a demo account-selection contract, not production authentication. Wire the role-switcher cookie into the controller when its name is finalized.
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
| `npm run db:push` | Push migrations to linked remote Supabase |
| `npm run db:start` | Optional local Supabase (Docker) |
