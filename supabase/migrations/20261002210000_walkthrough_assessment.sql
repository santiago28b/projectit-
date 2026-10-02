-- Walkthrough Assessment: the AI's background pass over a Submission
-- (code + written explanation + Walkthrough Transcript).
-- assessment_status tracks the AI; submission_status still tracks the human review.
-- Prefer 20261002223000_ensure_assessment_schema.sql on already-live DBs / deploy.

do $$
begin
  create type public.assessment_status as enum ('pending', 'running', 'done', 'failed');
exception
  when duplicate_object then null;
end
$$;

alter table public.submissions
  add column if not exists transcript text,
  add column if not exists assessment_status public.assessment_status,
  add column if not exists assessed_at timestamptz,
  add column if not exists assessment_error text;

update public.submissions
set assessment_status = 'done'
where assessment_status is null;

alter table public.submissions
  alter column assessment_status set default 'pending';

do $$
begin
  alter table public.submissions
    alter column assessment_status set not null;
exception
  when others then null;
end
$$;
