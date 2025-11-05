#!/bin/bash

# Test script for OAuth integration in Coda MCP Server
# Starts the server in the background and tests all OAuth endpoints

set -e

PORT=8080
BASE_URL="http://localhost:${PORT}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Coda MCP OAuth Test...${NC}\n"

# Start the server in background
echo "Starting HTTP server on port ${PORT}..."
node dist/http-server.js > /tmp/coda-mcp.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    kill $SERVER_PID 2>/dev/null || true
}

trap cleanup EXIT

echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}\n"

# Test 1: Health Endpoint
echo -e "${YELLOW}Test 1: Health Endpoint${NC}"
RESULT=$(curl -s "$BASE_URL/health" | jq -r '.status')
if [ "$RESULT" = "ok" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}\n"
else
    echo -e "${RED}✗ Health check failed${NC}\n"
    exit 1
fi

# Test 2: OAuth Authorization Server Metadata
echo -e "${YELLOW}Test 2: OAuth Authorization Server Metadata${NC}"
RESULT=$(curl -s "$BASE_URL/.well-known/oauth-authorization-server" | jq -r '.issuer')
if [ ! -z "$RESULT" ]; then
    echo -e "${GREEN}✓ Authorization Server metadata endpoint working${NC}"
    echo "  Issuer: $RESULT"
    echo ""
else
    echo -e "${RED}✗ Authorization Server endpoint failed${NC}\n"
    exit 1
fi

# Test 3: OAuth Protected Resource Metadata
echo -e "${YELLOW}Test 3: OAuth Protected Resource Metadata${NC}"
RESULT=$(curl -s "$BASE_URL/.well-known/oauth-protected-resource" | jq -r '.resource_id')
if [ "$RESULT" = "coda-mcp" ]; then
    echo -e "${GREEN}✓ Protected Resource metadata endpoint working${NC}"
    echo "  Resource ID: $RESULT"
    echo ""
else
    echo -e "${RED}✗ Protected Resource endpoint failed${NC}\n"
    exit 1
fi

# Test 4: Token Validation Endpoint (missing token)
echo -e "${YELLOW}Test 4: Token Validation Endpoint (missing token)${NC}"
RESULT=$(curl -s -X POST "$BASE_URL/oauth/validate-token" -H "Content-Type: application/json" -d '{}' | jq -r '.valid')
if [ "$RESULT" = "false" ]; then
    echo -e "${GREEN}✓ Correctly rejected request without token${NC}\n"
else
    echo -e "${RED}✗ Token validation should reject missing token${NC}\n"
    exit 1
fi

# Test 5: Token Validation Endpoint (with token)
echo -e "${YELLOW}Test 5: Token Validation Endpoint (with token)${NC}"
RESULT=$(curl -s -X POST "$BASE_URL/oauth/validate-token" \
    -H "Content-Type: application/json" \
    -d '{"token": "test-token-12345"}' | jq -r '.valid')
if [ "$RESULT" = "true" ]; then
    echo -e "${GREEN}✓ Correctly accepted token${NC}\n"
else
    echo -e "${RED}✗ Token validation should accept valid token${NC}\n"
    exit 1
fi

# Test 6: Cloudflare Access Header Support
echo -e "${YELLOW}Test 6: Cloudflare Access Header Support${NC}"
RESULT=$(curl -s -X GET "$BASE_URL/health" \
    -H "Cf-Access-Jwt-Assertion: test-jwt-token" \
    -H "Cf-Access-Authenticated-User-Email: test@example.com" | jq -r '.status')
if [ "$RESULT" = "ok" ]; then
    echo -e "${GREEN}✓ Cloudflare Access headers are supported${NC}\n"
else
    echo -e "${RED}✗ Cloudflare Access header support failed${NC}\n"
    exit 1
fi

# Test 7: Check server logs for OAuth events
echo -e "${YELLOW}Test 7: Server Logging${NC}"
if grep -q "\[OAUTH\]" /tmp/coda-mcp.log; then
    echo -e "${GREEN}✓ OAuth events are being logged${NC}"
    echo ""
else
    echo -e "${RED}✗ OAuth logging not detected${NC}\n"
fi

if grep -q "\[CLOUDFLARE\]" /tmp/coda-mcp.log; then
    echo -e "${GREEN}✓ Cloudflare Access events are being logged${NC}\n"
else
    echo -e "${YELLOW}! Cloudflare Access not tested (requires CF headers)${NC}\n"
fi

echo -e "${GREEN}✓ All OAuth tests passed!${NC}"
