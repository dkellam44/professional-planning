#!/bin/bash

#############################################################################
# Test Suite: Coda MCP with Real Coda API Token + SSE Stream Handling
#
# This script tests the Coda MCP server with proper SSE stream handling.
# Unlike test-with-real-token.sh, this captures SSE events properly.
#
# Usage:
#   CODA_API_TOKEN=pat_xxx ./test-with-sse-stream.sh [server_url]
#
# Example:
#   CODA_API_TOKEN=pat_abc123 ./test-with-sse-stream.sh http://localhost:8080
#############################################################################

set -e

# Configuration
SERVER_URL="${1:-http://localhost:8080}"
TOKEN="${CODA_API_TOKEN:-}"
VERBOSE="${VERBOSE:-false}"
PROTOCOL_VERSION="${PROTOCOL_VERSION:-2025-03-26}"
STREAM_TIMEOUT="${STREAM_TIMEOUT:-5}"  # Seconds to wait for stream responses

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
PASSED=0
FAILED=0

log_test() { echo -e "${BLUE}→${NC} $1"; }
log_pass() { echo -e "${GREEN}✓${NC} $1"; ((PASSED++)); }
log_fail() { echo -e "${RED}✗${NC} $1"; ((FAILED++)); }
log_section() { echo ""; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BLUE}$1${NC}"; echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }
verbose() { if [ "$VERBOSE" = "true" ]; then echo "[VERBOSE] $@"; fi; }

#############################################################################
# Stream Handler Functions
#############################################################################

# Start SSE stream in background and capture to file
# Returns the background job ID
start_sse_stream() {
  local session_id="$1"
  local output_file="$2"

  verbose "Starting SSE stream for session: $session_id"
  verbose "Stream output file: $output_file"

  # Start stream in background, writing to file
  curl -s -N \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $session_id" \
    -H "Accept: text/event-stream" \
    "$SERVER_URL/mcp" > "$output_file" 2>&1 &

  local stream_pid=$!
  verbose "Stream PID: $stream_pid"
  echo "$stream_pid"
}

# Wait for a tool result in the SSE stream
# Returns the JSON result or empty string if timeout
wait_for_result() {
  local stream_file="$1"
  local method_name="$2"
  local wait_time="${3:-$STREAM_TIMEOUT}"

  local start_time=$(date +%s)
  local found_result=""

  verbose "Waiting for result for method: $method_name (timeout: ${wait_time}s)"

  while true; do
    local elapsed=$(($(date +%s) - start_time))

    # Check if we have a data event with result
    if grep -q "^data: " "$stream_file" 2>/dev/null; then
      # Extract JSON events from SSE stream
      local events=$(grep "^data: " "$stream_file" | sed 's/^data: //')

      # Look for result with our method
      found_result=$(echo "$events" | jq -s '.[] | select(.result != null) | select(.method == null or .method == "'"$method_name"'")' 2>/dev/null | head -1)

      if [ -n "$found_result" ]; then
        echo "$found_result"
        return 0
      fi
    fi

    # Timeout check
    if [ "$elapsed" -gt "$wait_time" ]; then
      verbose "Timeout waiting for result after ${wait_time}s"
      return 1
    fi

    # Small delay before retry
    sleep 0.1
  done
}

# Kill SSE stream gracefully
stop_sse_stream() {
  local stream_pid="$1"
  if [ -n "$stream_pid" ] && kill -0 "$stream_pid" 2>/dev/null; then
    verbose "Stopping stream PID $stream_pid"
    kill "$stream_pid" 2>/dev/null || true
    wait "$stream_pid" 2>/dev/null || true
  fi
}

#############################################################################
# Test Functions
#############################################################################

test_health() {
  log_test "Server health check"

  local response
  response=$(curl -s -L "$SERVER_URL/health")

  if echo "$response" | jq -e '.status == "ok"' > /dev/null 2>&1; then
    log_pass "Health endpoint returns valid response"
    return 0
  else
    log_fail "Health endpoint failed"
    return 1
  fi
}

test_initialize_session() {
  log_test "Initialize MCP session with SSE stream"

  if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⊘${NC} No token provided, skipping authenticated tests"
    return 1
  fi

  local headers_file
  headers_file=$(mktemp)

  local payload='{
    "jsonrpc":"2.0","id":1,"method":"initialize",
    "params":{
      "protocolVersion":"'"$PROTOCOL_VERSION"'",
      "capabilities":{},"client":{"name":"coda-mcp-test","version":"1.0"}
    }
  }'

  verbose "Initialization payload: $payload"

  # Initialize session
  local response
  response=$(curl -s -D "$headers_file" \
    -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload")

  verbose "Init response: $response"

  local session_id
  session_id=$(grep -i 'mcp-session-id:' "$headers_file" 2>/dev/null | awk '{print $2}' | tr -d '\r')
  rm -f "$headers_file"

  if [ -z "$session_id" ]; then
    log_fail "Failed to get session ID"
    return 1
  fi

  log_pass "Session initialized (ID: ${session_id:0:8}...)"

  # Store for global use
  LAST_SESSION_ID="$session_id"
  echo "$session_id"

  return 0
}

