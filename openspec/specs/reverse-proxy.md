# Reverse Proxy Capability Specification

- entity: reverse_proxy_system
- level: system
- zone: infrastructure
- version: v1.0
- tags: [traefik, reverse-proxy, routing, ssl-termination, cloudflare, infrastructure]
- status: production
- adopted: 2025-11-13
- last_updated: 2025-11-14

---

## Summary

The reverse proxy system provides HTTP request routing, virtual host management, and automatic service discovery for all externally-facing services on the production droplet. The current implementation uses Traefik v3.0 with HTTP-only routing and Cloudflare-managed SSL termination.

---

## Capability

### What It Does

The reverse proxy:
1. **Routes HTTP traffic** from Cloudflare Tunnel (port 80) to appropriate backend services
2. **Discovers services automatically** via Docker container labels
3. **Handles virtual hosting** (multiple domains on single IP)
4. **Provides health checking** for backends
5. **Manages zero-downtime configuration reloads**
6. **Terminates HTTP connections** from Cloudflare (SSL terminated upstream by Cloudflare)

### What It Does NOT Do

- SSL/TLS certificate management (Cloudflare handles this)
- HTTPS listener (uses HTTP-only; Cloudflare upgrades to HTTPS)
- Let's Encrypt integration (deprecated with nginx-proxy)

---

## Current Implementation

### Traefik v3.0.0

**Container**: `traefik`
**Location**: `/home/david/services/traefik/`
**Docker Image**: `traefik:v3.0.0`
**Networks**: `docker_proxy` (external ingress), `docker_syncbricks` (internal service discovery)
**Status**: ✅ Running (routing operational; healthcheck unhealthy - benign)

**Key Configuration**:
- **Entrypoint**: `web` on port 80 (HTTP only)
- **Provider**: Docker (auto-discovery via labels)
- **Network Alias**: `nginx-proxy` (backward compatibility with Cloudflare Tunnel routing config)
- **Dashboard**: Enabled on `127.0.0.1:8080` (localhost only, not exposed)

**Configuration Files**:
```
/home/david/services/traefik/
├── traefik.yml           # Static config (entrypoints, providers, dashboard)
├── docker-compose.yml    # Container definition, network binding
└── .env                  # TRAEFIK_* environment variables
```

---

## Requirements

### MUST: Automatic Service Discovery

Services must be discoverable by Traefik without manual configuration file edits.

**Scenarios**:
1. New service added with Traefik labels → traffic routed automatically within 1 second
2. Service removed → routes removed automatically, traffic fails gracefully (no pending connections)
3. Service restarted → routes maintained, requests routed to healthy container

**Implementation**: Docker provider with label-based service discovery

### MUST: HTTP Request Routing

All HTTP requests on port 80 must route to the correct backend service based on hostname.

**Scenarios**:
1. Request to `n8n.bestviable.com` → routes to n8n container port 5678
2. Request to `openweb.bestviable.com` → routes to openweb container port 8080
3. Request to unknown hostname → returns 404 (Traefik default)
4. Request with invalid Host header → routed based on first matching rule

**Implementation**: Host-based routing rules via Traefik labels on service containers

### MUST: Backend Health Checking

Traefik must detect unhealthy backends and remove them from rotation.

**Scenarios**:
1. Backend becomes unhealthy → Traefik detects via health check, stops sending traffic
2. Backend recovers → traffic resumes automatically
3. All backends unhealthy → return 503 (Service Unavailable)

**Implementation**: HTTP health checks on backend services (Docker health checks), Traefik respects container health status

### MUST: Multi-Service Coexistence

Multiple services must coexist on the same droplet, sharing single Traefik instance.

**Scenarios**:
1. 12+ containers running simultaneously on docker_proxy network
2. Each service has independent routing, doesn't interfere with others
3. Service A failure doesn't affect service B traffic

**Implementation**: Isolated Docker networks (docker_proxy, docker_syncbricks), independent routing rules per service

### MUST: Zero-Downtime Configuration Updates

Traefik configuration changes must take effect without container restarts.

**Scenarios**:
1. Add new service label → traffic routes within seconds, no downtime
2. Modify routing rule → takes effect immediately, existing connections preserved
3. Update backend port → new connections route to new port

**Implementation**: Docker provider watches for label changes, hot-reloads configuration

### SHOULD: Network Isolation

Internal services should not be directly exposed to internet; only through reverse proxy.

**Scenarios**:
1. postgres (5432) - on docker_syncbricks only, not accessible externally
2. qdrant (6333) - on docker_syncbricks only, not accessible externally
3. n8n (5678) - on both networks, but external access only through Traefik

**Implementation**: Network segmentation with docker_proxy (external) and docker_syncbricks (internal)

---

## Architecture

### Network Diagram

```
Internet (Cloudflare)
        ↓ (HTTP port 80)
Cloudflare Tunnel (tools-droplet-agents:~500 connection)
        ↓
docker_proxy network (172.20.0.0/16)
        ↓
Traefik Container (nginx-proxy alias)
        ↓ (routes based on Host header)
    ┌───┬───┬───┬───┐
    ↓   ↓   ↓   ↓   ↓
   n8n openweb coda dozzle kuma
  (each with independent label config)
        ↓
docker_syncbricks network (172.21.0.0/16)
        ↓
Internal services (postgres, qdrant)
```

