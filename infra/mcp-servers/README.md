# MCP Servers Stack - Phase 2

**Status**: Ready for deployment (design complete)
**Architecture**: Direct Cloudflare tunnel routing (no nginx-proxy)
**Deployment Pattern**: Independent services with separate configuration
**Next Steps**: Build & deploy to droplet

---

## Overview

This docker-compose stack deploys three primary MCP (Model Context Protocol) servers:

1. **Coda MCP** (port 8085) - Workspace/document synchronization
2. **GitHub MCP** (port 8081) - Repository and issue management
3. **Firecrawl MCP** (port 8084) - Web scraping and content extraction

Additional optional services available (see Configuration section).

### Design Principles

- **No Reverse Proxy Layer**: Each service directly exposed via Cloudflare tunnel routing
- **Independent Deployment**: Can be deployed/upgraded separately from n8n stack
- **Future-Proof**: Can add nginx-proxy layer later if needed without rebuilding
- **Standards-Based**: Follows HTTP-native MCP specification
- **OAuth-Ready**: All services support Bearer token + Cloudflare Access authentication

---

## Quick Start

### 1. Prerequisites

- Docker and docker-compose installed on droplet
- Access to API tokens for each service:
  - Coda API token
  - GitHub Personal Access Token
  - Firecrawl API key
  - Cloudflare API token & account ID

### 2. Setup

```bash
# On local machine
cd /Users/davidkellam/workspace/portfolio/infra/mcp-servers

# Copy environment template
cp .env.example .env

# Edit .env with your API tokens
nano .env

# Commit to git (only .env.example, not .env)
git add docker-compose.yml .env.example README.md
git commit -m "Phase 2: MCP servers docker-compose design (no nginx-proxy)"

# Copy to droplet
scp docker-compose.yml .env.example tools-droplet-agents:/root/portfolio/infra/mcp-servers/
scp .env tools-droplet-agents:/root/portfolio/infra/mcp-servers/
```

### 3. Deploy

```bash
# SSH to droplet
ssh tools-droplet-agents

# Navigate to MCP directory
cd /root/portfolio/infra/mcp-servers

# Build images (first time, ~5-10 minutes)
docker-compose build

# Start services
docker-compose up -d

# Verify services running
docker-compose ps

# Check health
docker-compose logs -f
```

### 4. Test

```bash
# Test Coda MCP
curl http://localhost:8085/health

# Test GitHub MCP
curl http://localhost:8081/health

# Test Firecrawl MCP
curl http://localhost:8084/health
```

### 5. Configure Cloudflare Tunnel Routes

In Cloudflare Dashboard:

```
Public Hostnames:

Name: coda-mcp
Domain: bestviable.com
Service: localhost:8085
Path: /* (all paths)

Name: github-mcp
Domain: bestviable.com
Service: localhost:8081
Path: /* (all paths)

Name: firecrawl-mcp
Domain: bestviable.com
Service: localhost:8084
Path: /* (all paths)
```

After configuration:

```bash
# Test external access
curl https://coda-mcp.bestviable.com/health
curl https://github-mcp.bestviable.com/health
curl https://firecrawl-mcp.bestviable.com/health
```

---

## Configuration

### Environment Variables

All environment variables are defined in `.env.example`:

#### Common
- `LOG_LEVEL` - Logging verbosity (trace, debug, info, warn, error)

#### Cloudflare
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - API token with sufficient permissions

#### Coda
- `CODA_API_TOKEN` - Personal API token from coda.io/account/settings/api

