# Project It: hackathon MVP

Status: ready-for-agent

## Problem Statement

Companies get far more Candidates than they can screen, and resumes don't show what someone can actually do. Candidates send out applications and never hear back, with no way to prove their skills. Take-home assignments partly fix this, but they're long, unpaid, and sent to everyone.

## Solution

Project It is a screening platform built around short (about 1–2 hour), realistic Projects. Companies publish their own Projects or Sponsor Platform Projects written by Project It. Candidates complete Projects and submit their work along with a required Walkthrough video. AI turns each Submission into Evidence for each skill, and uses that Evidence to Match Candidates to Projects and Jobs. Companies see who fits each Job and why, review the actual work, and Shortlist people to interview. Humans always make the hiring decision. AI only organizes Evidence and suggests Matches, and it explains every suggestion instead of giving a percentage.

The demo must run end to end by 3:30pm:

1. Candidate Maria opens the Marketplace and sees "Recommended for you," with reasons.
2. She opens Broken Delivery Tracker, a Platform Project sponsored by Summit Logistics.
3. She submits a repository URL, a written explanation, and a Walkthrough video. AI Evidence appears.
4. Switch to Summit Logistics and open the Job "Software Engineering Intern." It shows Projects that test this Job's skills and Candidates who fit. Maria is listed, with reasons.
5. Open Maria's Submission: Walkthrough, deliverables, Evidence, Rubric, and follow-up interview questions. The reviewer overrides one Evidence level.
6. Shortlist Maria. Stretch goal: invite another matched Candidate to a private Project.

## User Stories

### Landing and identity

1. As a hackathon judge, I want the landing page to explain the product in about 15 seconds ("See what candidates can do, not just what their resumes say"), so that I get it right away.
2. As a visitor, I want two clear entry points, "I'm Hiring" and "I'm Looking for Opportunities," so that I land in the right experience.
3. As a demo presenter, I want to switch between seeded Candidate and Company accounts in one click, so that the demo never stalls on a login.
4. As a demo presenter, I want the app to start with realistic seed data, so that every screen looks full right away.

### Candidate: finding Projects

5. As a Candidate, I want a simple profile listing my skills, so that matching has something to start from before I've submitted anything.
6. As a Candidate, I want the Marketplace to show the public Projects I'm eligible for, so that I can find work to do.
7. As a Candidate, I want a "Recommended for you" section, so that I see the Projects that best fit my skills and Evidence first.
8. As a Candidate, I want each recommendation to say why it was made (e.g. "uses React and APIs; you have strong Debugging Evidence"), so that I trust the Match.
9. As a Candidate, I want each Project card to show the Company or Sponsor, skills, expected duration, deadline, and Visibility, so that I can decide quickly.
10. As a Candidate, I want to tell Platform Projects apart from Company Projects, and see who Sponsors them, so that I know whose attention I'll get.
11. As a Candidate, I want a Project detail page with the scenario, skills evaluated, expected time, deliverables, and deadline, so that I know what's expected before I start.
12. As a Candidate, I don't want to see Projects restricted to a university, region, or Invitation I don't qualify for, so that the Marketplace only shows what I can do.

### Candidate: doing and submitting

13. As a Candidate, I want to start a Project and see it as "in progress" on my dashboard, so that I can come back to it.
14. As a Candidate, I want a workspace with the instructions, resources, and starter files, so that I have what I need.
15. As a Candidate, I want to submit a repository URL, files, and a written explanation, so that my work is captured.
16. As a Candidate, I have to upload a Walkthrough video to submit, so that I can show I understand my own work.
17. As a Candidate, I want the Walkthrough prompt to tell me what to cover (approach, decisions, trade-offs, what went wrong, improvements, tools, how I checked it), so that I make a useful video.
18. As a Candidate, I can submit only once per Project, so that Evidence can't be gamed by resubmitting.
19. As a Candidate, I want to see my AI-assessed Evidence after I submit, so that I know which skills I showed.
20. As a Candidate, I want my dashboard to show available, in-progress, and submitted Projects, plus Invitations and Shortlists, so that I can track everything in one place.
21. As a Candidate, I want Evidence from Platform Projects to count toward my Matches even if no Company reviews them, so that doing Projects on my own still helps me.

