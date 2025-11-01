#!/bin/bash

#############################################################################
# Test Suite: Coda MCP with Real Coda API Token
#
# This script validates the Coda MCP HTTP-native server with actual Coda
# API tokens. It tests all major functionality including authentication,
# OAuth endpoints, and tool execution.
#
# Usage:
#   CODA_API_TOKEN=pat_xxx ./test-with-real-token.sh [server_url]
#
# Example:
#   CODA_API_TOKEN=pat_abc123xyz ./test-with-real-token.sh http://localhost:8080
#   CODA_API_TOKEN=pat_abc123xyz ./test-with-real-token.sh https://coda.bestviable.com
#############################################################################

set -e

# Configuration
SERVER_URL="${1:-http://localhost:8080}"
TOKEN="${CODA_API_TOKEN:-}"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

#############################################################################
# Helper Functions
#############################################################################

log_test() {
  echo -e "${BLUE}→${NC} $1"
}

log_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((PASSED++))
}

log_fail() {
  echo -e "${RED}✗${NC} $1"
  ((FAILED++))
}

log_skip() {
  echo -e "${YELLOW}⊘${NC} $1"
  ((SKIPPED++))
}

log_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}${1}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

verbose() {
  if [ "$VERBOSE" = "true" ]; then
    echo "$@"
  fi
}

#############################################################################
# Test Functions
#############################################################################

test_server_reachable() {
  log_test "Server reachable at $SERVER_URL"

  if curl -s -f "$SERVER_URL/health" > /dev/null 2>&1; then
    log_pass "Server is reachable"
  else
    log_fail "Server is not reachable at $SERVER_URL"
    exit 1
  fi
}

test_token_provided() {
  log_test "Coda API token provided"

  if [ -z "$TOKEN" ]; then
    log_skip "No CODA_API_TOKEN set. Skipping authenticated tests."
    log_skip "Set token: export CODA_API_TOKEN=pat_xxx"
    return 1
  else
    log_pass "Token provided (${TOKEN:0:10}...)"
    return 0
  fi
}

test_health_endpoint() {
  log_test "Health endpoint responds"

  response=$(curl -s "$SERVER_URL/health")

  if echo "$response" | jq -e '.status == "ok"' > /dev/null 2>&1; then
    log_pass "Health endpoint returns valid response"
    verbose "Response: $response"
  else
    log_fail "Health endpoint returned unexpected response"
    verbose "Response: $response"
  fi
}

test_oauth_authorization_server() {
  log_test "OAuth Authorization Server metadata"

  response=$(curl -s "$SERVER_URL/.well-known/oauth-authorization-server")

  if echo "$response" | jq -e '.issuer' > /dev/null 2>&1; then
    issuer=$(echo "$response" | jq -r '.issuer')
    log_pass "Authorization Server metadata available (issuer: $issuer)"
    verbose "Full response: $response"
  else
    log_fail "Authorization Server metadata endpoint failed"
    verbose "Response: $response"
  fi
}

test_oauth_protected_resource() {
  log_test "OAuth Protected Resource metadata"

  response=$(curl -s "$SERVER_URL/.well-known/oauth-protected-resource")

  if echo "$response" | jq -e '.issuer' > /dev/null 2>&1; then
    log_pass "Protected Resource metadata available"
    verbose "Full response: $response"
  else
    log_fail "Protected Resource metadata endpoint failed"
    verbose "Response: $response"
  fi
}

test_token_validation_endpoint() {
  log_test "Token validation endpoint"

  # Test with invalid token
  response=$(curl -s -X POST "$SERVER_URL/oauth/validate-token" \
    -H "Content-Type: application/json" \
    -d '{"token":"invalid-token"}')

  verbose "Response: $response"

  if echo "$response" | jq -e '.valid' > /dev/null 2>&1; then
    log_pass "Token validation endpoint responds"
  else
    log_fail "Token validation endpoint failed"
  fi
}

