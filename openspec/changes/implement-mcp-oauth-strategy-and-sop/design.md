# Technical Design: MCP OAuth Strategy with Stytch

**Change ID**: `implement-mcp-oauth-strategy-and-sop`
**Date**: 2025-11-14 (Updated with Stytch decision)
**Author**: David Kellam

---

## Context

### Current State
- **Coda MCP**: Running on droplet with Phase 1 & 1.5 complete
  - Phase 1: Cloudflare Access JWT + Bearer token auth ✅
  - Phase 1.5: MCP JSON-RPC 2.0 protocol implementation ✅
- **Problem**: ChatGPT and Claude.ai web reject connections ❌
- **Root Cause**: Current auth is NOT OAuth 2.1 compliant (MCP spec 2025-06-18)

### Requirements
1. **OAuth 2.1 Compliance**: Full implementation per MCP spec 2025-06-18
2. **Scalable**: Pattern works for all future MCPs
3. **Simple**: Minimal code changes, beginner-friendly
4. **Zero Memory Overhead**: Droplet at 87% utilization (3.3GB/3.8GB)
5. **Production-Ready**: Enterprise-grade for future client services

### Stakeholders
- **Personal Use**: David (needs ChatGPT/Claude.ai connectivity now)
- **Future Clients**: Businesses purchasing agentic services
- **Compliance**: SOC 2, GDPR requirements for client data

---

## Goals

### Primary Goals
1. ✅ Coda MCP secured and operational (Phase 1 - COMPLETE)
2. ✅ **MCP Protocol Implementation** (Phase 1.5 - COMPLETE)
3. ⏳ **OAuth 2.1 Compliance via Stytch** (Phase 2) - Replace Cloudflare Access with spec-compliant OAuth
4. ⏳ Comprehensive SOP for future MCPs (Phase 3)
5. ⏳ Updated architecture documentation (Phase 4)

### Non-Goals (Deferred)
- ⚠️ Multi-user per MCP (Stytch handles per-user, but not priority)
- ⚠️ Infisical integration (deferred until Infisical deployment fixed)
- ⚠️ PostgreSQL token storage (Stytch SDK manages tokens)
- ⚠️ Custom auth middleware package (Stytch SDK replaces need)

---

## Critical Discoveries

### Discovery #1: MCP Protocol Implementation Required (✅ PHASE 1.5 COMPLETE)

**What We Found**: During Phase 1 testing with Claude Code MCP client, the server was receiving JSON-RPC 2.0 messages but treating them as simple HTTP proxy requests.

**Solution Implemented**:
- JSON-RPC 2.0 protocol handler with notification support
- Core MCP methods: `initialize`, `tools/list`, `tools/call`
- Proper handling of notifications (messages without `id` field)
- Backward compatibility with Bearer token auth

**Status**: ✅ Complete and working with Claude Code

---

### Discovery #2: OAuth 2.1 Compliance Gap (⚠️ BLOCKING ChatGPT/Claude.ai)

**What We Found**: Current implementation (Cloudflare Access JWT + Bearer fallback) is **NOT compliant with MCP Specification 2025-06-18**, which explains why ChatGPT and Claude.ai web reject connections.

**MCP Spec Requirements (2025-06-18)**:
- ✅ **OAuth 2.1** with PKCE (mandatory for all clients)
- ✅ **RFC 8414**: Authorization Server Metadata (MUST implement)
- ✅ **RFC 9728**: Protected Resource Metadata (MUST implement, added June 2025)
- ✅ **RFC 8707**: Resource Indicators (MUST implement to prevent token theft)
- ✅ **RFC 7591**: Dynamic Client Registration (SHOULD support)

**What We Currently Have**:
- ✅ Cloudflare Access JWT validation (but not OAuth 2.1)
- ✅ Bearer token fallback (but not OAuth 2.1)
- ❌ **Missing**: Authorization server metadata endpoints
- ❌ **Missing**: Protected resource metadata
- ❌ **Missing**: Resource indicators
- ❌ **Missing**: PKCE flow
- ❌ **Missing**: Dynamic client registration

**This gap prevents ChatGPT and Claude.ai from connecting** - they expect full OAuth 2.1 flows.

---

## Solution: Stytch OAuth 2.1 Implementation

### Decision Rationale

**Selected**: **Stytch** managed OAuth 2.1 service

