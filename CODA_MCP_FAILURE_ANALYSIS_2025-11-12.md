# Coda MCP Connection Failure Analysis

**Date**: 2025-11-12
**Status**: ❌ FAILING - Claude Code cannot connect
**Service Status**: ✅ Container healthy, protocol working locally

---

## Executive Summary

The Coda MCP service is running and responding correctly to requests on the droplet, but Claude Code clients are unable to connect. The service returns 301 redirects when accessed via the public HTTPS endpoint (https://coda.bestviable.com/mcp), indicating an nginx-proxy routing configuration issue.

---

## Current Infrastructure Status

### Services Running (All Healthy)
- ✅ n8n (port 5678) - Password updated, restarted successfully
- ✅ Archon Server (port 8181) - Newly deployed
- ✅ Archon MCP (port 8051) - Newly deployed
- ✅ Archon UI (port 3737) - Newly deployed
- ✅ Coda MCP (port 8085→8080) - Running but inaccessible externally
- ✅ OpenWebUI (port 8080) - Docker labels updated

### Coda MCP Container Details
- **Container**: `coda-mcp` (coda-mcp:v1.0.12)
- **Status**: Up 2 hours (healthy)
- **Ports**: 127.0.0.1:8085->8080/tcp
- **Networks**: docker_proxy, docker_syncbricks
- **Location**: `/home/david/services/mcp-servers/docker-compose.yml`

---

## Test Results

### ✅ Local Tests (Direct to Container - WORKING)

```bash
# Health endpoint (no auth)
curl http://localhost:8085/health
Response: {"status":"ok","service":"coda-mcp","version":"1.0.0"}

# Initialize (with proper headers)
curl -X POST http://localhost:8085/mcp \
  -H 'Authorization: Bearer test-token' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}'

Response: {
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {"tools": {"listChanged": true}},
    "serverInfo": {"name": "coda-enhanced", "version": "1.4.2"}
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

**Key Finding**: Server requires `Accept: application/json, text/event-stream` header
- Without it: Returns error "Not Acceptable: Client must accept both application/json and text/event-stream"
- With it: Works perfectly

### ❌ External Tests (Via HTTPS - FAILING)

```bash
# From local machine
curl https://coda.bestviable.com/mcp \
  -H 'Authorization: Bearer test-token' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{...}'

Response: HTTP 301 Redirect
<html>
<head><title>301 Moved Permanently</title></head>
<body><center><h1>301 Moved Permanently</h1></center></body>
</html>
```

### nginx-proxy Logs Show Pattern

```
[nginx.1] coda.bestviable.com 172.20.0.5 - - "GET /mcp HTTP/1.1" 301 169 "-" "claude-code/2.0.37" "-"
[nginx.1] coda.bestviable.com 172.20.0.5 - - "POST /mcp HTTP/1.1" 301 169 "-" "curl/8.7.1" "-"
```

**Pattern**: ALL requests to `/mcp` return 301, regardless of method (GET/POST) or client

---

## Root Cause Analysis

### Issue: nginx-proxy Routing Configuration

**Problem**: nginx-proxy is returning 301 redirects instead of proxying to the coda-mcp container

**Possible Causes**:
1. **Missing Docker Labels** (Similar to OpenWebUI issue)
   - nginx-proxy v2+ requires Docker labels, not just environment variables
   - Current config uses VIRTUAL_HOST/VIRTUAL_PORT environment variables only

2. **SSL/HTTPS Redirect Loop**
   - nginx-proxy might be configured to redirect HTTP→HTTPS
   - But Cloudflare Tunnel already handles HTTPS termination
   - Could be causing double-redirect

3. **Upstream Discovery Failure**
   - nginx-proxy may not be discovering coda-mcp as an upstream
   - Container is on docker_proxy network but not being registered

4. **Port Mapping Issue**
   - Container binds to `127.0.0.1:8085:8080`
   - nginx-proxy needs to reach internal port 8080
   - Host port 8085 only accessible from localhost

---

## Configuration Analysis

### Current docker-compose.yml (coda-mcp)

```yaml
services:
  coda-mcp:
    image: coda-mcp:v1.0.12
    container_name: coda-mcp
    networks:
      - docker_proxy        # ✅ Connected
      - docker_syncbricks
    environment:
      - VIRTUAL_HOST=coda.bestviable.com      # ⚠️ May need labels
      - VIRTUAL_PORT=8080
      - LETSENCRYPT_HOST=coda.bestviable.com
      - LETSENCRYPT_EMAIL=admin@bestviable.com
    ports:
      - "127.0.0.1:8085:8080"   # ⚠️ Only localhost accessible
```

### Comparison: Working Services (Archon)

```yaml
archon-ui:
    networks:
      - app-network
      - docker_proxy          # ✅ Connected
    environment:
      - VIRTUAL_HOST=archon.bestviable.com
      - VIRTUAL_PORT=3737
    # No host port mapping - internal only
```

**Key Difference**: Archon UI doesn't expose host ports, relies entirely on internal Docker networking

---

## Claude Code Configuration

### ~/.claude.json (Current - CORRECT)

```json
{
  "mcpServers": {
    "coda": {
      "type": "http",
      "url": "https://coda.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer test-token",
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json"
      },
      "env": {}
    }
  }
}
```

**Status**: Configuration is correct with all required headers ✅

---

## Attempted Fixes

### Fix Attempt 1: Add Docker Labels
- **Action**: Added `com.github.jrcs.letsencrypt_nginx_proxy_companion.enable=true` label
- **Result**: Service returned 503 instead of 301
- **Reason**: Removed VIRTUAL_HOST environment variable (mistake)
- **Status**: Reverted

### Fix Attempt 2: Restart Services
- **Action**: Restarted coda-mcp and nginx-proxy containers
- **Result**: No change - still returns 301
- **Status**: Issue persists

---

## Network Topology

```
Claude Code Client
      ↓ (HTTPS + Bearer token)
