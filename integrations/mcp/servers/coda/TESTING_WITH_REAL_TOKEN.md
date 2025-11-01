# Testing Coda MCP with Real Coda API Token

**Status**: Ready for Testing
**Prerequisite**: Valid Coda API Token (Personal Access Token)

---

## Prerequisites

### 1. Get a Coda API Token

1. Go to https://coda.io/account/settings
2. Scroll to "API Token" section
3. Click "Generate Token"
4. Select scopes needed:
   - `doc:read` - List and read documents
   - `doc:write` - Create/edit documents (optional)
   - `doc:delete` - Delete documents (optional)
5. Copy the token (format: `pat_xxxxxxxxxxxxx`)

### 2. Export Token Locally

```bash
# Add to your shell profile (~/.bash_profile, ~/.zshrc, etc)
export CODA_API_TOKEN="pat_your_actual_token_here"

# Or set for current session only
CODA_API_TOKEN="pat_your_actual_token_here"
```

### 3. Verify Server is Running

```bash
# Terminal 1: Start the server
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda
pnpm build
node dist/http-server.js

# Terminal 2: Check it's running
curl http://localhost:8080/health
```

---

## Running Tests

### Quick Test

```bash
# Run all tests with your token
CODA_API_TOKEN=pat_xxxx ./test-with-real-token.sh

# Or set token first
export CODA_API_TOKEN=pat_xxxx
./test-with-real-token.sh
```

### Verbose Output

```bash
# See detailed response payloads
VERBOSE=true ./test-with-real-token.sh http://localhost:8080
```

### Test Against Production

```bash
# Test deployed droplet server
CODA_API_TOKEN=pat_xxxx ./test-with-real-token.sh https://coda.bestviable.com
```

---

## Test Categories

### 1. Public Endpoints (No Token Required)

These tests verify basic server functionality:

```bash
✓ Server reachable
✓ Health endpoint responds
✓ OAuth Authorization Server metadata
✓ OAuth Protected Resource metadata
✓ Token validation endpoint
✓ Response headers present
```

**Example**:
```bash
curl http://localhost:8080/health
# Response
{
  "status": "ok",
  "service": "coda-mcp",
  "version": "1.0.0",
  "timestamp": "2025-11-01T21:00:00.000Z"
}
```

### 2. Authentication Tests

These tests verify Bearer token requirements and CORS:

```bash
✓ MCP endpoint rejects requests without token
✓ CORS headers present on OPTIONS
```

**Example - Unauthorized Request**:
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"coda_list_documents","params":{}}'

# Response
{
  "error": {
    "code": -32601,
    "message": "Unauthorized: Missing Bearer token"
  }
}
```

### 3. Authenticated MCP Tests (Token Required)

These tests verify MCP protocol implementation:

```bash
✓ MCP endpoint accepts Bearer token
✓ JSON-RPC 2.0 format validated
✓ Error handling for invalid methods
```

**Example - Valid Request**:
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer pat_xxxx" \
  -H "Mcp-Session-Id: session-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {}
  }'

# Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\n  {\n    \"id\": \"doc_abc...\",\n    \"name\": \"My Document\",\n    ...\n  }\n]"
      }
    ]
  }
}
```

### 4. Coda API Integration Tests (Valid Token Required)

These tests verify actual Coda API connectivity:

```bash
✓ List Coda documents successfully
✓ Session persistence across requests
```

**Example - List Documents**:
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer pat_xxxx" \
  -H "Mcp-Session-Id: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {}
  }' | jq .
```

### 5. Performance Tests

These tests measure response times:

```bash
✓ Health check responds in <100ms
✓ MCP request responds in <5000ms
```

---

## Expected Behaviors

### Successful Test Results

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Coda MCP HTTP-Native Server Test Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Server: http://localhost:8080
Token: pat_xxxx...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Public Endpoints (No Authentication)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

→ Server reachable at http://localhost:8080
✓ Server is reachable
→ Health endpoint responds
✓ Health endpoint returns valid response
→ OAuth Authorization Server metadata
✓ Authorization Server metadata available (issuer: coda-mcp)
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Passed:  20
  Failed:  0
  Skipped: 0

✓ All tests passed!
```

