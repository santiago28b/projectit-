-- Project It demo seed (ticket 01).
-- Run with `npm run db:reset` (Person A only — wipes the DB and reloads migrations + seed).
-- Fixed IDs are mirrored in src/shared/constants/seedIds.ts:
--   1xx users · 2xx companies · 3xx candidates · 4xx projects · 5xx jobs · 6xx submissions
-- Skill names must match exactly across tables; matching compares strings.

-- Safe to paste into psql on an already-seeded DB.
truncate table
  public.users,
  public.companies,
  public.projects,
  public.matches
restart identity cascade;

-- ---------------------------------------------------------------------------
-- Companies
-- ---------------------------------------------------------------------------
insert into public.companies (id, name, description, website) values
  ('00000000-0000-0000-0000-000000000201', 'Summit Logistics',
   'Regional freight and last-mile delivery across the Mountain West. Our engineering team builds the tracking tools drivers and dispatchers use every day.',
   'https://summitlogistics.example.com'),
  ('00000000-0000-0000-0000-000000000202', 'Northwind Health',
   'Scheduling and patient-reminder software for independent clinics.',
   'https://northwindhealth.example.com');

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
insert into public.users (id, name, email, role, company_id, profile_data) values
  ('00000000-0000-0000-0000-000000000101', 'Maria Santos', 'maria.santos@example.com', 'candidate', null,
   '{"headline": "Computer science junior who likes making messy UIs reliable"}'),
  ('00000000-0000-0000-0000-000000000102', 'Dev Patel', 'dev.patel@example.com', 'candidate', null,
   '{"headline": "Full-stack student developer, TypeScript everywhere"}'),
  ('00000000-0000-0000-0000-000000000103', 'Aisha Okafor', 'aisha.okafor@example.com', 'candidate', null,
   '{"headline": "Bootcamp grad focused on front-end debugging"}'),
  ('00000000-0000-0000-0000-000000000104', 'Liam Chen', 'liam.chen@example.com', 'candidate', null,
   '{"headline": "Sophomore exploring web development"}'),
  ('00000000-0000-0000-0000-000000000105', 'Sofia Rossi', 'sofia.rossi@example.com', 'candidate', null,
   '{"headline": "Data analyst moving into backend engineering"}'),
  ('00000000-0000-0000-0000-000000000111', 'Jordan Lee', 'jordan.lee@summitlogistics.example.com', 'company_admin',
   '00000000-0000-0000-0000-000000000201', '{"title": "Engineering Manager"}'),
  ('00000000-0000-0000-0000-000000000112', 'Priya Shah', 'priya.shah@northwindhealth.example.com', 'company_admin',
   '00000000-0000-0000-0000-000000000202', '{"title": "Head of Engineering"}');

-- ---------------------------------------------------------------------------
-- Candidates (Maria has profile skills but no Submissions — the demo creates hers)
-- ---------------------------------------------------------------------------
insert into public.candidates (id, user_id, university, location, region, skills) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101',
   'University of Utah', 'Salt Lake City, UT', 'Mountain West',
   array['TypeScript', 'React', 'REST APIs', 'Debugging']),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102',
   'Arizona State University', 'Tempe, AZ', 'Southwest',
   array['TypeScript', 'React', 'REST APIs', 'Node.js', 'Testing']),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000103',
   'University of Washington', 'Seattle, WA', 'Pacific Northwest',
   array['React', 'Debugging', 'TypeScript']),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000104',
   'Brigham Young University', 'Provo, UT', 'Mountain West',
   array['React', 'TypeScript']),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000105',
   'University of Texas at Austin', 'Austin, TX', 'South Central',
   array['SQL', 'Python', 'Data Cleaning', 'Node.js']);

