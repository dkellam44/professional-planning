# Service Inventory

Complete inventory of all Docker containers running in the infrastructure post-Traefik migration and droplet cleanup (2025-11-14). This document provides operational details, health status, and maintenance information for all services.

**Last Updated**: 2025-11-14 (Traefik migration, deprecated nginx-proxy + acme-companion)

## Infrastructure Overview

**Droplet Specifications**: 4GB RAM, 80GB SSD, 2 vCPUs (upgraded from 2GB on 2025-11-06)
**Reverse Proxy**: Traefik v3.0 (deployed 2025-11-13, replacing nginx-proxy)
**Total Services**: 12 containers (3 deprecated: stopped, not removed)
**Memory Utilization**: ~3.3GB / 3.8GB (87%) - approaching orange threshold
**Storage Utilization**: 49GB / 77GB (63%)
**Deployment Pattern**: Traefik + Cloudflare Tunnel (HTTP-only, CF terminates SSL)
**User Structure**: Non-root user `david` with sudo access
**Primary Path**: `/home/david/services/` (migrated from `/root/infra/` on 2025-11-12)

## Service Status Summary

| Status Count | Services |
|--------------|----------|
| ✅ **Healthy (9)** | traefik, postgres, qdrant, n8n, coda-mcp, openweb, dozzle, uptime-kuma, cloudflared |
| ✅ **Healthy (3)** | archon-server, archon-ui, archon-mcp |
| ⚠️ **Unhealthy (1)** | traefik (healthcheck failing but traffic routing works) |
| ❌ **Exited (2)** | nginx-proxy (deprecated 2025-11-13), acme-companion (deprecated 2025-11-13) |

## Core Infrastructure Services

### 1. Traefik (PRIMARY REVERSE PROXY)
**Container**: `traefik`
**Image**: `traefik:v3.0.0`
**Ports**: 80 (HTTP), 443 (HTTPS - listener only, unused)
**Networks**: `docker_proxy` (external), `docker_syncbricks` (internal discovery)
**Status**: ✅ Running (healthcheck: ⚠️ unhealthy but routing works)
**Purpose**: Modern reverse proxy with auto-discovery via Docker labels
**Location**: `/home/david/services/traefik/`
**Deployed**: 2025-11-13 (replaced nginx-proxy)

**Key Features**:
- Automatic service discovery via Docker labels
- HTTP-only routing (port 80) - SSL/TLS handled by Cloudflare
- Zero-downtime reloads (no container restarts needed)
- Built-in dashboard (port 8080, localhost-only)
- No Let's Encrypt integration (Cloudflare handles SSL)

**Configuration**:
- Static config: `/home/david/services/traefik/traefik.yml`
- Docker provider enabled for auto-discovery
- Network alias: `nginx-proxy` (for Cloudflare Tunnel compatibility)

**Service Discovery Labels** (new format, replacing VIRTUAL_HOST):
```yaml
traefik.enable: "true"
traefik.http.routers.SERVICE.rule: "Host(`domain.bestviable.com`)"
traefik.http.routers.SERVICE.entrypoints: "web"
traefik.http.services.SERVICE.loadbalancer.server.port: "8080"
```

---

### 2. nginx-proxy (DEPRECATED - Exited)
**⚠️ STATUS**: EXITED (Removed 2025-11-13, replaced by Traefik)
**Purpose**: Legacy reverse proxy (archived, no longer used)
**Replacement**: See Traefik section above

---

