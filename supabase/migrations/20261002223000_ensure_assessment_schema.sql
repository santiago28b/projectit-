-- Idempotent: safe to re-run on deploy (Supabase SQL editor, db:migrate, or publish).
-- Brings older DBs up to the Walkthrough Assessment + Project resources shape
-- without failing when columns/types already exist.

-- Project workspace resources (ticket 03)
alter table public.projects
  add column if not exists resources jsonb not null default '[]'::jsonb;

-- assessment_status tracks the AI pass; submission status still tracks human review.
do $$
begin
  create type public.assessment_status as enum (
    'pending',
    'running',
    'done',
    'failed'
  );
exception
  when duplicate_object then null;
end
$$;

alter table public.submissions
  add column if not exists transcript text,
  add column if not exists assessment_status public.assessment_status,
  add column if not exists assessed_at timestamptz,
  add column if not exists assessment_error text;

-- Existing rows were assessed the old way; treat them as done.
update public.submissions
set assessment_status = 'done'
where assessment_status is null;

alter table public.submissions
  alter column assessment_status set default 'pending';

-- Only tighten NOT NULL after backfill (no-op if already set).
do $$
begin
  alter table public.submissions
    alter column assessment_status set not null;
exception
  when others then null;
end
$$;
