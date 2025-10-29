- entity: infrastructure
- level: documentation
- zone: internal
- version: v01
- tags: [infrastructure, deployment, quickstart, reference]
- source_path: /ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md
- date: 2025-10-26

---

# Production Deployment Quick Start

**One-page reference for deploying SyncBricks infrastructure to DigitalOcean droplet.**

---

## Prerequisites

- ✓ DigitalOcean droplet (Ubuntu 22.04+, 2GB+ RAM, 50GB+ disk)
- ✓ SSH access to droplet
- ✓ Cloudflare account with domain `bestviable.com`
- ✓ Cloudflare Tunnel token (from Zero Trust dashboard)
- ✓ Git repo cloned: `/portfolio` directory

---

## Pre-Deployment Checklist

```bash
# On droplet
ssh root@<droplet-ip>

# 1. Update system
apt-get update && apt-get upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# 3. Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 4. Verify installation
docker --version
docker-compose --version
```

---

## Configuration

### Step 1: Prepare .env File

```bash
# On droplet
cd /portfolio/ops

# Create .env (fill in values below)
cat > .env << 'EOF'
# Cloudflare Tunnel
CF_TUNNEL_TOKEN=<token-from-cloudflare-dashboard>
DOMAIN=bestviable.com
LETSENCRYPT_EMAIL=your-email@bestviable.com

# Database
POSTGRES_PASSWORD=<generate-with: openssl rand -base64 32>

# n8n
N8N_ADMIN_EMAIL=your-email@bestviable.com
N8N_ADMIN_PASSWORD=<generate-with: openssl rand -base64 16>
N8N_ENCRYPTION_KEY=<generate-with: openssl rand -base64 32>

# Coda MCP Gateway
CODA_API_TOKEN=<your-coda-api-token>

# Qdrant
QDRANT_API_KEY=<generate-with: openssl rand -base64 32>
EOF

# Secure permissions
chmod 600 .env
```

### Step 2: Create Directory Structure

```bash
# From /portfolio/ops/
mkdir -p data/{postgres,qdrant,n8n,coda-mcp}
mkdir -p certs vhost.d html acme
mkdir -p logs

# Set permissions
chmod 755 data/*
chmod 755 certs acme
```

### Step 3: Copy Docker Build Context

```bash
# Ensure Coda MCP Gateway Dockerfile is present
# Path: /portfolio/ops/coda-mcp-gateway/Dockerfile

# If not present, copy from infra/
cp -r /workspace/infra/gateway/coda-mcp-gateway ./

# Verify structure
ls -la coda-mcp-gateway/
# Should show: Dockerfile, package.json, etc.
```

---

## Deployment

### Step 1: Start Services

```bash
# From /portfolio/ops/
docker-compose -f docker-compose.production.yml up -d

# Check status (all should be "Up")
docker-compose -f docker-compose.production.yml ps
```

### Step 2: Wait for Services

- nginx-proxy: Ready immediately
- acme-companion: Ready in 10-30 seconds
- postgres: Ready in 10-15 seconds
- qdrant: Ready in 15-20 seconds
- n8n: Ready in 30-60 seconds (database migration)
- coda-mcp-gateway: Ready in 20-30 seconds
- cloudflared: Ready in 5-10 seconds

**Total time:** ~1-2 minutes for full stack

### Step 3: Verify Health

```bash
# All services should be healthy
docker-compose -f docker-compose.production.yml ps
# STATUS should show "Up (healthy)"

# Check logs for errors
docker logs cloudflared
docker logs acme-companion
docker logs n8n
```

---

## Validation

### 1. Tunnel Status

```bash
# Should show 🟢 HEALTHY in Cloudflare dashboard
# Navigate to: Access → Tunnels → bestviable-droplet

# Or check via CLI (if you have jq installed)
curl -s https://api.cloudflare.com/client/v4/accounts/<ACCOUNT-ID>/cfd_tunnel \
  -H "Authorization: Bearer <API-TOKEN>" | jq '.result[].status'
```

