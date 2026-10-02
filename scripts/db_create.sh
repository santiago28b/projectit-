#!/usr/bin/env bash
# Create the projectit database if it does not exist.
# Uses DATABASE_URL from .env.local / environment, or a local default.

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

DATABASE_URL="${DATABASE_URL:-postgresql://${USER}@127.0.0.1:5432/projectit}"

# Parse db name from URL path (last segment)
DB_NAME="$(basename "${DATABASE_URL%%\?*}")"
# Admin URL: same host/user, database "postgres"
ADMIN_URL="$(echo "$DATABASE_URL" | sed -E 's|/[^/?]+(\?.*)?$|/postgres\1|')"

if psql "$ADMIN_URL" -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
  echo "Database '${DB_NAME}' already exists."
else
  echo "Creating database '${DB_NAME}'..."
  psql "$ADMIN_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"${DB_NAME}\";"
  echo "Created '${DB_NAME}'."
fi
