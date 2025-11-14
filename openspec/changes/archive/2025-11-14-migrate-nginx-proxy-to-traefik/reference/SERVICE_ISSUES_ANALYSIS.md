# Service Issues Analysis & Implementation Plan

**Date**: 2025-11-12
**Status**: Context Compacted - Ready for Next Phase

---

## Current Service Status

| Service | Status | Issue | Priority | Notes |
|---------|--------|-------|----------|-------|
| **n8n** | 🔧 IN PROGRESS | Password invalid (user updating) | P0 | Local: 200 OK, will be fixed by user |
| **coda-mcp** | ⚠️ INVESTIGATION | Status unclear - claimed failing | P0 | Local tests show: health 200 OK, MCP protocol working |
| **archon** | ❌ NOT DEPLOYED | 503 error | P0 | REQUIRED - Optional services found at `/home/david/services/archon/` |
| **openweb** | ⚠️ INVESTIGATION | 301 redirect loop | P1 | Root cause: Missing Docker labels for nginx-proxy |

---

## Issue #1: Coda MCP - Status Verification Needed

### Current Findings
- Health endpoint: `curl http://localhost:8085/health` = **200 OK** ✅
- MCP initialize: **Working with Bearer token** ✅
- Tool execution (get_whoami): **Returns data** ✅
- External HTTPS: Accessible via tunnel (301 redirect is normal protocol) ✅

### Specific Tests Performed
```bash
# Test 1: Local health
curl http://localhost:8085/health
→ {"status":"ok","service":"coda-mcp","version":"1.0.0"}

# Test 2: MCP authentication
curl -X POST http://localhost:8085/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"initialize",...}'
→ {"jsonrpc":"2.0","result":{"protocolVersion":"2024-11-05",...}}

# Test 3: External access
curl https://coda.bestviable.com/health
→ HTTP 301 (normal tunnel redirect)
```

### What User Reported as "Failing"
- "coda mcp is failing" - **No specific error details provided**
- Need to clarify: API errors? Connection issues? Something specific?

### Next Steps for Coda MCP
1. Ask user: What specific failure are they seeing?
2. Test MCP protocol end-to-end via Claude Code client
3. Verify Cloudflare Access JWT validation (if configured)
4. Check container logs for any error messages

---

## Issue #2: Archon Services - Deployment Required

### Current State
- **Location**: `/home/david/services/archon/` exists
- **Status**: Not running (no docker-compose found yet)
- **Services needed**: archon-server, archon-mcp, archon-ui
- **Port**: 8181 (server), 8051 (mcp), 3737 (ui) reported elsewhere

### Discovery Needed
```bash
# Check what's in archon directory
ls -la ~/services/archon/
find ~/services/archon -name "docker-compose*" -o -name "Dockerfile"

# Check if compose files exist elsewhere
find ~/services -name "*archon*" -type f
```

### Deployment Plan
1. Locate archon docker-compose configuration
2. Identify required environment variables
3. Check network configuration (docker_proxy vs docker_syncbricks)
4. Verify port mappings don't conflict with existing services
5. Deploy services in order: archon-server → archon-mcp → archon-ui
6. Test each service health endpoint
7. Add to nginx-proxy routing

### Expected Challenges
- May need custom environment variables
- May require database schema (if using PostgreSQL)
- May need API keys or credentials
- Port conflicts with other services (8080 used by openweb, 8085 by coda-mcp)

---

## Issue #3: OpenWebUI Redirect Loop

### Root Cause Identified
**Missing Docker labels** - nginx-proxy requires labels to discover and configure services

### Current Configuration (BROKEN)
```yaml
# apps/docker-compose.yml has these environment vars:
environment:
  - VIRTUAL_HOST=openweb.bestviable.com
  - VIRTUAL_PORT=8080
  - LETSENCRYPT_HOST=openweb.bestviable.com
  - LETSENCRYPT_EMAIL=admin@bestviable.com
```

### Problem
- **Environment variables alone don't work** - nginx-proxy v2+ requires **Docker labels**
- nginx-proxy is not recognizing openweb service
- All requests return 301 (nginx default redirect rule)

### Solution (Ready to Apply)
Add to `apps/docker-compose.yml` under `openweb` service:

```yaml
openweb:
  # ... existing config ...
  labels:
    - "com.nginx-proxy.virtual-host=openweb.bestviable.com"
    - "com.nginx-proxy.port=8080"
    - "com.nginx-proxy.connect-timeout=600"
    - "com.nginx-proxy.send-timeout=600"
    - "com.nginx-proxy.proxy-read-timeout=600"
    - "com.nginx-proxy.ssl-redirect=true"
```

