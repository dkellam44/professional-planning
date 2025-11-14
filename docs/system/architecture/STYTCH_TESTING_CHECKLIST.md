# Stytch OAuth 2.1 Integration Testing Checklist

**Purpose**: Comprehensive testing plan for validating Stytch OAuth 2.1 integration with Coda MCP server

**Audience**: Developers implementing or validating the Stytch integration
**Prerequisites**: Stytch account created, Coda MCP server deployed with Stytch SDK

---

## Pre-Deployment Testing (Local)

### 1. Configuration Validation

- [ ] `.env` file contains all required Stytch variables:
  - [ ] `STYTCH_PROJECT_ID` is set (format: `project-test-...`)
  - [ ] `STYTCH_SECRET` is set (format: `secret-test-...`)
  - [ ] `CODA_API_TOKEN` is set
  - [ ] `BASE_URL` is set (e.g., `https://coda.bestviable.com`)

- [ ] Stytch credentials are correct:
  - [ ] Copy-paste directly from Stytch Dashboard (no typos)
  - [ ] Using **Test** environment credentials (not Live)
  - [ ] Project ID and Secret match the same project

- [ ] TypeScript compilation succeeds:
  ```bash
  npm run build
  ```

- [ ] No TypeScript errors in:
  - [ ] `src/middleware/stytch-auth.ts`
  - [ ] `src/routes/oauth-metadata.ts`
  - [ ] `src/config.ts`

---

### 2. Health Check Endpoint

**Test**: Basic server startup and health endpoint

```bash
# Start server locally
npm run dev

# In another terminal, test health endpoint
curl http://localhost:8080/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "service": "coda-mcp",
  "version": "2.0.0",
  "auth": {
    "provider": "stytch",
    "oauth_compliant": true,
    "oauth_version": "2.1"
  },
  "timestamp": "2025-11-14T..."
}
```

**Checklist**:
- [ ] Server starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Response shows `"provider": "stytch"`
- [ ] Response shows `"oauth_compliant": true`
- [ ] Timestamp is current

---

### 3. OAuth Metadata Endpoints

**Test 1**: Authorization Server Metadata (RFC 8414)

```bash
curl http://localhost:8080/.well-known/oauth-authorization-server
```

**Expected Response** (partial):
```json
{
  "issuer": "https://api.stytch.com",
  "authorization_endpoint": "https://api.stytch.com/v1/public/oauth/authorize",
  "token_endpoint": "https://api.stytch.com/v1/public/oauth/token",
  "jwks_uri": "https://api.stytch.com/v1/public/keys",
  "response_types_supported": ["code"],
  "code_challenge_methods_supported": ["S256"]
}
```

**Checklist**:
- [ ] Endpoint returns 200 OK
- [ ] `issuer` is `https://api.stytch.com`
- [ ] `authorization_endpoint` is present
- [ ] `token_endpoint` is present
- [ ] `code_challenge_methods_supported` includes `S256` (PKCE)

---

**Test 2**: Protected Resource Metadata (RFC 9728)

```bash
curl http://localhost:8080/.well-known/oauth-protected-resource
```

**Expected Response**:
```json
{
  "resource": "https://coda.bestviable.com",
  "authorization_servers": ["https://api.stytch.com"],
  "scopes_supported": ["mcp.read", "mcp.write", "mcp.tools"],
  "bearer_methods_supported": ["header"]
}
```

**Checklist**:
- [ ] Endpoint returns 200 OK
- [ ] `resource` matches your `BASE_URL`
- [ ] `authorization_servers` includes Stytch
- [ ] `scopes_supported` includes MCP scopes

---

**Test 3**: JWKS Endpoint (proxies to Stytch)

```bash
curl http://localhost:8080/.well-known/jwks.json
```

**Expected Response** (partial):
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "...",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

**Checklist**:
- [ ] Endpoint returns 200 OK
- [ ] Response contains `keys` array
- [ ] Keys have `kty: "RSA"`
- [ ] Keys have `kid`, `n`, `e` fields

---

### 4. Authentication Middleware (Negative Tests)

**Test 1**: Missing Authorization header

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

**Expected Response**:
```json
{
  "error": "unauthorized",
  "message": "Missing or invalid Authorization header. Expected: Bearer <token>",
  "timestamp": "..."
}
```

**Checklist**:
- [ ] Returns 401 Unauthorized
- [ ] Error message mentions missing header

---

**Test 2**: Invalid Bearer token

```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_123" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

**Expected Response**:
```json
{
  "error": "unauthorized",
  "message": "Invalid or expired access token",
  "timestamp": "..."
}
```

**Checklist**:
- [ ] Returns 401 Unauthorized
- [ ] Error message mentions invalid token
- [ ] Stytch validation error logged to console

---

## Deployment Testing (Droplet)

### 5. Docker Build & Deploy

```bash
# On droplet
cd /home/david/services/mcp-servers/coda

# Rebuild with --no-cache
docker-compose down
docker-compose build --no-cache

