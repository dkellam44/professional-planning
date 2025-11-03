# Coda MCP - Comprehensive Bug Fix Plan

**Date**: November 2, 2025
**Status**: Critical Issues Identified - Ready for Remediation
**Severity**: HIGH (Production service degraded)
**Estimated Fix Time**: 2-4 hours

---

## Executive Summary

The Coda MCP server deployment has **3 critical issues** preventing client connectivity:

| Issue | Severity | Impact | Root Cause | Fix Time |
|-------|----------|--------|-----------|----------|
| **Health Check Timeout** | HIGH | Container marked unhealthy | 5s timeout too aggressive | 15 min |
| **Nginx 301 Redirect** | CRITICAL | Production URL inaccessible | Missing proxy config | 30 min |
| **MCP Endpoint Accepts Stream Only** | HIGH | CLI/direct requests fail | Missing Content-Type header in response | 20 min |

**Current Status**:
- ✅ Application running and responding on port 8080
- ✅ Health endpoint returns valid JSON (200 OK) on internal port
- ❌ Container marked "unhealthy" (failing health checks)
- ❌ Production domain `https://coda.bestviable.com` returns nginx 301 redirect
- ❌ MCP endpoint rejects requests without event-stream acceptance header
- ❌ Claude Desktop cannot connect (due to above)
- ❌ ChatGPT web connector cannot connect (due to above)

---

## Issue #1: Health Check Timeout (CRITICAL)

### Symptoms
```
Status: unhealthy
FailingStreak: 304
Output: Health check exceeded timeout (5s)
```

### Root Cause Analysis

The Docker health check is configured with a **5-second timeout**, but:
1. The health check command is: `curl -f http://localhost:8080/health`
2. On the droplet with resource constraints, curl startup + connection takes 500-1000ms
3. Health checks happen every 30 seconds, and the accumulated failures (304 failing checks) indicate this is a resource/timing issue
4. **Recent SCP operations** transferred files while container was running, potentially causing I/O contention

### Impact

- Container orchestration system sees "unhealthy" and may restart/terminate container
- Even if container stays running, it signals problems to monitoring systems
- Cloudflare access may be affected if it checks container health

### Fix Procedure

**Step 1: Increase Health Check Timeout**

On droplet, check current docker-compose or docker run command:

```bash
ssh tools-droplet-agents "ps aux | grep 'docker run' | grep coda-mcp"
```

The health check is likely in one of:
- `/root/portfolio/docs/ops/docker-compose.production.yml`
- `/root/portfolio/docker-compose.yml`
- Docker run command history

**Step 2: Update Health Check Configuration**

Edit the docker-compose configuration (example):

```yaml
coda-mcp:
  image: coda-mcp:v1.0.5
  ports:
    - "8080:8080"
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
    interval: 30s
    timeout: 10s           # INCREASE from 5s to 10s
    retries: 3
    start_period: 10s      # ADD: wait 10s before first check
```

**Step 3: Apply Changes**

```bash
ssh tools-droplet-agents << 'EOF'
cd /root/portfolio
# Update docker-compose file with new health check
docker-compose -f docs/ops/docker-compose.production.yml down coda-mcp
docker-compose -f docs/ops/docker-compose.production.yml up -d coda-mcp
EOF
```

**Step 4: Verify Fix**

```bash
# Wait 15 seconds for new health checks to run
sleep 15

# Check health status
ssh tools-droplet-agents "docker ps | grep coda-mcp"
# Should show: "healthy" instead of "unhealthy"

# Also verify endpoint still responds
curl -s http://127.0.0.1:8080/health | jq .
```

**Expected Result**: Container shows `Up X seconds (healthy)` in docker ps output

---

## Issue #2: Nginx 301 Redirect on Production Domain (CRITICAL)

### Symptoms
```
$ curl https://coda.bestviable.com/health
<html>
<head><title>301 Moved Permanently</title></head>
<body><center><h1>301 Moved Permanently</h1></center>
<hr><center>nginx/1.29.2</center>
</body>
</html>

Status: 301
```

### Root Cause Analysis

The nginx reverse proxy is **not configured** to proxy requests to the backend:

