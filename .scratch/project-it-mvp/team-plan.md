# Team plan: 4 people, deadline 3:30pm

## Where we are (11:25)
- `setup` has the Next.js app (MVVM layout), the Supabase schema, the landing page, the AI mock, and service stubs. **`main` is still behind**, so merge `setup` into `main` first.
- Ticket 01 is half done. Still open: link Company users to their Company, seed data, the role switcher, Vitest, and the reset command.
- Tickets were updated to match the code: Supabase instead of SQLite, no "in progress"/"started" state (the schema doesn't have one), tests run on pure functions instead of a test DB, and sponsorship lives in `company_projects`.

## Ground rules
- **Branches:** one short branch per ticket off `main`; merge back at least every hour.
- **One shared DB → Person A owns migrations and the seed.** Migrations live in `supabase/migrations/` but apply via `npm run db:reset` + `DATABASE_URL` (local Homebrew, EC2, or a Supabase connection string). Optional: `DATABASE_BACKEND=supabase` for the service-role JS client. Nobody else runs a reset. If you need a column, ask A.
- **Role switcher = a cookie with a seeded user id**, not Supabase Auth. Server code reads through the configured database backend so RLS doesn't block the demo.
- **Matching is computed on the fly** (a deterministic formula plus AI-written reasons). Leave the `matches` table unused.
- **Real LLM for `evaluateSubmission` and `explainMatch`**, with the mock as fallback. Project generation stays mocked. Keep the key in `.env.local` only.
- **Every feature goes through the same layers:** route page → view + viewmodel (client) → server action → service (rules) → repository (Supabase). Put the rules in services as pure functions so they're testable.
- **Before touching routing or middleware, read the Next 16 docs in `node_modules/next/dist/docs/`.** This version has breaking changes (see AGENTS.md).
- Use CONTEXT.md terms. Never show a % or an overall score.

## Phase 0: unblock (11:30 → 12:00)
| Person | Task |
|---|---|
| A | Ticket 01: migration adding `company_id` to `users`, then the seed data, then the reset-and-seed command. **Top priority.** Push the moment the seed works |
| B | Ticket 01: role-switcher cookie and a "current user" helper on the server, the app shell and nav, shadcn/ui, role colors |
| C | Ticket 01 + 04 core: set up Vitest; write the Evidence-profile, matching, and eligibility rules as pure functions with tests |
| D | Ticket 06: Candidate review view + viewmodel against a hard-coded sample Submission; wire it to the repository once the seed lands |

## Phase 1: lanes (12:00 → 2:30)
| Person | Lane | Tickets |
|---|---|---|
| A | Candidate flow | 02 Marketplace + detail → 03 Submit + Walkthrough + AI Evidence |
| B | Company Projects | 07 create, Sponsor, Project dashboard → 08 faked generator → 09 Invite (if time) |
| C | Matching | 04 Recommended for you (UI) → 05 Job page with Matches |
| D | Review + demo | 06 finish + Shortlist → 10 demo run-through, pitch, 15-second landing message |

Check-ins at **12:30** and **1:30** (5 min each). Say what's merged and what's blocked; cut scope if anyone's behind.

## Phase 2: freeze (2:30 → 3:30)
- **2:30 feature freeze.** Only bug fixes after this.
- 2:30–3:00: run the 6-step demo from a fresh re-seed (A runs it, D leads, everyone fixes their own lane).
- 3:00–3:30: rehearse the pitch twice and record a backup video of the demo.

## Cut order if behind
09 Invite → 08 generator → Project dashboard counts → real AI (fall back to the mock).

## Not in scope
The `/admin` portal and the `platform_admin` role exist in the scaffold but aren't in the spec or demo. Leave them as stubs.
