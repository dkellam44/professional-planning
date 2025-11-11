# Service Inventory

Complete inventory of all Docker containers running in the infrastructure post-4GB droplet upgrade. This document provides operational details, health status, and maintenance information for all services.

## Infrastructure Overview

**Droplet Specifications**: 4GB RAM, 80GB SSD, 2 vCPUs  
**Total Services**: 14 containers  
**Memory Utilization**: 3.1GB / 3.8GB (81%)  
**Storage Utilization**: 37GB / 77GB (48%)  
**Deployment Pattern**: SyncBricks (nginx-proxy + Cloudflare Tunnel)

## Service Status Summary

| Status Count | Services |
|--------------|----------|
| ✅ **Healthy (8)** | postgres, archon-server, archon-mcp, archon-ui, coda-mcp, openweb, infisical-db, infisical-redis |
| ❌ **Unhealthy (3)** | qdrant, infisical, dozzle |
| ⚠️ **Restarting (1)** | uptime-kuma |
| ✅ **Running (2)** | nginx-proxy, nginx-proxy-acme, cloudflared, n8n |

## Core Infrastructure Services

### 1. nginx-proxy
**Container**: `nginx-proxy`  
**Image**: `nginxproxy/nginx-proxy:latest`  
**Ports**: 80, 443  
**Networks**: `n8n_proxy` (external)  
**Status**: ✅ Running  
**Health**: N/A (no health check configured)  
**Purpose**: Reverse proxy with automatic service discovery via Docker labels

**Key Features**:
- Automatic SSL/TLS via Let's Encrypt integration
- Service discovery via container labels
- Load balancing and routing
- WebSocket support

**Docker Labels**:
```yaml
com.nginx-proxy.virtual-host: "service.domain.com"
com.nginx-proxy.port: "8080"
com.nginx-proxy.scheme: "http"
```

---

### 2. nginx-proxy-acme
**Container**: `nginx-proxy-acme`  
**Image**: `nginxproxy/acme-companion:latest`  
**Ports**: None  
**Networks**: `n8n_proxy` (external)  
**Status**: ✅ Running  
**Health**: N/A  
**Purpose**: Automatic SSL certificate management for nginx-proxy

**Function**: Automatically obtains and renews Let's Encrypt certificates for all proxied services.

---

### 3. cloudflared
**Container**: `cloudflared`  
**Image**: `cloudflare/cloudflared:latest`  
**Ports**: None  
**Networks**: `n8n_proxy` (external)  
**Status**: ✅ Running  
**Health**: N/A  
**Purpose**: Cloudflare Tunnel for zero-IP-exposure architecture

**Configuration**: Connects to Cloudflare edge network, providing secure tunnel without exposing server IP.

---

## Application Services

### 4. n8n
**Container**: `n8n`  
**Image**: `n8nio/n8n:latest`  
**Port**: 5678  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: N/A  
**Purpose**: Workflow automation platform

**Access**: https://n8n.bestviable.com  
**Dependencies**: postgres database  
**Resource Usage**: ~200MB RAM

---

### 5. postgres
**Container**: `postgres`  
**Image**: `postgres:15-alpine`  
**Port**: 5432  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ✅ Healthy  
**Purpose**: Primary database for n8n and other services

**Health Check**: PostgreSQL connection test every 30s  
**Data Volume**: Persistent storage for workflows and credentials  
**Resource Usage**: ~150MB RAM

---

### 6. qdrant
**Container**: `qdrant/qdrant:latest`  
**Port**: 6333  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ❌ Unhealthy  
**Purpose**: Vector database for AI/ML applications

**Health Issue**: Health check failing - requires investigation  
**Impact**: May affect vector search and RAG functionality  
**Resource Usage**: ~100MB RAM

---

## Archon Services

### 7. archon-server
**Container**: `archon-server`  
**Image**: Custom build  
**Port**: 8181  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ✅ Healthy  
**Purpose**: Core Archon application server

**Health Check**: HTTP endpoint validation  
**Dependencies**: postgres, qdrant  
**Resource Usage**: ~300MB RAM

---

### 8. archon-mcp
**Container**: `archon-mcp`  
**Image**: Custom build  
**Port**: 8051  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ✅ Healthy  
**Purpose**: Model Context Protocol server for Archon

**Health Check**: HTTP endpoint validation  
**Authentication**: Bearer token  
**Resource Usage**: ~200MB RAM

---

### 9. archon-ui
**Container**: `archon-ui`  
**Image**: Custom build  
**Port**: 3737  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ✅ Healthy  
**Purpose**: Archon web user interface

**Health Check**: HTTP endpoint validation  
**Dependencies**: archon-server  
**Resource Usage**: ~150MB RAM

---

## MCP Services

### 10. coda-mcp
**Container**: `coda-mcp`  
**Image**: Custom build  
**Port**: 8080  
**Networks**: `n8n_proxy` (external), `mcp-servers-internal` (internal)  
**Status**: ✅ Running  
**Health**: ✅ Healthy  
**Purpose**: Coda API Model Context Protocol server

**Authentication**: Cloudflare Access JWT + Bearer token  
**Current Issue**: Missing `CODA_API_TOKEN` environment variable  
**Access**: https://coda.bestviable.com  
**Resource Usage**: ~150MB RAM

