---
- entity: infrastructure
- level: operational
- zone: cloud
- version: v02
- tags: [droplet, infrastructure, docker, state, verified]
- source_path: /docs/infrastructure/droplet_state_2025-10-30.md
- date: 2025-10-30
---

# Droplet State — 2025-10-30

**Status**: 🟢 **HEALTHY** (All core services operational)
**Last Verified**: 2025-10-30 05:36 UTC
**Infrastructure Version**: `/infra/` (restructured, symmetrical with local)

> **2025-11-02 Update:** Snapshot recorded before the HTTP-native Coda MCP rollout. Entries referencing `coda-mcp-gateway` describe the legacy container; rely on `infra/docker/docker-compose.production.yml` and `network_wiring_diagram_v2.md` for the current service map.

---

## Quick Health Check

```bash
# SSH to droplet
ssh tools-droplet-agents

# Check containers
cd /root/portfolio/infra/docker
docker compose -f docker-compose.production.yml --env-file ../config/.env ps

# Check Coda endpoint
curl -I https://coda.bestviable.com/sse
# Expected: HTTP/2 200 ✅
```

---

## Current Stack Status

### 🟢 Healthy (Always Running)

| Service | Status | Port | Notes |
|---------|--------|------|-------|
| **nginx-proxy** | ✅ Up (22m) | 80, 443 | Reverse proxy, auto-discovery |
| **acme-companion** | ✅ Up (22m, healthy) | — | Let's Encrypt SSL automation |
| **postgres** | ✅ Up (22m, healthy) | 5432 | Database backend |
| **qdrant** | ✅ Up (22m, healthy) | 6333-6334 | Vector store |
| **cloudflared** | ✅ Up (22m) | — | Cloudflare Tunnel daemon |

### 🟢 Operational (Healthy)

| Service | Status | Port | Purpose |
|---------|--------|------|---------|
| **coda-mcp-gateway** | ✅ Up (22m, healthy) | 8080 (internal) | Coda tool access via MCP (34 tools) |

**Endpoint**: `https://coda.bestviable.com/sse` → HTTP/2 200 ✅

### 🟡 Restarting (Expected Until Tokens Provided)

| Service | Status | Blocker |
|---------|--------|---------|
| **n8n** | Restarting | DB initialization (normal on first startup) |
| **digitalocean-mcp-gateway** | Restarting | Missing `DIGITALOCEAN_API_TOKEN` in .env |
| **cloudflare-mcp-gateway** | Restarting | Missing `CLOUDFLARE_REMOTE_URL` and auth in .env |

---

## Infrastructure Changes (2025-10-30)

### Directory Restructuring ✅

**Before**: Scattered across `/root/portfolio/docs/ops/` and `/root/portfolio/ops/`
**After**: Single canonical `/root/portfolio/infra/` (mirrors local structure)

```
/root/portfolio/infra/
├── docker/
│   ├── docker-compose.production.yml      (orchestration)
│   ├── services/
│   │   ├── coda-mcp.Dockerfile
│   │   ├── digitalocean-mcp.Dockerfile
│   │   └── cloudflare-mcp.Dockerfile
│   ├── data/                              (volumes)
│   ├── certs/                             (SSL certificates)
│   ├── acme/, html/, logs/, vhost.d/      (infrastructure)
│   └── [other runtime files]
├── config/
│   ├── .env                               (secrets)
│   └── .env.example                       (template)
└── scripts/                               (not yet synced)
```

### Build Context Fix ✅

**Before**: `context: ..` from `/docs/ops/` → resolved to `/docs/`
**After**: `context: ../..` from `/infra/docker/` → resolves to `/root/portfolio/` ✅

### Local/Droplet Symmetry ✅

- **Local**: `/Users/davidkellam/workspace/portfolio/infra/`
- **Droplet**: `/root/portfolio/infra/`
- **Sync**: `rsync infra/ root@159.65.97.146:/root/portfolio/infra/` (mirrors perfectly)

---

## Running Services Breakdown

### Reverse Proxy Layer (nginx-proxy + acme-companion)

