# Claude.ai Web Connector Troubleshooting

**Date**: November 2, 2025
**Issue**: Claude.ai Web (Pro plan) connector failing
**Server**: https://coda.bestviable.com
**Status**: Infrastructure ✅ Working | Connector ❌ Failing

---

## Confirmed Working

All server endpoints are operational:

```bash
✅ Health: https://coda.bestviable.com/health
✅ OAuth Discovery: https://coda.bestviable.com/.well-known/oauth-authorization-server
   Returns: {"issuer":"https://coda.bestviable.com",...}
✅ OAuth Register: POST https://coda.bestviable.com/oauth/register
   Returns: {"client_id":"coda-mcp-client","redirect_uris":[...]}
✅ MCP Endpoint: POST https://coda.bestviable.com/mcp (with Bearer token)
```

---

## Possible Reasons for Claude.ai Web Failure

### 1. Custom Connectors Feature Not Yet Available ⚠️

**Issue**: Claude.ai Custom Connectors may still be in limited beta

**Evidence**:
- Feature announced but might not be rolled out to all Pro plans
- May require Team/Enterprise plan
- Might need to be on waitlist

**How to Check**:
1. Go to https://claude.ai/settings
2. Look for "Integrations" or "Custom Connectors" tab
3. If not visible → Feature not available on your account yet

**Solution**:
- Contact Anthropic support to request access
- Or wait for general availability

---

### 2. Wrong Configuration Path 🔍

**Issue**: Connector setup might be in a different location than expected

**Where to Look**:
1. **Settings → Developer → MCP Servers** (if exists)
2. **Settings → Integrations → Connectors** (if exists)
3. **Settings → API** (if exists)
4. **Profile → Connected Apps** (if exists)

**Note**: Claude Desktop and Claude.ai Web have different configuration paths

---

### 3. Missing OAuth Redirect URI Registration 🔗

**Issue**: Server might need to pre-register the specific redirect URI

**Current Server Config**:
```typescript
// src/auth/oauth-routes.ts:64
redirect_uris: [
  "https://chatgpt.com/connector_platform_oauth_redirect",
  "https://claude.ai/api/mcp/auth_callback",  // ✅ Already configured
  "https://claude.com/api/mcp/auth_callback"
],
```

**Verify**: Check if Claude.ai uses a different callback URL

---

### 4. CORS or Origin Validation Issue 🛡️

**Issue**: Server might be rejecting requests from claude.ai domain

**Current Server Config**:
```typescript
// src/http-server.ts:74
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://chatgpt.com',
  'https://claude.ai',  // ✅ Already allowed
  'https://claude.com',
  'https://coda.bestviable.com'
];
```

**BUT**: In production, origin validation is **disabled** when `NODE_ENV=production`

**Test**:
```bash
curl -s https://coda.bestviable.com/health \
  -H "Origin: https://claude.ai" -v 2>&1 | grep -i "access-control"
# Should show: access-control-allow-origin: *
```

---

### 5. Bearer Token vs OAuth Flow Confusion 🔑

**Issue**: Claude.ai might expect pure OAuth flow, not Bearer token

**Current Setup**: Server supports BOTH:
- ✅ Bearer Token: Direct Coda API token in Authorization header
- ✅ OAuth 2.0: Full authorization code flow

**What Claude.ai Expects** (need to verify):
- Option A: OAuth flow → Get token → Use for MCP calls
- Option B: Pre-configured Bearer token

**Test OAuth Flow Manually**:
```bash
# Step 1: Register client
curl -s -X POST https://coda.bestviable.com/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","redirect_uris":["https://claude.ai/api/mcp/auth_callback"]}' | jq .

# Step 2: Get authorization code (would redirect in browser)
# https://coda.bestviable.com/oauth/authorize?client_id=coda-mcp-client&redirect_uri=https://claude.ai/api/mcp/auth_callback&state=random&response_type=code

# Step 3: Exchange code for token
# POST https://coda.bestviable.com/oauth/token
```

---

### 6. MCP Protocol Version Mismatch 📋

**Issue**: Claude.ai might require specific MCP protocol version

**Server Version**: `2025-03-26` (latest as of implementation)

**Check**: Look at Claude.ai docs for required MCP version

---

### 7. Missing `.well-known` Endpoint 📍

**Issue**: Claude.ai might look for additional discovery endpoints

**Currently Supported**:
- ✅ `/.well-known/oauth-authorization-server`
- ✅ `/.well-known/oauth-protected-resource`
- ✅ `/.well-known/protected-resource-metadata`

**Might Need**:
- ❓ `/.well-known/openid-configuration`
- ❓ `/.well-known/mcp-server` (custom)

