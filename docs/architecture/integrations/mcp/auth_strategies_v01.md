---
entity: mcp-auth-strategies
level: internal
zone: internal
version: v01
tags: [mcp, authentication, oauth, bearer-token, security]
source_path: /docs/architecture/integrations/mcp/auth_strategies_v01.md
date: 2025-10-31
---

# MCP Authentication Strategies

**Purpose**: Comprehensive guide to authentication patterns for Model Context Protocol servers, with decision matrix and upgrade paths.

**Updated**: 2025-10-31

---

## Overview

Model Context Protocol supports two primary authentication approaches:

1. **Bearer Token Authentication** (Simple API key pattern)
2. **OAuth 2.1** (Full user authorization flow with refresh tokens)

This guide documents when to use each, implementation patterns, and upgrade paths.

---

## Authentication Strategy Decision Matrix

### Use Bearer Token When:
- ✅ Service provides API keys/personal access tokens
- ✅ Single-user or team-scoped deployment
- ✅ Service doesn't support OAuth
- ✅ Token management is manual or scripted
- ✅ No user-initiated authentication needed

**Examples**: Coda, GitHub, Firecrawl

**Token Format**: `Authorization: Bearer <token>`

**Validation**: Call service's API with token (e.g., `GET /v1/whoami`)

### Use OAuth 2.1 When:
- ✅ Multi-user deployment required
- ✅ User-scoped permissions needed
- ✅ Token refresh required (long-lived sessions)
- ✅ Service provides OAuth endpoints
- ✅ User authentication flow exists

**Examples**: Future deployment of user-initiated services

**Token Flow**: Authorization Code + PKCE → Access Token + Refresh Token

**Benefits**:
- No static token storage needed
- Automatic token refresh
- Per-user permission scopes
- Audit trail of user actions

---

## Bearer Token Implementation

### Architecture

```
Client
  ↓
[Bearer Token]
  ↓
HTTP Gateway (validates token format)
  ↓
Token Verification (API call to service)
  ↓
MCP Stdio Server (wrapped by gateway)
  ↓
Service API
```

### Token Validation Flow

1. **Startup Validation** (`validateStartupToken()`)
   - Check token format (minimum length, characters)
   - Call service API endpoint with token
   - Fail fast if invalid
   - Log result for audit trail

2. **Per-Request Validation** (`validateBearerToken()`)
   - Extract Authorization header
   - Validate Bearer token regex format
   - Call service API with token
   - Return 401 if invalid
   - Continue to MCP if valid

### Implementation Example: Coda

**File**: `integrations/mcp/servers/coda/gateway/src/middleware/token-validation.ts`