### Fix Steps
1. Update `apps/docker-compose.yml` with labels
2. Restart openweb container
3. Nginx will auto-detect via docker-gen
4. Test: `curl https://openweb.bestviable.com/` → should return 200

---

## Implementation Sequence

### Phase 1: Coda MCP Investigation
**Effort**: 15 minutes
**Steps**:
1. Get specific error details from user
2. Run comprehensive endpoint tests
3. Check container logs
4. Test via Claude Code MCP client if needed
5. Document findings

### Phase 2: Archon Deployment
**Effort**: 1-2 hours
**Steps**:
1. Locate/create docker-compose for archon services
2. Identify environment variables needed
3. Test archon-server health (8181)
4. Deploy archon-mcp (8051)
5. Deploy archon-ui (3737)
6. Add nginx-proxy routing for all 3 services
7. Verify HTTPS access for all endpoints

### Phase 3: OpenWebUI Fix
**Effort**: 20 minutes
**Steps**:
1. Add Docker labels to apps/docker-compose.yml
2. Restart openweb service
3. Verify nginx-proxy auto-discovers service
4. Test HTTPS access
5. Confirm login screen appears (200 OK, not 301)

---

## Docker Services on Droplet - Current Inventory

### Running (Core Services)
- ✅ nginx-proxy (port 80, 443)
- ✅ acme-companion
- ✅ cloudflared
- ✅ postgres (port 5432)
- ✅ qdrant (port 6333)
- ✅ n8n (port 5678 → 127.0.0.1:5678)
- ✅ coda-mcp (port 8080 → 127.0.0.1:8085)
- ✅ openweb (port 8080 → not mapped)
- ✅ dozzle (port 9999 → not mapped)
- ✅ uptime-kuma (port 3001 → not mapped)

### Not Running (Need to Deploy)
- ❌ archon-server (should be 8181)
- ❌ archon-mcp (should be 8051)
- ❌ archon-ui (should be 3737)

### Networks
- `docker_proxy` (172.20.0.0/16) - External, connected to nginx-proxy, cloudflared
- `docker_syncbricks` (172.21.0.0/16) - Internal, for backend services

---

## Critical Paths

### For Coda MCP to Work End-to-End
```
User HTTPS Request
→ Cloudflare Tunnel
→ nginx-proxy (coda.bestviable.com)
→ coda-mcp container (172.20.0.6:8080)
→ Bearer token validation ✅
→ MCP JSON-RPC handler ✅
→ Coda API with CODA_API_TOKEN ✅
```

### For Archon to Work End-to-End
```
Docker compose up → archon services
→ Verify health endpoints
→ nginx-proxy discovers via labels
→ HTTPS via Cloudflare tunnel
→ User can access archon-ui
```

### For OpenWebUI to Work End-to-End
```
Docker labels in compose.yml
→ nginx-proxy auto-discovery (docker-gen)
→ nginx config regeneration
→ Routing rules created
→ HTTPS via Cloudflare tunnel
→ Login page displays (200 OK)
```

---

## Files & Locations Reference

| Component | Location | Status |
|-----------|----------|--------|
| Core services compose | `/home/david/services/docker/docker-compose.production.yml` | ✅ Updated |
| App services compose | `/home/david/services/apps/docker-compose.yml` | ⚠️ Needs labels |
| Archon services | `/home/david/services/archon/` | ❌ Need to locate compose |
| Environment variables | `/home/david/services/docker/.env` | ✅ Configured |
| Docker networks | docker_proxy, docker_syncbricks | ✅ Created |
| nginx-proxy config | Auto-generated in nginx container | ✅ Working |

---

## Key Learnings & Gotchas

1. **Docker Labels vs Environment Variables**: nginx-proxy v2+ uses labels, not env vars
2. **Network Connectivity**: Containers need both networks (proxy for external, syncbricks for internal)
3. **Port Mapping**: Apps server need to be on port 8080 internally, nginx proxy handles external
4. **Health Checks**: Each service should have proper health checks
5. **postgres Permissions**: Data directory needs proper ownership (david:david 700)
6. **Tunnel Redirects**: 301 responses are normal for HTTP→HTTPS protocol, not an error

---

**Context Window Status**: Compacted - Ready for implementation phase
**Next Session**: Start with Coda MCP investigation, then Archon deployment
