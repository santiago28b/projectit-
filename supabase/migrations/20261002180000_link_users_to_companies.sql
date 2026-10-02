-- Link Company users to their Company (ticket 01).
-- Candidates and platform admins leave this null.

alter table public.users
  add column company_id uuid references public.companies (id) on delete set null;

create index users_company_idx on public.users (company_id);