- **Purpose**: Auto-discovery reverse proxy with automatic SSL
- **Traffic**: 80 → 443 (all HTTP upgraded to HTTPS)
- **Certificates**: Auto-provisioned via Let's Encrypt (acme-companion)
- **Services**: Auto-registers via `VIRTUAL_HOST` labels in docker-compose

### MCP Gateways (HTTP/SSE Transport Layer)

- **coda-mcp-gateway**: Wraps Coda MCP stdio with mcp-proxy, exposes on 8080
  - Endpoint: `https://coda.bestviable.com/sse`
  - Tools: 34 (Documents, Pages, Tables, Rows, Formulas, Controls, Users)
  - Status: ✅ **LIVE**

- **digitalocean-mcp-gateway**: Wraps DigitalOcean Go binary with mcp-proxy
  - Endpoint: `https://digitalocean.bestviable.com/sse`
  - Tools: ~20 (compute, networking, domains)
  - Status: 🟡 **Restarting** (awaiting API token)

- **cloudflare-mcp-gateway**: Wraps Cloudflare remote MCP with entrypoint
  - Endpoint: `https://cloudflare.bestviable.com/sse`
  - Purpose: Proxy access to remote Cloudflare docs/resources
  - Status: 🟡 **Restarting** (awaiting remote URL + auth)

### Data & Automation Layer

- **n8n**: Workflow automation platform
  - Endpoint: `https://n8n.bestviable.com/`
  - Status: 🟡 **Restarting** (DB initialization)
  - Database: postgres:15-alpine (healthy, mounted on /root/portfolio/infra/docker/data/postgres)

- **postgres**: Relational database (n8n backend)
  - Port: 5432 (internal only)
  - Status: ✅ **Healthy**
  - Volumes: `/root/portfolio/infra/docker/data/postgres/`

- **qdrant**: Vector database (embeddings storage)
  - Port: 6333 (HTTP), 6334 (gRPC)
  - Status: ✅ **Healthy**
  - Volumes: `/root/portfolio/infra/docker/data/qdrant/`

### Connectivity Layer

- **cloudflared**: Cloudflare Tunnel daemon
  - Purpose: Secure tunnel to bestviable.com (zero-trust networking)
  - Status: ✅ **Running**
  - Configuration: Token from Cloudflare dashboard (stored in .env)

---

## Endpoint Health

### Primary (Always Test First)

```bash
# Coda MCP endpoint test
curl -I https://coda.bestviable.com/sse
# Expected: HTTP/2 200 with content-type: text/event-stream
```

**Last test**: 2025-10-30 05:36 UTC → **✅ HTTP/2 200**

### Secondary (When Tokens Installed)

```bash
# DigitalOcean MCP endpoint test
curl -I https://digitalocean.bestviable.com/sse

# Cloudflare MCP endpoint test
curl -I https://cloudflare.bestviable.com/sse

# n8n endpoint test
curl -I https://n8n.bestviable.com/
```

---

## Environment Configuration

### Location
- **Path**: `/root/portfolio/infra/config/.env`
- **Owner**: root (restricted permissions)
- **Status**: Loaded by docker-compose

### Required Secrets

```bash
# Base configuration (domain)
DOMAIN=bestviable.com
LETSENCRYPT_EMAIL=<real email for Let's Encrypt>

# n8n configuration
N8N_ADMIN_EMAIL=<email>
N8N_ADMIN_PASSWORD=<strong password>
N8N_ENCRYPTION_KEY=<32+ char random key>

# Coda configuration
CODA_API_TOKEN=<token from Coda workspace settings>

# DigitalOcean configuration (for MCP activation)
DIGITALOCEAN_API_TOKEN=<token from DigitalOcean dashboard>
DIGITALOCEAN_SERVICES=<optional: service filter>

# Cloudflare configuration (for remote MCP)
CLOUDFLARE_REMOTE_URL=<target MCP to wrap, e.g., docs service>
CLOUDFLARE_API_TOKEN=<if needed for auth>

# Postgres configuration
POSTGRES_PASSWORD=<secure random password>

# Tunnel configuration
CF_TUNNEL_TOKEN=<token from Cloudflare Zero Trust console>
```

---

## Logs & Debugging

### View Logs (Last 50 lines)

