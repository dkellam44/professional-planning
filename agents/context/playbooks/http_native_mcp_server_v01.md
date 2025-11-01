---
entity: playbook
level: technical
zone: implementation
version: "0.1"
tags: [mcp, http, oauth, architecture, coda, syncbricks]
source_path: agents/context/playbooks/http_native_mcp_server_v01.md
date: 2025-10-31
author: claude-code
related:
  - agents/context/playbooks/coda_mcp_oauth_implementation_v01.md
  - docs/infrastructure/syncbricks_solution_breakdown_v1.md
status: draft
---

# HTTP-Native MCP Server Implementation Playbook

## Purpose

Transform a stdio-based MCP server into an HTTP-native server with integrated OAuth 2.0, eliminating the need for a separate gateway wrapper. This architecture is simpler, more maintainable, and fits perfectly into the SyncBricks infrastructure pattern.

## Context

**Previous Architecture (Complex):**
```
Coda MCP (stdio) → HTTP Gateway → Cloudflare Tunnel → Internet
- Two separate processes
- Message bridging overhead
- OAuth in gateway, MCP logic separate
- Complex debugging
```

**New Architecture (Simple):**
```
Coda MCP (HTTP-native) → Cloudflare Tunnel → Internet
- Single process
- Direct HTTP transport
- OAuth and MCP integrated
- Simpler debugging
```

## Technical Foundation

### MCP Streamable HTTP Specification (2025-03-26)

Based on official Model Context Protocol specification from Anthropic.

#### Endpoint Requirements

**MUST:**
- Provide single HTTP endpoint (e.g., `/mcp`) supporting POST and GET
- Validate `Origin` header to prevent DNS rebinding attacks
- Return appropriate Content-Type headers

**POST Endpoint:**
- Accept: `application/json` and `text/event-stream`
- Body: JSON-RPC messages (single or batched)
- Response: 202 Accepted (notifications only) or JSON/SSE stream (requests)

**GET Endpoint:**
- Purpose: Server-initiated messages via SSE
- Response: `Content-Type: text/event-stream` or 405 Method Not Allowed
- Optional: Event IDs for resumability

#### Session Management

**Session ID:**
- Returned in `Mcp-Session-Id` response header during initialization
- SHOULD be cryptographically secure (UUID, JWT, or hash)
- Client MUST include in all subsequent requests
- HTTP 404 response signals session termination

**Session Modes:**

1. **Stateless (no sessions):**
   - Set `sessionIdGenerator: undefined`
   - Each request is independent
   - Simpler but no state persistence

2. **Stateful (with sessions):**
   - Custom `sessionIdGenerator` function
   - Track transports in memory Map
   - Supports server-initiated notifications

#### Security Requirements

1. **Origin Validation:** Prevent DNS rebinding
2. **Authentication:** Bearer token validation
3. **Localhost Binding:** For local deployments
4. **HTTPS:** When exposed publicly (via Cloudflare Tunnel)

### TypeScript SDK Implementation

**Package:** `@modelcontextprotocol/sdk`
**Import:** `StreamableHTTPServerTransport` from `@modelcontextprotocol/sdk/server/streamableHttp.js`

**Basic Pattern:**
```typescript
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';

const app = express();
app.use(express.json());

// Stateless mode
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Stateful mode
const sessions = new Map();

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && sessions.has(sessionId)) {
    transport = sessions.get(sessionId);
  } else {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => sessions.set(id, transport),
      onsessionclosed: (id) => sessions.delete(id),
      enableJsonResponse: true
    });
    await server.connect(transport);
  }

  await transport.handleRequest(req, res, req.body);
});
```

## Implementation Plan

### Phase 1: Create HTTP-Native Server Entry Point

**File:** `/integrations/mcp/servers/coda/src/src/http-server.ts`

**Steps:**

1. **Import Dependencies:**
   ```typescript
   import express, { Express, Request, Response, NextFunction } from 'express';
   import { randomUUID } from 'crypto';
   import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
   import { server as codaMcpServer } from './server.js';
   import { client } from './client/client.gen.js';
   ```

