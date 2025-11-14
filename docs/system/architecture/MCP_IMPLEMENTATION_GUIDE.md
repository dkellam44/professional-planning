# MCP Implementation Guide: Coda MCP Server

**Document Purpose**: Explain the complete authentication and connection flow for the Coda MCP server so any future developer (human or AI agent) can understand the system with minimal additional context.

**Last Updated**: 2025-11-10
**Status**: ✅ Phase 1.5 COMPLETE (MCP Protocol Implementation Fully Deployed)
**Phase 1 Status**: ✅ COMPLETE AND TESTED
**Phase 1.5 Status**: ✅ COMPLETE AND DEPLOYED

---

## Quick Reference: The Full Request Flow

```
User/Claude Code
      ↓ (HTTPS Request + Bearer Token)
Cloudflare Tunnel (coda.bestviable.com)
      ↓ (Validates & forwards request)
nginx-proxy (docker-compose network)
      ↓ (Routes to localhost:8080)
Coda MCP Server Container
      ├─→ Authentication Middleware
      │   ├─ Check: cf-access-jwt-assertion header OR Authorization: Bearer token
      │   ├─ Validates JWT signature (production) or accepts Bearer (dev)
      │   └─ Sets req.user.email & req.serviceToken
      ├─→ Determine Request Type
      │   ├─ JSON-RPC 2.0 (from Claude Code MCP client)
      │   └─ Legacy HTTP Proxy (backward compatibility)
      ├─→ Route to Handler
      │   ├─ JSON-RPC: handleJsonRpc() → tools/list, tools/call, initialize
      │   └─ Legacy: Direct Coda API proxy
      └─→ Call Coda API (with serviceToken: pat_xxxxx)
           ↓
      Return result in appropriate format (JSON-RPC or legacy)
```

---

## Architecture Overview

### Components

1. **User Client** (Claude Code or curl)
   - Sends: HTTPS POST to `https://coda.bestviable.com/mcp`
   - With: Bearer token or Cloudflare Access JWT
   - Expects: MCP JSON-RPC 2.0 response OR legacy HTTP response

2. **Cloudflare Tunnel** (`coda.bestviable.com`)
   - Managed by: `cloudflared` daemon on droplet
   - Role: Public-facing HTTPS endpoint
   - Authenticates: Users via Cloudflare Access policies (optional)
   - Forwards: All traffic to local nginx-proxy

3. **nginx-proxy** (docker-compose service)
   - Role: Reverse proxy for local services
   - Config: `VIRTUAL_HOST=coda.bestviable.com` in docker-compose.yml
   - Routes: Traffic to `localhost:8080` (coda-mcp container)

4. **Coda MCP Server** (Node.js/Express)
   - Container: `coda-mcp` running on port 8080
   - Files:
     - `/src/http-server.ts` - HTTP endpoint & routing logic
     - `/src/middleware/cloudflare-access-auth.ts` - JWT/Bearer validation
     - `/src/mcp/handler.ts` - JSON-RPC 2.0 protocol handlers
     - `/src/config.ts` - Configuration loading
   - Depends on: `CODA_API_TOKEN` environment variable

---

## Authentication Flow (Detailed)

### Phase 1 ✅ (Current - TESTED & WORKING)

**What Works**:
- Bearer token validation (dev/test)
- Cloudflare JWT validation (production path)
- Service token injection from environment
- Backward-compatible HTTP proxy format

**Request Flow**:
```
1. Client sends: POST https://coda.bestviable.com/mcp
   Headers: Authorization: Bearer test-token
   Body: {"method":"GET","path":"/whoami"}

2. Cloudflare Tunnel → nginx-proxy → localhost:8080/mcp

3. Authentication Middleware (cloudflare-access-auth.ts:115-161)
   - Check for: req.headers['cf-access-jwt-assertion'] (Cloudflare)
   - Fallback: req.headers['authorization'] (Bearer token)
   - Validate: JWT signature or Bearer token value
   - Result: req.user = {email: "user@example.com"}

4. Service Token Resolution (cloudflare-access-auth.ts:171)
   - Get: req.serviceToken = process.env.CODA_API_TOKEN
   - Store: In req.serviceToken for handlers

5. HTTP Server (http-server.ts:45-120)
   - Legacy proxy format detected
   - Extract: method="GET", path="/whoami"
   - Call: axios(url, headers with Bearer token)
   - Return: Response from Coda API
```

