- entity: session
- level: handoff
- zone: internal
- version: v01
- tags: [infrastructure, deployment, troubleshooting, docker, cloudflare]
- source_path: /SESSION_HANDOFF_2025-10-27.md
- date: 2025-10-27

---

# Session Handoff — Docker Deployment Troubleshooting (2025-10-27)

## Current Status

**Objective**: Deploy SyncBricks infrastructure (n8n + Coda MCP Gateway) on DigitalOcean droplet

**Progress**: 70% — Core infrastructure mostly working, debugging environment variable loading issue

---

## What's Working ✅

- ✅ nginx-proxy container starting (reverse proxy auto-discovery functional)
- ✅ postgres container healthy and accepting connections
- ✅ acme-companion running and watching for SSL certificate needs
- ✅ docker-compose.production.yml syntax valid (3 fixes already applied)
- ✅ All 3 recent fixes committed locally (see git log):
  - `a37cc26` - Removed duplicate labels from n8n and coda-mcp-gateway
  - `a6bcb63` - Removed nginx.conf mount conflict
  - `fb80959` - Replaced curl with wget in health checks
  - `32d88b0` - Replaced wget with file-based health check for qdrant

---

## What's Broken ❌

### Issue 1: Cloudflared Token Not Recognized (CRITICAL)

**Symptom**:
```
cloudflared  | Provided Tunnel token is not valid.
```

**Root Cause**: Unknown — token is correct in .env but cloudflared container not receiving it

**Diagnosis Status**: Partially complete
- ✅ Verified CF_TUNNEL_TOKEN in .env is correct (long base64 string)
- ✅ Docker-compose syntax using `${CF_TUNNEL_TOKEN}` is correct
- ❓ Unknown: Is .env file being loaded by docker-compose?

**Next Step**: Run diagnostic commands on droplet:
```bash
ssh root@tools
cd ~/portfolio/ops

# Check .env content
cat .env

# Check what cloudflared container sees
docker exec cloudflared env | grep -i tunnel

# Check if postgres sees password (proves .env loading)
docker exec postgres env | grep -i password
```

**Possible Solutions**:
1. If cloudflared has empty TUNNEL_TOKEN but postgres has password → .env loading issue
   - Fix: Use explicit `docker compose --env-file .env -f docker-compose.production.yml up -d`
2. If both are empty → docker-compose not loading .env
   - Fix: Create `.env.production` or ensure `.env` exists in correct directory
3. If both have values → Token format/content issue
   - Fix: Get new token from Cloudflare Zero Trust dashboard

### Issue 2: Qdrant Health Check Fixed ✅

**Was**: Using `curl` command (not available in qdrant image)
**Now**: Using file existence check `test -f /qdrant/storage/raft_state.json`
**Status**: Ready to test on redeploy

### Issue 3: n8n & coda-mcp-gateway Not Started Yet

**Why**: Depend on other services being healthy
**Status**: Will start once qdrant and postgres are healthy

---

## Files Modified in This Session

### Local (~/workspace/portfolio/)
1. **ops/docker-compose.production.yml**
   - Removed: `version: '3.8'` (deprecated)
   - Removed: `./nginx.conf:/etc/nginx/nginx.conf:ro` mount (conflict)
   - Removed: Duplicate labels on n8n and coda-mcp-gateway
   - Removed: `depends_on` cycle between nginx-proxy and acme-companion
   - Fixed: Health checks (wget → file-based for qdrant)
   - Status: 4 commits applied, ready to deploy

2. **PORTS.md** (NEW)
   - Complete port mapping documentation
   - Network isolation explanation
   - Troubleshooting guide

3. **DROPLET_SYNC_INSTRUCTIONS.md** (NEW)
   - Manual sync procedures (SCP or cat/paste)
   - Validation steps
   - Rollback procedures

---

## Current Droplet State

**Location**: `~/portfolio/ops/` on root@tools
**Last Action**: Attempted deploy with fixed docker-compose.production.yml

**Container Status** (from last `docker compose ps`):
```
nginx-proxy       Up, unhealthy (waiting for acme-companion)
acme-companion    Up, unhealthy (no certificates to issue yet)
cloudflared       Restarting with 255 exit (token issue)
postgres          Up, healthy ✅
qdrant            Up, unhealthy (health check was using curl, now fixed)
n8n               Not started (depends on qdrant health)
coda-mcp-gateway  Not started (depends on postgres + qdrant)
```

**Data Preserved**:
- ✅ `data/postgres/` — database initialized and persisted
- ✅ `data/qdrant/` — qdrant storage with raft_state.json
- ✅ `data/n8n/` — n8n workflows preserved
- ✅ `certs/` — SSL certificate directory

**Legacy Files Still Present** (safe to ignore):
- `nginx.conf` (no longer mounted)
- `docker-compose.example.yml` (reference only)
- `infra/` directory (old Caddy setup, separate repo)

---

## Next Session: Immediate Actions

### Step 1: Diagnose Environment Variable Loading (5 min)

