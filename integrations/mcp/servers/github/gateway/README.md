---
entity: mcp-gateway
level: internal
zone: internal
version: v1.0.0
tags: [mcp, gateway, http, oauth, template]
source_path: /integrations/mcp/gateway-template/README.md
date: 2025-10-31
---

# MCP HTTP Gateway Template

Reusable TypeScript gateway for wrapping stdio-based MCP servers and exposing them via HTTP with OAuth discovery.

## Features

✅ **Streamable HTTP Transport** (protocol 2025-03-26+)
- POST `/mcp` - JSON-RPC requests
- GET `/mcp` - SSE event stream
- DELETE `/mcp` - Session termination

✅ **OAuth 2.0 Discovery** (RFC 8414)
- `GET /.well-known/oauth-authorization-server` endpoint
- Metadata for client authentication
- Supports Bearer tokens and full OAuth flows

✅ **Security Hardening**
- Bearer token validation
- Token format verification
- Startup token validation
- Secure error handling (no internal details to clients)
- Audit logging for all auth events
- Rate limiting (10 req/min per IP)

✅ **Session Management**
- Stateful sessions with session IDs
- Automatic session cleanup (30 min TTL)
- Session-scoped MCP communication

## Usage

### 1. Create Service Gateway

Copy template for your MCP service:

```bash
cp -r integrations/mcp/gateway-template \
      integrations/mcp/servers/mycopa/gateway
```

### 2. Implement Token Verification

Edit `src/middleware/token-validation.ts` and override `verifyToken()`:

**Example: Coda MCP**
```typescript
export async function verifyToken(token: string): Promise<AuthInfo> {
  try {
    const response = await fetch('https://api.coda.io/v1/whoami', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `Coda API error: ${response.status}`
      };
    }

    const data = await response.json();
    return {
      valid: true,
      token,
      clientId: data.user.id
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### 3. Create Service Dockerfile

```dockerfile
FROM node:23-alpine

WORKDIR /app

# Copy gateway
COPY gateway/package.json gateway/pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY gateway/src ./src
COPY gateway/tsconfig.json ./
RUN pnpm build

# Copy MCP server source
COPY mcp-server/package.json mcp-server/pnpm-lock.yaml ./mcp/
RUN cd mcp && pnpm install --frozen-lockfile

COPY mcp-server/src ./mcp/src
COPY mcp-server/tsconfig.json ./mcp/
RUN cd mcp && pnpm build

EXPOSE 8080

# Start gateway wrapping stdio MCP
CMD ["node", "dist/server.js"]
```

### 4. Update docker-compose.production.yml

```yaml
services:
  mycopa-mcp-gateway:
    build:
      context: ../../
      dockerfile: integrations/mcp/servers/mycopa/gateway/Dockerfile
    image: mycopa-mcp-gateway:latest
    container_name: mycopa-mcp-gateway
    restart: always

    environment:
      SERVICE_NAME: mycopa-mcp
      SERVICE_VERSION: 1.0.0
      PORT: 8080
      MYCOPA_API_TOKEN: ${MYCOPA_API_TOKEN}

      # nginx-proxy auto-discovery
      VIRTUAL_HOST: mycopa.${DOMAIN}
      VIRTUAL_PORT: 8080
      LETSENCRYPT_HOST: mycopa.${DOMAIN}
      LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL}

    ports:
      - "127.0.0.1:8080:8080"

    networks:
      - proxy
      - syncbricks

    depends_on:
      - nginx-proxy

    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

    security_opt:
      - no-new-privileges:true
```

### 5. Configure Environment

Add to `/infra/config/.env`:

```env
MYCOPA_API_TOKEN=your-api-token-here
```

### 6. Deploy

```bash
# Build on droplet
ssh tools-droplet-agents
cd /root/portfolio/infra/docker
docker compose build mycopa-mcp-gateway

# Start
docker compose up -d mycopa-mcp-gateway

# Verify
curl -H "Authorization: Bearer $MYCOPA_API_TOKEN" \
     https://mycopa.bestviable.com/mcp
