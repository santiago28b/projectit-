-- Project It initial schema
-- Domain language from CONTEXT.md. Jobs link to Projects by skills only (ADR 0001).

create extension if not exists "pgcrypto";

-- Enums
create type public.user_role as enum (
  'candidate',
  'company_admin',
  'platform_admin'
);

create type public.project_type as enum (
  'company',
  'platform'
);

create type public.project_visibility as enum (
  'public',
  'university',
  'region',
  'invite'
);

create type public.project_status as enum (
  'draft',
  'published',
  'closed'
);

create type public.company_project_relationship as enum (
  'owner',
  'sponsor'
);

create type public.job_status as enum (
  'open',
  'closed'
);

create type public.submission_status as enum (
  'submitted',
  'under_review',
  'completed'
);

create type public.evidence_level as enum (
  'strong',
  'partial',
  'not_shown',
  'not_assessed'
);

create type public.evidence_source as enum (
  'ai',
  'company'
);

create type public.invitation_status as enum (
  'pending',
  'accepted',
  'expired'
);

create type public.match_type as enum (
  'candidate_project',
  'job_candidate',
  'job_project'
);

-- Profiles (demo role-switcher; later link to auth.users)
create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role public.user_role not null,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  logo_url text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  university text,
  location text,
  region text,
  skills text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  scenario text not null default '',
  description text not null default '',
  instructions text not null default '',
  type public.project_type not null,
  visibility public.project_visibility not null default 'public',
  visibility_target text,
  expected_duration_minutes integer,
  difficulty text,
  skills text[] not null default '{}',
  deliverables text[] not null default '{}',
  deadline timestamptz,
  status public.project_status not null default 'draft',
  created_by text not null default 'platform',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.company_projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  relationship_type public.company_project_relationship not null,
  created_at timestamptz not null default now(),
  unique (company_id, project_id, relationship_type)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  title text not null,
  description text not null default '',
  required_skills text[] not null default '{}',
  preferred_skills text[] not null default '{}',
  status public.job_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rubric categories stored as JSON: [{ "name": "...", "description": "..." }]
create table public.rubrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,
  criteria jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  written_response text not null default '',
  repository_url text,
  file_urls text[] not null default '{}',
  video_url text not null,
  follow_up_questions text[] not null default '{}',
  status public.submission_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, candidate_id)
);

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  reviewer_id uuid not null references public.users (id) on delete cascade,
  rubric_results jsonb not null default '{}'::jsonb,
  notes text not null default '',
  interview_recommended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  submission_id uuid not null references public.submissions (id) on delete cascade,
  skill text not null,
  level public.evidence_level not null,
  source public.evidence_source not null,
  rationale text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  invited_by uuid not null references public.companies (id) on delete cascade,
  status public.invitation_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, candidate_id)
);

-- Qualitative match reasons only — never store a percentage score for display
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  type public.match_type not null,
  source_id uuid not null,
  target_id uuid not null,
  reasons jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.shortlists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  candidate_id uuid not null references public.candidates (id) on delete cascade,
  job_id uuid references public.jobs (id) on delete set null,
  submission_id uuid references public.submissions (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, candidate_id, job_id)
);

-- Indexes
create index candidates_skills_idx on public.candidates using gin (skills);
create index projects_skills_idx on public.projects using gin (skills);
create index projects_visibility_idx on public.projects (visibility);
create index jobs_required_skills_idx on public.jobs using gin (required_skills);
create index evidence_candidate_skill_idx on public.evidence (candidate_id, skill);
create index submissions_project_idx on public.submissions (project_id);
create index matches_type_idx on public.matches (type);

-- RLS: enabled with no permissive policies yet.
-- Service role bypasses RLS for seed/demo server paths.
-- Tighten policies when real Auth lands.
alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.candidates enable row level security;
alter table public.projects enable row level security;
alter table public.company_projects enable row level security;
alter table public.jobs enable row level security;
alter table public.rubrics enable row level security;
alter table public.submissions enable row level security;
alter table public.evaluations enable row level security;
alter table public.evidence enable row level security;
alter table public.invitations enable row level security;
alter table public.matches enable row level security;
alter table public.shortlists enable row level security;
