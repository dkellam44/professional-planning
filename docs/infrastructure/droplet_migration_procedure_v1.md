- entity: infrastructure
- level: documentation
- zone: internal
- version: v01
- tags: [infrastructure, deployment, migration, cloudflare, docker, step-by-step]
- source_path: /docs/infrastructure/droplet_migration_procedure_v1.md
- date: 2025-10-26
- references: [syncbricks/n8n, ADR 2025-10-26 MCP Deployment Policy]

---

# DigitalOcean Droplet Migration Procedure - SyncBricks Pattern

## Overview

This document provides a **step-by-step procedure** to migrate from your current infrastructure to the new SyncBricks pattern with nginx-proxy, acme-companion, and Cloudflare Tunnel.

**Timeline:** 30-45 minutes for experienced operators, 1-2 hours for first-time
**Risk Level:** Medium (will have ~5-10 min downtime if issues occur)
**Rollback Plan:** Keep current setup running, can fall back if needed

---

## Pre-Migration Checklist

Before starting, verify you have:

```
Infrastructure:
☑ SSH access to DigitalOcean droplet
☑ IP address of droplet
☑ Cloudflare account with bestviable.com zone
☑ Cloudflare Zero Trust tunnel created
☑ Tunnel token from Cloudflare dashboard
☑ Current n8n setup running and stable

Data Backups:
☑ Backup of n8n workflows and credentials
☑ Backup of postgres database
☑ List of all configured API keys/secrets

Documentation:
☑ Current docker-compose.yml
☑ Current Caddyfile
☑ Current cloudflared config
☑ Cloudflare DNS records

Knowledge:
☑ Basic SSH commands
☑ Docker and docker-compose familiarity
☑ Understanding of nginx-proxy auto-discovery
```

**If any checkbox is unchecked, complete it before proceeding.**

---

## Phase 0: Preparation (Before Any Changes)

### Step 0.1: Obtain Cloudflare Tunnel Token

**On your local machine or Cloudflare dashboard:**

1. Navigate to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Go to **Networks → Tunnels**
3. Find your "tools" tunnel (or create new one if needed)
4. Click on the tunnel name
5. Copy the **Tunnel Token**
   - Looks like: `eyJhIjoixxxxxxxxxxxxxxxx/xxxx==`
   - **Keep this secret!** Don't commit to git or share

**Save it securely:**
```bash
# Store in a password manager or temporary file
# We'll paste it into docker-compose in next step
```

### Step 0.2: Backup Current Configuration

**SSH to droplet:**
```bash
ssh root@<your-droplet-ip>
```

**Create backup directory:**
```bash
mkdir -p /root/infra/backups/$(date +%Y-%m-%d)
cd /root/infra/backups/$(date +%Y-%m-%d)
```

**Backup n8n data:**
```bash
# Backup docker volumes
docker run --rm \
  -v n8n_storage:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/n8n_storage_backup.tar.gz /data

docker run --rm \
  -v postgres_storage:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_storage_backup.tar.gz /data

# Backup n8n workflows/credentials
docker exec n8n n8n export:workflow --all > n8n_workflows_export.json
docker exec n8n n8n export:credentials --all > n8n_credentials_export.json
```

**Backup current compose files:**
```bash
cp /root/infra/n8n/docker-compose.yml docker-compose.yml.backup
cp /root/infra/n8n/Caddyfile Caddyfile.backup
cp /root/.cloudflared/config.yml cloudflared_config.backup || true
```

**Verify backups created:**
```bash
ls -lh
# Should show all backup files
```

### Step 0.3: Stop Laptop Tunnel (CRITICAL SECURITY FIX)

**On your laptop, stop the cloudflared tunnel:**

```bash
# macOS
launchctl stop com.cloudflare.cloudflared

# Linux
sudo systemctl stop cloudflared

# Or manually:
pkill -f cloudflared

# Verify it's stopped
ps aux | grep cloudflared  # Should return nothing (except grep itself)
```

**Why?** Your laptop tunnel is exposing your personal IP. We're moving it to the droplet.

---

## Phase 1: Prepare New Configuration

### Step 1.1: Create Directory Structure

**On droplet:**
```bash
# Already have /root/infra/ but organize it
mkdir -p /root/infra/coda-mcp
mkdir -p /root/infra/nginx-config
cd /root/infra
```

### Step 1.2: Create .env File

