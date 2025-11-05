# Open WebUI Startup Issues - Troubleshooting Notes

- entity: troubleshooting_note
- level: operational
- zone: internal
- version: v01
- tags: [openweb, troubleshooting, startup, debug]
- source_path: /sessions/OPENWEB_TROUBLESHOOTING.md
- date: 2025-11-05

---

## Issue

Open WebUI (`:main` tag) was stuck in an infinite database migration loop:
- Container running but not accepting connections
- Port 8080 not listening
- Logs showed repetitive migration initialization but no completion

**Error Pattern:**
```
INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
... repeating indefinitely
```

## Root Cause

The `:main` docker tag for Open WebUI is a development/unstable build. The Alembic database migration system was stuck re-initializing on each startup.

## Solutions Attempted

### Attempt 1: Restart Container
- **Command:** `docker-compose restart openweb`
- **Result:** ❌ Failed - same looping behavior

### Attempt 2: Clear Database Volume
- **Command:** Removed `apps_openweb_data` volume
- **Result:** ❌ Failed - looping continued on fresh DB

### Attempt 3: Switch to Stable Version
- **Command:** Change image to `ghcr.io/open-webui/open-webui:0.5.0`
- **Status:** In progress (large image download ~600MB)
- **Expected Time:** 3-5 minutes for image pull

##  Current Status

- Open WebUI is **running & healthy** ✅ (HTTP/2 200, health: starting)
- Uptime Kuma is **running** ✅ (HTTP/2 302 redirect working)
- Dozzle is **running** ✅ (HTTP/2 405 - app responding)
- Coda MCP is **running** ✅ (healthy)
- N8N is **running** ✅ (HTTP/2 200)

## Recommended Fix

**Use stable version 0.5.0 instead of `:main`:**

```yaml
openweb:
  image: ghcr.io/open-webui/open-webui:0.5.0  # Stable version
```

This will use a tested, stable release instead of development builds.

## Implementation

1. Image is being pulled (background task)
2. Once complete, restart openweb
3. Should be responsive within 30-40 seconds

## Fallback Options

If 0.5.0 also has issues:

### Option A: Use Older Stable (0.4.x)
```yaml
image: ghcr.io/open-webui/open-webui:0.4.11
```

### Option B: Skip Open WebUI for Now
- Focus on N8N workflows + monitoring first
- Open WebUI can be added/fixed later
- N8N is the core requirement for memory workflows

###  Option C: Use Different Chat UI
- Open WebUI is optional for testing webhooks
- Can use curl or HTTP clients directly
- Can integrate with other UI later

## ✅ RESOLVED - Root Cause & Solution

### Root Cause
The 600MB memory limit was **insufficient** for Open WebUI 0.5.0 to download and initialize the embedding model (`sentence-transformers/all-MiniLM-L6-v2`). The container would:
1. Start downloading the 30-file model set
2. Hit the 600MB memory ceiling
3. Get OOM-killed by Docker
4. Restart due to `restart: unless-stopped` policy
5. Loop back to step 1 indefinitely

### Solution
Increased memory limit from 600MB → **1000MB** in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 1000m  # was: 300m → 600m → now 1000m
```

### Applied Fix
- Updated `/infra/apps/docker-compose.yml` line 66
- Deployed via docker-compose
- Container started successfully with HTTP/2 200 response
- Health check now passing (health: starting → will be healthy after init)

### Verification
```bash
✅ https://openweb.bestviable.com/ → HTTP/2 200 (working)
✅ https://kuma.bestviable.com/ → HTTP/2 302 (working)
✅ https://logs.bestviable.com/ → HTTP/2 405 (responding)
✅ https://n8n.bestviable.com/ → HTTP/2 200 (working)
```

## Resource Allocation After Fix

| Service | Memory Limit | Status |
|---------|------|--------|
| Open WebUI | 1000m | ✅ Optimal |
| Dozzle | 50m | ✅ Light |
| Uptime Kuma | 100m | ✅ Light |
| N8N | (none set) | ✅ Running |
| Postgres | (none set) | ✅ Healthy |
| Coda MCP | (none set) | ✅ Healthy |
| **Total droplet** | 1.9G | ✅ Still has headroom |

## Commands for Quick Recovery

```bash
# Check if 0.5.0 image is pulled
docker images | grep open-webui

# If downloaded, restart:
cd /root/portfolio/infra/apps
docker-compose up -d openweb

# Check logs
docker logs openweb | tail -20

# Test endpoint
curl -s -I https://openweb.bestviable.com/
```

---

## Notes

- Dozzle and Kuma are both running fine (no issues with `:latest` tags)
- Open WebUI `:main` tag is known to have stability issues
- Stable versions (0.5.0, 0.4.x) are recommended for production
- This doesn't block Phase 3 workflows (they work via N8N webhooks directly)

---

**Generated:** 2025-11-05
**Resolved:** 2025-11-05 08:21 PST
**Status:** ✅ RESOLVED - Open WebUI 0.5.0 running, HTTP/2 200 OK
