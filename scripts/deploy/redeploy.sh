#!/usr/bin/env bash
# redeploy.sh — pull latest code and rebuild the Docker stack.
# Called by webhook.mjs on every push to main.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_DIR"

echo "[redeploy] $(date -u) — starting"

git pull origin main
docker compose up -d --build --remove-orphans

echo "[redeploy] $(date -u) — done"