1. **Nginx default behavior**: When no reverse proxy configuration exists, nginx returns 301 redirect
2. **Docker setup**: The application is on port 8080 inside the container, but nginx is on the droplet listening to port 443 (SSL) and 80
3. **Cloudflare tunnel**: The domain `coda.bestviable.com` likely points to nginx, but nginx doesn't know where to send the traffic
4. **Missing configuration file**: We confirmed `/etc/nginx/conf.d/coda-mcp.conf` doesn't exist

### Impact

- Production domain is completely inaccessible
- All client connections (Claude, ChatGPT, CLI via production URL) fail
- Even health checks from monitoring systems fail on production domain

### Fix Procedure

**Step 1: Verify Nginx Installation and Status**

```bash
ssh tools-droplet-agents << 'EOF'
# Check nginx is running
docker ps | grep nginx

# List nginx config directories
ls -la /etc/nginx/conf.d/
ls -la /etc/nginx/sites-enabled/

# Check main nginx config
ls -la /etc/nginx/nginx.conf

# Look for any coda-related config
grep -r "coda\|8080\|bestviable" /etc/nginx/ 2>/dev/null || echo "No coda config found"
EOF
```

**Step 2: Create Nginx Proxy Configuration**

Create the missing reverse proxy configuration:

```bash
ssh tools-droplet-agents << 'EOF'
cat > /etc/nginx/conf.d/coda-mcp.conf << 'NGINX'
# Coda MCP HTTP-Native Server
# Reverse proxy from nginx (port 443/80) to application (port 8080)

upstream coda_backend {
    server localhost:8080;
    keepalive 32;
}

# HTTP -> HTTPS redirect (if not handled by Cloudflare)
server {
    listen 80;
    server_name coda.bestviable.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    server_name coda.bestviable.com;

    # SSL certificates (if stored locally; otherwise handled by Cloudflare)
    # ssl_certificate /etc/letsencrypt/live/coda.bestviable.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/coda.bestviable.com/privkey.pem;

    # Proxy configuration
    location / {
        # Pass through to backend
        proxy_pass http://coda_backend;

        # Preserve original host and request info
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Host $server_name;

        # Important for WebSocket/SSE support
        proxy_set_header Connection "";
        proxy_http_version 1.1;

        # SSE/streaming support
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_redirect off;

        # Timeouts for streaming
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        # Pass through authentication headers
        proxy_pass_header Authorization;
    }

    # Access and error logs
    access_log /var/log/nginx/coda-mcp.access.log;
    error_log /var/log/nginx/coda-mcp.error.log;
}
NGINX

# Verify syntax
nginx -t

# Reload configuration
nginx -s reload
EOF
```

**Step 3: Verify Nginx Configuration**

```bash
ssh tools-droplet-agents << 'EOF'
# Test that nginx loaded the config without errors
nginx -t

# Check if coda config is being used
grep -r "coda_backend\|bestviable" /etc/nginx/

# Test that nginx is listening on 443
netstat -tlnp | grep nginx
EOF
```

**Step 4: Test Production Domain**

```bash
# From your local machine, test the production domain
curl -s https://coda.bestviable.com/health | jq .
# Should return JSON with status: "ok"

# Also test the internal port still works
ssh tools-droplet-agents "curl -s http://127.0.0.1:8080/health | jq ."
# Should return JSON with status: "ok"
```

**Step 5: Verify All Routes Work Through Nginx**

```bash
# Test OAuth endpoint through nginx
curl -s https://coda.bestviable.com/.well-known/oauth-authorization-server | jq .

# Test MCP endpoint (requires Bearer token, will fail auth but should not return 301)
curl -s -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":1}' | jq .
# Should return JSON-RPC error about authentication, not HTML 301
```

**Expected Result**: All endpoints return JSON responses through `https://coda.bestviable.com`

---

## Issue #3: MCP Endpoint Requires Event-Stream Acceptance (HIGH)

### Symptoms
```
$ curl -X POST http://127.0.0.1:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":1}'

{"jsonrpc":"2.0","error":{"code":-32000,"message":"Not Acceptable: Client must accept both application/json and text/event-stream"},"id":null}
```

### Root Cause Analysis

The MCP endpoint enforces bidirectional communication pattern:
1. **Client must signal** it can accept both `application/json` (POST responses) and `text/event-stream` (GET stream)
2. **Current behavior**: The server rejects requests that don't explicitly accept both MIME types
3. **Why it's strict**: The server is enforcing the SSE pattern where tool results come via streaming channel
4. **Client implementations unprepared**: Most clients (including test frameworks) don't send both Accept headers