### Common Issues

#### Issue: All tests skipped (no token)

**Cause**: `CODA_API_TOKEN` environment variable not set

**Solution**:
```bash
export CODA_API_TOKEN=pat_your_token_here
./test-with-real-token.sh
```

#### Issue: "401 Unauthorized" from Coda API

**Cause**: Token is invalid or expired

**Solution**:
1. Generate new token at https://coda.io/account/settings
2. Verify token format: `pat_xxxxxxxxxxxxx`
3. Test: `curl -H "Authorization: Bearer $CODA_API_TOKEN" https://coda.io/apis/v1/docs`

#### Issue: "Connection refused"

**Cause**: Server not running

**Solution**:
```bash
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda
pnpm build
node dist/http-server.js
```

---

## Manual Testing

### Test 1: Health Check

```bash
curl -v http://localhost:8080/health

# Expected Response:
# HTTP/1.1 200 OK
# {"status": "ok", "service": "coda-mcp", ...}
```

### Test 2: List Documents

```bash
SESSION_ID=$(uuidgen)

curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {}
  }' | jq '.result.content[0].text | fromjson | .[0]'

# Expected: First document object
# {
#   "id": "doc_abc123...",
#   "name": "Document Name",
#   "owner": {...},
#   ...
# }
```

### Test 3: Get Document Details

```bash
DOC_ID="doc_abc123"  # From Test 2
SESSION_ID=$(uuidgen)

curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"coda_get_document\",
    \"params\": {\"docId\": \"$DOC_ID\"}
  }" | jq '.result.content[0].text | fromjson'

# Expected: Document details
# {
#   "id": "doc_abc123...",
#   "name": "Document Name",
#   "owner": {...},
#   "createdAt": "...",
#   ...
# }
```

### Test 4: Session Persistence

```bash
SESSION_ID=$(uuidgen)

# Request 1: POST /mcp
echo "Request 1: POST /mcp"
RESPONSE1=$(curl -s -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {"limit": 1}
  }')
echo "Response: $(echo $RESPONSE1 | jq '.result // .error')"

# Request 2: GET /mcp (SSE stream)
echo "Request 2: GET /mcp (SSE stream)"
RESPONSE2=$(curl -s -X GET http://localhost:8080/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Accept: text/event-stream")
echo "Response: ${RESPONSE2:0:100}..."

# Request 3: DELETE /mcp (cleanup)
echo "Request 3: DELETE /mcp"
RESPONSE3=$(curl -s -X DELETE http://localhost:8080/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID")
echo "Response: $RESPONSE3"
```

### Test 5: Error Handling

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Mcp-Session-Id: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "nonexistent_method",
    "params": {}
  }' | jq '.'

# Expected: Error response with proper JSON-RPC 2.0 format
# {
#   "jsonrpc": "2.0",
#   "id": 1,
#   "error": {
#     "code": -32601,
#     "message": "Method not found: nonexistent_method"
#   }
# }
```

---

## Complete Integration Test Workflow

This workflow tests the full lifecycle of using the Coda MCP:

```bash
#!/bin/bash
set -e

TOKEN="${CODA_API_TOKEN:?Error: CODA_API_TOKEN not set}"
SERVER="http://localhost:8080"
SESSION_ID=$(uuidgen)

echo "Coda MCP Integration Test"
echo "Server: $SERVER"
echo "Session: $SESSION_ID"
echo ""

# Step 1: List documents
echo "Step 1: List documents"
DOCS=$(curl -s -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {"limit": 5}
  }')

DOC_ID=$(echo $DOCS | jq -r '.result.content[0].text | fromjson | .[0].id')
echo "First document ID: $DOC_ID"
echo ""

# Step 2: Get document details
echo "Step 2: Get document details"
DOC=$(curl -s -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"coda_get_document\",
    \"params\": {\"docId\": \"$DOC_ID\"}
  }")

