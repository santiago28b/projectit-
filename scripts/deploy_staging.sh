#!/usr/bin/env bash
# Preflight + publish Project It to EC2 staging.
#
# Usage (from repo root):
#   npm run deploy:staging
#   npm run deploy:staging -- --no-commit
#   npm run deploy:staging -- "Deploy staging: marketplace"
#
# One-time on EC2 (after first publish):
#   1. Copy scripts/env.staging.example → ~/project-it-staging/.env and fill keys
#   2. Point DNS project-it.samirrodriguez.click → this EC2
#   3. Install nginx conf from scripts/nginx/ and run certbot

cd "$(dirname "$0")/.." || exit 1
set -euo pipefail

COMMIT_MESSAGE=""
SKIP_COMMIT=false
PASSTHROUGH=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-commit)
      SKIP_COMMIT=true
      shift
      ;;
    *)
      PASSTHROUGH+=("$1")
      shift
      ;;
  esac
done

if [[ ${#PASSTHROUGH[@]} -gt 0 ]]; then
  COMMIT_MESSAGE="${PASSTHROUGH[0]}"
fi

COMMIT_MESSAGE="${COMMIT_MESSAGE:-Deploy staging $(date -u +%Y-%m-%dT%H:%M:%SZ)}"
SITE_URL="${SITE_URL:-https://project-it.samirrodriguez.click}"

commit_and_push() {
  local message="$1"

  if [[ "$SKIP_COMMIT" == true ]]; then
    echo "Skipping git commit/push (--no-commit)."
    return 0
  fi

  if [[ -z "$(git status --porcelain)" ]]; then
    echo "No local changes to commit. Skipping git commit/push."
    return 0
  fi

  git add -A
  git commit -m "$(cat <<EOF
$message
EOF
)"
  if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git push
  else
    git push -u origin HEAD
  fi
  echo "Committed and pushed changes."
}

echo "==> Running preflight checks..."

echo "==> Linting..."
npm run lint

if npm run | grep -qE '^  test'; then
  echo "==> Running tests..."
  npm test
else
  echo "==> No npm test script — skipping tests."
fi

echo "==> Committing and pushing (optional)..."
commit_and_push "$COMMIT_MESSAGE"

echo "==> Publishing to staging..."
bash scripts/publish_staging.sh

echo "✅ Staging deploy complete"
echo "   Site: ${SITE_URL}"
