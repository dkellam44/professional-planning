# MCP Server Catalog

This document catalogs all Model Context Protocol (MCP) servers deployed in the infrastructure, their authentication mechanisms, health status, and operational details.

## Service Overview

| Server | Status | Port | Authentication | Health | Issues |
|--------|--------|------|----------------|--------|--------|
| Coda MCP | ✅ Running | 8080 | Cloudflare Access JWT + Bearer Token + PostgreSQL Token Storage | ✅ Healthy | None |
| Archon MCP | ✅ Running | 8051 | Bearer Token | ✅ Healthy | None |

## Coda MCP Server

**Service Name**: `coda-mcp`
**Container**: `coda-mcp`
**Image**: Built from [`integrations/mcp/servers/coda/Dockerfile`](integrations/mcp/servers/coda/Dockerfile:1)
**Networks**: `n8n_proxy` (external), `mcp-servers-internal` (internal)
**Authentication Package**: [`@bestviable/mcp-auth-middleware`](integrations/npm-packages/mcp-auth-middleware/README.md:1)

### Authentication Implementation

The Coda MCP server implements a comprehensive authentication system using the `@bestviable/mcp-auth-middleware` package, supporting Cloudflare Access JWT validation, Bearer token fallback, and PostgreSQL token storage for enhanced security and audit capabilities.

#### Cloudflare Access JWT Authentication

**Primary authentication method for production deployments.**

- **JWT Header**: `cf-access-jwt-assertion`
- **Validation Endpoint**: Cloudflare Access public keys
- **Team Domain**: `bestviable.cloudflareaccess.com`
- **Audience**: `bestviable`

**Implementation**: [`src/middleware/cloudflare-access-auth.ts`](integrations/mcp/servers/coda/src/middleware/cloudflare-access-auth.ts:1)

```typescript
// JWT validation configuration
{
  audience: config.cloudflareAccessAud,        // "bestviable"
  issuer: `https://${config.cloudflareAccessTeamDomain}`, // "bestviable.cloudflareaccess.com"
  algorithms: ['RS256']
}
```

#### Bearer Token Authentication

**Development fallback authentication method.**

- **Header**: `Authorization: Bearer <token>`
- **Configuration**: `BEARER_TOKEN` environment variable
- **Mode**: Activated when `AUTH_MODE=bearer` or `AUTH_MODE=both`

**Environment Configuration**:
```bash
AUTH_MODE=both                    # Options: cloudflare, bearer, both
BEARER_TOKEN=your_dev_token_here  # Optional for development
```

### Coda API Integration

**API Base URL**: `https://coda.io/apis/v1`  
**Authentication**: Bearer token via `CODA_API_TOKEN` environment variable

**Current Issue**: The server is missing the `CODA_API_TOKEN` environment variable, causing 401 authentication errors when attempting to call Coda API endpoints.

**Required Fix**: Add valid Coda API token to the deployment environment:
```bash
# In infra/mcp-servers/.env
CODA_API_TOKEN=your_coda_api_token_here
```

**Token Source**: https://coda.io/account/settings/api

### Deployment Configuration

**Docker Compose**: [`infra/mcp-servers/docker-compose.yml`](infra/mcp-servers/docker-compose.yml:1)

```yaml
environment:
  - CODA_API_TOKEN=${CODA_API_TOKEN}  # Required: Coda API token
  - AUTH_MODE=both                    # Dual authentication mode
  - CLOUDFLARE_ACCESS_TEAM_DOMAIN=bestviable.cloudflareaccess.com
  - CLOUDFLARE_ACCESS_AUD=bestviable
labels:
  - "com.nginx-proxy.virtual-host=coda.bestviable.com"
  - "com.nginx-proxy.port=8080"
  - "com.nginx-proxy.health-check.path=/health"
```

**Health Check**: HTTP GET to `/health` endpoint every 30 seconds

### Network Architecture

**External Access**: Via Cloudflare Tunnel → nginx-proxy → coda-mcp  
**Internal Network**: `mcp-servers-internal` for service-to-service communication  
**SSL/TLS**: Automatic via Let's Encrypt with nginx-proxy

### Endpoints

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/health` | GET | ❌ No | Health check with auth status |
| `/status` | GET | ❌ No | Lightweight status check |
| `/mcp` | POST | ✅ Yes | MCP protocol endpoint |

### Error Handling

**401 Unauthorized**: Missing or invalid authentication  
**403 Forbidden**: Valid auth but insufficient permissions  
**503 Service Unavailable**: Coda API or token storage issues  
**500 Internal Server Error**: Unexpected server errors

### Logging

Authentication events are logged with appropriate log levels:
```
[INFO] Cloudflare Access JWT validated for: user@example.com
[WARN] Cloudflare Access JWT validation failed: JWT expired
[DEBUG] Bearer token authenticated for: developer@localhost
[ERROR] MCP request failed: Coda API error
```

## Archon MCP Server

**Service Name**: `archon-mcp`  
**Container**: `archon-mcp`  
**Port**: 8051  
**Authentication**: Bearer Token  
**Health**: ✅ Healthy  
**Status**: Fully operational

## Operational Procedures

### Health Check Commands

```bash
# Check Coda MCP health
curl http://localhost:8080/health

# Check with Bearer token (development)
curl -H "Authorization: Bearer your_token" http://localhost:8080/health

# Check Archon MCP health
curl http://localhost:8051/health
```

### Service Restart

```bash
# Restart Coda MCP
docker restart coda-mcp

# Restart all MCP servers
cd infra/mcp-servers && docker-compose restart
```

### Log Access

```bash
# View Coda MCP logs
docker logs coda-mcp -f

# View Archon MCP logs
docker logs archon-mcp -f
```

## Known Issues

### Critical Issues

1. **Coda MCP Authentication Failure (401)**
   - **Root Cause**: Missing `CODA_API_TOKEN` environment variable
   - **Impact**: MCP server cannot access Coda API
   - **Fix**: Add valid Coda API token to `infra/mcp-servers/.env`
   - **Priority**: High - Blocks Coda MCP functionality

### Monitoring Status

- **Coda MCP**: Healthy container, but API calls fail due to missing token
- **Archon MCP**: Healthy and fully operational
- **Network Connectivity**: Both services accessible via Cloudflare Tunnel

## Security Considerations

- **Token Storage**: Environment variables (visible via `docker inspect`)
- **Network Isolation**: Services isolated on internal network
- **Access Control**: Cloudflare Access provides user authentication
- **SSL/TLS**: Automatic certificate management via Let's Encrypt

## Related Documentation

- [Coda MCP Server README](integrations/mcp/servers/coda/README.md:1)
- [MCP OAuth Strategy & SOP](../../../../changes/implement-mcp-oauth-strategy-and-sop/proposal.md:1)
- [Infrastructure Service Inventory](../../../../docs/infrastructure/SERVICE_INVENTORY.md:1)
- [Health Check Procedures](../../../../docs/infrastructure/HEALTH_CHECK_PROCEDURES.md:1)

---

**Last Updated**: 2025-11-09  
**Infrastructure Version**: Post-4GB upgrade  
**Next Review**: After MCP OAuth implementation completion