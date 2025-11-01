#!/bin/bash

# Example: Make an MCP request to Coda MCP HTTP Server
# This demonstrates how to use the MCP protocol over HTTP

set -e

# Configuration
SERVER_URL="${1:-http://localhost:8080}"
BEARER_TOKEN="${CODA_API_TOKEN:-your-coda-api-token}"
SESSION_ID="${SESSION_ID:-$(uuidgen)}"

echo "Coda MCP HTTP Request Example"
echo "=============================="
echo "Server: $SERVER_URL"
echo "Session: $SESSION_ID"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "$BEARER_TOKEN" = "your-coda-api-token" ]; then
    echo "ERROR: Please set CODA_API_TOKEN environment variable"
    echo "  export CODA_API_TOKEN=your-actual-token"
    exit 1
fi

# Step 1: Health check
echo -e "${YELLOW}Step 1: Health Check${NC}"
curl -s "$SERVER_URL/health" | jq .
echo ""

# Step 2: Discover OAuth metadata
echo -e "${YELLOW}Step 2: OAuth Server Metadata${NC}"
curl -s "$SERVER_URL/.well-known/oauth-authorization-server" | jq '.scopes_supported, .grant_types_supported'
echo ""

# Step 3: Make MCP request (resources/list)
echo -e "${YELLOW}Step 3: Make MCP Request (resources/list)${NC}"
echo "Sending JSON-RPC request to /mcp endpoint..."
echo ""

RESPONSE=$(curl -s -X POST "$SERVER_URL/mcp" \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/list",
    "params": {}
  }')

echo "$RESPONSE" | jq .

# Extract result or error
RESULT=$(echo "$RESPONSE" | jq -r '.result // .error')
if [ "$RESULT" != "null" ]; then
    echo -e "${GREEN}✓ Request succeeded${NC}"
else
    echo "Error in response"
fi

echo ""
echo "Session persists - try making another request with same Session ID:"
echo "  export SESSION_ID=$SESSION_ID"
echo "  ./curl-mcp-request.sh"