### 3. acme-companion (DEPRECATED - Exited)
**⚠️ STATUS**: EXITED (Removed 2025-11-13, replaced by Traefik ACME)
**Purpose**: Legacy SSL management (archived, no longer used)
**Replacement**: Cloudflare Zero Trust terminates SSL (no Let's Encrypt needed)

---

### 4. cloudflared
**Container**: `cloudflared`
**Image**: `cloudflare/cloudflared:latest`
**Ports**: None
**Networks**: `docker_proxy` (external)
**Status**: ✅ Running
**Health**: N/A (no health check configured)
**Purpose**: Cloudflare Tunnel for zero-IP-exposure architecture
**Resource Usage**: ~50MB RAM

**Configuration**: Connects to Cloudflare edge network via token-based authentication
**Tunnel Status**: 4 active QUIC connections (SJC & regional fallbacks)
**Ingress Routes**: All domains (n8n, coda, openweb, logs, kuma, github, memory, firecrawl, archon, infisical) route through nginx-proxy:80

---

## Application Services

### 4. n8n
**Container**: `n8n`
**Image**: `n8nio/n8n:latest`
**Port**: 5678
**Networks**: `docker_proxy`, `docker_syncbricks` (internal + external via proxy)
**Status**: ✅ Healthy
**Health**: ✅ Healthy (HTTP/2 200 at health endpoint)
**Purpose**: Workflow automation platform
**Location**: `/home/david/services/docker/`

**Access**: https://n8n.bestviable.com
**Dependencies**: postgres database
**Resource Usage**: ~200MB RAM
**Configuration**: Stored in n8n Docker volume (apps_n8n_storage)
**Admin Credentials**: Stored in .env file (N8N_ADMIN_EMAIL, N8N_ADMIN_PASSWORD)

---

### 5. postgres
**Container**: `postgres`
**Image**: `postgres:15-alpine`
**Port**: 5432
**Networks**: `docker_syncbricks` (internal only)
**Status**: ✅ Healthy
**Health**: ✅ Healthy (connection test every 30s)
**Purpose**: Primary database for n8n and other services
**Location**: `/home/david/services/docker/`

**Health Check**: PostgreSQL connection test (pg_isready) every 30s
**Data Volume**: n8n_postgres_storage (persistent)
**Database**: n8n (created with migrations)
**Credentials**: POSTGRES_PASSWORD in .env file
**Resource Usage**: ~150MB RAM

---

### 6. qdrant
**Container**: `qdrant`
**Image**: `qdrant/qdrant:latest`
**Port**: 6333-6334
**Networks**: `docker_syncbricks` (internal only)
**Status**: ✅ Healthy
**Health**: ✅ Healthy (REST API check every 30s)
**Purpose**: Vector database for AI/ML applications & RAG search
**Location**: `/home/david/services/docker/`

**Data Volume**: n8n_qdrant_storage (persistent)
**Health Check**: HTTP GET to /health endpoint
**API Key**: QDRANT_API_KEY in .env file
**Resource Usage**: ~100MB RAM

---

## MCP Services

### 7. coda-mcp
**Container**: `coda-mcp`
**Image**: coda-mcp:v1.0.12 (custom build)
**Port**: 8080
**Networks**: `docker_proxy` (external), `docker_syncbricks` (internal)
**Status**: ✅ Healthy
**Health**: ✅ Healthy (health check every 30s)
**Purpose**: Coda API Model Context Protocol server
**Location**: `/home/david/services/mcp-servers/`

**Authentication**: Cloudflare Access JWT + Bearer token fallback
**API Token**: CODA_API_TOKEN in .env file ✅ Configured
**Access**: https://coda.bestviable.com (HTTP/2 301 redirect to login)
**Resource Usage**: ~150MB RAM

**See Also**: [MCP Server Catalog](../architecture/integrations/mcp/MCP_SERVER_CATALOG.md:1)

---

## Application Services (Monitoring & Chat)

### 8. openweb
**Container**: `openweb`
**Image**: ghcr.io/open-webui/open-webui:0.5.0
**Port**: 8080
**Networks**: `docker_proxy` (external), `docker_syncbricks` (internal)
**Status**: ✅ Healthy
**Health**: ✅ Healthy (health check every 60s)
**Purpose**: Chat interface with LLM integration (OpenRouter)
**Location**: `/home/david/services/apps/`

**Configuration**: OpenRouter API integration for multi-model access
**Data**: Restored from backup (webui.db, cache, vector_db)
**Volume**: apps_openweb_data (persistent, ~977MB restored)
**Access**: https://openweb.bestviable.com (HTTP/2 301 redirect to login)
**API Key**: OPENROUTER_API_KEY in .env file
**Resource Usage**: ~600MB RAM
**Notes**: Database and settings restored from Nov 5, 2025 backup

---

### 9. dozzle
**Container**: `dozzle`
**Image**: amir20/dozzle:latest
**Port**: 9999 (internal only)
**Networks**: `docker_proxy` (external via Cloudflare)
**Status**: ✅ Healthy
**Health**: ✅ Healthy (health check every 30s)
**Purpose**: Real-time Docker container log viewer
**Location**: `/home/david/services/apps/`

**Access**: https://logs.bestviable.com (HTTP/2 301 redirect to login)
**Features**: Live log streaming, container inspection, filter & search
**Resource Usage**: ~50MB RAM
**Volumes**: /var/run/docker.sock mounted for Docker access

---

### 10. uptime-kuma
**Container**: `uptime-kuma`
**Image**: louislam/uptime-kuma:1
**Port**: 3001
**Networks**: `docker_proxy` (external)
**Status**: ✅ Healthy
**Health**: ✅ Healthy (Node.js health check every 30s)
**Purpose**: Uptime monitoring and status page
**Location**: `/home/david/services/apps/`

**Access**: https://kuma.bestviable.com (HTTP/2 301 redirect to setup/login)
**Volume**: apps_kuma_data (persistent, lightweight)
**Features**: Service health monitoring, status page, alerts/notifications
**Resource Usage**: ~256MB RAM (increased from 100MB post-migration)
**Notes**: Fully operational, ready for monitor configuration

---

## Network Architecture

### External Network: `docker_proxy` (172.20.0.0/16)
Services accessible via Cloudflare Tunnel and nginx-proxy:
- **nginx-proxy** (ports 80, 443) - reverse proxy ingress
- **cloudflared** - Cloudflare tunnel endpoint
- **n8n** - external via nginx-proxy VIRTUAL_HOST label
- **coda-mcp** - external via nginx-proxy VIRTUAL_HOST label
- **openweb** - external via nginx-proxy VIRTUAL_HOST label
- **dozzle** - external via nginx-proxy VIRTUAL_HOST label (logs.bestviable.com)
- **uptime-kuma** - external via nginx-proxy VIRTUAL_HOST label (kuma.bestviable.com)

### Internal Network: `docker_syncbricks` (172.21.0.0/16)
Backend services isolated from direct external access (only via nginx-proxy):
- **postgres** - database for n8n
- **qdrant** - vector database
- **n8n** - automation workflows
- **coda-mcp** - MCP server backend
- **openweb** - chat interface backend
- **acme-companion** - SSL certificate management (also on docker_proxy)

**Isolation**: Services on this network cannot be directly accessed from the internet; all external traffic routes through nginx-proxy on docker_proxy network.

## Resource Allocation

### Memory Usage Breakdown (~1.8GB / 3.8GB = 48%)

| Category | Usage | Services |
|----------|-------|----------|
| **Core Infrastructure** | ~150MB | nginx-proxy, acme-companion, cloudflared |
| **Database & Search** | ~250MB | postgres (~150MB), qdrant (~100MB) |
| **Automation** | ~200MB | n8n |
| **Chat Interface** | ~600MB | openweb (restored with full DB) |
| **Monitoring & Logging** | ~300MB | dozzle (~50MB), uptime-kuma (~256MB) |
| **MCP Server** | ~150MB | coda-mcp |
| **System/Cache/Buffer** | ~150MB | Docker overhead, filesystem cache |
| **Available Headroom** | ~2.0GB | For service expansion |

### Storage Usage Breakdown (47GB / 77GB = 61%)

| Category | Usage | Description |
|----------|-------|-------------|
| **Docker Volumes** | ~12GB | n8n, postgres, qdrant, openweb, kuma data |
| **Application Code** | ~6GB | /home/david/portfolio/ |
| **Service Configs** | ~1GB | /home/david/services/ docker-compose, nginx configs |
| **Docker System** | ~5GB | Images (nginx, postgres, n8n, openweb, etc.) |
| **Logs & Temp** | ~5GB | Container logs, temp files |
| **Other/Backups** | ~18GB | Old backups, unused volumes, overhead |

**Growth Runway**: 30GB free × current growth rate = ~6-8 months before needing storage upgrade

## Health Check Procedures

### Quick Health Assessment
```bash
# Check all container statuses
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check unhealthy containers
docker ps --filter "health=unhealthy"

# Check restarting containers
docker ps --filter "status=restarting"
```

### Service-Specific Health Checks
```bash
# Test nginx-proxy
curl -I http://localhost

# Test postgres
docker exec postgres pg_isready -U postgres

# Test coda-mcp health
curl http://localhost:8080/health

# Test archon services
curl http://localhost:8051/health  # archon-mcp
curl http://localhost:8181/health  # archon-server
curl http://localhost:3737/health  # archon-ui
```

## Known Issues

### Status: All Critical Issues Resolved ✅

**Previous Issues (Fixed Post-Migration)**:
1. ✅ Coda MCP Authentication - Fixed: CODA_API_TOKEN now in .env
2. ✅ Uptime-Kuma Restart Loop - Fixed: Memory limit increased to 256MB
3. ✅ Qdrant Unhealthy - Fixed: Network migration resolved connectivity
4. ✅ Dozzle Unhealthy - Fixed: Health check configuration corrected
5. ✅ Infisical Services - Removed: Not in current deployment (optional)

### Current Notes (Non-Critical)

1. **Optional Services Not Deployed**:
   - Archon stack (archon-server, archon-mcp, archon-ui) - Optional advanced features
   - Infisical stack (infisical, infisical-db, infisical-redis) - Optional secrets management
   - **Status**: Can be deployed if needed in future phases
   - **Action**: Monitor if needed, deploy when required

2. **Openweb Data Age**:
   - **Status**: Database restored from Nov 5, 2025 backup
   - **Impact**: Minor - chat history preserved, but 1 week old
   - **Resolution**: Data updates continuously as service is used
   - **Action**: None required (operational)

## Operational Commands

### Service Management
```bash
# Restart individual service
docker restart <container_name>

# View service logs
docker logs <container_name> -f

# Check resource usage
docker stats <container_name>

# Access container shell
docker exec -it <container_name> /bin/sh
```

### Network Troubleshooting
```bash
# Test network connectivity
docker network ls
docker network inspect docker_proxy
docker network inspect docker_syncbricks

# Test service connectivity
docker exec <container> ping <target_service>

# List all container IPs on a network
docker network inspect docker_proxy --format='{{json .Containers}}' | jq .
```

### Service Location & Access
```bash
# SSH into droplet
ssh droplet

# Navigate to services
cd ~/services/docker/          # Core services (nginx, postgres, n8n, etc.)
cd ~/services/apps/            # App services (openweb, dozzle, kuma)
cd ~/services/mcp-servers/     # MCP services (coda-mcp)

# View logs
docker-compose -f ~/services/docker/docker-compose.production.yml logs -f <service>
```

## Maintenance Schedule

### Daily
- Monitor container health status
- Check for service restarts
- Verify resource utilization

### Weekly
- Review log files for errors
- Update service documentation
- Check for security updates

### Monthly
- Analyze resource usage trends
- Review and update health checks
- Plan capacity upgrades

---

**Last Updated**: 2025-11-12
**Infrastructure Version**: Post-user-hierarchy-refactor + OpenWebUI deployment
**Key Changes**: User migration to `david` user, all services moved to `/home/david/services/`, 10 core services running, openweb/dozzle/uptime-kuma deployed
**Next Review**: After optional services testing (this week) or monthly