**Environment Variables**:
```bash
CODA_API_TOKEN=pat_xxxxx  # Coda API token (from https://coda.io/account/settings/api)
AUTH_MODE=both            # both|cloudflare|bearer
BEARER_TOKEN=test-token   # (optional, dev only)
```

**Testing Phase 1**:
```bash
# Test 1: Unauthenticated (should fail)
curl http://localhost:8080/mcp
# Response: 401 Unauthorized

# Test 2: Bearer token (should work)
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","path":"/whoami"}'
# Response: {"success":true,"data":{...user info...}}

# Test 3: Health check (no auth required)
curl http://localhost:8080/health
# Response: {"status":"ok","auth":{"mode":"both",...}}
```

---

### Phase 1.5 ✅ (COMPLETE - MCP Protocol Implementation)

**What Was Needed** (✅ ALL COMPLETE):
- ✅ JSON-RPC 2.0 protocol handler
- ✅ Tool discovery (`tools/list`)
- ✅ Tool execution (`tools/call`)
- ✅ Server capability negotiation (`initialize`)
- ✅ MCP notification handling (critical fix)

**Design** (from design.md):
- Same authentication as Phase 1 (no changes)
- New code path: Detect JSON-RPC format and route to handler
- Handler maps: JSON-RPC tool calls → Coda API calls
- Return: Responses in JSON-RPC format
- **Critical Addition**: Proper handling of notifications (messages without `id` field)

**Request Flow** (✅ IMPLEMENTED & TESTED):
```
1. Claude Code sends: POST https://coda.bestviable.com/mcp
   Headers: Authorization: Bearer test-token
   Body: {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "get_whoami",
       "arguments": {}
     }
   }

2. Authentication Middleware (same as Phase 1)
   - Validate Bearer token
   - Set req.user & req.serviceToken

3. HTTP Server (http-server.ts:404-520)
   - Detect: req.body.jsonrpc === "2.0" && req.body.method
   - Route: handleJsonRpc(request, serviceToken, userEmail)

4. MCP Handler (inlined in http-server.ts:9-360)
   - Route: method === "tools/call"
   - Extract: toolName = "get_whoami"
   - Map: get_whoami → /whoami (Coda API endpoint)
   - Call: axios with serviceToken
   - Return: {jsonrpc:"2.0",id:1,result:{...}}

5. HTTP Server returns JSON-RPC response

6. Claude Code receives tool result and can use it

** CRITICAL FIX**: MCP Notifications (no id field)
- Claude Code sends: {jsonrpc:"2.0",method:"notifications/initialized"}
- Server detects: isNotification = (id === undefined)
- Response: {jsonrpc:"2.0"} (empty response, NOT an error)
- Claude Code then proceeds with normal protocol handshake
```

**JSON-RPC 2.0 Format** (from spec):
```typescript
// Request
{
  jsonrpc: "2.0",
  id: "unique-request-id",
  method: "initialize" | "tools/list" | "tools/call",
  params: {...}
}

// Response (success)
{
  jsonrpc: "2.0",
  id: "unique-request-id",
  result: {...}
}

// Response (error)
{
  jsonrpc: "2.0",
  id: "unique-request-id",
  error: {
    code: -32602,
    message: "Invalid params"
  }
}
```

**MCP Handler Implementation** (mcp/handler.ts):
- `initialize()` → Returns server capabilities
- `tools/list()` → Lists available Coda operations (whoami, list_docs, etc.)
- `tools/call()` → Executes a tool and returns result

**Testing Phase 1.5** (✅ ALL VERIFIED):
```bash
# Test: MCP initialize
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
# Response: {jsonrpc:"2.0",id:1,result:{protocolVersion:"2024-11-05",...}} ✅

# Test: MCP tools/list
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
# Response: {jsonrpc:"2.0",id:1,result:{tools:[{name:"get_whoami",...}]}} ✅

# Test: MCP tools/call
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_whoami","arguments":{}}}'
# Response: {jsonrpc:"2.0",id:1,result:{toolName:"get_whoami",success:true,data:{...}}} ✅

# Test: MCP notifications (no id field)
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized"}'
# Response: {} (empty response, HTTP 200) ✅

# Test: Claude Code connection
claude
> /mcp
⎿ Reconnected to coda ✅
> use mcp : coda ...
(Tools execute and return Coda API data) ✅
```