2. **Setup Express App:**
   ```typescript
   const app: Express = express();
   const PORT = process.env.PORT || 8080;
   const SERVICE_NAME = 'coda-mcp';
   const SERVICE_VERSION = '1.0.0';

   // Middleware
   app.use(express.json({ limit: '10mb' }));
   app.use(express.urlencoded({ extended: true }));

   // CORS
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', '*');
     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
     res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
     if (req.method === 'OPTIONS') {
       res.sendStatus(200);
     } else {
       next();
     }
   });
   ```

3. **Add Origin Validation (MCP Requirement):**
   ```typescript
   app.use('/mcp', (req: Request, res: Response, next: NextFunction) => {
     const origin = req.get('origin');
     // In production behind Cloudflare Tunnel, we trust the tunnel
     // For local testing, validate origin
     if (process.env.NODE_ENV !== 'production' && origin) {
       // Add your allowed origins here
       const allowedOrigins = [
         'https://chatgpt.com',
         'https://claude.ai',
         'https://claude.com'
       ];
       if (!allowedOrigins.includes(origin)) {
         res.status(403).json({ error: 'Forbidden origin' });
         return;
       }
     }
     next();
   });
   ```

4. **Implement Session Management:**
   ```typescript
   const sessions: Record<string, StreamableHTTPServerTransport> = {};

   app.post('/mcp', async (req: Request, res: Response) => {
     try {
       const sessionId = req.headers['mcp-session-id'] as string | undefined;
       let transport: StreamableHTTPServerTransport;

       if (sessionId && sessions[sessionId]) {
         // Reuse existing session
         transport = sessions[sessionId];
       } else if (!sessionId) {
         // New session
         transport = new StreamableHTTPServerTransport({
           sessionIdGenerator: () => randomUUID(),
           onsessioninitialized: (id) => {
             sessions[id] = transport;
             console.log(`[MCP] Session initialized: ${id}`);
           },
           onsessionclosed: (id) => {
             delete sessions[id];
             console.log(`[MCP] Session closed: ${id}`);
           },
           enableJsonResponse: true
         });

         // Connect to MCP server
         await codaMcpServer.connect(transport);
       } else {
         // Invalid session
         res.status(400).json({
           jsonrpc: '2.0',
           error: { code: -32000, message: 'Invalid session' },
           id: null
         });
         return;
       }

       // Handle the request
       await transport.handleRequest(req, res, req.body);
     } catch (error) {
       console.error('[MCP] Request failed:', error);
       if (!res.headersSent) {
         res.status(500).json({
           jsonrpc: '2.0',
           error: { code: -32603, message: 'Internal server error' },
           id: null
         });
       }
     }
   });

   app.get('/mcp', async (req: Request, res: Response) => {
     const sessionId = req.headers['mcp-session-id'] as string | undefined;

     if (!sessionId || !sessions[sessionId]) {
       res.status(400).send('Invalid or missing session ID');
       return;
     }

     const transport = sessions[sessionId];

     try {
       await transport.handleRequest(req, res);
     } catch (error) {
       console.error('[MCP] SSE stream error:', error);
       if (!res.headersSent) {
         res.status(500).send('Stream error');
       }
     }
   });

   app.delete('/mcp', async (req: Request, res: Response) => {
     const sessionId = req.headers['mcp-session-id'] as string | undefined;

     if (!sessionId || !sessions[sessionId]) {
       res.status(400).json({ error: 'Missing or invalid session ID' });
       return;
     }

     const transport = sessions[sessionId];

     try {
       await transport.handleRequest(req, res);
       delete sessions[sessionId];
     } catch (error) {
       console.error('[MCP] Session termination failed:', error);
       if (!res.headersSent) {
         res.status(500).json({ error: 'Failed to terminate session' });
       }
     }
   });
   ```

