# Archon Nginx-Proxy Integration Deployment v0.1

- entity: archon_nginx_deployment
- level: operational
- zone: internal
- version: v01
- tags: [archon, nginx-proxy, cloudflare, deployment, droplet]
- source_path: /docs/architecture/integrations/archon/ARCHON_NGINX_DEPLOYMENT_v01.md
- date: 2025-11-06

---

## Overview

This document describes how to deploy Archon on the droplet with full nginx-proxy and Cloudflare Tunnel integration (Option B from architectural decision).

**Key Decision**: Expose the Archon UI publicly at `https://archon.bestviable.com` through the existing nginx-proxy + Cloudflare Tunnel infrastructure, while keeping backend services (API, MCP) internal.

---

## Current Status

**As of 2025-11-06 07:22 UTC:**
- ✅ Docker build initiated on droplet
- ✅ Source code copied to droplet
- ✅ Nginx-proxy integration compose file created
- ⏳ Docker images currently building (archon-server, archon-mcp, archon-ui)
- ⏳ Awaiting build completion before nginx-proxy integration

**Deployment Location**: `/root/portfolio/infra/archon/`

---

## Two Compose Files

### Standard (Local Development)
- **File**: `docker-compose.yml`
- **Networks**: `app-network` only (internal)
- **Port Mappings**: Explicit ports for local access (8181, 8051, 3737)
- **Use Case**: Local development, testing

### Nginx-Proxy Integrated (Production)
- **File**: `docker-compose-nginx.yml`
- **Networks**: Both `n8n_proxy` and `app-network`
- **Port Mappings**: No explicit mappings (nginx-proxy handles routing)
- **Configuration**: VIRTUAL_HOST, LETSENCRYPT_HOST for nginx-proxy discovery
- **Use Case**: Production on droplet with public HTTPS access

---

## Architecture: Nginx-Proxy Integration

```
Internet Users (HTTPS)
       ↓
Cloudflare Edge
       ↓
Cloudflare Tunnel (cloudflared container in n8n stack)
       ↓
nginx-proxy:80 (on n8n_proxy network)
       ↓
archon-ui (3737) - PUBLIC
archon-server (8181) - INTERNAL
archon-mcp (8051) - INTERNAL
```

**Key Points:**
- archon-ui connects to BOTH `app-network` (for backend communication) AND `n8n_proxy` (for nginx-proxy discovery)
- archon-server and archon-mcp stay internal on `app-network` only
- nginx-proxy auto-discovers archon-ui via VIRTUAL_HOST environment variable
- Let's Encrypt certificates managed by acme-companion

---

## Deployment Steps

### Step 1: Verify Docker Build Complete

```bash
ssh tools-droplet-agents
cd /root/portfolio/infra/archon

# Check service status
docker compose ps

# Expected output:
# NAME              STATUS
# archon-server     Up X minutes (healthy)
# archon-mcp        Up X minutes (healthy)
# archon-ui         Up X minutes
```

If services aren't running yet, wait for build to complete or check logs:
```bash
docker compose logs --tail 50 archon-server
```

### Step 2: Verify Current Configuration

```bash
# Check if standard compose is running
docker compose ps

# View current environment
head -20 /root/portfolio/infra/archon/.env
```

### Step 3: Switch to Nginx-Proxy Configuration

Once standard deployment is working, replace the compose file:

```bash
cd /root/portfolio/infra/archon

# Backup current compose file
cp docker-compose.yml docker-compose.original.yml

# Use the nginx-proxy version
cp docker-compose-nginx.yml docker-compose.yml

# Verify file is correct
grep "VIRTUAL_HOST" docker-compose.yml
# Should output: VIRTUAL_HOST=archon.bestviable.com
```

### Step 4: Redeploy with Nginx-Proxy Configuration

```bash
cd /root/portfolio/infra/archon

# Stop current services
docker compose down

# Start with new configuration
docker compose up -d

# Monitor startup (wait ~60 seconds for services to be healthy)
docker compose logs -f

# Expected sequence:
# archon-server:  Starting
# archon-server:  Healthy
# archon-mcp:     Starting
# archon-mcp:     Healthy
# archon-ui:      Starting
# archon-ui:      Healthy

# Press Ctrl+C when all services show "healthy"
```

### Step 5: Verify Nginx-Proxy Discovery

```bash
# Check if nginx-proxy detected archon-ui
docker logs nginx-proxy | grep -i archon

# Expected output:
# upstream archon-ui:
# configuration reload successful

# If not found, troubleshoot:
docker logs nginx-proxy | tail -50
```

### Step 6: Add Cloudflare Tunnel Route (Manual)

**Important**: This step requires manual action in Cloudflare dashboard.