**Why Stytch**:
1. **Full OAuth 2.1 compliance out-of-box** (all required RFCs implemented)
2. **MCP-specific documentation** (published MCP integration guides)
3. **Free tier: 10,000 MAUs** (personal use covered indefinitely)
4. **Zero droplet memory overhead** (fully managed service)
5. **All features on free tier**: MFA, RBAC, SSO included
6. **Beginner-friendly**: Dashboard, SDK, examples, support
7. **Production-ready**: Used by enterprise SaaS products
8. **Clear migration path**: Can scale to WorkOS (1M MAUs free) if needed

### Alternatives Considered

| Solution | Personal Use | Client SaaS | Memory | Complexity | Decision |
|----------|--------------|-------------|--------|------------|----------|
| **Stytch** | ✅ Best | ✅ Great | 0 MB | Low | ✅ **SELECTED** |
| WorkOS | ✅ Good | ✅ Best | 0 MB | Medium | ⏳ Future migration |
| Auth0 | ✅ Good | ✅ Good | 0 MB | Medium | ❌ Less generous |
| Keycloak | ❌ No RAM | ✅ Cost-effective | **2 GB** | Very High | ❌ Blocks droplet |
| Better-Auth | ⚠️ Risky | ❌ Immature | 50 MB | Low | ❌ OAuth 2.1 incomplete |

**Keycloak Blocker**: Requires 2 GB minimum RAM. Current droplet: 87% utilized (3.3GB/3.8GB). Adding Keycloak would require upgrading to 8GB droplet ($48/mo).

**Better-Auth Blocker**: OAuth 2.1 compliance incomplete (GitHub Issue #5459). May not satisfy ChatGPT/Claude.ai.

---

## Architecture with Stytch

### High-Level Flow

```
ChatGPT/Claude.ai Web
      ↓ (Initiates OAuth 2.1 + PKCE flow)
Stytch Authorization Server
      ├─ User authenticates (email/social/SSO)
      ├─ Issues authorization code
      ├─ Exchanges for access token (with PKCE)
      └─ Returns token to client

Client (ChatGPT/Claude.ai)
      ↓ (MCP request + access token)
Cloudflare Tunnel
      ↓
Traefik (HTTP routing)
      ↓
Coda MCP Server (Node.js/Express)
      ├─ Validates token with Stytch (JWT signature)
      ├─ Extracts user identity
      ├─ Retrieves Coda API token (from env)
      └─ Calls Coda API
            ↓
      Returns result in JSON-RPC 2.0 format
```

### Detailed Request Flow

```
1. OAuth Authorization (One-Time Setup per User)
   ─────────────────────────────────────────────────
   User clicks "Connect MCP" in ChatGPT/Claude.ai
      ↓
   Client redirects to Stytch authorization endpoint
      → https://api.stytch.com/v1/public/oauth/authorize
      → Params: client_id, redirect_uri, code_challenge (PKCE)
      ↓
   User authenticates (email, Google, GitHub, etc.)
      ↓
   Stytch redirects back with authorization code
      → https://chatgpt.com/callback?code=...
      ↓
   Client exchanges code for access token
      → POST https://api.stytch.com/v1/public/oauth/token
      → Body: code, code_verifier (PKCE), client_id
      ↓
   Stytch returns: { access_token, refresh_token, expires_in }

2. MCP Tool Call (Every Request)
   ─────────────────────────────
   Client sends MCP request with access token
      → POST https://coda.bestviable.com/mcp
      → Headers: Authorization: Bearer stk_...
      → Body: {"jsonrpc":"2.0","id":1,"method":"tools/call",...}
      ↓
   Cloudflare Tunnel → Traefik → Coda MCP Server
      ↓
   Stytch Middleware validates access token
      → Verify JWT signature using Stytch public keys
      → Check expiration, audience, issuer
      → Extract user: { user_id, email }
      ↓
   MCP Handler processes request
      → Get Coda API token from env (CODA_API_TOKEN)
      → Call Coda API
      → Return result in JSON-RPC format
```

### Authentication Endpoints

#### Required by MCP Spec

1. **Authorization Server Metadata** (RFC 8414)
   ```
   GET /.well-known/oauth-authorization-server

   Response:
   {
     "issuer": "https://api.stytch.com",
     "authorization_endpoint": "https://api.stytch.com/v1/public/oauth/authorize",
     "token_endpoint": "https://api.stytch.com/v1/public/oauth/token",
     "jwks_uri": "https://api.stytch.com/v1/public/keys",
     "response_types_supported": ["code"],
     "grant_types_supported": ["authorization_code", "refresh_token"],
     "code_challenge_methods_supported": ["S256"],
     ...
   }
   ```

2. **Protected Resource Metadata** (RFC 9728)
   ```
   GET /.well-known/oauth-protected-resource

   Response:
   {
     "resource": "https://coda.bestviable.com",
     "authorization_servers": ["https://api.stytch.com"],
     "scopes_supported": ["mcp.read", "mcp.write"],
     "bearer_methods_supported": ["header"],
     ...
   }
   ```

3. **JWKS Endpoint** (for token validation)
   ```
   GET /.well-known/jwks.json

   Response:
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

---

## Implementation Details

### Stytch SDK Integration

```typescript
// package.json additions
{
  "dependencies": {
    "stytch": "^27.0.0",  // Stytch Node.js SDK
    // Remove: "jsonwebtoken", "jwks-rsa" (Stytch SDK handles)
  }
}
```

### Updated Middleware

```typescript
// src/middleware/stytch-auth.ts
import { StytchB2BClient } from 'stytch';
import { Request, Response, NextFunction } from 'express';

const stytchClient = new StytchB2BClient({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET!,
});

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    session_id: string;
  };
  serviceToken?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Skip auth for health/metadata endpoints
    if (req.path === '/health' || req.path.startsWith('/.well-known/')) {
      return next();
    }

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const accessToken = authHeader.substring(7);

    // Validate access token with Stytch
    const response = await stytchClient.sessions.authenticate({
      session_token: accessToken,
    });

    // Extract user info
    req.user = {
      user_id: response.member.member_id,
      email: response.member.email_address,
      session_id: response.session.session_id,
    };

    // Set Coda service token (from env)
    req.serviceToken = process.env.CODA_API_TOKEN;

    next();
  } catch (error) {
    console.error('[AUTH] Stytch validation failed:', error);
    res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or expired access token',
    });
  }
}
```

### OAuth Metadata Endpoints

```typescript
// src/routes/oauth-metadata.ts
import { Router } from 'express';

