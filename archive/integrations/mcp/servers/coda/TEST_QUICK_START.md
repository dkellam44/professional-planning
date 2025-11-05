# Test Quick Start - Coda MCP with Real Token

**Time Required**: 5-10 minutes
**Prerequisites**: Valid Coda API Token

---

## 30-Second Setup

```bash
# 1. Get your token from https://coda.io/account/settings
export CODA_API_TOKEN=pat_your_token_here

# 2. Start the server (Terminal 1)
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda
pnpm build && node dist/http-server.js

# 3. Run tests (Terminal 2)
./test-with-real-token.sh
```

---

## Copy-Paste Commands

### No Token (Test Public Endpoints)

```bash
# Health check
curl http://localhost:8080/health

# OAuth metadata
curl http://localhost:8080/.well-known/oauth-authorization-server
curl http://localhost:8080/.well-known/oauth-protected-resource

# Token validation
curl -X POST http://localhost:8080/oauth/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}'
```

### With Token (Full Tests)

```bash
# Set token
export CODA_API_TOKEN=pat_xxxxxxxxxxxxx

# Run full test suite
./test-with-real-token.sh

# Run with verbose output
VERBOSE=true ./test-with-real-token.sh

# Manual test: List documents
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Mcp-Session-Id: session-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {}
  }' | jq .
```

---

## What Tests Check

### Public (No Token)
- ✓ Server running and responding
- ✓ Health endpoint works
- ✓ OAuth endpoints accessible
- ✓ Proper headers in responses

### Private (With Token)
- ✓ Bearer token authentication works
- ✓ Coda API connectivity verified
- ✓ Document listing works
- ✓ Session persistence works
- ✓ Error handling works
- ✓ Response performance acceptable

---

## Expected Result

```
✓ Passed:  20
✓ Failed:  0
✓ Skipped: 0

✓ All tests passed!
```

---

## Troubleshooting

**No token?**
```bash
# Generate at https://coda.io/account/settings
# Then: export CODA_API_TOKEN=pat_...
```

**Server not running?**
```bash
# Terminal 1: Start it
node dist/http-server.js
```

**Tests failing?**
```bash
# Run with verbose output
VERBOSE=true ./test-with-real-token.sh

# Check server logs in Terminal 1
```

---

## Next Steps

Once tests pass:

1. **Deploy to Droplet**
   - Follow: `DROPLET_DEPLOYMENT_GUIDE.md`

2. **Test Production**
   - `./test-with-real-token.sh https://coda.bestviable.com`

3. **Integrate with Clients**
   - Follow: `CLIENT_INTEGRATION_GUIDE.md`

---

See `TESTING_WITH_REAL_TOKEN.md` for detailed guide.
