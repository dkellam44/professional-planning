# Change: Migrate from nginx-proxy to Traefik

**Status**: COMPLETED
**Date**: 2025-11-12
**Impact**: Infrastructure-wide reverse proxy migration

## Why

The current nginx-proxy stack (nginx-proxy + docker-gen + acme-companion) exhibited configuration generation bugs causing service routing failures, particularly a 301 redirect loop for Coda MCP. This migration to Traefik eliminates:

1. **Configuration Complexity** - docker-gen template bugs causing routing issues
2. **Manual Restart Requirements** - nginx-proxy required restarts for config changes
3. **Multi-Container Overhead** - 3 containers (nginx, docker-gen, acme-companion) for one function
4. **Difficult Debugging** - Opaque configuration generation made troubleshooting time-consuming

## What Changes

### Infrastructure
- ✅ Replaced nginx-proxy + docker-gen + acme-companion with single Traefik container
- ✅ Traefik configured for HTTP-only routing (Cloudflare Tunnel terminates SSL)
- ✅ Added `nginx-proxy` network alias to Traefik for Cloudflare Tunnel compatibility
- ✅ Updated all service labels from nginx-proxy format to Traefik format

### Service Configuration
- ✅ Converted VIRTUAL_HOST/VIRTUAL_PORT env vars to Traefik labels
- ✅ Configured all services for `web` entrypoint (port 80, HTTP-only)
- ✅ Removed TLS configuration (handled by Cloudflare)
- ✅ Services: coda-mcp, openweb, uptime-kuma, dozzle, archon-server, archon-mcp, archon-ui

### Routing Architecture
- ✅ Cloudflare Tunnel → HTTP port 80 → Traefik → Services
- ✅ Automatic service discovery via Docker labels
- ✅ Zero-downtime service updates

## Impact

**Affected Services**: All web-accessible services on the droplet
- coda.bestviable.com (Coda MCP)
- openweb.bestviable.com (OpenWebUI)
- kuma.bestviable.com (Uptime Kuma)
- logs.bestviable.com (Dozzle)
- archon.bestviable.com (Archon UI)
- archon-mcp.bestviable.com (Archon MCP)

**Breaking Changes**: None - External URLs unchanged

**Benefits**:
- Fixed Coda MCP 301 routing issue
- Automatic service discovery (no manual config)
- Simplified architecture (1 container vs 3)
- Dashboard visibility (http://localhost:8080)
- Zero-downtime updates

**Rollback**: nginx-proxy containers kept as backup (stopped, not removed)
