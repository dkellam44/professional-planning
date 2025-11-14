# Architecture Diagrams: Coda MCP System

Visual reference for understanding the complete system architecture.

---

## Network & Service Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                    │
│                                                                     │
│  User runs: curl https://coda.bestviable.com/mcp                  │
│             or Claude Code connects to MCP server                  │
└────────────────────────────────────────┬────────────────────────────┘
                                         │ HTTPS
                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                                  │
│                                                                     │
│  Domain: coda.bestviable.com                                       │
│  Tunnel: cloudflared daemon ←→ Cloudflare Global Network           │
│  Optional: Cloudflare Access (authentication layer)                │
└────────────────────────────────────────┬────────────────────────────┘
                                         │ HTTP (internal tunnel)
                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DROPLET (DigitalOcean)                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Docker Compose Network: n8n_proxy                           │ │
│  │                                                              │ │
│  │  ┌─────────────────────┐  ┌──────────────────────────────┐  │ │
│  │  │  nginx-proxy        │  │  Coda MCP Container          │  │ │
│  │  │  (reverse proxy)    │  │                              │  │ │
│  │  │                     │  │  Port: 8080                  │  │ │
│  │  │  ┌──────────────┐   │  │  ┌──────────────────────────┐│  │ │
│  │  │  │ Routes:      │   │  │  │  Express Server          ││  │ │
│  │  │  │ *.best...com │───┼──┼──▶ GET  /health          ││  │ │
│  │  │  │   ↓          │   │  │  │ POST /mcp              ││  │ │
│  │  │  │ localhost:80 │   │  │  │      ↓                 ││  │ │
│  │  │  └──────────────┘   │  │  │ [Auth Middleware]      ││  │ │
│  │  │                     │  │  │ [Route to Handler]      ││  │ │
│  │  └─────────────────────┘  │  │ [Call Coda API]         ││  │ │
│  │                           │  │ [Return Response]       ││  │ │
│  │                           │  │                         ││  │ │
│  │                           │  │ Environment:            ││  │ │
│  │                           │  │  CODA_API_TOKEN        ││  │ │
│  │                           │  │  AUTH_MODE=both         ││  │ │
│  │                           │  │  BEARER_TOKEN=...       ││  │ │
│  │                           │  └──────────────────────────┘│  │ │
│  │                           └──────────────────────────────┘  │ │
│  │                                                              │ │
│  │  cloudflared daemon (tunnel connection)                     │ │
│  │  ↑↓ (continuous bidirectional connection to Cloudflare)    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Other services:                                                    │
│    - n8n (workflow automation)                                     │
│    - PostgreSQL (data storage)                                     │
│    - Other MCPs (future)                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                         │
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CODA.IO (External API)                         │
│                                                                     │
│  Endpoint: https://coda.io/apis/v1                                │
│  Auth: Bearer token (pat_xxxxx)                                    │
│  Methods: GET, POST, PUT, DELETE                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow: Detailed Timeline

