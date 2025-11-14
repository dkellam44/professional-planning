#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
REMOTE="root@159.65.97.146:/root/portfolio"

printf '\n=== Portfolio → Droplet sync ===\n'

if ! command -v rsync >/dev/null; then
  echo "rsync is required" >&2
  exit 1
fi

read -p "Sync infra/ and docs/infra to droplet? (y/N) " confirm
[[ "${confirm:-}" == "y" || "${confirm:-}" == "Y" ]] || { echo "Aborted"; exit 0; }

rsync -av --delete \
  --exclude 'config/.env.local' \
  --exclude 'config/.env' \
  --exclude '*.DS_Store' \
  "$REPO_ROOT/infra/" "$REMOTE/infra/"

rsync -av \
  --exclude '*.DS_Store' \
  "$REPO_ROOT/docs/infrastructure/" "$REMOTE/docs/infrastructure/"

printf '\nSync complete. Remember to run docker compose on the droplet.\n'