#### GitHub
- `GITHUB_TOKEN` - Personal Access Token (PAT) from github.com/settings/tokens
- `GITHUB_API_ENDPOINT` - API endpoint (default: https://api.github.com)
- `GITHUB_OAUTH_CLIENT_ID` - OAuth application client ID (optional, for OAuth flows)
- `GITHUB_OAUTH_CLIENT_SECRET` - OAuth application client secret (optional)

#### Firecrawl
- `FIRECRAWL_API_KEY` - API key from firecrawl.dev
- `FIRECRAWL_API_ENDPOINT` - API endpoint (default: https://api.firecrawl.dev)

#### DigitalOcean (Optional)
- `DIGITALOCEAN_API_TOKEN` - API token from digitalocean.com

### Port Assignments

```
Port 8080: Node.js runtime port (internal to container)
Port 8081: GitHub MCP (externally accessible via localhost:8081)
Port 8084: Firecrawl MCP (externally accessible via localhost:8084)
Port 8085: Coda MCP (externally accessible via localhost:8085)
Port 8086: Cloudflare MCP (if enabled, see below)
Port 8082: Memory MCP (if enabled, see below)
Port 8087: DigitalOcean MCP (if enabled, see below)
```

### Optional Services

#### Cloudflare MCP
For managing Cloudflare-specific operations. Uncomment in `docker-compose.yml`:

```yaml
cloudflare-mcp:
  build: ../../integrations/mcp/servers/cloudflare
  ports:
    - "127.0.0.1:8086:8080"
  environment:
    - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
    - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
```

#### Memory MCP
For short-term conversation memory and context management. Uncomment in `docker-compose.yml`:

```yaml
memory-mcp:
  build: ../../integrations/mcp/servers/memory
  ports:
    - "127.0.0.1:8082:8080"
```

#### DigitalOcean MCP
For infrastructure management and monitoring. Uncomment in `docker-compose.yml`:

```yaml
digitalocean-mcp:
  build: ../../integrations/mcp/servers/digitalocean
  ports:
    - "127.0.0.1:8087:8080"
  environment:
    - DIGITALOCEAN_API_TOKEN=${DIGITALOCEAN_API_TOKEN}
```

---

## File Structure

```
/infra/mcp-servers/
├── docker-compose.yml           # Main configuration (THIS FILE)
├── .env                         # Secrets (DO NOT COMMIT)
├── .env.example                 # Template (safe to commit)
├── .gitignore                   # Git exclusions
└── README.md                    # This file

Source code:
/integrations/mcp/servers/
├── coda/                        # Coda MCP source
├── github/                      # GitHub MCP source
├── firecrawl/                   # Firecrawl MCP source
├── cloudflare/                  # Cloudflare MCP source (optional)
├── memory/                      # Memory MCP source (optional)
└── digitalocean/                # DigitalOcean MCP source (optional)
```

---

## Monitoring & Debugging

### Check Service Status

```bash
# All services
docker-compose ps

# Specific service
docker-compose ps coda-mcp

# Detailed status
docker ps | grep mcp
```

### View Logs

```bash
# All services
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# Specific service
docker-compose logs coda-mcp

# Specific service with timestamps
docker-compose logs --timestamps coda-mcp

# Last 50 lines
docker-compose logs --tail 50
```

### Health Checks

```bash
# Check all health endpoints
for port in 8081 8084 8085; do
  echo "Port $port:"
  curl -s http://localhost:$port/health | jq .
done
```

### Debugging

```bash
# Shell into running container
docker-compose exec coda-mcp sh

# Check environment variables
docker-compose exec coda-mcp env | sort

# Test connectivity
docker-compose exec coda-mcp curl http://localhost:8080/health
```

---

## Common Operations

### Restart a Service

```bash
# Restart specific service
docker-compose restart coda-mcp

# Restart all services
docker-compose restart

# Force rebuild and restart
docker-compose up -d --build coda-mcp
```

### Update Configuration

```bash
# Edit .env file
nano .env

# Services using updated env vars need restart
docker-compose restart coda-mcp
```

### Rebuild Images

```bash
# Rebuild specific service
docker-compose build coda-mcp

# Rebuild all services
docker-compose build

# Build without cache
docker-compose build --no-cache
```

### Scale Operations

Currently all services run single replica. To run multiple instances:

```yaml
# Add to docker-compose.yml service definition
deploy:
  replicas: 2

# Access via load balancer or separate ports:
ports:
  - "127.0.0.1:8085:8080"
  - "127.0.0.1:8095:8080"  # Additional instance on different port
```

---

## Security Considerations

### API Token Security

1. **Never commit .env** - Added to .gitignore
2. **Rotate tokens regularly** - Update .env, restart services
3. **Limit token scopes** - Only grant necessary permissions
4. **Monitor token usage** - Check API usage in service dashboards

### Authentication

All services support two authentication methods:

1. **Bearer Token** (Development)
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8085/mcp
   ```

2. **Cloudflare Access JWT** (Production)
   - Automatic when deployed behind Cloudflare tunnel
   - Required headers: `cf-access-jwt-assertion`, `cf-access-authenticated-user-email`

### Network Isolation

Services are isolated on internal `mcp-network`:
- Only accessible via localhost:PORT on droplet
- External access requires Cloudflare tunnel
- No direct internet exposure

---

## Troubleshooting

### Service Won't Start

```bash
# Check error logs
docker-compose logs coda-mcp

# Common causes:
# 1. Port already in use: Check "docker ps | grep 8085"
# 2. Missing .env file: Copy .env.example to .env
# 3. Missing API token: Verify .env has valid credentials
# 4. Build failed: Try "docker-compose build --no-cache"
```

### Health Check Failing

```bash
# Test health endpoint directly
curl http://localhost:8085/health

# Check service logs
docker-compose logs coda-mcp | grep -i error

# Verify API token is valid
docker-compose exec coda-mcp env | grep CODA_API_TOKEN
```

### Connection Refused

```bash
# Verify service is running
docker-compose ps

# Check if port is listening
netstat -an | grep 8085  # Linux/WSL
ss -an | grep 8085       # Modern systems
lsof -i :8085            # macOS

# Verify from container perspective
docker-compose exec coda-mcp netstat -an | grep 8080
```

### Cloudflare Tunnel Not Routing

```bash
# Verify tunnel is connected to main stack
ssh tools-droplet-agents
docker ps | grep cloudflared

# Check tunnel config
cat /root/portfolio/infra/n8n/.env | grep CF_TUNNEL_TOKEN

# Verify Cloudflare dashboard has correct routing rules
# Check route: https://dash.cloudflare.com/
```

---

## Upgrading Services

### Update Individual Service

```bash
# Pull latest source (if available)
git pull origin main

# Rebuild image
docker-compose build coda-mcp

# Restart service
docker-compose up -d coda-mcp

# Verify
docker-compose logs coda-mcp
```

### Update API Tokens

```bash
# Edit .env with new token
nano .env

# Update only affected service
docker-compose up -d coda-mcp
```

### Rollback

```bash
# Revert to last working .env
git checkout HEAD -- .env

# Restart service
docker-compose restart coda-mcp

# Or rebuild from git history
git log --oneline infra/mcp-servers/
git checkout COMMIT_HASH -- infra/mcp-servers/docker-compose.yml
docker-compose build --no-cache
```

---

## Integration with N8N (Phase 3)

Once Phase 2 MCP servers are deployed, n8n can call them:

```
N8N Workflow
    ↓ (HTTP GET/POST)
MCP Service (e.g., coda-mcp:8085)
    ↓ (Bearer token auth)
Coda API
    ↓
Response to N8N
```

Example n8n workflow step:

```json
{
  "type": "http",
  "method": "POST",
  "url": "https://coda-mcp.bestviable.com/mcp",
  "headers": {
    "Authorization": "Bearer {{ $env.CODA_MCP_TOKEN }}",
    "Content-Type": "application/json"
  },
  "body": {
    "jsonrpc": "2.0",
    "method": "resources/list",
    "params": {},
    "id": 1
  }
}
```

---

## Performance Considerations

### Resource Limits

Each service runs with default Docker resource limits. To add limits:

```yaml
services:
  coda-mcp:
    # ... existing config ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Build Time

- First build: ~5-10 minutes (downloads dependencies)
- Subsequent builds: ~1-2 minutes (uses cache)
- No-cache rebuild: ~10-15 minutes

### Container Size

Approximate image sizes (multi-stage builds):
- Coda MCP: ~300MB
- GitHub MCP: ~300MB
- Firecrawl MCP: ~300MB

Total storage: ~1GB for all three services

---

## Related Documentation

- **Phase 1 (N8N Stack)**: `/infra/n8n/README.md`
- **Architecture Design**: `/ARCHITECTURE_COMPARISON.md`
- **Current State**: `/CURRENT_STATE_v1.md`
- **MCP Specification**: https://spec.modelcontextprotocol.io/

---

## Next Steps

### After Phase 2 Deployment

1. **Test MCP Services**
   - Verify health endpoints
   - Test API calls with sample requests
   - Confirm Cloudflare routing works

2. **Configure Cloudflare Routes**
   - Add public hostnames in Cloudflare dashboard
   - Test external HTTPS access
   - Document tunnel configuration

3. **Plan Phase 3 (Integration)**
   - Design n8n → MCP call patterns
   - Create sample workflows
   - Document authentication flow

4. **Production Hardening**
   - Add monitoring/alerting
   - Set up log aggregation
   - Configure rate limiting
   - Add request logging

---

## Support & Questions

For issues:
1. Check logs: `docker-compose logs SERVICE_NAME`
2. Verify configuration: Check .env and docker-compose.yml
3. Test health endpoints: `curl http://localhost:PORT/health`
4. Review service documentation in `/integrations/mcp/servers/*/`

---

**Created**: November 3, 2025
**Status**: Design Complete - Ready for Deployment
**Maintainer**: Claude / Bestviable Portfolio
**Version**: 1.0.0