const router = Router();

// Authorization Server Metadata (RFC 8414)
router.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: 'https://api.stytch.com',
    authorization_endpoint: 'https://api.stytch.com/v1/public/oauth/authorize',
    token_endpoint: 'https://api.stytch.com/v1/public/oauth/token',
    jwks_uri: 'https://api.stytch.com/v1/public/keys',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported': ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post'],
  });
});

// Protected Resource Metadata (RFC 9728)
router.get('/.well-known/oauth-protected-resource', (req, res) => {
  res.json({
    resource: 'https://coda.bestviable.com',
    authorization_servers: ['https://api.stytch.com'],
    scopes_supported: ['mcp.read', 'mcp.write'],
    bearer_methods_supported: ['header'],
  });
});

// JWKS Endpoint (proxies to Stytch)
router.get('/.well-known/jwks.json', async (req, res) => {
  // Proxy to Stytch JWKS endpoint
  const response = await fetch('https://api.stytch.com/v1/public/keys');
  const keys = await response.json();
  res.json(keys);
});

export default router;
```

### Environment Variables

```bash
# Stytch Configuration
STYTCH_PROJECT_ID=project-test-...
STYTCH_SECRET=secret-test-...

# Coda API (unchanged)
CODA_API_TOKEN=pat_xxxxx
CODA_API_BASE_URL=https://coda.io/apis/v1

# Server Configuration (unchanged)
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=info
```

### Docker Compose Updates

```yaml
version: '3.8'

services:
  coda-mcp:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: coda-mcp
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      # Stytch OAuth Configuration
      - STYTCH_PROJECT_ID=${STYTCH_PROJECT_ID}
      - STYTCH_SECRET=${STYTCH_SECRET}

      # Coda API Configuration
      - CODA_API_TOKEN=${CODA_API_TOKEN}
      - CODA_API_BASE_URL=https://coda.io/apis/v1

      # Server Configuration
      - PORT=8080
      - HOST=0.0.0.0
      - LOG_LEVEL=info

    networks:
      - docker_proxy  # Traefik auto-discovery
      - docker_syncbricks  # Internal network

    labels:
      # Traefik auto-discovery (updated from nginx-proxy)
      - "traefik.enable=true"
      - "traefik.http.routers.coda-mcp.rule=Host(`coda.bestviable.com`)"
      - "traefik.http.routers.coda-mcp.entrypoints=web"
      - "traefik.http.services.coda-mcp.loadbalancer.server.port=8080"

    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  docker_proxy:
    external: true
  docker_syncbricks:
    external: true