```typescript
export async function verifyToken(token: string): Promise<AuthInfo> {
  try {
    const response = await fetch('https://api.coda.io/v1/whoami', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return { valid: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    return {
      valid: true,
      token,
      clientId: data.user.id
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### Implementation Example: GitHub

**File**: `integrations/mcp/servers/github/gateway/src/middleware/token-validation.ts`

```typescript
export async function verifyToken(token: string): Promise<AuthInfo> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) {
      return { valid: false, error: `GitHub API error: ${response.status}` };
    }

    const data = await response.json();
    return {
      valid: true,
      token,
      clientId: data.id || data.login
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

### Implementation Example: Memory (No External Validation)

**File**: `integrations/mcp/servers/memory/gateway/src/middleware/token-validation.ts`

```typescript
export async function verifyToken(token: string): Promise<AuthInfo> {
  // Memory MCP has no external API
  // Token is just a session identifier
  if (!token || token.length < 3) {
    return { valid: false, error: 'Token must be >= 3 characters' };
  }

  return {
    valid: true,
    token,
    clientId: token
  };
}
```

### Security Hardening: Bearer Token

1. **Token Storage**
   - Store in `.env` file (never committed)
   - Load via environment variables
   - Rotate every 90 days

2. **Transmission**
   - Use HTTPS only (enforced by nginx-proxy)
   - Send in Authorization header
   - Redact from logs (audit logger marks as ***REDACTED***)

3. **Validation**
   - Validate on startup (fail fast)
   - Validate per-request (early rejection)
   - Call service API to verify (catch revoked/expired tokens)
   - Audit log all attempts

4. **Error Handling**
   - Sanitize errors (no internal details to clients)
   - Return generic 401 for auth failures
   - Log detailed errors server-side

---

## OAuth 2.1 Implementation (Future)

### When to Implement
- [ ] Multi-user deployment needed
- [ ] Token refresh required for long sessions
- [ ] Service provides OAuth endpoints
- [ ] User authentication UI exists

### OAuth 2.1 Flow (Authorization Code with PKCE)

```
1. Client requests /oauth/authorize?
     client_id=...&
     redirect_uri=...&
     code_challenge=...&
     code_challenge_method=S256&
     scope=mcp:read+mcp:write

2. User authenticates (service login page)

3. Service redirects to /oauth/callback?
     code=...&
     state=...

4. Callback handler exchanges code for token:
   POST /oauth/token
   {
     grant_type: "authorization_code",
     code: "...",
     code_verifier: "...",
     client_id: "...",
     client_secret: "..."
   }

5. Response includes:
   {
     access_token: "...",
     refresh_token: "...",
     expires_in: 3600,
     token_type: "Bearer"
   }

6. Client stores refresh_token securely

7. When access_token expires:
   POST /oauth/token
   {
     grant_type: "refresh_token",
     refresh_token: "...",
     client_id: "...",
     client_secret: "..."
   }
```

### Implementation Checklist

To upgrade a gateway from Bearer token to OAuth 2.1:

1. **Add OAuth Endpoints**
   ```typescript
   // GET /.well-known/oauth-authorization-server
   // Returns RFC 8414 metadata (already implemented)

   // POST /oauth/authorize
   // Redirects user to service login

   // POST /oauth/callback
   // Handles authorization code, exchanges for token

   // POST /oauth/token
   // Handles token refresh
   ```

2. **Add Token Storage**
   - Redis for distributed access
   - Database table for per-user refresh tokens
   - Encryption for sensitive data

3. **Add Token Refresh**
   ```typescript
   async function refreshAccessToken(refreshToken: string) {
     const response = await fetch('https://service.com/oauth/token', {
       method: 'POST',
       body: JSON.stringify({
         grant_type: 'refresh_token',
         refresh_token: refreshToken,
         client_id: process.env.OAUTH_CLIENT_ID,
         client_secret: process.env.OAUTH_CLIENT_SECRET
       })
     });

     return response.json();
   }
   ```

4. **Update Client Config**
   ```json
   {
     "transport": "http",
     "url": "https://github.bestviable.com/mcp",
     "auth": {
       "type": "oauth2",
       "authorizationUrl": "https://github.bestviable.com/oauth/authorize",
       "tokenUrl": "https://github.bestviable.com/oauth/token",
       "clientId": "...",
       "clientSecret": "...",
       "scopes": ["mcp:read", "mcp:write"]
     }
   }
   ```

5. **Update Gateway to Use Tokens**
   - Extract user ID from JWT or token table
   - Refresh token before expiry
   - Handle token revocation gracefully

### Security: OAuth 2.1

1. **PKCE (Proof Key for Code Exchange)**
   - Prevents authorization code interception
   - Required for public clients
   - Recommended for all flows

2. **State Parameter**
   - Prevents CSRF attacks
   - Generate random value per request
   - Verify in callback

3. **Secure Token Storage**
   - Never store tokens in cookies
   - Use secure localStorage (HTTPS only)
   - Implement token rotation
   - Clear on logout

4. **Token Refresh**
   - Refresh before expiry (5-10 min before)
   - Revoke old refresh token after use
   - Handle refresh failures gracefully

---

## Current Deployment Status

### Bearer Token Services (✅ Deployed)

| Service | Endpoint | Token Validation | Startup Check |
|---------|----------|-----------------|---------------|
| **Coda** | `https://coda.bestviable.com/mcp` | `https://api.coda.io/v1/whoami` | ✅ Yes |
| **GitHub** | `https://github.bestviable.com/mcp` | `https://api.github.com/user` | ✅ Yes |
| **Firecrawl** | `https://firecrawl.bestviable.com/mcp` | `https://api.firecrawl.dev/health` | ✅ Yes |
| **Memory** | `https://memory.bestviable.com/mcp` | Format check only | ✅ Yes |

### OAuth 2.1 Services (🚧 Planned)

| Service | Priority | OAuth Support | Estimated Timeline |
|---------|----------|----------------|-------------------|
| **GitHub** | High | ✅ Yes | Phase 2 (Q4 2025) |
| **Coda** | Medium | ✅ Yes | Phase 3 (Q1 2026) |
| **Custom Portal** | Low | Custom | Phase 4+ |

---

## Environment Variable Reference

### Bearer Token Services

```bash
# Coda MCP Gateway
CODA_API_TOKEN=<token>

# GitHub MCP Gateway
GITHUB_PERSONAL_ACCESS_TOKEN=<token>

# Firecrawl MCP Gateway
FIRECRAWL_API_KEY=<api-key>

# Memory MCP Gateway
# No API key required

# All services
DOMAIN=bestviable.com
LETSENCRYPT_EMAIL=admin@bestviable.com
```

### OAuth 2.1 Services (Future)

```bash
# OAuth Provider Credentials
OAUTH_CLIENT_ID=<id>
OAUTH_CLIENT_SECRET=<secret>
OAUTH_REDIRECT_URI=https://gateway.bestviable.com/oauth/callback

# Token Storage
REDIS_URL=redis://redis:6379
POSTGRES_CONNECTION_STRING=postgres://...

# Encryption
TOKEN_ENCRYPTION_KEY=<32-byte-key>
```

---

## Testing Authentication

### Bearer Token Validation

```bash
# Test Coda
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Should return list of Coda tools (34)

# Test GitHub
curl -X POST https://github.bestviable.com/mcp \
  -H "Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Should return list of GitHub tools (~15)
```

### OAuth 2.1 Validation (Future)

```bash
# Step 1: Request authorization
curl "https://github.bestviable.com/oauth/authorize?
  client_id=...&
  redirect_uri=https://client.bestviable.com/callback&
  code_challenge=...&
  code_challenge_method=S256&
  scope=mcp:read+mcp:write"

# Step 2: User logs in (browser)
# Step 3: Redirect to callback with code

# Step 4: Exchange code for token
curl -X POST https://github.bestviable.com/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "...",
    "code_verifier": "...",
    "client_id": "...",
    "client_secret": "..."
  }'

# Response includes access_token and refresh_token
```

---

## Troubleshooting

### Bearer Token Issues

**Token validation fails at startup**
```
Error: Token validation failed: Coda API error: 401
```

Solution:
- Verify token is current (not expired)
- Check token has required scopes
- Verify token format (no spaces)
- Get new token from service dashboard

**Per-request auth failures**
```
Error: Invalid or expired token
```

Solution:
- Token may have been revoked
- Token may have expired (get new token)
- Check authorization header format: `Bearer <token>`

**Rate limiting on validation calls**
```
429 Too Many Requests
```

Solution:
- Multiple containers calling validation API simultaneously
- Implement caching of validation results (5-10 min TTL)
- Stagger startup times

### OAuth 2.1 Issues (Future)

**PKCE code challenge invalid**
```
Error: code_challenge_method not supported
```

Solution:
- Use S256 (SHA256) method
- Implement base64url encoding

**Token refresh fails**
```
401 Invalid refresh_token
```

Solution:
- Refresh token may have expired (7-30 days typical)
- User may have revoked authorization
- Implement graceful fallback to re-authenticate

---

## Migration Path: Bearer Token → OAuth 2.1

### Phase 1: Parallel Operation (Week 1)
- Keep existing Bearer token endpoints working
- Deploy OAuth 2.1 endpoints alongside
- Document OAuth endpoints in discovery

### Phase 2: OAuth 2.1 Promotion (Week 2-3)
- Update client configs to prefer OAuth
- Monitor token refresh failures
- Maintain Bearer token as fallback

### Phase 3: Deprecation (Month 2)
- Announce Bearer token deprecation
- Set expiration date for Bearer tokens
- Migrate remaining clients

### Phase 4: Removal (Month 3)
- Remove Bearer token validation code
- Require OAuth 2.1 for all new clients
- Archive legacy documentation

---

## References

**Specifications**:
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749) - Core spec
- [OAuth 2.1 Draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) - Latest version
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636) - Proof Key for Code Exchange
- [RFC 8414 - OAuth 2.0 Authorization Server Metadata](https://tools.ietf.org/html/rfc8414)

**Related Documentation**:
- MCP Specification: https://modelcontextprotocol.io/
- Gateway Template: `/integrations/mcp/gateway-template/README.md`
- Server Catalog: `/docs/architecture/integrations/mcp/server_catalog_v01.md`

**Implementation Guides**:
- Bearer Token: See individual server `DEPLOYMENT.md` files
- OAuth 2.1: [Authentication Code Flow Guide](#oauth-21-implementation-future) (above)

---

**Last Updated**: 2025-10-31
**Next Review**: 2025-12-31 (before Phase 2 OAuth implementation)
