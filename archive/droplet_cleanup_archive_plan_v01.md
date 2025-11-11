---
entity: playbook
level: operational
zone: infrastructure
version: "0.1"
tags: [droplet, cleanup, archive, maintenance, syncbricks]
source_path: agents/context/playbooks/droplet_cleanup_archive_plan_v01.md
date: 2025-10-31
author: claude-code
related:
  - docs/infrastructure/droplet_state_2025-10-28.md
  - docs/ops/docker-compose.production.yml
status: draft
---

# Droplet Cleanup and Archive Plan

## Purpose

Define what to archive/backup and what to clean up on the droplet after successful HTTP-native MCP deployment. Keep the droplet lean and well-organized.

## Current State Assessment

### What's Running (After HTTP-Native Deployment)

```
Production Services (SyncBricks):
- nginx-proxy (reverse proxy)
- acme-companion (SSL certificates)
- postgres (database)
- n8n (workflow automation)
- qdrant (vector database)
- cloudflared (Cloudflare Tunnel)
- coda-mcp (HTTP-native MCP server) ← NEW SIMPLIFIED VERSION
```

### What Gets Removed

```
Deprecated Services:
- coda-mcp-gateway (HTTP wrapper) ← REMOVE
  - Location: /root/portfolio/integrations/mcp/servers/coda/gateway/
  - Reason: Replaced by HTTP-native Coda MCP server
  - Action: Archive code, remove from docker-compose
```

## Archive Strategy

### 1. Gateway Code Archive

**What to Archive:**
```
/root/portfolio/integrations/mcp/servers/coda/gateway/
├── src/
│   ├── server.ts              ← Stdio bridge implementation
│   ├── auth/
│   │   ├── auth-store.ts      ← OAuth code storage (reused)
│   │   ├── oauth-routes.ts    ← OAuth endpoints (reused)
│   │   └── oauth-discovery.ts ← Discovery metadata (reused)
│   ├── middleware/
│   │   ├── token-validation.ts
│   │   └── rate-limit.ts
│   ├── utils/
│   │   └── audit-logger.ts
│   └── views/
│       └── authorize.html     ← OAuth UI (reused)
├── dist/                      ← Built code (can delete)
├── Dockerfile                 ← Can delete
├── package.json
└── tsconfig.json
```

**Archive Location:**
```bash
# Create archive directory
mkdir -p /root/portfolio/z_archive/mcp/gateway/

# Move gateway code
mv /root/portfolio/integrations/mcp/servers/coda/gateway/ \
   /root/portfolio/z_archive/mcp/gateway/coda-gateway-stdio-bridge_2025-10-31/

# Create archive README
cat > /root/portfolio/z_archive/mcp/gateway/README.md << 'EOF'
# MCP Gateway Archive

## Archived: 2025-10-31

This directory contains the deprecated stdio-to-HTTP gateway wrapper approach.

## Why Archived

Replaced by HTTP-native MCP server implementation which:
- Eliminates stdio bridge complexity
- Integrates OAuth directly into MCP server
- Simplifies architecture (one process vs two)
- Reduces maintenance burden

## What Was Reused

From this gateway, the following components were copied into HTTP-native server:
- src/auth/auth-store.ts → OAuth code storage
- src/auth/oauth-routes.ts → OAuth endpoints
- src/auth/oauth-discovery.ts → OAuth metadata
- src/views/authorize.html → OAuth UI

## Related Documentation

- agents/context/playbooks/http_native_mcp_server_v01.md (new approach)
- agents/context/playbooks/coda_mcp_oauth_implementation_v01.md (original OAuth work)

## Restore If Needed

If HTTP-native approach fails and rollback to gateway is needed:
1. Copy this directory back to /root/portfolio/integrations/mcp/servers/coda/gateway/
2. Restore docker-compose service definition
3. Rebuild and redeploy

See: agents/context/playbooks/http_native_mcp_server_v01.md → Rollback Plan
EOF
```

### 2. Docker Build Artifacts

**Clean up old images:**
```bash
# List images
docker images | grep coda

# Remove old gateway images
docker rmi portfolio-coda-mcp-gateway:latest || true
docker rmi $(docker images -f "dangling=true" -q) || true

# Keep only current coda-mcp image
docker images | grep coda-mcp
```

### 3. Log Files and Temporary Data

**What to Clean:**
```bash
# Old container logs (if not using docker logging driver)
rm -rf /var/lib/docker/containers/*/coda-mcp-gateway-*

# Temporary build files
rm -rf /root/portfolio/integrations/mcp/servers/coda/gateway/dist/
rm -rf /root/portfolio/integrations/mcp/servers/coda/gateway/node_modules/
```

### 4. Configuration Files

**Archive old docker-compose versions:**
```bash
# Create archive for docker-compose history
mkdir -p /root/portfolio/z_archive/infrastructure/docker-compose/

# Archive current version before updating
cp /root/portfolio/infra/config/docker-compose.production.yml \
   /root/portfolio/z_archive/infrastructure/docker-compose/docker-compose.production_gateway-mode_2025-10-31.yml

# Add README
cat > /root/portfolio/z_archive/infrastructure/docker-compose/README.md << 'EOF'
# Docker Compose Archive

Historical versions of docker-compose.production.yml

## Versions

- docker-compose.production_gateway-mode_2025-10-31.yml
  - Two-service approach: coda-mcp (stdio) + coda-mcp-gateway (HTTP wrapper)
  - Deprecated: 2025-10-31
  - Reason: Replaced by HTTP-native single-service approach
EOF
```

