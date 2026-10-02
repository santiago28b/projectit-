# 01: Walking skeleton

**What to build:** The app runs, and you can switch between seeded accounts and see realistic data on every screen. This sets up the whole domain model from the spec (Candidate, Company, Job, Project, Platform Project, Sponsor, Invitation, Submission, Evidence, Evaluation, Shortlist), the seed data, a role switcher instead of real auth, the landing page, and an `AIService` with a mock that's on by default. There's deliberately no link from Project to Job (ADR 0001).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Next.js + TypeScript + Tailwind + shadcn/ui app runs locally; SQLite through Prisma
- [ ] Schema covers every entity in the spec, with a uniqueness rule of one Submission per (Project, Candidate) and no Project-to-Job link
- [ ] Seed data: Summit Logistics; Job "Software Engineering Intern" (TypeScript, React, REST APIs, Debugging, Testing); Platform Project Broken Delivery Tracker (90 min), sponsored by Summit; 2–3 other Platform Projects; Maria with profile skills and no Submissions; 3–4 other Candidates with strong, average, and incomplete Submissions and Evidence
- [ ] One-click role switcher between Maria and Summit Logistics (and other seeded accounts)
- [ ] Landing page: "See what candidates can do, not just what their resumes say," with I'm Hiring and I'm Looking for Opportunities buttons
- [ ] `AIService` has `extractJobSkills`, `generateProjectIdeas`, `generateProject`, `evaluateSubmission`, and `explainMatch`. The mock returns canned output and runs when there's no API key or a call fails
- [ ] Vitest set up with a fresh test database helper
- [ ] One command resets and re-seeds the database
