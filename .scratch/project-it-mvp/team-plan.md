# Team plan: 4 people, deadline 3:30pm

## Ground rules
- **Merge `setup` into `main` now.** From then on, work on short branches off `main`, one per ticket, and merge back at least every hour.
- **One shared Supabase DB → Person A owns the schema and the seed data.** Nobody else runs migrations or resets. If you need a column, ask A.
- **Role switcher = a cookie holding a seeded user id**, not Supabase Auth. Server code reads with the service-role (admin) client so RLS doesn't block the demo.
- **Matching is computed on the fly** (a deterministic formula plus AI-written reasons). Skip the `matches` table for now.
- **Real LLM for `evaluateSubmission` and `explainMatch`**, with the mock always as fallback. Project generation stays mocked. Keep the API key in `.env.local` only.
- **Use CONTEXT.md terms** in code and UI (Candidate, Evidence, Walkthrough, Sponsor…). Never show a % or an overall score.

## Phase 0: unblock (11:15 → 11:50)
| Person | Task |
|---|---|
| A | Ticket 01: seed data plus one reset-and-seed command. **Top priority.** Push as soon as it works |
| B | Ticket 01: role-switcher cookie, app shell and nav, shadcn/ui, role colors (indigo platform, blue Company, green Candidate, teal AI) |
| C | Ticket 04 core: Evidence profile + matching as **pure functions** with Vitest tests (no DB needed). Set up Vitest |
| D | Ticket 06: Candidate review screen UI against a hard-coded sample Submission; wire it to the DB once A's seed lands |

## Phase 1: lanes (11:50 → 2:30)
| Person | Lane | Tickets |
|---|---|---|
| A | Candidate flow | 02 Marketplace + detail → 03 Submit + Walkthrough + AI Evidence |
| B | Company Projects | 07 create, Sponsor, Project dashboard → 08 faked generator → 09 Invite (if time) |
| C | Matching | 04 Recommended for you (UI) → 05 Job page with Matches |
| D | Review + demo | 06 finish + Shortlist → 10 demo run-through, pitch, and the 15-second landing message |

Check-ins at **12:30** and **1:30** (5 min). Say what's merged and what's blocked; cut scope if anyone is behind.

## Phase 2: freeze (2:30 → 3:30)
- **2:30 feature freeze.** Only bug fixes after this.
- 2:30–3:00: run the 6-step demo from a fresh re-seed (D leads, everyone fixes their own lane).
- 3:00–3:30: rehearse the pitch twice and record a backup video of the demo in case live fails.

## Cut order if behind
09 Invite → 08 generator → Project dashboard counts → real AI (fall back to the mock).
