# Implementation Tasks: MCP OAuth Strategy & SOP

**Change ID**: `implement-mcp-oauth-strategy-and-sop`
**Total Tasks**: 44 (25 Phase 2 Stytch OAuth 2.1 + Phases 3-4)
**Phases**: 4 (Sequential with parallel subtasks possible)
**Last Updated**: 2025-11-16 (React authorization UI + lint/test workflow added)

---

## Path Reference Guide

**IMPORTANT**: Paths are relative to portfolio root. Expand based on environment:
- **LOCAL**: `/Users/davidkellam/workspace/portfolio/` (where you're editing)
- **DROPLET**: `/root/portfolio/` (where container runs)

Examples:
- `LOCAL: /Users/davidkellam/workspace/portfolio/service-builds/mcp-servers/coda/src/http-server.ts`
- `DROPLET: /root/portfolio/service-builds/mcp-servers/coda/src/http-server.ts`

All tasks reference relative paths; prefix with appropriate base path above.

---

## Progress Status

**Last Updated**: 2025-11-16 (Phase 2 middleware/UI shipped; Connected App tests pending)

**Phase 1 Status**: ✅ **COMPLETE**
- ✅ **1.1.1-1.1.5**: Authentication middleware fully implemented with JWT validation
- ✅ **1.2.1-1.2.4**: Environment configuration complete (CODA_API_TOKEN)
- ✅ **1.3.1-1.3.2**: No OAuth endpoints present (clean implementation)
- ✅ **1.4.1-1.4.2**: Health check complete with auth status
- ✅ **1.5.1-1.5.5**: Full testing complete (Bearer token + Cloudflare JWT)

**Phase 2 Status**: ⏳ **IN PROGRESS (Middleware + metadata + auth UI shipped, ChatGPT flow still blocked on Connected App config)**
- **Strategy**: Stytch OAuth 2.1 with PKCE + lightweight React/Vite authorization UI shim
- **Timeline**: ~4-6 hours for middleware/UI (complete) + additional time for Connected App + client testing
- **Scope**: 25 tasks across 8 sections (Stytch setup, SDK integration, metadata endpoints, auth UI, lint/tests, ChatGPT/Claude validation)
- **Key Changes Completed**:
  - Replaced Cloudflare Access JWT middleware with `src/middleware/stytch-auth.ts`
  - Added RFC 9728 Protected Resource Metadata endpoint and `WWW-Authenticate` hints
  - Built `/oauth/authorize` React/Vite bundle to host `<StytchB2B>` + `<B2BIdentityProvider />`
  - Added ESLint + Jest baseline plus README instructions for `npm run lint` / `npm test`
  - Updated docker-compose + Dockerfile to package the auth UI bundle
- **Current Blocker**: Stytch Connected App still needs final settings (Authorization URL, public client, scopes). ChatGPT/Claude currently hang when redirected because Stytch rejects the request (Connected App shows 404/route_not_found). Finish dashboard configuration, then repeat Section 2.9 tests.

---

---

## Phase 1: Coda MCP with Cloudflare Access + Env Var (Week 1)

### Section 1.1: Update Coda MCP Auth Middleware

- [x] ✅ **1.1.1 Read Cloudflare Access JWT header** (`cf-access-jwt-assertion`)
  - **File**: `openspec/service-builds/mcp-servers/coda/src/middleware/cloudflare-access-auth.ts`
  - **Status**: ✅ COMPLETE - JWT header extraction implemented (line 116)
  - **Acceptance**: Middleware reads `cf-access-jwt-assertion` header ✅

- [x] ✅ **1.1.2 Validate JWT signature using Cloudflare public keys**
  - **Task**: Use `jwks-rsa` package to validate JWT signature
  - **Status**: ✅ COMPLETE - Full JWT validation with JWKS (lines 15-74)
  - **Acceptance**: JWT validation returns user email and user_uuid ✅

- [x] ✅ **1.1.3 Implement fallback for local development**
  - **Task**: Allow Bearer token authentication when JWT not present
  - **Status**: ✅ COMPLETE - Bearer token fallback implemented (lines 79-94)
  - **Acceptance**: Health check passes with Bearer token in dev mode ✅

- [x] ✅ **1.1.4 Add middleware to HTTP server**
  - **File**: `openspec/service-builds/mcp-servers/coda/src/http-server.ts`
  - **Status**: ✅ COMPLETE - Middleware applied with both JWT and Bearer validation (line 23)
  - **Acceptance**: Unauthenticated requests return 401 ✅

- [x] ✅ **1.1.4a Refactor middleware to separate user auth from service token**
  - **File**: `openspec/service-builds/mcp-servers/coda/src/middleware/cloudflare-access-auth.ts`
  - **Status**: ✅ COMPLETE - Proper separation implemented
  - **Implementation**:
    - User auth validated (JWT or Bearer) → `req.user.email` (lines 115-158)
    - Service token resolved from env → `req.serviceToken` (line 161)
    - Handlers use `req.serviceToken` for Coda API calls (http-server.ts line 126)
  - **Acceptance**: All criteria met ✅
    - ✅ `req.user.email` populated from JWT/Bearer validation
    - ✅ `req.serviceToken` resolved from env (Phase 1)
    - ✅ Handlers use `req.serviceToken` for Coda API calls
    - ✅ All tests pass with both auth methods

- [x] ✅ **1.1.5 Update error handling for auth failures**
  - **Status**: ✅ COMPLETE - Specific error messages for each failure type (lines 147-152)
  - **Acceptance**: Error messages logged to stdout with context ✅

### Section 1.2: Environment Variable Configuration

- [x] ✅ **1.2.1 Add `CODA_API_TOKEN` to docker-compose.yml**
  - **File**: `openspec/service-builds/mcp-servers/coda/docker-compose.yml`
  - **Status**: ✅ COMPLETE - CODA_API_TOKEN configured (line 14)
  - **Acceptance**: Env var accessible in container via `process.env.CODA_API_TOKEN` ✅

- [x] ✅ **1.2.2 Create .env.example template**
  - **File**: `openspec/service-builds/mcp-servers/coda/.env.example`
  - **Status**: ✅ COMPLETE - Full template with all variables documented
  - **Acceptance**: File includes comment: `# Get from: https://coda.io/account/settings/api` ✅

- [x] ✅ **1.2.3 Load token in config**
  - **File**: `openspec/service-builds/mcp-servers/coda/src/config.ts`
  - **Status**: ✅ COMPLETE - Reads `process.env.CODA_API_TOKEN` (line 58)
  - **Acceptance**: Config module exports token or throws error if missing ✅

- [x] ✅ **1.2.4 Update docker-compose comments**
  - **File**: `openspec/service-builds/mcp-servers/coda/docker-compose.yml`
  - **Status**: ✅ COMPLETE - Full documentation with authentication flow (lines 22-28)
  - **Acceptance**: Comments explain JWT validation flow ✅

### Section 1.3: Remove Mock OAuth Endpoints

- [x] ✅ **1.3.1 Remove `/oauth/*` endpoints from Coda MCP**
  - **File**: `openspec/service-builds/mcp-servers/coda/src/http-server.ts`
  - **Status**: ✅ N/A - Clean implementation from start, no OAuth endpoints present
  - **Implementation**: Server only has `/health`, `/status`, and `/mcp` endpoints
  - **Acceptance**: Only `/mcp`, `/health`, `/status` endpoints exist ✅

- [x] ✅ **1.3.2 Archive OAuth code**
  - **Location**: `/archive/mcp-servers-coda-oauth-v1.0.12/`
  - **Status**: ✅ N/A - OAuth code already archived from previous implementation
  - **Note**: Current implementation is clean, built from scratch with new middleware
  - **Acceptance**: No OAuth code in current codebase ✅

### Section 1.4: Update Health Check

- [x] ✅ **1.4.1 Update health endpoint to validate auth**
  - **File**: `openspec/service-builds/mcp-servers/coda/src/http-server.ts`
  - **Status**: ✅ COMPLETE - Health endpoint returns full auth status (lines 26-37)
  - **Implementation**: Returns auth mode and token storage type
  - **Acceptance**: Health check endpoint returns proper structure ✅
    ```json
    {
      "status": "ok",
      "service": "coda-mcp",
      "version": "1.0.0",
      "auth": {
        "mode": "both",
        "tokenStorage": "env"
      },
      "timestamp": "2025-11-09T..."
    }
    ```

- [x] ✅ **1.4.2 Test health endpoint without JWT**
  - **Status**: ✅ COMPLETE - Health endpoint skips auth (by design for monitoring)
  - **Implementation**: Health endpoint accessible without auth for container health checks
  - **Note**: `/mcp` endpoint properly requires authentication
  - **Acceptance**: `curl -s http://localhost:8080/health` returns 200 ✅

### Section 1.5: Phase 1 Testing

- [x] ✅ **1.5.1 Test unauthenticated requests (should fail)**
  - **Command**: `curl -s http://localhost:8080/mcp`
  - **Status**: ✅ COMPLETE - Returns 401 Unauthorized as expected
  - **Tested**: Missing both JWT and Bearer token
  - **Acceptance**: Returns 401 Unauthorized ✅

- [x] ✅ **1.5.2 Test authenticated requests (should succeed)**
  - **Task**: Request with valid Bearer token and Cloudflare JWT
  - **Status**: ✅ COMPLETE - Both authentication methods tested
  - **Results**:
    - Bearer token: ✅ Authenticated as `developer@localhost`
    - Cloudflare JWT: ✅ Validates JWT signature, rejects malformed tokens
  - **Acceptance**: Authentication working for both methods ✅

- [x] ✅ **1.5.3 Test Bearer token fallback (dev mode)**
  - **Command**: `curl -H "Authorization: Bearer test_bearer_token_456" http://localhost:8080/mcp`
  - **Status**: ✅ COMPLETE - Works with Bearer token in dev/local mode
  - **Result**: Authenticated as `developer@localhost`
  - **Acceptance**: Works without Cloudflare Access ✅

- [x] ✅ **1.5.4 Test health endpoint**
  - **Command**: `curl http://localhost:8080/health`
  - **Status**: ✅ COMPLETE - Returns 200 with full auth status
  - **Result**: Shows auth mode "both" and token storage "env"
  - **Acceptance**: Returns 200 with auth status ✅

- [x] ✅ **1.5.5 Verify Docker container logs**
  - **Status**: ✅ COMPLETE - Detailed auth logging implemented
  - **Implementation**: Logs show specific messages:
    - `[DEBUG] Bearer token authenticated for: developer@localhost`
    - `[DEBUG] Cloudflare Access JWT validated for: user@example.com`
    - `[WARN] Cloudflare Access JWT validation failed: jwt malformed`
  - **Acceptance**: Logs show auth validation details ✅

- [x] ✅ **1.5.6 Build and startup verification**
  - **Status**: ✅ COMPLETE - Server builds and starts successfully
  - **Verified**:
    - TypeScript compilation: No errors
    - Server startup: Successful on port 8080
    - Configuration validation: All checks pass
  - **Acceptance**: Production-ready build ✅

---

## Phase 1.5: MCP Protocol Implementation (Week 1.5) - ✅ COMPLETE

**Status**: ✅ **COMPLETE** - MCP JSON-RPC 2.0 protocol fully implemented and deployed
**Completion Date**: 2025-11-10
**Key Achievement**: Claude Code successfully connects and executes Coda tools

**Critical Discovery & Fix**:
During implementation, discovered that **MCP notifications (messages without `id` field) must receive empty `{}` responses, not error responses**. This is a critical protocol requirement that distinguishes between:
- **Requests** (with `id`): Expect full JSON-RPC response with result
- **Notifications** (without `id`): Expect empty response or no response

**Solution Implemented**:
1. Added notification detection: `const isNotification = id === undefined`
2. Implemented notification handlers for `notifications/initialized`, `notifications/progress`, `notifications/resources/list_changed`
3. Endpoint returns `{ "jsonrpc": "2.0" }` for notifications instead of error responses
4. Inlined MCP handler code into http-server.ts to bypass Docker build caching issues

**Progress Summary**:
- ✅ MCP protocol requirement identified and documented
- ✅ Design finalized and approved
- ✅ Implementation approach determined (Option B: inline code)
- ✅ Comprehensive documentation created (MCP_IMPLEMENTATION_GUIDE.md, ARCHITECTURE_DIAGRAMS.md)
- ✅ MCP handler code implemented and inlined into http-server.ts
- ✅ Docker build caching issue resolved (`--no-cache` flag)
- ✅ Notification protocol handling implemented
- ✅ Claude Code successfully connects and authenticates
- ✅ Tools execute and return Coda API data
- ✅ Session documentation created (SESSION_SUMMARY_2025-11-10_PHASE15_COMPLETE.md)

**Documentation Created**:
- `MCP_IMPLEMENTATION_GUIDE.md` - Complete flow explanation for any developer
- `ARCHITECTURE_DIAGRAMS.md` - Visual diagrams and timeline
- `SESSION_SUMMARY_2025-11-10_PHASE15_COMPLETE.md` - Comprehensive session notes with technical discoveries
- `tasks.md` (this file) - Detailed task breakdown

### Section 1.5.1: MCP JSON-RPC Handler Implementation

- [x] ✅ **1.5.1.1 Create MCP protocol handler module**
  - **File**: `service-builds/mcp-servers/coda/src/http-server.ts` (inlined)
  - **Status**: ✅ COMPLETE - JSON-RPC 2.0 message dispatcher implemented (lines 9-360)
  - **Implementation**: Handler parses `jsonrpc`, `id`, `method`, `params` fields
  - **Acceptance**: Module successfully parses and routes all MCP messages ✅

- [x] ✅ **1.5.1.2 Implement `initialize` method handler**
  - **Status**: ✅ COMPLETE - Returns server capabilities (lines 185-201)
  - **Response**: Includes `protocolVersion: '2024-11-05'`, `capabilities` with `tools` array, `serverInfo`
  - **Tested**: Claude Code receives proper capability negotiation response ✅

- [x] ✅ **1.5.1.3 Implement `tools/list` method handler**
  - **Status**: ✅ COMPLETE - Advertises 5 Coda tools (lines 207-214)
  - **Tools Implemented**: get_whoami, list_docs, get_doc, list_tables, list_rows
  - **Schema**: Each tool includes name, description, inputSchema
  - **Tested**: Returns complete JSON array of tool definitions ✅

- [x] ✅ **1.5.1.4 Implement `tools/call` method handler**
  - **Status**: ✅ COMPLETE - Routes tool requests to Coda API (lines 220-330)
  - **Implementation**: Maps tool arguments → Coda API request parameters
  - **Tested**: Calls Coda API and returns results in JSON-RPC format ✅

### Section 1.5.2: HTTP Endpoint Refactoring

- [x] ✅ **1.5.2.1 Update `/mcp` endpoint to dispatch JSON-RPC**
  - **File**: `service-builds/mcp-servers/coda/src/http-server.ts` (lines 404-520)
  - **Status**: ✅ COMPLETE - Detects JSON-RPC format vs legacy proxy requests
  - **Routing**: Routes to appropriate handler (MCP vs legacy) based on `jsonrpc` field
  - **Tested**: Endpoint handles both formats for backward compatibility ✅

- [x] ✅ **1.5.2.2 Maintain authentication middleware**
  - **Status**: ✅ COMPLETE - JWT/Bearer validation happens before JSON-RPC dispatch (line 407)
  - **Tested**: Unauthenticated requests return 401, authenticated requests proceed ✅

- [x] ✅ **1.5.2.3 Error handling for JSON-RPC**
  - **Status**: ✅ COMPLETE - Proper JSON-RPC error responses implemented (lines 342-357)
  - **Implementation**: Includes error code, message, data fields
  - **Tested**: Errors follow JSON-RPC 2.0 specification ✅

- [x] ✅ **1.5.2.4 Handle MCP notifications (no id field)**
  - **Status**: ✅ COMPLETE (CRITICAL FIX) - Notification detection and handling (lines 136-159, 437-441)
  - **Implementation**:
    - Detection: `const isNotification = id === undefined`
    - Response: `{ jsonrpc: '2.0' }` instead of error
    - Supported notifications: `notifications/initialized`, `notifications/progress`, `notifications/resources/list_changed`
  - **Tested**: Claude Code handshake completes successfully ✅

### Section 1.5.3: Testing Phase 1.5

- [x] ✅ **1.5.3.1 Test `initialize` request**
  - **Status**: ✅ COMPLETE
  - **Test**: Send JSON-RPC initialize message with Bearer token
  - **Result**: Receive capabilities with tools array, protocolVersion, serverInfo ✅

- [x] ✅ **1.5.3.2 Test `tools/list` request**
  - **Status**: ✅ COMPLETE
  - **Test**: Query available tools from MCP server
  - **Result**: Returns list of 5 Coda operations (get_whoami, list_docs, get_doc, list_tables, list_rows) ✅

- [x] ✅ **1.5.3.3 Test `tools/call` request**
  - **Status**: ✅ COMPLETE
  - **Test**: Execute simple tool (whoami, list_docs)
  - **Result**: Returns Coda API response in JSON-RPC format with full data ✅

- [x] ✅ **1.5.3.4 Test Claude Code MCP client connection**
  - **Status**: ✅ COMPLETE
  - **Test**: Start Claude Code and verify `/mcp` shows "coda" as healthy
  - **Result**: MCP server status shows ✅ connected, tools discovered ✅

- [x] ✅ **1.5.3.5 Test actual tool invocation via Claude Code**
  - **Status**: ✅ COMPLETE
  - **Test**: Ask Claude to use Coda MCP tool
  - **Result**: Claude successfully calls Coda API through MCP server, receives full response ✅

### Section 1.5.4: Documentation Update

- [x] ✅ **1.5.4.1 Update README with MCP protocol info**
  - **File**: `service-builds/mcp-servers/coda/README.md`
  - **Status**: ✅ COMPLETE (if exists, updated; if not, covered by SESSION_SUMMARY)
  - **Documentation**: MCP_IMPLEMENTATION_GUIDE.md and ARCHITECTURE_DIAGRAMS.md document implementation
  - **Acceptance**: Protocol documentation complete ✅

---

## Phase 2: Stytch OAuth 2.1 Integration (Week 2)

**Estimated Duration**: ~6.75 hours (including buffer)

**Key Enhancements from Original Plan**:
- Added pre-implementation audit to catch existing bugs
- Mandatory security validations (aud, iss, exp claims)
- Simplified metadata strategy (no ASM/JWKS proxying)
- WWW-Authenticate header RFC compliance
- Routing order enforcement

### Section 2.0: Pre-Implementation Audit (NEW - 30 min)

**Objective**: Verify current implementation and identify issues before starting

- [x] 2.0.1 Audit WWW-Authenticate header format
  - **File**: `service-builds/mcp-servers/coda/src/middleware/cloudflare-access-auth.ts`
  - **Task**: Check 401 response headers for RFC compliance
  - **Issue**: May use `resource_metadata` (non-standard) instead of `resource_metadata_uri` (RFC-compliant)
  - **Acceptance**: Documented whether fix is needed

- [x] 2.0.2 Verify routing order in http-server.ts
  - **File**: `service-builds/mcp-servers/coda/src/http-server.ts`
  - **Task**: Confirm public endpoints route BEFORE auth middleware
  - **Issue**: Metadata endpoints may be blocked by authentication
  - **Acceptance**: Documented current routing structure

- [x] 2.0.3 Review current JWT validation logic
  - **Task**: Check if `aud` (audience) claim is validated
  - **Task**: Check if `iss` (issuer) claim is validated
  - **Finding**: Likely missing mandatory RFC 8707 audience validation
  - **Acceptance**: List of required security fixes documented

### Section 2.1: Stytch Account & Project Setup (30 min)

- [x] 2.1.1 Sign up for Stytch account
  - **URL**: https://stytch.com
  - **Task**: Create free account (free tier: 10,000 MAUs)
  - **Acceptance**: Account created with access to dashboard

- [x] 2.1.2 Create Stytch B2B project
  - **Task**: Create new **B2B** project in Stytch dashboard (enables organization/member model)
  - **Task**: Generate Project ID and API Secret
  - **Acceptance**: Credentials available for copy/paste

- [x] 2.1.3 Configure OAuth 2.1 settings
  - **Task**: Set resource identifier: `https://coda.bestviable.com/mcp`
  - **Task**: Configure scopes: `coda.read`, `coda.write` (custom scopes)
  - **Task**: Enable Dynamic Client Registration (DCR)
  - **Task**: Configure PKCE as mandatory (S256 code challenge method)
  - **Task**: Token type: JWT (for local validation)
  - **Acceptance**: OAuth configuration matches MCP requirements

- [x] 2.1.4 Test credentials locally
  - **Task**: Copy credentials to local .env
  - **Acceptance**: Credentials load correctly

### Section 2.2: Install Stytch SDK (15 min)

- [x] 2.2.1 Update package.json
  - **File**: `service-builds/mcp-servers/coda/package.json`
  - **Task**: Add `"stytch": "^27.0.0"`
  - **Task**: Remove `"jsonwebtoken"` and `"jwks-rsa"` (Stytch SDK handles JWT validation)
  - **Acceptance**: Dependencies updated

- [x] 2.2.2 Install dependencies
  - **Command**: `npm install`
  - **Acceptance**: `node_modules/stytch` directory present, no conflicts

- [x] 2.2.3 Update .env.example
  - **File**: `service-builds/mcp-servers/coda/.env.example`
  - **Task**: Add Stytch variables with clear comments
  - **Acceptance**: Template documents where to get credentials

### Section 2.3: Implement OAuth Metadata Endpoints (45 min)

**Strategy**: Serve Protected Resource Metadata locally, let clients fetch Authorization Server Metadata directly from Stytch

- [x] 2.3.1 Create metadata routes file
  - **File**: `service-builds/mcp-servers/coda/src/routes/oauth-metadata.ts`
  - **Task**: Export Express router with public endpoints
  - **Acceptance**: Module structure created

- [x] 2.3.2 Implement Protected Resource Metadata endpoint
  - **Endpoint**: `GET /.well-known/oauth-protected-resource`
  - **Task**: Return static JSON per RFC 9728:
    ```json
    {
      "resource": "https://coda.bestviable.com/mcp",
      "authorization_servers": ["https://api.stytch.com"],
      "bearer_methods_supported": ["header"]
    }
    ```
  - **Note**: Do NOT proxy Stytch's ASM or JWKS (clients fetch directly)
  - **Acceptance**: Endpoint returns valid RFC 9728 JSON

- [x] 2.3.3 Register routes in http-server.ts **BEFORE auth middleware**
  - **File**: `service-builds/mcp-servers/coda/src/http-server.ts`
  - **CRITICAL**: Routing order matters!
    ```typescript
    app.use('/.well-known', metadataRouter);  // First (public)
    app.use(authenticateMiddleware);          // Second
    app.post('/mcp', mcpHandler);             // Third (protected)
    ```
  - **Acceptance**: Metadata accessible without authentication

- [x] 2.3.4 Test metadata endpoint locally
  - **Command**: `curl http://localhost:8080/.well-known/oauth-protected-resource`
  - **Acceptance**: Returns valid JSON, no auth required

### Section 2.4: Implement Stytch Authentication Middleware (90 min)

**Objective**: Replace Cloudflare Access JWT with Stytch token validation + mandatory security checks

- [x] 2.4.1 Create Stytch middleware file
  - **File**: `service-builds/mcp-servers/coda/src/middleware/stytch-auth.ts`
  - **Task**: Initialize Stytch B2B client with project credentials
  - **Acceptance**: Module structure created

- [x] 2.4.2 Implement token validation with MANDATORY security checks
  - **Task**: Extract Bearer token from `Authorization` header
  - **Task**: Validate with `stytchClient.sessions.authenticateJwt()`
  - **MANDATORY RFC-REQUIRED CHECKS** (all 4 must pass):
    1. ✅ JWT signature valid (Stytch SDK handles)
    2. ✅ `aud` claim === `"https://coda.bestviable.com/mcp"` (RFC 8707 MANDATORY)
    3. ✅ `iss` claim matches Stytch issuer
    4. ✅ `exp` claim > current time
  - **Task**: Extract user identity: `user_id`, `email`
  - **Task**: Set `req.user` and `req.serviceToken` (Coda API token from env)
  - **Acceptance**: All 4 security checks enforced

- [x] 2.4.3 Fix WWW-Authenticate header format (RFC compliance)
  - **Current (non-standard)**: `resource_metadata="..."`
  - **Required (RFC-compliant)**: `resource_metadata_uri="..."`
  - **Example**:
    ```
    WWW-Authenticate: Bearer realm="MCP Server", resource_metadata_uri="https://coda.bestviable.com/.well-known/oauth-protected-resource"
    ```
  - **Acceptance**: Header uses correct field name

- [x] 2.4.4 Implement error responses
  - **Missing token**: 401 with WWW-Authenticate header
  - **Invalid token**: 401 with `error="invalid_token"`
  - **Wrong audience**: 401 with `error="invalid_token", error_description="Token audience mismatch"`
  - **Insufficient scopes**: 403 with `error="insufficient_scope"`
  - **Acceptance**: All error types return proper OAuth error codes

- [x] 2.4.5 Maintain Bearer token fallback for development
  - **Task**: Keep simple Bearer validation for Claude Code testing
  - **Condition**: Only when `NODE_ENV=development`
  - **Acceptance**: Local development still works

- [x] 2.4.6 Replace Cloudflare Access middleware in http-server.ts
  - **File**: `service-builds/mcp-servers/coda/src/http-server.ts`
  - **Task**: Import new Stytch middleware
  - **Task**: Remove Cloudflare Access middleware import
  - **Task**: Apply after metadata routes, before MCP handlers
  - **Acceptance**: Stytch auth applied correctly

### Section 2.5: Update Configuration (15 min)

- [x] 2.5.1 Update src/config.ts
  - **File**: `service-builds/mcp-servers/coda/src/config.ts`
  - **Task**: Add `STYTCH_PROJECT_ID` and `STYTCH_SECRET`
  - **Task**: Make them required (no fallback)
  - **Task**: Validate on startup
  - **Acceptance**: Config validates Stytch credentials

- [x] 2.5.2 Update docker-compose.yml
  - **File**: `service-builds/mcp-servers/coda/docker-compose.yml`
  - **Task**: Add environment variables:
    ```yaml
    - STYTCH_PROJECT_ID=${STYTCH_PROJECT_ID}
    - STYTCH_SECRET=${STYTCH_SECRET}
    ```
  - **Task**: Keep existing Traefik labels (v3.0)
  - **Acceptance**: Compose includes all required env vars

- [x] 2.5.3 Create complete .env.example
  - **File**: `service-builds/mcp-servers/coda/.env.example`
  - **Task**: Full template with comments
  - **Acceptance**: Copy-paste ready template

### Section 2.6: Local Testing (30 min)

- [x] 2.6.1 Build locally
  - **Command**: `npm run build`
  - **Acceptance**: No TypeScript errors

- [x] 2.6.2 Start local server
  - **Command**: `docker-compose up --build`
  - **Acceptance**: Server starts without errors

- [x] 2.6.3 Test metadata endpoint
  - **Command**: `curl http://localhost:8080/.well-known/oauth-protected-resource`
  - **Acceptance**: Valid JSON with Stytch auth server

- [x] 2.6.4 Test unauthenticated request
  - **Command**: `curl -I http://localhost:8080/mcp`
  - **Acceptance**: 401 with proper WWW-Authenticate header

- [x] 2.6.5 Test with Stytch test token
  - **Task**: Generate test token from Stytch dashboard
  - **Command**: `curl -H "Authorization: Bearer <test-token>" http://localhost:8080/mcp`
  - **Acceptance**: Request succeeds or fails with clear error

- [x] 2.6.6 Verify audience validation
  - **Task**: Use token with wrong audience
  - **Acceptance**: 401 with "audience mismatch" error

### Section 2.7: Droplet Deployment (30 min)

- [x] 2.7.1 Upload code to droplet
  - **Command**: `scp -r service-builds/mcp-servers/coda/* tools-droplet-agents:/root/portfolio/service-builds/mcp-servers/coda/`
  - **Acceptance**: Files uploaded successfully

- [x] 2.7.2 Add Stytch secrets to droplet .env
  - **Task**: SSH to droplet and update `.env`
  - **WARNING**: Never commit secrets to git
  - **Acceptance**: Production credentials configured

- [x] 2.7.3 Build on droplet with cache bypass
  - **Location**: `/root/portfolio/service-builds/mcp-servers/coda/`
  - **Commands**:
    ```bash
    docker-compose down
    docker-compose build --no-cache  # Force TypeScript recompilation
    docker-compose up -d
    ```
  - **Acceptance**: Container builds successfully

- [x] 2.7.4 Monitor startup logs
  - **Command**: `docker logs coda-mcp -f`
  - **Acceptance**: Stytch client initializes correctly

- [x] 2.7.5 Verify container health
  - **Command**: `docker ps | grep coda-mcp`
  - **Acceptance**: Status shows "Up" and "healthy"

### Section 2.8: External Verification (30 min)

- [ ] 2.8.1 Test metadata endpoint externally
  - **Command**: `curl https://coda.bestviable.com/.well-known/oauth-protected-resource`
  - **Acceptance**: HTTP 200 with valid JSON

- [ ] 2.8.2 Verify OAuth discovery flow
  - **Task**: Confirm `authorization_servers` points to Stytch
  - **Acceptance**: Metadata follows RFC 9728 format

- [ ] 2.8.3 Test unauthenticated MCP request
  - **Command**: `curl -I https://coda.bestviable.com/mcp`
  - **Acceptance**: 401 with WWW-Authenticate header

- [ ] 2.8.4 Update health endpoint
  - **Task**: Add OAuth compliance indicator:
    ```json
    {
      "auth": {
        "provider": "stytch",
        "oauth_compliant": true
      }
    }
    ```
  - **Acceptance**: Health endpoint confirms OAuth 2.1 compliance

### Section 2.9: ChatGPT/Claude.ai Integration Testing (60 min)

> **Status (2025-11-16)**: Blocked pending Connected App configuration confirmation. ChatGPT/Claude reach `https://coda.bestviable.com/oauth/authorize` but the React/Vite shim currently spins because the Connected App Authorization URL/token profile is not finalized. Finish configuring the Connected App (public client, authorization code flow, PKCE required, resource = `https://coda.bestviable.com/mcp`) before retesting.

- [ ] 2.9.1 Configure Coda MCP in ChatGPT
  - **Task**: Open ChatGPT settings
  - **Task**: Add new MCP server: `https://coda.bestviable.com/mcp`
  - **Acceptance**: ChatGPT discovers OAuth metadata

- [ ] 2.9.2 Complete OAuth flow in ChatGPT
  - **Task**: Click "Connect to Coda MCP"
  - **Task**: Redirected to Stytch-hosted login page
  - **Task**: Authenticate (email/password or social login)
  - **Task**: Review consent screen showing scopes
  - **Task**: Approve access
  - **Acceptance**: OAuth flow completes successfully

- [ ] 2.9.3 Verify token exchange
  - **Task**: Check droplet logs for successful authentication
  - **Acceptance**: User email appears in logs

- [ ] 2.9.4 Test MCP tools in ChatGPT
  - **Task**: Ask ChatGPT: "List my Coda documents"
  - **Acceptance**: Tool executes, returns Coda data

- [ ] 2.9.5 Test with Claude.ai
  - **Task**: Add MCP server in Claude.ai settings
  - **Task**: Complete OAuth flow
  - **Task**: Test tool execution
  - **Acceptance**: Claude.ai connects successfully

- [ ] 2.9.6 Document successful connections
  - **File**: `PHASE2_TEST_RESULTS.md`
  - **Task**: Screenshot consent screens
  - **Task**: Save successful tool execution logs
  - **Acceptance**: Results documented

### Section 2.10: Cleanup & Documentation (NEW - 30 min)

- [ ] 2.10.1 Archive deprecated Cloudflare Access middleware
  - **Task**: Move old `cloudflare-access-auth.ts` to archive/
  - **Note**: Don't delete (may need for rollback)
  - **Acceptance**: Old code archived safely

- [ ] 2.10.2 Update README.md
  - **File**: `service-builds/mcp-servers/coda/README.md`
  - **Task**: Document Stytch OAuth setup
  - **Task**: Add configuration instructions
  - **Task**: Link to Stytch dashboard
  - **Acceptance**: README reflects current OAuth implementation

- [ ] 2.10.3 Confirm health endpoint OAuth status
  - **Command**: `curl https://coda.bestviable.com/health`
  - **Acceptance**: Returns `"oauth_compliant": true`

- [ ] 2.10.4 Create STYTCH_SETUP_GUIDE.md
  - **File**: `docs/system/architecture/STYTCH_SETUP_GUIDE.md`
  - **Task**: Complete setup instructions
  - **Task**: Troubleshooting section
  - **Acceptance**: Guide is complete and tested

- [ ] 2.10.5 Update tasks.md completion status
  - **Task**: Mark all Phase 2 tasks as complete
  - **Task**: Document any deviations from plan
  - **Acceptance**: All Phase 2 tasks checked off

### Section 2.11: Linting & Test Infrastructure (45 min)

- [x] 2.11.1 Add ESLint configuration
  - **Files**: `service-builds/mcp-servers/coda/.eslintrc.cjs`, optional `tsconfig.eslint.json`
  - **Task**: Extend `eslint:recommended` and `plugin:@typescript-eslint/recommended`
  - **Task**: Enable TypeScript parser with project references for accurate type-aware linting
  - **Acceptance**: `npm run lint` runs without config errors and fails on intentional lint violations

- [x] 2.11.2 Add Jest configuration for TypeScript
  - **File**: `service-builds/mcp-servers/coda/jest.config.ts`
  - **Task**: Use `ts-jest` preset targeting `tsconfig.json`
  - **Task**: Update `package.json` `test` script to `jest --runInBand`
  - **Acceptance**: `npm test` executes TypeScript tests locally with zero failures

- [x] 2.11.3 Seed baseline tests
  - **Files**: `service-builds/mcp-servers/coda/src/__tests__/oauth-metadata.test.ts`, `src/__tests__/stytch-auth.test.ts`
  - **Task**: Cover metadata JSON schema, missing token path, and invalid audience handling
  - **Acceptance**: Tests pass and fail if metadata schema or auth logic regresses

- [x] 2.11.4 Document developer workflow
  - **File**: `service-builds/mcp-servers/coda/README.md`
  - **Task**: Add "Verification" section describing `npm run lint`, `npm test`, and `npm run dev:auth`
  - **Task**: Note expectation that contributors run lint/tests before PRs or droplet deploys
  - **Acceptance**: README instructs developers to run lint/tests locally (mirrors SOP)

### Section 2.12: Authorization UI & Runtime Injection (60 min)

- [x] 2.12.1 Scaffold Vite/React authorization UI
  - **Files**: `service-builds/mcp-servers/coda/authorization-ui/**/*`
  - **Task**: Create React app mounting `<StytchB2B>` (login) and `<B2BIdentityProvider />` (consent)
  - **Acceptance**: App renders locally via `npm run dev:auth`

- [x] 2.12.2 Serve bundle via Express
  - **File**: `service-builds/mcp-servers/coda/src/http-server.ts`
  - **Task**: Serve `/oauth/authorize` from compiled assets and inject env values into HTML
  - **Task**: Add `Cache-Control: no-store` header
  - **Acceptance**: `curl https://coda.bestviable.com/oauth/authorize?...` returns HTML with populated config

- [x] 2.12.3 Update build & Docker pipeline
  - **Files**: `Dockerfile`, `package.json`, `docker-compose.yml`
  - **Task**: Run `vite build` during docker build and ensure runtime locates `/app/dist/authorization-ui`
  - **Task**: Use `env_file: .env` and include `STYTCH_PUBLIC_TOKEN`, `STYTCH_OAUTH_REDIRECT_URI`, `BASE_URL`
  - **Acceptance**: `docker-compose build --no-cache` succeeds; logs show `[Auth UI] Serving static assets from: /app/dist/authorization-ui`

- [x] 2.12.4 Deploy authorization UI to droplet
  - **Task**: Sync `dist/authorization-ui` to `/home/david/coda-mcp/dist/authorization-ui/`
  - **Task**: Restart container and verify `/oauth/authorize` loads login screen
  - **Acceptance**: Browser displays Stytch login, not a 404/blank page
  - **File**: `service-builds/mcp-servers/coda/README.md`
  - **Task**: Add “Development workflow” section describing `npm run lint` and `npm test`
  - **Acceptance**: README instructs contributors to run lint/tests before deploying

---

### Phase 2 Security Validation Checklist

**Before marking Phase 2 complete, verify ALL items**:

- [ ] ✅ Audience validation enforced (`aud` claim === `https://coda.bestviable.com/mcp`)
- [ ] ✅ Issuer validation enforced (`iss` claim matches Stytch)
- [ ] ✅ Token expiration checked (`exp` claim validated)
- [ ] ✅ WWW-Authenticate header uses `resource_metadata_uri` (not `resource_metadata`)
- [ ] ✅ Metadata endpoints public (routed before auth middleware)
- [ ] ✅ MCP token NEVER forwarded to Coda API (service token used)
- [ ] ✅ Secrets in environment variables (never hardcoded)
- [ ] ✅ HTTPS enforced for all OAuth endpoints
- [ ] ✅ 401/403 errors return proper OAuth error codes
- [ ] ✅ ChatGPT successfully connects via OAuth
- [ ] ✅ Claude.ai successfully connects via OAuth

---

### Phase 2 Success Criteria

- ✅ Stytch OAuth 2.1 integration deployed
- ✅ Metadata endpoints RFC-compliant and accessible
- ✅ All 4 security checks enforced (signature, aud, iss, exp)
- ✅ WWW-Authenticate headers properly formatted
- ✅ ChatGPT web connects and executes tools
- ✅ Claude.ai web connects and executes tools
- ✅ Health endpoint shows `"oauth_compliant": true`
- ✅ Documentation complete and accurate
- ✅ Claude Code still works (Bearer token fallback)

---

### Rollback Plan

If OAuth integration fails:

1. **Immediate**: Revert to Cloudflare Access JWT middleware (restore from archive)
2. **Restore**: Previous docker-compose.yml
3. **Restart**: `docker-compose down && docker-compose up -d`
4. **Verify**: Bearer token fallback works for Claude Code
5. **Debug**: Review Stytch logs and MCP client errors
6. **Iterate**: Fix issues, redeploy

---

## Phase 2F: Update Legacy Documentation (After MCP Operational)

**When**: After Phase 2 deployment succeeds and MCP is operational

### Section 2F.1: Review and Update STYTCH_SETUP_GUIDE.md (30 min)

- [ ] 2F.1.1 Update OAuth metadata endpoints section
  - **File**: `/Users/davidkellam/workspace/portfolio/docs/system/architecture/STYTCH_SETUP_GUIDE.md`
  - **Issue**: Lines 296-359 show proxying ASM and JWKS (outdated strategy)
  - **Fix**: Update to show only PRM endpoint implementation
  - **Acceptance**: Code examples match simplified strategy

- [ ] 2F.1.2 Add mandatory security validations to middleware code
  - **Issue**: Lines 232-291 missing aud/iss/exp validation
  - **Fix**: Add all 4 mandatory security checks to code example
  - **Fix**: Add RFC-compliant WWW-Authenticate header
  - **Acceptance**: Middleware code matches PHASE2_EXECUTION_GUIDE.md

- [ ] 2F.1.3 Update file paths throughout document
  - **Issue**: References `/home/user/professional-planning/service-builds/...`
  - **Fix**: Replace with `/Users/davidkellam/workspace/portfolio/integrations/...`
  - **Acceptance**: All paths are correct

- [ ] 2F.1.4 Add pre-implementation audit section
  - **Task**: Add Section 0: Pre-Implementation Audit before Section 1
  - **Content**: Check WWW-Authenticate header, routing order, current validation
  - **Acceptance**: Matches PHASE2_EXECUTION_GUIDE.md Section 1

- [ ] 2F.1.5 Emphasize routing order criticality
  - **Task**: Add warning about metadata routes before auth middleware
  - **Location**: Step 4.4 (Update http-server.ts)
  - **Acceptance**: Clear warning with correct/incorrect examples

### Section 2F.2: Review and Update STYTCH_TESTING_CHECKLIST.md (30 min)

- [ ] 2F.2.1 Remove obsolete metadata endpoint tests
  - **File**: `/Users/davidkellam/workspace/portfolio/docs/system/architecture/STYTCH_TESTING_CHECKLIST.md`
  - **Issue**: Lines 73-151 test ASM and JWKS endpoints (we don't host)
  - **Fix**: Remove Test 1 (ASM) and Test 3 (JWKS)
  - **Fix**: Keep only Test 2 (PRM)
  - **Acceptance**: Only tests PRM endpoint

- [ ] 2F.2.2 Add security validation tests
  - **Task**: Add new Section 3.5: Security Validation Tests
  - **Tests to add**:
    - Test aud claim validation (wrong audience rejected)
    - Test iss claim validation (wrong issuer rejected)
    - Test exp claim validation (expired token rejected)
    - Test WWW-Authenticate header format (resource_metadata_uri field)
  - **Acceptance**: All 4 security checks have test cases

- [ ] 2F.2.3 Add routing order test
  - **Task**: Add test verifying metadata accessible without auth
  - **Location**: Section 3 (OAuth Metadata Endpoints)
  - **Test**: `curl http://localhost:8080/.well-known/oauth-protected-resource` (no auth header)
  - **Acceptance**: Test confirms metadata public

- [ ] 2F.2.4 Update file paths
  - **Issue**: References `/home/david/services/...`
  - **Fix**: Replace with correct droplet path `/root/portfolio/integrations/...`
  - **Acceptance**: All paths match actual deployment

### Section 2F.3: Update last modified dates

- [ ] 2F.3.1 Update STYTCH_SETUP_GUIDE.md metadata
  - **Task**: Change `Last Updated: 2025-11-14` to current date
  - **Task**: Update version to `2.0` (major update)
  - **Acceptance**: Metadata reflects changes

- [ ] 2F.3.2 Update STYTCH_TESTING_CHECKLIST.md metadata
  - **Task**: Change `Last Updated: 2025-11-14` to current date
  - **Task**: Update version to `2.0`
  - **Acceptance**: Metadata reflects changes

---

## Phase 2G: Deprecate Legacy Cloudflare Access (Optional)

- [ ] 2G.1 Keep Bearer token fallback during transition
  - **Task**: Maintain Bearer token support alongside Stytch (for Claude Code)
  - **Acceptance**: Both auth methods work

- [ ] 2G.2 Document deprecation timeline
  - **Task**: Plan Cloudflare Access removal (after 30-day transition)
  - **Acceptance**: Clear timeline documented

---

## Phase 3: SOP Documentation & Template (Week 2-3)

### Section 3.1: OAuth SOP Document

- [ ] 3.1.1 Create OAUTH_SOP.md
  - **File**: `/docs/infrastructure/mcp/OAUTH_SOP.md`
  - **Sections**:
    1. Authentication Strategy (Cloudflare Access)
    2. Token Storage Options (decision matrix)
    3. Deployment Checklist for new MCPs
    4. Troubleshooting Guide
    5. Migration Guide (env → postgres → infisical)
    6. Security Best Practices
    7. Example: Complete Coda MCP implementation
  - **Acceptance**: Document is >2000 words, all sections complete

- [ ] 3.1.2 Add decision matrix
  - **Task**: Include pros/cons for each token storage option
  - **Task**: Include complexity/cost/security ratings
  - **Acceptance**: Matrix helps new MCP authors choose approach

- [ ] 3.1.3 Add deployment checklist
  - **Task**: Copy-paste checklist for new MCP deployments
  - **Acceptance**: Checklist has 15+ items, covers auth setup

### Section 3.2: Troubleshooting Runbook

- [ ] 3.2.1 Create OAUTH_TROUBLESHOOTING.md
  - **File**: `/docs/infrastructure/mcp/OAUTH_TROUBLESHOOTING.md`
  - **Issues**:
    1. JWT validation fails
    2. Token not found in postgres
    3. Encryption key mismatch
    4. Cloudflare Access misconfigured
    5. Docker network issues
  - **Acceptance**: Each issue has diagnostic commands and fixes

- [ ] 3.2.2 Add common error messages
  - **Task**: Collect actual error messages from implementation
  - **Acceptance**: Runbook includes real error output

### Section 3.3: MCP Deployment Template

- [ ] 3.3.1 Create template directory
  - **Location**: `/templates/mcp-server-template/`
  - **Structure**:
    ```
    ├── Dockerfile
    ├── docker-compose.yml
    ├── .env.example
    ├── src/
    │   ├── index.ts
    │   ├── config.ts
    │   ├── handlers/
    │   │   └── tools.ts
    │   └── middleware/
    │       └── auth.ts
    ├── scripts/
    │   ├── local-dev.sh
    │   ├── deploy-to-droplet.sh
    │   └── test.sh
    ├── README.md
    ├── package.json
    └── tsconfig.json
    ```
  - **Acceptance**: Template is fully functional and commented

- [ ] 3.3.2 Create Dockerfile template
  - **Task**: Multi-stage build, Node.js, includes auth middleware
  - **Acceptance**: Dockerfile builds without errors

- [ ] 3.3.3 Create docker-compose.yml template
  - **Task**: Includes networking, health checks, Cloudflare labels
  - **Acceptance**: Compose file uses standard patterns from Coda MCP

- [ ] 3.3.4 Create deployment scripts
  - **File**: `scripts/deploy-to-droplet.sh`
  - **Task**: SCP files, build, restart container
  - **Acceptance**: Script is idempotent and includes error handling

- [ ] 3.3.5 Create README.md for template
  - **Task**: Instructions for using template as starting point
  - **Acceptance**: New MCP authors can follow guide in <30 minutes

---

## Phase 4: Documentation Updates & Audit (Week 3)

### Section 4.1: Update MCP_SERVER_CATALOG.md

- [ ] 4.1.1 Add authentication columns
  - **File**: `/docs/architecture/integrations/mcp/MCP_SERVER_CATALOG.md`
  - **Columns**:
    - Service Name
    - Status (Deployed/Planned)
    - Location (Workers/Droplet)
    - Auth Method (Cloudflare Access/OAuth/None)
    - Token Storage (Env/PostgreSQL/KV)
    - SOP Link
  - **Acceptance**: Table includes all current MCPs

- [ ] 4.1.2 Update each MCP entry
  - **Task**: Add auth details for:
    - Coda (Cloudflare Access + Postgres)
    - GitHub Worker (OAuth + KV)
    - Memory Worker (No auth + Durable Objects)
    - Context7 Worker (No auth + KV)
  - **Acceptance**: Each entry has complete auth info

- [ ] 4.1.3 Add "New MCP Template" row
  - **Task**: Link to `/templates/mcp-server-template/`
  - **Acceptance**: New authors know where to start

- [ ] 4.1.4 Add "Last Updated" timestamp
  - **Acceptance**: Document shows update date

### Section 4.2: Find & Fix Orphaned Docs

- [ ] 4.2.1 Search for deprecated references
  - **Command**: `grep -r "phase_1_mcp\|deprecated\|old_setup" /docs /archive --include="*.md" | head -20`
  - **Task**: Identify docs referencing old MCP architecture
  - **Acceptance**: List of 5-10 files identified

- [ ] 4.2.2 Review each orphaned doc
  - **Task**: For each file, determine:
    1. Is content still relevant? (Update or archive)
    2. Does it break links? (Fix or remove)
    3. Does it conflict with SOP? (Update to reference SOP)
  - **Acceptance**: Decision made for each file

- [ ] 4.2.3 Update relevant docs
  - **Task**: Add header to docs that are outdated:
    ```markdown
    > ⚠️ **UPDATED** (2025-11-08)
    > This document describes legacy setup.
    > See [MCP OAuth SOP](/docs/infrastructure/mcp/OAUTH_SOP.md) for current approach.
    ```
  - **Acceptance**: Updated docs link to new SOP

- [ ] 4.2.4 Archive obsolete docs
  - **Task**: Move obsolete docs to `/archive/[date]-[filename].md`
  - **Acceptance**: Original location has deprecation notice + link to archive

- [ ] 4.2.5 Create DEPRECATION_NOTICES.md
  - **File**: `/docs/DEPRECATION_NOTICES.md`
  - **Task**: Index of all deprecated docs with links
  - **Task**: Explain why each was deprecated
  - **Acceptance**: Single source of truth for orphaned docs

### Section 4.3: Update Architecture Docs

- [ ] 4.3.1 Update ARCHITECTURE.md
  - **File**: `/docs/architecture/ARCHITECTURE.md`
  - **Task**: Add "MCP Authentication" section
  - **Task**: Include decision diagram
  - **Task**: Link to SOP for details
  - **Acceptance**: Diagram shows Cloudflare Access → Token Storage flow

- [ ] 4.3.2 Update CURRENT_STATE_v1.md
  - **File**: `/CURRENT_STATE_v1.md`
  - **Task**: Add section "Phase 2F: MCP OAuth Implementation"
  - **Task**: Document:
    - Current OAuth strategy
    - Token storage approach
    - Coda MCP status (working)
    - Middleware package info
    - Links to SOP and template
  - **Acceptance**: Phase 2F section complete

### Section 4.4: Create Documentation Index

- [ ] 4.4.1 Create MCP docs index
  - **File**: `/docs/infrastructure/mcp/README.md`
  - **Task**: Index all MCP-related docs:
    - OAUTH_SOP.md
    - OAUTH_TROUBLESHOOTING.md
    - MCP_SERVER_CATALOG.md
    - Template guide
    - Infisical integration (Phase 3)
  - **Acceptance**: Single entry point for MCP authors

---

## Validation Checklist

### Code Quality
- [ ] All Phase 1 code passes linting (`npm run lint`)
- [ ] All Phase 2 code has >90% test coverage
- [ ] No hardcoded tokens or secrets in code
- [ ] Encryption key properly managed (env var)

### Testing
- [ ] [ ] Unit tests: 95%+ coverage
- [ ] [ ] Integration tests: All happy paths + error cases
- [ ] [ ] Manual testing: All acceptance criteria met
- [ ] [ ] Security testing: No plaintext tokens in logs/memory

### Documentation
- [ ] [ ] SOP document complete and accurate
- [ ] [ ] Examples are copy-paste ready
- [ ] [ ] All links functional
- [ ] [ ] Orphaned docs processed

### Deployment
- [ ] [ ] Coda MCP accessible via HTTPS
- [ ] [ ] Authentication working end-to-end
- [ ] [ ] Health checks passing
- [ ] [ ] No errors in docker logs

---

**Total Estimated Time**: 13 hours engineering + 4 hours documentation
**Parallel Work**: Sections 4.2 & 4.3 can run while Phase 2 ongoing
