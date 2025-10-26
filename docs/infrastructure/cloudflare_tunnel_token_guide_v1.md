- entity: infrastructure
- level: documentation
- zone: internal
- version: v01
- tags: [infrastructure, cloudflare, tunnel, security, setup]
- source_path: /docs/infrastructure/cloudflare_tunnel_token_guide_v1.md
- date: 2025-10-26

---

# Cloudflare Tunnel Token Guide

## Overview

This guide explains how to obtain, configure, and manage Cloudflare Tunnel tokens for the DigitalOcean droplet infrastructure. Token-based tunnels are more secure and simpler to manage than config-file-based approaches.

**Key Benefits of Token-Based Approach:**
- ✅ Token passed directly in docker-compose command (no config files)
- ✅ Easier token rotation without redeploying infrastructure
- ✅ Better for containerized environments
- ✅ No need to manage ingress rules separately
- ✅ Simplified authentication

---

## Part 1: Obtaining Your Tunnel Token

### Prerequisites

- Cloudflare account with domain `bestviable.com`
- Access to Cloudflare Zero Trust dashboard
- DigitalOcean droplet running (or about to deploy)

### Step 1: Access Cloudflare Zero Trust Dashboard

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign in with your Cloudflare credentials
3. Navigate to **Access** → **Tunnels** (left sidebar)

**Path:** Cloudflare Dashboard → Zero Trust → Access → Tunnels

### Step 2: Create New Tunnel

1. Click **Create a tunnel** button
2. Select **Cloudflared** as tunnel type
3. Name your tunnel: `bestviable-droplet` (descriptive, identifies the tunnel)
4. Click **Save tunnel**

**Note:** This creates the tunnel infrastructure on Cloudflare's side.

### Step 3: Obtain Installation Token

After creating the tunnel, you'll see installation instructions with:

```
cloudflared service install <TOKEN>
```

This page shows:
- **Tunnel ID:** Unique identifier for your tunnel (save this)
- **Tunnel Token:** The secret token you'll use (this is what you need!)
- **Installation instructions:** Skip these (we use Docker instead)

### Step 4: Copy Your Tunnel Token

1. Locate the token in the format: `ey...` (JWT format)
2. Copy the complete token value
3. **SECURITY:** Do NOT share this token; it grants access to your infrastructure
4. Store it in a password manager or secure location

**Important:** The token shown during creation is the only time it's displayed in plaintext. If lost, you must regenerate it (which invalidates the old one).

### Step 5: Save Token to .env File

Create a `.env` file in `/portfolio/ops/` with:

```bash
# Cloudflare Tunnel Configuration
CF_TUNNEL_TOKEN=<your-token-here>
DOMAIN=bestviable.com
LETSENCRYPT_EMAIL=your-email@bestviable.com

# Database Configuration
POSTGRES_PASSWORD=<secure-random-password>

# n8n Configuration
N8N_ADMIN_EMAIL=your-email@bestviable.com
N8N_ADMIN_PASSWORD=<secure-random-password>
N8N_ENCRYPTION_KEY=<secure-random-key>

# Coda MCP Configuration
CODA_API_TOKEN=<your-coda-token>

# Qdrant Configuration
QDRANT_API_KEY=<secure-random-key>
```

**Security:** This `.env` file should NOT be committed to git. Add to `.gitignore`:

```bash
# In /portfolio/.gitignore
ops/.env
ops/.env.production
ops/certs/*
ops/data/*
ops/acme/*
```

---

## Part 2: Configuring DNS Records

After creating the tunnel, configure DNS to route traffic through it.

### Current DNS Status

Check current DNS records at Cloudflare:

```
bestviable.com (Root)
├─ @ (A record)          → ???
├─ n8n (CNAME record)    → ???
├─ coda (CNAME record)   → ???
└─ tools (CNAME record)  → xxxxx.cfargotunnel.com (laptop tunnel - REMOVE)
```

### Update: Remove Laptop Tunnel

