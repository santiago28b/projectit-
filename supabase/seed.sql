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
-- More Projects for browsing and matching (406–410, 412–450). These have no
-- named entries in seedIds.ts; nothing in the demo script depends on them.
-- 406–442 are Platform Projects, 443–446 are Summit's, 447–450 are Northwind's.
-- ---------------------------------------------------------------------------
insert into public.projects (
  id, title, scenario, description, instructions, type, visibility, visibility_target,
  expected_duration_minutes, difficulty, skills, deliverables, deadline, status, created_by, resources
) values
  ('00000000-0000-0000-0000-000000000406', 'Flaky CI Pipeline',
   'Every third pull request fails CI for no obvious reason, and engineers have started clicking "re-run" until it goes green.',
   'Find out why a GitHub Actions pipeline fails at random, fix the root causes, and make the pipeline faster while you are in there.',
   E'1. Fork the starter repo and look at the last 20 CI runs.\n2. Find the tests or steps that fail at random and why.\n3. Fix them and add caching so the pipeline runs faster.\n4. Record a Walkthrough explaining each root cause.',
   'platform', 'public', null, 60, 'Intermediate',
   array['CI/CD', 'Testing', 'Debugging', 'Git'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '20 days', 'published', 'platform',
   '[{"label": "Starter repo: flaky-ci", "url": "https://github.com/project-it-demo/flaky-ci", "kind": "starter"},
     {"label": "GitHub Actions documentation", "url": "https://docs.github.com/en/actions", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000407', 'Containerize a Legacy Flask App',
   'A five-year-old Flask app only runs on one engineer''s laptop. Nobody else can start it, and that engineer is going on leave.',
   'Write a Dockerfile and a compose file so anyone can run the app and its database with one command.',
   E'1. Get the app running locally and note every hidden dependency.\n2. Write a small, cached Dockerfile.\n3. Add a docker-compose file with the Postgres database.\n4. Explain your image choices in your Walkthrough.',
   'platform', 'public', null, 75, 'Beginner',
   array['Docker', 'Python', 'Debugging'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '25 days', 'published', 'platform',
   '[{"label": "Starter repo: legacy-flask", "url": "https://github.com/project-it-demo/legacy-flask", "kind": "starter"},
     {"label": "Docker: Get started", "url": "https://docs.docker.com/get-started/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000408', 'Rate Limiter for a Public API',
   'A single customer''s script is hammering the public API and slowing it down for everyone else.',
   'Add per-key rate limiting to a small Node.js REST API, with clear 429 responses and tests.',
   E'1. Pick a rate-limiting algorithm and explain why.\n2. Add it as middleware keyed by API key.\n3. Return 429 with a Retry-After header.\n4. Test the limits and walk through your design in the Walkthrough.',
   'platform', 'public', null, 90, 'Intermediate',
   array['Node.js', 'REST APIs', 'System Design', 'Testing'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '18 days', 'published', 'platform',
   '[{"label": "Starter repo: public-api", "url": "https://github.com/project-it-demo/rate-limiter", "kind": "starter"},
     {"label": "MDN: 429 Too Many Requests", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000409', 'Slow Product Search Query',
   'Product search takes eight seconds on the busiest day of the year, and the store loses sales every time it times out.',
   'Use EXPLAIN to find why a product search query is slow, then fix it with indexes or a rewrite.',
   E'1. Load the products dump into Postgres.\n2. Run EXPLAIN ANALYZE on the search query.\n3. Make it fast without changing its results.\n4. Show before-and-after plans in your Walkthrough.',
   'platform', 'public', null, 60, 'Intermediate',
   array['SQL', 'Performance', 'Debugging'],
   array['SQL file', 'Written explanation', 'Walkthrough video'],
   now() + interval '15 days', 'published', 'platform',
   '[{"label": "products_dump.sql", "url": "https://github.com/project-it-demo/slow-search/blob/main/data/products_dump.sql", "kind": "starter"},
     {"label": "PostgreSQL: Using EXPLAIN", "url": "https://www.postgresql.org/docs/current/using-explain.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000410', 'Responsive Landing Page Rescue',
   'The new landing page looks great on a laptop, but on phones the buttons overlap and the pricing table scrolls sideways.',
   'Fix the layout of a React landing page so it works from phone to desktop without breaking accessibility.',
   E'1. Open the page at phone, tablet, and desktop widths.\n2. Fix the overlapping buttons and the pricing table.\n3. Check color contrast and focus styles.\n4. Walk through your layout choices in the Walkthrough.',
   'platform', 'public', null, 60, 'Beginner',
   array['CSS', 'React', 'Accessibility'],
   array['Repository URL', 'Screenshots', 'Walkthrough video'],
   now() + interval '22 days', 'published', 'platform',
   '[{"label": "Starter repo: landing-page", "url": "https://github.com/project-it-demo/responsive-landing", "kind": "starter"},
     {"label": "MDN: Responsive design", "url": "https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000412', 'GraphQL Schema for a Recipe App',
   'A recipe app''s mobile client makes nine REST calls to show one recipe page, and it is slow on bad connections.',
   'Design and build a GraphQL API that serves a recipe page in one request.',
   E'1. Sketch the types for recipes, ingredients, and reviews.\n2. Build the schema and resolvers in TypeScript.\n3. Avoid N+1 queries for ingredients.\n4. Explain your schema choices in the Walkthrough.',
   'platform', 'public', null, 90, 'Intermediate',
   array['GraphQL', 'Node.js', 'TypeScript'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '24 days', 'published', 'platform',
   '[{"label": "Starter repo: recipe-graphql", "url": "https://github.com/project-it-demo/recipe-graphql", "kind": "starter"},
     {"label": "GraphQL: Learn", "url": "https://graphql.org/learn/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000413', 'Fix the Login Security Holes',
   'A penetration test flagged the login flow: passwords stored with MD5, no lockout after failed attempts, and session tokens that never expire.',
   'Fix the security problems in a Node.js login API and add tests that prove they are fixed.',
   E'1. Read the pen-test summary.\n2. Move password storage to a modern hash with a migration path.\n3. Add lockout and token expiry.\n4. Test each fix and walk through the risks in the Walkthrough.',
   'platform', 'public', null, 90, 'Advanced',
   array['Security', 'Node.js', 'REST APIs', 'Testing'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '16 days', 'published', 'platform',
   '[{"label": "Starter repo: insecure-login", "url": "https://github.com/project-it-demo/insecure-login", "kind": "starter"},
     {"label": "OWASP Top Ten", "url": "https://owasp.org/www-project-top-ten/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000414', 'Spam Classifier for Support Tickets',
   'Support agents spend an hour a day deleting spam tickets before they can help real customers.',
   'Clean a labeled ticket dataset and train a simple classifier that flags spam, then explain where it goes wrong.',
   E'1. Load and clean the ticket CSV.\n2. Train a baseline classifier.\n3. Look at its mistakes and pick a threshold.\n4. Explain what you would ship and why in the Walkthrough.',
   'platform', 'public', null, 120, 'Intermediate',
   array['Python', 'Machine Learning', 'Data Cleaning', 'Written Communication'],
   array['Notebook', 'Written explanation', 'Walkthrough video'],
   now() + interval '28 days', 'published', 'platform',
   '[{"label": "tickets_labeled.csv", "url": "https://github.com/project-it-demo/ticket-spam/blob/main/data/tickets_labeled.csv", "kind": "starter"},
     {"label": "scikit-learn: Getting started", "url": "https://scikit-learn.org/stable/getting_started.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000415', 'Offline Notes Mobile Screen',
   'Field workers write notes in places with no signal, and the notes app loses everything typed while offline.',
   'Make a React Native notes screen save drafts offline and sync them when the connection returns.',
   E'1. Run the starter app in an emulator or Expo Go.\n2. Save drafts locally while offline.\n3. Sync when back online and handle conflicts simply.\n4. Walk through your sync approach in the Walkthrough.',
   'platform', 'public', null, 90, 'Intermediate',
   array['Mobile Development', 'React', 'TypeScript'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '21 days', 'published', 'platform',
   '[{"label": "Starter repo: offline-notes", "url": "https://github.com/project-it-demo/offline-notes", "kind": "starter"},
     {"label": "React Native: Get started", "url": "https://reactnative.dev/docs/getting-started", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000416', 'Go CLI for Log Triage',
   'On-call engineers grep through gigabytes of logs at 3 a.m. to find which service started failing first.',
   'Write a small Go command-line tool that reads JSON logs and summarizes errors by service and minute.',
   E'1. Read the sample log format.\n2. Build a CLI that streams the file instead of loading it all.\n3. Print a summary of the first and most frequent errors.\n4. Add tests and record a Walkthrough.',
   'platform', 'public', null, 75, 'Intermediate',
   array['Go', 'Debugging', 'Testing'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '19 days', 'published', 'platform',
   '[{"label": "sample_logs.jsonl", "url": "https://github.com/project-it-demo/log-triage/blob/main/data/sample_logs.jsonl", "kind": "starter"},
     {"label": "A Tour of Go", "url": "https://go.dev/tour/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000417', 'Design a URL Shortener',
   'Marketing wants branded short links with click counts, and expects a few million clicks during launch week.',
   'Write a short design for a URL shortener: data model, API, and how it handles a traffic spike.',
   E'1. List the requirements and what you are leaving out.\n2. Draw the data model and the API.\n3. Explain how it stays fast during a spike.\n4. Walk through the trade-offs in the Walkthrough.',
   'platform', 'public', null, 60, 'Intermediate',
   array['System Design', 'Written Communication', 'SQL'],
   array['Design document', 'Walkthrough video'],
   now() + interval '30 days', 'published', 'platform',
   '[{"label": "Requirements brief", "url": "https://github.com/project-it-demo/url-shortener/blob/main/brief.md", "kind": "starter"},
     {"label": "The System Design Primer", "url": "https://github.com/donnemartin/system-design-primer", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000418', 'S3 Upload Flow with Presigned URLs',
   'Large video uploads go through the app server, which runs out of memory whenever three people upload at once.',
   'Move uploads to presigned S3 URLs so files go straight from the browser to storage, safely.',
   E'1. Add an endpoint that returns a presigned upload URL.\n2. Limit file type, size, and key path.\n3. Update the client to upload directly.\n4. Explain the security choices in the Walkthrough.',
   'platform', 'public', null, 90, 'Intermediate',
   array['AWS', 'Node.js', 'Security', 'REST APIs'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '17 days', 'published', 'platform',
   '[{"label": "Starter repo: video-uploads", "url": "https://github.com/project-it-demo/presigned-uploads", "kind": "starter"},
     {"label": "AWS: Uploading objects with presigned URLs", "url": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000419', 'Merge Conflict Cleanup',
   'Two long-running branches touched the same files for a month. The merge has 40 conflicts and the release is Friday.',
   'Resolve a messy merge correctly, keep both teams'' changes, and leave a clean history.',
   E'1. Clone the repo and start the merge.\n2. Resolve each conflict, keeping both intents.\n3. Run the tests to prove nothing was lost.\n4. Explain your hardest conflict in the Walkthrough.',
   'platform', 'public', null, 45, 'Beginner',
   array['Git', 'Debugging', 'Written Communication'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '14 days', 'published', 'platform',
   '[{"label": "Starter repo: merge-mess", "url": "https://github.com/project-it-demo/merge-mess", "kind": "starter"},
     {"label": "Pro Git: Basic merging", "url": "https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000420', 'React Bundle Diet',
   'The web app ships 4 MB of JavaScript, and users on phones wait ten seconds before they can tap anything.',
   'Measure and shrink a React app''s bundle and time-to-interactive without removing features.',
   E'1. Measure the bundle and Lighthouse score.\n2. Find the biggest wins: code splitting, heavy libraries, images.\n3. Make the changes and measure again.\n4. Show the before-and-after numbers in the Walkthrough.',
   'platform', 'public', null, 75, 'Advanced',
   array['Performance', 'React', 'TypeScript'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '23 days', 'published', 'platform',
   '[{"label": "Starter repo: heavy-app", "url": "https://github.com/project-it-demo/bundle-diet", "kind": "starter"},
     {"label": "web.dev: Learn Performance", "url": "https://web.dev/learn/performance", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000421', 'Webhook Retry Queue',
   'Partners miss order webhooks whenever their server blips, and they only find out from angry customers.',
   'Add retries with backoff, a dead-letter list, and idempotency to a webhook sender.',
   E'1. Read how webhooks are sent today.\n2. Add retries with exponential backoff.\n3. Add a dead-letter list and idempotency keys.\n4. Test failure cases and walk through the design in the Walkthrough.',
   'platform', 'public', null, 120, 'Advanced',
   array['Node.js', 'System Design', 'Testing', 'REST APIs'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '26 days', 'published', 'platform',
   '[{"label": "Starter repo: webhook-sender", "url": "https://github.com/project-it-demo/webhook-retries", "kind": "starter"},
     {"label": "Stripe: Idempotent requests", "url": "https://docs.stripe.com/api/idempotent_requests", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000422', 'Inventory Data Model',
   'A bike shop tracks inventory in one giant spreadsheet. Parts get sold twice and nobody knows what is on order.',
   'Design a Postgres schema for inventory, orders, and suppliers, and write the queries the shop needs.',
   E'1. Read the spreadsheet and the shop owner''s notes.\n2. Design the tables and constraints.\n3. Write queries for low stock and open orders.\n4. Explain your schema in the Walkthrough.',
   'platform', 'public', null, 60, 'Beginner',
   array['SQL', 'System Design'],
   array['SQL file', 'Walkthrough video'],
   now() + interval '27 days', 'published', 'platform',
   '[{"label": "inventory.csv (spreadsheet export)", "url": "https://github.com/project-it-demo/bike-inventory/blob/main/data/inventory.csv", "kind": "starter"},
     {"label": "PostgreSQL: Constraints", "url": "https://www.postgresql.org/docs/current/ddl-constraints.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000423', 'Dark Mode Design Tokens',
   'Users keep asking for dark mode, but colors are hard-coded in 120 places across the app.',
   'Replace hard-coded colors with CSS custom properties and add an accessible dark theme.',
   E'1. Find and group the hard-coded colors.\n2. Define light and dark tokens.\n3. Add a theme toggle that respects the system setting.\n4. Check contrast and walk through it in the Walkthrough.',
   'platform', 'public', null, 60, 'Beginner',
   array['CSS', 'React', 'Accessibility'],
   array['Repository URL', 'Screenshots', 'Walkthrough video'],
   now() + interval '20 days', 'published', 'platform',
   '[{"label": "Starter repo: no-dark-mode", "url": "https://github.com/project-it-demo/dark-mode-tokens", "kind": "starter"},
     {"label": "MDN: Using CSS custom properties", "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000424', 'Avalanche Alert Service in Go',
   'Backcountry skiers in the Mountain West want a push alert when avalanche danger rises in the zones they follow.',
   'Build a small Go HTTP service that polls a forecast feed and sends alerts when danger goes up.',
   E'1. Read the sample forecast feed.\n2. Build endpoints to follow and unfollow zones.\n3. Detect danger increases and queue alerts.\n4. Test it and record a Walkthrough.',
   'platform', 'region', 'Mountain West', 90, 'Intermediate',
   array['Go', 'REST APIs', 'Testing'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '18 days', 'published', 'platform',
   '[{"label": "Sample forecast feed", "url": "https://github.com/project-it-demo/avalanche-alerts/blob/main/data/forecast.json", "kind": "starter"},
     {"label": "Go: net/http package", "url": "https://pkg.go.dev/net/http", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000425', 'Churn Prediction Notebook',
   'A gym chain in Austin is losing members after their third month and wants to know who is about to leave.',
   'Build a churn model from member check-in data and turn it into a chart and advice the managers can use.',
   E'1. Explore and clean the check-in data.\n2. Build a simple churn model and check it honestly.\n3. Chart the warning signs.\n4. Present your advice in the Walkthrough.',
   'platform', 'university', 'University of Texas at Austin', 120, 'Intermediate',
   array['Python', 'Machine Learning', 'Data Visualization', 'Written Communication'],
   array['Notebook', 'Written explanation', 'Walkthrough video'],
   now() + interval '21 days', 'published', 'platform',
   '[{"label": "checkins.csv", "url": "https://github.com/project-it-demo/gym-churn/blob/main/data/checkins.csv", "kind": "starter"},
     {"label": "pandas: Getting started", "url": "https://pandas.pydata.org/docs/getting_started/index.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000426', 'Campus Event Finder API',
   'Student clubs post events in a dozen group chats, and nobody can find out what is happening on campus tonight.',
   'Build a Node.js REST API for campus events with search by date, building, and tag.',
   E'1. Design the endpoints and the SQL tables.\n2. Implement create, list, and search.\n3. Validate input and return helpful errors.\n4. Walk through your API design in the Walkthrough.',
   'platform', 'university', 'University of Utah', 90, 'Beginner',
   array['Node.js', 'REST APIs', 'SQL'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '25 days', 'published', 'platform',
   '[{"label": "Starter repo: campus-events", "url": "https://github.com/project-it-demo/campus-events", "kind": "starter"},
     {"label": "Express: Routing", "url": "https://expressjs.com/en/guide/routing.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000427', 'Dependency Vulnerability Triage',
   'npm audit reports 63 vulnerabilities and the team does not know which ones actually matter.',
   'Triage a project''s dependency vulnerabilities, fix the ones that matter, and document the rest.',
   E'1. Run the audit and group the findings.\n2. Decide which are reachable and which are noise.\n3. Upgrade or patch the real risks without breaking the build.\n4. Explain your triage in the Walkthrough.',
   'platform', 'public', null, 60, 'Intermediate',
   array['Security', 'Node.js', 'Written Communication'],
   array['Repository URL', 'Triage notes', 'Walkthrough video'],
   now() + interval '15 days', 'published', 'platform',
   '[{"label": "Starter repo: old-deps", "url": "https://github.com/project-it-demo/vuln-triage", "kind": "starter"},
     {"label": "npm audit documentation", "url": "https://docs.npmjs.com/cli/commands/npm-audit", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000428', 'Cloud Bill Shock',
   'A startup''s AWS bill tripled last month and the founders want to know why before the next invoice.',
   'Query a month of AWS cost data, find what drove the jump, and recommend three changes.',
   E'1. Load the cost and usage export into SQL.\n2. Find the services and days behind the jump.\n3. Recommend three changes with estimated savings.\n4. Walk through your findings in the Walkthrough.',
   'platform', 'public', null, 60, 'Beginner',
   array['AWS', 'SQL', 'Written Communication'],
   array['SQL file', 'Written explanation', 'Walkthrough video'],
   now() + interval '22 days', 'published', 'platform',
   '[{"label": "cost_usage_report.csv", "url": "https://github.com/project-it-demo/cloud-bill/blob/main/data/cost_usage_report.csv", "kind": "starter"},
     {"label": "AWS Cost Explorer", "url": "https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000429', 'Chat Typing Indicators',
   'In the team chat app, "Alex is typing..." sometimes stays on screen for minutes after Alex has left.',
   'Fix the typing indicator in a React and WebSocket chat app so it appears and clears correctly.',
   E'1. Reproduce the stuck indicator.\n2. Find the cause on the client, the server, or both.\n3. Fix it and handle disconnects.\n4. Explain the root cause in the Walkthrough.',
   'platform', 'public', null, 90, 'Intermediate',
   array['React', 'TypeScript', 'Node.js', 'Debugging'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '19 days', 'published', 'platform',
   '[{"label": "Starter repo: team-chat", "url": "https://github.com/project-it-demo/typing-indicators", "kind": "starter"},
     {"label": "MDN: WebSockets API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000430', 'Unit Tests for a Pricing Engine',
   'Nobody dares touch the pricing code because it has no tests, and the last change gave away free shipping for a weekend.',
   'Write unit tests that pin down how a TypeScript pricing function behaves, and fix the bugs they reveal.',
   E'1. Read the pricing rules document.\n2. Write tests for each rule and the edge cases.\n3. Fix any bugs the tests reveal.\n4. Walk through what you chose to test in the Walkthrough.',
   'platform', 'public', null, 60, 'Beginner',
   array['Testing', 'TypeScript', 'Debugging'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '24 days', 'published', 'platform',
   '[{"label": "Starter repo: pricing-engine", "url": "https://github.com/project-it-demo/pricing-tests", "kind": "starter"},
     {"label": "Vitest getting started", "url": "https://vitest.dev/guide/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000431', 'ETL Job That Silently Drops Rows',
   'Finance noticed the nightly import has 2% fewer orders than the source system, and nobody knows which ones are missing.',
   'Find where a Python ETL job loses rows, fix it, and add checks so it can never happen silently again.',
   E'1. Run the ETL on the sample data and count rows at each step.\n2. Find where and why rows go missing.\n3. Fix it and add row-count checks.\n4. Explain the root cause in the Walkthrough.',
   'platform', 'public', null, 90, 'Intermediate',
   array['Python', 'SQL', 'Data Cleaning', 'Debugging'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '20 days', 'published', 'platform',
   '[{"label": "Starter repo: nightly-etl", "url": "https://github.com/project-it-demo/dropped-rows", "kind": "starter"},
     {"label": "pandas: Merge, join, and concatenate", "url": "https://pandas.pydata.org/docs/user_guide/merging.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000432', 'Accessible Kanban Board',
   'The task board only works with a mouse. Keyboard and screen-reader users cannot move cards at all.',
   'Add keyboard and screen-reader support for moving cards on a React kanban board.',
   E'1. Try the board with only a keyboard.\n2. Add keyboard moves and live announcements.\n3. Keep drag and drop working for mouse users.\n4. Demo it with a keyboard in your Walkthrough.',
   'platform', 'public', null, 90, 'Intermediate',
   array['React', 'TypeScript', 'Accessibility'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '23 days', 'published', 'platform',
   '[{"label": "Starter repo: kanban", "url": "https://github.com/project-it-demo/accessible-kanban", "kind": "starter"},
     {"label": "WAI-ARIA Authoring Practices", "url": "https://www.w3.org/WAI/ARIA/apg/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000433', 'Ship It: Docker and GitHub Actions to AWS',
   'A Seattle nonprofit deploys its website by copying files over SSH, and every deploy takes the site down for ten minutes.',
   'Containerize a small web app and build a GitHub Actions pipeline that deploys it to AWS without downtime.',
   E'1. Write a Dockerfile for the app.\n2. Build a pipeline that tests, builds, and pushes the image.\n3. Deploy to AWS with no downtime.\n4. Walk through the pipeline in your Walkthrough.',
   'platform', 'region', 'Pacific Northwest', 120, 'Advanced',
   array['Docker', 'CI/CD', 'AWS'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '28 days', 'published', 'platform',
   '[{"label": "Starter repo: nonprofit-site", "url": "https://github.com/project-it-demo/ship-it", "kind": "starter"},
     {"label": "GitHub Actions documentation", "url": "https://docs.github.com/en/actions", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000434', 'Image Thumbnail Worker',
   'Product photos take 30 seconds to appear after upload because thumbnails are made one at a time.',
   'Speed up a Python worker that makes thumbnails for images stored in S3.',
   E'1. Time the current worker on the sample images.\n2. Find the bottleneck.\n3. Make it faster and keep memory under control.\n4. Show the timings in your Walkthrough.',
   'platform', 'public', null, 90, 'Intermediate',
   array['Python', 'AWS', 'Performance'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '21 days', 'published', 'platform',
   '[{"label": "Starter repo: thumbnailer", "url": "https://github.com/project-it-demo/thumbnailer", "kind": "starter"},
     {"label": "Pillow documentation", "url": "https://pillow.readthedocs.io/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000435', 'Sign-up Form Validation',
   'The sign-up form accepts "asdf" as an email and shows errors only after the user hits submit.',
   'Add schema-based validation with Zod to a React sign-up form, with helpful inline errors and tests.',
   E'1. Write a Zod schema for the form.\n2. Show inline errors at the right moment.\n3. Share the schema with the API handler.\n4. Add tests and record a Walkthrough.',
   'platform', 'public', null, 45, 'Beginner',
   array['TypeScript', 'React', 'Testing'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '16 days', 'published', 'platform',
   '[{"label": "Starter repo: signup-form", "url": "https://github.com/project-it-demo/signup-validation", "kind": "starter"},
     {"label": "Zod documentation", "url": "https://zod.dev/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000436', 'Explain the Recommendations',
   'Users of a reading app say the "Because you liked..." suggestions feel random, and they have stopped trusting them.',
   'Improve a simple book recommender and add a plain-language reason to each suggestion.',
   E'1. Run the baseline recommender and look at bad results.\n2. Improve it with a method you can explain.\n3. Generate a reason for each suggestion.\n4. Show examples and limits in your Walkthrough.',
   'platform', 'university', 'University of Washington', 120, 'Advanced',
   array['Machine Learning', 'Python', 'Written Communication'],
   array['Notebook', 'Written explanation', 'Walkthrough video'],
   now() + interval '26 days', 'published', 'platform',
   '[{"label": "ratings.csv and books.csv", "url": "https://github.com/project-it-demo/book-recs/tree/main/data", "kind": "starter"},
     {"label": "scikit-learn: Nearest neighbors", "url": "https://scikit-learn.org/stable/modules/neighbors.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000437', 'Push Notification Opt-in Flow',
   'Only 9% of users allow notifications, because the app asks for permission the second it opens.',
   'Rework a React Native app''s notification permission flow so it asks at the right moment and works with a screen reader.',
   E'1. Map the current first-run flow.\n2. Move the permission ask to a moment that makes sense.\n3. Handle "deny" gracefully and make it accessible.\n4. Explain your choices in the Walkthrough.',
   'platform', 'public', null, 75, 'Intermediate',
   array['Mobile Development', 'TypeScript', 'Accessibility'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '18 days', 'published', 'platform',
   '[{"label": "Starter repo: habit-app", "url": "https://github.com/project-it-demo/notification-optin", "kind": "starter"},
     {"label": "Expo: Push notifications overview", "url": "https://docs.expo.dev/push-notifications/overview/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000438', 'Caching Layer for a Slow API',
   'The product page calls a pricing service that takes two seconds, and the page makes that call on every view.',
   'Add caching in front of a slow upstream service without ever showing a stale price after a change.',
   E'1. Measure how slow the upstream is and how often prices change.\n2. Choose where and how to cache.\n3. Handle invalidation when prices change.\n4. Walk through the trade-offs in the Walkthrough.',
   'platform', 'public', null, 90, 'Advanced',
   array['Performance', 'Node.js', 'System Design'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '25 days', 'published', 'platform',
   '[{"label": "Starter repo: slow-pricing", "url": "https://github.com/project-it-demo/api-cache", "kind": "starter"},
     {"label": "MDN: HTTP caching", "url": "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000439', 'SQL Injection Hunt',
   'A campus club''s membership site was defaced, and the attacker got in through the search box.',
   'Find and fix the SQL injection holes in a small Python web app, then prove they are closed.',
   E'1. Find every place user input reaches SQL.\n2. Show one injection working (locally only).\n3. Fix them with parameterized queries.\n4. Explain the attack and the fix in the Walkthrough.',
   'platform', 'university', 'Brigham Young University', 60, 'Intermediate',
   array['Security', 'SQL', 'Python'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '14 days', 'published', 'platform',
   '[{"label": "Starter repo: club-site", "url": "https://github.com/project-it-demo/sql-injection-hunt", "kind": "starter"},
     {"label": "OWASP: SQL Injection Prevention", "url": "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000440', 'Solar Panel Output Dashboard',
   'An Arizona solar installer wants to show homeowners which panels underperform, but the sensor data is noisy.',
   'Clean a month of panel sensor readings and build a dashboard that highlights underperforming panels.',
   E'1. Load the readings and remove sensor glitches.\n2. Compare each panel to its neighbors.\n3. Build two charts a homeowner would understand.\n4. Walk through your findings in the Walkthrough.',
   'platform', 'region', 'Southwest', 75, 'Beginner',
   array['SQL', 'Data Visualization', 'Python'],
   array['Notebook or dashboard link', 'Walkthrough video'],
   now() + interval '20 days', 'published', 'platform',
   '[{"label": "panel_readings.csv", "url": "https://github.com/project-it-demo/solar-output/blob/main/data/panel_readings.csv", "kind": "starter"},
     {"label": "Matplotlib: Quick start", "url": "https://matplotlib.org/stable/users/explain/quick_start.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000441', 'Pagination for a Huge Table',
   'The admin "all orders" page loads 2 million rows and crashes the browser tab.',
   'Add fast, stable pagination to a REST endpoint over a very large table.',
   E'1. Measure the current endpoint.\n2. Choose offset or keyset pagination and explain why.\n3. Implement it with the right index.\n4. Show the speedup in your Walkthrough.',
   'platform', 'public', null, 60, 'Intermediate',
   array['SQL', 'REST APIs', 'Performance'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '17 days', 'published', 'platform',
   '[{"label": "Starter repo: all-orders", "url": "https://github.com/project-it-demo/huge-pagination", "kind": "starter"},
     {"label": "PostgreSQL: LIMIT and OFFSET", "url": "https://www.postgresql.org/docs/current/queries-limit.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000442', 'Git History Forensics',
   'The checkout total has been off by one cent since "sometime last month", across 300 commits.',
   'Use git bisect and the history to find the commit that broke a calculation, then fix it.',
   E'1. Write a quick check that shows the bug.\n2. Use git bisect to find the bad commit.\n3. Fix the bug with a small commit.\n4. Explain how you found it in the Walkthrough.',
   'platform', 'public', null, 45, 'Beginner',
   array['Git', 'Debugging'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '19 days', 'published', 'platform',
   '[{"label": "Starter repo: penny-bug", "url": "https://github.com/project-it-demo/git-forensics", "kind": "starter"},
     {"label": "git bisect documentation", "url": "https://git-scm.com/docs/git-bisect", "kind": "reference"}]'),
  -- Summit Logistics' own Projects
  ('00000000-0000-0000-0000-000000000443', 'Route Planner API Bug',
   'Summit''s route planner sometimes sends a driver to the same stop twice, adding an hour to their shift.',
   'Find and fix the bug in Summit''s Node.js route planning endpoint and add tests for the cases that broke.',
   E'1. Run the API with the sample routes.\n2. Reproduce the duplicate stop.\n3. Fix the bug and add regression tests.\n4. Explain the root cause in the Walkthrough.',
   'company', 'public', null, 90, 'Intermediate',
   array['Node.js', 'REST APIs', 'Debugging', 'Testing'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '14 days', 'published', '00000000-0000-0000-0000-000000000111',
   '[{"label": "Starter repo: route-planner", "url": "https://github.com/project-it-demo/summit-route-planner", "kind": "starter"},
     {"label": "Sample routes.json", "url": "https://github.com/project-it-demo/summit-route-planner/blob/main/data/routes.json", "kind": "starter"}]'),
  ('00000000-0000-0000-0000-000000000444', 'Driver App Offline Sync',
   'Drivers lose proof-of-delivery photos when they drive through canyons with no signal.',
   'Make Summit''s React Native driver app queue deliveries offline and sync them reliably later.',
   E'1. Run the driver app and simulate going offline.\n2. Queue deliveries and photos locally.\n3. Sync in order when back online, without duplicates.\n4. Walk through your sync design in the Walkthrough.',
   'company', 'region', 'Mountain West', 120, 'Advanced',
   array['Mobile Development', 'TypeScript', 'Debugging'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '21 days', 'published', '00000000-0000-0000-0000-000000000111',
   '[{"label": "Starter repo: driver-app", "url": "https://github.com/project-it-demo/summit-driver-app", "kind": "starter"},
     {"label": "MDN: IndexedDB API", "url": "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000445', 'Dispatch Map Performance',
   'The dispatcher map freezes for seconds at a time once more than 500 trucks are on screen.',
   'Profile and speed up the React dispatch map so it stays smooth with 2,000 trucks.',
   E'1. Profile the map with the sample fleet.\n2. Find what re-renders too often.\n3. Fix it and measure again.\n4. Show the profiler before and after in the Walkthrough.',
   'company', 'public', null, 75, 'Intermediate',
   array['React', 'Performance', 'TypeScript'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '18 days', 'published', '00000000-0000-0000-0000-000000000111',
   '[{"label": "Starter repo: dispatch-map", "url": "https://github.com/project-it-demo/summit-dispatch-map", "kind": "starter"},
     {"label": "React: Profiler", "url": "https://react.dev/reference/react/Profiler", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000446', 'Warehouse Scan Data Cleanup',
   'Barcode scans from three warehouses use different formats, so the daily inventory report never adds up.',
   'Clean and combine Summit''s warehouse scan exports into one table that the inventory report can trust.',
   E'1. Load the three scan exports.\n2. Normalize formats and remove duplicate scans.\n3. Build the combined table and check the totals.\n4. Explain each cleaning step in the Walkthrough.',
   'company', 'public', null, 60, 'Beginner',
   array['SQL', 'Data Cleaning', 'Python'],
   array['SQL file or notebook', 'Walkthrough video'],
   now() + interval '20 days', 'published', '00000000-0000-0000-0000-000000000111',
   '[{"label": "Warehouse scan exports", "url": "https://github.com/project-it-demo/summit-warehouse-scans/tree/main/data", "kind": "starter"},
     {"label": "pandas: Duplicate labels", "url": "https://pandas.pydata.org/docs/user_guide/duplicates.html", "kind": "reference"}]'),
  -- Northwind Health's own Projects
  ('00000000-0000-0000-0000-000000000447', 'Patient Intake Form Accessibility',
   'Older patients and screen-reader users give up halfway through Northwind''s online intake form.',
   'Fix the accessibility problems in Northwind''s React intake form and add tests that keep them fixed.',
   E'1. Audit the form with axe and a screen reader.\n2. Fix labels, grouping, and error messages.\n3. Add tests for the fixes.\n4. Explain what you prioritized in the Walkthrough.',
   'company', 'public', null, 60, 'Intermediate',
   array['React', 'Accessibility', 'Testing'],
   array['Repository URL', 'Walkthrough video'],
   now() + interval '16 days', 'published', '00000000-0000-0000-0000-000000000112',
   '[{"label": "Starter repo: intake-form", "url": "https://github.com/project-it-demo/northwind-intake-form", "kind": "starter"},
     {"label": "WAI-ARIA Authoring Practices", "url": "https://www.w3.org/WAI/ARIA/apg/", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000448', 'Audit Log for Patient Records',
   'Clinics must show who viewed or changed a patient record, and today Northwind cannot answer that question.',
   'Design and build a tamper-evident audit log for patient record access in Node.js and Postgres.',
   E'1. Decide what events to log and what to leave out.\n2. Design the table so entries cannot be quietly changed.\n3. Add logging to the record endpoints.\n4. Walk through the design in the Walkthrough.',
   'company', 'public', null, 120, 'Advanced',
   array['Security', 'SQL', 'Node.js', 'System Design'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '24 days', 'published', '00000000-0000-0000-0000-000000000112',
   '[{"label": "Starter repo: patient-records", "url": "https://github.com/project-it-demo/northwind-audit-log", "kind": "starter"},
     {"label": "OWASP: Logging Cheat Sheet", "url": "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000449', 'No-Show Prediction',
   'One in seven appointments at partner clinics is a no-show. Clinics want to know who to call the day before.',
   'Build a simple no-show model from appointment history and chart the strongest warning signs.',
   E'1. Explore and clean the appointment data.\n2. Build a model and check it honestly.\n3. Chart the factors that matter most.\n4. Explain how a clinic should use it in the Walkthrough.',
   'company', 'university', 'University of Utah', 90, 'Intermediate',
   array['Python', 'Machine Learning', 'Data Visualization'],
   array['Notebook', 'Written explanation', 'Walkthrough video'],
   now() + interval '22 days', 'published', '00000000-0000-0000-0000-000000000112',
   '[{"label": "appointments.csv", "url": "https://github.com/project-it-demo/northwind-no-shows/blob/main/data/appointments.csv", "kind": "starter"},
     {"label": "scikit-learn: Getting started", "url": "https://scikit-learn.org/stable/getting_started.html", "kind": "reference"}]'),
  ('00000000-0000-0000-0000-000000000450', 'Clinic Calendar GraphQL API',
   'Northwind''s web and mobile apps each fetch calendar data differently, and they disagree about which slots are free.',
   'Build one GraphQL API for clinic calendars that both apps can use to find open slots.',
   E'1. Design the schema for providers, slots, and bookings.\n2. Implement queries for open slots and a booking mutation.\n3. Prevent double booking.\n4. Walk through your schema in the Walkthrough.',
   'company', 'public', null, 90, 'Intermediate',
   array['GraphQL', 'TypeScript', 'REST APIs'],
   array['Repository URL', 'Written explanation', 'Walkthrough video'],
   now() + interval '19 days', 'published', '00000000-0000-0000-0000-000000000112',
   '[{"label": "Starter repo: clinic-calendar", "url": "https://github.com/project-it-demo/northwind-calendar-graphql", "kind": "starter"},
     {"label": "Apollo Server documentation", "url": "https://www.apollographql.com/docs/apollo-server/", "kind": "reference"}]');

insert into public.company_projects (company_id, project_id, relationship_type) values
  -- Owners
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000443', 'owner'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000444', 'owner'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000445', 'owner'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000446', 'owner'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000447', 'owner'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000448', 'owner'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000449', 'owner'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000450', 'owner'),
  -- Sponsors of Platform Projects
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000406', 'sponsor'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000416', 'sponsor'),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000424', 'sponsor'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000413', 'sponsor'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000417', 'sponsor'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000435', 'sponsor');

insert into public.rubrics (project_id, criteria) values
  ('00000000-0000-0000-0000-000000000406', '[
    {"name": "Root causes", "description": "Each flaky failure is traced to a real cause, not retried away."},
    {"name": "Pipeline speed", "description": "Caching and step order make the pipeline measurably faster."},
    {"name": "Communication", "description": "The Walkthrough explains each cause and fix clearly."}
  ]'),
  ('00000000-0000-0000-0000-000000000407', '[
    {"name": "Runs anywhere", "description": "One command starts the app and database on a clean machine."},
    {"name": "Image quality", "description": "The image is small, cached well, and does not run as root."},
    {"name": "Communication", "description": "Explains the hidden dependencies that were found."}
  ]'),
  ('00000000-0000-0000-0000-000000000408', '[
    {"name": "Algorithm choice", "description": "The rate-limiting approach fits the problem and is justified."},
    {"name": "API behavior", "description": "429 responses are correct and include Retry-After."},
    {"name": "Testing", "description": "Tests cover bursts, resets, and separate keys."}
  ]'),
  ('00000000-0000-0000-0000-000000000409', '[
    {"name": "Diagnosis", "description": "Reads the query plan correctly and finds the real bottleneck."},
    {"name": "Fix", "description": "The query is fast and returns the same results."},
    {"name": "Communication", "description": "Before-and-after plans are explained clearly."}
  ]'),
  ('00000000-0000-0000-0000-000000000410', '[
    {"name": "Layout", "description": "The page works at phone, tablet, and desktop widths."},
    {"name": "Accessibility", "description": "Contrast and focus styles are preserved or improved."},
    {"name": "Code quality", "description": "CSS is simple and does not rely on magic numbers."}
  ]'),
  ('00000000-0000-0000-0000-000000000412', '[
    {"name": "Schema design", "description": "Types and fields match how the page uses the data."},
    {"name": "Efficiency", "description": "Avoids N+1 queries when loading ingredients."},
    {"name": "Communication", "description": "Explains schema choices and trade-offs."}
  ]'),
  ('00000000-0000-0000-0000-000000000413', '[
    {"name": "Password storage", "description": "Uses a modern hash with a safe migration from MD5."},
    {"name": "Session safety", "description": "Lockout and token expiry work as intended."},
    {"name": "Testing", "description": "Tests prove each hole is closed."}
  ]'),
  ('00000000-0000-0000-0000-000000000414', '[
    {"name": "Data preparation", "description": "Cleaning steps are sensible and explained."},
    {"name": "Model evaluation", "description": "Uses honest metrics and looks at real mistakes."},
    {"name": "Recommendation", "description": "The threshold and shipping advice follow from the results."}
  ]'),
  ('00000000-0000-0000-0000-000000000415', '[
    {"name": "Offline behavior", "description": "Drafts survive going offline and closing the app."},
    {"name": "Sync", "description": "Drafts sync when online and conflicts are handled simply."},
    {"name": "Communication", "description": "Explains the sync approach and its limits."}
  ]'),
  ('00000000-0000-0000-0000-000000000416', '[
    {"name": "Correctness", "description": "The summary matches what is in the logs."},
    {"name": "Efficiency", "description": "Streams large files without loading them into memory."},
    {"name": "Testing", "description": "Tests cover malformed lines and empty input."}
  ]'),
  ('00000000-0000-0000-0000-000000000417', '[
    {"name": "Requirements", "description": "States what is in and out of scope."},
    {"name": "Design", "description": "Data model and API are clear and handle the spike."},
    {"name": "Trade-offs", "description": "Explains what was chosen and what was given up."}
  ]'),
  ('00000000-0000-0000-0000-000000000418', '[
    {"name": "Upload flow", "description": "Files go directly to S3 and the server stays light."},
    {"name": "Security", "description": "Type, size, and key path are restricted."},
    {"name": "Communication", "description": "Security choices are explained clearly."}
  ]'),
  ('00000000-0000-0000-0000-000000000419', '[
    {"name": "Correctness", "description": "Both branches'' changes survive and tests pass."},
    {"name": "History", "description": "The result is clean and easy to follow."},
    {"name": "Communication", "description": "Explains how the hardest conflict was resolved."}
  ]'),
  ('00000000-0000-0000-0000-000000000420', '[
    {"name": "Measurement", "description": "Measures before and after with real numbers."},
    {"name": "Impact", "description": "Picks the biggest wins first."},
    {"name": "Code quality", "description": "Changes keep every feature working."}
  ]'),
  ('00000000-0000-0000-0000-000000000421', '[
    {"name": "Reliability", "description": "Retries, backoff, and dead letters behave correctly."},
    {"name": "Idempotency", "description": "Partners never process the same event twice."},
    {"name": "Testing", "description": "Tests simulate partner outages."}
  ]'),
  ('00000000-0000-0000-0000-000000000422', '[
    {"name": "Schema", "description": "Tables and constraints prevent double-selling."},
    {"name": "Queries", "description": "Low-stock and open-order queries are correct."},
    {"name": "Communication", "description": "Explains the schema in plain language."}
  ]'),
  ('00000000-0000-0000-0000-000000000423', '[
    {"name": "Tokens", "description": "Colors come from a small, well-named set of tokens."},
    {"name": "Dark theme", "description": "Respects the system setting and has good contrast."},
    {"name": "Communication", "description": "Explains how the tokens are organized."}
  ]'),
  ('00000000-0000-0000-0000-000000000424', '[
    {"name": "API design", "description": "Follow and unfollow endpoints are clear and consistent."},
    {"name": "Alert logic", "description": "Alerts fire only when danger goes up."},
    {"name": "Testing", "description": "Tests cover the feed edge cases."}
  ]'),
  ('00000000-0000-0000-0000-000000000425', '[
    {"name": "Analysis", "description": "The model is checked honestly, not just on training data."},
    {"name": "Charts", "description": "The warning signs are easy to see."},
    {"name": "Recommendation", "description": "Managers could act on the advice tomorrow."}
  ]'),
  ('00000000-0000-0000-0000-000000000426', '[
    {"name": "API design", "description": "Endpoints and search parameters are clear."},
    {"name": "Data model", "description": "Tables support the searches efficiently."},
    {"name": "Validation", "description": "Bad input gets a helpful error."}
  ]'),
  ('00000000-0000-0000-0000-000000000427', '[
    {"name": "Triage", "description": "Separates real risks from noise with reasons."},
    {"name": "Fixes", "description": "Real risks are fixed without breaking the build."},
    {"name": "Writing", "description": "Triage notes are short and useful to the team."}
  ]'),
  ('00000000-0000-0000-0000-000000000428', '[
    {"name": "Analysis", "description": "Finds the services and days that drove the jump."},
    {"name": "Recommendations", "description": "Three changes with believable savings."},
    {"name": "Communication", "description": "Founders could follow the findings."}
  ]'),
  ('00000000-0000-0000-0000-000000000429', '[
    {"name": "Root cause", "description": "Finds why the indicator gets stuck."},
    {"name": "Fix", "description": "The indicator clears on stop, timeout, and disconnect."},
    {"name": "Communication", "description": "The Walkthrough explains the cause clearly."}
  ]'),
  ('00000000-0000-0000-0000-000000000430', '[
    {"name": "Coverage", "description": "Tests cover each pricing rule and its edges."},
    {"name": "Bug fixes", "description": "Bugs the tests reveal are fixed correctly."},
    {"name": "Test quality", "description": "Tests are readable and test behavior, not internals."}
  ]'),
  ('00000000-0000-0000-0000-000000000431', '[
    {"name": "Root cause", "description": "Finds exactly where and why rows are lost."},
    {"name": "Fix", "description": "Row counts match the source after the fix."},
    {"name": "Safeguards", "description": "Checks make future losses loud."}
  ]'),
  ('00000000-0000-0000-0000-000000000432', '[
    {"name": "Keyboard support", "description": "Cards can be moved with only a keyboard."},
    {"name": "Announcements", "description": "Screen readers hear where a card moved."},
    {"name": "No regressions", "description": "Mouse drag and drop still works."}
  ]'),
  ('00000000-0000-0000-0000-000000000433', '[
    {"name": "Container", "description": "The image builds reliably and runs the app."},
    {"name": "Pipeline", "description": "Tests, builds, and deploys on every merge."},
    {"name": "Zero downtime", "description": "The site stays up during a deploy."}
  ]'),
  ('00000000-0000-0000-0000-000000000434', '[
    {"name": "Diagnosis", "description": "Finds the real bottleneck with measurements."},
    {"name": "Speedup", "description": "Thumbnails are much faster and memory stays bounded."},
    {"name": "Communication", "description": "Timings are shown and explained."}
  ]'),
  ('00000000-0000-0000-0000-000000000435', '[
    {"name": "Validation", "description": "The schema catches bad input and allows good input."},
    {"name": "User experience", "description": "Errors appear inline at the right moment."},
    {"name": "Testing", "description": "Tests cover the schema and the form."}
  ]'),
  ('00000000-0000-0000-0000-000000000436', '[
    {"name": "Model", "description": "Recommendations improve in a way that is explained."},
    {"name": "Explanations", "description": "Each reason is honest and easy to understand."},
    {"name": "Limits", "description": "Is upfront about where the method fails."}
  ]'),
  ('00000000-0000-0000-0000-000000000437', '[
    {"name": "Timing", "description": "The permission ask comes at a sensible moment."},
    {"name": "Denial handling", "description": "The app still works well when users say no."},
    {"name": "Accessibility", "description": "The flow works with a screen reader."}
  ]'),
  ('00000000-0000-0000-0000-000000000438', '[
    {"name": "Cache design", "description": "Where and how to cache is justified."},
    {"name": "Freshness", "description": "Prices are never stale after a change."},
    {"name": "Trade-offs", "description": "Explains what the cache costs and gains."}
  ]'),
  ('00000000-0000-0000-0000-000000000439', '[
    {"name": "Discovery", "description": "Finds every place input reaches SQL."},
    {"name": "Fix", "description": "Every query is parameterized correctly."},
    {"name": "Communication", "description": "Explains the attack and the fix clearly."}
  ]'),
  ('00000000-0000-0000-0000-000000000440', '[
    {"name": "Data cleaning", "description": "Sensor glitches are removed with clear rules."},
    {"name": "Charts", "description": "A homeowner can spot the weak panels."},
    {"name": "Communication", "description": "Findings are explained in plain language."}
  ]'),
  ('00000000-0000-0000-0000-000000000441', '[
    {"name": "Approach", "description": "The pagination method fits the table and is justified."},
    {"name": "Performance", "description": "Pages load fast deep into the table."},
    {"name": "API design", "description": "Clients can page forward reliably."}
  ]'),
  ('00000000-0000-0000-0000-000000000442', '[
    {"name": "Method", "description": "Uses bisect with a reliable check."},
    {"name": "Fix", "description": "The fix is small and correct."},
    {"name": "Communication", "description": "Explains how the bad commit was found."}
  ]'),
  ('00000000-0000-0000-0000-000000000443', '[
    {"name": "Correctness", "description": "No route visits a stop twice."},
    {"name": "Debugging approach", "description": "Finds the root cause methodically."},
    {"name": "Testing", "description": "Regression tests cover the broken cases."}
  ]'),
  ('00000000-0000-0000-0000-000000000444', '[
    {"name": "Offline queue", "description": "Deliveries and photos survive having no signal."},
    {"name": "Sync", "description": "Syncs in order with no duplicates."},
    {"name": "Communication", "description": "Explains the sync design and its limits."}
  ]'),
  ('00000000-0000-0000-0000-000000000445', '[
    {"name": "Profiling", "description": "Uses the profiler to find the real cause."},
    {"name": "Speedup", "description": "The map stays smooth with 2,000 trucks."},
    {"name": "Code quality", "description": "Fixes are targeted and easy to follow."}
  ]'),
  ('00000000-0000-0000-0000-000000000446', '[
    {"name": "Data quality", "description": "Formats are normalized and duplicates removed."},
    {"name": "Correctness", "description": "Combined totals match the source exports."},
    {"name": "Communication", "description": "Each cleaning step is explained."}
  ]'),
  ('00000000-0000-0000-0000-000000000447', '[
    {"name": "Accessibility fixes", "description": "The form works with a screen reader and keyboard."},
    {"name": "Error messages", "description": "Errors are clear and announced."},
    {"name": "Testing", "description": "Tests cover the fixed issues."}
  ]'),
  ('00000000-0000-0000-0000-000000000448', '[
    {"name": "Event design", "description": "Logs the right events and avoids leaking patient data."},
    {"name": "Tamper evidence", "description": "Changed or deleted entries can be detected."},
    {"name": "Trade-offs", "description": "Explains storage and performance costs."}
  ]'),
  ('00000000-0000-0000-0000-000000000449', '[
    {"name": "Analysis", "description": "The model is checked honestly."},
    {"name": "Charts", "description": "The strongest warning signs are obvious."},
    {"name": "Usefulness", "description": "A clinic could act on it the next day."}
  ]'),
  ('00000000-0000-0000-0000-000000000450', '[
    {"name": "Schema design", "description": "Providers, slots, and bookings are modeled clearly."},
    {"name": "Correctness", "description": "Double booking is impossible."},
    {"name": "Communication", "description": "Explains schema choices and trade-offs."}
  ]');

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
