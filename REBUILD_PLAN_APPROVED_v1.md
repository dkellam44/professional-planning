- entity: infrastructure
- level: documentation
- zone: internal
- version: v1.0
- tags: [infrastructure, n8n, rebuild, mcp, cloudflare]
- source_path: /REBUILD_PLAN_APPROVED_v1.md
- date: 2025-11-02

---

# N8N Clean Rebuild Plan: Phase 1 + Simplified Phase 2 (APPROVED)

**Status**: Ready for execution
**Timeline**: Phase 1 (~2-3 hrs) + Phase 2 (~1-2 hrs)
**Decision**: Adopt syncbricks/n8n foundation + direct CF tunnel for MCP servers

---

## Executive Summary

### Why We're Doing This

Current setup has **unsolvable docker-gen/nginx-proxy issue**. Rather than band-aid fixes:
- Use **proven syncbricks/n8n** setup (jwilder/nginx-proxy)
- Deploy **separate MCP servers** with direct Cloudflare tunnel routing
- Keep **nginx only where it's needed** (n8n stack)
- **Skip nginx for MCP** servers (simpler, no complexity)

### Architecture Decision

```
BEFORE (bloated):
- nginx-proxy (broken docker-gen labels)
- n8n + Qdrant + postgres mixed with MCP services
- Legacy code littered everywhere

AFTER (clean):
- Phase 1: n8n + nginx + cloudflare tunnel (proven)
- Phase 2: MCP servers on separate ports → CF tunnel (direct)
- MCP servers can add nginx-proxy layer later if needed
```

---

## Phase 1: N8N Foundation Rebuild (2-3 hours)

### 1.1 Understanding the Fix

**Problem**: nginxproxy/nginx-proxy uses docker-gen template engine that fails to recognize n8n container labels

**Solution**: syncbricks/n8n uses jwilder/nginx-proxy (original, battle-tested) which handles label discovery more reliably

**Key Differences**:
| Aspect | Current (Broken) | SyncBricks (Proven) |
|--------|-----------------|-------------------|
| Image | nginxproxy/nginx-proxy:latest | jwilder/nginx-proxy |
| Template Engine | docker-gen (stateful) | jwilder (simpler) |
| Health Checks | Aggressive (false negatives) | Well-tuned defaults |
| Versions | Latest (unpredictable) | Pinned (1.83.2) |
| Data Import | Manual | n8n-import service |
| Status | ❌ Broken | ✅ Proven working |

---

### 1.2 Pre-Deployment Checklist

Before touching the droplet:

- [ ] Read this entire document
- [ ] Verify you have SSH access: `ssh tools-droplet-agents`
- [ ] Confirm backup location: `/Users/davidkellam/portfolio-backups/` exists
- [ ] Have Cloudflare tunnel token available from `.env`
- [ ] All environment variables in `/infra/config/.env.local` ready

---

### 1.3 Step-by-Step Execution

#### Step 1: Backup Current State

```bash
# SSH to droplet
ssh tools-droplet-agents

# Navigate to current deployment
cd /root/portfolio/infra/n8n

# Get database credentials from .env
cat .env | grep POSTGRES

# Backup database
docker-compose exec postgres pg_dump -U n8n -d n8n > \
  /tmp/n8n_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup n8n config/workflows
docker-compose exec -u 0 n8n tar czf \
  /tmp/n8n_config_$(date +%Y%m%d_%H%M%S).tar.gz \
  /home/node/.n8n/

# Download backups to local machine
exit  # Back to local machine

scp tools-droplet-agents:/tmp/n8n_backup_*.sql \
  /Users/davidkellam/portfolio-backups/

scp tools-droplet-agents:/tmp/n8n_config_*.tar.gz \
  /Users/davidkellam/portfolio-backups/

echo "Backups saved. Verify:"
ls -lh /Users/davidkellam/portfolio-backups/
```

#### Step 2: Stop Current Services

```bash
ssh tools-droplet-agents

cd /root/portfolio/infra/n8n

# Stop all containers and remove volumes
docker-compose down -v

# Verify nothing is running
docker ps | grep portfolio
# Expected: (empty)

# Check volumes are gone
docker volume ls | grep portfolio
# Expected: (no portfolio volumes)
```

#### Step 3: Create New docker-compose.yml