---

## Implementation Status

### Phase 1: Authentication ✅ COMPLETE
- [x] Bearer token validation
- [x] Cloudflare JWT validation (path ready)
- [x] Service token injection
- [x] HTTP proxy format support
- [x] Health check endpoint
- [x] Docker build & deployment
- [x] End-to-end testing

**Proof**:
```bash
$ curl -H "Authorization: Bearer test" http://localhost:8080/mcp \
  -d '{"method":"GET","path":"/whoami"}' \
  -H "Content-Type: application/json"
{"success":true,"data":{"name":"David Kellam",...}}
```

### Phase 1.5: MCP Protocol ✅ COMPLETE
- [x] Design documented
- [x] Tasks planned (12 tasks in tasks.md)
- [x] MCP handler module created and inlined (in http-server.ts)
- [x] HTTP server updated with JSON-RPC dispatcher
- [x] TypeScript compilation working with `--no-cache` flag
- [x] Testing with Claude Code - successful connection and tool execution
- [x] Documentation updates complete

**What Was Implemented**:
1. **JSON-RPC 2.0 Protocol Handler** (lines 9-360 in http-server.ts)
   - Parses incoming JSON-RPC messages
   - Routes to appropriate handlers: `initialize`, `tools/list`, `tools/call`
   - Handles both requests (with `id`) and notifications (without `id`)

2. **Tool Discovery & Execution** (lines 40-118)
   - 5 Coda tools: get_whoami, list_docs, get_doc, list_tables, list_rows
   - Each tool has schema with parameters and descriptions
   - Tool calls map to Coda API endpoints

3. **Critical Notification Fix** (lines 136-159, 437-441)
   - Detects notifications by checking for missing `id` field
   - Returns empty response `{}` for notifications instead of errors
   - Allows Claude Code handshake to complete successfully

4. **Docker Build Resolution**
   - Issue: Layer caching prevented source code changes from being compiled
   - Solution: `docker-compose down` + `docker-compose build --no-cache`
   - Result: Fresh container with all code changes applied

**Why It Works**:
Rather than debugging complex build system issues, the solution was to inline the JSON-RPC handler directly in http-server.ts. This bypassed the module/import compilation issues and proved the concept immediately. Later refactoring can separate concerns if needed.

---

## Key Files & Their Roles

| File | Purpose | Status |
|------|---------|--------|
| `src/index.ts` | Entry point | ✅ Working |
| `src/config.ts` | Load environment variables | ✅ Working |
| `src/http-server.ts` | Express app & routing + inlined MCP handler | ✅ Phase 1 & 1.5 Complete |
| `src/middleware/cloudflare-access-auth.ts` | JWT & Bearer validation | ✅ Complete |
| `Dockerfile` | Docker build with --no-cache for fresh compiles | ✅ Working |
| `docker-compose.yml` | Container orchestration | ✅ Working |
| `.env` | Runtime config | ✅ Working |

---

## Connection Journey (From User to Coda API)

### Step-by-Step with Code Locations

**Step 1: User initiates request**
```
curl https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer token" \
  -d '{"jsonrpc":"2.0",...}'
```

**Step 2: Cloudflare Tunnel receives request**
- Location: Cloudflare edge
- Action: Optional Cloudflare Access validation
- Result: Forwards to cloudflared daemon on droplet

**Step 3: cloudflared daemon routes request**
- Location: Droplet, process: `cloudflared tunnel run`
- Config: `/root/portfolio/integrations/mcp/servers/coda/docker-compose.yml`
- Routing rule: `coda.bestviable.com` → `http://nginx-proxy:80`

**Step 4: nginx-proxy routes request**
- Location: Docker service: `nginx-proxy`
- Config: Docker label `VIRTUAL_HOST=coda.bestviable.com`
- Target: `http://coda-mcp:8080`

**Step 5: Express middleware chain**
- File: `src/http-server.ts:23`
- Order:
  1. `helmet()` - Security headers
  2. `cors()` - CORS handling
  3. `express.json()` - JSON parsing
  4. `authenticate` - Authentication (details below)

