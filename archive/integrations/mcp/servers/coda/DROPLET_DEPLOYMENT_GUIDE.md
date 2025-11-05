# Droplet Deployment Guide - Coda MCP HTTP-Native Server

**Deployment Target**: DigitalOcean Droplet + Cloudflare Tunnel
**Architecture**: SyncBricks (nginx-proxy + acme-companion + Docker services)
**Domain**: `coda.bestviable.com`
**Port**: 8080 (internal), 443 (external via Cloudflare)

---

## Pre-Deployment Checklist

### Local Prerequisites
- [x] Code builds without errors: `pnpm build`
- [x] All tests pass: `./test-oauth.sh`, `./validate-deployment.sh`
- [x] Docker image builds: `docker build -t coda-mcp:v1.0.0 .`
- [x] Documentation complete
- [x] Coda API token available

### Droplet Prerequisites
- [ ] Droplet running with Docker + Docker Compose
- [ ] SyncBricks pattern (nginx-proxy + acme-companion)
- [ ] Cloudflare tunnel configured
- [ ] DNS pointing to Cloudflare tunnel
- [ ] Git repository cloned

---

## Step 1: Prepare Files on Droplet

### Copy Coda MCP to Droplet

```bash
# From local machine
ssh tools-droplet

# On droplet, ensure directory exists
mkdir -p /root/portfolio/integrations/mcp/servers/coda

# Copy files (from your local machine)
scp -r /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/* \
  tools-droplet:/root/portfolio/integrations/mcp/servers/coda/
```

### Verify Files on Droplet

```bash
# On droplet
ls -la /root/portfolio/integrations/mcp/servers/coda/

# Should see:
# - src/
# - Dockerfile
# - package.json
# - pnpm-lock.yaml
# - CLAUDE.md
# - etc.
```

---

## Step 2: Build Docker Image on Droplet

```bash
# On droplet, navigate to directory
cd /root/portfolio/integrations/mcp/servers/coda

# Build image (version tag matches code)
docker build -t coda-mcp:v1.0.0 .

# Verify build succeeded
docker images | grep coda-mcp
# Should show: coda-mcp  v1.0.0  [size]  [date]

# Test image locally on droplet
docker run --rm \
  -p 8080:8080 \
  -e NODE_ENV=production \
  coda-mcp:v1.0.0

# In another terminal on droplet
curl http://localhost:8080/health
# Should return: {"status":"ok","service":"coda-mcp",...}

# Stop test container (Ctrl+C in first terminal)
```

---

## Step 3: Configure docker-compose.production.yml

Update the main production docker-compose file to include Coda MCP:

**Location**: `/root/portfolio/docs/ops/docker-compose.production.yml`

**Add to services section**:

```yaml
  coda-mcp:
    image: coda-mcp:v1.0.0
    container_name: coda-mcp
    ports:
      - "8080"  # Only expose internally (nginx-proxy will handle reverse proxy)
    environment:
      - NODE_ENV=production
      - PORT=8080
      # Coda API token (set this on droplet)
      - CODA_TOKEN=${CODA_API_TOKEN}
    volumes:
      - coda-logs:/app/logs
      - /root/portfolio/integrations/mcp/servers/coda:/app/source  # Mount source for debugging
    networks:
      - proxy      # SyncBricks pattern: connects to nginx-proxy network
      - syncbricks # Internal network for service communication
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    # Labels for nginx-proxy auto-discovery
    labels:
      com.github.jrcs.letsencrypt_nginx_proxy_companion.main: "coda.bestviable.com"
      com.github.nginx_proxy.http_upgrade: "websocket"

volumes:
  coda-logs:
    driver: local

networks:
  proxy:
    external: true
  syncbricks:
    external: true
```

**Set environment variable on droplet**:

```bash
# On droplet, add to /root/portfolio/infra/config/.env
echo 'CODA_API_TOKEN=your-actual-coda-api-token-here' >> /root/portfolio/infra/config/.env

# Source it for current session
source /root/portfolio/infra/config/.env
```

---

## Step 4: Configure nginx-proxy Routing

The `coda.bestviable.com` domain should automatically route through Cloudflare Tunnel to `localhost:8080` on droplet.

### Verify nginx-proxy Configuration

```bash
# On droplet, check nginx config was generated
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep coda

# Should see routing for coda.bestviable.com
```

### Test Local Access (on droplet)

```bash
# Test health endpoint internally
curl http://coda-mcp:8080/health

# Test through nginx-proxy
curl http://localhost/health -H "Host: coda.bestviable.com"
```

---

## Step 5: Deploy Service

```bash
# On droplet
cd /root/portfolio

# Start the service
docker-compose -f docs/ops/docker-compose.production.yml up -d coda-mcp

# Verify it's running
docker ps | grep coda-mcp
# Should show: coda-mcp  Up X seconds  (healthy)

# Check logs
docker logs coda-mcp

# Should show:
# [coda-mcp] HTTP Native MCP Server
# [coda-mcp] Version: 1.0.0
# [coda-mcp] Listening on port 8080
```

---

## Step 6: Validate Deployment

### Run Local Validation Script

From local machine:

```bash
# From your local directory
./validate-deployment.sh https://coda.bestviable.com

# Expected output:
# ✓ Server is reachable
# ✓ Health check passed
# ✓ Authorization Server metadata endpoint working
# ✓ Protected Resource metadata endpoint working
# ✓ All OAuth tests passed
```

### Manual Testing

```bash
# Test health endpoint (external)
curl https://coda.bestviable.com/health | jq .

# Test OAuth discovery
curl https://coda.bestviable.com/.well-known/oauth-authorization-server | jq '.issuer'

# Test MCP with actual Coda token
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer YOUR_CODA_TOKEN" \
  -H "Mcp-Session-Id: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {}
  }' | jq .
```

---

## Step 7: Setup Monitoring

### Uptime Robot Configuration

```
Endpoint 1: https://coda.bestviable.com/health
  Interval: 5 minutes
  Alert: Down for 5+ minutes

Endpoint 2: https://coda.bestviable.com/.well-known/oauth-authorization-server
  Interval: 15 minutes
  Alert: Down for 5+ minutes
```

### Docker Health Checks

The service includes built-in health checks. Monitor with:

```bash
# On droplet, watch health status
watch -n 5 'docker ps | grep coda-mcp'

# Or check detailed status
docker inspect coda-mcp | jq '.[].State.Health'
```

### Log Monitoring

```bash
# Real-time logs
docker logs -f coda-mcp

# Last N lines
docker logs --tail 100 coda-mcp

# Since specific time
docker logs --since 2025-11-01T20:00:00Z coda-mcp

# Grep for errors
docker logs coda-mcp | grep ERROR
```

---

## Troubleshooting

### Issue: Service won't start

```bash
# Check logs
docker logs coda-mcp

# Check if port is already in use
docker ps | grep 8080

# Check docker-compose syntax
docker-compose -f docs/ops/docker-compose.production.yml config
```

### Issue: Health check failing

```bash
# Check endpoint manually
curl -v http://coda-mcp:8080/health

# Check network connectivity
docker exec coda-mcp curl http://localhost:8080/health

# Check logs for errors
docker logs coda-mcp | tail -50
```

### Issue: Can't access from external domain

```bash
# Verify Cloudflare tunnel is running
ssh tools-droplet "docker ps | grep cloudflared"

# Check Cloudflare tunnel status
ssh tools-droplet "curl -s http://localhost:7844/metrics | grep tunnel"

# Verify nginx-proxy has the route
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 5 coda
```

### Issue: 401 Unauthorized

```bash
# Verify Bearer token is correct
# Token should be sent as: Authorization: Bearer YOUR_TOKEN

# Test token validation endpoint
curl -X POST https://coda.bestviable.com/oauth/validate-token \
  -H "Content-Type: application/json" \
  -d '{"token":"your-token"}'
```

---

## Maintenance

### Daily
```bash
# Check container health
docker ps | grep coda-mcp

# Check recent errors
docker logs --since 1h coda-mcp | grep ERROR
```

### Weekly
```bash
# Run full validation
./validate-deployment.sh https://coda.bestviable.com

# Check logs for warnings
docker logs coda-mcp | grep WARN

# Monitor resource usage
docker stats coda-mcp --no-stream
```

### Monthly
```bash
# Review all logs
docker logs coda-mcp > /tmp/coda-mcp-logs-$(date +%Y-%m-%d).txt

# Backup configuration
cp /root/portfolio/docs/ops/docker-compose.production.yml \
   /root/portfolio/backups/docker-compose.production.$(date +%Y-%m-%d).yml

# Update image if needed
docker pull coda-mcp:latest
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop current service
docker-compose -f docs/ops/docker-compose.production.yml stop coda-mcp

# 2. Update docker-compose.yml to use previous version
# Edit docker-compose.production.yml, change:
# image: coda-mcp:v1.0.0  →  image: coda-mcp:v0.9.0

# 3. Restart
docker-compose -f docs/ops/docker-compose.production.yml up -d coda-mcp

# 4. Verify
curl https://coda.bestviable.com/health
```

---

## Environment Variables Reference

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `NODE_ENV` | Yes | `production` | Node.js environment mode |
| `PORT` | Yes | `8080` | HTTP server port |
| `CODA_API_TOKEN` | No* | `pat_xyz...` | Coda API token (set per request) |

*Token is passed per request via Bearer header, not globally

---

## File Locations on Droplet

```
/root/portfolio/
├── integrations/
│   └── mcp/
│       └── servers/
│           └── coda/              # This directory
│               ├── src/
│               ├── dist/           # Built JS
│               ├── Dockerfile
│               └── package.json
├── docs/
│   └── ops/
│       └── docker-compose.production.yml  # Main compose file
├── infra/
│   └── config/
│       └── .env                   # Environment variables
└── backups/                        # Backup files
```

---

## Next Steps

1. **Deploy**: Follow steps 1-7 above
2. **Validate**: Run validation script
3. **Monitor**: Set up Uptime Robot
4. **Document**: Update internal wiki with deployment details
5. **Test**: Integrate with Claude.ai and CLI clients

---

**Last Updated**: 2025-11-01
**Status**: Ready for Deployment
**Estimated Downtime**: <5 minutes