**Create `/root/infra/.env`:**
```bash
cat > /root/infra/.env << 'EOF'
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_TO_RANDOM_PASSWORD
POSTGRES_DB=n8ndb

# n8n Encryption Keys (Generate random strings)
N8N_ENCRYPTION_KEY=YOUR_RANDOM_ENCRYPTION_KEY_HERE
N8N_USER_MANAGEMENT_JWT_SECRET=YOUR_RANDOM_JWT_SECRET_HERE

# Cloudflare Tunnel Token
CLOUDFLARE_TUNNEL_TOKEN=YOUR_TUNNEL_TOKEN_HERE

# Let's Encrypt Email
LETSENCRYPT_EMAIL=your@example.com

# Coda API (if using Coda MCP)
CODA_API_KEY=YOUR_CODA_API_KEY
DOC_ID=YOUR_CODA_DOC_ID
EOF
```

**Generate random values:**
```bash
# Generate encryption key
openssl rand -hex 32

# Generate JWT secret
openssl rand -hex 32
```

**Edit values:**
```bash
nano /root/infra/.env
# Or use your preferred editor
# Replace all YOUR_* placeholders with actual values
```

**Verify structure:**
```bash
cat /root/infra/.env  # Review all values
chmod 600 /root/infra/.env  # Restrict permissions
```

### Step 1.3: Copy Coda MCP Docker Image

**If you haven't already transferred the image from your local machine:**

```bash
# On your LOCAL machine:
docker save coda-mcp-gateway:latest | gzip > coda-mcp-gateway.tar.gz

# Transfer to droplet
scp coda-mcp-gateway.tar.gz root@<droplet-ip>:/root/infra/

# On droplet: load the image
ssh root@<droplet-ip>
cd /root/infra
docker load < coda-mcp-gateway.tar.gz

# Verify it loaded
docker images | grep coda-mcp-gateway
```

---

## Phase 2: Create Production Docker Compose

### Step 2.1: Create `docker-compose.production.yml`

**This replaces `/root/infra/n8n/docker-compose.yml`**

See separate file: `/portfolio/ops/docker-compose.production.yml`

**For now, place at:**
```bash
cp /Users/davidkellam/workspace/portfolio/ops/docker-compose.production.yml \
   /root/infra/docker-compose.yml
```

### Step 2.2: Verify Configuration

```bash
# On droplet
cd /root/infra

# Check syntax
docker-compose config > /dev/null && echo "✓ Syntax OK" || echo "✗ Syntax Error"

# Verify all images are available
docker-compose config | grep "image:"

# Check volume references
docker-compose config | grep -A 2 "volumes:"
```

---

## Phase 3: Migrate Data

### Step 3.1: Prepare Backup Import

```bash
# On droplet
mkdir -p /root/infra/n8n/backup/{workflows,credentials}

# Copy previous backups
cp <path-to-backup>/n8n_workflows_export.json \
   /root/infra/n8n/backup/workflows/

cp <path-to-backup>/n8n_credentials_export.json \
   /root/infra/n8n/backup/credentials/

# Verify files exist
ls -la /root/infra/n8n/backup/workflows/
ls -la /root/infra/n8n/backup/credentials/
```

### Step 3.2: Rename or Stop Old Containers

```bash
# If you want to keep old setup as fallback:
cd /root/infra/n8n
docker-compose rename  # or manually rename containers

# If you want to stop old setup:
docker-compose down  # Stops but keeps volumes

# Verify stopped
docker ps | grep n8n  # Should return nothing
```

---

## Phase 4: Deploy New Stack

### Step 4.1: Start New Docker Compose Stack

```bash
cd /root/infra

# Bring up services in order
docker-compose up -d postgres
sleep 15  # Give postgres time to initialize

docker-compose up -d
sleep 30  # Give all services time to start

# Verify all services running
docker-compose ps
```

**Expected output:**
```
NAME                    STATUS
nginx-proxy             Up (healthy)
acme-companion          Up
postgres                Up (healthy)
n8n-import              Exited (success)
n8n                     Up (healthy)
cloudflared             Up
coda-mcp-gateway        Up
```

### Step 4.2: Check Service Health

```bash
# Check each service
docker-compose logs nginx-proxy --tail 20
docker-compose logs acme-companion --tail 20
docker-compose logs postgres --tail 20
docker-compose logs n8n --tail 20
docker-compose logs cloudflared --tail 20
docker-compose logs coda-mcp-gateway --tail 20

# Check for errors
docker-compose logs --tail 50 | grep -i error  # Should return minimal errors
```

