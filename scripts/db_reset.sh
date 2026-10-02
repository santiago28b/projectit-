#!/usr/bin/env bash
# Drop public schema, re-apply migrations, then seed.
# Requires DATABASE_URL (from .env.local or env).

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Copy .env.example → .env.local first." >&2
  exit 1
fi

bash scripts/db_create.sh

echo "==> Resetting schema on ${DATABASE_URL%%\?*} ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;
SQL

shopt -s nullglob
migrations=(supabase/migrations/*.sql)
if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "No migrations in supabase/migrations/" >&2
  exit 1
fi

for file in "${migrations[@]}"; do
  echo "==> Applying ${file}"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done

if [[ -f supabase/seed.sql ]]; then
  echo "==> Seeding supabase/seed.sql"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/seed.sql
fi

echo "✅ db:reset complete"