```
TIME  COMPONENT                  ACTION
────────────────────────────────────────────────────────────────────

T0    User (Claude Code)
      ┌─ Generate JSON-RPC 2.0 request
      │  {
      │    jsonrpc: "2.0",
      │    id: 1,
      │    method: "tools/call",
      │    params: {name: "get_whoami", arguments: {}}
      │  }
      └─ Add Header: Authorization: Bearer test-token

T1    Request travels
      ┌─ HTTPS POST to https://coda.bestviable.com/mcp
      └─ Routed through Cloudflare edge

T2    Cloudflare receives
      ┌─ Validates domain ownership
      ├─ Optional: Cloudflare Access check
      └─ Forwards through tunnel to cloudflared daemon

T3    cloudflared daemon
      ┌─ Receives tunneled request
      ├─ Decrypts Cloudflare tunnel communication
      └─ Routes to: http://nginx-proxy/mcp

T4    nginx-proxy
      ┌─ Receives: POST /mcp
      ├─ Looks up: VIRTUAL_HOST label for coda.bestviable.com
      ├─ Finds: Docker service = coda-mcp
      └─ Routes to: http://coda-mcp:8080/mcp

T5    Express Server (coda-mcp:8080)
      ┌─ Receives: POST /mcp
      ├─ Middleware stack:
      │  1. helmet() - add security headers
      │  2. cors() - handle CORS
      │  3. express.json() - parse JSON body
      │  4. authenticate - JWT/Bearer validation
      └─ Body: {"jsonrpc":"2.0",...}

T6    Authentication Middleware
      ┌─ Check: req.headers['cf-access-jwt-assertion']
      │  ├─ Empty in this test, skip
      │  └─ Production: Would validate Cloudflare JWT
      │
      ├─ Check: req.headers['authorization']
      │  ├─ Found: "Bearer test-token"
      │  ├─ Validate: Token matches BEARER_TOKEN config
      │  └─ Result: valid ✓
      │
      ├─ Set: req.user = {email: "developer@localhost", ...}
      ├─ Set: req.serviceToken = process.env.CODA_API_TOKEN
      └─ Continue to next middleware

T7    Route Handler (POST /mcp endpoint)
      ┌─ Check: Is this JSON-RPC 2.0?
      │  ├─ req.body.jsonrpc === "2.0" ✓
      │  ├─ req.body.method exists ✓
      │  └─ Route: handleJsonRpc()
      │
      ├─ handleJsonRpc(request, serviceToken, userEmail)
      │  ├─ Extract: method = "tools/call"
      │  ├─ Extract: params.name = "get_whoami"
      │  └─ Route: handleToolCall()
      │
      └─ handleToolCall()
         ├─ Lookup: Tool "get_whoami"
         ├─ Map to: Coda API endpoint = "/whoami"
         ├─ Prepare axios config:
         │  {
         │    method: "GET",
         │    url: "https://coda.io/apis/v1/whoami",
         │    headers: {
         │      Authorization: `Bearer ${serviceToken}`,
         │      ...
         │    }
         │  }
         └─ Call: await axios(config)

T8    Axios makes HTTP call
      ┌─ Opens HTTPS connection to coda.io
      ├─ Sends: GET /apis/v1/whoami
      ├─ Header: Authorization: Bearer pat_xxxxx
      └─ Waits for response

T9    Coda API processes
      ┌─ Validates Bearer token
      ├─ Looks up user: dkellam44@gmail.com
      ├─ Builds response:
      │  {
      │    name: "David Kellam",
      │    loginId: "dkellam44@gmail.com",
      │    workspace: {...},
      │    ...
      │  }
      └─ Returns: HTTP 200 OK + JSON body

T10   Axios receives response
      ┌─ Status: 200
      ├─ Body: User object
      └─ Resolves promise with response

T11   Handler formats result
      ┌─ Wrap in JSON-RPC format:
      │  {
      │    jsonrpc: "2.0",
      │    id: 1,
      │    result: {
      │      toolName: "get_whoami",
      │      success: true,
      │      data: {
      │        name: "David Kellam",
      │        ...
      │      }
      │    }
      │  }
      └─ Return from handler

T12   Express sends response
      ┌─ HTTP Status: 200
      ├─ Headers: Content-Type: application/json
      ├─ Body: JSON-RPC response
      └─ res.json(jsonRpcResponse)

T13   Response travels back
      ┌─ Express → nginx-proxy
      ├─ nginx-proxy → cloudflared
      ├─ cloudflared → Cloudflare edge (encrypted tunnel)
      └─ Cloudflare → User's Claude Code client

T14   Claude Code receives
      ┌─ Parses JSON-RPC response
      ├─ Extracts: result.data (user information)
      └─ Can now use data in conversation/tools
```

---

## Authentication: Bearer Token vs Cloudflare JWT

