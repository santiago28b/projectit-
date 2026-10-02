#!/usr/bin/env bash
# Apply deploy-safe (idempotent) SQL to DATABASE_URL.
#
# Default: only *ensure*.sql migrations — safe on an already-seeded
# Supabase/EC2 database that may be missing later columns.
#
# Usage (from repo root):
#   npm run db:migrate
#   DATABASE_URL='postgresql://...' npm run db:migrate
#
# Or paste into Supabase SQL editor:
#   supabase/migrations/20261002223000_ensure_assessment_schema.sql

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Export it or put it in .env.local." >&2
  exit 1
fi

shopt -s nullglob
migrations=(supabase/migrations/*ensure*.sql)
if [[ ${#migrations[@]} -eq 0 ]]; then
  echo "No *ensure*.sql files in supabase/migrations/" >&2
  exit 1
fi

echo "==> Migrating ${DATABASE_URL%%\?*}"
for file in "${migrations[@]}"; do
  echo "==> apply $(basename "$file")"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
done

echo "✅ db:migrate complete"