**See Also**: [MCP Server Catalog](../architecture/integrations/mcp/MCP_SERVER_CATALOG.md:1)

---

### 11. openweb
**Container**: `openweb`  
**Image**: Custom build  
**Port**: 8080  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ✅ Healthy  
**Purpose**: OpenWeb UI service (currently disabled)

**Status**: Container running but service disabled  
**Resource Usage**: ~100MB RAM

---

## Infrastructure Management Services

### 12. infisical
**Container**: `infisical`  
**Image**: `infisical/infisical:latest`  
**Port**: 3000  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ❌ Unhealthy  
**Purpose**: Secrets management platform

**Health Issue**: Container health check failing  
**Dependencies**: infisical-db, infisical-redis  
**Impact**: Secrets management unreliable  
**Resource Usage**: ~200MB RAM

---

### 13. infisical-db
**Container**: `infisical-db`  
**Image**: `postgres:14-alpine`  
**Port**: 5432  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ✅ Healthy  
**Purpose**: Database for Infisical secrets management

**Health Check**: PostgreSQL connection test  
**Data**: Persistent secrets storage  
**Resource Usage**: ~100MB RAM

---

### 14. infisical-redis
**Container**: `infisical-redis`  
**Image**: `redis:7-alpine`  
**Port**: 6379  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: N/A  
**Purpose**: Redis cache for Infisical

**Resource Usage**: ~50MB RAM

---

## Monitoring & Logging Services

### 15. dozzle
**Container**: `dozzle`  
**Image**: `amir20/dozzle:latest`  
**Port**: 9999  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ✅ Running  
**Health**: ❌ Unhealthy  
**Purpose**: Real-time Docker log viewer

**Health Issue**: Health check configuration problem  
**Access**: Internal only (port 9999)  
**Resource Usage**: ~100MB RAM

---

### 16. uptime-kuma
**Container**: `uptime-kuma`  
**Image**: `louislam/uptime-kuma:latest`  
**Port**: None (restarting)  
**Networks**: `n8n_syncbricks` (internal)  
**Status**: ❌ Restarting  
**Health**: N/A  
**Purpose**: Uptime monitoring and alerting

**Issue**: Exit 137 (likely memory pressure)  
**Impact**: No uptime monitoring available  
**Resource Usage**: Variable (causing restarts)

---

## Network Architecture

### External Network: `n8n_proxy`
Services accessible via Cloudflare Tunnel:
- nginx-proxy (ports 80, 443)
- cloudflared
- coda-mcp (port 8080)

### Internal Network: `n8n_syncbricks`
Backend services isolated from external access:
- n8n, postgres, qdrant
- archon-server, archon-mcp, archon-ui
- openweb, infisical, infisical-db, infisical-redis
- dozzle, uptime-kuma

### MCP Network: `mcp-servers-internal`
Dedicated network for MCP server communication:
- coda-mcp

## Resource Allocation

### Memory Usage Breakdown (3.1GB total)

| Category | Usage | Services |
|----------|--------|----------|
| **Core Infrastructure** | ~500MB | nginx-proxy, nginx-proxy-acme, cloudflared |
| **Application Services** | ~800MB | n8n, postgres |
| **Archon Stack** | ~650MB | archon-server, archon-mcp, archon-ui |
| **MCP Services** | ~250MB | coda-mcp, openweb |
| **Infisical Stack** | ~350MB | infisical, infisical-db, infisical-redis |
| **Monitoring** | ~200MB | dozzle, uptime-kuma |
| **Other** | ~350MB | qdrant, buffer/cache |

### Storage Usage Breakdown (37GB total)

| Category | Usage | Description |
|----------|--------|-------------|
| **Docker System** | ~5GB | Images, containers, volumes |
| **Container Data** | ~25GB | Database files, application data |
| **Application Code** | ~2GB | Source code and builds |
| **Logs/Temp** | ~5GB | Log files and temporary data |

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

### Critical Issues (Immediate Attention)

1. **Coda MCP Authentication Failure**
   - **Status**: Missing `CODA_API_TOKEN` environment variable
   - **Impact**: MCP server returns 401 errors
   - **Fix**: Add valid Coda API token to deployment

2. **Uptime-Kuma Restart Loop**
   - **Status**: Exit 137 (memory pressure)
   - **Impact**: No uptime monitoring
   - **Fix**: Increase memory limits or disable service

### Medium Priority Issues

3. **Infisical Unhealthy**
   - **Status**: Health check failing
   - **Impact**: Unreliable secrets management
   - **Fix**: Investigate health check configuration

4. **Qdrant Unhealthy**
   - **Status**: Vector database health check failing
   - **Impact**: May affect AI/ML functionality
   - **Fix**: Check database connectivity

5. **Dozzle Unhealthy**
   - **Status**: Log viewer health check failing
   - **Impact**: Limited log visibility
   - **Fix**: Review container configuration

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
docker network inspect n8n_proxy
docker network inspect n8n_syncbricks

# Test service connectivity
docker exec <container> ping <target_service>
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

**Last Updated**: 2025-11-09  
**Infrastructure Version**: Post-4GB upgrade  
**Next Review**: Monthly or after major changes