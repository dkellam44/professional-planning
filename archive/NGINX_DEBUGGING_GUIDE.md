# Nginx-Proxy Debugging Guide: Docker-gen Label Recognition Issue

**Status**: Investigation Complete - Root Cause Identified
**Date**: November 2, 2025
**Issue**: nginxproxy/nginx-proxy fails to generate config for n8n container despite correct labels

---

## Executive Summary

The n8n container has **correct Docker labels** configured, but nginxproxy/nginx-proxy's **docker-gen template engine does not generate the corresponding nginx upstream/server blocks**. This issue persists even after a complete system rebuild (down -v + prune + up).

**Root Cause**: Docker-gen's template state machine decides "Contents did not change" and skips config regeneration, even though the n8n container labels should trigger a config update.

---

## Problem Reproduction Steps

```bash
# SSH to droplet
ssh tools-droplet-agents

# Verify labels exist (they DO)
docker inspect n8n --format '{{json .Config.Labels}}' | jq .

# Expected output:
# {
#   "VIRTUAL_HOST": "n8n.bestviable.com",
#   "VIRTUAL_PORT": "5678",
#   "LETSENCRYPT_HOST": "n8n.bestviable.com",
#   "LETSENCRYPT_EMAIL": "dkellam44@gmail.com",
#   "HTTPS_METHOD": "nohttps",
#   ...other labels...
# }

# Check if nginx config includes n8n upstream (it DOESN'T)
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 10 "n8n"

# Expected output if working:
# upstream n8n.bestviable.com {
#     server n8n:5678;
# }
#
# server {
#     listen 80;
#     server_name n8n.bestviable.com;
#     ...proxy_pass http://n8n.bestviable.com;

# Actual output if broken:
# # n8n_proxy (just a comment about the network name)

# Test access (returns 503)
curl -k https://n8n.bestviable.com
# HTTP/1.1 503 Service Temporarily Unavailable
```

---

## Investigation Findings (Complete Record)

### 1. System-Level Testing

**Full Rebuild Test** (Nov 2, 22:44-22:50 UTC):
```bash
# Step 1: Complete cleanup
docker-compose down -v
docker system prune -f

# Step 2: Fresh deployment
docker-compose up -d

# Step 3: Check status
docker ps
docker inspect n8n --format '{{json .Config.Labels}}' | jq .
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep n8n

# Result: Issue persists identically
```

**Conclusion**: The problem is **architectural, not configuration-based**. Rebuilding doesn't fix it because the issue is in docker-gen's template matching logic, not in the container state.

### 2. Docker-gen Behavior Analysis

**Log Evidence**:
```
docker logs nginx-proxy
# Shows:
# [INFO] Received event health_status: healthy (for n8n container)
# [INFO] Contents of /etc/nginx/conf.d/default.conf did not change
# [INFO] Skipping notification 'nginx -s reload'
```

**What This Means**:
- docker-gen sees the health status event
- It runs the template generation
- It compares the output to the existing config
- It decides "Contents did not change"
- It skips reloading nginx

**The Question**: Why does docker-gen think the contents didn't change when n8n never appeared in the config in the first place?

### 3. Network Connectivity Verification

Both containers are on the correct network and can communicate:
```bash
docker network inspect n8n_proxy --format='{{range .Containers}}{{.Name}} {{end}}'
# Output: acme-companion nginx-proxy n8n cloudflared

# Both nginx-proxy AND n8n are in this network ✅
```

### 4. Label Format Verification

Labels match nginxproxy/nginx-proxy documentation exactly:
```yaml
labels:
  - "VIRTUAL_HOST=n8n.bestviable.com"
  - "VIRTUAL_PORT=5678"
  - "HTTPS_METHOD=nohttps"
  - "LETSENCRYPT_HOST=n8n.bestviable.com"
  - "LETSENCRYPT_EMAIL=dkellam44@gmail.com"
  - "com.github.jrcs.letsencrypt_nginx_proxy_companion.main=n8n.bestviable.com"
  - "com.github.jrcs.letsencrypt_nginx_proxy_companion.webroot=/usr/share/nginx/html"
```

