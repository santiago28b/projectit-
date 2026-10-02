#!/usr/bin/env bash
# Shared EC2 helpers for Project It deploy scripts.
# Override any of these with env vars: EC2_HOST, EC2_USER, EC2_KEY.

EC2_HOST="${EC2_HOST:-ec2-100-55-4-105.compute-1.amazonaws.com}"
EC2_USER="${EC2_USER:-ec2-user}"

_scripts_lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${_scripts_lib_dir}/../.." && pwd)"

resolve_ec2_key() {
  if [[ -n "${EC2_KEY:-}" ]]; then
    if [[ ! -f "$EC2_KEY" ]]; then
      echo "EC2_KEY is set but not found: $EC2_KEY" >&2
      return 1
    fi
    printf '%s\n' "$EC2_KEY"
    return 0
  fi

  local candidate
  for candidate in \
    "${REPO_ROOT}/../keys/prometheus_key.pem" \
    "${HOME}/Desktop/job/prometheus/keys/prometheus_key.pem" \
    "${HOME}/Desktop/job/prometheus/prometheus-portal/../keys/prometheus_key.pem"; do
    if [[ -f "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  echo "Deploy key not found. Set EC2_KEY to your .pem path." >&2
  echo "Tried: ../keys/prometheus_key.pem and ~/Desktop/job/prometheus/keys/prometheus_key.pem" >&2
  return 1
}

require_ec2_key() {
  EC2_KEY="$(resolve_ec2_key)"
  export EC2_KEY
  chmod 400 "$EC2_KEY" 2>/dev/null || true
}

remote() {
  ssh -i "$EC2_KEY" -o StrictHostKeyChecking=accept-new "${EC2_USER}@${EC2_HOST}" "$@"
}

remote_scp() {
  scp -i "$EC2_KEY" -o StrictHostKeyChecking=accept-new "$@"
}
