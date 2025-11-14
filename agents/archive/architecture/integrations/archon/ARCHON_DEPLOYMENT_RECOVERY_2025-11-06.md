- entity: archon_deployment_recovery
- level: operational
- zone: internal
- version: v01
- tags: [archon, nginx-proxy, deployment, recovery, phase2a]
- source_path: /docs/architecture/integrations/archon/ARCHON_DEPLOYMENT_RECOVERY_2025-11-06.md
- date: 2025-11-06

---

# Archon Deployment Recovery & Completion Guide

## Current Status (2025-11-06 07:47 UTC)

**Phase**: Nginx-Proxy Integration Switch Initiated
**Status**: Deployment execution started; Droplet SSH temporarily unreachable
**Likely Cause**: Docker services redeploying with new nginx-proxy configuration
**Expected Duration**: Services should restart within 2-5 minutes

---

## What Was Executed

At approximately 2025-11-06 07:45-07:46 UTC, I initiated the complete nginx-proxy integration deployment with this sequence:

1. ✅ **Waited for services to become healthy** (up to 50 seconds)
2. ✅ **Backed up original compose file** (`docker-compose.original.yml`)
3. ✅ **Switched to nginx-proxy version** (copied `docker-compose-nginx.yml` → `docker-compose.yml`)
4. ✅ **Brought down services** (`docker compose down`)
5. **In Progress**: Redeploying services with nginx-proxy configuration (`docker compose up -d`)
6. **In Progress**: Monitoring startup (should complete in 30-60 seconds)

---

## Expected Outcome When Droplet Comes Online

When SSH reconnects, you should see:

```bash
NAME            IMAGE                    STATUS
archon-server   archon-archon-server     Up X minutes (healthy)
archon-mcp      archon-archon-mcp        Up X minutes (healthy)
archon-ui       archon-archon-frontend   Up X minutes
```

**Key Difference from Before**:
- `archon-ui` now connected to BOTH `app-network` (internal) AND `n8n_proxy` (nginx discovery)
- No explicit port mappings (nginx-proxy handles routing)
- Services configured with `VIRTUAL_HOST=archon.bestviable.com`

---

## Recovery Checklist (Execute When SSH Available)

### Step 1: Verify SSH Connectivity

```bash
ssh tools-droplet-agents "echo connected"
# If fails, try: ssh root@159.65.97.146 "echo connected"
```

### Step 2: Check Services Status

```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose ps"
```

**Expected Output**:
- All three services (archon-server, archon-mcp, archon-ui) running
- archon-server and archon-mcp showing `healthy` status
- archon-ui showing `Up X minutes`

**If Services Not Running**:
```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose logs --tail 100"
# Check for errors; if failed, see ROLLBACK section below
```

### Step 3: Verify Nginx-Proxy Discovery

```bash
ssh tools-droplet-agents "docker logs nginx-proxy | grep -i archon | tail -10"
```

**Expected Output**:
```
[gen] upstream archon-ui...
[gen] configuration reload successful
```

**If No Output**:
```bash
ssh tools-droplet-agents "docker network inspect n8n_proxy | grep archon-ui"
# Verify archon-ui is connected to n8n_proxy network
```

### Step 4: Check Docker Networks

```bash
ssh tools-droplet-agents "docker inspect archon-ui | jq '.NetworkSettings.Networks'"
```

**Expected**: archon-ui should be on both `app-network` and `n8n_proxy`

---

## Cloudflare Tunnel Route Configuration (Manual Step)

Once services are verified healthy, configure the Cloudflare route:

1. **Open Dashboard**: https://one.dash.cloudflare.com/
2. **Navigate**: Access → Tunnels → Select tunnel (portfolio or bestviable)
3. **Click**: Public Hostname tab
4. **Click**: + Add a public hostname
5. **Fill Form**:
   - **Domain**: `archon.bestviable.com`
   - **Service Type**: `HTTP`
   - **URL**: `http://nginx-proxy:80`