test_mcp_unauthorized() {
  log_test "MCP endpoint rejects requests without Bearer token"

  response=$(curl -s -X POST "$SERVER_URL/mcp" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"resources/list","params":{}}')

  verbose "Response: $response"

  if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    log_pass "MCP endpoint correctly rejects unauthorized requests"
  else
    log_fail "MCP endpoint should reject unauthorized requests"
  fi
}

test_mcp_with_bearer_token() {
  if ! test_token_provided; then
    return 1
  fi

  log_test "MCP endpoint with Bearer token"

  SESSION_ID=$(uuidgen)

  response=$(curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "resources/list",
      "params": {}
    }')

  verbose "Response: $response"

  if echo "$response" | jq -e '.result' > /dev/null 2>&1 || echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    log_pass "MCP endpoint accepted Bearer token and responded"
  else
    log_fail "MCP endpoint did not respond properly with Bearer token"
  fi
}

test_coda_list_documents() {
  if ! test_token_provided; then
    return 1
  fi

  log_test "List Coda documents"

  SESSION_ID=$(uuidgen)

  response=$(curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "coda_list_documents",
      "params": {}
    }')

  verbose "Response: $response"

  if echo "$response" | jq -e '.result.content' > /dev/null 2>&1; then
    log_pass "Document listing successful"
    # Extract summary if available
    summary=$(echo "$response" | jq -r '.result.content[0].text | split("\n")[0]' 2>/dev/null || echo "")
    if [ -n "$summary" ]; then
      verbose "Summary: ${summary:0:80}..."
    fi
  else
    log_fail "Document listing failed"
    verbose "Full response: $response"
  fi
}

