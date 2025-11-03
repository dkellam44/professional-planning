# Connection Attempt Analysis - Claude.ai Web

**Date**: November 2, 2025
**Time**: 10:03 PST
**Result**: Silent failure (no error, no connection)

---

## What Happened

### Requests Claude.ai Made:

1. ✅ **HEAD /** - Connection test (200 OK)
2. ✅ **GET /.well-known/oauth-protected-resource** - Discovered protected resource metadata (200 OK)
3. ✅ **GET /.well-known/oauth-authorization-server** (2 requests) - Discovered OAuth server metadata (200 OK)
4. ❌ **Stopped** - No further requests after discovery

### What Did NOT Happen:

- ❌ No `POST /oauth/register` (client registration)
- ❌ No `GET /oauth/authorize` (authorization flow)
- ❌ No `POST /mcp` (MCP initialization)
- ❌ No error messages in Claude.ai UI
- ❌ No connection established

---

## Root Cause Analysis

### Issue #1: Protocol Mismatch in Protected Resource Metadata

**Problem**: The `/.well-known/oauth-protected-resource` endpoint returns:

```json
{
  "authorization_server": "http://coda.bestviable.com",  // ❌ HTTP!
  ...
}
```

But the OAuth Authorization Server metadata correctly returns:

```json
{
  "issuer": "https://coda.bestviable.com",  // ✅ HTTPS
  ...
}
```

**Impact**: Protocol mismatch (`http` vs `https`) causes OAuth discovery to fail validation.

**Fix Location**: `src/http-server.ts:152`

```typescript
// BEFORE:
const baseUrl = `${req.protocol}://${req.get('host')}`;

// AFTER:
const baseUrl = process.env.MCP_ISSUER_URL || `${req.protocol}://${req.get('host')}`;
```

---

### Issue #2: Claude.ai May Not Support This Pattern

**Hypothesis**: Custom Connectors on Claude.ai might:

1. Not be using OAuth 2.0 at all
2. Expect OpenID Connect instead
3. Require a different discovery mechanism
4. Be looking for REST API (OpenAPI/Swagger spec) instead of MCP protocol
5. Not be available/enabled on your Pro plan account yet

**Evidence**:
- Silent failure after successful OAuth discovery
- No attempt to register as OAuth client
- No error message in UI
- Discovery requests succeeded but stopped there

---

## What This Tells Us

### Claude.ai's Behavior Pattern:

```
1. Test connection (HEAD /) → ✅ Success
2. Discover OAuth endpoints → ✅ Success
3. Validate discovered metadata → ❌ Failed silently
4. Stop (no error shown to user) → Connection attempt ends
```

**Interpretation**: Claude.ai **is** trying to connect, but rejects the server during the validation phase without showing an error.

---

## Possible Explanations

### Theory #1: Feature Not Available
Custom Connectors might not be rolled out to your Pro plan account yet. The UI might exist but the backend feature isn't enabled.

**Test**: Contact Anthropic support to confirm Custom Connectors availability

### Theory #2: Wrong Discovery Protocol
Claude.ai might expect:
- OpenID Connect (`.well-known/openid-configuration`)
- Different metadata format
- Additional required fields we're missing

**Test**: Add OpenID Connect discovery endpoint

### Theory #3: Looking for OpenAPI Spec
Custom Connectors might expect a REST API with OpenAPI/Swagger documentation, not MCP protocol.

**Test**: Check if Claude.ai supports MCP servers at all via Custom Connectors

### Theory #4: Protocol Mismatch Rejection
The `http` vs `https` mismatch in protected resource metadata causes immediate rejection.

**Test**: Fix the protected resource metadata endpoint (quickest fix)

---

## Recommended Next Steps

### 1. Fix Protocol Mismatch (5 minutes) - **DO THIS FIRST**

Edit `src/http-server.ts` line 152:

```typescript
const protectedResourceMetadata = (req: Request, res: Response) => {
  const baseUrl = process.env.MCP_ISSUER_URL || `${req.protocol}://${req.get('host')}`; // Use env var

  res.json({
    resource_id: 'coda-mcp',
    resource_name: 'Coda MCP Server',
    authorization_server: baseUrl,  // Now returns https://coda.bestviable.com
    ...
  });
};
```

### 2. Add OpenID Connect Discovery Endpoint (10 minutes)

Create `/.well-known/openid-configuration` endpoint that includes MCP-specific metadata:

```typescript
app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
  const baseUrl = process.env.MCP_ISSUER_URL || `${req.protocol}://${req.get('host')}`;

  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
    jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    registration_endpoint: `${baseUrl}/oauth/register`,

    // MCP-specific metadata
    mcp_endpoint: `${baseUrl}/mcp`,
    mcp_protocol_version: "2025-03-26",
    mcp_transport: "streamable-http",

    scopes_supported: ["openid", "profile", "email", "mcp:tools"],
    response_types_supported: ["code", "token", "id_token"],
    grant_types_supported: ["authorization_code", "client_credentials", "implicit"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "none"],
  });
});
```

### 3. Check Anthropic Documentation

Search for official docs on:
- How to configure Custom Connectors on Claude Pro
- What discovery protocol Claude.ai expects
- Whether MCP servers are supported via Custom Connectors

### 4. Contact Anthropic Support

Questions to ask:
1. Are Custom Connectors available on Claude Pro plans?
2. Do Custom Connectors support MCP protocol servers?
3. What discovery protocol should servers implement?
4. Where in the UI should Custom Connectors appear?

---

## Quick Win: Fix the Protocol Mismatch

This is the easiest thing to try first:

```bash
# 1. Edit source file
# Fix src/http-server.ts:152 to use MCP_ISSUER_URL

# 2. Rebuild
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda
pnpm build

# 3. Deploy to droplet
scp dist/http-server.js tools-droplet-agents:/root/portfolio/integrations/mcp/servers/coda/dist/

# 4. Restart container
ssh tools-droplet-agents "docker restart coda-mcp"

# 5. Test
curl https://coda.bestviable.com/.well-known/oauth-protected-resource | jq '.authorization_server'
# Should return: "https://coda.bestviable.com"

# 6. Try connection again from Claude.ai
```

---

## Monitoring Results Summary

**Timestamp**: 10:03:15 - 10:03:18 PST (3 seconds)
**Total Requests**: 4
**Successful Responses**: 4
**Errors**: 0
**Authentication Attempts**: 0

**Pattern**: Discovery-only, no follow-through

---

## Conclusion

The server is **100% operational** and responding correctly to all requests. Claude.ai **is** attempting to connect and successfully discovering the OAuth endpoints.

**The failure occurs** during metadata validation, likely due to:
1. Protocol mismatch (http vs https) in protected resource metadata
2. Missing required metadata fields Claude.ai expects
3. Or the feature simply isn't available on your account yet

**Recommended action**: Fix the protocol mismatch first (5 minutes), then retry the connection.

If that doesn't work, the issue is likely that Custom Connectors either:
- Aren't fully supported for MCP servers yet
- Require OpenID Connect instead of OAuth 2.0
- Aren't enabled on your specific account

---

**Status**: Analysis complete, fix identified
**Next**: Apply protocol mismatch fix and retry connection