### Impact

- Simple curl requests fail with cryptic error message
- CLI test scripts fail (unless they add Accept header)
- Some client libraries may not send both Accept types
- Claude Desktop likely fails because it doesn't know to request both MIME types
- ChatGPT fails for same reason

### Fix Procedure

**Step 1: Understand the Requirement**

The server correctly enforces this because:
- SSE streaming requires bidirectional communication
- Both POST (initialize) and GET (stream) are needed to receive results
- The server needs to know client can handle streaming responses

**Option A: Update Server to Be More Lenient** (Recommended)

Modify `/src/http-server.ts` to accept requests with just `application/json`:

```typescript
// Around line where Content-Type is checked
// OLD CODE:
if (!acceptsJson || !acceptsEventStream) {
  return res.status(406).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Not Acceptable: Client must accept both application/json and text/event-stream" },
    id: body.id || null
  });
}

// NEW CODE (More lenient):
// Allow requests that accept JSON, even if they don't explicitly accept event-stream
// The transport will handle the stream if client connects for GET
if (!acceptsJson) {
  return res.status(406).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Not Acceptable: Client must accept application/json" },
    id: body.id || null
  });
}
```

**Option B: Update Clients to Send Correct Headers** (Also do this)

Clients should send both Accept headers:

```bash
curl -X POST http://127.0.0.1:8080/mcp \
  -H "Authorization: Bearer pat_token" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \  # ADD THIS
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":1}'
```

**Step 2: Apply the Fix**

Choose your approach:

**If going with Option A (lenient server)**:

```bash
# On your local machine
# Edit src/http-server.ts and find the Accept header check
# Change the validation to only require application/json

# Test locally first
pnpm build
node dist/http-server.js &
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":1}' | jq .
# Should return a proper error (missing Accept: text/event-stream) or success

kill %1
```

**If going with Option B (client-side fix)**:

Update all client setup guides to include:
```bash
-H "Accept: application/json, text/event-stream"
```

Update `test-with-sse-stream.sh` to include this header in POST requests.

**Step 3: Decide and Implement**

**Recommendation**: Do BOTH:

1. **Make server lenient** (Option A) - more user-friendly
2. **Update client setup guides** (Option B) - still best practice

```bash
# Step 1: Update server to be lenient
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda

# Edit src/http-server.ts, find the Content-Type check around line 150-170
# Change validation logic to only require application/json

# Step 2: Rebuild
pnpm build

# Step 3: Test locally
node dist/http-server.js &
sleep 1

# Test WITHOUT explicit Accept headers
curl -s -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":1}' | jq .
# Should return auth error, not Accept error

# Test WITH proper Accept headers
curl -s -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":1}' | jq .
# Should also work

kill %1
```

**Step 4: Deploy Updated Server**

```bash
# Copy to droplet
scp -r src/* tools-droplet-agents:/root/portfolio/integrations/mcp/servers/coda/src/

# Build on droplet
ssh tools-droplet-agents << 'EOF'
cd /root/portfolio/integrations/mcp/servers/coda
docker build -t coda-mcp:v1.0.6 .
docker tag coda-mcp:v1.0.6 coda-mcp:latest

# Restart with new image
docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml down coda-mcp
docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml up -d coda-mcp

# Verify
sleep 3
docker ps | grep coda-mcp
curl -s http://127.0.0.1:8080/health | jq .
EOF
```

**Expected Result**: MCP endpoint accepts requests with just `application/json` Accept header

---

## Issue #4: Claude Desktop Connection Failures

### Symptoms
- Claude Desktop shows server as "Not Connected" in settings
- No error message, just fails to connect

### Root Cause
This is a **secondary symptom** of Issues #1-3:

1. Claude Desktop likely tries to reach production domain (`https://coda.bestviable.com`)
2. Production domain returns 301 redirect (Issue #2)
3. Claude Desktop doesn't handle redirect properly
4. Connection fails silently

### Fix Procedure

**After fixing Issues #1-3 above**, Claude Desktop should connect. But we also need to ensure the server advertises itself properly:

**Step 1: Verify OAuth Discovery Endpoints**

```bash
# Check authorization server metadata
curl -s https://coda.bestviable.com/.well-known/oauth-authorization-server | jq .

# Expected response:
{
  "issuer": "https://coda.bestviable.com",
  "authorization_endpoint": "https://coda.bestviable.com/oauth/authorize",
  "token_endpoint": "https://coda.bestviable.com/oauth/token",
  ...
}
```

**Step 2: Verify the Issuer URL**

The `issuer` field should match the domain Claude uses:

```bash
# Current issuer (on internal port)
curl -s http://127.0.0.1:8080/.well-known/oauth-authorization-server | jq .issuer
# Returns: "http://127.0.0.1:8080"

# Should be:
# "https://coda.bestviable.com"
```

**Step 3: Fix Issuer URL in Code**

In `src/http-server.ts`, find where OAuth metadata is returned:

```typescript
// OLD CODE:
const authServerMetadata = {
  issuer: `http://${req.hostname}:8080`,  // Wrong when proxied through nginx
  ...
};

// NEW CODE:
const authServerMetadata = {
  issuer: process.env.MCP_ISSUER_URL || `https://${req.hostname}`,  // Use environment var or HTTPS
  ...
};
```

**Step 4: Set Environment Variable on Droplet**

```bash
ssh tools-droplet-agents << 'EOF'
# Edit docker-compose.production.yml
nano /root/portfolio/docs/ops/docker-compose.production.yml

# Add to coda-mcp service environment:
environment:
  - NODE_ENV=production
  - PORT=8080
  - MCP_ISSUER_URL=https://coda.bestviable.com  # ADD THIS

# Restart
docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml restart coda-mcp
EOF
```

**Step 5: Reconfigure Claude Desktop**

```
1. Open Claude Desktop Settings → Developer → MCP Servers
2. Remove the old "Coda MCP" server (if present)
3. Add new server:
   - Name: Coda MCP
   - URL: https://coda.bestviable.com
   - Auth: Bearer Token
   - Token: pat_your_actual_coda_token
4. Click "Connect"
5. Wait for green ✓ indicator
6. Try asking: "List my Coda documents"
```

**Expected Result**: Claude Desktop shows server as "Connected" and can execute tools

---

## Issue #5: ChatGPT Web Connector (Plan Limitation)

### Current Status
User has ChatGPT Pro plan. **Full MCP support requires Business/Enterprise/Edu plan.**

### Options

**Option 1: Upgrade ChatGPT to Business Plan**
- Provides full MCP write support
- Same setup as Claude Desktop, but through ChatGPT custom actions
- Cost: $30/month

**Option 2: Use ChatGPT Pro with Limited Read-Only Actions**
- Can still create custom actions for read-only MCP tools
- `coda_list_documents` and other read tools work fine
- Cannot use write tools (create/update/delete)
- Zero cost (already have Pro)

**Option 3: Continue Testing with CLI + Claude Desktop**
- Focus on CLI validation (test-with-sse-stream.sh)
- Focus on Claude Desktop integration
- ChatGPT can be added later when upgrading plan

### Recommendation

**For now (Pro plan)**: Use Option 3
- Test CLI thoroughly with test-with-sse-stream.sh
- Get Claude Desktop working (primary goal)
- Document the plan limitation for ChatGPT
- When ready to upgrade, follow Option 1 path

**For future (Business plan)**: Use Option 1
- Create custom GPT with read/write MCP actions
- Same setup as Claude Desktop but via ChatGPT builder
- Full feature parity with Claude Desktop

---

## Fix Execution Timeline

### Phase 1: Critical Fixes (Do Immediately)

| Fix | Time | Complexity | Impact |
|-----|------|-----------|--------|
| Increase health check timeout | 15 min | Low | Stops container restarts |
| Create nginx proxy config | 30 min | Medium | Enables production URL |
| Make MCP endpoint lenient | 20 min | Low | Fixes direct requests |
| **Total Phase 1** | **65 min** | | **Restores service** |

### Phase 2: Configuration Fixes (Within 1 hour)

| Fix | Time | Complexity | Impact |
|-----|------|-----------|--------|
| Fix OAuth issuer URL | 15 min | Low | Ensures Claude finds correct endpoint |
| Set environment variables | 10 min | Low | Supports multiple deployments |
| Rebuild and deploy v1.0.6 | 20 min | Low | Deploys all fixes together |
| **Total Phase 2** | **45 min** | | **Optimizes connectivity** |

### Phase 3: Client Testing (30-60 minutes)

| Client | Test Steps | Time | Pass/Fail |
|--------|-----------|------|-----------|
| CLI | Run test-with-sse-stream.sh with real token | 10 min | ? |
| Claude Desktop | Configure server, test tool execution | 20 min | ? |
| ChatGPT | Inform user of plan limitation | 5 min | N/A (Pro plan) |

---

## Complete Fix Checklist

### Pre-Execution
- [ ] Backup current docker-compose.yml and http-server.ts files
- [ ] Notify any users: "Brief maintenance on coda.bestviable.com"

### Issue #1: Health Check Timeout
- [ ] Locate docker-compose or docker run command
- [ ] Increase timeout from 5s to 10s
- [ ] Add start_period: 10s
- [ ] Restart container
- [ ] Verify status shows "healthy" after 60 seconds

### Issue #2: Nginx 301 Redirect
- [ ] Create /etc/nginx/conf.d/coda-mcp.conf
- [ ] Configure upstream backend pointing to localhost:8080
- [ ] Configure server block for coda.bestviable.com
- [ ] Enable SSL/proxy_pass/SSE support
- [ ] Test nginx syntax: `nginx -t`
- [ ] Reload nginx: `nginx -s reload`
- [ ] Test endpoint: `curl https://coda.bestviable.com/health`
- [ ] Verify returns JSON (not HTML 301)