```
┌────────────────────┐
│ AUTHENTICATION     │
└────────────────────┘

SCENARIO 1: Bearer Token (Development)
─────────────────────────────────────

User adds header:
  Authorization: Bearer my-test-token

Server checks (cloudflare-access-auth.ts:79-94):
  ├─ validateBearerToken(authHeader)
  ├─ Remove "Bearer " prefix → token = "my-test-token"
  ├─ Check config.bearerToken === token
  ├─ If match: req.user = {email: "developer@localhost"}
  ├─ If no match: return 401
  └─ (Any non-empty token works in 'both' mode for quick testing)

When to use: Local development, testing, CI/CD


SCENARIO 2: Cloudflare JWT (Production)
─────────────────────────────────────────

User goes through Cloudflare Access login:
  1. Visits: https://coda.bestviable.com/
  2. Redirected to: Cloudflare Access login page
  3. Authenticates with: Google, GitHub, etc.
  4. Receives: cf-access-jwt-assertion cookie

Server checks (cloudflare-access-auth.ts:116-158):
  ├─ Extract: req.headers['cf-access-jwt-assertion']
  ├─ Validate JWT signature using:
  │  ├─ jwksUri: https://bestviable.cloudflareaccess.com/cdn-cgi/access/certs
  │  ├─ Verify: Signature matches Cloudflare's public key
  │  ├─ Verify: audience = "bestviable"
  │  ├─ Verify: issuer = "https://bestviable.cloudflareaccess.com"
  │  └─ Verify: Not expired
  │
  ├─ Extract claims from JWT:
  │  ├─ email (user's email from IdP)
  │  ├─ user_uuid (unique identifier)
  │  └─ other metadata
  │
  ├─ If valid: req.user = {email: "user@example.com", user_uuid: "xxx"}
  ├─ If invalid: return 401
  └─ (Only users matching Access policies can proceed)

When to use: Production, shared team access, audit requirements


FALLBACK LOGIC:
───────────────

1. Try Cloudflare JWT first (if present)
2. If no JWT, try Bearer token
3. If neither valid, return 401
4. Both can be enabled simultaneously via AUTH_MODE='both'
```

---

## Docker Networking

```
┌─ Docker Host Network
│
├─ docker-compose.yml network: "n8n_proxy" (external)
│  │
│  ├─ Service: coda-mcp
│  │  ├─ Container name: coda-mcp
│  │  ├─ Image: coda-mcp:latest
│  │  ├─ Port mapping: 8080 (internal) → exposed on network
│  │  ├─ Environment:
│  │  │  ├─ CODA_API_TOKEN=pat_xxxxx
│  │  │  ├─ AUTH_MODE=both
│  │  │  ├─ BEARER_TOKEN=...
│  │  │  └─ LOG_LEVEL=info
│  │  │
│  │  └─ Can be accessed as:
│  │     - http://coda-mcp:8080 (from other containers)
│  │     - http://localhost:8080 (from droplet host)
│  │
│  └─ Service: nginx-proxy
│     ├─ Image: jwilder/nginx-proxy
│     ├─ Port mapping: 80:80, 443:443
│     ├─ Volume mount: /var/run/docker.sock
│     ├─ Auto-discovers: Containers with VIRTUAL_HOST label
│     │
│     └─ Routing rules:
│        ├─ Header Host: coda.bestviable.com
│        ├─ Label VIRTUAL_HOST: coda.bestviable.com
│        └─ Route to: http://coda-mcp:8080
│
│
└─ External: Cloudflare Tunnel (cloudflared)
   ├─ Connects to: Cloudflare Global Network
   ├─ Listens on: Public domain coda.bestviable.com
   └─ Routes to: http://nginx-proxy:80 (internal)
```

---

## Code Execution Path (✅ COMPLETE - BOTH PHASES WORKING)

