- entity: infrastructure
- level: runbook
- zone: internal
- version: v01
- tags: [infrastructure, deployment, droplet, sync]
- source_path: /DROPLET_SYNC_INSTRUCTIONS.md
- date: 2025-10-26

---

# Droplet Sync Instructions

Since we're postponing GitHub deploy key setup, here's how to manually sync the fixed docker-compose to your droplet via SSH.

## Prerequisites

- SSH access to droplet (root@tools)
- Fixed `docker-compose.production.yml` locally at `/Users/davidkellam/workspace/portfolio/ops/docker-compose.production.yml`
- Droplet directory: `~/portfolio/ops/`

---

## Option 1: SCP Copy (Simplest)

Copy the fixed file directly to droplet:

```bash
# From your local machine
scp -P 22 ~/workspace/portfolio/ops/docker-compose.production.yml root@tools:~/portfolio/ops/docker-compose.production.yml
```

Then SSH into droplet and verify:

```bash
# SSH into droplet
ssh root@tools

# Navigate to ops
cd ~/portfolio/ops

# Validate the config
docker-compose -f docker-compose.production.yml config > /dev/null && echo "✅ Config valid" || echo "❌ Config invalid"

# Check status
docker-compose -f docker-compose.production.yml ps
```

---

## Option 2: Cat and Paste (If SCP doesn't work)

1. **Display the fixed file locally:**
   ```bash
   cat ~/workspace/portfolio/ops/docker-compose.production.yml
   ```

2. **Copy the entire output**

3. **SSH into droplet:**
   ```bash
   ssh root@tools
   cd ~/portfolio/ops
   ```

4. **Create the file on droplet:**
   ```bash
   cat > docker-compose.production.yml << 'EOF'
   # Paste the contents here
   EOF
   ```

5. **Verify:**
   ```bash
   docker-compose -f docker-compose.production.yml config > /dev/null && echo "✅ Config valid"
   ```

---

## What the Fixed File Changes

These issues from your droplet diagnostic are now fixed:

### ❌ Before (your droplet output):
```
ERROR: The Compose file './docker-compose.production.yml' is invalid because:
services.coda-mcp-gateway.labels contains non-unique items
services.n8n.labels contains non-unique items
```

### ✅ After (with fix):
```
✅ Config is valid
docker-compose ps  # Shows all containers
```

### What was fixed:
1. Removed duplicate `com.github.jrcs.letsencrypt_nginx_proxy_companion.main` labels from n8n
2. Removed duplicate labels from coda-mcp-gateway
3. Removed circular `depends_on` between nginx-proxy and acme-companion
4. Removed deprecated `version: '3.8'` line

---

## Next Steps After Syncing

Once the file is on your droplet:

```bash
# Stop old containers
cd ~/portfolio/ops
docker-compose -f docker-compose.production.yml down

# Start fresh with fixed config
docker-compose -f docker-compose.production.yml up -d

# Check health (wait 30 seconds first)
sleep 30
docker-compose -f docker-compose.production.yml ps

# Check logs if any service is unhealthy
docker-compose -f docker-compose.production.yml logs --tail=20 nginx-proxy
docker-compose -f docker-compose.production.yml logs --tail=20 postgres
```

---

## Verify All Containers Are Healthy

Expected status after startup:

```
CONTAINER ID   STATUS
nginx-proxy    Up 1 minute (healthy)      ✅
acme-companion Up 1 minute (healthy)      ✅
cloudflared    Up 1 minute (healthy)      ✅
postgres       Up 1 minute (healthy)      ✅
qdrant         Up 1 minute (healthy)      ✅
n8n            Up 1 minute (healthy)      ✅
coda-mcp-gateway Up 1 minute (healthy)    ✅
```

If any show "unhealthy" or "restarting", check logs:
```bash
docker-compose -f docker-compose.production.yml logs <service-name>
```

---

## Rollback (If Needed)

If something goes wrong:

```bash
# Stop all containers
docker-compose -f docker-compose.production.yml down

# Restore from backup
cd ~/portfolio/ops
# Restore your previous working docker-compose if you have a backup
```

---

## Once Everything is Healthy

You can then:
1. Test n8n: `curl -I https://n8n.bestviable.com`
2. Test Coda MCP Gateway: `curl -I https://coda.bestviable.com`
3. Check Cloudflare tunnel status in dashboard
4. Proceed with n8n workflows and Coda integration setup

---

## Questions?

Refer to:
- `ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md` — Rapid reference
- `docs/infrastructure/cloudflare_tunnel_token_guide_v1.md` — Tunnel monitoring
- `docs/infrastructure/droplet_migration_procedure_v1.md` — Detailed procedure
