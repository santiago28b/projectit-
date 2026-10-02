# 01: Walking skeleton

**What to build:** The app runs, and you can switch between seeded accounts and see realistic data on every screen. This sets up the whole domain model from the spec (Candidate, Company, Job, Project, Platform Project, Sponsor, Invitation, Submission, Evidence, Evaluation, Shortlist), the seed data, a role switcher instead of real auth, the landing page, and an `AIService` with a mock that's on by default. There's deliberately no link from Project to Job (ADR 0001).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Next.js + TypeScript + Tailwind app runs locally; **Postgres via Supabase** (cloud; no Docker). MVVM layout: `src/app`, `src/client`, `src/server`, `src/shared`. *(Changed from original SQLite/Prisma; shadcn/ui still pending.)*
- [x] Schema covers every entity in the spec, with a uniqueness rule of one Submission per (Project, Candidate) and no Project-to-Job link — see `supabase/migrations/20261002163702_init_schema.sql` (RLS on; push with `npm run db:push`)
- [ ] Seed data: Summit Logistics; Job "Software Engineering Intern" (TypeScript, React, REST APIs, Debugging, Testing); Platform Project Broken Delivery Tracker (90 min), sponsored by Summit; 2–3 other Platform Projects; Maria with profile skills and no Submissions; 3–4 other Candidates with strong, average, and incomplete Submissions and Evidence
- [ ] Company users are linked to their Company (the schema has no `users`→`companies` link yet; add a nullable `company_id` on `users` in a new migration)
- [ ] One-click role switcher between Maria and Summit Logistics (and other seeded accounts): a cookie holding a seeded user id, not Supabase Auth. Server reads use the admin client so RLS doesn't block the demo
- [x] Landing page: "See what candidates can do, not just what their resumes say," with I'm Hiring and I'm Looking for Opportunities buttons (`src/client/views/LandingView.tsx`; portal stubs at `/candidate`, `/company`, `/admin`)
- [x] `AIService` has `extractJobSkills`, `generateProjectIdeas`, `generateProject`, `evaluateSubmission`, and `explainMatch`. The mock returns canned output and runs when there's no API key or a call fails (`src/server/services/ai.ts`)
- [ ] Vitest set up for **pure functions** (matching, Evidence profile, eligibility). No test database: everyone shares one Supabase cloud DB
- [ ] One command resets and re-seeds the database. **Only the schema owner (Person A) runs it**, since the DB is shared

## Comments

### 2026-10-02 — Baseline scaffold done (partial)

Completed from the MVVM + Supabase baseline plan:

- Next.js App Router + TS + Tailwind; env (`.env.local` gitignored, `.env.example` committed)
- Supabase clients: browser/SSR in `src/shared/supabase`, service-role admin in `src/server/lib/supabase/admin.ts`
- Domain types + service/repository stubs for projects, submissions, evidence, matching, review, AI
- Landing + portal route placeholders

Still open on this ticket: seed data, role switcher, Vitest, reset/re-seed command, shadcn/ui.
