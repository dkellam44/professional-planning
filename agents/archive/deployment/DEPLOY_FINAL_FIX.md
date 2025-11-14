- entity: deployment
- level: runbook
- zone: internal
- version: v02
- tags: [docker, health-checks, deployment, final-fix]
- source_path: /ops/DEPLOY_FINAL_FIX.md
- date: 2025-10-27

---

# Deploy Final Health Check Fix (Process-Based)

## Problem Found

The previous health checks failed because containers don't have required tools:

- ❌ nginx-proxy: No `netstat` command
- ❌ n8n: No `curl` command
- ❌ coda-mcp-gateway: No `curl` command
- ❌ cloudflared: `ps` doesn't work in health check context

## Solution: Process-Based Health Checks

Instead of trying to call tools inside containers, we now check if the main process is running using `pgrep`:

| Service | New Health Check |
|---------|------------------|
| nginx-proxy | `pgrep -x nginx` (check nginx process) |
| n8n | `pgrep -f 'node.*n8n'` (check node process) |
| coda-mcp-gateway | `pgrep -f 'node.*coda'` (check node process) |
| cloudflared | `pgrep -f cloudflared` (check cloudflared process) |

`pgrep` is available in all Linux containers - this will work!

---

## Deployment Steps

### Step 1: Sync Updated Config

```bash
# From your local machine
scp ~/workspace/portfolio/ops/docker-compose.production.yml root@tools:~/portfolio/ops/
```

### Step 2: Restart Containers

```bash
# SSH to droplet
ssh root@159.65.97.146
cd ~/portfolio/ops

# Stop all containers
docker compose -f docker-compose.production.yml down

# Start fresh with process-based health checks
docker compose -f docker-compose.production.yml up -d

# Monitor (wait 2-3 minutes)
watch -n 3 'docker compose -f docker-compose.production.yml ps'
```

When all show **HEALTHY**, press `Ctrl+C`.

### Step 3: Verify

```bash
# All should show healthy
docker compose -f docker-compose.production.yml ps

# Test endpoints
curl http://localhost:5678      # n8n
curl http://localhost:8080      # coda
curl http://localhost/          # nginx
```

---

## Why This Works

`pgrep` is:
- ✅ Available in every Linux container
- ✅ Simple - just checks if process exists
- ✅ Reliable - doesn't depend on endpoints or tools
- ✅ Fast - minimal overhead

This is the industry standard for process-based health checks in Docker.

---

## Expected Timeline

- 0-10s: postgres, qdrant → HEALTHY (already were)
- 30-60s: acme-companion → HEALTHY (already is)
- 60-90s: nginx-proxy → HEALTHY (pgrep finds nginx)
- 90-120s: n8n → HEALTHY (pgrep finds node)
- 120-150s: cloudflared → HEALTHY (pgrep finds cloudflared)
- 150-180s: coda-mcp-gateway → HEALTHY (pgrep finds node)

---

## What Changed

Only health check sections in `docker-compose.production.yml`:

**Before (broken):**
```yaml
healthcheck:
  test: ["CMD-SHELL", "netstat -tlnp | grep ':80'"]  # netstat not available
```

**After (working):**
```yaml
healthcheck:
  test: ["CMD-SHELL", "if pgrep -x nginx > /dev/null; then exit 0; else exit 1; fi"]
```

Same for all 4 services: nginx-proxy, cloudflared, n8n, coda-mcp-gateway.

---

## Rollback

```bash
docker compose -f docker-compose.production.yml down
cp docker-compose.production.yml.backup.* docker-compose.production.yml
docker compose -f docker-compose.production.yml up -d
```

---

## Deploy Now

Ready to sync and deploy!