DOC_NAME=$(echo $DOC | jq -r '.result.content[0].text | fromjson | .name')
echo "Document name: $DOC_NAME"
echo ""

# Step 3: List pages in document
echo "Step 3: List pages in document"
PAGES=$(curl -s -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"coda_list_pages\",
    \"params\": {\"docId\": \"$DOC_ID\", \"limit\": 5}
  }")

PAGE_COUNT=$(echo $PAGES | jq '.result.content[0].text | fromjson | length')
echo "Page count: $PAGE_COUNT"
echo ""

# Step 4: Cleanup session
echo "Step 4: Cleanup session"
curl -s -X DELETE "$SERVER/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" > /dev/null

echo "Session cleaned up"
echo ""
echo "✓ Integration test completed successfully"
```

---

## Troubleshooting

### OAuth Endpoints Not Working

**Check**:
```bash
curl http://localhost:8080/.well-known/oauth-authorization-server | jq .
```

**Expected**: `issuer`, `authorization_endpoint`, `token_endpoint` fields

### Token Validation Not Working

**Check**:
```bash
curl -X POST http://localhost:8080/oauth/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"pat_test"}'
```

**Expected**: JSON response with `valid: true/false`

### MCP Requests Returning Errors

**Check logs**:
```bash
# If running locally
# Look at console output

# If running in Docker
docker logs coda-mcp | tail -50
```

**Common errors**:
- `401 Unauthorized` - Token invalid or expired
- `Method not found` - Tool name incorrect
- `Connection error` - Coda API unreachable

### Session Not Persisting

**Verify**:
```bash
SESSION_ID="test-session"

# Request 1
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  ...

# Request 2 (same SESSION_ID)
curl -X GET http://localhost:8080/mcp \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  ...
```

**Issue**: Session ID must be exactly the same (case-sensitive, no extra spaces)

---

## Next Steps After Testing

Once tests pass:

1. **Deploy to Droplet**
   ```bash
   # Follow: DROPLET_DEPLOYMENT_GUIDE.md
   scp -r . tools-droplet:/root/portfolio/integrations/mcp/servers/coda/
   ```

2. **Test Production**
   ```bash
   ./test-with-real-token.sh https://coda.bestviable.com
   ```

3. **Integrate with Clients**
   ```bash
   # Use CLIENT_INTEGRATION_GUIDE.md for:
   # - Claude.ai integration
   # - CLI clients
   # - JavaScript/TypeScript SDKs
   # - Python integration
   ```

4. **Monitor Deployment**
   ```bash
   # Watch Docker logs
   docker logs -f coda-mcp

   # Check health
   curl https://coda.bestviable.com/health
   ```

---

## Security Notes

### Token Safety

- **Never commit tokens** to git
- **Use environment variables** for token storage
- **Rotate tokens regularly** (monthly recommended)
- **Log only token prefix**: `pat_abc123...` (not full token)

### Bearer Token Format

```
Authorization: Bearer pat_xxxxxxxxxxxxx
```

- Token must be after "Bearer " (with space)
- Invalid format will return 401 Unauthorized

### Cloudflare Access (Production)

When deployed behind Cloudflare Tunnel, additional headers are available:

```bash
curl -H "CF-Access-JWT-Assertion: $JWT" \
     -H "CF-Access-Authenticated-User-Email: user@example.com" \
     https://coda.bestviable.com/health
```

---

## Performance Targets

| Endpoint | Target | Typical |
|----------|--------|---------|
| `/health` | <10ms | 2-5ms |
| `/.well-known/*` | <50ms | 5-10ms |
| `/oauth/validate-token` | <100ms | 10-20ms |
| `/mcp` (list documents) | <5000ms | 500-2000ms |
| `/mcp` (get document) | <5000ms | 500-1000ms |

Performance depends on Coda API response times.

---

**Last Updated**: 2025-11-01
**Status**: Ready for Testing
**Next**: Follow deployment guide to production