-- ---------------------------------------------------------------------------
-- Projects (no job_id on purpose — ADR 0001)
-- ---------------------------------------------------------------------------
insert into public.projects (
  id, title, scenario, description, instructions, type, visibility, visibility_target,
  expected_duration_minutes, difficulty, skills, deliverables, deadline, status, created_by
) values
  ('00000000-0000-0000-0000-000000000401', 'Broken Delivery Tracker',
   'Dispatchers say the delivery tracker shows packages as "Delivered" before the driver arrives, and the list sometimes goes blank after a refresh. Customers are calling support.',
   'Find and fix the bugs in a small React + TypeScript delivery tracker that reads from a REST API, then add tests so they stay fixed.',
   E'1. Clone the starter repo and run it.\n2. Reproduce the wrong "Delivered" status and the blank list.\n3. Fix both bugs and explain the root cause.\n4. Add tests that would have caught them.\n5. Record a Walkthrough covering your approach, decisions, and trade-offs.',
   'platform', 'public', null, 90, 'Intermediate',
   array['TypeScript', 'React', 'REST APIs', 'Debugging', 'Testing'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '14 days', 'published', 'platform'),
  ('00000000-0000-0000-0000-000000000402', 'Clean Up the Sales Dashboard',
   'The weekly sales dashboard double-counts refunds and leaves gaps where regions changed names. Leadership no longer trusts it.',
   'Clean a messy sales export with SQL or Python and rebuild two charts leadership can trust.',
   E'1. Load the CSV export.\n2. Fix duplicates, refunds, and renamed regions.\n3. Rebuild the revenue-by-region and weekly-trend charts.\n4. Explain each cleaning decision in your Walkthrough.',
   'platform', 'public', null, 75, 'Beginner',
   array['SQL', 'Python', 'Data Cleaning', 'Data Visualization'],
   array['Notebook or SQL file', 'Written explanation', 'Walkthrough video'],
   now() + interval '21 days', 'published', 'platform'),
  ('00000000-0000-0000-0000-000000000403', 'Prioritize the Feature Backlog',
   'A small team has 14 feature requests, two engineers, and one quarter. Sales, support, and the CEO all want different things.',
   'Turn a backlog and a pile of user feedback into a ranked plan for the quarter, with your reasoning.',
   E'1. Read the backlog and the feedback notes.\n2. Pick a prioritization method and apply it.\n3. Write a one-page plan with what you would cut and why.\n4. Walk through your trade-offs in the Walkthrough.',
   'platform', 'public', null, 60, 'Beginner',
   array['Product Thinking', 'Prioritization', 'Written Communication'],
   array['One-page plan', 'Walkthrough video'],
   now() + interval '21 days', 'published', 'platform'),
  ('00000000-0000-0000-0000-000000000404', 'Accessible Checkout Form',
   'A checkout form fails a screen-reader audit: unlabeled fields, a keyboard trap in the address picker, and errors announced only by color.',
   'Fix the accessibility issues in a React checkout form and add tests for them.',
   E'1. Run the starter app with a screen reader or axe.\n2. Fix labels, focus order, and error messaging.\n3. Add tests for the fixes.\n4. Explain what you prioritized in your Walkthrough.',
   'platform', 'university', 'Arizona State University', 60, 'Intermediate',
   array['React', 'Accessibility', 'Testing'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '10 days', 'published', 'platform'),
  ('00000000-0000-0000-0000-000000000405', 'Lift-Line Wait Times Report',
   'A group of Mountain West ski resorts wants to know why weekend lift lines are twice as long as last season, and what to change before peak season.',
   'Query a season of lift-scan data, chart where and when lines build up, and write a short recommendation.',
   E'1. Load the lift-scan export into SQL.\n2. Find the lifts and hours where waits grew the most.\n3. Chart the two findings that matter most.\n4. Write a half-page recommendation and walk through it in your Walkthrough.',
   'platform', 'region', 'Mountain West', 60, 'Beginner',
   array['SQL', 'Data Visualization', 'Written Communication'],
   array['SQL file or notebook', 'Written explanation', 'Walkthrough video'],
   now() + interval '12 days', 'published', 'platform'),
  ('00000000-0000-0000-0000-000000000411', 'Appointment Reminder API',
   'Clinics miss appointments because reminder texts go out at the wrong time across time zones.',
   'Build a small Node.js REST API that schedules appointment reminders correctly across time zones.',
   E'1. Design the endpoints for creating appointments and listing due reminders.\n2. Store data in SQL.\n3. Handle time zones correctly and test the edge cases.\n4. Record a Walkthrough.',
   'company', 'invite', null, 120, 'Intermediate',
   array['Node.js', 'REST APIs', 'SQL', 'Testing'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '7 days', 'published', '00000000-0000-0000-0000-000000000112');

-- Summit Sponsors Broken Delivery Tracker; Northwind owns its own Project.
insert into public.company_projects (company_id, project_id, relationship_type) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000401', 'sponsor'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000411', 'owner');

insert into public.rubrics (project_id, criteria) values
  ('00000000-0000-0000-0000-000000000401', '[
    {"name": "Correctness", "description": "Both bugs are fixed and nothing else broke."},
    {"name": "Debugging approach", "description": "Found the root cause methodically instead of guessing."},
    {"name": "Code quality", "description": "Changes are small, typed, and easy to read."},
    {"name": "Testing", "description": "Tests reproduce the bugs and would catch a regression."},
    {"name": "Communication", "description": "The Walkthrough explains decisions and trade-offs clearly."}
  ]'),
  ('00000000-0000-0000-0000-000000000402', '[
    {"name": "Data quality", "description": "Duplicates, refunds, and renamed regions are handled."},
    {"name": "Charts", "description": "Charts answer the question and are honest."},
    {"name": "Communication", "description": "Cleaning decisions are explained."}
  ]'),
  ('00000000-0000-0000-0000-000000000403', '[
    {"name": "Reasoning", "description": "The ranking follows from a clear method."},
    {"name": "Trade-offs", "description": "Says what gets cut and why."},
    {"name": "Writing", "description": "The plan is short and easy to act on."}
  ]'),
  ('00000000-0000-0000-0000-000000000404', '[
    {"name": "Accessibility fixes", "description": "Labels, focus order, and errors work with a screen reader."},
    {"name": "Testing", "description": "Tests cover the fixed issues."}
  ]'),
  ('00000000-0000-0000-0000-000000000405', '[
    {"name": "Analysis", "description": "Queries find where and when waits grew, not just averages."},
    {"name": "Charts", "description": "Charts make the two findings obvious."},
    {"name": "Recommendation", "description": "Advice follows from the data and is easy to act on."}
  ]'),
  ('00000000-0000-0000-0000-000000000411', '[
    {"name": "API design", "description": "Endpoints are clear and consistent."},
    {"name": "Time zones", "description": "Reminders fire at the right local time."},
    {"name": "Testing", "description": "Edge cases like DST changes are tested."}
  ]');

-- Workspace starter files and resources (ticket 03). Links are placeholders for the demo.
update public.projects set resources = '[
  {"label": "Starter repo: delivery-tracker", "url": "https://github.com/project-it-demo/broken-delivery-tracker", "kind": "starter"},
  {"label": "Mock deliveries API (OpenAPI spec)", "url": "https://github.com/project-it-demo/broken-delivery-tracker/blob/main/api/openapi.yaml", "kind": "starter"},
  {"label": "React docs: Synchronizing with Effects", "url": "https://react.dev/learn/synchronizing-with-effects", "kind": "reference"},
  {"label": "Vitest getting started", "url": "https://vitest.dev/guide/", "kind": "reference"}
]' where id = '00000000-0000-0000-0000-000000000401';

update public.projects set resources = '[
  {"label": "sales_export.csv", "url": "https://github.com/project-it-demo/sales-dashboard/blob/main/data/sales_export.csv", "kind": "starter"},
  {"label": "Region rename notes", "url": "https://github.com/project-it-demo/sales-dashboard/blob/main/docs/regions.md", "kind": "starter"},
  {"label": "pandas: Duplicate labels", "url": "https://pandas.pydata.org/docs/user_guide/duplicates.html", "kind": "reference"}
]' where id = '00000000-0000-0000-0000-000000000402';