Cloudflare Tunnel (coda.bestviable.com)
      ↓ (Forwards to nginx-proxy)
nginx-proxy (docker_proxy network)
      ↓ (Should route to coda-mcp:8080)
      ❌ FAILS HERE - Returns 301 instead
coda-mcp Container (172.20.0.6/16 on docker_proxy)
      ↓ (Port 8080 internal)
MCP Protocol Handler ✅ WORKING
      ↓ (Calls Coda API)
Coda API
```

---

## MCP Protocol Implementation Status

### Phase 1.5: ✅ COMPLETE (Per Documentation)
- ✅ JSON-RPC 2.0 protocol handler
- ✅ Tool discovery (`tools/list`)
- ✅ Tool execution (`tools/call`)
- ✅ Server capability negotiation (`initialize`)
- ✅ MCP notification handling
- ✅ Bearer token authentication
- ✅ Cloudflare JWT validation path ready

### Known Requirements
- **Accept Header**: MUST include `application/json, text/event-stream`
- **Authorization**: Bearer token OR Cloudflare Access JWT
- **Content-Type**: application/json
- **Protocol**: Must call `initialize` before other methods

---

## Diagnostic Commands

```bash
# Check container status
ssh droplet "docker ps | grep coda"

# Check nginx-proxy logs
ssh droplet "docker logs nginx-proxy 2>&1 | grep coda | tail -20"

# Check if coda-mcp is in docker_proxy network
ssh droplet "docker network inspect docker_proxy | jq '.[0].Containers | to_entries[] | select(.value.Name | contains(\"coda\"))'"

# Test locally (from droplet)
ssh droplet "curl -s http://localhost:8085/health | jq ."

# Test MCP protocol (from droplet)
ssh droplet "curl -s -X POST http://localhost:8085/mcp \
  -H 'Authorization: Bearer test-token' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"initialize\",\"params\":{}}' | jq ."

