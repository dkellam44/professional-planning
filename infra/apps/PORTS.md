- entity: infrastructure
- level: documentation
- zone: internal
- version: v01
- tags: [infrastructure, ports, networking, documentation]
- source_path: /PORTS.md
- date: 2025-10-26

---

# Service Port Mappings & Network Design

## Overview

This document describes the port allocations and network design for the SyncBricks infrastructure pattern deployed on DigitalOcean droplet.

**Environment**: `bestviable.com`
**Pattern**: SyncBricks (nginx-proxy + acme-companion + Cloudflare Tunnel + two-network design)

---

## Public-Facing Ports

These ports are exposed to the internet via nginx-proxy reverse proxy:

| Service | Internal Port | Public Domain | Public Port | Access |
|---------|--------------|---------------|-------------|--------|
| **nginx-proxy** | 80 → 443 | `bestviable.com` | 80, 443 | HTTP/HTTPS (auto-redirect) |
| **n8n** | 5678 | `n8n.bestviable.com` | 443 (HTTPS) | Via nginx-proxy, auto-discovered |
| **Coda MCP (HTTP-native)** | 8080 | `coda.bestviable.com` | 443 (HTTPS) | Via nginx-proxy, auto-discovered |

---

## Internal Ports (Private Network Only)

These ports are **only accessible within the Docker container network** and NOT exposed to the internet:

### Proxy Network (`proxy` — internal bridge)
Used by: nginx-proxy, acme-companion, cloudflared, n8n, coda-mcp

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| **nginx-proxy** | 80 | HTTP | Reverse proxy (internal routing) |
| **nginx-proxy** | 443 | HTTPS | Reverse proxy (internal routing) |
| **cloudflared** | N/A | Tunnel | Cloudflare Tunnel outbound connection |

### Syncbricks Network (`syncbricks` — isolated backend)
Used by: postgres, qdrant, n8n (hybrid), coda-mcp (hybrid)

| Service | Port | Protocol | Purpose | Exposed? |
|---------|------|----------|---------|----------|
| **postgres** | 5432 | TCP | Database | ❌ NO — internal only |
| **qdrant** | 6333 | HTTP | Vector DB API | ❌ NO — internal only |
| **qdrant** | 6334 | gRPC | Vector DB gRPC | ❌ NO — internal only |

---

## Network Isolation

### Proxy Network
- **Public-facing services**: nginx-proxy, acme-companion, cloudflared
- **Services accessible via proxy**: n8n, coda-mcp
- **Access to internet**: Via Cloudflare Tunnel (cloudflared container)
- **Access to database**: **BLOCKED** (not on syncbricks network)

### Syncbricks Network
- **Backend services**: postgres, qdrant
- **Hybrid services**: n8n, coda-mcp (both networks for flexibility)
- **Access to internet**: **BLOCKED** (no tunnel connection)
- **Security**: Database isolated from public internet

---

## Local Port Bindings (Droplet Only)

For local debugging or direct container access:

| Service | Local Binding | Purpose |
|---------|---------------|---------|
| **n8n** | `127.0.0.1:5678` | Local access only (internal health checks) |
| **coda-mcp** | `127.0.0.1:8080` | Local access only (internal health checks) |

**Note**: These are NOT exposed to the internet. External access goes through nginx-proxy + HTTPS + Cloudflare Tunnel.

---

## DNS Configuration

All services route through a single tunnel and use DNS CNAME records:

```bash
# Cloudflare DNS Records (example)
bestviable.com          CNAME → tunnel.cloudflare.com
n8n.bestviable.com      CNAME → tunnel.cloudflare.com
coda.bestviable.com     CNAME → tunnel.cloudflare.com
tools.bestviable.com    CNAME → tunnel.cloudflare.com (if needed)
```

The Cloudflare Tunnel (`cloudflared` container) listens on the tunnel endpoint and routes traffic to nginx-proxy based on HTTP Host headers.

---

## How It Works: Request Flow

### Example: User accesses n8n.bestviable.com