update public.projects set resources = '[
  {"label": "Backlog and feedback notes", "url": "https://github.com/project-it-demo/feature-backlog/blob/main/backlog.md", "kind": "starter"},
  {"label": "RICE prioritization overview", "url": "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/", "kind": "reference"}
]' where id = '00000000-0000-0000-0000-000000000403';

update public.projects set resources = '[
  {"label": "Starter repo: checkout-form", "url": "https://github.com/project-it-demo/accessible-checkout", "kind": "starter"},
  {"label": "WAI-ARIA Authoring Practices", "url": "https://www.w3.org/WAI/ARIA/apg/", "kind": "reference"}
]' where id = '00000000-0000-0000-0000-000000000404';

update public.projects set resources = '[
  {"label": "lift_scans.sql (one season)", "url": "https://github.com/project-it-demo/lift-lines/blob/main/data/lift_scans.sql", "kind": "starter"},
  {"label": "PostgreSQL: Window functions", "url": "https://www.postgresql.org/docs/current/tutorial-window.html", "kind": "reference"}
]' where id = '00000000-0000-0000-0000-000000000405';

update public.projects set resources = '[
  {"label": "Starter repo: reminder-api", "url": "https://github.com/project-it-demo/appointment-reminders", "kind": "starter"},
  {"label": "MDN: Intl.DateTimeFormat time zones", "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat", "kind": "reference"}
]' where id = '00000000-0000-0000-0000-000000000411';

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
insert into public.jobs (id, company_id, title, description, required_skills, preferred_skills, status) values
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000201',
   'Software Engineering Intern',
   'Join the team that builds Summit''s driver and dispatcher tracking tools. You''ll fix real bugs, ship small features, and write tests.',
   array['TypeScript', 'React', 'REST APIs', 'Debugging', 'Testing'],
   array['SQL', 'Written Communication'], 'open'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000202',
   'Junior Backend Developer',
   'Build and maintain the APIs behind Northwind''s scheduling and reminder products.',
   array['Node.js', 'REST APIs', 'SQL', 'Testing'],
   array['TypeScript'], 'open');

