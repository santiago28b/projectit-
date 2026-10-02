#!/usr/bin/env bash
# Install the staging nginx server block on EC2, then (optionally) issue TLS.
#
# Fixes certbot's:
#   "Could not automatically find a matching server block for …"
# which means nginx has no server { server_name project-it… } yet.
#
# Usage (from repo root):
#   bash scripts/install_nginx_staging.sh
#   bash scripts/install_nginx_staging.sh --certbot

cd "$(dirname "$0")/.." || exit 1
set -euo pipefail

# shellcheck source=lib/ec2.sh
source "$(dirname "$0")/lib/ec2.sh"

SITE_NAME="project-it.samirrodriguez.click"
CONF_LOCAL="scripts/nginx/${SITE_NAME}.conf"
CONF_REMOTE="/etc/nginx/conf.d/${SITE_NAME}.conf"
RUN_CERTBOT=false

for arg in "$@"; do
  case "$arg" in
    --certbot) RUN_CERTBOT=true ;;
    *)
      echo "Unknown arg: $arg (supported: --certbot)" >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$CONF_LOCAL" ]]; then
  echo "Missing ${CONF_LOCAL}" >&2
  exit 1
fi

require_ec2_key

# Prefer DNS; fall back to IP encoded in ec2-A-B-C-D hostname.
EC2_TARGET="${EC2_HOST}"
if ! ssh -i "$EC2_KEY" -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new \
  "${EC2_USER}@${EC2_HOST}" "true" 2>/dev/null; then
  if [[ "$EC2_HOST" =~ ^ec2-([0-9]+)-([0-9]+)-([0-9]+)-([0-9]+)\. ]]; then
    EC2_TARGET="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.${BASH_REMATCH[3]}.${BASH_REMATCH[4]}"
    echo "DNS failed for ${EC2_HOST}; using IP ${EC2_TARGET}"
  fi
fi

echo "==> Uploading nginx conf for ${SITE_NAME}..."
remote_scp "$CONF_LOCAL" "${EC2_USER}@${EC2_TARGET}:/tmp/${SITE_NAME}.conf"

echo "==> Installing into ${CONF_REMOTE} and reloading nginx..."
ssh -i "$EC2_KEY" -o StrictHostKeyChecking=accept-new "${EC2_USER}@${EC2_TARGET}" bash -s << EOF
set -euo pipefail
sudo mv /tmp/${SITE_NAME}.conf ${CONF_REMOTE}
sudo nginx -t
sudo systemctl reload nginx
echo "Installed server_name blocks:"
sudo grep -Rn "server_name" /etc/nginx/conf.d/ | grep -v "#" || true
EOF

if [[ "$RUN_CERTBOT" == true ]]; then
  echo "==> Requesting TLS cert via certbot --nginx..."
  ssh -i "$EC2_KEY" -o StrictHostKeyChecking=accept-new -t "${EC2_USER}@${EC2_TARGET}" \
    "sudo certbot --nginx -d ${SITE_NAME} --redirect"
fi

echo "✅ nginx server block is live for ${SITE_NAME}"
if [[ "$RUN_CERTBOT" != true ]]; then
  echo "   Next on the box:  sudo certbot --nginx -d ${SITE_NAME}"
  echo "   Or re-run:        bash scripts/install_nginx_staging.sh --certbot"
fi