# Check nginx upstream config
ssh droplet "docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 20 coda"
```

---

## Options to Resolve

### Option 1: Fix nginx-proxy Configuration
**Approach**: Add proper Docker labels while keeping VIRTUAL_HOST
**Steps**:
1. Add labels to coda-mcp service:
   ```yaml
   labels:
     - "com.github.jrcs.letsencrypt_nginx_proxy_companion.enable=true"
   ```
2. Keep VIRTUAL_HOST/VIRTUAL_PORT environment variables
3. Restart services
4. Force nginx-proxy to regenerate config

**Pros**: Minimal change, follows pattern of other services
**Cons**: May not work if issue is deeper

### Option 2: Remove Host Port Mapping
**Approach**: Let coda-mcp be internal-only like archon-ui
**Steps**:
1. Remove `ports: - "127.0.0.1:8085:8080"` from docker-compose.yml
2. Rely on internal Docker networking only
3. nginx-proxy routes via service name

**Pros**: Follows archon-ui pattern (working)
**Cons**: Loses direct localhost:8085 access for debugging

### Option 3: Check nginx-proxy Discovery
**Approach**: Verify nginx-proxy is actually discovering the service
**Steps**:
1. Check nginx config generation: `docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf`
2. Verify upstream definition exists for coda.bestviable.com
3. Check docker-gen logs: `docker logs nginx-proxy 2>&1 | grep gen`
4. Force regeneration if needed

**Pros**: Identifies exact failure point
**Cons**: May require nginx-proxy restart or rebuild

### Option 4: Alternative Routing
**Approach**: Bypass nginx-proxy, use Cloudflare Tunnel direct routing
**Steps**:
1. Configure Cloudflare Tunnel to route directly to coda-mcp:8080
2. Bypass nginx-proxy entirely
3. Requires Cloudflare Tunnel configuration update

**Pros**: Eliminates nginx-proxy from the equation
**Cons**: Different from other services, requires Cloudflare config changes

### Option 5: Deploy Fresh Container
**Approach**: Rebuild and redeploy coda-mcp from scratch
**Steps**:
1. Stop current coda-mcp
2. Remove container and image
3. Rebuild with `docker-compose build --no-cache`
4. Deploy with proven working configuration

**Pros**: Clean slate, may resolve hidden issues
**Cons**: Downtime, may not fix if issue is nginx-proxy

---

## Comparison: Working vs Non-Working Services

| Service | Status | Port Mapping | VIRTUAL_HOST | Docker Labels | nginx-proxy |
|---------|--------|--------------|--------------|---------------|-------------|
| Archon UI | ✅ | None (internal) | archon.bestviable.com | No | ✅ Routing |
| OpenWebUI | ✅ | None (internal) | openweb.bestviable.com | Yes | ✅ Routing |
| Coda MCP | ❌ | 127.0.0.1:8085→8080 | coda.bestviable.com | No | ❌ 301 |

**Pattern**: Services with host port mappings may confuse nginx-proxy routing

---

## Recommended Next Steps

1. **Immediate**: Check nginx-proxy upstream configuration
   ```bash
   ssh droplet "docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -B 5 -A 15 'server_name coda.bestviable.com'"
   ```

2. **If upstream missing**: Force nginx-proxy to regenerate config
   ```bash
   ssh droplet "docker restart nginx-proxy"
   ```

3. **If still failing**: Try Option 2 (remove host port mapping)

4. **If persistent**: Deploy fresh with Option 5

5. **Last resort**: Investigate Cloudflare Tunnel routing (Option 4)

---

## Files Referenced

- **MCP Implementation Guide**: `/openspec/changes/implement-mcp-oauth-strategy-and-sop/MCP_IMPLEMENTATION_GUIDE.md`
- **Test Results**: `/openspec/changes/implement-mcp-oauth-strategy-and-sop/MCP_WEB_ACCESS_TEST_RESULTS.md`
- **Session Summary**: `/openspec/changes/implement-mcp-oauth-strategy-and-sop/SESSION_SUMMARY_2025-11-10_PHASE15_COMPLETE.md`
- **Service Issues Analysis**: `/SERVICE_ISSUES_ANALYSIS.md`

---

## Key Learnings

1. **MCP Protocol Requirements**:
   - MUST include `Accept: application/json, text/event-stream` header
   - Must call `initialize` before other methods
   - Notifications (no id) must return empty response

2. **nginx-proxy Discovery**:
   - v2+ requires proper configuration
   - Environment variables alone may not be sufficient
   - Port mappings can interfere with routing

3. **Container is Working**:
   - Local tests confirm MCP protocol fully functional
   - Issue is purely routing/proxy configuration
   - Not a code or authentication problem

---

**Status**: BLOCKED - Needs nginx-proxy routing fix before Claude Code can connect
**Priority**: HIGH - Blocking MCP integration workflows
**Next Session**: Investigate nginx-proxy configuration and apply fix