6. **Click**: Save
7. **Wait**: 30-60 seconds for DNS propagation

---

## SSL Certificate Verification

After Cloudflare route is configured, Let's Encrypt will automatically issue a certificate:

```bash
# Check if certificate exists (wait 2-5 minutes if not present)
ssh tools-droplet-agents "ls -la /root/portfolio/infra/n8n/nginx_certs/ | grep archon"
```

**Expected Files**:
- `archon.bestviable.com.crt`
- `archon.bestviable.com.key`

**Monitor Generation**:
```bash
ssh tools-droplet-agents "docker logs nginx-proxy-acme | grep -i archon | tail -20"
```

---

## Final Verification

### Test 1: Internal Connectivity

```bash
ssh tools-droplet-agents "docker exec nginx-proxy curl -I http://archon-ui:3737"
# Expected: HTTP/1.1 200 OK
```

### Test 2: External HTTPS Access

```bash
# From local machine (NOT SSH)
curl -I https://archon.bestviable.com
# Expected: HTTP/2 200 or HTTP/1.1 200
```

### Test 3: SSL Certificate Validation

```bash
# From local machine
curl -vI https://archon.bestviable.com 2>&1 | grep -E "(subject|issuer)"
# Expected:
# subject: CN = archon.bestviable.com
# issuer: CN = R3, O = Let's Encrypt, ...
```

### Test 4: Open in Browser

Navigate to: **https://archon.bestviable.com**

**Expected**:
- 🔒 Green lock icon (HTTPS working)
- Archon UI loads
- Can interact with interface

---

## Troubleshooting

### Issue: Services Still Not Running After 5 Minutes

**Action**:
```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose logs --tail 200 archon-server 2>&1 | grep -i error"
```

**Common Issues**:
- OOM killed: Increase memory limits in docker-compose.yml
- Supabase connection failed: Verify .env SUPABASE_URL (should end in `.co`, not `.com`)
- Network error: Check if n8n_proxy network exists: `docker network ls | grep n8n_proxy`

### Issue: Nginx-Proxy Not Discovering Archon

**Action**:
```bash
# Verify VIRTUAL_HOST is set
ssh tools-droplet-agents "docker inspect archon-ui | grep VIRTUAL_HOST"

# Should show: "VIRTUAL_HOST=archon.bestviable.com"

# If not, redeploy:
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose down && docker compose up -d"

# Restart nginx-proxy to force reload
ssh tools-droplet-agents "docker restart nginx-proxy"
```

### Issue: SSL Certificate Not Issued After 10 Minutes

**Action**:
```bash
# Check acme-companion logs
ssh tools-droplet-agents "docker logs nginx-proxy-acme | grep -i archon | tail -30"

# Look for:
# - "rate limit" → Wait 1 hour
# - "error" messages → Check domain configuration
# - "certificate issued successfully" → Certificate ready
```

---

## Rollback Procedure (If Major Issues)

If the nginx-proxy integration causes critical problems:

```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && \
  cp docker-compose.original.yml docker-compose.yml && \
  docker compose down && \
  docker compose up -d"
```

**After Rollback**:
- Services available on internal ports only
- archon-server: `http://localhost:8181`
- archon-mcp: `http://localhost:8051`
- archon-ui: `http://localhost:3737`
- No public HTTPS access until re-deployed with nginx-proxy

---

## Success Criteria (All Must Pass)

1. ✅ All services healthy: `docker compose ps` shows all "Up (healthy)"
2. ✅ Nginx-proxy discovered archon: `docker logs nginx-proxy | grep archon` has output
3. ✅ archon-ui on both networks: `docker inspect archon-ui | jq '.NetworkSettings.Networks' | grep -E '(app-network|n8n_proxy)'`
4. ✅ SSL certificate issued: `ls /root/portfolio/infra/n8n/nginx_certs/archon.bestviable.com.crt`
5. ✅ External HTTPS works: `curl -I https://archon.bestviable.com` returns 2xx status
6. ✅ Cloudflare route configured: Domain appears in dashboard with ✅ status