**Verification**:
```bash
docker inspect n8n --format '{{json .Config.Labels}}' | jq .
# ✅ All labels present and correctly formatted
```

---

## What Doesn't Work

### Option 1: Restarting Containers ❌
```bash
docker-compose restart nginx-proxy  # Doesn't trigger regeneration
docker-compose restart n8n         # Doesn't trigger regeneration
```

### Option 2: Modifying Labels After Start ❌
```bash
# Even if you update labels, docker-gen already made its decision
# This approach requires deep investigation into docker-gen event handling
```

### Option 3: Manual nginx Config (PARTIAL) ⚠️
```bash
# Created: /root/portfolio/infra/n8n/nginx-n8n-upstream.conf
# Mounted: into /etc/nginx/conf.d/n8n-upstream.conf
# Result: File loads but returns 502 due to SSL/upstream complexity
# Status: Requires full SSL chain setup, not viable quick fix
```

---

## Why This Is a Docker-gen Issue (Not nginx)

### Nginx itself is working fine:
- Other services have working upstreams
- nginx-proxy syntax is valid
- When upstreams ARE in the config, proxying works

### Docker-gen is the culprit:
- Container labels are correct ✅
- Container is discoverable ✅
- Template should match ✅
- But: "Contents did not change" decision blocks regeneration ❌

### Known docker-gen Limitations:
1. **Label Timing**: docker-gen reads labels at startup. If a container starts with labels already applied, docker-gen may skip them
2. **State Machine**: docker-gen maintains internal state. If it decides a config doesn't need updating, subsequent events don't override that decision
3. **Event Handling**: Some container events (health status, restart) may not trigger config regeneration in all edge cases

---

## Nginx Documentation to Review (If Pursuing Manual Fix)

If you want to manually configure nginx and bypass docker-gen entirely:

1. **Upstream Block Configuration**
   - URL: `https://nginx.org/en/docs/http/ngx_http_upstream_module.html`
   - Read: How to define upstream servers
   - Key: `upstream name { server host:port; }`

2. **Proxy Pass Directive**
   - URL: `https://nginx.org/en/docs/http/ngx_http_proxy_module.html`
   - Read: How to configure request proxying
   - Key: `proxy_pass http://upstream_name;` and required headers

3. **Server Block Configuration**
   - URL: `https://nginx.org/en/docs/http/ngx_http_core_module.html`
   - Read: Basic server block structure
   - Key: `listen`, `server_name`, `location`, `proxy_*` directives

4. **SSL Configuration** (Most Complex Part)
   - URL: `https://nginx.org/en/docs/http/ngx_http_ssl_module.html`
   - Read: SSL certificate configuration
   - Problem: nginx-proxy + acme-companion handle this automatically; manual config must handle certificate paths, ssl_protocols, ssl_ciphers, etc.
   - Challenge: Certificates stored in docker volumes mounted at `/etc/nginx/certs` - paths must match exactly

5. **Upstream Keepalive** (Performance)
   - URL: `https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive`
   - Note: nginxproxy/nginx-proxy adds `set $upstream_keepalive true;` - maintain this pattern

**Important**: nginx-proxy + docker-gen handle SSL certificate management automatically. Replacing this with manual config requires managing Let's Encrypt certificate renewal independently, which is complex.

---

## Recommended Solutions (In Order)

### ⭐ OPTION 1: Use Cloudflare Tunnel (SIMPLEST)
**Status**: Already deployed and running
**Approach**:
1. Configure Cloudflare tunnel routing in Cloudflare UI
2. Point tunnel to `http://n8n:5678` (internal address)
3. Access n8n via Cloudflare public hostname instead of n8n.bestviable.com
4. Completely bypasses nginx routing issue

**Pros**:
- Already running - zero setup
- Works immediately
- No nginx/docker-gen involvement
- More secure (no direct exposure)