test_tools_list_with_stream() {
  log_test "List tools via MCP with SSE stream"

  if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⊘${NC} No token, skipping"
    return 1
  fi

  local session_id
  session_id=$(test_initialize_session) || return 1

  local stream_file
  stream_file=$(mktemp)

  # Start SSE stream
  local stream_pid
  stream_pid=$(start_sse_stream "$session_id" "$stream_file")

  # Give stream a moment to connect
  sleep 0.5

  # Send tool request
  local payload='{
    "jsonrpc":"2.0","id":1,"method":"tools/list","params":{}
  }'

  verbose "Sending tools/list request"

  curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $session_id" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null

  verbose "Waiting for stream response..."

  # Wait for result in stream
  local result
  result=$(wait_for_result "$stream_file" "tools/list" 5) || result=""

  # Cleanup
  stop_sse_stream "$stream_pid"
  rm -f "$stream_file"

  if [ -n "$result" ]; then
    log_pass "Received tools/list response via SSE"
    verbose "Result: $(echo "$result" | jq -r '.result | length' 2>/dev/null || echo 'N/A') tools"
    return 0
  else
    log_fail "No response received for tools/list via SSE"
    return 1
  fi
}

test_coda_list_documents_with_stream() {
  log_test "List Coda documents via SSE stream"

  if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⊘${NC} No token, skipping"
    return 1
  fi

  local session_id
  session_id=$(test_initialize_session) || return 1

  local stream_file
  stream_file=$(mktemp)

  # Start SSE stream
  local stream_pid
  stream_pid=$(start_sse_stream "$session_id" "$stream_file")
  sleep 0.5

  # Send list documents request
  local payload='{
    "jsonrpc":"2.0","id":1,"method":"coda_list_documents","params":{"limit":5}
  }'

  verbose "Sending coda_list_documents request"

  curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $session_id" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null

  # Wait for result
  local result
  result=$(wait_for_result "$stream_file" "coda_list_documents" 8) || result=""

  # Cleanup
  stop_sse_stream "$stream_pid"
  rm -f "$stream_file"

  if [ -n "$result" ]; then
    log_pass "Received coda_list_documents response"
    local doc_count=$(echo "$result" | jq -r '.result.content | length' 2>/dev/null || echo '?')
    verbose "Document count in response: $doc_count"
    return 0
  else
    log_fail "No response received for coda_list_documents"
    return 1
  fi
}

test_invalid_method_error() {
  log_test "Error handling for invalid method"

  if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⊘${NC} No token, skipping"
    return 1
  fi

  local session_id
  session_id=$(test_initialize_session) || return 1

  local stream_file
  stream_file=$(mktemp)

  # Start SSE stream
  local stream_pid
  stream_pid=$(start_sse_stream "$session_id" "$stream_file")
  sleep 0.5

  # Send invalid request
  local payload='{
    "jsonrpc":"2.0","id":1,"method":"nonexistent_method","params":{}
  }'

  curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $session_id" \
    -H "Content-Type: application/json" \
    -d "$payload" > /dev/null

  # Wait for error response
  local result
  result=$(wait_for_result "$stream_file" "nonexistent_method" 5) || result=""

  stop_sse_stream "$stream_pid"
  rm -f "$stream_file"

  if [ -n "$result" ] && echo "$result" | jq -e '.error' > /dev/null 2>&1; then
    log_pass "Correctly returned error for invalid method"
    verbose "Error: $(echo "$result" | jq -r '.error.message')"
    return 0
  else
    log_fail "Did not receive error response for invalid method"
    return 1
  fi
}

#############################################################################
# Main
#############################################################################

main() {
  echo ""
  log_section "Coda MCP Test Suite with SSE Stream Handling"
  echo "Server: $SERVER_URL"
  echo "Protocol Version: $PROTOCOL_VERSION"
  echo ""

  test_health

  if [ -n "$TOKEN" ]; then
    log_section "Authenticated Tests (Token: ${TOKEN:0:10}...)"
    test_tools_list_with_stream
    test_coda_list_documents_with_stream
    test_invalid_method_error
  else
    echo -e "${YELLOW}No CODA_API_TOKEN set. Skipping authenticated tests.${NC}"
    echo "To run all tests: export CODA_API_TOKEN=pat_your_token_here"
  fi

  echo ""
  log_section "Test Results"
  echo -e "  ${GREEN}Passed:${NC}  $PASSED"
  echo -e "  ${RED}Failed:${NC}  $FAILED"
  echo ""

  if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
  fi
}

main "$@"