### Service Labels Example

Every service exposed via reverse proxy must have Traefik labels:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    networks:
      - docker_proxy     # External-facing
      - docker_syncbricks  # Internal
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.n8n.rule=Host(`n8n.bestviable.com`)"
      - "traefik.http.routers.n8n.entrypoints=web"
      - "traefik.http.services.n8n.loadbalancer.server.port=5678"
```

**Label Semantics**:
- `traefik.enable=true` - register service with Traefik
- `traefik.http.routers.n8n.rule=Host(...)` - routing rule (hostname-based)
- `traefik.http.routers.n8n.entrypoints=web` - use HTTP entrypoint (port 80)
- `traefik.http.services.n8n.loadbalancer.server.port=5678` - backend port to forward to

---

## Deployment Workflow

### Adding a New Service (5 minutes)

1. **Create docker-compose.yml** service definition with:
   - `networks: [docker_proxy, docker_syncbricks]` or just `docker_proxy` if internal
   - Traefik labels (see example above)
   - Health check (if available)

2. **Deploy to droplet**:
   ```bash
   scp docker-compose.yml droplet:/home/david/services/new-service/
   ssh droplet "cd /home/david/services/new-service && docker-compose up -d"
   ```

3. **Verify routing** (10-30 seconds for auto-discovery):
   ```bash
   curl -H "Host: new-service.bestviable.com" http://droplet:80
   ```

### Modifying Routing Rules (Instant)

1. **Update labels** in docker-compose.yml
2. **Apply changes**:
   ```bash
   scp docker-compose.yml droplet:/home/david/services/service-name/
   ssh droplet "docker-compose -f /home/david/services/service-name/docker-compose.yml up -d"
   ```
3. **Traefik auto-reloads** (no container restart needed)

### Removing a Service (2 minutes)

1. **Stop and remove container**:
   ```bash
   docker-compose -f /home/david/services/service-name/docker-compose.yml down
   ```
2. **Traefik automatically removes routes** (no reload needed)

---

## Migration History

### From nginx-proxy + acme-companion (≤ 2025-11-12)

**Previous System**:
- Container: `nginx-proxy` (jwilder/nginx-proxy:latest)
- SSL Management: acme-companion (auto-renews Let's Encrypt certs)
- Configuration: Environment variables (VIRTUAL_HOST, LETSENCRYPT_HOST, etc.)
- Reload: Requires container restart on label changes

**Migration Completed**: 2025-11-13
- **Reason**: Traefik offers better auto-reload, lower resource usage, native Docker integration
- **SSL Termination**: Shifted to Cloudflare (zero-cost, zero-config)
- **Backward Compatibility**: Traefik container has network alias `nginx-proxy` for Cloudflare Tunnel config

**Breaking Changes**:
- Service environment variables (VIRTUAL_HOST, VIRTUAL_PORT, LETSENCRYPT_*) no longer used
- Services must use Traefik labels instead
- No more automatic Let's Encrypt certificates (Cloudflare provides SSL)

**Benefits Realized**:
- ✅ No container restarts needed for config changes (zero-downtime)
- ✅ ~50MB RAM saved (nginx-proxy + acme-companion → Traefik alone)
- ✅ Simpler label syntax (Traefik native vs jwilder environment variables)
- ✅ Faster service discovery (seconds vs restart wait time)

---

## Operational Procedures

### Health Check

```bash
# Check Traefik container status
docker ps --filter "name=traefik" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check Traefik routing active
curl -v -H "Host: n8n.bestviable.com" http://localhost:80

# View Traefik dashboard (localhost only)
curl http://127.0.0.1:8080/api/routers
```

### Troubleshooting

**Service not accessible**:
1. Check labels in docker-compose.yml (must have traefik.enable=true)
2. Verify service is on docker_proxy network
3. Check Traefik logs: `docker logs traefik -f`
4. Verify service health: `docker ps --filter "name=service-name"`

**High CPU usage**:
- Normal if service discovery running (happens ~monthly with Docker daemon restarts)
- Traefik self-heals within seconds

**Connection refused**:
1. Verify Cloudflare Tunnel is connected: Check Cloudflare dashboard
2. Verify Traefik is running: `docker ps`
3. Check backend service is healthy: `docker inspect --format='{{.State.Health.Status}}' service-name`

---

## Related Documentation

- **Deployment Guide**: `/docs/system/sops/SERVICE_DEPLOYMENT_GUIDE.md` (Traefik Quick Start section)
- **Service Inventory**: `/docs/system/architecture/SERVICE_INVENTORY.md` (current services list)
- **Network Details**: `/docs/system/architecture/SERVICE_INVENTORY.md` (Network Architecture section)
- **Cloudflare Integration**: Tunnel routes `*` to `nginx-proxy:80` (alias maintains backward compat)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-11-14 | Initial specification of Traefik v3.0 reverse proxy system (production) |

---

**Status**: Production (adopted 2025-11-13, documented 2025-11-14)
**Owner**: David (Portfolio Project)
**Last Reviewed**: 2025-11-14
