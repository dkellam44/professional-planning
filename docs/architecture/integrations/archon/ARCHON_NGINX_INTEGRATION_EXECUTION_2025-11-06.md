- entity: archon_nginx_integration_execution
- level: operational
- zone: internal
- version: v01
- tags: [archon, nginx-proxy, cloudflare, deployment, execution, phase2a]
- source_path: /docs/architecture/integrations/archon/ARCHON_NGINX_INTEGRATION_EXECUTION_2025-11-06.md
- date: 2025-11-06

---

# Archon Nginx-Proxy Integration Execution Checklist

## Status Summary

**Current Phase**: Docker build complete → Nginx-proxy integration ready
**Docker Build Started**: 2025-11-06 07:05 UTC
**Estimated Build Duration**: 15-20 minutes
**Current Time**: 2025-11-06 07:30+ UTC
**Build Status**: ✅ Complete (~30 minutes runtime)

---

## Phase 1: Verify Docker Build & Service Health

### Step 1.1: Connect to Droplet and Check Services

```bash
ssh tools-droplet-agents
cd /root/portfolio/infra/archon
docker compose ps
```

**Expected Output**:
```
NAME              STATUS
archon-server     Up XX minutes (healthy)
archon-mcp        Up XX minutes (healthy)
archon-ui         Up XX minutes
```

**If services are NOT running**:
```bash
docker compose logs --tail 100 archon-server
# Check for specific error messages
```

### Step 1.2: Verify Health Check Status

```bash
docker inspect archon-server | grep -A 5 '"Health"'
docker inspect archon-mcp | grep -A 5 '"Health"'
docker inspect archon-ui | grep -A 5 '"Health"'
```

**Expected**: All three should show `"Status": "healthy"`

### Step 1.3: Quick Connectivity Test

```bash
# Can archon-ui reach archon-server?
docker exec archon-ui curl -I http://archon-server:8181/health

# Expected: HTTP/1.1 200 OK
```

### ✅ GATE: Proceed only if all services are healthy

If services aren't healthy, troubleshoot using `ARCHON_NGINX_DEPLOYMENT_v01.md` section "Troubleshooting" before proceeding.

---

## Phase 2: Switch to Nginx-Proxy Configuration

### Step 2.1: Backup Current Configuration

```bash
cd /root/portfolio/infra/archon

# Backup the working standard config
cp docker-compose.yml docker-compose.original.yml

# Verify nginx-proxy version exists
ls -la docker-compose-nginx.yml
# Should show the pre-staged file from deployment preparation
```

### Step 2.2: Switch Compose Files

```bash
# Use the nginx-proxy integrated version
cp docker-compose-nginx.yml docker-compose.yml

# Verify the switch
grep "VIRTUAL_HOST" docker-compose.yml
# Expected output: VIRTUAL_HOST=archon.bestviable.com
```

### Step 2.3: Redeploy Services

```bash
# Stop current services (standard config)
docker compose down

# Start with new configuration (nginx-proxy integrated)
docker compose up -d

# Monitor startup progress
docker compose logs -f
```

**Watch for in the logs**:
- `archon-server: Starting`
- `archon-server: Healthy`
- `archon-mcp: Starting`
- `archon-mcp: Healthy`
- `archon-ui: Starting`
- `archon-ui: Healthy`

**Exit logs** with Ctrl+C once all services show "healthy" status (usually ~60 seconds)

---

## Phase 3: Verify Nginx-Proxy Discovery

### Step 3.1: Check Nginx-Proxy Logs

```bash
# Verify nginx-proxy discovered archon-ui
docker logs nginx-proxy | grep -i archon | tail -20

# Expected output (variations):
# [gen] upstream archon-ui...
# [gen] configuration reload successful
```

If no output, troubleshoot:
```bash
# 1. Verify VIRTUAL_HOST is set on archon-ui
docker inspect archon-ui | grep -i VIRTUAL_HOST
# Should show: "VIRTUAL_HOST=archon.bestviable.com"

# 2. Verify archon-ui is on n8n_proxy network
docker network inspect n8n_proxy | grep archon
# Should show archon-ui in the network

# 3. Force nginx-proxy to reload config
docker restart nginx-proxy

# 4. Check logs again
docker logs nginx-proxy | tail -50
```