### Company: Jobs and matching

22. As a Company, I want to create a Job with a title, description, and required and preferred skills, so that Project It knows what I'm looking for.
23. As a Company, I want the Job page to suggest Projects that test this Job's skills (my own and Platform Projects), so that I can screen with the right task.
24. As a Company, I want the Job page to list Candidates who fit, so that I can find people who have already shown the skills I need.
25. As a Company, I want each matched Candidate to come with reasons (e.g. "strong Testing, from Broken Delivery Tracker; AI-assessed"), so that I understand the Match without a black-box score.
26. As a Company, I want to see whether each piece of Evidence is AI-assessed or Company-reviewed, so that I know how much to trust it.
27. As a Company, I want to see a matched Candidate's Evidence summary but not their Submissions to other Companies' Projects, so that Candidate work stays private to whoever owns the Project.
28. As a Company, I want to send a matched Candidate an Invitation to a non-public Project, so that I only ask people who are likely to fit for their time.

### Company: Projects

29. As a Company, I want to create a Project by hand (title, scenario, instructions, skills, expected duration, difficulty, deliverables, Rubric, deadline, Visibility), so that I can screen for exactly what I need.
30. As a Company, I want to paste a job description and get extracted skills plus three Project ideas, then a full generated Project I can edit, so that writing a Project is fast. (Faked with a canned response today.)
31. As a Company, I want to edit everything the AI generates before I publish, so that I stay in control.
32. As a Company, I want to set Visibility to public, university, region, or invite-only, so that I control who can take part.
33. As a Company, I want to Sponsor a Platform Project, so that my name is on it and I can review its Submissions.
34. As a Company, I want a Project dashboard showing how many were invited, started, and completed, plus the deadline and Submissions, so that I can see how screening is going.
35. As a Company, I want my dashboard to show active Jobs, active Projects, Candidates who fit, Submissions, and my Shortlist, so that I see everything at a glance.

### Company: review

36. As a reviewer, I want a Candidate review screen showing the Candidate, Project, submission time, deliverables, and Walkthrough player, so that I can review the work in one place.
37. As a reviewer, I want Evidence for each skill (strong, partial, not shown, not assessed), so that I see what was and wasn't shown.
38. As a reviewer, I want to override any Evidence level, so that my judgment beats the AI's.
39. As a reviewer, I want to fill in the Rubric one category at a time and add notes, so that my Evaluation is structured.
40. As a reviewer, I want AI-suggested follow-up interview questions, so that the interview goes deeper.
41. As a reviewer, I don't want an overall candidate score anywhere, so that I judge the evidence instead of a number.
42. As a reviewer, I want to Shortlist a Candidate for an interview, so that I can move them forward.
43. As a reviewer, I want seeded strong, average, and incomplete Submissions, so that the review list shows a realistic range.

## Implementation Decisions

**Stack**
- Next.js (App Router) with TypeScript, Tailwind, and shadcn/ui. Server actions and route handlers; no separate backend.
- SQLite through Prisma. Seeded accounts and a role switcher instead of real auth.
- Files and Walkthrough videos are stored locally or as mock URLs. Upload only; no in-browser recording.

**Domain model (uses the CONTEXT.md names)**
- Candidate: name, profile, profile skills, university, region.
- Company: name, description, logo.
- Job: belongs to a Company; title, description, required skills, preferred skills, status.
- Project: owned by a Company, or by the platform when it's a Platform Project. Fields: title, scenario, instructions, skills, expected duration, difficulty, deliverables, deadline, Visibility (public, university, region, or invite-only, plus the target university or region), status, and a Rubric (a list of categories, each with a name and description).
- **There's no `Project.jobId`**, per ADR 0001. Jobs and Projects are connected only by matching.
- Sponsorship: links a Company to a Platform Project.
- Invitation: links a Project and a Candidate, with a status.
- Submission: Project, Candidate, written explanation, repository URL, file URLs, Walkthrough URL (required), submitted at, status. Only one per (Project, Candidate), enforced in the database.
- Evidence: Submission, skill, level (strong, partial, not shown, not assessed), source (AI-assessed or Company-reviewed), rationale. A Company-reviewed row replaces the AI-assessed level for that skill on that Submission.
- Evaluation: Submission, reviewer, Rubric results by category, notes, interview recommended.
- Shortlist: Company, Candidate, and optionally the Job or Submission that led to it.
- Follow-up questions are stored on the Submission when AI evaluation runs.

