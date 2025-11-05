# CLAUDE.md - Coda MCP HTTP-Native Server Conventions

This document describes conventions, patterns, and best practices for working with the **Coda MCP HTTP-Native Server** project.

**Project**: HTTP-native Model Context Protocol server for Coda
**Version**: 1.0.0
**Status**: Production-ready
**Architecture**: HTTP-native with token estimation, memory hooks, OAuth integration

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│ Express.js HTTP Server (port 8080)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌────────────────────────┐  ┌──────────────────────────────┐   │
│ │ OAuth/Discovery        │  │ MCP Protocol (Bearer Auth)   │   │
│ │                        │  │                              │   │
│ │ GET /.well-known/...   │  │ POST /mcp (requests)         │   │
│ │ POST /oauth/validate    │  │ GET  /mcp (SSE stream)       │   │
│ │                        │  │ DELETE /mcp (sessions)       │   │
│ └────────────────────────┘  └──────────────────────────────┘   │
│                                          ↓                       │
│                              ┌──────────────────────────┐        │
│                              │ StreamableHTTPTransport  │        │
│                              │ (SDK-provided)           │        │
│                              └──────────────────────────┘        │
│                                          ↓                       │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Middleware Chain                                         │   │
│ │ 1. CORS Headers                                          │   │
│ │ 2. Origin Validation                                     │   │
│ │ 3. Cloudflare Access Token Validation                    │   │
│ │ 4. Bearer Token Middleware (configures Coda client)      │   │
│ │ 5. Session Metrics Tracking (token budgeting)            │   │
│ │ 6. Memory Hooks (lifecycle events)                       │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Response Pipeline                                        │   │
│ │ 1. Request → onToolCall hook (track intent)              │   │
│ │ 2. Execute via StreamableHTTPTransport                   │   │
│ │ 3. Estimate response tokens (context budgeting)          │   │
│ │ 4. onResponse hook (track outcomes)                      │   │
│ │ 5. Response → Client                                     │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Session Lifecycle                                        │   │
│ │ POST /mcp (new session)  → Sessions map stores transport │   │
│ │ GET  /mcp (SSE stream)   → Reuses session                │   │
│ │ DELETE /mcp (terminate)  → onSessionEnd hook, cleanup    │   │
│ └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Code Organization

### Directory Structure

```
integrations/mcp/servers/coda/
├── src/
│   ├── http-server.ts              # Main HTTP server (all endpoints)
│   ├── server.ts                   # MCP server definition
│   ├── client/
│   │   ├── client.gen.ts          # Generated Coda API client
│   │   └── client.gen.d.ts        # Type definitions
│   ├── middleware/
│   │   └── response-wrapper.ts    # Response metadata wrapping
│   ├── types/
│   │   └── memory-hooks.ts        # Lifecycle hook interfaces
│   ├── utils/
│   │   └── token-counter.ts       # Token estimation utilities
│   └── tools/
│       └── *.ts                    # Tool implementations
├── dist/
│   ├── http-server.js              # Compiled main server
│   └── *.js                        # Other compiled files
├── Dockerfile                       # Multi-stage build config
├── .dockerignore                   # Docker build exclusions
├── CLAUDE.md                       # This file
├── DOCKERFILE_MIGRATION_NOTES.md  # Deployment guide
├── test-oauth.sh                   # OAuth endpoint tests
├── package.json                    # Dependencies
├── pnpm-lock.yaml                 # Lock file (commit this)
└── tsconfig.json                  # TypeScript config
```

---

## Key Patterns and Conventions

### 1. Session Management

**Pattern**: One StreamableHTTPServerTransport per session

```typescript
const sessions: Record<string, StreamableHTTPServerTransport> = {};

// Create new session
const newSessionId = randomUUID();
transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => newSessionId,
  enableJsonResponse: true
} as any);
sessions[newSessionId] = transport;
await codaMcpServer.connect(transport);

// Reuse existing session
if (sessionId && sessions[sessionId]) {
  transport = sessions[sessionId];
}

// Clean up session
delete sessions[sessionId];
sessionMetrics.delete(sessionId);
```

**Why**: HTTP is stateless, but MCP is stateful. Sessions persist state across requests using a shared transport object.

### 2. Token Estimation for Context Budgeting

**Pattern**: Estimate tokens on every request/response

```typescript
// Estimate tokens on request
const estimatedTokens = estimateToolResponseTokens(
  req.body.method || 'unknown',
  req.body
);
metrics.totalTokens += estimatedTokens;

// Formula: 1 token ≈ 4 characters
// Round up to nearest 50 for safety
const estimate = Math.ceil(content.length / 4 / 50) * 50;
```