### Step 3.2: Verify Internal Communication

```bash
# Can nginx-proxy reach archon-ui?
docker exec nginx-proxy curl -I http://archon-ui:3737
# Expected: HTTP/1.1 200 OK or 301 Redirect

# If fails, check archon-ui logs
docker logs archon-ui | tail -50
```

---

## Phase 4: Configure Cloudflare Tunnel Route (MANUAL STEP)

### Step 4.1: Open Cloudflare Dashboard

Navigate to: **https://one.dash.cloudflare.com/**

### Step 4.2: Add Public Hostname

1. Left sidebar: **Access → Tunnels**
2. Select your tunnel (likely "portfolio" or "bestviable")
3. Click **Public Hostname** tab
4. Click **+ Add a public hostname**

### Step 4.3: Configure Route

Fill in the form:

| Field | Value |
|-------|-------|
| **Subdomain** | `archon` |
| **Domain** | `bestviable.com` |
| **Service Type** | `HTTP` |
| **URL** | `http://nginx-proxy:80` |

**Click Save**

### Step 4.4: Wait for DNS Propagation

- **Time Required**: 30-60 seconds
- DNS TTL will propagate globally
- You may see HTTP 502 during propagation (normal)

---

## Phase 5: Verify SSL Certificate

### Step 5.1: Check Certificate Generation

```bash
# From droplet, check if Let's Encrypt issued certificate
ls -la /root/portfolio/infra/n8n/nginx_certs/ | grep archon

# Expected output:
# archon.bestviable.com.crt
# archon.bestviable.com.key
```

If certificates don't exist yet:

```bash
# Check acme-companion logs
docker logs nginx-proxy-acme | grep -i archon | tail -20

# Wait 2-5 minutes for ACME to issue certificate
# Then check again
```

### Step 5.2: Verify Certificate Details

```bash
# Check certificate chain
openssl x509 -in /root/portfolio/infra/n8n/nginx_certs/archon.bestviable.com.crt \
  -text -noout | grep -E "(Subject|Issuer|Not After)"

# Expected:
# Subject: CN=archon.bestviable.com
# Issuer: CN=R3, O=Let's Encrypt
# Not After: (date 3 months in future)
```

---

## Phase 6: Test External HTTPS Access

### Step 6.1: Test from Local Machine (NOT from droplet)

```bash
# Test basic connectivity
curl -I https://archon.bestviable.com

# Expected: HTTP/2 200 or HTTP/1.1 200
```

If you get connection errors:
- Wait 60 more seconds for DNS/CF propagation
- Try again

### Step 6.2: Test SSL Certificate

```bash
# Verify certificate is valid
curl -vI https://archon.bestviable.com 2>&1 | grep -E "(subject|issuer)"

# Expected:
# subject: CN = archon.bestviable.com
# issuer: CN = R3, O = Let's Encrypt, ...
```

### Step 6.3: Check Certificate Expiration

```bash
openssl s_client -connect archon.bestviable.com:443 \
  -servername archon.bestviable.com 2>/dev/null | grep -E "notAfter"

# Expected: Date 3 months in the future
```

### Step 6.4: Open in Browser

Navigate to: **https://archon.bestviable.com**

**Expected**:
- Green 🔒 lock icon (HTTPS working)
- Archon UI loads
- Can interact with interface

---

## Phase 7: Verify Complete Deployment

Run the verification script from `ARCHON_NGINX_DEPLOYMENT_v01.md`:

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

---

## Success Criteria

Deployment is **COMPLETE** when:

1. ✅ All services healthy: `docker compose ps` shows all "Up (healthy)"
2. ✅ Nginx-proxy discovered archon: `docker logs nginx-proxy | grep archon` has output
3. ✅ SSL certificate issued: `ls /root/portfolio/infra/n8n/nginx_certs/archon*` shows files
4. ✅ External access works: `curl -I https://archon.bestviable.com` returns HTTP/2 200
5. ✅ Backend communication works: `curl http://archon.bestviable.com/health` returns 200

