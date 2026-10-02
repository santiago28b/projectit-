-- Workspace resources and starter files for a Project (ticket 03).
-- JSON list: [{ "label": "...", "url": "...", "kind": "starter" | "reference" }]

alter table public.projects
  add column resources jsonb not null default '[]'::jsonb;