-- ---------------------------------------------------------------------------
-- Invitations
-- ---------------------------------------------------------------------------
insert into public.invitations (project_id, candidate_id, invited_by, status) values
  ('00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000305',
   '00000000-0000-0000-0000-000000000202', 'accepted');

-- ---------------------------------------------------------------------------
-- Submissions: strong (Dev), average (Aisha), incomplete (Liam), plus Sofia's two
-- ---------------------------------------------------------------------------
insert into public.submissions (
  id, project_id, candidate_id, written_response, repository_url, video_url,
  follow_up_questions, status, submitted_at
) values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000302',
   'The "Delivered" bug came from comparing the ETA string to the current time as text, so any ETA earlier in the alphabet looked past. I parsed both into Dates and moved the status logic into a pure function. The blank list was a race: a slow first request overwrote the fresh one, so I cancel stale requests with AbortController. I added unit tests for the status function and a test that simulates out-of-order responses.',
   'https://github.com/example/dev-patel-delivery-tracker',
   'https://example.com/walkthroughs/dev-bdt.mp4',
   array[
     'How would you handle a driver whose phone clock is wrong?',
     'Why AbortController instead of ignoring stale responses with a request ID?',
     'What would you test next if you had another hour?'
   ],
   'completed', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000303',
   'I found the blank list happens when two fetches finish out of order and fixed it by tracking the latest request. I fixed the Delivered status by converting the ETA to a Date. I ran out of time before writing tests.',
   'https://github.com/example/aisha-okafor-delivery-tracker',
   'https://example.com/walkthroughs/aisha-bdt.mp4',
   array[
     'Walk me through how you reproduced the blank list.',
     'Which tests would you write first, and why?'
   ],
   'submitted', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000304',
   'I got the app running and tried a few fixes for the status label but could not find why it was wrong.',
   null,
   'https://example.com/walkthroughs/liam-bdt.mp4',
   array[
     'Where did you look first when the status was wrong?',
     'What would you try next?'
   ],
   'submitted', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000305',
   'I deduplicated orders on order_id, netted refunds against their original sale, and mapped old region names to new ones with a lookup table. The weekly trend now uses ISO weeks so the last partial week is not shown as a drop.',
   'https://github.com/example/sofia-rossi-sales-dashboard',
   'https://example.com/walkthroughs/sofia-sales.mp4',
   array[
     'How would you keep the region lookup up to date?',
     'Why hide the partial week instead of labeling it?'
   ],
   'submitted', now() - interval '5 days'),
  ('00000000-0000-0000-0000-000000000605', '00000000-0000-0000-0000-000000000411', '00000000-0000-0000-0000-000000000305',
   'I store appointment times in UTC with the clinic''s IANA time zone and compute reminder times at query time, which handles DST. Endpoints: POST /appointments and GET /reminders/due. I tested DST transitions for two time zones.',
   'https://github.com/example/sofia-rossi-reminders',
   'https://example.com/walkthroughs/sofia-reminders.mp4',
   array[
     'What happens if a clinic changes its time zone?',
     'How would this scale to a million reminders a day?'
   ],
   'under_review', now() - interval '2 days');