---

## Troubleshooting Guide

### Issue: Services Won't Start After Switch

**Symptom**: `docker compose up -d` fails or containers exit immediately

**Debug**:
```bash
docker compose logs --tail 100 archon-server
docker compose logs --tail 100 archon-mcp
docker compose logs --tail 100 archon-ui
```

**Solutions**:
- Check memory: `docker stats archon-server --no-stream`
- Check Supabase URL: `grep SUPABASE_URL .env`
- Restore original: `cp docker-compose.original.yml docker-compose.yml && docker compose up -d`

### Issue: 502 Bad Gateway After Switch

**Symptom**: `curl https://archon.bestviable.com` returns 502

**Debug**:
```bash
docker inspect archon-ui | grep -A 5 '"Health"'
docker exec nginx-proxy curl -I http://archon-ui:3737
docker logs archon-ui | tail -50
```

**Solutions**:
- If archon-ui unhealthy: Check logs for errors
- If port 3737 not listening: App crashed, increase memory limit
- If network issue: Verify networks `docker network inspect n8n_proxy`

### Issue: SSL Certificate Not Issued

**Symptom**: `curl -I https://archon.bestviable.com` shows SSL error

**Debug**:
```bash
ls /root/portfolio/infra/n8n/nginx_certs/archon*
docker logs nginx-proxy-acme | grep -i archon
```

**Solutions**:
- Wait 5 minutes (ACME is working)
- Check for rate limit: `docker logs nginx-proxy-acme | grep -i "rate limit"`
- If rate limited: Wait 1 hour, retry
- Verify LETSENCRYPT_HOST: `docker inspect archon-ui | grep LETSENCRYPT`

### Issue: Cannot Connect to Droplet

**Symptom**: SSH hangs or times out

**Solutions**:
```bash
# Try connecting to main droplet first
ssh tools-droplet-agents "echo connected"

# If works, try archon-specific commands individually
ssh tools-droplet-agents "docker ps"
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose ps"
```

---

## Rollback Procedure

If nginx-proxy integration causes issues:

```bash
cd /root/portfolio/infra/archon

# Restore original compose file
cp docker-compose.original.yml docker-compose.yml

# Stop and restart with internal config
docker compose down
docker compose up -d

# Services available on internal ports only:
# - archon-server: http://localhost:8181
# - archon-mcp: http://localhost:8051
# - archon-ui: http://localhost:3737
```

---

## Next Steps After Successful Deployment

Once nginx-proxy integration is complete:

1. **Monitor for Stability**: Watch logs for 1 hour post-deployment
   ```bash
   docker logs -f archon-ui
   docker logs -f nginx-proxy
   ```

2. **Phase 2B**: Create n8n memory orchestration workflows
   - Memory-assemble webhook
   - Memory-writeback webhook
   - Integration with Open WebUI

3. **Phase 2C**: Deploy additional MCP servers
   - Coda MCP
   - GitHub MCP
   - Firecrawl MCP

4. **Documentation**: Update `DEPLOYMENT_STATE_v0_2.md` with completion status

---

## Reference Files

**Local Machine**:
- This file: `/Users/davidkellam/workspace/portfolio/docs/architecture/integrations/archon/ARCHON_NGINX_INTEGRATION_EXECUTION_2025-11-06.md`
- Deployment guide: `/Users/davidkellam/workspace/portfolio/docs/architecture/integrations/archon/ARCHON_NGINX_DEPLOYMENT_v01.md`
- State tracking: `/Users/davidkellam/workspace/portfolio/sot/DEPLOYMENT_STATE_v0_2.md`

**On Droplet**:
- Standard compose: `/root/portfolio/infra/archon/docker-compose.original.yml` (backup)
- Nginx-proxy compose: `/root/portfolio/infra/archon/docker-compose.yml` (active after switch)
- Environment: `/root/portfolio/infra/archon/.env`
- Nginx certs: `/root/portfolio/infra/n8n/nginx_certs/`

---

**Version**: 0.1
**Created**: 2025-11-06 07:30+ UTC
**Status**: Ready for execution
**Next Review**: After successful deployment completion