**Step 6: Authentication validation**
- File: `src/middleware/cloudflare-access-auth.ts:99-176`
- Check 1: Is there a `cf-access-jwt-assertion` header? (Cloudflare)
  - If yes: Validate JWT signature using JWKS
  - Extract: email from JWT payload
- Check 2: Is there an `Authorization: Bearer` header?
  - If yes: Validate Bearer token value
  - Set: email = "developer@localhost"
- Result: `req.user = {email, user_uuid}` or 401 error

**Step 7: Service token injection**
- File: `src/middleware/cloudflare-access-auth.ts:171`
- Action: `req.serviceToken = process.env.CODA_API_TOKEN`
- This token is used for ALL Coda API calls

**Step 8: Route determination**
- File: `src/http-server.ts:431-441`
- Check: Is request in JSON-RPC 2.0 format?
  - If yes: Call `handleJsonRpc(request, serviceToken, email)`
  - If no: Use legacy HTTP proxy format

**Step 9: MCP Handler execution**
- JSON-RPC path: `src/http-server.ts:123-180` (inlined handleJsonRpc)
  - Detect if notification (no `id` field)
  - Route to appropriate handler:
    - `initialize` → return capabilities (lines 185-201)
    - `tools/list` → return tool array (lines 207-214)
    - `tools/call` → execute tool (lines 220-330)
    - `notifications/*` → return empty response (lines 151-159)
  - Extract tool name from `params.name`
  - Map to Coda API endpoint
  - Call Coda API
  - Return JSON-RPC formatted result

- Legacy path: `src/http-server.ts:449-495`
  - Extract method & path from body
  - Call Coda API directly
  - Return in legacy format

**Step 10: Coda API call**
- Location: Remote: `https://coda.io/apis/v1`
- Headers:
  ```
  Authorization: Bearer pat_xxxxx  (serviceToken)
  Content-Type: application/json
  User-Agent: BestViable-Coda-MCP/1.0.0
  ```
- Methods: GET, POST, etc. (depends on operation)

**Step 11: Response back through tunnel**
- Coda API → axios response → Express → HTTP → Cloudflare Tunnel → Client

---

## Implementation Path: What We Did

### Phase 1.5 Completion Strategy

**Decision Made**: Implement Option B (inline handler code)

**Rationale**:
- Docker layer caching was preventing source file changes from being compiled
- Rather than spend hours debugging the build system, we inlined the 320+ lines of MCP handler code directly into http-server.ts
- This proved the concept immediately and showed tools execute correctly

**Build System Solution**:
The final solution was combining two commands:
```bash
docker-compose down    # Remove old container completely
docker-compose build --no-cache  # Force full rebuild without layer caching
docker-compose up -d   # Start fresh container
```

**Why This Works**:
1. `down` ensures old container is completely removed
2. `build --no-cache` tells Docker to recompile every layer, not use cached versions
3. Together, they ensure source code changes (in src/) are actually compiled into the dist/ folder inside the new container
4. Without both commands, Docker reuses cached layers and old code is used

**Result**:
- ✅ MCP protocol fully working
- ✅ Claude Code successfully connects
- ✅ Tools execute and return Coda API data
- ✅ Zero production disruption (backward compatible with legacy format)

### Future Refactoring Opportunity

The code can be refactored to separate the MCP handler into a dedicated module once the build system issue is fully understood. For now, the inlined approach is production-ready and proven to work.

---

## Files to Reference

- **Main Design**: `/openspec/changes/implement-mcp-oauth-strategy-and-sop/design.md`
- **Task List**: `/openspec/changes/implement-mcp-oauth-strategy-and-sop/tasks.md`
- **Source Code**: `/integrations/mcp/servers/coda/src/`
- **Running Container**: SSH to `tools-droplet-agents`, then `docker logs coda-mcp`
- **Test Tunnel**: `https://coda.bestviable.com/mcp` (requires BEARER_TOKEN)

---

## Quick Command Reference

```bash
# SSH to droplet
ssh tools-droplet-agents

# Check container status
docker logs coda-mcp --tail 20
docker ps -a | grep coda

# Rebuild and restart (with CRITICAL --no-cache flag)
cd /root/portfolio/integrations/mcp/servers/coda
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Test endpoints
curl http://localhost:8080/health
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize"}'

# Test with Claude Code
claude
> /mcp
> use mcp : coda ...
```

---

**Phase 1.5 Status**: ✅ COMPLETE AND DEPLOYED