**Local machine**: Create `/Users/davidkellam/workspace/portfolio/infra/n8n/docker-compose.yml`

Use the syncbricks reference but adapted for bestviable.com. Key changes:

1. **Image**: `jwilder/nginx-proxy` (not nginxproxy)
2. **PostgreSQL**: 16-alpine (lighter)
3. **N8N**: Pinned version 1.83.2
4. **Health checks**: Tuned properly
5. **Include n8n-import**: For workflow restoration
6. **Remove manual nginx config mounts**: Let docker-gen work naturally
7. **Domains**: bestviable.com (not syncbricks.com)

See detailed compose file in section 1.4 below.

#### Step 4: Deploy New Stack

```bash
ssh tools-droplet-agents

# Copy new docker-compose.yml from local
scp /Users/davidkellam/workspace/portfolio/infra/n8n/docker-compose.yml \
  tools-droplet-agents:/root/portfolio/infra/n8n/

# Copy .env file (from local backup)
scp /Users/davidkellam/workspace/portfolio/infra/config/.env.local \
  tools-droplet-agents:/root/portfolio/infra/n8n/.env

# Verify files are in place
ssh tools-droplet-agents "ls -la /root/portfolio/infra/n8n/"

# Deploy
ssh tools-droplet-agents "cd /root/portfolio/infra/n8n && docker-compose up -d"

# Watch startup logs
ssh tools-droplet-agents "docker logs -f n8n --tail 50"
# Wait 30-60 seconds, then Ctrl+C
```

#### Step 5: Verify Services Are Healthy

```bash
ssh tools-droplet-agents

# Check all services running
docker ps

# Expected output:
# - nginx-proxy ✅
# - acme-companion ✅
# - postgres ✅
# - qdrant ✅
# - n8n ✅
# - cloudflared ✅

# Check nginx config was generated correctly
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 20 "upstream n8n"

# Expected to see:
# upstream n8n.bestviable.com {
#     server n8n:5678;
# }
#
# server {
#     listen 80;
#     server_name n8n.bestviable.com;

# If you see this ✅, docker-gen is working!
```

#### Step 6: Test External HTTPS Access

```bash
# From local machine
curl -k https://n8n.bestviable.com -v

# Expected:
# HTTP/1.1 200 OK
# (or login page redirect)

# If you get 503: Check nginx logs
ssh tools-droplet-agents "docker logs nginx-proxy --tail 20"

# If you get timeout: Check cloudflare tunnel status
ssh tools-droplet-agents "docker logs cloudflared --tail 20"
```

#### Step 7: Test N8N Functionality

```bash
# Access n8n web UI
# Open browser: https://n8n.bestviable.com

# Login with credentials from .env file
# N8N_ADMIN_EMAIL=<value>
# N8N_ADMIN_PASSWORD=<value>

# Test:
# 1. Create simple workflow (no-op trigger → log)
# 2. Execute workflow
# 3. Check execution history persists
# 4. Restart n8n container: docker restart n8n
# 5. Verify execution history is still there
```

#### Step 8: Commit to Git

```bash
cd /Users/davidkellam/workspace/portfolio

# Add new compose file
git add infra/n8n/docker-compose.yml

# Commit
git commit -m "Phase 1: Replace nginx with jwilder/nginx-proxy from syncbricks reference

- Fixes docker-gen label recognition issue
- Uses proven syncbricks/n8n configuration
- Pinned n8n:1.83.2 and postgres:16-alpine
- Includes n8n-import service for workflow restoration
- External HTTPS access now working"

# View changes
git log --oneline -3
```

---

### 1.4 New docker-compose.yml Template

**File**: `/infra/n8n/docker-compose.yml`

