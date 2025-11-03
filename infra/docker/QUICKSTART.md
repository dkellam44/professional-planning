# N8N Stack - Quick Start (5 minutes)

## TL;DR - 4 Steps to Running N8N

### Step 1: Generate secrets
```bash
# Run these commands and save the outputs
echo "POSTGRES_PASSWORD: $(openssl rand -base64 32)"
echo "N8N_ADMIN_PASSWORD: $(openssl rand -base64 32)"
echo "N8N_ENCRYPTION_KEY: $(openssl rand -base64 32)"
```

### Step 2: Create .env file
```bash
cd /Users/davidkellam/workspace/portfolio/docs/ops
cp .env.example .env
nano .env  # Fill in the values above + Cloudflare token + admin email
```

### Step 3: Deploy
```bash
scp .env tools-droplet-agents:/root/portfolio/docs/ops/
ssh tools-droplet-agents
cd /root/portfolio/docs/ops
docker-compose -f docker-compose.n8n.yml up -d
docker-compose -f docker-compose.n8n.yml logs -f  # Watch startup (2-3 min)
```

### Step 4: Access
```
Browser: https://n8n.bestviable.com
Login: Your email + password from .env
```

---

## Need Help?

| Issue | Command |
|-------|---------|
| Check status | `docker ps` |
| View errors | `docker logs n8n \| tail 50` |
| Full guide | See `N8N_REBUILD.md` |
| Cleanup | `docker-compose -f docker-compose.n8n.yml down` |
| Reset all | `docker-compose -f docker-compose.n8n.yml down -v` |

---

## What's Running

```
nginx-proxy ──→ cloudflared ──→ Internet
    ↓
  n8n:5678
    ↓
 postgres    qdrant
```

All services health-checked and auto-restart.

---

**Files Used**:
- `docker-compose.n8n.yml` - Container configuration
- `.env` - Secret values (DO NOT commit)
- `N8N_REBUILD.md` - Full documentation

**Architecture**: SyncBricks (proven, scalable, maintainable)
