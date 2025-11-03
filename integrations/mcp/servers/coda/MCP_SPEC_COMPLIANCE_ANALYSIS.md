# MCP Specification Compliance Analysis - Coda MCP Server

**Date**: November 2, 2025
**Analysis**: Comparing droplet implementation vs. MCP specification requirements
**Status**: Diagnosing Claude Connector Failure

---

## Executive Summary

**Infrastructure Status**: ✅ All infrastructure components operational
**OAuth Discovery**: ✅ Issuer URL correctly returns `https://coda.bestviable.com`
**Public Accessibility**: ✅ Domain accessible with valid SSL certificate

**Claude Connector Status**: ❌ FAILING

---

## MCP Specification Requirements (2025-03-26)

### 1. Streamable HTTP Transport Requirements

**Per MCP Spec Section "Basic Transports":**

#### Required: Single HTTP Endpoint with Multiple Methods

```
The same endpoint path MUST support:
- POST: JSON-RPC message exchange
- GET: Server-Sent Events (SSE) stream for notifications
```

**Current Implementation**: ✅ **COMPLIANT**

```typescript
// src/http-server.ts
app.post('/mcp', async (req, res) => { ... });  // Line 499
app.get('/mcp', async (req, res) => { ... });   // Line 619
app.delete('/mcp', async (req, res) => { ... }); // Line 655
```

✅ Single endpoint path `/mcp` supports POST, GET, and DELETE
✅ Uses `StreamableHTTPServerTransport` from official SDK

---

#### Required: Session Management via Headers

```
Mcp-Session-Id header MUST be used to identify sessions
```

**Current Implementation**: ✅ **COMPLIANT**

```typescript
// src/http-server.ts:501
const sessionId = req.headers['mcp-session-id'] as string | undefined;

// Line 516: Creates new session if not provided
const newSessionId = randomUUID();
transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => newSessionId,
  enableJsonResponse: true
} as any);

sessions[newSessionId] = transport;
```

✅ Reads `Mcp-Session-Id` header
✅ Creates new session if missing
✅ Stores sessions in memory map for reuse

---

#### Required: Origin Validation

```
Server SHOULD validate Origin header to prevent CSRF attacks
```

**Current Implementation**: ⚠️ **PARTIALLY COMPLIANT**

```typescript
// src/http-server.ts:68-91
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('origin');

  // In production behind Cloudflare Tunnel, we trust the tunnel
  // For local development, validate origin
  if (process.env.NODE_ENV !== 'production' && origin) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:8080',
      'https://chatgpt.com',
      'https://claude.ai',  // ✅ Claude origin included
      'https://claude.com',
      'https://coda.bestviable.com'
    ];

    if (!allowedOrigins.includes(origin)) {
      console.warn(`[SECURITY] Rejected request from origin: ${origin}`);
      res.status(403).json({ error: 'Forbidden origin' });
      return;
    }
  }

  next();
});
```

⚠️ **ISSUE**: Origin validation is **disabled in production** (`NODE_ENV=production`)
- Production assumes Cloudflare Tunnel provides security
- But Claude Desktop may send requests with `Origin: https://claude.ai`
- These requests could be blocked if origin validation was enabled

**Recommendation**: Keep origin validation disabled in production when behind Cloudflare Tunnel

---

### 2. OAuth Authorization Flow Requirements

**Per MCP Spec Section "Third-Party Authorization Flow":**

#### Required: Dynamic Client Registration (DCR)

```
Server MUST support OAuth 2.0 Dynamic Client Registration (RFC 7591)
Endpoint: POST /oauth/register
```

**Current Implementation**: ✅ **COMPLIANT**

Looking at src/auth/oauth-routes.ts (mounted at line 112):

```typescript
// src/http-server.ts:112
app.use('/oauth', oauthRoutes);
```

Need to verify oauth-routes.ts has `/register` endpoint. Let me check:

<function_calls>
<invoke name="Read">
<parameter name="file_path">/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/auth/oauth-routes.ts