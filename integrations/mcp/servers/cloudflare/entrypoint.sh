#!/bin/sh
set -e

PORT="${MCP_PROXY_PORT:-8083}"
REMOTE_URL="${CLOUDFLARE_REMOTE_URL:-}"
TRANSPORT="${CLOUDFLARE_TRANSPORT_STRATEGY:-http-first}"
CALLBACK_PORT="${CLOUDFLARE_CALLBACK_PORT:-}"
HEADERS="${CLOUDFLARE_HEADERS:-}"
API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
IGNORE_TOOLS="${CLOUDFLARE_IGNORE_TOOLS:-}"

if [ -z "${REMOTE_URL}" ]; then
  echo "CLOUDFLARE_REMOTE_URL must be set" >&2
  exit 1
fi

set -- npx --yes mcp-remote "${REMOTE_URL}" --transport "${TRANSPORT}"

if [ -n "${CALLBACK_PORT}" ]; then
  set -- "$@" "${CALLBACK_PORT}"
fi

if [ -n "${API_TOKEN}" ]; then
  set -- "$@" --header "Authorization: Bearer ${API_TOKEN}"
fi

if [ -n "${HEADERS}" ]; then
  # HEADERS is expected as semicolon-separated KEY:VALUE pairs
  IFS=';' read -r -a header_array <<EOF_HEADERS
${HEADERS}
EOF_HEADERS
  for header in "${header_array[@]}"; do
    if [ -n "$header" ]; then
      set -- "$@" --header "$header"
    fi
  done
fi

if [ -n "${IGNORE_TOOLS}" ]; then
  IFS=',' read -r -a ignore_array <<EOF_IGNORE
${IGNORE_TOOLS}
EOF_IGNORE
  for tool in "${ignore_array[@]}"; do
    if [ -n "$tool" ]; then
      set -- "$@" --ignore-tool "$tool"
    fi
  done
fi

exec mcp-proxy \
  --host 0.0.0.0 \
  --port "${PORT}" \
  -- "$@"
