---
entity: coda-mcp-gateway
level: operational
zone: production
version: v1.4.2
tags: [mcp, coda, http, gateway, oauth, streaming]
source_path: /integrations/mcp/servers/coda/gateway/DEPLOYMENT.md
date: 2025-10-31
---

# Coda MCP Gateway Deployment

Production deployment guide for the Coda MCP Gateway with Streamable HTTP transport and OAuth discovery.

## Architecture

```
Claude Client
    ↓
[HTTPS] coda.bestviable.com
    ↓
nginx-proxy (auto-discovery, SSL termination)
    ↓
Coda HTTP Gateway (Port 8080)
    ├─ Token Validation (Coda API)
    ├─ Session Management (30min TTL)
    └─ Streamable HTTP Transport
         ↓
     Coda stdio MCP Server
         ↓
     Coda API
```

## Implementation Details

### Gateway Features

✅ **Streamable HTTP Transport** (MCP Protocol 2025-03-26+)
- POST `/mcp` - JSON-RPC requests with session management
- GET `/mcp` - SSE event stream for server→client messages
- DELETE `/mcp` - Session termination

✅ **OAuth 2.0 Discovery** (RFC 8414)
- `GET /.well-known/oauth-authorization-server` - RFC 8414 metadata
- Bearer token validation on all MCP endpoints
- Coda API integration for token verification

✅ **Security**
- Token validation on startup (fails fast if invalid)
- Per-request token verification against Coda API
- Sanitized error responses (no internal details leaked)
- Audit logging for all auth events
- Rate limiting: 10 req/min per IP on auth endpoints
- Session management with automatic cleanup (30 min TTL)

✅ **Production Hardening**
- Graceful shutdown (SIGINT/SIGTERM)
- Health check endpoint (`GET /health`)
- Docker multi-stage build (reduces image size)
- Alpine Linux base image (minimal attack surface)
- No-new-privileges security option

### File Structure

```
integrations/mcp/servers/coda/gateway/
├── package.json                      # Gateway dependencies
├── tsconfig.json                     # TypeScript config
├── Dockerfile                        # Multi-stage build
├── README.md                         # Template documentation
├── DEPLOYMENT.md                     # This file
└── src/
    ├── server.ts                     # Main HTTP server
    │   ├── Initialize MCP client connection
    │   ├── Validate Coda token on startup
    │   ├── Implement Streamable HTTP endpoints
    │   └── Handle graceful shutdown
    ├── auth/
    │   └── oauth-discovery.ts        # RFC 8414 endpoints
    ├── middleware/
    │   ├── token-validation.ts       # Bearer token + Coda API validation
    │   └── rate-limit.ts             # Rate limiting per IP
    └── utils/
        └── audit-logger.ts           # Security audit trail
```

### Token Validation Flow

1. **Startup**: `validateStartupToken(CODA_API_TOKEN)`
   - Checks token length (minimum 10 chars)
   - Calls Coda API `/v1/whoami` endpoint
   - Fails fast if invalid
   - Logs result to audit trail

2. **Per-Request**: `verifyToken(token)` in middleware
   - Validates Bearer token format: `Bearer <token>`
   - Calls Coda API `/v1/whoami` with token
   - Extracts user ID from response
   - Returns auth info or error
   - Logs outcome to audit trail

3. **Coda API Call**:
   ```
   GET https://api.coda.io/v1/whoami
   Authorization: Bearer <CODA_API_TOKEN>
   ```

   Success Response:
   ```json
   {
     "user": {
       "id": "usr_123abc",
       "name": "John Doe",
       "email": "john@example.com"
     }
   }
   ```

## Docker Build

The Dockerfile builds both the HTTP gateway and Coda stdio MCP server:

```dockerfile
# Stage 1: Build HTTP Gateway
WORKDIR /app
COPY integrations/mcp/servers/coda/gateway/package.json ...
RUN pnpm install --frozen-lockfile
COPY integrations/mcp/servers/coda/gateway/src ...
RUN pnpm build

# Stage 2: Build Coda stdio MCP server
WORKDIR /app/mcp
COPY integrations/mcp/servers/coda/src/package.json ...
RUN pnpm install --frozen-lockfile
COPY integrations/mcp/servers/coda/src/src ...
RUN pnpm build

# Runtime
WORKDIR /app
ENV MCP_COMMAND="node /app/mcp/dist/index.js"
CMD ["node", "dist/server.js"]
```

