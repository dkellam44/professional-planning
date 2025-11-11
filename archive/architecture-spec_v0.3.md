# Architecture Specification v0.3 - SyncBricks Deployment Pattern

**Version**: 0.3  
**Date**: 2025-11-09  
**Status**: Active  
**Pattern**: SyncBricks (nginx-proxy + Cloudflare Tunnel)

## Executive Summary

This specification documents the current infrastructure architecture following the 4GB droplet upgrade and implementation of the SyncBricks deployment pattern. The architecture enables zero-IP-exposure deployments with automatic SSL/TLS management and service discovery.

## Architecture Overview

### Core Pattern: SyncBricks
```
Internet → Cloudflare Tunnel → nginx-proxy → Docker Services
     ↓              ↓              ↓              ↓
  Zero Trust    Edge Network    Auto Discovery   Containerized
  Authentication   Proxy         SSL/TLS         Microservices
```

### Key Benefits
- ✅ **Zero IP Exposure**: No public IP addresses exposed
- ✅ **Automatic SSL/TLS**: Let's Encrypt certificates with auto-renewal
- ✅ **Service Discovery**: Automatic proxy configuration via Docker labels
- ✅ **Network Isolation**: Dual-network architecture for security
- ✅ **Scalable**: Easy service addition without manual proxy configuration

## Infrastructure Specifications

### Hardware Resources
- **Droplet**: DigitalOcean Basic (4GB RAM / 80GB SSD / 2 vCPUs)
- **Cost**: $24/month
- **Location**: NYC3 datacenter
- **OS**: Ubuntu 22.04 LTS

### Resource Utilization
- **Memory**: 3.1GB / 3.8GB (81% utilization)
- **Storage**: 37GB / 77GB (48% utilization)
- **Services**: 14 containers across 3 networks
- **Headroom**: 700MB memory available for growth

## Network Architecture

### External Network: `n8n_proxy`
**Purpose**: Handles internet-facing traffic via Cloudflare Tunnel

**Services**:
- `nginx-proxy` (ports 80, 443) - Reverse proxy with SSL termination
- `cloudflared` - Cloudflare Tunnel client
- `coda-mcp` (port 8080) - MCP server requiring external access

**Security**: Zero direct IP exposure, all traffic via Cloudflare

### Internal Network: `n8n_syncbricks`
**Purpose**: Backend service communication and isolation

**Services**:
- `n8n` - Workflow automation
- `postgres` - Primary database
- `qdrant` - Vector database
- `archon-server`, `archon-mcp`, `archon-ui` - Archon application stack
- `openweb` - OpenWeb UI service
- `infisical`, `infisical-db`, `infisical-redis` - Secrets management
- `dozzle`, `uptime-kuma` - Monitoring services

**Security**: Isolated from external network, internal communication only

### MCP Network: `mcp-servers-internal`
**Purpose**: Dedicated network for MCP server isolation

**Services**:
- `coda-mcp` - Coda API MCP server

**Security**: Additional isolation layer for MCP services

## Service Architecture

### Core Infrastructure Layer

#### nginx-proxy
**Image**: `nginxproxy/nginx-proxy:latest`  
**Function**: Reverse proxy with automatic service discovery  
**Configuration**: Docker label-based auto-configuration  
**SSL/TLS**: Automatic via acme-companion

```yaml
labels:
  - "com.nginx-proxy.virtual-host=service.domain.com"
  - "com.nginx-proxy.port=8080"
  - "com.nginx-proxy.scheme=http"
```

#### nginx-proxy-acme
**Image**: `nginxproxy/acme-companion:latest`  
**Function**: Let's Encrypt certificate automation  
**Integration**: Works with nginx-proxy for SSL management  
**Renewal**: Automatic 90-day certificate lifecycle

#### cloudflared
**Image**: `cloudflare/cloudflared:latest`  
**Function**: Cloudflare Tunnel client  
**Security**: Zero-trust network access  
**Configuration**: Authenticated tunnel to Cloudflare edge

### Application Services Layer

#### n8n + postgres
**Pattern**: Application + database pairing  
**Network**: Internal only (`n8n_syncbricks`)  
**Access**: Via nginx-proxy subdomain routing  
**Data**: Persistent volumes for state management

#### Archon Stack (3 services)
**Pattern**: Microservices architecture  
**Services**: `archon-server`, `archon-mcp`, `archon-ui`  
**Communication**: Internal network, service discovery  
**Scaling**: Individual service scaling capability

### MCP Services Layer

#### coda-mcp
**Pattern**: External-facing API service  
**Authentication**: Cloudflare Access JWT + Bearer token  
**Network**: Dual-network (external + internal)  
**Access**: https://coda.bestviable.com

## Deployment Patterns

### Pattern 1: External Service Deployment
```yaml
services:
  external-service:
    networks:
      - n8n_proxy  # External access
    labels:
      - "com.nginx-proxy.virtual-host=service.example.com"
      - "com.nginx-proxy.port=8080"
      - "com.nginx-proxy.health-check.path=/health"
```

### Pattern 2: Internal Service Deployment
```yaml
services:
  internal-service:
    networks:
      - n8n_syncbricks  # Internal only
    # No nginx-proxy labels = no external access
```

### Pattern 3: Dual-Network Service Deployment
```yaml
services:
  dual-service:
    networks:
      - n8n_proxy        # External access
      - service-internal # Internal communication
    labels:
      - "com.nginx-proxy.virtual-host=service.example.com"
```

## Security Architecture

### Network Security
- **Zero IP Exposure**: No public IPs for services
- **Network Segmentation**: External vs internal traffic isolation
- **Service Isolation**: Dedicated networks for sensitive services
- **Encrypted Communication**: SSL/TLS for all external traffic

