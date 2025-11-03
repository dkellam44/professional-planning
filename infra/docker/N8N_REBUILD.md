# N8N Fresh Rebuild Guide

**Date**: November 2, 2025
**Status**: Ready for deployment
**Architecture**: SyncBricks pattern with separated concerns

---

## Overview

This is a clean rebuild of the n8n stack using the proven SyncBricks pattern. This separates n8n infrastructure from experimental MCP work, allowing each to be maintained independently.

**What's included**:
- PostgreSQL (database)
- Qdrant (vector store)
- n8n (workflow engine)
- nginx-proxy (auto-discovery reverse proxy)
- acme-companion (SSL auto-renewal)
- Cloudflare Tunnel (edge access)

**What's not included** (Phase 2):
- MCP servers (moved to separate concern)
- Custom integrations (will add as needed)

---

## Pre-Flight Checklist

Before rebuilding, you need:

- [ ] Cloudflare Tunnel token (from Zero Trust dashboard)
- [ ] Secure password generator (openssl)
- [ ] Access to DNS settings for bestviable.com
- [ ] SSH access to droplet

---

## Step 1: Stop Current Services (Cleanup)

```bash
# SSH into droplet
ssh tools-droplet-agents

# Stop all containers
docker stop $(docker ps -aq)

# Remove all containers
docker rm $(docker ps -aq)

# Remove unused networks
docker network prune -f

# Remove dangling volumes
docker volume prune -f

# Verify clean slate
docker ps -a        # Should show nothing
docker images ls    # Should show base images only
```

---

## Step 2: Create Environment File

On your local machine:

```bash
cd /Users/davidkellam/workspace/portfolio/docs/ops

# Copy template
cp .env.example .env

# Edit with your values
nano .env  # or your preferred editor
```

**Required values to fill in**:

```bash
# 1. Cloudflare Tunnel Token
# Get from: https://dash.cloudflare.com/ca/zero-trust/networks/tunnels
CF_TUNNEL_TOKEN=<your-tunnel-token>

# 2. PostgreSQL Password (generate new)
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# 3. N8N Admin Email
N8N_ADMIN_EMAIL=your_email@example.com

# 4. N8N Admin Password (generate new)
N8N_ADMIN_PASSWORD=$(openssl rand -base64 32)

# 5. N8N Encryption Key (generate new)
N8N_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

**Save these values in a secure location** (password manager).

---

## Step 3: Upload Configuration

```bash
# From your local machine:
scp /Users/davidkellam/workspace/portfolio/docs/ops/.env tools-droplet-agents:/root/portfolio/docs/ops/

# Verify
ssh tools-droplet-agents "ls -la /root/portfolio/docs/ops/.env"
```

---

## Step 4: Deploy Stack

```bash
# SSH to droplet
ssh tools-droplet-agents

# Navigate to compose directory
cd /root/portfolio/docs/ops

# Start the stack
docker-compose -f docker-compose.n8n.yml up -d

# Watch startup process
docker-compose -f docker-compose.n8n.yml logs -f

# Expected output (wait 2-3 minutes):
# postgres: "database system is ready to accept connections"
# qdrant: "Qdrant started"
# n8n: "n8n instance started"
# nginx-proxy: "Configuration updated"
```

---

## Step 5: Verify Services

```bash
# Check all containers running
docker ps

# Expected output:
# - nginx-proxy (healthy)
# - acme-companion (healthy)
# - cloudflared (up)
# - postgres (healthy)
# - qdrant (healthy)
# - n8n (healthy after 120s start period)

# Check logs for errors
docker logs nginx-proxy | tail -20
docker logs n8n | tail -20
docker logs postgres | tail -20