```bash
ssh root@tools
cd ~/portfolio/ops

# Run these diagnostics
echo "=== Check .env ==="
cat .env | head -10

echo -e "\n=== Check cloudflared env ==="
docker exec cloudflared env | grep -i tunnel || echo "NO TUNNEL_TOKEN"

echo -e "\n=== Check postgres env (proves .env loading) ==="
docker exec postgres env | grep -i password || echo "NO PASSWORD"

echo -e "\n=== Check if docker-compose loads .env ==="
docker compose config 2>&1 | grep -i "cf_tunnel_token" || echo "NOT IN CONFIG"
```

### Step 2: Fix Environment Loading (If Needed)

**If diagnostics show .env not being loaded:**

Option A: Explicit env file flag
```bash
docker compose --env-file .env -f docker-compose.production.yml down
docker compose --env-file .env -f docker-compose.production.yml up -d
```

Option B: Ensure .env exists and is in correct location
```bash
cd ~/portfolio/ops
ls -la .env  # Should exist and have readable permissions
```

### Step 3: Copy Fixed docker-compose to Droplet

```bash
# From local machine
scp ~/workspace/portfolio/ops/docker-compose.production.yml root@tools:~/portfolio/ops/

# Then on droplet
ssh root@tools
cd ~/portfolio/ops
docker compose down
docker compose up -d
sleep 30
docker compose ps
```

### Step 4: Verify All Services Healthy

```bash
docker compose ps
# Should show:
# nginx-proxy       healthy
# acme-companion    healthy
# cloudflared       healthy
# postgres          healthy
# qdrant            healthy
# n8n               healthy
# coda-mcp-gateway  healthy
```

### Step 5: Test Services

```bash
# Check tunnel connection
curl -s http://localhost/health

# Test n8n endpoint
curl -I https://n8n.bestviable.com

# Test coda endpoint
curl -I https://coda.bestviable.com

# Check Cloudflare dashboard
# Should show tunnel HEALTHY and connected
```

---

## Key Documents for Reference

**Local Portfolio** (`~/workspace/portfolio/`):
- `docs/infrastructure/syncbricks_solution_breakdown_v1.md` — Architecture patterns
- `docs/infrastructure/cloudflare_tunnel_token_guide_v1.md` — Token setup & ops
- `ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md` — One-page deployment reference
- `PORTS.md` — Port mapping and network design
- `DROPLET_SYNC_INSTRUCTIONS.md` — Manual sync procedures

**Recent Commits** (in order):
1. `c29eee5` - Deploy: SyncBricks infrastructure documentation
2. `2dfd6b9` - Update: Agent context & architecture
3. `a37cc26` - Fix: Remove duplicate labels and dependency cycle
4. `dc7f6fd` - Add: Infrastructure port mapping and sync docs
5. `a6bcb63` - Fix: Remove nginx.conf mount
6. `fb80959` - Fix: Replace curl with wget in health checks
7. `32d88b0` - Fix: Use file-based health check for qdrant

---

## Known Issues & Workarounds

### qdrant Health Check
- **Issue**: No curl/wget in qdrant container
- **Status**: FIXED (using file-based check)
- **Workaround**: N/A (already fixed)

### nginx-proxy/acme-companion Health Checks
- **Changed from**: `curl -f http://localhost/health`
- **Changed to**: `wget --quiet --tries=1 --spider http://localhost/health`
- **Status**: Deployed, ready to test

### Cloudflared Token Loading
- **Issue**: Container not seeing CF_TUNNEL_TOKEN
- **Status**: UNDER INVESTIGATION
- **Workaround**: Explicitly specify `--env-file .env` flag

---

## Deferred Items

**Not Done (Postponed for Later)**:
- [ ] GitHub repo reorganization (infra-n8n setup) — Deferred until deployment working
- [ ] Deploy key configuration for GitHub — Skipped due to GitHub API issues
- [ ] Monitoring & alerting setup — Post-deployment task
- [ ] n8n workflows configuration — Depends on n8n being healthy
- [ ] Coda integration setup — Depends on coda-mcp-gateway being healthy

---

## How to Continue

1. **Read this handoff first** (you're reading it)
2. **Review recent commits** (git log shows 7 changes made)
3. **Run diagnostics** (environment variable loading check)
4. **Apply fixes if needed** (--env-file flag or .env verification)
5. **Redeploy** (docker compose down/up)
6. **Verify health** (docker compose ps should show all healthy)
7. **Test endpoints** (curl https://n8n.bestviable.com and https://coda.bestviable.com)

---

## Emergency Rollback

If deployment fails catastrophically:

```bash
ssh root@tools
cd ~/portfolio/ops
docker compose down -v  # Remove all volumes
rm -rf data/certs/vhost.d/html/acme/  # Clean Docker config
# Backup .env first if needed
# Restore from previous backup in ~/backups/
```

---

## Contact Points

- **Local repo**: ~/workspace/portfolio/
- **Droplet location**: ~/portfolio/ops/ (root@tools)
- **Remote repo**: https://github.com/dkellam44/professional-planning (main)
- **Infra repo**: https://github.com/dkellam44/infra-n8n (private, legacy structure)

---

**Last Updated**: 2025-10-27 06:45 UTC
**Session Duration**: ~2 hours
**Commits Made**: 7
**Files Modified**: 4 (docker-compose.production.yml, PORTS.md, DROPLET_SYNC_INSTRUCTIONS.md, SESSION_HANDOFF_2025-10-27.md)
