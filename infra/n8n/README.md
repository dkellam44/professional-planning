# N8N Deployment Guide - SyncBricks Pattern

**Date**: November 2, 2025
**Status**: Ready for deployment
**Architecture**: SyncBricks (clean, scalable, maintainable)

---

## Overview

Complete n8n automation stack deployment using Docker Compose with the SyncBricks pattern. This includes:

- PostgreSQL (database)
- Qdrant (vector store)
- n8n (workflow engine)
- nginx-proxy (auto-discovery reverse proxy)
- acme-companion (SSL auto-renewal)
- Cloudflare Tunnel (edge access)

---

## Quick Start (5 minutes)

### Step 1: Prepare Environment

```bash
# If .env doesn't exist, create from the actual .env.local
cp .env.local .env  # Preserves existing configuration
# OR if starting fresh:
# cp .env.example .env && nano .env
```

### Step 2: Deploy

```bash
# From your local machine
cd /Users/davidkellam/workspace/portfolio/infra/n8n

# Upload .env to droplet
scp .env tools-droplet-agents:/root/portfolio/infra/n8n/

# SSH to droplet and start
ssh tools-droplet-agents
cd /root/portfolio/infra/n8n
docker-compose up -d

# Watch startup (2-3 minutes)
docker-compose logs -f
```

### Step 3: Access

```
Browser: https://n8n.bestviable.com
Login: Email + Password from .env
```

---

## Full Deployment Checklist

### Pre-Flight

- [ ] Cloudflare Tunnel token (from Zero Trust dashboard)
- [ ] OpenSSL installed locally (for generating secrets if needed)
- [ ] SSH access to droplet (tools-droplet-agents)
- [ ] DNS pointing to Cloudflare

### Local Setup (Step 1)

```bash
cd /Users/davidkellam/workspace/portfolio/infra/n8n

# Review/create .env file
# - Use .env.local if it exists
# - Use .env.example as template if creating new
ls -la .env .env.local .env.example
```

**Environment Variables Required**:
- `CF_TUNNEL_TOKEN` - Cloudflare Tunnel authentication
- `DOMAIN` - Your domain (e.g., bestviable.com)
- `POSTGRES_PASSWORD` - PostgreSQL user password
- `N8N_ADMIN_EMAIL` - Initial n8n admin email
- `N8N_ADMIN_PASSWORD` - Initial n8n admin password
- `N8N_ENCRYPTION_KEY` - n8n credential encryption key
- `LETSENCRYPT_EMAIL` - Email for Let's Encrypt renewal

### Droplet Cleanup (Step 2)

```bash
ssh tools-droplet-agents

# Stop all current services
docker-compose down -v 2>/dev/null || true

# Clean up old images and volumes
docker system prune -a --volumes -f

# Remove legacy directories
rm -rf /root/portfolio/docs/ops 2>/dev/null || true
rm -rf /root/portfolio/infra/docker 2>/dev/null || true

# Verify clean state
docker ps  # Should be empty
docker images  # Should show only base images
```

### Deploy N8N Stack (Step 3)

```bash
# Create deployment directory
mkdir -p /root/portfolio/infra/n8n

# Copy files from local (already done via scp)
# Files should include:
# - docker-compose.yml
# - .env (contains secrets)
# - .env.example (template for reference)
# - .gitignore (prevents .env commits)

# Start stack
cd /root/portfolio/infra/n8n
docker-compose up -d

# Watch logs
docker-compose logs -f

# Expected output (wait 2-3 minutes):
# postgres: "database system is ready"
# qdrant: "Qdrant started"
# n8n: "n8n instance started"
# nginx-proxy: "Configuration updated"
```

### Verify Services (Step 4)

```bash
# Check all containers running
docker ps

# Expected status: all "healthy" or "up"
# - nginx-proxy (healthy)
# - acme-companion (healthy)
# - cloudflared (up)
# - postgres (healthy)
# - qdrant (healthy)
# - n8n (healthy after 120s)

# Test health endpoints
curl http://localhost:8080/health
curl -k https://n8n.bestviable.com/health

# Check logs for errors
docker logs n8n | tail -20
docker logs postgres | tail -20
```