-- ---------------------------------------------------------------------------
-- Evidence (AI-assessed, plus one Company-reviewed override on Dev's Testing)
-- ---------------------------------------------------------------------------
insert into public.evidence (candidate_id, submission_id, skill, level, source, rationale) values
  -- Dev: strong
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000601', 'TypeScript', 'strong', 'ai',
   'Typed the status logic as a pure function with explicit Date handling.'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000601', 'React', 'strong', 'ai',
   'Fixed the stale-render race inside the component without extra state.'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000601', 'REST APIs', 'strong', 'ai',
   'Cancelled stale requests with AbortController and handled API errors.'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000601', 'Debugging', 'strong', 'ai',
   'Traced both bugs to their root causes and explained them in the Walkthrough.'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000601', 'Testing', 'partial', 'ai',
   'Added unit tests for the status function; the race test is light.'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000601', 'Testing', 'strong', 'company',
   'Reviewer: the out-of-order response test would catch a regression. Upgraded to strong.'),
  -- Aisha: average
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000602', 'TypeScript', 'partial', 'ai',
   'Fix compiles but relies on a few any types.'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000602', 'React', 'partial', 'ai',
   'Fixed the race with a ref but left the effect hard to follow.'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000602', 'REST APIs', 'partial', 'ai',
   'Tracks the latest request but does not handle API errors.'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000602', 'Debugging', 'strong', 'ai',
   'Reproduced the blank list reliably and explained the out-of-order fetches.'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000602', 'Testing', 'not_shown', 'ai',
   'No tests were included.'),
  -- Liam: incomplete
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000603', 'TypeScript', 'partial', 'ai',
   'Got the project running and made small typed edits.'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000603', 'React', 'not_assessed', 'ai',
   'Not enough code changed to assess.'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000603', 'REST APIs', 'not_shown', 'ai',
   'Did not reach the API layer.'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000603', 'Debugging', 'not_shown', 'ai',
   'Neither bug was found.'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000603', 'Testing', 'not_shown', 'ai',
   'No tests were included.'),
  -- Sofia: Sales Dashboard
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000604', 'SQL', 'strong', 'ai',
   'Deduplicated and netted refunds with clear, correct queries.'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000604', 'Python', 'strong', 'ai',
   'Built a tidy cleaning pipeline in a notebook.'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000604', 'Data Cleaning', 'strong', 'ai',
   'Handled duplicates, refunds, and renamed regions and explained each choice.'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000604', 'Data Visualization', 'partial', 'ai',
   'Charts are correct but unlabeled axes make them harder to read.'),
  -- Sofia: Appointment Reminder API (Northwind's Project)
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000605', 'Node.js', 'partial', 'ai',
   'Working Express server; error handling is thin.'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000605', 'REST APIs', 'strong', 'ai',
   'Clean, consistent endpoints with sensible status codes.'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000605', 'SQL', 'strong', 'ai',
   'Stores UTC times with the time zone and queries due reminders efficiently.'),
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000605', 'Testing', 'partial', 'ai',
   'Tests DST transitions for two zones; no API-level tests.');