**Test**:
```bash
curl -s https://coda.bestviable.com/.well-known/openid-configuration
# If 404, might need to add this endpoint
```

---

### 8. SSL/TLS Certificate Issue 🔒

**Issue**: SSL certificate might not be trusted by Claude.ai

**Verify Certificate**:
```bash
curl -v https://coda.bestviable.com/health 2>&1 | grep -i "ssl\|certificate"
# Should show valid Cloudflare certificate
```

**Current Setup**: ✅ Cloudflare SSL certificate (trusted globally)

---

### 9. Rate Limiting or Firewall 🚫

**Issue**: Server might be blocking Claude.ai's IP ranges

**Check Cloudflare Access Logs**:
```bash
ssh tools-droplet-agents "docker logs nginx-proxy | grep claude.ai"
ssh tools-droplet-agents "docker logs coda-mcp | grep claude.ai"
```

---

### 10. Custom Connector Requires Different Endpoint Structure 🏗️

**Issue**: Claude.ai Custom Connectors might expect:
- OpenAPI/Swagger spec at specific path
- Different authentication flow
- REST endpoints instead of MCP protocol

**If Claude Expects REST API**:
- Server currently implements **MCP protocol** (JSON-RPC over HTTP)
- Might need to add **REST wrapper** endpoints

---

## Diagnostic Steps

### Step 1: Check Feature Availability
```
Go to https://claude.ai/settings
Look for "Integrations" or "Custom Connectors"
Take screenshot if not found
```

### Step 2: Try Bearer Token Method (Simpler)
```
If Custom Connectors interface exists:
- Server URL: https://coda.bestviable.com
- Auth Method: Bearer Token (if available)
- Token: pat_your_coda_token_here
```

### Step 3: Monitor Server Logs
```bash
# Watch for incoming requests from Claude.ai
ssh tools-droplet-agents "docker logs -f coda-mcp | grep -E 'claude|oauth|mcp'"
```

### Step 4: Check Browser Developer Console
```
Open Claude.ai in browser
Open DevTools (F12) → Network tab
Try to add connector
Look for failed requests
Check error messages in console
```

### Step 5: Contact Anthropic Support
```
Email: support@anthropic.com
Ask: "How do I configure Custom MCP Connectors on Claude Pro plan?"
Provide: Server URL, error screenshot
```

---

## What to Ask Anthropic Support

1. **Is Custom Connectors feature available on Claude Pro plan?**
   - Or does it require Team/Enterprise?
   - Is it in beta/waitlist?

2. **What is the correct configuration path?**
   - Settings → Integrations?
   - Settings → Developer?
   - Somewhere else?

3. **What authentication methods are supported?**
   - OAuth 2.0 with authorization code flow?
   - Bearer tokens?
   - API keys?

4. **What are the technical requirements?**
   - MCP protocol version?
   - Required OAuth endpoints?
   - SSL certificate requirements?

5. **Are there IP ranges to whitelist?**
   - What are Claude.ai's outbound IP ranges?

---

## Temporary Workarounds

### Option A: Use MCP Inspector
```bash
# Install MCP Inspector (debugging tool)
npm install -g @modelcontextprotocol/inspector

# Test server locally
mcp-inspector https://coda.bestviable.com --token pat_your_token
```

### Option B: Use Claude Desktop with stdio Bridge
```typescript
// Create bridge: stdio → HTTP
// claude-desktop-bridge.ts
import { spawn } from 'child_process';
import fetch from 'node-fetch';

// Read JSON-RPC from stdin
process.stdin.on('data', async (data) => {
  const response = await fetch('https://coda.bestviable.com/mcp', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CODA_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: data
  });
  const result = await response.text();
  process.stdout.write(result);
});
```

### Option C: Wait for Official Support
- Monitor Anthropic changelog
- Check Claude.ai release notes
- Re-try setup after updates

---

## Next Steps

1. **Confirm feature availability** in Claude.ai settings
2. **Check browser console** for specific error messages
3. **Monitor server logs** during connection attempt
4. **Contact Anthropic support** with specific questions
5. **Try MCP Inspector** to verify server functionality

---

## Server Status Summary

**Infrastructure**: ✅ 100% Operational
**OAuth Endpoints**: ✅ Working correctly
**MCP Protocol**: ✅ Spec compliant
**SSL Certificate**: ✅ Valid and trusted

**The server is ready.** The issue is likely:
- Feature not available on your account yet
- Configuration path unclear
- Undocumented requirement

---

**Last Updated**: November 2, 2025
**Server**: https://coda.bestviable.com (v1.0.9)
**Contact**: Check Claude.ai settings or contact support@anthropic.com