### Issue #3: MCP Accept Headers
- [ ] Edit src/http-server.ts
- [ ] Find Content-Type validation
- [ ] Change to only require application/json
- [ ] Build: `pnpm build`
- [ ] Test locally: `node dist/http-server.js`
- [ ] Deploy to droplet
- [ ] Rebuild docker image: v1.0.6
- [ ] Restart container

### Issue #4: Claude Desktop
- [ ] Verify OAuth metadata issuer URL
- [ ] Add MCP_ISSUER_URL environment variable
- [ ] Rebuild docker image
- [ ] Restart container
- [ ] Remove old server from Claude Desktop
- [ ] Add new server with https://coda.bestviable.com
- [ ] Verify connection succeeds

### Issue #5: ChatGPT
- [ ] Document Plan limitation in CLIENT_SETUP_GUIDE.md
- [ ] Provide upgrade path for Business plan
- [ ] Provide read-only tool list for Pro users

### Post-Execution Testing
- [ ] Health endpoint returns JSON: `curl https://coda.bestviable.com/health`
- [ ] OAuth endpoints working: `curl https://coda.bestviable.com/.well-known/oauth-authorization-server`
- [ ] MCP endpoint responds to Bearer token: `curl -H "Authorization: Bearer pat_xxx" https://coda.bestviable.com/mcp`
- [ ] Test script passes: `CODA_API_TOKEN=pat_xxx bash test-with-sse-stream.sh https://coda.bestviable.com`
- [ ] Claude Desktop connects: Settings shows "Connected"
- [ ] Container health: `docker ps | grep coda-mcp` shows "healthy"

### Documentation Updates
- [ ] Update CLIENT_SETUP_GUIDE.md with ChatGPT plan limitation
- [ ] Update BUG_FIX_PLAN.md with actual results
- [ ] Create DEPLOYMENT_CHECKLIST.md for future deployments
- [ ] Update README.md with current status

---

## Rollback Plan

If fixes cause new issues:

### Quick Rollback (Revert to v1.0.5)

```bash
ssh tools-droplet-agents << 'EOF'
# Stop current container
docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml down coda-mcp

# Revert image
docker tag coda-mcp:v1.0.5 coda-mcp:latest

# Restart with previous version
docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml up -d coda-mcp

# Verify
curl -s https://coda.bestviable.com/health | jq .
EOF
```

### Rollback Nginx Config

```bash
ssh tools-droplet-agents << 'EOF'
# Backup current config
cp /etc/nginx/conf.d/coda-mcp.conf /etc/nginx/conf.d/coda-mcp.conf.broken

# Remove proxy config (revert to no routing)
rm /etc/nginx/conf.d/coda-mcp.conf

# Reload nginx
nginx -s reload
EOF
```

### Rollback Docker Compose

```bash
ssh tools-droplet-agents << 'EOF'
# Restore from backup
cp /root/portfolio/docs/ops/docker-compose.production.yml.backup \
   /root/portfolio/docs/ops/docker-compose.production.yml

# Restart
docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml up -d coda-mcp
EOF
```

