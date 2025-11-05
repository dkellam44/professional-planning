# Cloudflare Tunnel Routes Configuration

- entity: cloudflare_routes
- level: operational
- zone: internal
- version: v01
- tags: [cloudflare, tunnel, routes, phase1]
- source_path: /infra/apps/CLOUDFLARE_ROUTES.md
- date: 2025-11-05

---

## Overview

Phase 1 apps are deployed and running on the droplet with nginx-proxy labels configured. To make them accessible externally via HTTPS, you must add public hostname routes in Cloudflare Zero Trust.

**Current Status:**
- ✅ Containers running: openweb, kuma, dozzle
- ✅ nginx-proxy labels configured (auto-discovery enabled)
- ✅ Cloudflare tunnel connected (cloudflared daemon running)
- ❌ Public hostname routes NOT added yet (manual step required)

---

## Step 1: Access Cloudflare Zero Trust Dashboard

1. Go to: https://one.dash.cloudflare.com/
2. Select your account
3. Navigate: **Access** → **Tunnels**
4. Select your tunnel (should be named something like `tools-droplet-agents` or your hostname)

---

## Step 2: Add Public Hostname Routes

In the tunnel's **Public Hostnames** tab, add 3 ingress rules:

### Route 1: Dozzle (Log Viewer)
```
Domain: logs.bestviable.com
Service: HTTP
URL: http://nginx-proxy:80
```

### Route 2: Open WebUI
```
Domain: openweb.bestviable.com
Service: HTTP
URL: http://nginx-proxy:80
```

### Route 3: Uptime Kuma
```
Domain: kuma.bestviable.com
Service: HTTP
URL: http://nginx-proxy:80
```

### (Optional) Route 4: N8N
```
Domain: n8n.bestviable.com
Service: HTTP
URL: http://nginx-proxy:80
```

### (Optional) Route 5: Coda MCP
```
Domain: coda.bestviable.com
Service: HTTP
URL: http://nginx-proxy:80
```

**All routes point to `nginx-proxy:80` because:**
- nginx-proxy runs on the `n8n_proxy` network (same as Cloudflare tunnel)
- It has auto-discovery enabled via Docker labels
- It routes based on `VIRTUAL_HOST` labels (openweb.bestviable.com, kuma.bestviable.com, etc.)
- It also handles SSL termination and certificate renewal via acme-companion

---

## Step 3: Verify DNS Resolution

After adding routes (wait ~30 seconds for propagation), verify DNS resolution:

```bash
# Test DNS resolution
dig logs.bestviable.com
dig openweb.bestviable.com
dig kuma.bestviable.com

# Expected output: Should show Cloudflare nameservers (cf-ns1.com, cf-ns2.com, etc.)
```

---

## Step 4: Test HTTPS Access

Once DNS resolves, test HTTPS connectivity:

```bash
# Test each endpoint
curl -I https://logs.bestviable.com
curl -I https://openweb.bestviable.com
curl -I https://kuma.bestviable.com

# Expected: HTTP 200 or redirect to /
# SSL cert should be valid (issued by Let's Encrypt via acme-companion)
```

---

## Step 5: Verify in Droplet Logs

Monitor the droplet to confirm tunnel traffic:

```bash
# Check Cloudflare tunnel logs
ssh tools-droplet-agents "docker logs cloudflared | tail -20"

# Should see entries like:
# INF registered tunnel connection
# INF Tunnel route updated

# Check nginx-proxy logs for incoming requests
ssh tools-droplet-agents "docker logs nginx-proxy | tail -20"

# Should see vhost entries for each domain
```

---

## Troubleshooting

### Routes Added but Still Getting 502 Error

1. **Check nginx-proxy is running:**
   ```bash
   ssh tools-droplet-agents "docker ps | grep nginx-proxy"
   # Should show: nginx-proxy (Up, healthy)
   ```

2. **Check docker labels are set correctly:**
   ```bash
   ssh tools-droplet-agents "docker inspect openweb | grep -A 2 VIRTUAL_HOST"
   # Should show: VIRTUAL_HOST=openweb.bestviable.com
   ```

3. **Check nginx-proxy discovered the containers:**
   ```bash
   ssh tools-droplet-agents "docker logs nginx-proxy | grep -E '(upstreams|new htpasswd|generated|Reloaded)' | tail -10"
   ```

4. **Verify tunnel connection is alive:**
   ```bash
   ssh tools-droplet-agents "docker logs cloudflared | grep 'Registered tunnel' | tail -1"
   # Should show a recent timestamp
   ```

### SSL Certificate Not Generated

acme-companion should auto-generate certs when Cloudflare routes are added. If not:

```bash
# Check acme-companion logs
ssh tools-droplet-agents "docker logs nginx-proxy-acme | tail -50"

# Look for errors about certificate generation
# If needed, you can manually trigger renewal:
# (Usually not necessary - acme handles it)
```

### DNS Not Resolving

- Wait 30-60 seconds for Cloudflare DNS propagation
- Check Cloudflare DNS settings: Websites → DNS → check your zone
- Verify domain is pointing to Cloudflare nameservers

---

## Integration with N8N Workflows (Phase 3)

Once routes are added and tested, Phase 3 workflows can use external HTTPS webhooks:

```
N8N Webhook: https://n8n.bestviable.com/webhook/memory/assemble
Open WebUI: https://openweb.bestviable.com
Pre-hook: https://n8n.bestviable.com/webhook/memory/assemble
Post-hook: https://n8n.bestviable.com/webhook/memory/writeback
```

These external URLs are required for Open WebUI to call back into n8n webhooks.

---

## Next Steps

1. Add the 3+ routes in Cloudflare UI (5 mins)
2. Wait 30s for DNS propagation
3. Test with `curl -I https://openweb.bestviable.com` (should get HTTP 200)
4. Proceed to Phase 3: N8N workflow setup
5. Configure Open WebUI hooks to call n8n webhooks

---

**Status:** Manual configuration required (cannot be automated without Cloudflare API token)
**Owner:** Next agent or user
**Timeline:** 10-15 minutes total