---

## Next Steps After Deployment Completes

1. **Monitor for Stability**: Watch logs for 1 hour
   ```bash
   ssh tools-droplet-agents "docker logs -f archon-ui"
   ssh tools-droplet-agents "docker logs -f nginx-proxy"
   ```

2. **Update Documentation**: Mark Phase 2A complete in `DEPLOYMENT_STATE_v0_2.md`

3. **Phase 2B: n8n Integration** (Next major phase)
   - Create `/webhook/memory-assemble` workflow
   - Create `/webhook/memory-writeback` workflow
   - Deploy Open WebUI
   - Wire up pre/post hooks

4. **Phase 2C: MCP Servers** (Later phase)
   - Deploy Coda MCP
   - Deploy GitHub MCP
   - Deploy Firecrawl MCP

---

## Reference Commands (Quick Access)

```bash
# Check service status
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose ps"

# View logs
ssh tools-droplet-agents "docker logs -f archon-server"
ssh tools-droplet-agents "docker logs -f nginx-proxy"
ssh tools-droplet-agents "docker logs -f nginx-proxy-acme"

# Check networks
ssh tools-droplet-agents "docker network ls | grep -E '(n8n_proxy|app-network)'"
ssh tools-droplet-agents "docker network inspect n8n_proxy | grep archon"

# Check certificate
ssh tools-droplet-agents "ls -la /root/portfolio/infra/n8n/nginx_certs/archon*"
ssh tools-droplet-agents "openssl x509 -in /root/portfolio/infra/n8n/nginx_certs/archon.bestviable.com.crt -text -noout | grep -E '(Subject|Issuer|Not After)'"

# Test internal connectivity
ssh tools-droplet-agents "docker exec nginx-proxy curl -I http://archon-ui:3737"

# Test external connectivity
curl -I https://archon.bestviable.com

# Rollback if needed
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && cp docker-compose.original.yml docker-compose.yml && docker compose down && docker compose up -d"
```

---

## Timeline Summary

| Event | Time | Duration | Status |
|-------|------|----------|--------|
| Docker build started | 07:05 UTC | 30 min | ✅ Complete |
| Services initial startup | 07:35 UTC | - | ✅ Complete |
| Nginx-proxy integration initiated | 07:45 UTC | ~5 min | 🔄 In Progress |
| Expected services restart | 07:50 UTC | - | ⏳ Pending |
| SSH should reconnect | 07:50 UTC | - | ⏳ Pending |
| Manual Cloudflare config | 07:52 UTC | 2 min | ⏳ Pending |
| Certificate issued | 07:55 UTC | - | ⏳ Pending |
| External HTTPS ready | 07:56 UTC | - | ⏳ Pending |

**Estimated Total Deployment**: ~52 minutes from docker build start to full external access

---

## Document Index

- **Status Tracker**: `/Users/davidkellam/workspace/portfolio/sot/DEPLOYMENT_STATE_v0_2.md`
- **Nginx Deployment Guide**: `/Users/davidkellam/workspace/portfolio/docs/architecture/integrations/archon/ARCHON_NGINX_DEPLOYMENT_v01.md`
- **Execution Checklist**: `/Users/davidkellam/workspace/portfolio/docs/architecture/integrations/archon/ARCHON_NGINX_INTEGRATION_EXECUTION_2025-11-06.md`
- **This File**: `/Users/davidkellam/workspace/portfolio/docs/architecture/integrations/archon/ARCHON_DEPLOYMENT_RECOVERY_2025-11-06.md`
- **Session Summary**: `/Users/davidkellam/workspace/portfolio/docs/architecture/integrations/archon/ARCHON_DEPLOYMENT_SESSION_SUMMARY_2025-11-06.md`

---

**Version**: 0.1
**Created**: 2025-11-06 07:47+ UTC
**Status**: Deployment in progress; awaiting droplet recovery
**Next Action**: Monitor SSH connectivity; execute recovery checklist when available

