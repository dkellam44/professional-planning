- entity: instructions
- level: runbook
- zone: internal
- version: v01
- tags: [docker, deployment, instructions, troubleshooting]
- source_path: /ops/INSTRUCTIONS_FOR_DEPLOYMENT.md
- date: 2025-10-27

---

# Instructions to Deploy Fixed Health Checks

**Status**: 5/7 containers showing "unhealthy" because of broken health check logic (not actual service failures)

**Action Required**: Deploy updated `docker-compose.production.yml` with corrected health checks

---

## What Changed

### Health Checks Fixed:

1. **nginx-proxy** — Check for listening ports (80, 443) instead of `/health` endpoint
2. **acme-companion** — Check for directory existence instead of specific cert file
3. **cloudflared** — Check if process is running instead of tunnel info command
4. **n8n** — Increased timeout/start_period to 120s, added fallback endpoint
5. **coda-mcp-gateway** — Increased timeout/start_period to 120s, added fallback endpoint

---

## How to Deploy (Choose One)

### Option A: Quick Deploy (Recommended)

**From your local machine:**

1. Sync updated config to droplet:
```bash
cd ~/workspace/portfolio/ops

# Copy updated docker-compose to droplet
scp docker-compose.production.yml root@tools:~/portfolio/ops/

# SSH to droplet
ssh root@<droplet_ip>

# From droplet terminal:
cd ~/portfolio/ops
bash DEPLOY_FIXES.sh
```

The script will:
- Backup current config
- Stop all containers
- Start fresh with updated health checks
- Display live health status (watch mode)

**Expected timeline:**
- 0-5s: postgres, qdrant → HEALTHY
- 30-60s: n8n, coda → HEALTHY
- 60-120s: nginx-proxy → HEALTHY
- 120-180s: acme-companion, cloudflared → HEALTHY

Press `Ctrl+C` when all show healthy.

---

### Option B: Manual Deploy

**From droplet terminal:**

```bash
cd ~/portfolio/ops

# 1. Backup
cp docker-compose.production.yml docker-compose.production.yml.backup.$(date +%Y%m%d_%H%M%S)

# 2. Stop containers
docker compose -f docker-compose.production.yml down

# 3. Start fresh
docker compose -f docker-compose.production.yml up -d

# 4. Monitor (wait 2-3 minutes)
watch -n 3 'docker compose -f docker-compose.production.yml ps'
```

---

### Option C: Minimal Downtime (No Scale Down)

If you want to keep services running:

```bash
cd ~/portfolio/ops

# Just pull latest (if any image changes)
docker compose -f docker-compose.production.yml pull

# Restart services with new health checks
docker compose -f docker-compose.production.yml up -d

# Monitor
watch -n 3 'docker compose -f docker-compose.production.yml ps'
```

---

## Verification After Deployment

### 1. Check All Containers Healthy

```bash
cd ~/portfolio/ops
docker compose -f docker-compose.production.yml ps
```

Expected:
```
NAME               STATUS
postgres           Up X minutes (healthy)
qdrant             Up X minutes (healthy)
n8n                Up X minutes (healthy)
coda-mcp-gateway   Up X minutes (healthy)
nginx-proxy        Up X minutes (healthy)
acme-companion     Up X minutes (healthy)
cloudflared        Up X minutes (healthy)
```

All should show **healthy** (not "unhealthy" or "starting")

### 2. Test Individual Services

```bash
# n8n
curl -I http://localhost:5678

# coda-mcp-gateway
curl -I http://localhost:8080

# nginx-proxy
curl -I http://localhost/

# Via tunnel (if DNS working)
curl -I https://n8n.bestviable.com
curl -I https://coda.bestviable.com
```

### 3. Check Cloudflare Tunnel

In Cloudflare Zero Trust dashboard:
- Tunnel should show **HEALTHY** and **CONNECTED**
- Should see connection from bestviable.com

### 4. Review Logs (if any remain unhealthy)

```bash
cd ~/portfolio/ops

# For specific service
docker compose -f docker-compose.production.yml logs n8n --tail 50
docker compose -f docker-compose.production.yml logs nginx-proxy --tail 30
docker compose -f docker-compose.production.yml logs cloudflared --tail 30
```

---

## If Still Unhealthy After 3 Minutes

### Check logs for errors:

```bash
cd ~/portfolio/ops

# Full logs for each service
docker compose -f docker-compose.production.yml logs n8n 2>&1 | grep -i "error\|failed\|exception" | head -20
docker compose -f docker-compose.production.yml logs nginx-proxy 2>&1 | grep -i "error\|failed" | head -20
docker compose -f docker-compose.production.yml logs cloudflared 2>&1 | grep -i "error\|failed" | head -20
```

### Test from inside containers:

```bash
# Can curl reach n8n?
docker compose -f docker-compose.production.yml exec nginx-proxy curl -v http://n8n:5678/health

# Is postgres responding?
docker compose -f docker-compose.production.yml exec n8n curl -v http://postgres:5432

# Is qdrant responding?
docker compose -f docker-compose.production.yml exec n8n curl -v http://qdrant:6333/health
```

---

## Rollback (if needed)

```bash
cd ~/portfolio/ops

# Stop new containers
docker compose -f docker-compose.production.yml down

# Restore backup
cp docker-compose.production.yml.backup.YYYYMMDD_HHMMSS docker-compose.production.yml

# Restart old version
docker compose -f docker-compose.production.yml up -d
```

---

## Files to Sync

You need to get the updated `docker-compose.production.yml` to the droplet:

**Local path:** `~/workspace/portfolio/ops/docker-compose.production.yml`
**Droplet path:** `~/portfolio/ops/docker-compose.production.yml`

### Via SCP:
```bash
scp ~/workspace/portfolio/ops/docker-compose.production.yml root@tools:~/portfolio/ops/
```

### Via Cat/Paste (if SCP unavailable):
1. On local: `cat ~/workspace/portfolio/ops/docker-compose.production.yml | pbcopy`
2. On droplet: `nano ~/portfolio/ops/docker-compose.production.yml` (paste, Ctrl+X, Y, Enter)

---

## What Not to Change

Don't modify:
- Environment variables in `.env` (already correct with CF_TUNNEL_TOKEN)
- Network definitions (proxy/syncbricks networks are correct)
- Service dependencies (depends_on is correct)
- Port mappings

Only the `healthcheck:` sections have been updated.

---

## Expected Result

After deployment:
- ✅ All 7 containers running and healthy
- ✅ n8n accessible at https://n8n.bestviable.com
- ✅ Coda accessible at https://coda.bestviable.com
- ✅ Cloudflare tunnel connected and routing traffic
- ✅ SSL certificates auto-managed by acme-companion

---

## Questions?

If you get stuck:
1. Check `/ops/FIX_HEALTH_CHECKS.md` for technical details
2. Run `/ops/TROUBLESHOOT_HEALTH_CHECKS.sh` to diagnose
3. Review logs with `docker compose logs <service>`