### Step 4.3: Verify nginx-proxy Auto-Discovery

```bash
# Check nginx config was auto-generated
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 5 "server_name"

# Should show:
# - n8n.bestviable.com
# - coda.bestviable.com
```

### Step 4.4: Verify SSL Certificates

```bash
# Check certificates were requested
docker logs acme-companion | tail -20

# Verify cert files exist
docker exec nginx-proxy ls -la /etc/nginx/certs/ | grep bestviable.com

# Check cert validity (should show days until expiry)
docker exec nginx-proxy openssl x509 -in /etc/nginx/certs/n8n.bestviable.com.crt -text -noout | grep -i "not after"
```

---

## Phase 5: Testing & Validation

### Step 5.1: Local Testing (From Droplet)

```bash
# Test HTTP to HTTPS redirect
curl -I http://localhost/
# Should return 301 or 302 (redirect)

# Test HTTPS (self-signed cert warning ok)
curl -k https://localhost/
# Should return 200

# Test proxy to n8n
curl -k https://localhost/ -H "Host: n8n.bestviable.com" | head -20
# Should return HTML from n8n

# Test proxy to coda
curl -k https://localhost/ -H "Host: coda.bestviable.com" | head -20
# Should return response from coda-mcp-gateway
```

### Step 5.2: Remote Testing (From Your Computer)

```bash
# Test n8n access
curl -I https://n8n.bestviable.com/
# Should return 200 OK with valid certificate

# Check certificate validity
openssl s_client -connect n8n.bestviable.com:443 -servername n8n.bestviable.com < /dev/null 2>/dev/null | openssl x509 -text -noout | grep -i "subject\|not after"

# Test coda access
curl -I https://coda.bestviable.com/
# Should return 200 OK

# Access in browser
# Visit: https://n8n.bestviable.com
# Visit: https://coda.bestviable.com
```

### Step 5.3: Verify Cloudflare Tunnel

```bash
# On droplet: check tunnel status
docker logs cloudflared | tail -10
# Should show: "Connection Established" or similar

# In Cloudflare dashboard:
# - Go to Tunnels
# - Check "tools" tunnel status
# - Should show "HEALTHY" and "Connected"
```

### Step 5.4: Verify DNS Resolution

```bash
# From your computer
nslookup n8n.bestviable.com
nslookup coda.bestviable.com

# Should resolve to Cloudflare IPs, like:
# n8n.bestviable.com canonical name = xxxx.cfargotunnel.com.
# Address: 104.16.x.x (Cloudflare)
```

---

## Phase 6: Post-Deployment Steps

### Step 6.1: Update Claude Code Configuration

**Update your local `.claude.json`:**
```json
{
  "mcpServers": {
    "coda-remote": {
      "url": "https://coda.bestviable.com"
    }
  }
}
```

**Test connection:**
```bash
# Restart Claude Code CLI
# Try a Coda operation to verify it works
```

### Step 6.2: Document Deployment

**Update session handoff or log:**
```bash
# On droplet
cat >> /root/infra/deployment.log << 'EOF'
Deployment Date: $(date)
Stack: Docker Compose with nginx-proxy + cloudflared
Services:
  - nginx-proxy (auto-discovery)
  - acme-companion (auto SSL)
  - postgres (database)
  - n8n (automation)
  - cloudflared (tunnel)
  - coda-mcp-gateway (MCP server)
Status: DEPLOYED
EOF
```

### Step 6.3: Set Up Monitoring & Logs

```bash
# Set up log rotation (optional but recommended)
docker-compose logs --tail 0 > /dev/null  # Initialize

# Or use logrotate for Docker logs
# Create /etc/docker/daemon.json or update if exists
```

### Step 6.4: Backup Configuration

```bash
# Backup the complete working setup
cd /root/infra
tar czf backups/$(date +%Y-%m-%d)_working_stack.tar.gz docker-compose.yml .env

# Keep in safe place (not just on droplet)
```

---

## Phase 7: Cleanup (Optional)

### Step 7.1: Remove Old Configuration

```bash
# Only do this AFTER confirming new stack is stable (24+ hours)

# Archive old setup
mv /root/infra/n8n /root/infra/n8n.OLD

# Or remove if confident
# rm -rf /root/infra/n8n
```

