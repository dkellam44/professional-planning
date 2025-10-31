#!/bin/sh
set -e

PORT="${MCP_PROXY_PORT:-8082}"
LOG_LEVEL="${DIGITALOCEAN_LOG_LEVEL:-info}"
SERVICES="${DIGITALOCEAN_SERVICES:-}"
ENDPOINT="${DIGITALOCEAN_API_ENDPOINT:-}"

set -- /usr/local/bin/mcp-digitalocean --transport stdio --log-level "${LOG_LEVEL}"

if [ -n "${SERVICES}" ]; then
  set -- "$@" --services "${SERVICES}"
fi

if [ -n "${ENDPOINT}" ]; then
  set -- "$@" --digitalocean-api-endpoint "${ENDPOINT}"
fi

exec mcp-proxy \
  --host 0.0.0.0 \
  --port "${PORT}" \
  -- "$@"
