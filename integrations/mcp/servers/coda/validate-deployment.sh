#!/bin/bash

# Deployment Validation Script for Coda MCP HTTP-Native Server
# Tests all critical endpoints and functionality after deployment
# Can be run locally or on droplet via SSH

set -e

# Configuration
SERVER_URL="${1:-http://localhost:8080}"
VERBOSE="${VERBOSE:-false}"
TIMEOUT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_endpoint() {
  local name=$1
  local method=$2
  local path=$3
  local headers=$4
  local data=$5
  local expected_status=$6

  printf "%-60s" "Testing: $name... "

  local cmd="curl -s -w '\n%{http_code}' -X $method '${SERVER_URL}${path}'"

  if [ ! -z "$headers" ]; then
    cmd="$cmd $headers"
  fi

  if [ ! -z "$data" ]; then
    cmd="$cmd -d '$data'"
  fi

  local response=$(eval $cmd)
  local body=$(echo "$response" | head -n -1)
  local status=$(echo "$response" | tail -n 1)

  if [ "$status" = "$expected_status" ]; then
    echo -e "${GREEN}✓ ($status)${NC}"
    ((TESTS_PASSED++))
    if [ "$VERBOSE" = "true" ]; then
      echo "  Response: $(echo "$body" | head -c 100)..."
    fi
  else
    echo -e "${RED}✗ (expected $expected_status, got $status)${NC}"
    ((TESTS_FAILED++))
    if [ "$VERBOSE" = "true" ]; then
      echo "  Response: $body"
    fi
  fi
}

# Main
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║ Coda MCP HTTP-Native Server - Deployment Validation           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Server: $SERVER_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Check connectivity
echo -e "${YELLOW}Step 1: Checking Server Connectivity${NC}"
if timeout $TIMEOUT curl -s "$SERVER_URL/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Server is reachable${NC}"
else
  echo -e "${RED}✗ Server is not reachable at $SERVER_URL${NC}"
  echo "Make sure the server is running and accessible."
  exit 1
fi
echo ""

# Health Check Endpoints
echo -e "${YELLOW}Step 2: Testing Health Check Endpoints${NC}"
test_endpoint "Health check" GET "/health" "" "" "200"
echo ""

# OAuth Discovery Endpoints
echo -e "${YELLOW}Step 3: Testing OAuth Discovery Endpoints${NC}"
test_endpoint "OAuth Authorization Server metadata" GET "/.well-known/oauth-authorization-server" "" "" "200"
test_endpoint "OAuth Protected Resource metadata" GET "/.well-known/oauth-protected-resource" "" "" "200"
test_endpoint "OAuth Token Validation (missing token)" POST "/oauth/validate-token" "-H 'Content-Type: application/json'" '{}' "400"
test_endpoint "OAuth Token Validation (with token)" POST "/oauth/validate-token" "-H 'Content-Type: application/json'" '{"token":"test-token"}' "200"
echo ""

# Bearer Token Authentication
echo -e "${YELLOW}Step 4: Testing Bearer Token Authentication${NC}"
test_endpoint "MCP endpoint without auth" POST "/mcp" "-H 'Content-Type: application/json'" '{}' "401"
test_endpoint "MCP endpoint with invalid token" POST "/mcp" "-H 'Authorization: Bearer invalid'" "-H 'Content-Type: application/json'" '{}' "400"
echo ""

# CORS Headers
echo -e "${YELLOW}Step 5: Testing CORS Headers${NC}"
test_endpoint "CORS OPTIONS request" OPTIONS "/mcp" "-H 'Origin: http://localhost:3000'" "" "200"
echo ""

# Cloudflare Access Support
echo -e "${YELLOW}Step 6: Testing Cloudflare Access Support${NC}"
test_endpoint "Request with CF Access headers" GET "/health" \
  "-H 'Cf-Access-Jwt-Assertion: test-jwt' \
   -H 'Cf-Access-Authenticated-User-Email: test@example.com'" \
  "" "200"
echo ""

# Content Type Validation
echo -e "${YELLOW}Step 7: Testing Content Type Handling${NC}"
test_endpoint "JSON Content-Type accepted" POST "/mcp" \
  "-H 'Authorization: Bearer test' \
   -H 'Content-Type: application/json'" \
  '{}' "400"
echo ""

# Server Capabilities
echo -e "${YELLOW}Step 8: Checking Server Capabilities${NC}"
echo -n "Checking OAuth scopes... "
SCOPES=$(curl -s "$SERVER_URL/.well-known/oauth-authorization-server" | grep -o '"scopes_supported":\[[^]]*\]')
if echo "$SCOPES" | grep -q "mcp:tools"; then
  echo -e "${GREEN}✓${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC}"
  ((TESTS_FAILED++))
fi

echo -n "Checking grant types... "
GRANTS=$(curl -s "$SERVER_URL/.well-known/oauth-authorization-server" | grep -o '"grant_types_supported":\[[^]]*\]')
if echo "$GRANTS" | grep -q "authorization_code"; then
  echo -e "${GREEN}✓${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC}"
  ((TESTS_FAILED++))
fi

echo -n "Checking MCP endpoints... "
ENDPOINTS=$(curl -s "$SERVER_URL/.well-known/oauth-protected-resource" | grep -c "path")
if [ $ENDPOINTS -gt 0 ]; then
  echo -e "${GREEN}✓ ($ENDPOINTS endpoints documented)${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗${NC}"
  ((TESTS_FAILED++))
fi
echo ""

# Performance Check
echo -e "${YELLOW}Step 9: Performance Check${NC}"
echo -n "Response time for health check... "
START=$(date +%s%N)
curl -s "$SERVER_URL/health" > /dev/null
END=$(date +%s%N)
MS=$(( (END - START) / 1000000 ))
if [ $MS -lt 1000 ]; then
  echo -e "${GREEN}${MS}ms (OK)${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}${MS}ms (slow)${NC}"
  ((TESTS_PASSED++))
fi
echo ""

# Summary
echo -e "${YELLOW}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Results:"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All validation tests passed!${NC}"
  echo ""
  echo "Server is ready for production."
  exit 0
else
  echo -e "${RED}✗ Some tests failed. Check configuration and logs.${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "• Check server logs: docker logs coda-mcp"
  echo "• Verify server is running on correct port"
  echo "• Check firewall and network connectivity"
  echo "• Ensure NODE_ENV and PORT are set correctly"
  exit 1
fi
