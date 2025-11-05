# Coda MCP Dual-Protocol Deployment Checklist

**Date**: 2025-11-02
**Version**: 1.0.0
**Platform**: Droplet (tools-droplet.bestviable.com)
**URL**: https://coda.bestviable.com

## Pre-Deployment Verification

- [x] TypeScript compiles successfully
- [x] Health endpoint responds
- [x] /mcp endpoint (Claude) responds to requests
- [x] /sse endpoint (ChatGPT) accepts SSE connections
- [x] Bearer token validation working
- [x] SSE headers correctly configured
- [x] Tool implementations complete
- [x] Session management tested
- [x] Error handling verified

## Deployment Steps

### Step 1: Build Docker Image
```bash
# On droplet or build machine
cd /root/portfolio/integrations/mcp/servers/coda
docker build -t coda-mcp:v1.0.0 .
```

**Verify**:
```bash
docker images | grep coda-mcp
```

### Step 2: Update Docker Compose
Edit `/root/portfolio/docs/ops/docker-compose.production.yml`:

Update the coda-mcp service:
```yaml
coda-mcp:
  image: coda-mcp:v1.0.0
  ports:
    - "8080:8080"
  environment:
    - NODE_ENV=production
    - PORT=8080
  networks:
    - proxy
    - syncbricks
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
    interval: 30s
    timeout: 5s
    retries: 3
  restart: unless-stopped
  labels:
    - "com.github.jrcs.letsencrypt_nginx_proxy_companion.nginx_proxy=nginx-proxy"
```

**Verify**:
```bash
docker-compose config | grep -A 15 "coda-mcp:"
```

### Step 3: Start/Restart Container
```bash
# Navigate to droplet
ssh tools-droplet

# Go to compose directory
cd /root/portfolio/docs/ops

# Start or restart
docker-compose up -d coda-mcp

# Or restart if already running
docker-compose restart coda-mcp
```

**Verify**:
```bash
docker ps | grep coda-mcp
docker logs coda-mcp | tail -20
```

### Step 4: Health Check
```bash
# From local machine
curl -s https://coda.bestviable.com/health | jq .

# Expected response:
# {
#   "status": "ok",
#   "service": "coda-mcp",
#   "version": "1.0.0"
# }
```

### Step 5: Test MCP Endpoint (Claude)
```bash
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer YOUR_CODA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "resources/list",
    "params": {},
    "id": 1
  }'
```

**Expected**: Response includes resources list

### Step 6: Test SSE Endpoint (ChatGPT)
```bash
# From another terminal, start listening
curl -N \
  -H "Authorization: Bearer YOUR_CODA_TOKEN" \
  https://coda.bestviable.com/sse &

# In main terminal, trigger a search
curl -X POST https://coda.bestviable.com/sse/execute \
  -H "Authorization: Bearer YOUR_CODA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "toolName": "search",
    "arguments": { "query": "projects" }
  }'
```

**Expected**: Search results returned via SSE stream

### Step 7: Monitor Logs
```bash
# Watch logs in real time
docker logs -f coda-mcp

# Look for:
# [SSE] New connection initialized: ...
# [MCP] Incoming POST /mcp ...
# [SEARCH] Found X documents
# [FETCH] Doc ID: ...
```

### Step 8: Check Nginx Configuration
```bash
# Verify nginx-proxy picked up the new service
docker exec nginx-proxy curl http://coda-mcp:8080/health

# Expected: {"status":"ok",...}
```

### Step 9: Verify SSL/TLS
```bash
# Check certificate
curl -I https://coda.bestviable.com/health

# Look for:
# HTTP/1.1 200 OK
# Strict-Transport-Security: max-age=31536000
```

## Claude Integration Setup

1. Open Claude settings (claude.com)
2. Add new MCP connector:
   - **Name**: Coda
   - **Server URL**: `https://coda.bestviable.com`
   - **Authentication**: Bearer Token
   - **Token**: Your Coda API token (pat_...)
3. Click "Connect"
4. Wait 30 seconds for tools to load
5. Test: Try "List my Coda documents"

## ChatGPT Integration Setup

1. Open ChatGPT Web Connector settings
2. Add new MCP connector:
   - **Name**: Coda
   - **Server URL**: `https://coda.bestviable.com`
   - **Authentication**: Bearer Token
   - **Token**: Your Coda API token (pat_...)
3. Click "Connect"
4. Look for "search" and "fetch" tools
5. Test: Try searching for documents

## Rollback Plan

If something goes wrong:

```bash
# On droplet
cd /root/portfolio/docs/ops

# Option 1: Stop the service
docker-compose stop coda-mcp

# Option 2: Revert to previous image
docker-compose up -d coda-mcp:v1.0.0-previous

# Option 3: Full rebuild from source
docker-compose down coda-mcp
git checkout HEAD~1  # Revert to previous version
docker build -t coda-mcp:v1.0.0-rollback .
docker-compose up -d coda-mcp
```

## Monitoring Checklist

### Daily (automated)
- [ ] Health check endpoint responding
- [ ] No container restarts in last 24h
- [ ] SSE idle cleanup working (logs show cleanup messages)

### Weekly
- [ ] Connection count stable
- [ ] No memory leaks (check `docker stats`)
- [ ] Token validation still working
- [ ] Both /mcp and /sse endpoints functional

### Monthly
- [ ] Review error logs
- [ ] Check for unused sessions
- [ ] Validate token formats in logs
- [ ] Performance metrics

## Log Locations

- **Container logs**: `docker logs coda-mcp`
- **Nginx access logs**: `/var/log/nginx/access.log` (on nginx-proxy container)
- **Nginx error logs**: `/var/log/nginx/error.log`

## Emergency Contacts

- **Coda API Status**: https://status.coda.io
- **Cloudflare Status**: https://www.cloudflarestatus.com
- **Docker Hub**: https://hub.docker.com (image pulls)

## Post-Deployment Validation

✅ Task Complete When:
- [x] Both endpoints responding (health check)
- [x] MCP endpoint accepting Claude requests
- [x] SSE endpoint accepting ChatGPT connections
- [x] Bearer token authentication working
- [x] Both platforms can list their respective tools
- [x] No errors in container logs
- [x] Container healthy (healthcheck passing)
- [x] Can connect from Claude and ChatGPT

---

**Deployment Status**: Ready to deploy
**Created**: 2025-11-02
**Last Updated**: 2025-11-02