**Why**: Context windows are limited. Track consumption per session to prevent token overflow.

### 3. Memory Hooks for Lifecycle Events

**Pattern**: Three lifecycle points for persistent learning

```typescript
// Before execution (track intent)
await memoryHooks.onToolCall({
  sessionId,
  timestamp: new Date(),
  toolName: req.body?.method,
  toolMethod: req.body?.method,
  params: req.body?.params
});

// After execution (track outcomes)
await memoryHooks.onResponse({
  sessionId,
  timestamp: new Date(),
  toolName,
  success: statusCode < 400,
  metadata: { duration, tokenEstimate }
});

// On session end (finalize learning)
await memoryHooks.onSessionEnd({
  sessionId,
  startTime,
  endTime,
  totalRequests,
  totalTokens,
  tools: [],
  errors: 0
});
```

**Why**: Enables higher-level systems to learn patterns and improve over time.

### 4. Bearer Token Authentication

**Pattern**: Coda API token per request

```typescript
// Extract from Authorization header
const authHeader = req.headers.authorization;
const token = authHeader.substring(7).trim(); // Remove "Bearer "

// Configure Coda client
client.setConfig({
  baseURL: 'https://coda.io/apis/v1',
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

**Why**: Each request may come from different users. Configure client per request to support multi-tenancy.

### 5. Response Wrapping Pattern

**Pattern**: All responses include metadata envelope

```typescript
interface MCPToolResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorInfo;
  metadata: {
    timestamp: string;
    resourceId: string;
    tokenEstimate: number;
    summary: string;
  };
  fullContentPath?: string; // For large data
}
```

**Why**:
- Enables progressive disclosure (summary → full content on demand)
- Provides token estimates for context budgeting
- Tracks resource IDs for cross-tool correlation
- Standardizes error handling

### 6. Cloudflare Access Integration

**Pattern**: Support both Cloudflare Access JWT and Bearer tokens

```typescript
// Cloudflare Access headers (if behind Cloudflare Tunnel)
const cfAccessJwt = req.headers['cf-access-jwt-assertion'];
const cfAccessEmail = req.headers['cf-access-authenticated-user-email'];

// Bearer token (for direct requests)
const authHeader = req.headers.authorization;
const token = authHeader?.substring(7).trim();
```

**Why**: Provides two authentication paths:
1. **Development/Direct**: Bearer token for local testing
2. **Production**: Cloudflare Access JWT when behind Cloudflare Tunnel

---

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run server
node dist/http-server.js

# In another terminal, test endpoints
curl http://localhost:8080/health
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":1}'
```

### Running Tests

```bash
# OAuth endpoint tests
./test-oauth.sh

# Expected output:
# ✓ Health check passed
# ✓ Authorization Server metadata endpoint working
# ✓ Protected Resource metadata endpoint working
# ✓ Correctly rejected request without token
# ✓ Correctly accepted token
# ✓ Cloudflare Access headers are supported
```

### Adding New Tools

1. Create tool implementation in `src/tools/[tool-name].ts`
2. Export tool from `src/server.ts`
3. Register with MCP server instance
4. Wrap responses using `wrapResponse()` or `wrapResponseAuto()`
5. Build and test: `pnpm build && node dist/http-server.js`

---

## Production Deployment

### Building Docker Image

```bash
# Build locally
docker build -t coda-mcp:v1.0.0 .

# Test image
docker run -p 8080:8080 coda-mcp:v1.0.0
curl http://localhost:8080/health

# Push to registry (if applicable)
docker tag coda-mcp:v1.0.0 myregistry/coda-mcp:v1.0.0
docker push myregistry/coda-mcp:v1.0.0
```

### Deploying to Droplet

```bash
# Copy files to droplet
scp -r . tools-droplet:/root/portfolio/integrations/mcp/servers/coda/

# Build on droplet
ssh tools-droplet 'cd /root/portfolio/integrations/mcp/servers/coda && docker build -t coda-mcp:v1.0.0 .'

# Update docker-compose.yml with new image version
# Then restart service
ssh tools-droplet 'cd /root/portfolio && docker-compose -f docs/ops/docker-compose.production.yml up -d coda-mcp'

# Verify
curl https://coda.bestviable.com/health
```

### Docker Compose Configuration

```yaml
services:
  coda-mcp:
    image: coda-mcp:v1.0.0
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    volumes:
      - coda-logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped

volumes:
  coda-logs:
```

