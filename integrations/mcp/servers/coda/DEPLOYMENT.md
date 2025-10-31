---
- entity: integration
- level: operational
- zone: internal
- version: v01
- tags: [mcp, coda, deployment, docker, droplet]
- source_path: /integrations/mcp/servers/coda/DEPLOYMENT.md
- date: 2025-10-30
---

# Coda MCP Server — Deployment Guide

**Status**: ✅ Deployed (2025-10-30)
**Endpoint**: https://coda.bestviable.com/sse
**Environment**: DigitalOcean Droplet (159.65.97.146)
**Pattern**: SyncBricks (nginx-proxy + acme-companion + Cloudflare Tunnel)

---

## Deployed Architecture

```
Internet
   ↓ (HTTPS via Cloudflare)
Cloudflare Tunnel (cloudflared container)
   ↓
nginx-proxy (reverse proxy + auto-discovery)
   ↓
coda-mcp-gateway (node:23-alpine + mcp-proxy wrapper)
   ↓ (stdio MCP)
Coda MCP Server (dustingood fork, 34 tools)
```

**Networks**:
- `proxy`: Public-facing (nginx-proxy, acme-companion, cloudflared, coda-mcp-gateway)
- `syncbricks`: Backend-only (postgres, qdrant, n8n, coda-mcp-gateway)

---

## Deployment Timeline

### Phase 1A: Source Preparation (2025-10-29)
- Examined dustingood fork
- Verified 34 tools available
- Migrated to `/integrations/mcp/servers/coda/src/`
- Confirmed TypeScript build process works

### Phase 1B: Droplet Deployment (2025-10-30)
- Created `Dockerfile.coda-mcp-gateway` (Alpine node + mcp-proxy)
- Updated `docker-compose.production.yml` service definition
- Transferred source code to `/root/portfolio/integrations/mcp/servers/coda/src/`
- Built Docker image: `coda-mcp-gateway:latest`
- Verified endpoint: HTTP 200 OK on https://coda.bestviable.com/sse

### Phase 1C: Documentation (2025-10-30)
- Created README.md (tool catalog, quick start)
- Created DEPLOYMENT.md (this file)
- Created CHANGELOG.md (version history)
- Updated server_catalog_v01.md (marked as deployed)

---

## Docker Configuration

### Dockerfile (`docs/ops/Dockerfile.coda-mcp-gateway`)

```dockerfile
FROM node:23-alpine

# Install Python + mcp-proxy wrapper
RUN apk add --no-cache python3 py3-pip
RUN pip install --break-system-packages mcp-proxy

WORKDIR /app

# Copy package files
COPY portfolio/integrations/mcp/servers/coda/src/package.json \
     portfolio/integrations/mcp/servers/coda/src/pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source and build
COPY portfolio/integrations/mcp/servers/coda/src .
RUN pnpm build

# Run via mcp-proxy (exposes stdio MCP as HTTP/SSE on port 8080)
CMD ["mcp-proxy", "--host", "0.0.0.0", "--port", "8080", "--", "node", "dist/index.js"]
```

**Image Details**:
- Base: `node:23-alpine` (lightweight)
- Build: TypeScript → `dist/index.js`
- Transport: stdio (node process) wrapped by mcp-proxy
- Exposure: HTTP/SSE on port 8080

### Docker Compose Service (`ops/docker-compose.production.yml`)

```yaml
coda-mcp-gateway:
  build:
    context: .
    dockerfile: docs/ops/Dockerfile.coda-mcp-gateway
  image: coda-mcp-gateway:latest
  container_name: coda-mcp-gateway
  restart: always

  environment:
    CODA_API_TOKEN: ${CODA_API_TOKEN}
    VIRTUAL_HOST: coda.${DOMAIN}
    VIRTUAL_PORT: 8080
    LETSENCRYPT_HOST: coda.${DOMAIN}
    LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL}
    HTTPS_METHOD: noredirect
    TRUST_DOWNSTREAM_PROXY: "true"

  networks:
    - proxy
    - syncbricks

  ports:
    - "127.0.0.1:8080:8080"

  depends_on:
    n8n:
      condition: service_healthy

  healthcheck:
    test: ["CMD", "pgrep", "-f", "node.*coda"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 120s

  labels:
    - "com.github.jrcs.letsencrypt_nginx_proxy_companion.main=coda.${DOMAIN}"
```