# Start service
docker-compose up -d

# Check logs
docker logs coda-mcp -f
```

**Expected Logs**:
```
✅ Configuration validated successfully
   Auth provider: Stytch OAuth 2.1
   Stytch Project ID: project-test-...
   Base URL: https://coda.bestviable.com
   ...
🚀 Coda MCP Server started
   URL: http://0.0.0.0:8080
   Auth: Stytch OAuth 2.1 (PKCE required)
```

**Checklist**:
- [ ] Docker build succeeds
- [ ] Container starts without errors
- [ ] Logs show "Auth provider: Stytch OAuth 2.1"
- [ ] No error messages in logs

---

### 6. External Access via Traefik

**Test**: Health check via public URL

```bash
curl https://coda.bestviable.com/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "service": "coda-mcp",
  "auth": {
    "provider": "stytch",
    "oauth_compliant": true
  }
}
```

**Checklist**:
- [ ] HTTPS request succeeds (via Cloudflare Tunnel → Traefik)
- [ ] Health endpoint accessible publicly
- [ ] OAuth metadata endpoints accessible:
  - [ ] `https://coda.bestviable.com/.well-known/oauth-authorization-server`
  - [ ] `https://coda.bestviable.com/.well-known/oauth-protected-resource`
  - [ ] `https://coda.bestviable.com/.well-known/jwks.json`

---

## OAuth Flow Testing

### 7. Stytch OAuth Flow (Browser Test)

**Setup**: Use Stytch Dashboard Test Console

1. **In Stytch Dashboard**:
   - Go to **OAuth** → **Test Console**
   - Click **"Try OAuth Flow"**

2. **Authorization Request**:
   - Stytch generates authorization URL with PKCE
   - Example: `https://api.stytch.com/v1/public/oauth/authorize?client_id=...&code_challenge=...`

3. **User Authentication**:
   - Enter your email address
   - Check email for magic link
   - Click magic link

4. **Token Exchange**:
   - Stytch redirects with authorization code
   - Exchanges code for access token (with PKCE verifier)
   - Returns: `{ access_token, refresh_token, expires_in }`

**Checklist**:
- [ ] Authorization URL generated successfully
- [ ] Magic link email received
- [ ] Magic link redirects correctly
- [ ] Access token received
- [ ] Access token starts with `stk_`

---

### 8. MCP Request with Stytch Token

**Test**: Authenticated MCP request

```bash
# Replace YOUR_STYTCH_TOKEN with token from step 7
curl -X POST https://coda.bestviable.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_STYTCH_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

**Expected Response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { ... },
    "serverInfo": {
      "name": "coda-mcp-server",
      "version": "2.0.0"
    }
  }
}
```

**Checklist**:
- [ ] Request returns 200 OK
- [ ] Response is valid JSON-RPC 2.0
- [ ] Server initializes successfully
- [ ] No authentication errors
- [ ] Server logs show: `[AUTH] Stytch auth successful: user@example.com`

---

## ChatGPT Integration Testing

### 9. ChatGPT Web Connection

**Setup**: Configure MCP in ChatGPT