5. **Initialize Coda API Client with Bearer Token:**
   ```typescript
   // Extract Bearer token from Authorization header and configure Coda client
   app.use('/mcp', (req: Request, res: Response, next: NextFunction) => {
     const authHeader = req.headers.authorization;
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       res.status(401).json({ error: 'Missing or invalid authorization' });
       return;
     }

     const token = authHeader.substring(7);

     // Configure Coda API client for this request
     client.setConfig({
       baseURL: 'https://coda.io/apis/v1',
       headers: {
         Authorization: `Bearer ${token}`
       }
     });

     next();
   });
   ```

6. **Add Health Check:**
   ```typescript
   app.get('/health', (req: Request, res: Response) => {
     res.json({
       status: 'ok',
       service: SERVICE_NAME,
       version: SERVICE_VERSION,
       timestamp: new Date().toISOString()
     });
   });
   ```

7. **Start Server:**
   ```typescript
   const server = app.listen(PORT, () => {
     console.log(`[${SERVICE_NAME}] HTTP MCP server listening on port ${PORT}`);
     console.log(`[${SERVICE_NAME}] Endpoint: POST/GET/DELETE /mcp`);
     console.log(`[${SERVICE_NAME}] Health: GET /health`);
   });

   // Graceful shutdown
   process.on('SIGINT', () => {
     console.log(`\n[${SERVICE_NAME}] Shutting down gracefully...`);
     server.close(() => {
       console.log(`[${SERVICE_NAME}] Server closed`);
       process.exit(0);
     });
   });

   process.on('SIGTERM', () => {
     console.log(`\n[${SERVICE_NAME}] Received SIGTERM, shutting down...`);
     server.close(() => process.exit(0));
   });

   export default app;
   ```

### Phase 2: Integrate OAuth 2.0

**Copy from gateway project:**
- `/gateway/src/auth/auth-store.ts` → `/src/src/auth/auth-store.ts`
- `/gateway/src/auth/oauth-routes.ts` → `/src/src/auth/oauth-routes.ts`
- `/gateway/src/auth/oauth-discovery.ts` → `/src/src/auth/oauth-discovery.ts`
- `/gateway/src/views/authorize.html` → `/src/src/views/authorize.html`

**Integrate into http-server.ts:**

```typescript
import oauthRouter from './auth/oauth-routes.js';
import { getOAuthDiscovery, getBearerTokenMetadata } from './auth/oauth-discovery.js';

// OAuth Discovery Endpoints
app.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
  const protocol = req.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${req.get('host')}`;
  const discovery = getOAuthDiscovery(baseUrl, SERVICE_NAME);
  res.json(discovery);
});

app.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
  const protocol = req.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${req.get('host')}`;
  const discovery = getOAuthDiscovery(baseUrl, SERVICE_NAME);
  res.json(discovery);
});

app.get('/.well-known/oauth-protected-resource', (req: Request, res: Response) => {
  const protocol = req.get('x-forwarded-proto') || 'https';
  const baseUrl = `${protocol}://${req.get('host')}`;
  const metadata = getBearerTokenMetadata(baseUrl, SERVICE_NAME);
  res.json(metadata);
});

// OAuth Endpoints
app.use('/oauth', oauthRouter);
```

### Phase 3: Update Package Configuration

**File:** `/integrations/mcp/servers/coda/package.json`

Add new script:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "start:http": "node dist/http-server.js",
    "build": "tsc && tsc -p tsconfig.esm.json"
  }
}
```

### Phase 4: Update Docker Configuration

**File:** `/integrations/mcp/servers/coda/Dockerfile`

Update CMD to use http-server:
```dockerfile
CMD ["node", "dist/http-server.js"]
```

**Or keep both modes available:**
```dockerfile
# Default to HTTP mode, but allow stdio mode via env var
CMD ["sh", "-c", "node ${MCP_MODE:-dist/http-server.js}"]
```

### Phase 5: Update SyncBricks docker-compose

**File:** `/docs/ops/docker-compose.production.yml`

