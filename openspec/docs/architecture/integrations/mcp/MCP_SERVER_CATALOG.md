# MCP Server Catalog

This document catalogs all Model Context Protocol (MCP) servers deployed in the infrastructure, their authentication mechanisms, health status, and operational details.

**Updated**: 2025-11-12 (Post-user-hierarchy-refactor)
**Note**: All paths updated from `/infra/mcp-servers/` to `/home/david/services/mcp-servers/`. Network names updated from `n8n_*` to `docker_*` pattern.

## Service Overview

| Server | Status | Port | Authentication | Health | Issues |
|--------|--------|------|----------------|--------|--------|
| Coda MCP | ✅ Running | 8080 | Cloudflare Access JWT + Bearer Token + PostgreSQL Token Storage | ✅ Healthy | None |
| Archon MCP | ✅ Running | 8051 | Bearer Token | ✅ Healthy | None |

## Coda MCP Server

**Service Name**: `coda-mcp`
**Container**: `coda-mcp`
**Image**: coda-mcp:v1.0.12 (built from `portfolio/integrations/mcp/servers/coda/Dockerfile`)
**Location**: `/home/david/services/mcp-servers/`
**Networks**: `docker_proxy` (external), `docker_syncbricks` (internal)
**Authentication Package**: `@bestviable/mcp-auth-middleware`

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

**Status**: ✅ CONFIGURED - Token is now set in `/home/david/services/docker/.env`

**Token Source**: https://coda.io/account/settings/api (personal access tokens)

**Verification**:
```bash
# Verify token is loaded
docker exec coda-mcp env | grep CODA_API_TOKEN

# Test API access
curl -H "Authorization: Bearer $(docker exec coda-mcp env | grep CODA_API_TOKEN)" \
  https://coda.io/apis/v1/whoami
```

### Deployment Configuration

**Docker Compose**: `/home/david/services/mcp-servers/docker-compose.yml`

```yaml
# Updated network references (post-migration)
networks:
  docker_proxy:          # External network for reverse proxy
    external: true
  docker_syncbricks:     # Internal network for backend services
    external: true

environment:
  - CODA_API_TOKEN=${CODA_API_TOKEN}  # Required: Coda API token ✅ Configured
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
cd ~/services/mcp-servers && docker-compose restart
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

1. **Coda MCP Authentication Failure (401)** - RESOLVED ✅
   - **Previous Root Cause**: Missing `CODA_API_TOKEN` environment variable
   - **Current Status**: ✅ CODA_API_TOKEN configured in `/home/david/services/docker/.env`
   - **Impact**: None - MCP server can access Coda API successfully
   - **Reference**: See SERVICE_INVENTORY.md Coda MCP section for current status
   - **Priority**: Resolved

### Monitoring Status

- **Coda MCP**: ✅ Healthy container with functional API access (token configured)
- **Archon MCP**: Optional service - not currently deployed
- **Network Connectivity**: Coda MCP accessible via Cloudflare Tunnel and nginx-proxy

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