**Modules** (each one has its data access and rules behind a small public interface)
- **projects**: create, publish, sponsor, and list Projects. Visibility filtering decides which Candidates can see a Project.
- **submissions**: submit (checks a Walkthrough is present and blocks a second Submission), then runs AI evaluation to write AI-assessed Evidence and follow-up questions.
- **evidence**: gets a Candidate's Evidence profile, which takes the strongest level per skill across all Submissions, with a Company-reviewed level beating the AI's on the same Submission. Each entry records the Project it came from. Also handles reviewer overrides.
- **matching**: finds recommended Projects for a Candidate, Candidates who fit a Job, and Projects that test a Job. Every result includes reasons. Ranking is a deterministic score built from skill overlap and Evidence strength. The AI is only used to phrase the reasons, so matching still works if the AI is down. The score is used only for sorting and is never shown.
- **Visibility for matching**: Candidates who fit a Job are shown with an Evidence summary (skill, level, source, Project name). Submission details are only available to the Project's owner or its Sponsors.
- **review**: shows the Candidate review screen data, saves an Evaluation, and adds to the Shortlist.
- **ai (AIService)**: `extractJobSkills`, `generateProjectIdeas`, `generateProject`, `evaluateSubmission` (returns Evidence per skill plus follow-up questions), and `explainMatch`. A mock version returns canned responses and runs whenever there's no API key or a call fails. Project generation always uses the mock today.

**Screens**: landing, role switcher, Candidate dashboard, Marketplace (with Recommended for you), Project detail, workspace and submit, Company dashboard, Job create and detail (with Matches), Project create (manual, plus the faked AI generator), Project dashboard, and Candidate review (the most polished screen). Indigo is the platform color, blue for Company, green for Candidate, and teal for AI.

**Seed data**: Summit Logistics with the Job "Software Engineering Intern" (TypeScript, React, REST APIs, Debugging, Testing). The Platform Project Broken Delivery Tracker (90 minutes), sponsored by Summit. Two or three other Platform Projects (data, product). Candidate Maria, with profile skills and no Submission yet, so the demo creates hers. Three or four other Candidates with strong, average, and incomplete Submissions and their Evidence.

## Testing Decisions

- **One seam**: each module's public interface, called against a fresh test SQLite database with the mock AIService. Don't test UI, Prisma internals, or prompt text.
- A good test describes behavior in domain terms, for example: "a second Submission to the same Project is rejected," "a Company-reviewed level beats an AI-assessed one," "a Company can't see Submissions to a Project it doesn't own or Sponsor."
- Highest-value tests, in this order:
  1. matching: Maria is recommended Broken Delivery Tracker; Candidates who fit the Job are ranked by Evidence; every Match has reasons; restricted Projects are never recommended to ineligible Candidates.
  2. evidence: takes the strongest level per skill; overrides win.
  3. submissions: Walkthrough is required; one per Project; AI evaluation writes Evidence.
  4. Visibility and privacy rules.
- There's no existing code, so these tests set the pattern. Use Vitest. Given the deadline, write the matching and evidence tests first and skip the rest if time runs out.

## Out of Scope

- Project templates (other than Platform Projects) and job scraping or job discovery.
- A real AI project generator (faked with canned output today).
- Real authentication, payments, prizes, notifications, and email.
- In-browser video recording or video transcription.
- A "discoverable" opt-in for Candidates. This is **required before a real launch**: right now every Candidate with Evidence can show up in a Company's Matches.
- Competitions as a separate concept. A Platform Project with wide Visibility covers it.
- Resume parsing.

## Further Notes

- Glossary: `CONTEXT.md`. Decision record: `docs/adr/0001-projects-link-to-jobs-by-skills.md`.
- Never show a percentage or overall score anywhere in the UI.
- Cut order if time runs short: the Invitation flow, then the faked AI generator, then the Project dashboard counts.
