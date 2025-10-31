#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

missing=()
for path in \
  "infra/docker/docker-compose.production.yml" \
  "infra/docker/services/coda-mcp.Dockerfile" \
  "infra/docker/services/digitalocean-mcp.Dockerfile" \
  "infra/docker/services/cloudflare-mcp.Dockerfile" \
  "infra/config/.env.example" \
  "docs/infrastructure/deployment/PRODUCTION_DEPLOYMENT_QUICKSTART.md";
  do
    [[ -f "$REPO_ROOT/$path" ]] || missing+=("$path")
  done

if (( ${#missing[@]} )); then
  echo "Missing required files:" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  exit 1
fi

# Check docker-compose build contexts
if ! grep -q 'dockerfile: infra/docker/services' "$REPO_ROOT/infra/docker/docker-compose.production.yml"; then
  echo "docker-compose production file not updated (dockerfile path mismatch)." >&2
  exit 1
fi

echo "Structure looks good."