Update coda-mcp-gateway service:
```yaml
  coda-mcp:
    build:
      context: /root/portfolio/integrations/mcp/servers/coda
      dockerfile: Dockerfile
    container_name: coda-mcp
    restart: unless-stopped
    networks:
      - syncbricks
    environment:
      - PORT=8080
      - NODE_ENV=production
      - SERVICE_NAME=coda-mcp
      - SERVICE_VERSION=1.0.0
    labels:
      - "com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy"
    expose:
      - "8080"
    volumes:
      - /root/portfolio/integrations/mcp/servers/coda:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Note: Removed the separate gateway service entirely. The MCP server now handles everything.

## Testing Procedures

### 1. Local Testing

```bash
cd /integrations/mcp/servers/coda

# Build
npm run build

# Set test token
export CODA_API_TOKEN="test-token"

# Start HTTP server
npm run start:http
```

**Test health:**
```bash
curl http://localhost:8080/health
```

**Test OAuth discovery:**
```bash
curl http://localhost:8080/.well-known/oauth-authorization-server
```

**Test MCP initialize (requires valid Bearer token):**
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_CODA_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

### 2. Droplet Deployment

```bash
# From local machine
cd /Users/davidkellam/workspace/portfolio

# Sync code
rsync -avz --delete \
  integrations/mcp/servers/coda/ \
  tools-droplet-agents:/root/portfolio/integrations/mcp/servers/coda/

rsync -avz \
  docs/ops/docker-compose.production.yml \
  tools-droplet-agents:/root/portfolio/infra/config/

# SSH to droplet
ssh tools-droplet-agents

# Navigate to config directory
cd /root/portfolio/infra/config

# Rebuild and restart
docker compose -f docker-compose.production.yml build coda-mcp
docker compose -f docker-compose.production.yml up -d coda-mcp

# Check logs
docker compose -f docker-compose.production.yml logs -f coda-mcp
```

### 3. ChatGPT Connector Testing

**ChatGPT Setup:**
1. Go to ChatGPT Settings → MCP Connectors
2. Click "Add Connector"
3. Fill in:
   - **Name:** Coda
   - **MCP Server URL:** `https://coda.bestviable.com/mcp`
   - **Authentication:** OAuth
4. Complete OAuth flow by pasting Coda API token
5. Test connection

**Expected Flow:**
1. ChatGPT fetches `/.well-known/oauth-authorization-server`
2. ChatGPT redirects to `/oauth/authorize`
3. User pastes Coda API token
4. Server exchanges code for Bearer token
5. ChatGPT initializes MCP session with Bearer token
6. ChatGPT calls MCP tools (e.g., `coda_list_documents`)

### 4. Claude.ai Testing

Same process as ChatGPT:
- URL: `https://coda.bestviable.com/mcp`
- Auth: OAuth
- Complete flow

## Rollback Plan

If HTTP-native implementation fails, the gateway wrapper is still available:

```bash
# Switch back to gateway mode in docker-compose
cd /root/portfolio/infra/config

# Restore previous docker-compose.production.yml from git
git checkout docker-compose.production.yml

# Restart services
docker compose -f docker-compose.production.yml up -d
```

## Success Criteria

- ✅ Health endpoint returns 200
- ✅ OAuth discovery endpoints return valid metadata
- ✅ OAuth flow completes successfully
- ✅ MCP initialize request returns capabilities
- ✅ MCP tools/list request returns 40+ tools
- ✅ ChatGPT connector successfully connects
- ✅ Claude.ai connector successfully connects
- ✅ Tools execute correctly (test with `coda_list_documents`)

## Benefits Over Gateway Wrapper

1. **Simpler Architecture:** One process instead of two
2. **No Bridging Overhead:** Direct message handling
3. **Easier Debugging:** Single codebase
4. **Better Performance:** No stdio subprocess spawning
5. **Integrated OAuth:** Auth logic with MCP logic
6. **Fits SyncBricks:** Single Docker service
7. **Standard Pattern:** Follows official MCP HTTP spec

## References

- [MCP Specification 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [OAuth 2.0 RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)

## Related Playbooks

- `coda_mcp_oauth_implementation_v01.md` - Original OAuth implementation in gateway
- `syncbricks_solution_breakdown_v1.md` - Infrastructure pattern

---

**Status:** Ready for implementation
**Next Steps:** Implement Phase 1, test locally, deploy to droplet
