-- Walkthrough Assessment: the AI's background pass over a Submission
-- (code + written explanation + Walkthrough Transcript).
-- assessment_status tracks the AI; submission_status still tracks the human review.

create type public.assessment_status as enum ('pending', 'running', 'done', 'failed');

-- Submissions that already exist were assessed the old way, so they start as done.
alter table public.submissions
  add column transcript text,
  add column assessment_status public.assessment_status not null default 'done',
  add column assessed_at timestamptz,
  add column assessment_error text;

-- New Submissions start pending until the background Assessment runs.
alter table public.submissions alter column assessment_status set default 'pending';