1. In Cloudflare dashboard, go to **DNS** → **Records**
2. Find `tools.bestviable.com` CNAME record
3. Delete the old record pointing to laptop tunnel
4. Confirm deletion

**Note:** This immediately stops routing traffic to your laptop tunnel (service downtime).

### Step 1: Configure Public Hostnames

In the Cloudflare Tunnel configuration page:

1. Click **Public Hostnames** tab
2. Click **Create public hostname**
3. Configure first service:

   | Field | Value |
   |-------|-------|
   | **Subdomain** | n8n |
   | **Domain** | bestviable.com |
   | **Type** | HTTP |
   | **URL** | http://nginx-proxy:80 |

4. Click **Save**
5. Repeat for second service:

   | Field | Value |
   |-------|-------|
   | **Subdomain** | coda |
   | **Domain** | bestviable.com |
   | **Type** | HTTP |
   | **URL** | http://nginx-proxy:80 |

**What happens:**
- Cloudflare automatically creates CNAME records
- `n8n.bestviable.com` → `xxxxx.cfargotunnel.com`
- `coda.bestviable.com` → `xxxxx.cfargotunnel.com`
- Both point to same tunnel (cloudflared service routes them)

### Step 2: Verify DNS Records

In Cloudflare DNS records page:

```
bestviable.com
├─ @ (A record)          → [droplet-ip]
├─ n8n (CNAME)           → xxxxx.cfargotunnel.com ✓ NEW
├─ coda (CNAME)          → xxxxx.cfargotunnel.com ✓ NEW
└─ tools (removed)       → deleted ✓
```

---

## Part 3: Deploy with Token

### Prepare Environment

1. Ensure `.env` file exists in `/portfolio/ops/`
2. Verify all required variables are set:

   ```bash
   cd /portfolio/ops
   grep -E "CF_TUNNEL_TOKEN|DOMAIN|POSTGRES_PASSWORD" .env
   ```

3. Expected output:
   ```
   CF_TUNNEL_TOKEN=ey...
   DOMAIN=bestviable.com
   POSTGRES_PASSWORD=...
   ```

### Deploy Services

```bash
# SSH into droplet
ssh root@<droplet-ip>

# Navigate to ops directory
cd /portfolio/ops

# Create required directories
mkdir -p data/{postgres,qdrant,n8n,coda-mcp}
mkdir -p certs vhost.d html acme

# Start services (token automatically used from .env)
docker-compose -f docker-compose.production.yml up -d

# Verify all services started
docker-compose -f docker-compose.production.yml ps
```

**What the token does:**
- `cloudflared` service reads `CF_TUNNEL_TOKEN` from environment
- Authenticates with Cloudflare infrastructure
- Establishes secure outbound connection to Cloudflare Edge
- Routes incoming traffic from Cloudflare to `nginx-proxy` on droplet

---

## Part 4: Verification

### Check Tunnel Connection

**In Cloudflare Dashboard:**

1. Navigate to **Access** → **Tunnels**
2. Find `bestviable-droplet` tunnel
3. Check status: Should show 🟢 **HEALTHY**
4. Click tunnel to see connection details

**Expected display:**
```
Status: Healthy
Cloudflared version: [version number]
Last updated: [recent timestamp]
Connectors: 1 connected
```

### Check Service Health

```bash
# SSH into droplet
ssh root@<droplet-ip>

# Check all services running
docker-compose -f docker-compose.production.yml ps

# Expected output:
# nginx-proxy     Up (healthy)
# acme-companion  Up (healthy)
# cloudflared     Up (healthy)
# postgres        Up (healthy)
# qdrant          Up (healthy)
# n8n             Up (healthy)
# coda-mcp-gateway Up (healthy)
```

### Test DNS Resolution

```bash
# From any machine with internet
nslookup n8n.bestviable.com
# Should resolve to Cloudflare IP (not droplet IP)

nslookup coda.bestviable.com
# Should resolve to Cloudflare IP (not droplet IP)
```

### Test Service Access

**Direct test from droplet:**