```

---

## Implementation Strategy

### Phase 2: Stytch Integration (4-6 hours)

**Tasks**:
1. Sign up for Stytch account (free tier)
2. Create Stytch project and get credentials
3. Install Stytch SDK: `npm install stytch`
4. Replace Cloudflare Access middleware with Stytch auth
5. Add OAuth metadata endpoints
6. Update docker-compose.yml with Stytch env vars
7. Update Traefik labels (already using Traefik v3.0)
8. Test locally with Stytch test console
9. Deploy to droplet
10. Test with ChatGPT/Claude.ai web

**Risk**: Low (Stytch SDK handles complexity)
**Rollback**: Keep Cloudflare Access as fallback during testing

---

## Migration Path

### Current → Stytch → WorkOS (Future)

```
Phase 1 (Current):     Cloudflare Access JWT + Bearer token
                       ↓ (4-6 hours)
Phase 2 (This week):   Stytch OAuth 2.1
                       ↓ (When needed)
Phase 3 (10K+ users):  Migrate to WorkOS (1M free MAUs)
                       ↓ (At 150K+ users)
Phase 4 (Optional):    Self-host Keycloak (cost optimization)
```

**Phase 3 Trigger**: Approaching 10,000 MAUs OR clients demand enterprise SSO

**Phase 4 Trigger**: 150,000+ users AND have DevOps resources

---

## Security Considerations

### Token Validation
- **Algorithm**: RS256 (RSA signature)
- **Key Rotation**: Stytch handles automatically
- **Validation**: JWT signature + expiration + audience + issuer

### Token Storage
- **Access tokens**: Short-lived (1 hour), client stores
- **Refresh tokens**: Long-lived (30 days), securely stored by client
- **Coda API token**: Stored in environment variable (Phase 1 approach)

### Audit Trail
- **What's Logged**: User email, action, timestamp
- **Where**: stdout (collected by Docker logs)
- **Retention**: Docker log rotation (10 MB × 3 files)

---

## Testing Strategy

### Unit Tests
- Stytch token validation (mocked)
- OAuth metadata endpoints
- Error handling (expired token, invalid token)

### Integration Tests
- Full OAuth flow with Stytch test environment
- MCP protocol + Stytch auth combined
- Coda API calls with authenticated requests

### Manual Tests
1. Stytch OAuth flow in browser
2. ChatGPT connection test
3. Claude.ai connection test
4. Verify metadata endpoints
5. Health check endpoint

---

## Monitoring & Observability

### Logs
```
[timestamp] [INFO] Stytch auth successful: user@example.com
[timestamp] [INFO] MCP request: tools/call (get_whoami)
[timestamp] [INFO] Coda API call: GET /whoami (200 OK)
```

### Health Check
```json
GET /health

{
  "status": "ok",
  "service": "coda-mcp",
  "version": "2.0.0",
  "auth": {
    "provider": "stytch",
    "oauth_compliant": true
  },
  "timestamp": "2025-11-14T..."
}
```

---

## Cost Analysis

### Personal Use (Now)
- Stytch: **$0/mo** (free tier: 10,000 MAUs)
- Droplet: $24/mo (unchanged)
- **Total**: $24/mo

### First Clients (< 10K users)
- Stytch: **$0-50/mo** (usage-based after free tier)
- Droplet: $24/mo
- **Total**: $24-74/mo

### Scale (10K-100K users)
- WorkOS: **$0/mo** (free up to 1M MAUs)
- Droplet: $24/mo (or upgrade to 8GB: $48/mo)
- **Total**: $24-48/mo

### Enterprise (100K+ users)
- WorkOS: **$2,500/mo** (per 1M MAUs)
- Droplet: $48/mo (8GB) or dedicated infrastructure
- **Total**: $2,548/mo (or migrate to Keycloak self-hosted for ~$1,096/mo)

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stytch outage | Medium | Keep Bearer token fallback during transition |
| ChatGPT still rejects | High | Test with Stytch sandbox first, validate OAuth metadata |
| Free tier exceeded | Low | Monitor MAUs, WorkOS migration ready |
| Implementation bugs | Medium | Comprehensive testing, rollback plan |

---

## Success Criteria

- ✅ Stytch OAuth 2.1 integration deployed
- ✅ OAuth metadata endpoints responding correctly
- ✅ ChatGPT web connects to Coda MCP successfully
- ✅ Claude.ai web connects to Coda MCP successfully
- ✅ All existing MCP tools still function
- ✅ Health check shows "oauth_compliant": true
- ✅ Documentation updated (SOP, setup guide)

---

**Design Approval**: Pending
**Implementation Timeline**: 4-6 hours (target: this week)
**Next Steps**: Create STYTCH_SETUP_GUIDE.md and scaffold code