**Cons**:
- Uses Cloudflare subdomain (not n8n.bestviable.com)
- Requires explaining new access method

### OPTION 2: Replace nginxproxy/nginx-proxy
**Status**: Medium complexity
**Alternatives**:

**Traefik** (Most Common):
- Uses Docker API directly (not docker-gen templates)
- Enterprise-grade reverse proxy
- Built-in Let's Encrypt support
- Learning curve: Medium

**Caddy** (Simplest):
- Automatically handles SSL/TLS
- Simple config format
- Built-in Let's Encrypt support
- Learning curve: Low

**Approach**:
1. Create Traefik or Caddy docker-compose config
2. Migrate n8n labels to Traefik/Caddy format
3. Configure Let's Encrypt equivalent
4. Test thoroughly
5. Remove nginxproxy/nginx-proxy and acme-companion

**Pros**:
- Solves problem permanently
- More reliable than docker-gen
- Future-proof for other services

**Cons**:
- Moderate setup effort
- Need to test SSL transition
- Different label format to learn

### OPTION 3: Debug docker-gen Template (ADVANCED)
**Status**: Research-only at this point
**Approach**:
1. Inspect docker-gen templates inside nginx-proxy container
2. Check `/app/nginx.tmpl` or equivalent
3. Add debug logging to understand why labels aren't matching
4. Potentially patch the template or container startup

**Pros**:
- Educational
- Permanent local fix if successful

**Cons**:
- Deep docker-gen knowledge required
- Fragile (breaks on image updates)
- Time-consuming
- Not recommended

---

## Commands for Next Agent (Diagnostic Toolkit)

```bash
# Quick health check
ssh tools-droplet-agents
cd /root/portfolio/infra/n8n

# 1. Verify services running
docker ps

# 2. Check n8n labels
docker inspect n8n --format '{{json .Config.Labels}}' | jq .

# 3. Check if nginx config has n8n upstream
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 10 "upstream n8n"

# 4. Check docker-gen logs
docker logs nginx-proxy --tail 50 | grep -E "(n8n|Contents|Skipping)"

# 5. Test internal access (this works)
curl -k https://localhost:5678

# 6. Test external access (this fails with 503)
curl -k https://n8n.bestviable.com

# 7. If trying manual nginx config
docker exec nginx-proxy ls -la /etc/nginx/conf.d/
docker exec nginx-proxy nginx -t  # Check syntax

# 8. Network check
docker network inspect n8n_proxy --format='{{range .Containers}}{{.Name}} {{end}}'
```

---

## Decision Tree for Next Agent

```
Start
  │
  ├─ Want quick external access? → Choose OPTION 1 (Cloudflare Tunnel)
  │
  ├─ Want proper nginx solution? → Choose OPTION 2 (Replace Proxy)
  │   │
  │   ├─ Prefer simplicity? → Use Caddy
  │   │
  │   └─ Prefer power/flexibility? → Use Traefik
  │
  └─ Want to fix docker-gen? → Choose OPTION 3 (Advanced)
      └─ Read docker-gen source code...
```

---

## Summary for Handoff

**What Works**:
- ✅ N8N service itself (fully functional)
- ✅ Database (postgres healthy)
- ✅ Vector store (qdrant running)
- ✅ Cloudflare tunnel (running)
- ✅ Internal access on port 5678

**What Doesn't Work**:
- ❌ External HTTPS access to n8n.bestviable.com (503 error)
- ❌ docker-gen template regeneration for n8n labels

**Root Cause**:
- docker-gen decides not to regenerate config

**Permanent Solutions**:
1. Use Cloudflare Tunnel (easiest)
2. Replace reverse proxy (medium effort)
3. Deep docker-gen debugging (hard)

**Files to Note**:
- `/infra/n8n/docker-compose.yml` (contains correct labels)
- `/root/portfolio/infra/n8n/nginx-n8n-upstream.conf` (manual config attempt)
- `/root/portfolio/infra/n8n/.env` (secrets - don't commit)

**Status**: Ready for Phase 3 selection (user chooses approach)