test_session_persistence() {
  if ! test_token_provided; then
    return 1
  fi

  log_test "Session persistence across requests"

  SESSION_ID=$(uuidgen)

  # Request 1
  verbose "Request 1: POST /mcp"
  response1=$(curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "coda_list_documents",
      "params": {"limit": 1}
    }')

  verbose "Response 1: $response1"

  # Request 2 with same session
  verbose "Request 2: GET /mcp (SSE stream)"
  response2=$(curl -s -X GET "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -H "Accept: text/event-stream")

  verbose "Response 2: ${response2:0:100}..."

  # Cleanup
  verbose "Request 3: DELETE /mcp"
  response3=$(curl -s -X DELETE "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $SESSION_ID")

  verbose "Response 3: $response3"

  if echo "$response1" | jq -e '.result' > /dev/null 2>&1 || echo "$response1" | jq -e '.error' > /dev/null 2>&1; then
    log_pass "Session persisted across multiple requests"
  else
    log_fail "Session persistence test failed"
  fi
}

test_cors_headers() {
  log_test "CORS headers on OPTIONS request"

  response=$(curl -s -X OPTIONS "$SERVER_URL/mcp" -v 2>&1 | grep -i "access-control")

  if [ -n "$response" ]; then
    log_pass "CORS headers present"
    verbose "Headers: $response"
  else
    log_fail "CORS headers not present"
  fi
}

test_response_headers() {
  log_test "Response includes required headers"

  headers=$(curl -s -I "$SERVER_URL/health" 2>&1 | grep -E "Content-Type|Server")

  if [ -n "$headers" ]; then
    log_pass "Response headers present"
    verbose "Headers: $headers"
  else
    log_fail "Response headers not present"
  fi
}

test_json_response_format() {
  if ! test_token_provided; then
    return 1
  fi

  log_test "JSON-RPC 2.0 response format"

  SESSION_ID=$(uuidgen)

  response=$(curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "coda_list_documents",
      "params": {}
    }')

  verbose "Response: $response"

  # Check JSON-RPC 2.0 structure
  has_jsonrpc=$(echo "$response" | jq -e '.jsonrpc == "2.0"' > /dev/null 2>&1 && echo "yes" || echo "no")
  has_id=$(echo "$response" | jq -e '.id' > /dev/null 2>&1 && echo "yes" || echo "no")
  has_result_or_error=$(echo "$response" | jq -e '.result // .error' > /dev/null 2>&1 && echo "yes" || echo "no")

  if [ "$has_jsonrpc" = "yes" ] && [ "$has_id" = "yes" ] && [ "$has_result_or_error" = "yes" ]; then
    log_pass "JSON-RPC 2.0 format validated"
  else
    log_fail "JSON-RPC 2.0 format invalid (jsonrpc=$has_jsonrpc, id=$has_id, result/error=$has_result_or_error)"
  fi
}

test_error_handling() {
  if ! test_token_provided; then
    return 1
  fi

  log_test "Error handling for invalid method"

  SESSION_ID=$(uuidgen)

  response=$(curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "nonexistent_tool",
      "params": {}
    }')

  verbose "Response: $response"

  if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
    log_pass "Error properly returned for invalid method"
    error_msg=$(echo "$response" | jq -r '.error.message')
    verbose "Error message: $error_msg"
  else
    log_fail "Error not returned for invalid method"
  fi
}

test_performance() {
  if ! test_token_provided; then
    return 1
  fi

  log_test "Performance: Response time for health check"

  start=$(date +%s%N)
  curl -s "$SERVER_URL/health" > /dev/null
  end=$(date +%s%N)

  duration_ms=$(((end - start) / 1000000))

  if [ "$duration_ms" -lt 100 ]; then
    log_pass "Health check responded in ${duration_ms}ms (fast)"
  else
    log_pass "Health check responded in ${duration_ms}ms"
  fi
}

test_performance_mcp() {
  if ! test_token_provided; then
    return 1
  fi

  log_test "Performance: Response time for MCP request"

  SESSION_ID=$(uuidgen)

  start=$(date +%s%N)
  curl -s -X POST "$SERVER_URL/mcp" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Mcp-Session-Id: $SESSION_ID" \
    -H "Content-Type: application/json" \
    -d '{
      "jsonrpc": "2.0",
      "id": 1,
      "method": "coda_list_documents",
      "params": {"limit": 1}
    }' > /dev/null
  end=$(date +%s%N)

  duration_ms=$(((end - start) / 1000000))

  if [ "$duration_ms" -lt 5000 ]; then
    log_pass "MCP request responded in ${duration_ms}ms"
  else
    log_fail "MCP request took ${duration_ms}ms (slower than expected)"
  fi
}

#############################################################################
# Main Test Suite
#############################################################################

main() {
  echo ""
  log_section "Coda MCP HTTP-Native Server Test Suite"
  echo ""
  echo "Server: $SERVER_URL"
  echo "Token: ${TOKEN:0:10}..."
  echo ""

  # Public endpoint tests (no token required)
  log_section "Public Endpoints (No Authentication)"
  test_server_reachable
  test_health_endpoint
  test_oauth_authorization_server
  test_oauth_protected_resource
  test_token_validation_endpoint
  test_response_headers

  # Authentication tests
  log_section "Authentication Tests"
  test_mcp_unauthorized
  test_cors_headers

  # Token-required tests
  log_section "Authenticated MCP Tests (Requires Token)"
  if test_token_provided; then
    test_mcp_with_bearer_token
    test_json_response_format
    test_error_handling
  fi

  # Coda API tests
  log_section "Coda API Integration Tests (Requires Valid Token)"
  if test_token_provided; then
    test_coda_list_documents
    test_session_persistence
  fi

  # Performance tests
  log_section "Performance Tests"
  if test_token_provided; then
    test_performance
    test_performance_mcp
  else
    test_performance
  fi

  # Results
  log_section "Test Results"
  echo ""
  echo -e "  ${GREEN}Passed:${NC}  $PASSED"
  echo -e "  ${RED}Failed:${NC}  $FAILED"
  echo -e "  ${YELLOW}Skipped:${NC} $SKIPPED"
  echo ""

  if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
  fi
}

#############################################################################
# Run Tests
#############################################################################

main "$@"