```
REQUEST ARRIVES
      │
      ▼
┌─────────────────────────────────────┐
│ Authentication Middleware            │ (cloudflare-access-auth.ts)
│ ✅ PHASE 1 COMPLETE                 │
│ • Validate JWT or Bearer             │
│ • Set req.user                        │
│ • Set req.serviceToken               │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Is request   │
        │ JSON-RPC 2.0?│ (http-server.ts:431)
        └───┬──────┬──┘
            │      │
         YES│      │NO
            │      │
      ┌─────▼──────┐  ┌──────────────────┐
      │ JSON-RPC   │  │ Legacy HTTP      │
      │ Path       │  │ Proxy Format     │
      │ ✅ PH 1.5  │  │ ✅ PHASE 1       │
      │ COMPLETE   │  │ (Tested & Works) │
      └─────┬──────┘  └────┬────────────┘
            │              │
            ▼              ▼
    ┌────────────────────┐  ┌──────────────┐
    │ handleJsonRpc()    │  │ Extract:     │
    │ (http-server.ts:   │  │ • method     │
    │  123-180)          │  │ • path       │
    │                    │  │ • data       │
    │ Routes to:         │  │ • params     │
    │ • initialize       │  │              │
    │ • tools/list       │  │ http-server  │
    │ • tools/call       │  │ .ts:449-495  │
    │ • notifications/*  │  │              │
    │   (handlers)       │  │              │
    └────────┬───────────┘  └──────┬───────┘
             │                     │
             ▼                     ▼
    ┌────────────────────────────────────┐
    │ Call Coda API                      │
    │ axios({                            │
    │   url: baseUrl + endpoint,         │
    │   headers: {                       │
    │     Authorization: Bearer token,   │
    │     Content-Type: application/json │
    │   }                                │
    │ })                                 │
    └────────┬─────────────────────────────┘
             │
             ▼
      ┌──────────────────────────────┐
      │ Return Response              │
      │ • JSON-RPC format ✅         │
      │ • Legacy format ✅           │
      │ Both working & tested        │
      └──────────────────────────────┘
```

**Key Completion Milestone**:
- Notification handling added (lines 136-159, 437-441)
- Detects messages without `id` field
- Returns empty response `{}` for proper MCP handshake

---

## Token Flow Diagram

```
CODA_API_TOKEN Environment Variable
│
│ (Set in docker-compose.yml)
│ CODA_API_TOKEN=pat_xxxxx
│
├─ Read by: config.ts (on app startup)
│  └─ Validates that it exists
│
├─ Used by: middleware/cloudflare-access-auth.ts:171
│  └─ req.serviceToken = config.codaApiToken
│
└─ Used by: HTTP Server (http-server.ts:81-82 or handler.ts:TBD)
   └─ axios(url, headers: {
      Authorization: `Bearer ${req.serviceToken}`
    })

   └─ Sent to: Coda API
      └─ Coda validates token
      └─ Returns user data for that token's account


AUTHENTICATION TOKEN (Bearer from User)
│
│ (Added by user in Authorization header)
│ Authorization: Bearer test-token
│
├─ Validated by: middleware/cloudflare-access-auth.ts:79-94
│  ├─ Compare with: config.bearerToken (dev mode)
│  └─ Confirm: User is authenticated
│
└─ Does NOT directly access Coda
  └─ Only grants access to MCP Server
  └─ MCP Server then uses CODA_API_TOKEN for Coda calls
```

---

**Last Updated**: 2025-11-10
**Status**: ✅ Phase 1.5 COMPLETE - All diagrams reflect production-ready system
**Audience**: Developers maintaining the MCP server or building similar systems
**Related Files**:
- MCP_IMPLEMENTATION_GUIDE.md (text reference)
- design.md (technical design decisions)
- tasks.md (implementation tasks)
- SESSION_SUMMARY_2025-11-10_PHASE15_COMPLETE.md (session notes)
