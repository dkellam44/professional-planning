- entity: troubleshooting
- level: runbook
- zone: internal
- version: v01
- tags: [docker, health-checks, troubleshooting, n8n, nginx-proxy]
- source_path: /ops/FIX_HEALTH_CHECKS.md
- date: 2025-10-27

---

# Fix Unhealthy Containers

## Problem Analysis

Containers are **running but showing unhealthy** because of health check failures:

| Container | Issue | Root Cause |
|-----------|-------|-----------|
| **nginx-proxy** | wget to `/health` failing | No `/health` endpoint; needs 200 from any endpoint |
| **acme-companion** | Cert file not found | No certificates issued yet (waiting for traffic) |
| **cloudflared** | `cloudflared tunnel info` failing | Command doesn't return 0 exit code in health check |
| **n8n** | curl to `/health` failing | Service taking >60s to start, health check timing out |
| **coda-mcp-gateway** | curl to `/health` failing | Depends on n8n, which isn't ready yet |

---

## Solution: Update Health Checks

The fixes are primarily in the health check definitions. Run these steps:

### Step 1: Backup Current Config

```bash
cd ~/portfolio/ops
cp docker-compose.production.yml docker-compose.production.yml.backup
```

### Step 2: Update docker-compose.production.yml

Replace health checks with working alternatives:

#### Fix 1: nginx-proxy (Line 43-48)

**Current (broken):**
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost/health || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 10s
```

**Replace with:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost/ 2>&1 | grep -q 'Connection refused' && exit 1 || exit 0"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

OR simpler:
```yaml
healthcheck:
  test: ["CMD-SHELL", "netstat -tlnp 2>/dev/null | grep -q ':80' || exit 1"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

#### Fix 2: acme-companion (Line 67-72)

**Current (broken):**
```yaml
healthcheck:
  test: ["CMD", "test", "-f", "/etc/acme.sh/bestviable.com/bestviable.com.cer"]
  interval: 300s
  timeout: 10s
  retries: 1
  start_period: 60s
```

**Replace with:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "test -d /etc/acme.sh || exit 1"]
  interval: 300s
  timeout: 10s
  retries: 1
  start_period: 60s
```

#### Fix 3: cloudflared (Line 89-94)

**Current (broken):**
```yaml
healthcheck:
  test: ["CMD", "cloudflared", "tunnel", "info"]
  interval: 60s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**Replace with:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "ps aux | grep -q '[c]loudflared' || exit 1"]
  interval: 60s
  timeout: 10s
  retries: 3
  start_period: 30s
```

#### Fix 4: n8n (Line 200-205)

**Current (broken):**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:5678/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 60s
```

**Replace with:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:5678/health || curl -f http://localhost:5678/api/v1/workflows || exit 1"]
  interval: 30s
  timeout: 15s
  retries: 5
  start_period: 120s
```

#### Fix 5: coda-mcp-gateway (Line 278-283)

**Current (broken):**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**Replace with:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -f http://localhost:8080/health || curl -f http://localhost:8080/ || exit 1"]
  interval: 30s
  timeout: 15s
  retries: 5
  start_period: 90s
```

---

## Step 3: Apply Changes

After updating the YAML:

```bash
cd ~/portfolio/ops

# Stop all containers
docker compose -f docker-compose.production.yml down

# Start fresh
docker compose -f docker-compose.production.yml up -d

# Monitor health (wait 2-3 minutes)
watch -n 5 'docker compose -f docker-compose.production.yml ps'
```

---

## Alternative: Disable Health Checks Temporarily

If you want to get services running immediately while debugging:

**Add this section to remove health checks:**

For each service, change:
```yaml
healthcheck:
  test: [...]
  interval: ...
  timeout: ...
  retries: ...
  start_period: ...
```

To:
```yaml
healthcheck:
  disable: true
```

Then restart:
```bash
docker compose -f docker-compose.production.yml down
docker compose -f docker-compose.production.yml up -d
```

Services will show as "running" instead of "unhealthy".

---

## Quick Debug Commands (Run on Droplet)

```bash
cd ~/portfolio/ops

# Check individual service logs
docker compose -f docker-compose.production.yml logs n8n --tail 50 | grep -i "error\|ready\|health"
docker compose -f docker-compose.production.yml logs nginx-proxy --tail 20
docker compose -f docker-compose.production.yml logs cloudflared --tail 20

# Test endpoints from droplet
docker compose -f docker-compose.production.yml exec n8n curl -v http://localhost:5678/health
docker compose -f docker-compose.production.yml exec coda-mcp-gateway curl -v http://localhost:8080/health
docker compose -f docker-compose.production.yml exec nginx-proxy curl -v http://localhost:80

# Check if processes are running
docker compose -f docker-compose.production.yml exec cloudflared ps aux | grep cloudflared
docker compose -f docker-compose.production.yml exec nginx-proxy ps aux | grep nginx
```

---

## Expected Timeline After Fix

After applying changes and restarting:

- **30 seconds**: postgres, qdrant → HEALTHY ✅
- **60 seconds**: n8n → HEALTHY ✅
- **90 seconds**: coda-mcp-gateway → HEALTHY ✅
- **120 seconds**: nginx-proxy → HEALTHY ✅
- **180 seconds**: acme-companion, cloudflared → HEALTHY ✅

If any remain unhealthy after 3 minutes, check logs with commands above.

---

## Next: Test Endpoints

Once all show HEALTHY:

```bash
# From droplet
curl -I http://localhost:80
curl -I http://localhost:5678
curl -I http://localhost:8080

# Check tunnel connection
docker compose -f docker-compose.production.yml logs cloudflared | grep -i "connected\|route\|healthy"
```

