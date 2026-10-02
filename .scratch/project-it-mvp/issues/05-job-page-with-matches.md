# 05: Job page with Matches

**What to build:** As Summit Logistics, my dashboard shows active Jobs, active Projects, Candidates who fit, Submissions, and my Shortlist. I can create a Job (title, description, required and preferred skills). The Job page shows "Projects that test this Job" (my own Projects plus Platform Projects) and "Candidates who fit," each with an Evidence summary (skill, level, AI-assessed or Company-reviewed, Project name) and reasons. I can open a Submission only if my Company owns the Project or Sponsors it.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Company dashboard with the cards listed above
- [ ] Create a Job
- [ ] Job page lists matched Projects and Candidates, ranked, with reasons
- [ ] Candidate Evidence summary shows skill, level, source label, and Project name
- [ ] A Submission link appears only when the Company owns or Sponsors that Project
- [ ] Tests (pure functions): matching a Job to Candidates ranks by Evidence; the access rule rejects Submissions to Projects the Company doesn't own or Sponsor (ownership and sponsorship both come from `company_projects`)
