# 06: Candidate review and Shortlist

**What to build:** As a Summit reviewer, I open a Submission and see the Candidate, Project, submission time, deliverables (repo, files, explanation), and a Walkthrough player. I see Evidence for each skill (strong, partial, not shown, not assessed) with its source label, and I can override any level. I fill in the Rubric one category at a time, add notes, see AI-suggested follow-up interview questions, and Shortlist the Candidate. This is the most polished screen in the app. It works on seeded Submissions, so it doesn't wait on 03 or 05.

**Blocked by:** 01

**Status:** ready-for-human

- [x] Review screen shows the Candidate, Project, timestamp, deliverables, and Walkthrough player
- [x] Evidence for each skill with an AI-assessed or Company-reviewed label
- [ ] Override saves a Company-reviewed level that replaces the AI's
- [ ] Rubric Evaluation one category at a time, with notes, saves
- [x] Follow-up questions are shown
- [ ] The Shortlist button adds the Candidate to the Company's Shortlist
- [x] No overall score anywhere
- [x] Tests: override replaces the AI level; Shortlist is saved

## Comments

### 2026-10-02 - Person D implementation

Implemented the review list and workspace at `/company/review` and `/company/review/[submissionId]`, with a standalone sample at `/company/review/sample`. Includes Walkthrough playback (direct video, YouTube, Loom), safe external deliverable links, Company-reviewed Evidence overrides, one-category-at-a-time Rubric Evaluation, notes, AI follow-up questions, and Shortlisting. Server writes check Project ownership/Sponsorship and Candidate/Company consistency. No schema changes or DB resets.

Validation: ten focused Vitest tests pass; TypeScript and scoped ESLint pass. Browser checks at 1440px and 390px confirm sample overrides, Rubric/notes, interview recommendation, and Shortlist survive reload; no horizontal overflow.

Remaining unchecked acceptance items are implemented but need live seeded-DB verification after Ticket 01. This environment lacks `NEXT_PUBLIC_SUPABASE_URL`, so no shared DB writes were tested. Configure the Supabase service-role environment and seeded Company reviewer link, then verify an override, Evaluation and Shortlist survive a page reload. README documents the seed/account contract. The role-switcher cookie is still pending Ticket 01 and must be connected to review controller account selection when finalized.