### Build Context
- Context: `/Users/davidkellam/workspace/portfolio` (monorepo root)
- Dockerfile: `integrations/mcp/servers/coda/gateway/Dockerfile`

### Build on Droplet

```bash
ssh tools-droplet-agents
cd /root/portfolio

# Build image (15-20 min first time)
docker compose -f infra/docker/docker-compose.production.yml \
  --env-file infra/config/.env \
  build --no-cache coda-mcp-gateway

# Verify build
docker images | grep coda-mcp

# Output should show: coda-mcp-gateway:latest
```

## Deployment (docker-compose)

### Service Definition

In `infra/docker/docker-compose.production.yml`:

```yaml
coda-mcp-gateway:
  build:
    context: ../..
    dockerfile: integrations/mcp/servers/coda/gateway/Dockerfile
  image: coda-mcp-gateway:latest
  container_name: coda-mcp-gateway
  restart: always

  environment:
    SERVICE_NAME: coda-mcp
    SERVICE_VERSION: 1.4.2
    PORT: 8080
    NODE_ENV: production
    CODA_API_TOKEN: ${CODA_API_TOKEN}
    VIRTUAL_HOST: coda.${DOMAIN}
    LETSENCRYPT_HOST: coda.${DOMAIN}
    LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL}

  networks:
    - proxy
    - syncbricks

  ports:
    - "127.0.0.1:8080:8080"

  depends_on:
    - nginx-proxy

  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s

  labels:
    - "com.github.jrcs.letsencrypt_nginx_proxy_companion.main=coda.${DOMAIN}"
    - "letsencrypt.host=coda.${DOMAIN}"
    - "letsencrypt.email=${LETSENCRYPT_EMAIL:-admin@bestviable.com}"

  security_opt:
    - no-new-privileges:true
```

### Start/Stop

```bash
# Start container
docker compose up -d coda-mcp-gateway

# View logs
docker logs -f coda-mcp-gateway

# Stop container
docker compose stop coda-mcp-gateway

# Restart
docker compose restart coda-mcp-gateway

# Full rebuild + restart
docker compose up -d --build coda-mcp-gateway
```

### Environment Variables (.env)

Required in `infra/config/.env`:

```env
# Coda API Token (get from https://coda.io/account/settings)
CODA_API_TOKEN=<your-api-token-here>

# Domain
DOMAIN=bestviable.com
LETSENCRYPT_EMAIL=admin@bestviable.com
```

## Verification

### 1. Container Health

```bash
# Check container is running
docker ps | grep coda-mcp

# View logs
docker logs coda-mcp-gateway

# Expected output:
# ✓ Validating Coda API token...
# ✓ Token validation successful
# ✓ Connecting to Coda stdio MCP server...
# ✓ Connected to Coda stdio MCP server
# ✓ Available tools: ...
# [coda-mcp] HTTP Gateway listening on port 8080
```

### 2. Health Endpoint

```bash
# Local health check
curl http://localhost:8080/health

# Expected response:
# {
#   "status": "ok",
#   "service": "coda-mcp",
#   "version": "1.4.2",
#   "timestamp": "2025-10-31T..."
# }
```

### 3. OAuth Discovery Endpoint

```bash
# From your local machine
curl https://coda.bestviable.com/.well-known/oauth-authorization-server

# Expected response (RFC 8414 metadata):
# {
#   "issuer": "https://coda.bestviable.com",
#   "authorization_endpoint": "https://coda.bestviable.com/oauth/authorize",
#   "token_endpoint": "https://coda.bestviable.com/oauth/token",
#   "code_challenge_methods_supported": ["S256", "plain"],
#   "response_types_supported": ["code"],
#   "grant_types_supported": ["authorization_code", "refresh_token", "implicit"],
#   "scopes_supported": ["openid", "profile", "email", "mcp:read", "mcp:write"],
#   ...
# }
```

### 4. MCP Endpoint (with auth)

```bash
# From your local machine, with valid Coda token
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test-session-123" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {"name": "test-client", "version": "1.0.0"}
    }
  }'

# Expected: JSON-RPC response (not error 401)
```