---

## Testing After Each Fix

### Test 1: After Health Check Fix
```bash
ssh tools-droplet-agents "sleep 60 && docker ps | grep coda-mcp"
# Should show: "healthy" after 60 seconds
```

### Test 2: After Nginx Fix
```bash
curl -s https://coda.bestviable.com/health | jq .
# Should return JSON with status: ok
```

### Test 3: After MCP Accept Header Fix
```bash
ssh tools-droplet-agents "curl -s -X POST http://127.0.0.1:8080/mcp \
  -H 'Authorization: Bearer test' \
  -H 'Content-Type: application/json' \
  -d '{\"jsonrpc\":\"2.0\",\"method\":\"resources/list\",\"params\":{},\"id\":1}' | jq ."
# Should return proper error, not Accept error
```

### Test 4: After OAuth Fix
```bash
curl -s https://coda.bestviable.com/.well-known/oauth-authorization-server | jq .issuer
# Should return: "https://coda.bestviable.com"
```

### Test 5: Full CLI Test
```bash
CODA_API_TOKEN=pat_your_token bash test-with-sse-stream.sh https://coda.bestviable.com
# Should show all tests passing
```

### Test 6: Claude Desktop
```
1. Settings → Developer → MCP Servers → Add Coda MCP
2. URL: https://coda.bestviable.com
3. Token: pat_your_token
4. Click Connect → should show green ✓
```

---

## Why These Issues Occurred

### Health Check Timeout
- **Root**: Aggressive 5s timeout with no startup grace period
- **Prevention**: Always add `start_period` to health checks

### Nginx 301 Redirect
- **Root**: No reverse proxy configuration for new domain
- **Prevention**: Document nginx setup requirements; automate with docker-compose

### MCP Accept Headers
- **Root**: Server enforces bidirectional communication pattern but doesn't document requirement
- **Prevention**: Make server more lenient; document in setup guides

### OAuth Issuer URL
- **Root**: Issuer points to internal port instead of production domain
- **Prevention**: Use environment variables for domain-aware URLs

### Plan Limitation (ChatGPT)
- **Root**: Feature exists in Business/Edu tiers only
- **Prevention**: Document plan requirements upfront in setup guides

---

## Build Strategy Documentation

### How Docker Images Are Built

```dockerfile
# Dockerfile uses multi-stage build

# Stage 1: Builder
FROM node:23-alpine AS builder
RUN npm install -g pnpm
COPY . /app
WORKDIR /app
RUN pnpm install && pnpm run build
# Creates /app/dist/ with compiled JavaScript

# Stage 2: Runtime
FROM node:23-alpine
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json
WORKDIR /app
CMD ["node", "dist/http-server.js"]
# Runs compiled application
```

**Why**: Reduces final image size by excluding TypeScript compiler and source files

### How Code Is Deployed

1. **Source Code** → Local TypeScript files
2. **Compilation** → `pnpm build` → Outputs to `dist/`
3. **Docker Build** → Builds image including compiled code
4. **Push to Droplet** → `scp` or `git push`
5. **Container Restart** → `docker-compose up -d coda-mcp`

### Version Management

- Version format: `coda-mcp:vX.Y.Z`
- Current: v1.0.5
- Fixed version: v1.0.6 (after applying fixes above)
- Latest tag always points to most stable version

### Rollback Process

```bash
# List all available versions
docker image ls | grep coda-mcp

# Switch to previous version
docker tag coda-mcp:v1.0.5 coda-mcp:latest
docker-compose restart coda-mcp
```

---

## Next Steps

1. **Execute Phase 1 fixes** (65 minutes) - Critical
2. **Execute Phase 2 fixes** (45 minutes) - Configuration
3. **Run test suite** - CLI validation with test-with-sse-stream.sh
4. **Configure Claude Desktop** - Test production connectivity
5. **Document results** - Update CLIENT_SETUP_GUIDE.md
6. **Plan ChatGPT integration** - For when plan upgraded

---

**Document Status**: Ready for Implementation
**Last Updated**: November 2, 2025, 5:00 AM UTC
**Estimated Total Fix Time**: 2-4 hours (including testing)
**Risk Level**: Low (all fixes are reversible)
**Success Probability**: 95% (issues are well-understood and straightforward to fix)