**Key Configuration**:
- Auto-discovery reverse proxy (VIRTUAL_HOST labels)
- SSL via acme-companion (Let's Encrypt)
- Dual network membership (public + backend access)
- Depends on n8n health (startup ordering)
- 120s startup grace period for build

---

## Environment Variables

**Required** (in droplet `.env`):
```bash
CODA_API_TOKEN=<your-coda-api-token>
DOMAIN=bestviable.com
LETSENCRYPT_EMAIL=<your-email>
```

**Auto-populated** from compose file:
```bash
VIRTUAL_HOST=coda.bestviable.com
VIRTUAL_PORT=8080
HTTPS_METHOD=noredirect
TRUST_DOWNSTREAM_PROXY=true
```

---

## Deployment Procedure

### For Manual Updates

```bash
# On local machine (portfolio directory)

# 1. Update source if needed
cd integrations/mcp/servers/coda/src/
git pull origin main  # or make local changes

# 2. Test locally (optional)
pnpm build
node dist/index.js

# 3. Copy to droplet
scp -r integrations/mcp/servers/coda/src/* root@159.65.97.146:/root/portfolio/integrations/mcp/servers/coda/src/

# 4. Rebuild on droplet
ssh root@159.65.97.146 "cd /root/portfolio/ops && docker compose -f docker-compose.production.yml build coda-mcp-gateway"

# 5. Redeploy
ssh root@159.65.97.146 "cd /root/portfolio/ops && docker compose -f docker-compose.production.yml up -d coda-mcp-gateway"

# 6. Verify
curl -I https://coda.bestviable.com/sse
# Expected: HTTP/2 200 OK
```

### For Container-Only Updates

```bash
ssh root@159.65.97.146
cd /root/portfolio/ops

# Update compose file if needed
# Then rebuild without transferring source
docker compose -f docker-compose.production.yml build coda-mcp-gateway --no-cache

# Deploy
docker compose -f docker-compose.production.yml up -d coda-mcp-gateway

# Verify
docker logs coda-mcp-gateway --tail 20
curl -I https://coda.bestviable.com/sse
```

---

## Verification Checklist

After deployment, verify:

- [ ] Container is running: `docker ps | grep coda-mcp-gateway`
- [ ] Container is healthy: Status shows `(healthy)`
- [ ] Port 8080 bound: `docker port coda-mcp-gateway`
- [ ] Endpoint responds: `curl -I https://coda.bestviable.com/sse` → 200 OK
- [ ] SSE content type: Response header has `content-type: text/event-stream`
- [ ] nginx-proxy routing: `docker logs nginx-proxy | grep coda` shows activity
- [ ] No errors in logs: `docker logs coda-mcp-gateway --tail 50` shows no ERROR lines

---

## Troubleshooting

**Container fails to start**:
```bash
docker logs coda-mcp-gateway --tail 100
# Check for: build errors, missing env vars, pnpm install failures
```

**Endpoint returns 502 Bad Gateway**:
```bash
# Check if container is running
docker ps | grep coda-mcp-gateway

# Check if port is exposed
docker port coda-mcp-gateway

# Check nginx config
docker logs nginx-proxy | tail -20
```

**Health check failing**:
```bash
# Check if Node process is running
docker exec coda-mcp-gateway pgrep -f node

# Wait longer (start_period is 120s)
sleep 120
docker compose -f docker-compose.production.yml ps coda-mcp-gateway
```

**Coda API authentication fails**:
```bash
# Verify token in .env
grep CODA_API_TOKEN .env

# Check it's being passed to container
docker exec coda-mcp-gateway env | grep CODA
```

---

## Rollback Procedure

If deployment breaks existing service:

```bash
# Restart previous working version
ssh root@159.65.97.146
cd /root/portfolio/ops

# Stop broken container
docker compose -f docker-compose.production.yml stop coda-mcp-gateway

# Restart from last working image
docker compose -f docker-compose.production.yml up -d coda-mcp-gateway

# Or rebuild from previous commit
git log --oneline docs/ops/docker-compose.production.yml
git checkout <previous-commit> -- docs/ops/Dockerfile.coda-mcp-gateway
docker compose -f docker-compose.production.yml build --no-cache coda-mcp-gateway
docker compose -f docker-compose.production.yml up -d coda-mcp-gateway
```

---

## Monitoring

### Logs

```bash
# Real-time logs
ssh root@159.65.97.146 "docker logs -f coda-mcp-gateway"

# Last N lines
docker logs coda-mcp-gateway --tail 50

# With timestamps
docker logs --timestamps coda-mcp-gateway --tail 50
```

### Health Status

```bash
# Via docker
docker compose -f docker-compose.production.yml ps coda-mcp-gateway

# Via healthcheck
docker inspect coda-mcp-gateway | grep -A 5 Health
```

### Performance

```bash
# Container resource usage
docker stats coda-mcp-gateway

# Network traffic
docker logs nginx-proxy | grep coda | tail -10
```

---

## Related Documentation

- **Tool Documentation**: README.md
- **Version History**: CHANGELOG.md
- **Troubleshooting Guide**: TROUBLESHOOTING.md
- **Architecture**: /agents/decisions/2025-10-29_mcp-tier-architecture_v01.md
- **Infrastructure**: /docs/infrastructure/droplet_state_2025-10-28.md
- **Compose File**: /infra/docker/docker-compose.production.yml

---

**Deployed**: 2025-10-30 01:45 UTC
**Endpoint**: https://coda.bestviable.com/sse
**Status**: ✅ Operational
**Health**: HTTP 200 OK (verified)