### 5. Audit Logs

```bash
# Check auth events in logs
docker logs coda-mcp-gateway | grep AUTH

# Expected log entries:
# {"timestamp":"...","service":"coda-mcp","event_type":"AUTH_SUCCESS",...}
# {"timestamp":"...","service":"coda-mcp","event_type":"AUTH_FAILURE",...}
```

## Troubleshooting

### Container won't start

```bash
# View startup logs
docker logs coda-mcp-gateway

# Common issues:
# 1. CODA_API_TOKEN not set or invalid
#    → Check .env file, re-run docker compose with explicit --env-file
#
# 2. Cannot connect to Coda stdio MCP server
#    → Check /app/mcp/dist/index.js built correctly
#    → Check Coda dependencies installed
#
# 3. Port 8080 in use
#    → Change VIRTUAL_PORT or kill other containers
```

### Token validation fails

```bash
# Check token format
echo $CODA_API_TOKEN
# Should be > 10 characters, no spaces

# Verify token is current
curl -H "Authorization: Bearer $CODA_API_TOKEN" \
  https://api.coda.io/v1/whoami

# Should return user info, not 401
```

### OAuth discovery endpoint 404

```bash
# Check nginx-proxy is forwarding correctly
docker logs nginx-proxy | grep coda

# Should show upstream created:
# upstream coda.bestviable.com is created
```

### Cannot connect from Claude Desktop

```bash
# Verify HTTPS is working
curl -v https://coda.bestviable.com/health

# Should return 200 with valid SSL certificate

# Check Claude Desktop config has correct format
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Example:
# {
#   "mcpServers": {
#     "coda": {
#       "transport": "http",
#       "url": "https://coda.bestviable.com/mcp",
#       "headers": {
#         "Authorization": "Bearer $CODA_API_TOKEN"
#       }
#     }
#   }
# }
```

## Client Configuration

### Claude Desktop

In `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "coda": {
      "transport": "http",
      "url": "https://coda.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${CODA_API_TOKEN}"
      }
    }
  }
}
```

### Claude Code

In `~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "coda": {
      "transport": "http",
      "url": "https://coda.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${CODA_API_TOKEN}"
      }
    }
  }
}
```

## Monitoring & Operations

### Logs

```bash
# Real-time logs
docker logs -f coda-mcp-gateway

# Last 100 lines
docker logs --tail 100 coda-mcp-gateway

# Since specific time
docker logs --since 2025-10-31T10:00:00 coda-mcp-gateway

# Auth events only
docker logs coda-mcp-gateway | grep AUTH

# Errors only
docker logs coda-mcp-gateway | grep -E "ERROR|FAILED"
```

### Health Monitoring

```bash
# Manual health check
curl http://localhost:8080/health

# Docker health status
docker inspect coda-mcp-gateway | grep -A 5 '"Health"'

# Should show: "Status": "healthy"
```

### Token Rotation

Every 90 days, rotate the Coda API token:

1. Generate new token in https://coda.io/account/settings
2. Update `infra/config/.env`:
   ```bash
   CODA_API_TOKEN=<new-token>
   ```
3. Restart container:
   ```bash
   docker compose restart coda-mcp-gateway
   ```
4. Verify health check passes
5. Delete old token from Coda dashboard

## Upgrade Path: OAuth 2.1

To add full OAuth 2.1 support (user-initiated auth with token refresh):

1. Implement `/oauth/authorize` endpoint
2. Implement `/oauth/callback` endpoint
3. Add token refresh mechanism (refresh tokens stored in Redis)
4. Use MCP SDK `mcpAuthRouter()` for authorization
5. Update client configs with OAuth URLs instead of static tokens

See `/docs/architecture/integrations/mcp/auth_strategies_v01.md` for full OAuth 2.1 upgrade guide.

For now, Bearer token auth is sufficient for single-user deployment and easily upgraded to OAuth 2.1 later.

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [Streamable HTTP Transport](https://modelcontextprotocol.io/docs/server)
- [OAuth 2.0 RFC 8414](https://tools.ietf.org/html/rfc8414)
- [Coda API Docs](https://coda.io/developers)
- [Gateway Template](../../../gateway-template/README.md)