```bash
ssh root@<droplet-ip>

# Test n8n via tunnel
curl -H "Host: n8n.bestviable.com" http://nginx-proxy
# Should return HTML (n8n login page)

# Test coda-mcp via tunnel
curl -H "Host: coda.bestviable.com" http://nginx-proxy
# Should return response from coda-mcp-gateway
```

**Browser test:**

1. Open https://n8n.bestviable.com
   - Should show n8n login page
   - SSL certificate valid (green lock)
   - No warnings about untrusted certificates

2. Open https://coda.bestviable.com
   - Should show Coda MCP Gateway response
   - SSL certificate valid (green lock)

### Check Tunnel Logs

```bash
# From droplet, view cloudflared logs
docker logs cloudflared

# Should show messages like:
# Tunnel credentials loaded
# Registered tunnel connection
# Tunnel running
```

---

## Part 5: Token Management

### Token Rotation (When to Rotate)

Rotate your token if:
- ✓ You suspect the token was compromised
- ✓ Employee/contractor with access leaves
- ✓ Periodic security rotation (e.g., annually)
- ✓ Token accidentally committed to public repo

**DO NOT rotate without testing first on staging.**

### How to Rotate Token

1. **Create new tunnel** (Cloudflare dashboard):
   - Create second tunnel `bestviable-droplet-v2`
   - Obtain new token
   - Configure same public hostnames

2. **Update .env on droplet:**
   ```bash
   # Update CF_TUNNEL_TOKEN in .env
   CF_TUNNEL_TOKEN=<new-token>
   ```

3. **Redeploy cloudflared:**
   ```bash
   docker-compose -f docker-compose.production.yml up -d cloudflared
   ```

4. **Verify new tunnel is HEALTHY:**
   - Check Cloudflare dashboard
   - Wait 30 seconds for connection
   - Test services still accessible

5. **Delete old tunnel:**
   - In Cloudflare dashboard, delete old tunnel
   - Keep old tunnel for 1 hour rollback window

### Token Security Best Practices

| Practice | Importance | Details |
|----------|-----------|---------|
| **Never commit to git** | 🔴 CRITICAL | Tokens grant full infrastructure access |
| **Store in .env file** | 🟢 BEST | Environment-based (12-factor app) |
| **Restrict .env permissions** | 🟡 IMPORTANT | `chmod 600 .env` (owner read-write only) |
| **Use password manager** | 🟢 RECOMMENDED | Backup copy in secure location |
| **Rotate periodically** | 🟡 IMPORTANT | Annual rotation or after access revocation |
| **Monitor token usage** | 🟡 IMPORTANT | Check Cloudflare logs for anomalies |
| **Never share over email** | 🔴 CRITICAL | Use secure password manager sharing only |

---

## Part 6: Troubleshooting

### Issue: Tunnel shows "UNHEALTHY" or "DISCONNECTED"

**Symptoms:**
- Cloudflare dashboard shows 🔴 UNHEALTHY
- Services not accessible via https://n8n.bestviable.com

**Diagnosis:**
```bash
# Check if cloudflared container is running
docker ps | grep cloudflared

# Check container logs
docker logs cloudflared

# Look for errors like:
# - "Unable to authenticate"
# - "Connection refused"
# - "Invalid token"
```

**Solutions:**

1. **Verify token is correct:**
   ```bash
   cat .env | grep CF_TUNNEL_TOKEN
   # Should match token from Cloudflare dashboard
   ```

2. **Check token hasn't expired:**
   - Tokens don't expire, but may be regenerated
   - If you regenerated the token in Cloudflare, update .env

3. **Restart cloudflared:**
   ```bash
   docker-compose -f docker-compose.production.yml restart cloudflared
   # Wait 30 seconds
   # Check status in Cloudflare dashboard
   ```

4. **Check network connectivity:**
   ```bash
   # From droplet, test outbound connectivity
   docker exec cloudflared curl -v https://api.cloudflare.com
   # Should return 200 or 401 (but not connection refused)
   ```

### Issue: Services accessible via tunnel, but SSL certificate error

**Symptoms:**
- https://n8n.bestviable.com shows SSL warning
- Certificate not automatically generated

