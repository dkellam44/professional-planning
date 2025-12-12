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

## Proxy Stack Checklist (do this before adding routes)

1. **Proxy services running with shared volumes** – confirm both `nginx-proxy` and `nginx-proxy-acme` mount `/etc/nginx/vhost.d` and `/usr/share/nginx/html` (see `infra/n8n/docker-compose.yml`). Without these, ACME challenges fail.
2. **Service metadata exported as environment variables** – every container on the tunnel must define `VIRTUAL_HOST`, `VIRTUAL_PORT`, `LETSENCRYPT_HOST`, `LETSENCRYPT_EMAIL` in its compose `environment:` block. jwilder ignores pure labels.
3. **Reload after config changes** – whenever you touch proxy env/volumes or service VIRTUAL_* values, rerun:
   ```bash
   docker compose -f infra/n8n/docker-compose.yml up -d
   docker compose -f infra/apps/<service>/docker-compose.yml up -d
   ```
   This regenerates nginx config and lets acme-companion retry HTTP-01 challenges.

When the checklist is green, continue with the Cloudflare steps below.

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
URL: http://traefik:80
```

### Route 2: Open WebUI
```
Domain: openwebui.bestviable.com
Service: HTTP
URL: http://traefik:80
```

### Route 3: Uptime Kuma
```
Domain: kuma.bestviable.com
Service: HTTP
URL: http://traefik:80
```

### (Optional) Route 4: N8N
```
Domain: n8n.bestviable.com
Service: HTTP
URL: http://traefik:80
```

### (Optional) Route 5: Coda MCP
```
Domain: coda.bestviable.com
Service: HTTP
URL: http://traefik:80
```

**All routes point to `traefik:80` because:**
- Traefik runs on the `docker_proxy` network (same as Cloudflare tunnel)
- It has auto-discovery enabled via Docker labels
- It routes based on `Host()` rules in Traefik labels (openwebui.bestviable.com, kuma.bestviable.com, etc.)
- SSL/TLS is terminated at Cloudflare edge (Traefik runs HTTP-only on port 80)

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
curl -I https://openwebui.bestviable.com
curl -I https://kuma.bestviable.com

# Expected: HTTP 200 or redirect to /
# SSL handled by Cloudflare (Traefik runs HTTP-only on port 80)
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

2. **Check VIRTUAL_* metadata is present:**
   ```bash
   ssh tools-droplet-agents "docker inspect openweb --format '{{range .Config.Env}}{{println .}}{{end}}' | grep VIRTUAL_HOST"
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

### Let’s Encrypt Challenge Keeps Returning 404

If Cloudflare shows `Invalid response from /.well-known/acme-challenge/... 404`, double-check the proxy stack:

- **Expose VIRTUAL_* via environment:** jwilder/nginx-proxy reads labels _or_ environment variables. If you define services in `infra/apps/docker-compose.yml`, set `VIRTUAL_HOST`, `VIRTUAL_PORT`, and `LETSENCRYPT_*` inside the service’s `environment:` block (labels are ignored unless docker-gen sees them).
- **Mount shared volumes in the proxy stack:** In `infra/n8n/docker-compose.yml`, mount both `/etc/nginx/vhost.d` and `/usr/share/nginx/html` into **nginx-proxy** _and_ **acme-companion**. Without these volumes, acme-companion cannot write the HTTP-01 challenge files and validation fails.
  ```yaml
  nginx-proxy:
    volumes:
      - vhost:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html

  nginx-proxy-acme:
    volumes:
      - vhost:/etc/nginx/vhost.d
      - html:/usr/share/nginx/html
  ```
- **Recreate the app stack after updating env/volumes:** `ssh tools-droplet-agents "cd /root/portfolio/infra/apps && docker compose up -d"` so nginx-proxy regenerates configs and acme-companion retries issuance.
- **Confirm challenge files exist while validation runs:**
  ```bash
  ssh tools-droplet-agents "docker exec nginx-proxy ls /usr/share/nginx/html/.well-known/acme-challenge"
  ```
  You should see short-lived token files appear for each domain being validated.

### Local curl Can’t Resolve the Hostname

macOS sandboxing may block `dig`/`curl` from binding to privileged ports. If `curl -I https://openweb.bestviable.com` fails locally with “Could not resolve host”, validate from the droplet instead:

```bash
ssh tools-droplet-agents "curl -I https://openweb.bestviable.com"
```

You should receive an `HTTP/2 200/301` with a valid Let’s Encrypt certificate once routes are live.

### Webhook 404 After Importing n8n Workflows

If a newly activated workflow returns `404 The requested webhook ... is not registered`:

1. **Check the registration table:**
   ```bash
   ssh tools-droplet-agents "docker exec postgres psql -U n8n -d n8ndb -c 'select \"webhookPath\", \"workflowId\" from "webhook_entity";'"
   ```
2. **If the path is missing, restart n8n:**
   ```bash
   ssh tools-droplet-agents "docker compose -f /root/portfolio/infra/n8n/docker-compose.yml restart n8n"
   ```
   Production webhooks are only registered on startup.
3. **After CLI imports/activations**, always restart n8n so the public URL picks up the new workflow.

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
Open WebUI: https://openwebui.bestviable.com
Pre-hook: https://n8n.bestviable.com/webhook/memory/assemble
Post-hook: https://n8n.bestviable.com/webhook/memory/writeback
```

These external URLs are required for Open WebUI to call back into n8n webhooks.

---

## Next Steps

1. Add the 3+ routes in Cloudflare UI (5 mins)
2. Wait 30s for DNS propagation
3. Test with `curl -I https://openwebui.bestviable.com` (should get HTTP 200)
4. Proceed to Phase 3: N8N workflow setup
5. Configure Open WebUI hooks to call n8n webhooks

---

**Status:** Manual configuration required (cannot be automated without Cloudflare API token)
**Owner:** Next agent or user
**Timeline:** 10-15 minutes total