```yaml
# N8N Production Stack - SyncBricks Reference (Proven Setup)
# Fixed: Uses jwilder/nginx-proxy (not nginxproxy) to fix docker-gen issues

version: '3.8'

volumes:
  n8n_storage:
    driver: local
  postgres_storage:
    driver: local
  qdrant_storage:
    driver: local
  certs:
    driver: local
  acme:
    driver: local
  cloudflared_data:
    driver: local

networks:
  syncbricks:
    driver: bridge
  proxy:
    driver: bridge

services:
  # ============================================================================
  # REVERSE PROXY & SSL (Fixed - using jwilder, not nginxproxy)
  # ============================================================================

  nginx-proxy:
    image: jwilder/nginx-proxy  # FIXED: Original, proven version
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - certs:/etc/nginx/certs:ro
      - acme:/etc/acme.sh
    networks:
      - proxy

  acme-companion:
    image: nginxproxy/acme-companion:latest
    container_name: nginx-proxy-acme
    restart: unless-stopped
    depends_on:
      - nginx-proxy
    environment:
      - DEFAULT_EMAIL=${LETSENCRYPT_EMAIL:-admin@bestviable.com}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - certs:/etc/nginx/certs
      - acme:/etc/acme.sh
    networks:
      - proxy

  # ============================================================================
  # CLOUDFLARE TUNNEL
  # ============================================================================

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    networks:
      - proxy
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=${CF_TUNNEL_TOKEN}

  # ============================================================================
  # DATABASES (Backend only, not exposed)
  # ============================================================================

  postgres:
    image: postgres:16-alpine  # Lightweight Alpine version
    container_name: postgres
    restart: unless-stopped
    networks:
      - syncbricks
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-n8n}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB:-n8ndb}
    volumes:
      - postgres_storage:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-n8n} -d ${POSTGRES_DB:-n8ndb}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    ports:
      - "127.0.0.1:5432:5432"  # Only localhost access

  # ============================================================================
  # N8N WORKFLOW IMPORT (Optional - for restoring existing workflows)
  # ============================================================================

  n8n-import:
    image: n8nio/n8n:1.83.2
    container_name: n8n-import
    restart: "no"
    networks:
      - syncbricks
    environment:
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_USER=${POSTGRES_USER:-n8n}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB:-n8ndb}
    entrypoint: /bin/sh
    command:
      - "-c"
      - |
        echo "Waiting for database to be ready..."
        while ! nc -z postgres 5432; do
          sleep 1
        done
        echo "Database is ready. Attempting import..."
        n8n import:credentials --separate --input=/backup/credentials || true
        n8n import:workflow --separate --input=/backup/workflows || true
        echo "Import complete. Marking done..."
        mkdir -p /home/node/.n8n
        touch /home/node/.n8n/import_done
        exit 0
    volumes:
      - ./backup:/backup  # Expects backup/credentials/ and backup/workflows/
      - n8n_storage:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy

  # ============================================================================
  # N8N WORKFLOW ENGINE
  # ============================================================================

  n8n:
    image: n8nio/n8n:1.83.2  # Pinned version
    container_name: n8n
    restart: unless-stopped
    networks:
      - syncbricks
      - proxy
    environment:
      # Database
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_USER=${POSTGRES_USER:-n8n}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB:-n8ndb}

      # Diagnostics
      - N8N_DIAGNOSTICS_ENABLED=false
      - N8N_PERSONALIZATION_ENABLED=false

      # Security
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_USER_MANAGEMENT_JWT_SECRET=${N8N_JWT_SECRET}

      # Webhook URLs
      - WEBHOOK_URL=https://n8n.bestviable.com/

      # Nginx-proxy labels (now recognized by jwilder!)
      - VIRTUAL_HOST=n8n.bestviable.com
      - LETSENCRYPT_HOST=n8n.bestviable.com
      - LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL:-admin@bestviable.com}

      # Allow external calls to Qdrant
      - N8N_EXTERNAL_CALL_ALLOWED_HOSTS=qdrant

    depends_on:
      postgres:
        condition: service_healthy
      n8n-import:
        condition: service_completed_successfully

    entrypoint: /bin/sh
    command:
      - "-c"
      - |
        echo 'Waiting for dependencies...'
        while ! nc -z postgres 5432 || [ ! -f /home/node/.n8n/import_done ]; do
          sleep 1
        done
        echo 'Dependencies ready. Starting n8n...'
        sleep 5
        n8n

    volumes:
      - n8n_storage:/home/node/.n8n
      - ./backup:/backup
      - ./shared:/data/shared

    labels:
      - "com.github.jrcs.letsencrypt_nginx_proxy_companion.main=n8n.bestviable.com"

  # ============================================================================
  # QDRANT VECTOR DATABASE
  # ============================================================================

  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    restart: unless-stopped
    networks:
      - syncbricks
    ports:
      - "127.0.0.1:6333:6333"  # Only localhost access
    volumes:
      - qdrant_storage:/qdrant/storage
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s  # More generous timing (was 10s)
      timeout: 10s
      retries: 3
      start_period: 60s  # Increased (was 30s)
```

