#!/usr/bin/env bash
# Build Next.js standalone and publish to EC2 staging.
# Remote .env is preserved — create it once on the server.
#
# Usage (from repo root):
#   bash scripts/publish_staging.sh
#   npm run publish:staging

cd "$(dirname "$0")/.." || exit 1
set -euo pipefail

# shellcheck source=lib/ec2.sh
source "$(dirname "$0")/lib/ec2.sh"

SITE_URL="${SITE_URL:-https://project-it.samirrodriguez.click}"
REMOTE_DIR="${REMOTE_DIR:-~/project-it-staging}"
PM2_APP_NAME="${PM2_APP_NAME:-project-it-staging}"
APP_PORT="${APP_PORT:-4320}"
TARBALL_NAME="project-it-staging.tar.gz"

require_ec2_key

echo "==> Staging site: ${SITE_URL}"
echo "==> EC2: ${EC2_USER}@${EC2_HOST}"
echo "==> Remote dir: ${REMOTE_DIR} (PM2: ${PM2_APP_NAME}, PORT: ${APP_PORT})"

# Bake the public staging URL into the client bundle.
export NEXT_PUBLIC_APP_URL="${SITE_URL}"

echo "==> Building Next.js (standalone)..."
npm run build

STANDALONE_DIR=".next/standalone"
if [[ ! -d "$STANDALONE_DIR" ]]; then
  echo "Missing ${STANDALONE_DIR}. Is output: 'standalone' set in next.config.ts?" >&2
  exit 1
fi

echo "==> Assembling standalone tree..."
STAGE_DIR="$(mktemp -d -t project-it-staging-XXXXXX)"
cleanup() {
  rm -rf "$STAGE_DIR"
  rm -f "/tmp/${TARBALL_NAME}"
}
trap cleanup EXIT

# Copy traced server + deps, then static assets Next expects beside server.js
cp -R "${STANDALONE_DIR}/." "${STAGE_DIR}/"
mkdir -p "${STAGE_DIR}/.next"
cp -R .next/static "${STAGE_DIR}/.next/static"
if [[ -d public ]]; then
  cp -R public "${STAGE_DIR}/public"
fi

echo "==> Creating tarball..."
COPYFILE_DISABLE=1 tar -czf "/tmp/${TARBALL_NAME}" -C "$STAGE_DIR" .

echo "==> Ensuring remote app directory exists..."
remote "mkdir -p ${REMOTE_DIR}"

echo "==> Uploading tarball..."
remote_scp "/tmp/${TARBALL_NAME}" "${EC2_USER}@${EC2_HOST}:/tmp/${TARBALL_NAME}"

ENSURE_SQL="supabase/migrations/20261002223000_ensure_assessment_schema.sql"
echo "==> Uploading deploy-safe schema ensure..."
remote_scp "${ENSURE_SQL}" "${EC2_USER}@${EC2_HOST}:/tmp/project-it-ensure-schema.sql"

echo "==> Extracting on EC2 (preserving remote .env) and restarting PM2..."
remote bash -s << EOF
set -euo pipefail
cd ${REMOTE_DIR}

# Keep secrets across deploys
if [[ -f .env ]]; then
  cp .env /tmp/project-it-staging.env.bak
fi

# Replace app files only
find . -mindepth 1 -maxdepth 1 ! -name '.env' -exec rm -rf {} +

if tar --help 2>/dev/null | grep -q -- '--warning'; then
  tar --warning=no-unknown-keyword -xzf /tmp/${TARBALL_NAME} -C .
else
  tar -xzf /tmp/${TARBALL_NAME} -C . >/dev/null
fi
rm -f /tmp/${TARBALL_NAME}

if [[ -f /tmp/project-it-staging.env.bak ]]; then
  mv -f /tmp/project-it-staging.env.bak .env
fi

if [[ ! -f .env ]]; then
  echo "WARNING: No .env in ${REMOTE_DIR}."
  echo "Create one from scripts/env.staging.example before the app can talk to Supabase."
fi

# Load runtime secrets for PM2
set -a
[[ -f .env ]] && . ./.env
set +a

# Idempotent schema patch against whatever DATABASE_URL staging uses
if [[ -n "\${DATABASE_URL:-}" ]] && [[ -f /tmp/project-it-ensure-schema.sql ]]; then
  echo "==> Applying ensure_assessment_schema.sql"
  psql "\$DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/project-it-ensure-schema.sql
  rm -f /tmp/project-it-ensure-schema.sql
fi

export PORT=${APP_PORT}
export NODE_ENV=production
export NEXT_PUBLIC_APP_URL="${SITE_URL}"

APP_ABS="\$(pwd)"
if pm2 describe "${PM2_APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${PM2_APP_NAME}" --update-env
else
  pm2 start "\${APP_ABS}/server.js" --name "${PM2_APP_NAME}" --cwd "\${APP_ABS}"
fi

pm2 save
EOF

echo "✅ Staging published"
echo "   ${SITE_URL}"
echo "   PM2: ${PM2_APP_NAME} on port ${APP_PORT}"
