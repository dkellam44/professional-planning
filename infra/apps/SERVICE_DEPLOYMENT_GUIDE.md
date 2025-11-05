# Service Deployment Guide: nginx-proxy + Cloudflare Tunnel

- entity: deployment_guide
- level: operational
- zone: internal
- version: v01
- tags: [infrastructure, deployment, nginx-proxy, cloudflare, troubleshooting]
- source_path: /infra/apps/SERVICE_DEPLOYMENT_GUIDE.md
- date: 2025-11-05

---

## Table of Contents

1. [Quick Start (5 Minutes)](#quick-start)
2. [Architecture Overview](#architecture)
3. [Complete Deployment Guide](#deployment)
4. [Configuration Reference](#reference)
5. [Troubleshooting Guide](#troubleshooting)
6. [Templates & Commands](#templates)

---

## Quick Start

For experienced users who know the pattern.

### Pre-Flight Checklist

- [ ] n8n stack running: `docker ps | grep nginx-proxy`
- [ ] Networks exist: `docker network ls | grep n8n_`
- [ ] Stable docker image selected (not `:latest` or `:main`)
- [ ] Domain registered in Cloudflare
- [ ] Resource requirements estimated

### 5-Minute Deployment

1. **Copy template** from Section 6
2. **Replace 4 fields:**
   - Service name
   - Docker image (with version)
   - Domain name
   - Container port
3. **Deploy:** `docker-compose up -d`
4. **Add Cloudflare route** (manual, 3 steps)
5. **Verify:** Run diagnostic commands from Section 6

### Cloudflare Route Setup (Manual)

1. Go to: https://one.dash.cloudflare.com/
2. Navigate: **Access → Tunnels → [your-tunnel-name]**
3. Click **Public Hostname**, add:
   - **Domain:** `service.bestviable.com`
   - **Service Type:** HTTP
   - **URL:** `http://nginx-proxy:80`
4. **Save** (takes 30 seconds to propagate)

### Verification Commands

```bash
# 1. Is container running and healthy?
docker ps | grep service-name

# 2. Is it on the right network?
docker network inspect n8n_proxy | grep service-name

# 3. Did nginx-proxy discover it?
docker logs nginx-proxy | grep service-name

# 4. Can it be reached internally?
docker exec nginx-proxy curl -I http://service-name:PORT

# 5. Can it be reached externally?
curl -I https://service.bestviable.com
# Expected: HTTP/2 200 with valid SSL certificate
```

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────┐
│           Internet Users (Cloudflare Edge)          │
└────────────────────┬────────────────────────────────┘
                     │
                     │ Zero Trust Tunnel
                     │ (Token-based, no IP exposure)
                     ▼
         ┌───────────────────────┐
         │  cloudflared service  │
         │  (tunnel client)       │
         └───────────┬───────────┘
                     │
                     │ HTTP traffic
                     ▼
   ┌──────────────────────────────────┐
   │    nginx-proxy:80/443            │
   │  (jwilder/nginx-proxy)           │
   │                                   │
   │  • Monitors /var/run/docker.sock │
   │  • Reads VIRTUAL_HOST labels     │
   │  • Routes by Host header         │
   │  • SSL termination               │
   └──────┬─────────────────┬─────────┘
          │                 │
          │◄────────────────┤
          │   acme-companion
          │   (SSL certs)
          │
   ┌──────┴──────────────────────────┐
   │   n8n_proxy (bridge network)    │
   │                                  │
   │  ├─ n8n:5678                    │
   │  ├─ openweb:8080                │
   │  ├─ kuma:3001                   │
   │  ├─ dozzle:8080                 │
   │  └─ coda-mcp:8080               │
   │                                  │
   └──────┬──────────────────────────┘
          │
          │ (Multi-homed)
          │
   ┌──────┴──────────────────────────┐
   │  n8n_syncbricks (isolated)       │
   │                                  │
   │  ├─ postgres:5432               │
   │  ├─ qdrant:6333                 │
   │  ├─ n8n (backend access)        │
   │  └─ [other services needing DB] │
   │                                  │
   └──────────────────────────────────┘
```

### How It Works

**Request Flow:**
1. User accesses `https://service.bestviable.com`
2. Cloudflare tunnel forwards to `cloudflared` container
3. `cloudflared` sends HTTP to `nginx-proxy:80`
4. `nginx-proxy` reads Host header, matches against VIRTUAL_HOST labels
5. Routes to correct upstream service (e.g., `openweb:8080`)
6. `acme-companion` automatically manages SSL certificates

**Auto-Discovery:**
- `nginx-proxy` monitors Docker socket for container events
- When container starts with `VIRTUAL_HOST` environment variable, it's automatically added to upstream configuration
- `docker-gen` regenerates nginx config and reloads nginx
- No manual nginx config needed!

**Networks:**
- **n8n_proxy:** External-facing services + infrastructure (visible to nginx-proxy)
- **n8n_syncbricks:** Backend services (databases, vector stores) + services needing database access
- Services can be **multi-homed** (attached to both networks)

---

## Complete Deployment Guide

### Step 1: Understand Your Service

Before deploying, answer these questions:

| Question | Example | Notes |
|----------|---------|-------|
| **Service name?** | `my-service` | Used in container_name and labels |
| **Docker image?** | `myregistry/myapp:1.0.0` | Always use stable versions, never `:main` |
| **Domain?** | `service.bestviable.com` | Must be registered in Cloudflare |
| **Listen port?** | `8080` | Port inside container (not mapped port) |
| **Database needed?** | Yes/No | If yes, needs `n8n_syncbricks` network |
| **Memory estimate?** | `1000m` | Default: 1GB, adjust based on app requirements |
| **Health check?** | `curl http://localhost:8080/health` | Or skip if app has no health endpoint |

### Step 2: Create docker-compose.yml

Use the template from Section 6 as your starting point.

**Key decisions:**

**A. Which networks?**
```yaml
networks:
  - n8n_proxy        # REQUIRED for all services
  - n8n_syncbricks   # Optional: only if needs postgres/qdrant access
```

**B. Which environment variables?**
```yaml
environment:
  # REQUIRED: nginx-proxy discovery
  - VIRTUAL_HOST=service.bestviable.com    # Domain to route
  - VIRTUAL_PORT=8080                      # Container port
  - LETSENCRYPT_HOST=service.bestviable.com # SSL cert domain
  - LETSENCRYPT_EMAIL=admin@bestviable.com  # Renewal notifications

  # OPTIONAL: Application config
  - APP_CONFIG=value
```

**C. Memory limit?**
```yaml
deploy:
  resources:
    limits:
      memory: 1000m    # Start at 1GB, adjust based on app needs
```

**D. Health check?**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 60s        # Check every 60 seconds
  timeout: 10s         # Wait 10 seconds for response
  retries: 5           # Mark unhealthy after 5 failures
  start_period: 60s    # Grace period before first check (important!)
```

### Step 3: Validate Configuration Locally

```bash
# Check syntax (doesn't deploy)
docker-compose -f your-compose.yml config

# Expected: Valid YAML output with no errors
```

### Step 4: Deploy to Droplet

```bash
# Upload configuration
scp your-compose.yml tools-droplet-agents:/root/portfolio/infra/apps/

# Deploy
ssh tools-droplet-agents
cd /root/portfolio/infra/apps
docker-compose -f your-compose.yml up -d

# Monitor startup (Ctrl+C to exit)
docker logs -f service-name
```

### Step 5: Add Cloudflare Route

**This step is manual (cannot be automated without API token)**

1. Open: https://one.dash.cloudflare.com/
2. Go to: **Access → Tunnels → [tunnel-name]**
3. Click **Public Hostname**
4. Add new route:
   ```
   Domain: service.bestviable.com
   Service Type: HTTP
   URL: http://nginx-proxy:80
   ```
5. **Save**
6. **Wait 30 seconds** for DNS propagation

### Step 6: Verify Deployment

Run these commands in order:

```bash
# 1. Check container is running
docker ps | grep service-name
# Expected: Container listed with status "Up X minutes"

# 2. Check health status
docker inspect service-name | grep -A 5 '"Health"'
# Expected: "Status": "healthy" or "starting"

# 3. Check network attachment
docker network inspect n8n_proxy | grep -A 3 "service-name"
# Expected: Service listed with IP address

# 4. Check nginx-proxy discovered it
docker logs nginx-proxy | grep -i "service-name"
# Expected: Log entries mentioning service configuration

# 5. Check app listening on correct port
docker exec service-name netstat -tlnp | grep LISTEN
# Expected: Service listening on declared port

# 6. Check nginx-proxy can reach it
docker exec nginx-proxy curl -I http://service-name:PORT
# Expected: HTTP/1.1 200 OK or similar success response

# 7. Test external access
curl -I https://service.bestviable.com
# Expected: HTTP/2 200 with valid SSL certificate
```

If all pass, **deployment successful!** ✅

---

## Configuration Reference

### Environment Variables (Required)

#### VIRTUAL_HOST
- **Purpose:** Domain to route traffic to this service
- **Value:** `service.bestviable.com`
- **Required:** Yes
- **Note:** nginx-proxy uses Host header matching; if domain doesn't match VIRTUAL_HOST, traffic won't route
- **Multiple domains:** Use comma-separated: `service.bestviable.com,alias.bestviable.com`

#### VIRTUAL_PORT
- **Purpose:** Container's internal listening port
- **Value:** `8080` (or whatever port app uses)
- **Required:** Yes if not port 80
- **Common mistake:** Using mapped port (e.g., `127.0.0.1:9999`) instead of container port
- **How to find:** Check Dockerfile `EXPOSE` line or app documentation

#### LETSENCRYPT_HOST
- **Purpose:** Domain for SSL certificate
- **Value:** `service.bestviable.com` (must match VIRTUAL_HOST)
- **Required:** Yes
- **Note:** acme-companion watches this variable and automatically requests Let's Encrypt certificates

#### LETSENCRYPT_EMAIL
- **Purpose:** Email for SSL certificate renewal notifications
- **Value:** `admin@bestviable.com`
- **Required:** If using LETSENCRYPT_HOST
- **Note:** Let's Encrypt sends renewal reminders; keep current

### Network Configuration

#### n8n_proxy (Required)

```yaml
networks:
  - n8n_proxy
```

- **Type:** Bridge network (external, created by n8n stack)
- **Purpose:** nginx-proxy discovery and external routing
- **Services on network:** nginx-proxy, acme-companion, cloudflared, all public-facing apps
- **Requirement:** All services MUST be on this network to be discovered by nginx-proxy

#### n8n_syncbricks (Optional)

```yaml
networks:
  - n8n_syncbricks
```

- **Type:** Bridge network (external, isolated backend)
- **Purpose:** Backend-only connectivity to databases
- **Services on network:** postgres, qdrant, services needing database access
- **When to use:** If service needs postgres or qdrant access
- **Multi-homing:** n8n is attached to both n8n_proxy and n8n_syncbricks

#### Declaring Networks (Required)

```yaml
networks:
  n8n_proxy:
    external: true         # Don't create, reference existing
  n8n_syncbricks:
    external: true         # Don't create, reference existing
```

### Resource Limits

#### Memory Limits

```yaml
deploy:
  resources:
    limits:
      memory: 1000m        # Limit to 1GB
```

**Why memory limits matter:**

- Without limits, container can consume all droplet RAM
- Docker OOM-kills container if limit exceeded (restart loop)
- Limit prevents one service from starving others

**Sizing guidelines:**

| Service Type | Recommended | Notes |
|--------------|-------------|-------|
| Chat UI (Open WebUI) | 1000m | Needs memory for model loading |
| Small API | 300-500m | Lightweight services |
| Database proxy | 200-300m | Minimal footprint |
| Background worker | 500-800m | Depends on workload |
| Monitoring (Kuma) | 100-200m | Very light |

**Open WebUI lesson learned:** Started at 600m (OOM crashed during model download), increased to 1000m (stable).

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
  interval: 60s
  timeout: 10s
  retries: 5
  start_period: 60s
```

**Each setting:**

| Setting | Value | Notes |
|---------|-------|-------|
| **test** | `["CMD", "curl", "-f", "http://localhost:8080/health"]` | Command to run; `-f` fails on HTTP error codes |
| **interval** | `60s` | Check every 60 seconds (don't check too frequently) |
| **timeout** | `10s` | Wait 10 seconds for response before timing out |
| **retries** | `5` | Mark unhealthy after 5 consecutive failures |
| **start_period** | `60s` | Grace period before first check (crucial for slow apps!) |

**Common mistakes:**

- **start_period too short:** App still initializing when first check runs → marked unhealthy
- **interval too short:** Too many checks, wastes resources
- **Wrong health endpoint:** Service has no `/health` endpoint → always fails

**If app has no health endpoint:** Omit health check entirely rather than creating a fake one that always fails.

---

## Troubleshooting Guide

### Quick Diagnostic Commands

Use these one-liners to diagnose issues:

```bash
# 1. Is container running?
docker ps | grep service-name

# 2. What's the status (healthy/unhealthy)?
docker inspect service-name | grep -A 5 '"Health"'

# 3. What are the recent logs?
docker logs service-name --tail 50

# 4. Is it on the right network?
docker network inspect n8n_proxy | grep -A 3 service-name

# 5. Did nginx-proxy discover it?
docker logs nginx-proxy | grep service-name

# 6. What port is it listening on?
docker exec service-name netstat -tlnp | grep LISTEN

# 7. Can nginx-proxy reach it?
docker exec nginx-proxy curl -I http://service-name:8080

# 8. Is the domain accessible internally?
docker exec nginx-proxy curl -I -H "Host: service.bestviable.com" http://localhost

# 9. Is the domain accessible externally?
curl -I https://service.bestviable.com

# 10. Check SSL certificate status
curl -vI https://service.bestviable.com 2>&1 | grep -E "(issuer|subject|date)"
```

### Error Pattern: 503 Service Unavailable

**What you see:**
```bash
curl -I https://service.bestviable.com
# HTTP/2 503
# Body: "503 Service Temporarily Unavailable"
```

**Root causes (most common first):**

| # | Cause | Detection | Fix |
|---|-------|-----------|-----|
| 1 | **Container not running** | `docker ps \| grep service-name` returns nothing | Check logs: `docker logs service-name --tail 50` |
| 2 | **Wrong network** | Container not in `docker network inspect n8n_proxy` output | Add to docker-compose: `networks: - n8n_proxy` |
| 3 | **Missing VIRTUAL_HOST** | `docker logs nginx-proxy` shows no config for service | Add to environment: `VIRTUAL_HOST=service.bestviable.com` |
| 4 | **nginx-proxy not reloaded** | Recently added service but not showing in nginx-proxy logs | Restart container: `docker-compose up -d` |

**Decision tree:**

```
503 error?
├─ Container running? (docker ps | grep)
│  ├─ NO → Fix issue in logs (docker logs), restart
│  └─ YES → Next
├─ On n8n_proxy network? (docker network inspect n8n_proxy)
│  ├─ NO → Add networks: - n8n_proxy
│  └─ YES → Next
├─ VIRTUAL_HOST set? (docker inspect | grep VIRTUAL_HOST)
│  ├─ NO → Add environment: - VIRTUAL_HOST=domain.com
│  └─ YES → Next
└─ In nginx-proxy logs? (docker logs nginx-proxy | grep service)
   ├─ NO → Restart nginx-proxy: docker restart nginx-proxy
   └─ YES → Issue is upstream in application
```

---

### Error Pattern: 502 Bad Gateway

**What you see:**
```bash
curl -I https://service.bestviable.com
# HTTP/2 502
# Body: "502 Bad Gateway"
```

**Root causes:**

| Cause | Detection | Fix |
|-------|-----------|-----|
| **Container port mismatch** | Container listening on 8080, VIRTUAL_PORT=80 | Check with: `docker exec service-name netstat -tlnp \| grep LISTEN`. Match VIRTUAL_PORT to actual port. |
| **Memory limit too low** | Container OOM-killed during startup | `docker logs service-name \| grep -i killed`. Increase memory limit in deploy section. |
| **Application crash** | Process exited after container started | `docker logs service-name --tail 50`. Look for error messages. |
| **Health check too aggressive** | Container marked unhealthy, restart loop | `docker inspect service-name \| grep -A 5 Health`. Increase start_period. |

---

### Error Pattern: Container Crash Loop

**What you see:**
```bash
docker ps | grep service-name
# Status: Exited (code X) X seconds ago
# OR: Up X seconds (then exits, then restarts...)
```

**Check logs immediately:**
```bash
docker logs service-name --tail 100
```

**Common exit codes:**

| Exit Code | Meaning | Solution |
|-----------|---------|----------|
| **1** | General error | Check logs for error message |
| **137** | OOM killed (Docker ran out of memory) | Increase memory limit: `deploy.resources.limits.memory` |
| **127** | Command not found | Check ENTRYPOINT/CMD in Dockerfile |

**If logs are empty or truncated:**
```bash
docker logs service-name --since 10m  # Last 10 minutes
docker logs service-name 2>&1 | head -100  # First 100 lines
```

---

### Error Pattern: OOM (Out of Memory) Kills

**Symptom:**
- Container runs for a few seconds, then disappears
- `docker logs` shows something downloaded/initialized, then cut off
- Appears in `docker ps -a` with status "Exited (137)"

**Root cause:**
Open WebUI lesson learned: Downloading embedding models needs more RAM than allocated

**How to verify:**
```bash
# Check memory usage before OOM
docker stats service-name --no-stream
# Memory should be close to or above limit when it crashes
```

**Solution:**
```yaml
deploy:
  resources:
    limits:
      memory: 2000m    # Double or triple the limit
```

**Redeploy:**
```bash
docker-compose up -d --force-recreate
```

---

### Error Pattern: Health Check Failures

**What you see:**
```bash
docker ps | grep service-name
# Status: Up 30 seconds (unhealthy)

docker inspect service-name | grep -A 10 Health
# "Status": "unhealthy"
# Multiple failed health checks
```

**Root causes:**

| Cause | Solution |
|-------|----------|
| **start_period too short** | App still initializing when first check runs. Increase to 60s or more. |
| **interval too frequent** | Health check runs too often, waste resources. Set to 30-60s. |
| **wrong health endpoint** | Service doesn't have `/health` endpoint. Check app docs or omit health check. |
| **health endpoint not responding** | App broken. Check `docker logs service-name`. |

**Fix:**
```yaml
healthcheck:
  start_period: 120s    # Give it time to initialize
  interval: 60s         # Don't check too often
  timeout: 10s
  retries: 5
```

---

### Error Pattern: DNS Not Resolving

**What you see:**
```bash
curl -I https://service.bestviable.com
# curl: (6) Could not resolve host: service.bestviable.com
```

**Root causes:**

| Cause | Fix |
|-------|-----|
| **Cloudflare route not added** | Add route in Zero Trust dashboard (manual step) |
| **DNS not propagated yet** | Wait 30-60 seconds after adding route |
| **Domain not registered in Cloudflare** | Add DNS record in Cloudflare dashboard |

**Verification:**
```bash
# Check if domain resolves
dig service.bestviable.com
# Should show Cloudflare IP addresses, not NXDOMAIN

# Check if tunnel is connected
curl -I https://n8n.bestviable.com  # (use working domain)
# If this works, tunnel is connected; check new route config
```

---

### Error Pattern: SSL Certificate Issues

**What you see:**
```bash
curl https://service.bestviable.com
# curl: (60) SSL certificate problem: self signed certificate
# OR: certificate has expired
```

**Root causes:**

| Cause | Fix |
|-------|-----|
| **LETSENCRYPT_HOST not set** | Add to environment: `LETSENCRYPT_HOST=service.bestviable.com` |
| **Certificate not generated yet** | Wait 5 minutes, then try again |
| **Let's Encrypt rate limit hit** | Wait 1 hour. Check: `docker logs nginx-proxy-acme \| grep rate` |

**Check certificate status:**
```bash
# See certificate details
curl -vI https://service.bestviable.com 2>&1 | grep -E "(subject|issuer|date)"

# Check if certificate file exists on droplet
ssh tools-droplet-agents "ls -la /root/portfolio/infra/n8n/nginx_certs/service.bestviable.com.*"
```

---

## Templates & Commands

### Complete docker-compose.yml Template

```yaml
version: '3.8'

# REQUIRED: Reference existing networks
networks:
  n8n_proxy:
    external: true
  # n8n_syncbricks:
  #   external: true    # Uncomment if service needs database access

services:
  # REPLACE: "service-name" with your actual service name
  service-name:
    # REPLACE: with your stable docker image (include version)
    image: your-registry/your-image:1.0.0

    # MATCH: container_name to service-name
    container_name: service-name

    # RECOMMENDED: Auto-restart unless explicitly stopped
    restart: unless-stopped

    # REQUIRED: Attach to proxy network for auto-discovery
    networks:
      - n8n_proxy
      # - n8n_syncbricks    # Uncomment if needs postgres/qdrant

    # REQUIRED: nginx-proxy configuration
    environment:
      # REPLACE: with your domain
      - VIRTUAL_HOST=service.bestviable.com

      # REPLACE: with your container's listening port
      - VIRTUAL_PORT=8080

      # MUST MATCH: VIRTUAL_HOST for SSL cert
      - LETSENCRYPT_HOST=service.bestviable.com

      # Email for SSL renewal notifications
      - LETSENCRYPT_EMAIL=admin@bestviable.com

      # ADD: Application-specific variables below
      # - APP_CONFIG_VAR=value
      # - DATABASE_URL=postgres://...

    # OPTIONAL: Persistent storage
    # volumes:
    #   - service_data:/app/data

    # RECOMMENDED: Prevent OOM kills and resource issues
    deploy:
      resources:
        limits:
          memory: 1000m    # Adjust based on app requirements

    # RECOMMENDED: Health monitoring
    healthcheck:
      # REPLACE: with your app's health endpoint
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 60s
      timeout: 10s
      retries: 5
      start_period: 60s    # Critical for slow-starting apps!

# OPTIONAL: Define volumes (uncomment if used above)
# volumes:
#   service_data:
```

### Deployment Checklist

```markdown
## Pre-Deployment
- [ ] n8n stack running (`docker ps | grep nginx-proxy`)
- [ ] Networks exist (`docker network ls | grep n8n_`)
- [ ] Stable image tag selected (not `:latest` or `:main`)
- [ ] Domain registered in Cloudflare
- [ ] Memory requirements estimated

## Configuration
- [ ] docker-compose.yml created from template
- [ ] Service name filled in
- [ ] Docker image specified with version
- [ ] VIRTUAL_HOST set to domain
- [ ] VIRTUAL_PORT set to container port
- [ ] LETSENCRYPT_HOST matches VIRTUAL_HOST
- [ ] Networks configured (n8n_proxy required)
- [ ] Memory limit set (recommended 1000m+)
- [ ] Health check configured (or omitted if N/A)

## Deployment
- [ ] Syntax validated: `docker-compose config`
- [ ] File uploaded to droplet
- [ ] Deployed: `docker-compose up -d`
- [ ] Container running: `docker ps | grep service-name`
- [ ] Healthy or starting: `docker inspect | grep Health`

## Integration
- [ ] Cloudflare route added manually (manual step)
- [ ] 30 seconds waited for DNS propagation
- [ ] External endpoint tested: `curl -I https://service.bestviable.com`
- [ ] SSL certificate valid
- [ ] All verification checks passed

## Post-Deployment
- [ ] Monitor logs for 5 minutes: `docker logs -f service-name`
- [ ] Set up monitoring (optional)
- [ ] Document service in infrastructure notes
- [ ] Archive docker-compose.yml for reference
```

### Verification Command Suite

Run in order after deployment:

```bash
#!/bin/bash
# Save as: verify-deployment.sh

SERVICE_NAME="service-name"  # REPLACE with actual name
DOMAIN="service.bestviable.com"  # REPLACE with actual domain
PORT="8080"  # REPLACE with actual port

echo "=== VERIFICATION SUITE ==="
echo ""

# 1. Container status
echo "1. Container running?"
docker ps | grep $SERVICE_NAME
echo ""

# 2. Health status
echo "2. Health status?"
docker inspect $SERVICE_NAME | grep -A 5 '"Health"'
echo ""

# 3. Network attachment
echo "3. On n8n_proxy network?"
docker network inspect n8n_proxy | grep -A 3 $SERVICE_NAME
echo ""

# 4. nginx-proxy discovery
echo "4. nginx-proxy discovered it?"
docker logs nginx-proxy | grep -i $SERVICE_NAME | head -3
echo ""

# 5. Listening port
echo "5. Listening on port $PORT?"
docker exec $SERVICE_NAME netstat -tlnp | grep $PORT
echo ""

# 6. Internal connectivity
echo "6. nginx-proxy can reach it?"
docker exec nginx-proxy curl -I http://$SERVICE_NAME:$PORT
echo ""

# 7. External connectivity
echo "7. External access working?"
curl -I https://$DOMAIN
echo ""

# 8. SSL certificate
echo "8. SSL certificate valid?"
curl -vI https://$DOMAIN 2>&1 | grep -E "(subject|issuer|Issuer)"
echo ""

echo "=== VERIFICATION COMPLETE ==="
```

---

## Key Learnings from Open WebUI Deployment

The Open WebUI troubleshooting session revealed several important patterns:

### Lesson 1: Memory Limits Matter
- **Original setting:** 600m
- **Problem:** OOM kills during model download (Alembic migrations + embedding model loading)
- **Solution:** Increased to 1000m
- **Result:** Stable startup within 2 minutes

**Takeaway:** Allocate at least 1000m for complex applications, more for ML models.

### Lesson 2: Stable Versions > :main Tag
- **Issue:** ghcr.io/open-webui/open-webui:main had infinite migration loop
- **Fix:** Switched to ghcr.io/open-webui/open-webui:0.5.0
- **Result:** Clean startup, all migrations completed

**Takeaway:** Always use semantic version tags in production. `:main` and `:latest` can be unstable.

### Lesson 3: Health Check Timing
- **Original:** timeout 10s, retries 3, no start_period
- **Problem:** Health check failed during startup, container restarted
- **Fix:** Added start_period: 60s
- **Result:** Proper grace period for initialization

**Takeaway:** start_period is crucial. Give apps time to initialize before first health check.

### Lesson 4: docker-compose State Corruption
- **Issue:** After repeated failing deployments, docker-compose state became corrupted
- **Problem:** `docker-compose up` tried to preserve old container state, failed with `KeyError: 'ContainerConfig'`
- **Solution:** Used `docker run` directly, bypassing compose state

**Takeaway:** If docker-compose state is corrupted, use plain `docker run` or `docker rm -f` to clean state.

---

## Troubleshooting Decision Tree (ASCII)

```
Service not accessible externally?
│
├─ Gets 503 Service Unavailable?
│  │
│  ├─ Container running? (docker ps | grep)
│  │  ├─ NO → Check logs: docker logs service-name --tail 50
│  │  │        ├─ OOM killed? → Increase memory: deploy.resources.limits.memory
│  │  │        ├─ Crash? → Fix app config or image
│  │  │        └─ Won't start? → Likely missing env var or bad config
│  │  │
│  │  └─ YES → Next check
│  │
│  ├─ On n8n_proxy network? (docker network inspect n8n_proxy)
│  │  ├─ NO → Add to docker-compose: networks: - n8n_proxy
│  │  └─ YES → Next check
│  │
│  ├─ VIRTUAL_HOST set? (docker inspect | grep VIRTUAL_HOST)
│  │  ├─ NO → Add environment: - VIRTUAL_HOST=domain.com
│  │  └─ YES → Next check
│  │
│  └─ In nginx-proxy logs? (docker logs nginx-proxy | grep service)
│     ├─ NO → Restart nginx: docker restart nginx-proxy
│     └─ YES → App not responding (check app logs)
│
├─ Gets 502 Bad Gateway?
│  │
│  ├─ VIRTUAL_PORT matches listening port? (docker exec netstat -tlnp)
│  │  ├─ NO → Update VIRTUAL_PORT in environment
│  │  └─ YES → Next check
│  │
│  └─ Memory not exceeded? (docker stats)
│     ├─ YES → App likely crash, check logs
│     └─ NO → Increase memory limit
│
├─ DNS not resolving?
│  │
│  ├─ Cloudflare route added? (Check in dashboard)
│  │  ├─ NO → Add route manually in Zero Trust dashboard
│  │  └─ YES → Wait 30-60 seconds for propagation
│  │
│  └─ Can reach other domains? (curl -I https://n8n.bestviable.com)
│     ├─ NO → Tunnel disconnected, check: docker logs cloudflared
│     └─ YES → DNS issue, check Cloudflare config
│
└─ SSL certificate issues?
   │
   ├─ LETSENCRYPT_HOST set? (docker inspect | grep LETSENCRYPT_HOST)
   │  ├─ NO → Add environment: - LETSENCRYPT_HOST=domain.com
   │  └─ YES → Next check
   │
   └─ Certificate generated? (curl -vI https://domain | grep subject)
      ├─ NO → Wait 5 minutes, acme-companion is working
      └─ YES → All good!
```

---

## Summary

### Successful Deployment Process

1. **Understand** your service (name, image, port, database needs)
2. **Configure** docker-compose.yml using the template
3. **Validate** syntax: `docker-compose config`
4. **Deploy** to droplet: `docker-compose up -d`
5. **Monitor** startup: `docker logs -f service-name`
6. **Configure** Cloudflare route (manual, 3 fields)
7. **Wait** 30 seconds for DNS propagation
8. **Verify** using the verification command suite
9. **Troubleshoot** using the error patterns if issues arise

### Critical Takeaways

- **Always use n8n_proxy network** - nginx-proxy won't discover services without it
- **Memory limits matter** - Allocate 1000m+ for complex apps
- **Use stable versions** - Not `:main`, `:latest`, or untagged images
- **Health checks need time** - Set start_period to give app time to initialize
- **Cloudflare routing is manual** - Cannot automate without API token

---

**Version:** 1.0
**Last Updated:** 2025-11-05
**Status:** Ready for use
**Feedback:** Document any issues encountered with new deployments and update this guide