# Test health endpoints
curl http://localhost/health  # Should get HTML (default)
curl -k https://n8n.bestviable.com  # Should redirect to login
```

---

## Step 6: Access N8N

1. **Browser**: Open https://n8n.bestviable.com
2. **Login**: Use credentials from .env file
   - Email: `N8N_ADMIN_EMAIL`
   - Password: `N8N_ADMIN_PASSWORD`
3. **First login**: Change password and set up 2FA if desired

---

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose -f docker-compose.n8n.yml logs --tail 50

# Common issues:
# - "Connection refused": postgres/qdrant still starting (wait 30s)
# - "Port already in use": previous container still running (cleanup more)
# - "Env variables not found": .env file missing (check path)
```

### Database connection errors

```bash
# Test postgres directly
docker exec postgres psql -U n8n -d n8n -c "SELECT 1;"

# Reset database (DESTRUCTIVE)
docker exec postgres dropdb -U n8n n8n
docker exec postgres createdb -U n8n n8n
docker restart n8n
```

### SSL certificate not issued

```bash
# Check acme-companion logs
docker logs acme-companion | tail -50

# Verify domain DNS is pointing to Cloudflare
nslookup n8n.bestviable.com

# Manually trigger certificate request
docker exec acme-companion /app/force_renew
```

### Qdrant not available

```bash
# Check qdrant health
curl http://localhost:6333/health

# Restart if needed
docker restart qdrant
```

---

## Maintenance Commands

### Backup Data

```bash
# Backup PostgreSQL database
docker exec postgres pg_dump -U n8n n8n > /root/backups/n8n-db-$(date +%Y%m%d).sql

# Backup n8n workflows
docker cp n8n:/home/node/.n8n /root/backups/n8n-data-$(date +%Y%m%d)

# Backup volumes
docker run --rm \
  -v n8n_postgres_data:/data \
  -v /root/backups:/backups \
  alpine tar czf /backups/postgres-$(date +%Y%m%d).tar.gz /data
```

### Update n8n

```bash
# Check for new version
docker pull n8nio/n8n:latest

# Update (will use cached version if no new update)
docker-compose -f docker-compose.n8n.yml pull
docker-compose -f docker-compose.n8n.yml up -d n8n

# Verify
docker logs -f n8n
```

### View Logs

```bash
# Recent errors only
docker-compose -f docker-compose.n8n.yml logs --tail 100 | grep -i error

# Specific service
docker logs n8n | tail -50

# Follow in real-time
docker logs -f n8n
```

### Database Shell

```bash
# Connect to PostgreSQL
docker exec -it postgres psql -U n8n -d n8n

# Useful commands inside psql:
# \dt             - List tables
# \du             - List users
# SELECT * FROM executions LIMIT 10;  - View recent executions
# \q              - Quit
```

---

## Next Steps (Phase 2)

Once this stack is stable:

1. **Configure n8n workflows** for production use
2. **Set up Coda integration** (if still desired)
3. **Design MCP strategy** separately from this stack
4. **Plan remote MCP servers** (when Claude support clarifies)

---

## Disaster Recovery

### Restore from backup

```bash
# Stop stack
docker-compose -f docker-compose.n8n.yml down

# Restore database
docker-compose -f docker-compose.n8n.yml up -d postgres
docker exec postgres createdb -U n8n n8n
docker exec -i postgres psql -U n8n n8n < /root/backups/n8n-db-20251102.sql

# Restore workflows (if needed)
rm -rf /root/portfolio/data/n8n
cp -r /root/backups/n8n-data-20251102 /root/portfolio/data/n8n

# Restart all services
docker-compose -f docker-compose.n8n.yml up -d
```

### Full rebuild from scratch

```bash
# Remove everything
docker-compose -f docker-compose.n8n.yml down -v

# Rebuild
docker-compose -f docker-compose.n8n.yml up -d

# Re-import credentials/workflows if backed up
```

---

## Support

For issues:

1. **Check logs**: `docker logs <service-name>`
2. **Check health**: `docker ps` and look for "healthy" status
3. **Inspect environment**: `docker exec <service> env | grep N8N`
4. **Review compose file**: `/root/portfolio/docs/ops/docker-compose.n8n.yml`

---

**Status**: Ready to deploy
**Last updated**: November 2, 2025