---

## Monitoring and Logging

### Logging Format

All logs follow pattern: `[COMPONENT] Message`

```
[HTTP] GET /health auth=yes
[OAUTH] Authorization Server metadata requested
[CLOUDFLARE] Access request from: user@example.com
[Auth] Configured Coda client with token: abc12345...
[METRICS] Session abc12345... - Request #1
[MCP] Incoming POST /mcp { sessionId, hasBody, hasAuth }
[MEMORY] onToolCall: tools/list in session abc12345...
[MEMORY] onResponse: tools/list OK (142ms)
[MEMORY] onSessionEnd: 5 requests, 1250 tokens over 30s
[ERROR] Unhandled error: ...
```

### Health Check

```bash
# Container health check endpoint
curl http://localhost:8080/health

# Response
{
  "status": "ok",
  "service": "coda-mcp",
  "version": "1.0.0",
  "timestamp": "2025-11-01T21:00:00.000Z"
}
```

### Metrics Tracking

Session metrics are tracked in memory:

```typescript
interface SessionMetrics {
  sessionId: string;
  totalTokens: number;      // Cumulative token usage
  requestCount: number;     // Number of requests
  startTime: Date;          // When session started
}
```

### Debugging

```bash
# See startup banner
docker logs coda-mcp

# Follow logs
docker logs -f coda-mcp

# Check specific timestamp
docker logs --since 2025-11-01T20:00:00Z coda-mcp

# Grep for errors
docker logs coda-mcp | grep ERROR
```

---

## Best Practices

### Do's ✅

- **Always validate Bearer tokens** before configuring Coda client
- **Wrap all responses** with metadata (use `wrapResponse()`)
- **Handle hook errors** gracefully (never block requests on hook failure)
- **Track session metrics** for context budgeting
- **Use health checks** in container orchestration
- **Version Docker images** explicitly (not just `latest`)
- **Keep .dockerignore** updated (prevents bloat)
- **Log authentication events** for security auditing
- **Estimate tokens conservatively** (round up for safety)

### Don'ts ❌

- **Don't commit .env files** (use environment variables)
- **Don't ignore Bearer token validation**
- **Don't hardcode Coda API tokens** in source code
- **Don't block requests on memory hook failures**
- **Don't assume X-Forwarded headers** (trust Cloudflare tunnel)
- **Don't include test files in Docker image** (.dockerignore)
- **Don't delete old Docker images** without keeping backups
- **Don't log sensitive tokens** (only log prefix like `abc123...`)
- **Don't modify session transport mid-request**

---

## Troubleshooting

### Issue: 401 Unauthorized on /mcp endpoint

**Cause**: Missing or invalid Bearer token

**Solution**:
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer YOUR_CODA_TOKEN" \
  -H "Mcp-Session-Id: session-123" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Issue: Token estimate seems wrong

**Cause**: Formula uses 1 token ≈ 4 characters, may vary by model

**Solution**: Check `src/utils/token-counter.ts` formula and adjust if needed:
```typescript
const estimate = Math.ceil(content.length / 4 / 50) * 50;
// Try dividing by different number if tokens are consistently over/under
```

### Issue: Session not persisting across requests

**Cause**: Client not sending same `Mcp-Session-Id` header

**Solution**: Client must send same session ID:
```bash
# Request 1
curl -X POST http://localhost:8080/mcp \
  -H "Mcp-Session-Id: session-abc123" \
  ...

# Request 2 (must use same ID)
curl -X GET http://localhost:8080/mcp \
  -H "Mcp-Session-Id: session-abc123" \
  ...

# Terminate
curl -X DELETE http://localhost:8080/mcp \
  -H "Mcp-Session-Id: session-abc123" \
  ...
```

### Issue: Container keeps restarting

**Cause**: Health check failing

**Solution**:
```bash
# Check health endpoint manually
curl -f http://localhost:8080/health

# Check logs
docker logs coda-mcp | tail -50

# Temporarily disable health check for debugging
# Edit docker-compose.yml and remove healthcheck section
```

---

## References

- **MCP Specification**: https://spec.modelcontextprotocol.io/
- **Coda API Docs**: https://coda.io/developers
- **Express.js Docs**: https://expressjs.com/
- **Cloudflare Access**: https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-01 | Initial HTTP-native implementation with token estimation, memory hooks, OAuth |

---

**Last Updated**: 2025-11-01
**Maintainer**: Claude / Bestviable Portfolio
**Status**: Production-Ready