**Diagnosis:**
```bash
# Check acme-companion status
docker logs acme-companion

# Look for:
# - "Requesting new certificate"
# - "Certificate obtained"
# - "Certificate renewed"

# Check if certificate file exists
ls -la certs/
# Should have n8n.bestviable.com.crt, n8n.bestviable.com.key
```

**Solutions:**

1. **Wait for acme-companion to process:**
   - Takes 2-5 minutes after container starts
   - Check logs: `docker logs acme-companion`

2. **Verify LETSENCRYPT_HOST label:**
   ```bash
   docker inspect n8n | grep LETSENCRYPT_HOST
   # Should show label with domain name
   ```

3. **Force certificate renewal:**
   ```bash
   # Remove existing cert (careful!)
   rm certs/n8n.bestviable.com.*

   # Restart nginx-proxy and acme-companion
   docker-compose -f docker-compose.production.yml restart nginx-proxy acme-companion

   # Wait 2-5 minutes
   # Check logs for success
   ```

### Issue: Laptop tunnel still accessible (didn't fully disconnect)

**Symptoms:**
- Old tunnel still shows traffic in Cloudflare logs
- `https://tools.bestviable.com` still works

**Diagnosis:**
1. Check Cloudflare DNS records for old CNAME
2. Check if laptop cloudflared process still running

**Solutions:**

1. **Delete old DNS CNAME:**
   ```
   Cloudflare Dashboard → DNS → Records
   Find "tools" CNAME record
   Delete it
   Confirm deletion
   ```

2. **Stop laptop tunnel:**
   ```bash
   # On laptop
   killall cloudflared

   # Or if running as service
   sudo launchctl stop com.cloudflare.cloudflared
   ```

3. **Verify deletion in Cloudflare:**
   - Wait 5 minutes for DNS propagation
   - Test: `nslookup tools.bestviable.com`
   - Should show "NXDOMAIN" (not found)

---

## Part 7: Monitoring & Maintenance

### Daily Checks (Automated)

Set up a simple health check script:

```bash
#!/bin/bash
# /portfolio/ops/health-check.sh

# Check tunnel connection
TUNNEL_STATUS=$(curl -s https://dash.cloudflare.com/api/v4/accounts/YOUR-ACCOUNT-ID/cfd_tunnel | jq '.status')

if [ "$TUNNEL_STATUS" != "HEALTHY" ]; then
  # Alert or restart
  docker-compose -f docker-compose.production.yml restart cloudflared
fi

# Check service health
for service in n8n coda-mcp-gateway; do
  STATUS=$(curl -s https://$service.bestviable.com/health || echo "FAIL")
  if [ "$STATUS" = "FAIL" ]; then
    echo "WARNING: $service health check failed"
  fi
done
```

### Weekly Review

1. Check Cloudflare dashboard for any connection drops
2. Review acme-companion logs for certificate renewal status
3. Verify SSL certificates are valid and not expiring soon

### Quarterly Tasks

1. **Token rotation** (if policy requires)
2. **Backup tunnel configuration** (export public hostnames)
3. **Update cloudflared image** to latest version

---

## Summary

| Task | Frequency | Command |
|------|-----------|---------|
| **Obtain token** | One-time | Cloudflare Zero Trust → Tunnels → Create |
| **Configure DNS** | One-time | Cloudflare Tunnel → Public Hostnames |
| **Deploy services** | One-time | `docker-compose up -d` |
| **Verify tunnel** | Daily | Check dashboard status (🟢 HEALTHY) |
| **Monitor logs** | Weekly | `docker logs cloudflared` |
| **Rotate token** | Annually | Repeat obtain + deploy steps |

---

**Document Status:** Complete
**Last Updated:** 2025-10-26
**Related Documents:**
- `/docs/infrastructure/infrastructure_state_comparison_v1.md` - Before/after architecture
- `/docs/infrastructure/droplet_migration_procedure_v1.md` - Deployment steps
- `/ops/docker-compose.production.yml` - Production configuration