```

## Client Configuration

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mycopa": {
      "transport": "http",
      "url": "https://mycopa.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${MYCOPA_API_TOKEN}"
      }
    }
  }
}
```

### Claude Code

`~/.config/claude-code/mcp.json`:

```json
{
  "mcpServers": {
    "mycopa-remote": {
      "transport": "http",
      "url": "https://mycopa.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${MYCOPA_API_TOKEN}"
      }
    }
  }
}
```

## Security Considerations

### Authentication Strategy

**Use Bearer Tokens When:**
- Service provides API keys or personal access tokens
- Single-user deployment (personal MCP)
- Service doesn't support OAuth

**Use Full OAuth 2.1 When:**
- Multi-user deployment required
- User-scoped permissions needed
- Service provides OAuth endpoints
- Token refresh required for long sessions

### Best Practices

1. **Startup Validation**: Token verified on container startup
2. **Secure Storage**: Tokens in `.env` (never committed)
3. **Error Handling**: Errors logged server-side, generic to clients
4. **Audit Trail**: All auth attempts logged with timestamp/IP
5. **Rate Limiting**: 10 requests/min per IP on auth endpoints
6. **Token Rotation**: Rotate quarterly (manual or automated)

### Monitoring

Check logs for auth events:

```bash
ssh tools-droplet-agents
docker logs mycopa-mcp-gateway --follow

# Filter auth events
docker logs mycopa-mcp-gateway | grep AUTH
```

## OAuth 2.1 Upgrade Path

To add full OAuth 2.1 support later:

1. Implement `/oauth/authorize` endpoint
2. Implement `/oauth/callback` endpoint
3. Add token refresh mechanism
4. Use MCP SDK `mcpAuthRouter()` for authorization
5. Update client configs with OAuth URLs

See `/docs/architecture/integrations/mcp/auth_strategies_v01.md` for full upgrade guide.

## Troubleshooting

**Connection refused**
- Verify docker container is running: `docker ps | grep mcp-gateway`
- Check health: `curl http://localhost:8080/health`
- Check logs: `docker logs mycopa-mcp-gateway`

**Authorization failed**
- Verify token format: `echo $MYCOPA_API_TOKEN`
- Check token is current (might be expired)
- Verify header format: `Authorization: Bearer <token>`
- Check logs: `docker logs mycopa-mcp-gateway | grep AUTH`

**OAuth discovery not found**
- Verify endpoint: `curl https://mycopa.bestviable.com/.well-known/oauth-authorization-server`
- Check SSL certificate: `curl -v https://mycopa.bestviable.com/.well-known/oauth-authorization-server`

## Development

### Local Testing

```bash
cd integrations/mcp/servers/mycopa/gateway

# Install dependencies
pnpm install

# Build
pnpm build

# Start (requires stdio MCP available)
PORT=3000 SERVICE_NAME=mycopa node dist/server.js

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/.well-known/oauth-authorization-server
```

### Using MCP Inspector

Test the wrapped stdio MCP server locally:

```bash
# In separate terminal, start your stdio MCP
cd integrations/mcp/servers/mycopa/mcp-server
node dist/index.js

# In another terminal, run MCP Inspector
npx @modelcontextprotocol/inspector@latest

# Connect to localhost:3000 (or your gateway port)
```

## Files

```
gateway-template/
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── Dockerfile                  # Container image
├── README.md                   # This file
└── src/
    ├── server.ts              # Main HTTP server
    ├── auth/
    │   └── oauth-discovery.ts # RFC 8414 metadata
    ├── middleware/
    │   ├── token-validation.ts # Bearer token validation
    │   └── rate-limit.ts      # Rate limiting
    └── utils/
        └── audit-logger.ts    # Audit logging
```

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [OAuth 2.0 RFC 8414](https://tools.ietf.org/html/rfc8414)
- [Streamable HTTP Transport](https://modelcontextprotocol.io/docs/server)
- [Security Best Practices](../../../docs/architecture/integrations/mcp/auth_strategies_v01.md)