### Access N8N (Step 5)

1. **Browser**: Open https://n8n.bestviable.com
2. **Login**: Use N8N_ADMIN_EMAIL + N8N_ADMIN_PASSWORD from .env
3. **First login**: Change password, enable 2FA if desired

---

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose logs --tail 50

# Common issues:
# - "Connection refused": postgres/qdrant still starting (wait 30s)
# - "Port already in use": old containers still running (run cleanup)
# - "Env variables not found": .env file missing or wrong path
```

### Database connection errors

```bash
# Test postgres directly
docker exec postgres psql -U n8n -d n8n -c "SELECT 1;"

# Reset database (DESTRUCTIVE)
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose up -d
```

### SSL certificate not issued

```bash
# Check acme-companion logs
docker logs acme-companion | tail -50

# Verify DNS is pointing to Cloudflare
nslookup n8n.bestviable.com

# Manually check certificate status
ls -la certs/
```

### Qdrant not available

```bash
# Check qdrant health
curl http://localhost:6333/health

# Restart if needed
docker restart qdrant
```

---

## Maintenance

### View Logs

```bash
# Recent errors only
docker-compose logs --tail 100 | grep -i error

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

### Backup Data

```bash
# Backup PostgreSQL database
docker exec postgres pg_dump -U n8n n8n > backups/n8n-db-$(date +%Y%m%d).sql

# Backup n8n workflows
docker cp n8n:/home/node/.n8n backups/n8n-data-$(date +%Y%m%d)

# Backup volumes
docker run --rm \
  -v n8n_postgres_data:/data \
  -v ./backups:/backups \
  alpine tar czf /backups/postgres-$(date +%Y%m%d).tar.gz /data
```

### Update n8n

```bash
# Pull latest image
docker pull n8nio/n8n:latest

# Update (will use cached version if no new update)
docker-compose pull
docker-compose up -d n8n

# Verify
docker logs -f n8n
```

### Reset Stack

```bash
# Stop everything
docker-compose down -v

# Restart fresh
docker-compose up -d

# Re-import credentials/workflows if backed up
```

---

## File Structure

```
/root/portfolio/infra/n8n/
├── docker-compose.yml        # Container configuration
├── .env                       # Secrets (DO NOT commit)
├── .env.example               # Template for reference
├── .env.local                 # Original config (for reference)
├── .gitignore                 # Prevents .env from git
├── README.md                  # This file
├── certs/                     # SSL certificates (auto-generated)
├── vhost.d/                   # nginx config (auto-generated)
├── html/                      # acme-companion files (auto-generated)
└── acme/                      # Let's Encrypt data (auto-generated)
```

---

## Architecture

```
[Internet] ─→ Cloudflare Tunnel ─→ cloudflared
                                       ↓
                                  nginx-proxy ─→ acme-companion (SSL)
                                       ↓
                                    n8n:5678
                                       ↓
                                  ┌────┴────┐
                                  ↓         ↓
                              postgres   qdrant
```

**Network Isolation**:
- `proxy` network: External-facing services (nginx-proxy, cloudflared, n8n)
- `n8n` network: Internal services (postgres, qdrant)

**Health Checks**: All services monitored with auto-restart on failure

---

## Support & Issues

1. **Check logs**: `docker logs <service-name>`
2. **Check health**: `docker ps` - look for "healthy" status
3. **Inspect environment**: `docker exec <service> env | grep N8N`
4. **Review compose**: `cat docker-compose.yml`

---

## Phase 2: MCP Servers (Future)

Once n8n is stable, separate MCP server deployments will be added:

```
/root/portfolio/integrations/mcp/servers/
├── coda/                      # Coda MCP server
└── ...                        # Additional integrations
```

---

**Status**: Ready to deploy
**Last updated**: November 2, 2025
**Architecture**: SyncBricks (proven, scalable, maintainable)