```
1. User browser: https://n8n.bestviable.com
   ↓
2. Cloudflare DNS: resolves to tunnel.cloudflare.com
   ↓
3. Cloudflare Edge: user connected to Cloudflare's network
   ↓
4. Cloudflare Tunnel: route to droplet's cloudflared container
   ↓
5. cloudflared container: HTTP request → 127.0.0.1:80
   ↓
6. nginx-proxy container: reads Host header (n8n.bestviable.com)
   ↓
7. nginx-proxy routes to: n8n container on proxy network
   ↓
8. n8n container (port 5678): processes request
   ↓
9. Response flows back through reverse path
   ↓
10. User receives HTTPS response (SSL via acme-companion)
```

**Key security properties:**
- ✅ User's IP never sees droplet's IP (Cloudflare shields it)
- ✅ Droplet's IP hidden from internet
- ✅ Database not accessible from proxy layer (different network)
- ✅ SSL/TLS certificates auto-renewed (acme-companion)

---

## Scaling: Adding a New Service

To add a new service (e.g., `tools.bestviable.com`):

1. **Add service to docker-compose.yml:**
   ```yaml
   new-service:
     image: new-service:latest
     networks:
       - proxy           # Attach to public network
       - syncbricks      # Optional: if needs database access
     environment:
       - VIRTUAL_HOST=tools.bestviable.com
       - LETSENCRYPT_HOST=tools.bestviable.com
     labels:
       - "com.github.jrcs.letsencrypt_nginx_proxy_companion.main=tools.bestviable.com"
       - "letsencrypt.host=tools.bestviable.com"
       - "letsencrypt.email=admin@bestviable.com"
   ```

2. **Add DNS CNAME in Cloudflare:**
   ```
   tools.bestviable.com CNAME → tunnel.cloudflare.com
   ```

3. **Deploy:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

nginx-proxy auto-discovers the new service via `docker.sock` and adds it to the reverse proxy config. acme-companion auto-generates SSL certificates.

**No manual nginx config needed!**

---

## Troubleshooting: Port Issues

### "Port 80 already in use"
```bash
# Check what's using port 80
sudo lsof -i :80
# Kill conflicting process or stop previous docker-compose
docker-compose down
```

### "Cannot connect to n8n.bestviable.com"
1. Check cloudflared tunnel is healthy:
   ```bash
   docker logs cloudflared | grep -i healthy
   ```
2. Check nginx-proxy has auto-discovered n8n:
   ```bash
   docker logs nginx-proxy | grep n8n
   ```
3. Check DNS resolution:
   ```bash
   nslookup n8n.bestviable.com
   # Should resolve to Cloudflare IP, not droplet IP
   ```

### "Certificate not issued yet"
- acme-companion takes 1-5 minutes on first request
- Check logs: `docker logs acme-companion`
- Wait 5 minutes, then try again

---

## Security Notes

### What's Exposed?
- ❌ Droplet IP address (hidden behind Cloudflare Tunnel)
- ❌ Database ports (on syncbricks network only)
- ❌ Internal service ports (e.g., n8n:5678)
- ✅ HTTPS endpoints (n8n.bestviable.com, coda.bestviable.com)

### What's Protected?
- ✅ All traffic encrypted (SSL/TLS)
- ✅ Database isolated on private network
- ✅ No direct port access from internet
- ✅ Certificates auto-renewed (no manual renewal)
- ✅ nginx-proxy blocks direct IP access

---

## Environment Variables

Required in `.env` file:

```bash
# Cloudflare Tunnel
CF_TUNNEL_TOKEN=<token from Cloudflare Zero Trust>

# Domain
DOMAIN=bestviable.com
LETSENCRYPT_EMAIL=admin@bestviable.com

# Database
POSTGRES_PASSWORD=<secure password>

# n8n
N8N_ADMIN_EMAIL=dkellam44@gmail.com
N8N_ADMIN_PASSWORD=<secure password>
N8N_ENCRYPTION_KEY=<secure random key>

# Coda MCP Gateway
CODA_API_TOKEN=<token>

# Qdrant
QDRANT_API_KEY=<secure key>
```

All sensitive values are **environment-only**, never committed to git.

---

## Reference Files

- **docker-compose.yml** — Service definitions and port mappings
- **PRODUCTION_DEPLOYMENT_QUICKSTART.md** — Rapid deployment guide
- **syncbricks_solution_breakdown_v1.md** — Technical architecture details
- **cloudflare_tunnel_token_guide_v1.md** — Token setup and operations