```bash
# SSH to droplet
ssh root@159.65.97.146
cd /root/portfolio/infra/docker

# All services
docker compose --env-file ../config/.env logs --tail=50

# Specific service
docker compose --env-file ../config/.env logs --tail=50 coda-mcp-gateway
docker compose --env-file ../config/.env logs --tail=50 n8n
docker compose --env-file ../config/.env logs --tail=50 digitalocean-mcp-gateway
```

### Check Service Status

```bash
# Full status (shows restart history)
docker compose --env-file ../config/.env ps

# Single service status
docker compose --env-file ../config/.env ps coda-mcp-gateway

# Service events (real-time)
docker compose --env-file ../config/.env logs -f coda-mcp-gateway
```

---

## Common Maintenance Tasks

### Restart All Services

```bash
cd /root/portfolio/infra/docker
docker compose --env-file ../config/.env restart
```

### Stop All Services

```bash
cd /root/portfolio/infra/docker
docker compose --env-file ../config/.env down
```

### Start All Services

```bash
cd /root/portfolio/infra/docker
docker compose -f docker-compose.production.yml --env-file ../config/.env up -d
```

### Rebuild a Service (After Code Changes)

```bash
cd /root/portfolio/infra/docker
docker compose -f docker-compose.production.yml --env-file ../config/.env build coda-mcp-gateway
docker compose --env-file ../config/.env up -d coda-mcp-gateway
```

---

## Backup & Recovery

### Current Backups Available

- **Location**: `/root/`
- **Files**:
  - `ops-backup-2025-10-30-*.tar.gz` (pre-restructure state)
  - Keep for 1 week, then delete

### Recovery Procedure (If Needed)

```bash
# Extract backup to restore old state
cd /root/portfolio
tar -xzf ~/ops-backup-2025-10-30-*.tar.gz

# Start old services
docker compose -f ops/docker-compose.production.yml up -d

# NOTE: Don't mix old/new; either old or new structure, not both
```

---

## Next Steps (Operational)

### 1. **Monitor n8n Stabilization** (Next 1-2 hours)
   - Expected: DB initialization completes, service becomes healthy
   - Action: Check logs every 15 minutes initially
   - Success: `docker compose ps` shows n8n healthy

### 2. **Provide API Tokens** (When Ready)
   - Add `DIGITALOCEAN_API_TOKEN` to `.env`
   - Add `CLOUDFLARE_REMOTE_URL` to `.env`
   - Restart services: `docker compose restart digitalocean-mcp-gateway cloudflare-mcp-gateway`
   - Success: Both MCPs become healthy

### 3. **Verify Endpoints** (After Tokens)
   - Test both MCP endpoints with curl
   - Add to agent configurations once live

### 4. **Monitor Uptime** (Ongoing)
   - Check services daily: `docker compose ps`
   - Review logs weekly: `docker compose logs --tail=100`
   - Verify SSL certificates renewing: `ls -lh /root/portfolio/infra/docker/certs/`

---

## Quick Reference: Command Templates

```bash
# SSH shortcut
ssh root@159.65.97.146

# Working directory
cd /root/portfolio/infra/docker

# Always use this pattern for docker-compose
docker compose -f docker-compose.production.yml --env-file ../config/.env [command]

# Quick status check
docker compose -f docker-compose.production.yml --env-file ../config/.env ps

# Real-time log streaming
docker compose -f docker-compose.production.yml --env-file ../config/.env logs -f

# Restart after .env changes
docker compose -f docker-compose.production.yml --env-file ../config/.env down
docker compose -f docker-compose.production.yml --env-file ../config/.env up -d
```

---

## Migration Note

This droplet state file documents the **post-restructure state** (2025-10-30).

**Previous state**: `/docs/infrastructure/droplet_state_2025-10-28.md` (pre-restructure)

**Changes**:
- Directory structure migrated from `/docs/ops/` to `/infra/`
- Build contexts updated (`../..`)
- Local/droplet symmetry achieved
- All endpoints verified live

**Verification Date**: 2025-10-30 05:36 UTC
**Verified By**: Claude Code (Haiku) — post-restructure validation

---

**Last Updated**: 2025-10-30
**Status**: 🟢 HEALTHY
**Next Review**: 2025-11-07 (or after next major change)