1. Open: https://one.dash.cloudflare.com/
2. Navigate: **Access → Tunnels** → Select your tunnel (likely "portfolio" or "bestviable")
3. Click **Public Hostname** tab
4. Click **+ Add a public hostname**
5. Fill in:
   - **Domain**: `archon.bestviable.com`
   - **Service Type**: `HTTP`
   - **URL**: `http://nginx-proxy:80`
6. Click **Save**
7. **Wait 30-60 seconds** for DNS propagation

### Step 7: Verify SSL Certificate

```bash
# Check if Let's Encrypt issued certificate
ls -la /root/portfolio/infra/n8n/nginx_certs/ | grep archon

# Should show files like:
# archon.bestviable.com.crt
# archon.bestviable.com.key

# If not present, wait 2-5 minutes (acme-companion is working)
docker logs nginx-proxy-acme | grep -i archon
```

### Step 8: Test External Access

```bash
# From your local machine (not on droplet):

# 1. Test HTTPS access
curl -I https://archon.bestviable.com
# Expected: HTTP/2 200 or HTTP/1.1 200

# 2. Check SSL certificate
curl -vI https://archon.bestviable.com 2>&1 | grep -E "(subject|issuer)"
# Expected: Issuer should be "Let's Encrypt"

# 3. Check certificate expiration
openssl s_client -connect archon.bestviable.com:443 -servername archon.bestviable.com 2>/dev/null | grep -E "notAfter"
# Expected: Should show valid date in the future
```

### Step 9: Verify Backend Communication

```bash
# From droplet (internal network test)

# 1. Can archon-ui reach archon-server?
docker exec archon-ui curl -I http://archon-server:8181/health
# Expected: HTTP/1.1 200 OK

# 2. Can nginx-proxy reach archon-ui?
docker exec nginx-proxy curl -I http://archon-ui:3737
# Expected: HTTP/1.1 200 OK

# 3. Can external request reach through proxy?
curl -I https://archon.bestviable.com
# Expected: HTTP/2 200 (after all above pass)
```

---

## Troubleshooting

### Issue: Services Won't Start

**Symptom**: `docker compose up` fails or containers exit immediately

**Diagnosis**:
```bash
docker compose logs --tail 100
# Look for specific error messages
```

**Common Causes**:
- OOM killed: Increase memory limits in compose file
- Supabase connection failed: Check `.env` has correct credentials
- Port conflict: Check if port 3737 is already in use

**Solution**:
```bash
# Check memory usage
docker stats archon-server --no-stream

# Verify Supabase URL is correct
grep SUPABASE_URL /root/portfolio/infra/archon/.env

# Check for port conflicts
netstat -tlnp | grep 3737
```

### Issue: Nginx-Proxy Not Discovering Archon

**Symptom**: `curl https://archon.bestviable.com` returns 503 or 502

**Diagnosis**:
```bash
docker logs nginx-proxy | grep -i archon
# If empty, nginx-proxy hasn't discovered the service

docker network inspect n8n_proxy | grep archon
# Check if archon-ui is on the network
```

**Solution**:
```bash
# 1. Verify VIRTUAL_HOST is set
docker inspect archon-ui | grep -i VIRTUAL_HOST
# Should show: "VIRTUAL_HOST=archon.bestviable.com"

# 2. If not set, edit docker-compose.yml and redeploy
docker compose down
docker compose up -d

# 3. Restart nginx-proxy to force config reload
docker restart nginx-proxy

# 4. Check logs again
docker logs nginx-proxy | grep -i archon
```

### Issue: SSL Certificate Not Issued

**Symptom**: `curl https://archon.bestviable.com` shows SSL error

**Diagnosis**:
```bash
# Check if certificate files exist
ls /root/portfolio/infra/n8n/nginx_certs/archon.bestviable.com*

# Check acme-companion logs
docker logs nginx-proxy-acme | grep -i archon | tail -20
```

**Solution**:
```bash
# Wait 5 minutes for acme-companion to issue certificate
# If still failing after 5 minutes:

# 1. Check if Let's Encrypt rate limit hit
docker logs nginx-proxy-acme | grep -i "rate limit"

# 2. If rate limited, wait 1 hour

# 3. Check if LETSENCRYPT_HOST is set
docker inspect archon-ui | grep -i LETSENCRYPT_HOST
# Should show: "LETSENCRYPT_HOST=archon.bestviable.com"

# 4. If missing, redeploy with updated compose file
```

### Issue: 502 Bad Gateway

**Symptom**: `curl https://archon.bestviable.com` returns HTTP 502

**Diagnosis**:
```bash
# Check if archon-ui is healthy
docker inspect archon-ui | grep -A 5 '"Health"'
# Should show: "Status": "healthy"

# Check if archon-ui is listening on port 3737
docker exec archon-ui netstat -tlnp | grep 3737
# Should show: tcp    0      0 0.0.0.0:3737    LISTENING
```