---

## Phase 2: MCP Servers with Direct Cloudflare Tunnel (1-2 hours)

### 2.1 Architecture: No nginx-proxy for MCP

**Why this approach:**
- ✅ Simpler (fewer containers)
- ✅ Cloudflare handles HTTPS termination
- ✅ Direct port routing (each MCP on own port)
- ✅ Easier to troubleshoot (fewer layers)
- ✅ Can add nginx-proxy layer later if needed

**How it works:**
```
Internet
    ↓
Cloudflare Tunnel
    ↓ (routes by hostname)
    ├→ coda-mcp.bestviable.com → localhost:8085 (HTTP)
    ├→ github-mcp.bestviable.com → localhost:8081 (HTTP)
    └→ firecrawl-mcp.bestviable.com → localhost:8084 (HTTP)
    ↓
MCP Containers (listen on localhost, no SSL needed)
```

### 2.2 MCP Server docker-compose.yml Template

**File**: `/infra/mcp-servers/docker-compose.yml`

```yaml
# MCP Servers - Direct Cloudflare Tunnel Routing
# No nginx-proxy layer. CF handles SSL. Services just need HTTP.

version: '3.8'

networks:
  mcp-network:
    driver: bridge

services:
  coda-mcp:
    image: custom/coda-mcp:latest
    container_name: coda-mcp
    restart: unless-stopped
    ports:
      - "127.0.0.1:8085:8080"  # Bind to localhost only
    environment:
      - CODA_API_TOKEN=${CODA_API_TOKEN}
      - NODE_ENV=production
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  github-mcp:
    image: custom/github-mcp:latest
    container_name: github-mcp
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:8080"
    environment:
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - NODE_ENV=production
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  firecrawl-mcp:
    image: custom/firecrawl-mcp:latest
    container_name: firecrawl-mcp
    restart: unless-stopped
    ports:
      - "127.0.0.1:8084:8080"
    environment:
      - FIRECRAWL_API_KEY=${FIRECRAWL_API_KEY}
      - NODE_ENV=production
    networks:
      - mcp-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  # Future: Add more MCP servers here as needed
```

### 2.3 Cloudflare Tunnel Configuration

In **Cloudflare Zero Trust Dashboard** → **Networks** → **Tunnels** → **portfolio**:

```
Public Hostnames:

Name: n8n
Type: HTTPS
URL: localhost:443
Subdomain: n8n.bestviable.com

---

Name: coda-mcp
Type: HTTP
URL: localhost:8085
Subdomain: coda-mcp.bestviable.com

---

Name: github-mcp
Type: HTTP
URL: localhost:8081
Subdomain: github-mcp.bestviable.com

---

Name: firecrawl-mcp
Type: HTTP
URL: localhost:8084
Subdomain: firecrawl-mcp.bestviable.com
```

### 2.4 Deployment Steps

```bash
# Create directory structure
mkdir -p /root/portfolio/infra/mcp-servers
cd /root/portfolio/infra/mcp-servers

# Copy docker-compose.yml from local
scp /Users/davidkellam/workspace/portfolio/infra/mcp-servers/docker-compose.yml \
  tools-droplet-agents:/root/portfolio/infra/mcp-servers/

# Copy .env with MCP secrets
scp /Users/davidkellam/workspace/portfolio/infra/config/.env.local \
  tools-droplet-agents:/root/portfolio/infra/mcp-servers/.env

# Deploy
docker-compose up -d

# Verify
docker ps | grep -E "(coda-mcp|github-mcp|firecrawl-mcp)"

# Test direct HTTP access (from droplet)
curl -k http://localhost:8085/health
curl -k http://localhost:8081/health
curl -k http://localhost:8084/health
```

### 2.5 Test CF Tunnel Access

```bash
# From local machine (outside droplet)
curl -k https://coda-mcp.bestviable.com/health
curl -k https://github-mcp.bestviable.com/health
curl -k https://firecrawl-mcp.bestviable.com/health

# Expected: 200 OK (if health endpoints exist)
```