### Authentication Architecture
- **Cloudflare Access**: JWT-based user authentication
- **Bearer Tokens**: Development and service-to-service auth
- **Network-level Security**: Internal services isolated from external access

### Certificate Management
- **Provider**: Let's Encrypt
- **Automation**: acme-companion container
- **Renewal**: Automatic 30-day advance renewal
- **Validation**: HTTP-01 challenge via nginx-proxy

## Service Discovery and Routing

### Auto-Discovery Mechanism
1. **Container Labels**: Services declare their routing configuration
2. **Docker Events**: nginx-proxy monitors container lifecycle
3. **Configuration Generation**: Automatic nginx configuration updates
4. **Hot Reload**: Zero-downtime configuration changes

### Routing Examples
```
https://n8n.bestviable.com → n8n:5678
https://coda.bestviable.com → coda-mcp:8080
https://archon.bestviable.com → archon-ui:3737
```

## Health Monitoring and Observability

### Health Check Patterns
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

### Monitoring Services
- **dozzle**: Real-time log viewing (currently unhealthy)
- **uptime-kuma**: Uptime monitoring (currently restarting)
- **Docker Health**: Built-in container health checks

## Scaling Patterns

### Horizontal Scaling
- **Service Replication**: Multiple instances behind nginx-proxy
- **Load Balancing**: Automatic via nginx upstream configuration
- **Stateless Services**: Designed for horizontal scaling

### Vertical Scaling
- **Resource Limits**: Per-service memory and CPU constraints
- **Droplet Upgrades**: Single-system vertical scaling
- **Current Headroom**: 700MB memory available

## Current Service Inventory

| Service | Status | Network | External Access | Health |
|---------|--------|---------|-----------------|--------|
| nginx-proxy | ✅ Running | External | Required | N/A |
| nginx-proxy-acme | ✅ Running | External | Required | N/A |
| cloudflared | ✅ Running | External | Required | N/A |
| n8n | ✅ Running | Internal | Via proxy | N/A |
| postgres | ✅ Running | Internal | None | ✅ Healthy |
| qdrant | ✅ Running | Internal | None | ❌ Unhealthy |
| archon-server | ✅ Running | Internal | None | ✅ Healthy |
| archon-mcp | ✅ Running | Internal | None | ✅ Healthy |
| archon-ui | ✅ Running | Internal | None | ✅ Healthy |
| coda-mcp | ✅ Running | Both | Via proxy | ✅ Healthy |
| openweb | ✅ Running | Internal | None | ✅ Healthy |
| infisical | ✅ Running | Internal | None | ❌ Unhealthy |
| infisical-db | ✅ Running | Internal | None | ✅ Healthy |
| infisical-redis | ✅ Running | Internal | None | N/A |
| dozzle | ✅ Running | Internal | None | ❌ Unhealthy |
| uptime-kuma | ❌ Restarting | Internal | None | N/A |

## Known Issues and Architecture Impact

### Service Health Issues
- **3 unhealthy services**: Impact on operational visibility
- **1 restarting service**: Uptime monitoring compromised
- **Authentication gap**: Coda MCP missing API token

### Architecture Resilience
- **Single point of failure**: nginx-proxy (mitigated by stability)
- **Resource constraints**: 81% memory utilization
- **Monitoring gaps**: Limited observability due to service issues

## Best Practices and Guidelines

### Service Deployment Guidelines
1. **Use health checks** for all services
2. **Implement proper logging** with structured formats
3. **Set resource limits** to prevent resource exhaustion
4. **Use internal networks** for backend services
5. **Implement authentication** for external-facing services

### Security Guidelines
1. **Never expose internal services** directly
2. **Use strong authentication** for all external access
3. **Implement network segmentation** by service type
4. **Regular certificate renewal** monitoring
5. **Access logging** for security audit trails

### Operational Guidelines
1. **Monitor resource usage** trends
2. **Document service dependencies**
3. **Implement graceful shutdown** handling
4. **Use consistent naming** conventions
5. **Test health checks** regularly

## Migration and Upgrade Patterns

### Zero-Downtime Deployments
- **Blue-Green**: Parallel service instances
- **Rolling**: Gradual service updates
- **Canary**: Partial traffic routing for testing

### Infrastructure Upgrades
- **Droplet Scaling**: Vertical resource increases
- **Service Migration**: Container-to-container moves
- **Network Changes**: Careful dependency management

## Future Architecture Considerations

### Horizontal Scaling Options
- **Load Balancer**: Multiple droplets behind load balancer
- **Container Orchestration**: Kubernetes or Docker Swarm
- **Database Clustering**: Multi-node database setup

### Enhanced Monitoring
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Centralized logging and analysis

### Security Enhancements
- **Secret Management**: Centralized secret storage (Infisical when healthy)
- **Network Policies**: Fine-grained network access control
- **Audit Logging**: Comprehensive security event logging

## Operational Procedures

### Service Addition Procedure
1. **Design service** with health checks and logging
2. **Choose network** (internal vs external)
3. **Configure labels** for nginx-proxy discovery
4. **Set resource limits** and environment variables
5. **Test deployment** in staging environment
6. **Monitor health** after production deployment

### Troubleshooting Procedure
1. **Check service health** via Docker health status
2. **Review logs** using `docker logs` or Dozzle
3. **Test connectivity** between services
4. **Verify configuration** and environment variables
5. **Check resource usage** with `docker stats`
6. **Validate network** connectivity and routing

---

**Architecture Version**: 0.3  
**Last Updated**: 2025-11-09  
**Next Review**: Monthly or after major changes  
**Pattern Status**: Active and operational  
**Known Issues**: Documented in service inventory