1. Open ChatGPT web (https://chatgpt.com)
2. Go to **Settings** → **Extensions** → **Model Context Protocol**
3. Click **"Add MCP Server"**
4. Fill in configuration:
   - **Name**: Coda
   - **URL**: `https://coda.bestviable.com/mcp`
   - **OAuth Authorization URL**: `https://api.stytch.com/v1/public/oauth/authorize`
   - **OAuth Token URL**: `https://api.stytch.com/v1/public/oauth/token`
   - **Client ID**: (from Stytch Dashboard)
   - **Scopes**: `openid email profile mcp.read mcp.write`
5. Click **"Connect"**

**OAuth Flow**:
- [ ] ChatGPT redirects to Stytch login
- [ ] Enter email → receive magic link
- [ ] Click magic link → redirected back to ChatGPT
- [ ] ChatGPT shows "Connected" status

**Test MCP Tools**:
```
In ChatGPT: "Use the Coda MCP to list my documents"
```

**Checklist**:
- [ ] ChatGPT initiates OAuth flow
- [ ] Stytch authentication succeeds
- [ ] ChatGPT receives access token
- [ ] MCP server shows authenticated in ChatGPT
- [ ] ChatGPT can call `tools/list`
- [ ] ChatGPT can call `tools/call` (e.g., `list_docs`)
- [ ] Coda API returns documents

---

## Claude.ai Integration Testing

### 10. Claude.ai Web Connection

**Setup**: Configure MCP in Claude.ai

1. Open Claude.ai (https://claude.ai)
2. Go to **Settings** → **Integrations** → **MCP Servers**
3. Click **"Add MCP Server"**
4. Fill in configuration (same as ChatGPT)
5. Click **"Connect"**

**OAuth Flow**:
- [ ] Claude.ai redirects to Stytch login
- [ ] Authentication succeeds
- [ ] Redirected back to Claude.ai
- [ ] Claude.ai shows "Connected" status

**Test MCP Tools**:
```
In Claude.ai: "Show me my Coda documents using the MCP server"
```

**Checklist**:
- [ ] Claude.ai initiates OAuth flow
- [ ] Stytch authentication succeeds
- [ ] Claude.ai receives access token
- [ ] MCP server connected successfully
- [ ] Claude.ai can list tools
- [ ] Claude.ai can execute tools
- [ ] Coda API returns correct data

---

## Error Handling & Edge Cases

### 11. Token Expiration

**Test**: Expired access token

1. Get a Stytch access token
2. Wait for token to expire (default: 1 hour)
3. Try to make MCP request

**Expected Behavior**:
- [ ] Returns 401 Unauthorized
- [ ] Error message: "Session not found or expired"
- [ ] Client should refresh token automatically

---

### 12. Invalid Stytch Credentials

**Test**: Wrong `STYTCH_SECRET`

1. Update `.env` with invalid `STYTCH_SECRET`
2. Restart Docker container
3. Try to make authenticated request

**Expected Behavior**:
- [ ] Server starts (config validation doesn't check secret validity)
- [ ] First auth request fails
- [ ] Logs show Stytch API error
- [ ] Returns 401 Unauthorized

---

### 13. Network Issues (Stytch API Down)

**Test**: Simulate Stytch API unavailability

```bash
# Block Stytch API in hosts file (temporary)
sudo echo "127.0.0.1 api.stytch.com" >> /etc/hosts

# Try authenticated request
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer stk_..." \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'

# Restore hosts file
sudo sed -i '/api.stytch.com/d' /etc/hosts
```

**Expected Behavior**:
- [ ] Request times out or fails
- [ ] Returns 401 or 500 error
- [ ] Logs show network error
- [ ] Server remains healthy (doesn't crash)

---

## Performance Testing

### 14. Concurrent Requests

**Test**: Multiple simultaneous authenticated requests

```bash
# Using Apache Bench or similar
ab -n 100 -c 10 \
  -H "Authorization: Bearer YOUR_STYTCH_TOKEN" \
  -H "Content-Type: application/json" \
  -p mcp-request.json \
  https://coda.bestviable.com/mcp
```

**Checklist**:
- [ ] All requests complete successfully
- [ ] No authentication failures
- [ ] Response time < 500ms (p95)
- [ ] No memory leaks
- [ ] Server remains stable

---

### 15. Token Caching

**Test**: Verify Stytch SDK caches validated tokens

1. Make authenticated request (first call)
2. Check logs for Stytch API call
3. Make same request again (second call)
4. Check if Stytch API called again

**Expected Behavior**:
- [ ] First call validates token with Stytch API
- [ ] Subsequent calls use cached validation (faster)
- [ ] Cache respects token TTL

---

## Rollback & Compatibility

### 16. Backward Compatibility

**Test**: Legacy Bearer token still works (during transition)

```bash
# If bearer token fallback implemented
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer legacy_dev_token" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'
```

**Checklist**:
- [ ] Legacy bearer token accepted (if implemented)
- [ ] Logs indicate fallback used
- [ ] MCP protocol works normally

---

### 17. Rollback Plan

**Test**: Revert to Cloudflare Access JWT (if needed)

1. Update `docker-compose.yml`:
   - Comment out Stytch env vars
   - Uncomment Cloudflare Access vars
2. Rebuild and restart container
3. Test with Cloudflare Access JWT

**Checklist**:
- [ ] Server starts with legacy config
- [ ] Cloudflare JWT validation works
- [ ] No breaking changes to MCP protocol

---

## Success Criteria Summary

### Minimum Viable (Must Pass)
- [ ] All configuration validation tests pass
- [ ] Health check returns OAuth 2.1 compliant
- [ ] All OAuth metadata endpoints respond correctly
- [ ] Stytch token validation works
- [ ] MCP protocol functions with Stytch auth
- [ ] **At least ONE of**: ChatGPT OR Claude.ai connects successfully

### Full Success (Ideal)
- [ ] ChatGPT web connects and can use MCP tools
- [ ] Claude.ai web connects and can use MCP tools
- [ ] All error handling tests pass
- [ ] Performance tests meet targets
- [ ] Rollback plan verified

---

## Troubleshooting Reference

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| 401 "Missing Authorization header" | No token sent | Add `Authorization: Bearer <token>` header |
| 401 "Invalid or expired token" | Wrong token or expired | Get new token from Stytch |
| 500 on OAuth endpoints | Stytch API unreachable | Check network, verify Stytch status |
| ChatGPT can't find metadata | Endpoints not accessible | Verify Traefik routing, check Cloudflare Tunnel |
| Stytch validation fails | Wrong credentials | Double-check `STYTCH_PROJECT_ID` and `STYTCH_SECRET` |

---

**Testing Checklist Version**: 1.0
**Last Updated**: 2025-11-14
**Author**: David Kellam