### 2. DNS Resolution

```bash
# From any machine with internet
nslookup n8n.bestviable.com
# Should resolve to Cloudflare IP (not droplet IP)

nslookup coda.bestviable.com
# Should resolve to Cloudflare IP (not droplet IP)
```

### 3. Service Access

**Test from droplet:**
```bash
curl -H "Host: n8n.bestviable.com" http://localhost
# Should return n8n login page HTML

curl -H "Host: coda.bestviable.com" http://localhost
# Should return response from coda-mcp-gateway
```

**Test from browser:**
```
https://n8n.bestviable.com
  → Should show n8n login (🔒 SSL valid)

https://coda.bestviable.com
  → Should show Coda MCP response (🔒 SSL valid)
```

### 4. Certificate Generation

```bash
# Check certificates exist and are valid
ls -la certs/
# Should show: n8n.bestviable.com.crt, n8n.bestviable.com.key, etc.

# Check expiry
openssl x509 -in certs/n8n.bestviable.com.crt -noout -dates
# Should show dates valid for 90 days
```

---

## Monitoring

### Daily

```bash
# Check all services running
docker-compose -f docker-compose.production.yml ps

# Check tunnel status
docker logs cloudflared | tail -20
# Should show: "Tunnel running" (not errors)

# Check acme-companion
docker logs acme-companion | tail -20
# Should show: "Certificate obtained" or "Certificate is valid"
```

### Weekly

```bash
# Check database size
docker exec postgres du -sh /var/lib/postgresql/data

# Check Qdrant usage
docker exec qdrant du -sh /qdrant/storage

# Verify n8n workflows executing
curl -s https://n8n.bestviable.com/api/v1/workflows \
  -H "Authorization: Bearer <N8N_API_KEY>" | jq '.workflows | length'
```

### Monthly

```bash
# Backup data
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Update Docker images
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

---

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker logs <service-name>

# Common issues:
# - Port 80/443 in use: lsof -i :80 && lsof -i :443
# - Disk space: df -h
# - Memory: free -h

# Restart all services
docker-compose -f docker-compose.production.yml restart
```

### Tunnel Shows UNHEALTHY

```bash
# 1. Verify token in .env
grep CF_TUNNEL_TOKEN .env

# 2. Check cloudflared logs
docker logs cloudflared

# 3. Restart cloudflared
docker-compose -f docker-compose.production.yml restart cloudflared

# 4. Wait 30 seconds and check Cloudflare dashboard
```

### SSL Certificate Not Generating

```bash
# 1. Check acme-companion logs
docker logs acme-companion

# 2. Verify label on service
docker inspect n8n | grep LETSENCRYPT_HOST

# 3. Check nginx-proxy is running
docker-compose -f docker-compose.production.yml ps nginx-proxy

# 4. Force certificate renewal
rm certs/n8n.bestviable.com.*
docker-compose -f docker-compose.production.yml restart nginx-proxy acme-companion
```

### Services Accessible via Tunnel but SSL Error

```bash
# Wait 2-5 minutes for certificate generation
docker logs acme-companion | grep -i "n8n.bestviable.com"

# If still failing:
# 1. Check certificate exists
ls certs/n8n.bestviable.com*

# 2. Check nginx-proxy config
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep n8n
```

---

## Post-Deployment

### 1. Configure Claude Code (MCP)

In Claude Code settings, update endpoint:
```json
{
  "coda-mcp": {
    "url": "https://coda.bestviable.com"
  }
}
```

### 2. Configure n8n (Automation)

Access: https://n8n.bestviable.com
- Set up credentials
- Import workflows from backup
- Enable webhook triggers

### 3. Update Documentation

```bash
# Record deployment date and tunnel ID
echo "Deployed: $(date)" >> /portfolio/docs/infrastructure/DEPLOYMENT_LOG.md

# Record certificates
ls -la certs/ >> /portfolio/docs/infrastructure/DEPLOYMENT_LOG.md
```

### 4. Backup Configuration