**Solution**:
```bash
# 1. If unhealthy, check application logs
docker logs archon-ui --tail 50

# 2. If not listening on 3737, app crashed
docker logs archon-ui --tail 100 | grep -i error

# 3. If OOM killed, increase memory in compose file
# Edit: deploy.resources.limits.memory: 1500m

# 4. Redeploy
docker compose down
docker compose up -d
```

---

## Verification Checklist

Run these commands to verify successful deployment:

```bash
#!/bin/bash
set -e

echo "=== Archon Nginx-Proxy Deployment Verification ==="
echo ""

echo "1. Services running?"
docker ps | grep archon | grep -q "Up" && echo "✅ Services running" || echo "❌ Services not running"

echo "2. Services healthy?"
docker inspect archon-server | grep -q '"healthy"' && echo "✅ archon-server healthy" || echo "⚠️  archon-server not ready"
docker inspect archon-mcp | grep -q '"healthy"' && echo "✅ archon-mcp healthy" || echo "⚠️  archon-mcp not ready"
docker inspect archon-ui | grep -q '"healthy"' && echo "✅ archon-ui healthy" || echo "⚠️  archon-ui not ready"

echo "3. On correct networks?"
docker network inspect n8n_proxy | grep -q "archon-ui" && echo "✅ archon-ui on n8n_proxy" || echo "❌ archon-ui not on n8n_proxy"

echo "4. Nginx-proxy discovered it?"
docker logs nginx-proxy | grep -q "archon" && echo "✅ Nginx-proxy discovered archon" || echo "⚠️  Nginx-proxy hasn't discovered archon yet"

echo "5. SSL certificate issued?"
[[ -f /root/portfolio/infra/n8n/nginx_certs/archon.bestviable.com.crt ]] && echo "✅ SSL certificate exists" || echo "⏳ Waiting for SSL certificate"

echo "6. Can reach internally?"
docker exec nginx-proxy curl -s -I http://archon-ui:3737 | grep -q "200\|301" && echo "✅ nginx-proxy can reach archon-ui" || echo "❌ nginx-proxy cannot reach archon-ui"

echo "7. Can reach externally (HTTPS)?"
curl -s -I https://archon.bestviable.com | grep -q "200\|301" && echo "✅ External HTTPS access working" || echo "⏳ External access not yet ready"

echo ""
echo "=== Verification Complete ==="
```

Run it:
```bash
bash /tmp/verify-archon-deployment.sh
```

---

## Next Steps

Once verification passes:

1. **Update Archon Configuration** - Configure any service-specific settings
2. **Monitor Logs** - Watch for 1 hour to ensure stability: `docker logs -f archon-ui`
3. **Phase 2B: n8n Integration** - Create memory orchestration workflows
4. **Phase 2C: MCP Servers** - Deploy additional MCP servers

---

## Rollback Plan

If nginx-proxy integration causes issues:

```bash
cd /root/portfolio/infra/archon

# Restore original compose file
cp docker-compose.original.yml docker-compose.yml

# Stop and restart with internal config
docker compose down
docker compose up -d

# Services will be available on internal ports only:
# - archon-server: http://localhost:8181 (from droplet)
# - archon-mcp: http://localhost:8051
# - archon-ui: http://localhost:3737
```

---

## Architecture Decision Rationale

**Why Option B (Nginx-Proxy Integration)?**

1. **Production-Ready**: Uses the established nginx-proxy infrastructure already running on the droplet
2. **Security**: Leverages Cloudflare Tunnel for zero-IP exposure
3. **SSL Management**: Automatic certificate generation and renewal via Let's Encrypt
4. **Scalability**: Same pattern used for other services (n8n, Open WebUI, etc.)
5. **Future Services**: Easy to add more public endpoints following the same pattern

**What This Enables:**

- Public Archon UI at `https://archon.bestviable.com`
- Internal API access for n8n workflows
- MCP server access for Claude Code IDE integration
- Unified DNS and SSL management across all portfolio services

---

## Files Reference

**On Droplet:**
- `/root/portfolio/infra/archon/docker-compose.yml` - Current compose file
- `/root/portfolio/infra/archon/docker-compose-nginx.yml` - Nginx-proxy version (pre-staged)
- `/root/portfolio/infra/archon/.env` - Environment variables (Supabase credentials)
- `/root/portfolio/infra/n8n/docker-compose.yml` - Parent n8n stack (for reference)

**Local Reference:**
- `/Users/davidkellam/workspace/archon/docker-compose.yml` - Local development version
- `/Users/davidkellam/workspace/portfolio/infra/apps/SERVICE_DEPLOYMENT_GUIDE.md` - Nginx-proxy patterns

---

**Version**: 0.1
**Status**: Ready for deployment
**Last Updated**: 2025-11-06
**Next Review**: After droplet deployment completes