---

## Future: Adding nginx-proxy to MCP Layer (If Needed)

**No changes needed now**, but for reference:

If later you need:
- Local HTTPS access to MCP servers
- Path-based routing (`/mcp/coda`, `/mcp/github`)
- TLS termination on droplet (not just CF)

Simply add nginx-proxy to mcp-servers/docker-compose.yml:

```yaml
  mcp-nginx-proxy:
    image: jwilder/nginx-proxy
    container_name: mcp-nginx-proxy
    restart: unless-stopped
    ports:
      - "8090:80"
      - "8443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - ./certs:/etc/nginx/certs:ro
    networks:
      - mcp-network
```

Then update Cloudflare routing to point to these ports instead of direct container ports.

**No rebuild needed** - just add service and re-route.

---

## Verification Checklist - Phase 1 Complete

- [ ] All 6 services healthy: `docker ps`
- [ ] nginx config has n8n upstream: `docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 5 "upstream n8n"`
- [ ] HTTPS access works: `curl -k https://n8n.bestviable.com` (expect 200 or login)
- [ ] N8N UI accessible: browser to https://n8n.bestviable.com
- [ ] Database persists: create workflow, restart n8n, verify workflow still there
- [ ] Cloudflare tunnel active: `docker logs cloudflared --tail 5`
- [ ] New compose file committed to git

---

## Verification Checklist - Phase 2 Complete

- [ ] MCP services running: `docker ps`
- [ ] Direct HTTP access: `curl http://localhost:8085/health` (from droplet)
- [ ] CF HTTPS access: `curl https://coda-mcp.bestviable.com` (from local)
- [ ] All 3+ MCP endpoints responding
- [ ] Compose file in git

---

## Troubleshooting During Deployment

### n8n stuck waiting for import_done

```bash
# Check n8n-import logs
docker logs n8n-import

# If stuck, you can manually create the marker
docker exec n8n-import touch /home/node/.n8n/import_done

# Then restart n8n
docker restart n8n
```

### nginx still returns 503

```bash
# Check docker-gen recognized the labels
docker inspect n8n --format '{{json .Config.Labels}}'

# Check nginx logs
docker logs nginx-proxy | grep -i n8n

# If labels are there but nginx config doesn't have upstream:
# This would indicate the issue persists with jwilder too
# In that case, escalate to manual nginx config or Traefik replacement
```

### Qdrant shows unhealthy

```bash
# This is likely just timing - check if it works anyway
curl http://localhost:6333/health

# If it works, the service is healthy despite status report
# Just the health check is too aggressive
```

---

## Rollback Plan (If Something Goes Wrong)

```bash
# Restore from backup
cd /root/portfolio/infra/n8n
docker-compose down -v

# Restore database
docker run --rm -it -v portfolio_postgres_storage:/var/lib/postgresql/data \
  -v /tmp/n8n_backup.sql:/backup.sql postgres:16-alpine \
  pg_restore -U n8n -d n8ndb /backup.sql

# Restore n8n config
docker run --rm -it -v portfolio_n8n_storage:/home/node/.n8n \
  -v /tmp/n8n_config.tar.gz:/backup.tar.gz alpine:latest \
  tar xzf /backup.tar.gz -C /

# Deploy original compose file
git checkout infra/n8n/docker-compose.yml
docker-compose up -d
```

---

## Success Criteria

### Phase 1 Success
- ✅ New jwilder/nginx-proxy deployed
- ✅ n8n accessible via HTTPS (no 503 errors)
- ✅ All services healthy
- ✅ Workflows persist across restarts
- ✅ Code committed to git

### Phase 2 Success
- ✅ MCP servers deployed in separate stack
- ✅ Each accessible via own hostname
- ✅ CF tunnel routing working
- ✅ No nginx-proxy in MCP layer (simpler)
- ✅ Option to add nginx-proxy later documented

---

## Next Steps

1. **User confirms**: Ready to execute?
2. **Execute Phase 1**: Deploy new n8n stack
3. **Test Phase 1**: Verify everything works
4. **Execute Phase 2**: Deploy MCP servers (separate sprint)

---

**Document Version**: 1.0 (Approved)
**Last Updated**: 2025-11-02
**Status**: Ready for Phase 1 execution
