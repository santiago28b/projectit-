#!/usr/bin/env bash
# SSH into the Project It / Prometheus EC2 host.

cd "$(dirname "$0")/.." || exit 1
set -euo pipefail

# shellcheck source=lib/ec2.sh
source "$(dirname "$0")/lib/ec2.sh"

require_ec2_key
exec ssh -i "$EC2_KEY" -o StrictHostKeyChecking=accept-new "${EC2_USER}@${EC2_HOST}" "$@"