### Step 7.2: Remove Laptop Cloudflare Tunnel

```bash
# On your laptop, permanently disable tunnel

# macOS
launchctl unload /Library/LaunchDaemons/com.cloudflare.cloudflared.plist

# Linux
sudo systemctl disable cloudflared

# Verify can't restart
cloudflared tunnel list  # Should fail or show droplet tunnel only
```

---

## Troubleshooting Guide

### Issue: nginx-proxy not discovering services

**Symptoms:** Only one service accessible, others return 502/404

```bash
# Check docker.sock permission
docker exec nginx-proxy ls -la /tmp/docker.sock
# Should be readable

# Check service environment variables
docker inspect n8n | grep VIRTUAL_HOST

# Restart nginx-proxy
docker-compose restart nginx-proxy

# Check generated config
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf
```

### Issue: Certificate not auto-renewing

**Symptoms:** SSL certificate expires without renewal

```bash
# Check acme-companion logs
docker logs acme-companion

# Verify renewal schedule (should be 30 days before expiry)
docker logs acme-companion | grep renewal

# Manually trigger renewal (expert only)
docker-compose restart acme-companion
```

### Issue: Cloudflare Tunnel disconnects

**Symptoms:** Services accessible then unavailable

```bash
# Check tunnel token in docker-compose
cat /root/infra/docker-compose.yml | grep "TUNNEL_TOKEN"

# Check cloudflared logs
docker logs cloudflared

# Check Cloudflare dashboard status

# Restart tunnel
docker-compose restart cloudflared
```

### Issue: n8n-import fails

**Symptoms:** n8n won't start, waiting for import

```bash
# Check import logs
docker logs n8n-import

# Verify backup files exist
ls -la /root/infra/n8n/backup/

# Check marker file
docker exec n8n ls -la /home/node/.n8n/ | grep import_done

# Restart import service
docker-compose up --force-recreate n8n-import
```

### Issue: Database won't start

**Symptoms:** postgres container crashes repeatedly

```bash
# Check postgres logs
docker logs postgres

# Verify volume exists
docker volume ls | grep postgres

# Check disk space
df -h /var/lib/docker/volumes/

# Reset database (DANGER - loses all data!)
# docker volume rm postgres_storage
# docker-compose up -d postgres  # Starts fresh
```

---

## Rollback Procedure

If something goes wrong and you need to revert:

### Quick Rollback (< 5 min)

```bash
# Stop new stack
docker-compose down

# Restore old setup (if renamed)
mv /root/infra/n8n.OLD /root/infra/n8n

# Restart old stack
cd /root/infra/n8n
docker-compose up -d

# Restart laptop tunnel (if needed)
# SSH to laptop and start cloudflared
```

### Full Rollback (with data recovery)

```bash
# Stop new stack
docker-compose down

# Restore from backup
docker run --rm \
  -v postgres_storage:/data \
  -v /root/infra/backups/$(date +%Y-%m-%d):/backup \
  alpine tar xzf /backup/postgres_storage_backup.tar.gz -C /

# Restore old stack
cd /root/infra/n8n
docker-compose up -d
```

---

## Success Criteria

Your migration is successful when:

```
✓ All 7 docker-compose services show "Up"
✓ Can access https://n8n.bestviable.com in browser
✓ Can access https://coda.bestviable.com in browser
✓ SSL certificates show "Valid" in browser
✓ n8n dashboard loads with all workflows present
✓ Coda MCP operations work via Claude Code
✓ Cloudflare tunnel shows "HEALTHY" in dashboard
✓ DNS resolves correctly to Cloudflare IPs
✓ Laptop tunnel is stopped and disabled
✓ All backups safely stored
✓ Documentation updated with deployment details
```

---

## Post-Migration (First 48 Hours)

**Monitor closely:**
- Watch service logs every 6 hours
- Monitor certificate renewal logs
- Test n8n workflows execute correctly
- Verify Coda MCP operations work
- Check disk usage growth
- Monitor CPU/memory usage

**If all stable after 48 hours:**
- Remove old configuration (if kept as backup)
- Update documentation with lesson-learned
- Schedule regular backup verifications
- Set up monitoring alerts (optional)

---

**Document Status:** Complete - Ready for deployment
**Last Updated:** 2025-10-26
**Deployment Owner:** [Your Name]
**Deployment Date:** [Will fill in during execution]
