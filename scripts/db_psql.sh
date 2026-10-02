#!/usr/bin/env bash
# Open psql against DATABASE_URL from .env.local / environment.

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

exec psql "$DATABASE_URL" "$@"