```bash
# Backup .env (store securely)
cp .env /secure/location/.env.backup
chmod 400 /secure/location/.env.backup

# Backup current DNS config
# (screenshot from Cloudflare dashboard)

# Backup docker-compose
git add docker-compose.production.yml
git commit -m "Deploy: Production infrastructure v1"
```

---

## Cleanup (Laptop Tunnel)

### 1. Stop Laptop Tunnel

```bash
# On laptop
killall cloudflared

# Or if running as service
sudo launchctl stop com.cloudflare.cloudflared
```

### 2. Delete Old DNS Record

```
Cloudflare Dashboard → DNS → Records
Find "tools" CNAME (pointing to laptop tunnel)
Delete it
```

### 3. Verify Deletion

```bash
# From any machine
nslookup tools.bestviable.com
# Should show: NXDOMAIN (not found)
```

---

## Rollback (If Needed)

### Quick Rollback (< 5 minutes)

```bash
# Stop droplet stack
docker-compose -f docker-compose.production.yml down

# Restart laptop tunnel
ssh user@laptop "cloudflared tunnel run"

# Restore old DNS records
# (Cloudflare dashboard: change n8n CNAME back to laptop tunnel)
```

### Full Rollback (with data recovery)

```bash
# 1. Keep droplet services stopped
docker-compose -f docker-compose.production.yml down

# 2. Restore from backup
tar -xzf backup-<date>.tar.gz

# 3. Start laptop tunnel
ssh user@laptop "cloudflared tunnel run"

# 4. Restore DNS
# (Cloudflare: revert to laptop tunnel CNAME)

# 5. Verify services accessible
curl https://n8n.bestviable.com
```

---

## Common Commands

```bash
# View all logs (real-time)
docker-compose -f docker-compose.production.yml logs -f

# View specific service logs
docker logs n8n -f

# Access container shell
docker exec -it n8n bash

# Execute command in container
docker exec postgres psql -U n8n -d n8n -c "SELECT version();"

# Restart service
docker-compose -f docker-compose.production.yml restart n8n

# Update images
docker-compose -f docker-compose.production.yml pull

# Remove data (WARNING: deletes all data)
docker-compose -f docker-compose.production.yml down -v

# View disk usage
du -sh data/*/

# View network status
docker network inspect proxy
docker network inspect syncbricks
```

---

## Performance Metrics

**Expected resource usage (at rest):**
- Memory: 800-1200 MB
- CPU: < 1% idle
- Disk: 2-5 GB (baseline, grows with data)

**Expected latency:**
- DNS: 50-100ms (Cloudflare cached)
- Tunnel: 100-200ms (Cloudflare → droplet)
- n8n: 200-500ms (database query dependent)
- Coda MCP: 150-400ms (API call dependent)

**Expected throughput:**
- Concurrent users: 10-50 (droplet 2GB RAM)
- Requests/second: 5-20 (droplet 1 vCPU)
- Network bandwidth: 100Mbps+ (DigitalOcean standard)

---

## Support & Escalation

**Issue: Services won't start**
→ See: `/docs/infrastructure/droplet_migration_procedure_v1.md` Phase 3-4

**Issue: Tunnel not connecting**
→ See: `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md` Part 6

**Issue: SSL certificate not generating**
→ See: `/diagrams/network_wiring_diagram_v2.md` Certificate Management section

**Issue: Service addition**
→ See: `/docs/infrastructure/syncbricks_solution_breakdown_v1.md` Adding Services section

---

## Next Steps

1. **Test n8n workflows**
2. **Test Coda MCP Gateway**
3. **Set up automated backups**
4. **Configure monitoring/alerts**
5. **Document custom modifications**

---

**Quick Start Version:** v1
**Last Updated:** 2025-10-26
**Estimated Setup Time:** 15-30 minutes
**Related Files:**
- `/docker-compose.production.yml` - Full config
- `/docs/infrastructure/droplet_migration_procedure_v1.md` - Detailed steps
- `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md` - Token setup