## Cleanup Procedures

### Post-Deployment Cleanup Checklist

**After successful HTTP-native deployment and testing:**

```bash
# 1. Verify new service is healthy
docker compose -f /root/portfolio/infra/config/docker-compose.production.yml ps
docker compose -f /root/portfolio/infra/config/docker-compose.production.yml logs coda-mcp

# 2. Test endpoints
curl https://coda.bestviable.com/health
curl https://coda.bestviable.com/.well-known/oauth-authorization-server

# 3. Test ChatGPT connector (manual)
# - Connect to https://coda.bestviable.com/mcp
# - Complete OAuth flow
# - Execute test tool call

# 4. If all tests pass, proceed with cleanup

# 5. Archive gateway code
mkdir -p /root/portfolio/z_archive/mcp/gateway/
mv /root/portfolio/integrations/mcp/servers/coda/gateway/ \
   /root/portfolio/z_archive/mcp/gateway/coda-gateway-stdio-bridge_2025-10-31/

# 6. Archive old docker-compose
mkdir -p /root/portfolio/z_archive/infrastructure/docker-compose/
cp /root/portfolio/infra/config/docker-compose.production.yml \
   /root/portfolio/z_archive/infrastructure/docker-compose/docker-compose.production_gateway-mode_2025-10-31.yml

# 7. Clean Docker images
docker image prune -f

# 8. Verify disk space
df -h
du -sh /root/portfolio/z_archive/

# 9. Commit changes
cd /root/portfolio
git add .
git commit -m "Archive gateway wrapper, deploy HTTP-native MCP server"
git push
```

## Backup Strategy

### What to Backup (Before Changes)

**Critical data:**
```bash
# 1. Current working docker-compose
cp /root/portfolio/infra/config/docker-compose.production.yml \
   /root/portfolio/infra/config/docker-compose.production.yml.backup

# 2. Environment variables (if any secrets)
cp /root/portfolio/infra/config/.env \
   /root/portfolio/infra/config/.env.backup

# 3. Database (if n8n has critical workflows)
docker exec postgres pg_dump -U n8n n8n > /root/portfolio/z_archive/backups/n8n_$(date +%Y%m%d).sql

# 4. Cloudflare Tunnel config (already in docker-compose)
# No additional backup needed (tunnel token in env)
```

### Restore Points

**If rollback needed:**
```bash
# Restore docker-compose
cp /root/portfolio/z_archive/infrastructure/docker-compose/docker-compose.production_gateway-mode_2025-10-31.yml \
   /root/portfolio/infra/config/docker-compose.production.yml

# Restore gateway code
cp -r /root/portfolio/z_archive/mcp/gateway/coda-gateway-stdio-bridge_2025-10-31/ \
      /root/portfolio/integrations/mcp/servers/coda/gateway/

# Rebuild and restart
docker compose -f /root/portfolio/infra/config/docker-compose.production.yml build
docker compose -f /root/portfolio/infra/config/docker-compose.production.yml up -d
```

## Long-Term Archival

### Keep Forever
- `/root/portfolio/z_archive/` - All archived code and configs
- Git repository - All commits and history
- Documentation in `/agents/context/playbooks/`

### Can Delete After 90 Days
- Old Docker images (if archived code exists)
- Build artifacts (node_modules, dist folders)
- Logs older than 30 days

### Automated Cleanup Script

```bash
#!/bin/bash
# /root/portfolio/scripts/cleanup_old_archives.sh

# Remove build artifacts from archives
find /root/portfolio/z_archive -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null
find /root/portfolio/z_archive -type d -name "dist" -exec rm -rf {} + 2>/dev/null

# Remove Docker images not used in 30 days
docker image prune -a --filter "until=720h" -f

# Compress archives older than 90 days
find /root/portfolio/z_archive -type d -mtime +90 -exec tar -czf {}.tar.gz {} \; -exec rm -rf {} \;

echo "Cleanup complete. Disk usage:"
df -h /root/portfolio
```

## Monitoring and Alerts

### Disk Space Monitoring

```bash
# Add to crontab
0 0 * * * df -h / | awk '$5 > 80 {print "WARNING: Disk usage at "$5}' | mail -s "Droplet Disk Alert" admin@example.com
```

### Archive Size Tracking

```bash
# Check archive growth
du -sh /root/portfolio/z_archive/
ls -lhrt /root/portfolio/z_archive/
```

## Success Criteria

**Cleanup is successful when:**
- ✅ HTTP-native MCP server is running and tested
- ✅ Gateway code is archived with README
- ✅ Old docker-compose is archived
- ✅ Docker images are pruned
- ✅ Disk space is adequate (< 70% usage)
- ✅ All changes are committed to git
- ✅ Rollback procedure is documented and tested

## Related Documentation

- `http_native_mcp_server_v01.md` - Implementation guide
- `droplet_state_2025-10-28.md` - Current infrastructure state
- `syncbricks_solution_breakdown_v1.md` - SyncBricks architecture

---

**Status:** Ready for execution after HTTP-native deployment
**Next Steps:** Deploy HTTP-native server, test thoroughly, execute cleanup