-- ---------------------------------------------------------------------------
-- Review: one Evaluation and one Shortlist so Summit's dashboard isn't empty
-- (Rubric results are qualitative — never a number.)
-- ---------------------------------------------------------------------------
insert into public.evaluations (submission_id, reviewer_id, rubric_results, notes, interview_recommended) values
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000111',
   '{
     "Correctness": "Both bugs fixed; nothing else broke.",
     "Debugging approach": "Methodical: reproduced, isolated, then fixed.",
     "Code quality": "Small, well-typed changes.",
     "Testing": "Good regression tests, especially the race.",
     "Communication": "Clear Walkthrough with honest trade-offs."
   }',
   'Strong all round. Ask about clock skew on driver phones in the interview.',
   true);

insert into public.shortlists (company_id, candidate_id, job_id, submission_id) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000302',
   '00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000601');

-- Walkthrough Transcripts for the Broken Delivery Tracker Submissions, and their
-- Communication Evidence. Seeded Submissions were assessed before the demo, so
-- they're marked done; only new Submissions run the real Assessment.
update public.submissions set transcript =
  'Hi, I''m Dev. Two bugs. First, Delivered showed up early because the ETA came back as a string and we compared it to the current time as text, so the comparison was alphabetical. I parse both into Dates and moved the status rule into a pure function, which made it easy to test. Second, the blank list was a race: if the first request was slow it overwrote the newer one. I cancel the stale request with AbortController instead of tracking request IDs, because it also stops wasted work. I added unit tests for the status function and one that returns responses out of order. If I had more time I''d handle drivers whose phone clocks are wrong.'
  where id = '00000000-0000-0000-0000-000000000601';

update public.submissions set transcript =
  'So the list went blank sometimes, and I figured out it was two fetches finishing in the wrong order, so I keep track of the latest request and ignore older ones. The Delivered label was wrong because of the date, so I convert the ETA to a Date now. I also added a test for the race condition. That''s about it.'
  where id = '00000000-0000-0000-0000-000000000602';

update public.submissions set transcript =
  'I got the app running. The status label was wrong and I tried changing a few things in the component but I couldn''t figure out why. I think it might be the API.'
  where id = '00000000-0000-0000-0000-000000000603';

update public.submissions
  set assessment_status = 'done', assessed_at = submitted_at + interval '1 minute';

insert into public.evidence (candidate_id, submission_id, skill, level, source, rationale) values
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000601', 'Communication', 'strong', 'ai',
   'Transcript: explains both root causes, why AbortController over request IDs, and what they would do next; matches the code and tests.'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000602', 'Communication', 'partial', 'ai',
   'Transcript: describes the fixes but not the reasoning. It says a race-condition test was added, but the written explanation says there was no time for tests.'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000603', 'Communication', 'partial', 'ai',
   'Transcript: honest about what was tried, but doesn''t explain an approach or a next step.');
