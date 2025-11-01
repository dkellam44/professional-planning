---
entity: audit
level: execution
zone: internal
version: v01
tags: [mcp, coda, day-1, audit, http-native, architecture]
source_path: /agents/context/coda-mcp-day1-audit_v01.md
date: 2025-11-01
---

# Day 1 Audit: Coda MCP HTTP-Native Implementation Status

**Audit Date**: 2025-11-01
**Current State**: 80% complete
**Path Forward**: Complete enhancements + deploy

---

## Current Deployment (mcp-proxy)

**Live Endpoint**: https://coda.bestviable.com/sse (HTTP 200 OK)
**Transport**: stdio wrapped via Python mcp-proxy
**Tools Available**: 34 (all document, page, table, row, formula, control operations)
**Status**: Production-ready

**Advantages**:
- Zero risk
- Proven reliability
- Simple wrapper deployment

**Disadvantages**:
- Extra layer (Python) adds latency
- Can't add token estimation
- Blocks context engineering goals
- No OAuth integration possible

---

## HTTP-Native Implementation (In Codebase)

**Location**: `/src/src/http-server.ts` (326 lines)
**Status**: Core implementation complete, enhancements needed

### ✅ What's Implemented (Complete)

**Middleware Stack** (lines 16-80):
- Express.js with JSON/CORS
- CORS headers (allows remote access)
- Request logging
- Origin validation for dev/prod
- Bearer token extraction

**Health Check** (lines 85-92):
```
GET /health → { status: "ok", service, version, timestamp }
```
✅ Full implementation

**Session Management** (lines 95-187):
- In-memory session storage (Map)
- Per-request session lookup via `Mcp-Session-Id` header
- Session initialization via UUID generator
- Session lifecycle callbacks (onsessioninitialized, onsessionclosed)
- Graceful handling of missing/invalid sessions

✅ Full implementation (matches MCP spec)

**Bearer Token Validation** (lines 104-139):
- Extract token from `Authorization: Bearer [token]` header
- Validate presence and format
- Configure Coda API client with token
- Return 401 if missing/invalid

✅ Full implementation

**MCP Endpoints** (lines 145-280):
- **POST /mcp**: Handles client requests
  - Creates new session if needed
  - Reuses existing sessions via header
  - Delegates to StreamableHTTPServerTransport
  - Proper error handling with JSON-RPC responses

- **GET /mcp**: Handles SSE stream
  - Requires valid `Mcp-Session-Id` header
  - Delegates stream handling to transport
  - Returns proper error if session invalid

- **DELETE /mcp**: Terminates sessions
  - Validates session ID
  - Closes transport
  - Deletes session from memory
  - Logs termination

✅ All three endpoints fully implemented

**Error Handling** (lines 286-293):
- Express error middleware
- Catches unhandled errors
- Returns 500 with request ID
- Prevents server crashes

✅ Full implementation

**Server Startup** (lines 299-326):
- Listens on PORT (default 8080)
- Startup banner with endpoint info
- Graceful shutdown handlers (SIGINT, SIGTERM)
- Cleanup on termination

✅ Full implementation

---

### ❌ What's Missing (Enhancements Needed)

**1. Token Estimation Framework** (Priority: HIGH)
- [ ] Create token counter utility
- [ ] Add `tokenEstimate` to all response metadata
- [ ] Conservative estimation (round up)
- [ ] Track token consumption per session
- **Where**: Add to POST /mcp response wrapper
- **Effort**: 2-3 hours
- **Block**: Context engineering goals

**2. Response Wrapper with Metadata** (Priority: HIGH)
- [ ] Wrap all tool responses with:
  ```typescript
  {
    success: boolean,
    data: <actual response>,
    metadata: {
      timestamp: string,
      resourceId: string,
      source: "coda",
      tokenEstimate: number,
      summary: string  // compressed version
    },
    fullContentPath?: string  // on-demand retrieval
  }
  ```
- **Where**: Response preprocessing in POST /mcp
- **Effort**: 2-3 hours
- **Block**: Progressive disclosure pattern

**3. Memory Hook Callbacks** (Priority: MEDIUM)
- [ ] Implement MemoryHooks interface:
  ```typescript
  interface MemoryHooks {
    onToolCall(sessionId, tool, params): Promise<void>
    onResponse(sessionId, tool, response): Promise<void>
    onSessionEnd(sessionId): Promise<void>
  }
  ```
- [ ] Call hooks at appropriate lifecycle points
- [ ] Placeholder implementation (Phase 2 persistence layer)
- **Where**: Intercept points in POST/DELETE handlers
- **Effort**: 1-2 hours
- **Block**: Persistent memory integration

**4. OAuth Integration** (Priority: HIGH)
- [ ] Add Cloudflare Access OIDC endpoints
  - `/.well-known/oauth-authorization-server`
  - `/.well-known/oauth-protected-resource`
- [ ] OAuth validation middleware
- [ ] Token verification
- **Where**: New middleware before /mcp routes
- **Effort**: 2-3 hours (depends on Cloudflare setup)
- **Block**: Access control

**5. Dockerfile Update** (Priority: HIGH)
- [ ] Change entry point from stdio to http-server
- [ ] Update CMD: `node dist/http-server.js`
- [ ] Add EXPOSE 8080
- [ ] Remove mcp-proxy dependency
- **Current**: Uses mcp-proxy wrapper
- **Effort**: 30 minutes
- **Block**: Deployment

---

## Architecture Comparison

| Feature | mcp-proxy | HTTP-Native |
|---------|-----------|-------------|
| Transport | stdio → HTTP wrapper | Native HTTP |
| Latency | Higher (extra layer) | Lower |
| Token Estimation | ❌ Not possible | ✅ Built-in |
| Memory Hooks | ❌ Not possible | ✅ Integrated |
| OAuth | ❌ Can't add | ✅ Direct integration |
| Maintenance | ❌ Depends on wrapper | ✅ Direct control |
| Session Tracking | ❌ Via wrapper | ✅ Direct |
| Error Handling | ❌ Limited | ✅ Complete |
| Performance | ⚠️ Medium | ✅ High |

---

## Day 1 Task Breakdown

**Current Time Estimate**: 6-10 hours to complete all enhancements

### Task A: Finalize http-server.ts (2-3 hours)
- [ ] Add token counter utility
- [ ] Wrap tool responses with metadata
- [ ] Add summary field to responses
- [ ] Implement fullContentPath logic
- [ ] Add memory hook callback points
- [ ] Test all endpoints locally

**Deliverable**: Enhanced http-server.ts ready for deployment

### Task B: Add OAuth Configuration (2-3 hours)
- [ ] Create Cloudflare Access OIDC setup
- [ ] Add OAuth discovery endpoints
- [ ] Integrate token validation
- [ ] Test locally with Bearer token

**Deliverable**: OAuth validation working

### Task C: Update Docker Configuration (1 hour)
- [ ] Update Dockerfile (remove mcp-proxy)
- [ ] Update docker-compose.production.yml (if needed)
- [ ] Test build locally

**Deliverable**: Docker image builds successfully

### Task D: Deploy and Verify (2 hours)
- [ ] Build on droplet
- [ ] Test /health endpoint
- [ ] Test /mcp endpoints with Bearer token
- [ ] Verify session persistence
- [ ] Check error handling
- [ ] Monitor logs

**Deliverable**: Live on https://coda.bestviable.com/mcp (HTTP-native)

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| http-server.ts has bugs | Medium | High | Keep mcp-proxy Dockerfile as rollback |
| Session management fails | Low | High | Local testing before deploy |
| OAuth config wrong | Medium | Medium | Test locally first |
| Performance degrades | Low | Medium | Monitor endpoint latency |

**Rollback Plan**: If deployment fails, revert to mcp-proxy in 5 minutes using old Dockerfile

---

## Decision

**Recommendation**: ✅ Proceed with HTTP-Native migration

**Rationale**:
1. Core implementation already exists (326 lines, 80% complete)
2. Enables Phase 1 architecture goals (token estimation, memory hooks)
3. Fits within 6-10 hour Day 1 window
4. Rollback path available if needed
5. Foundation for future MCPs

**Next Action**: Implement enhancements Task A-D

---

## Code Quality Notes

**Strengths**:
- Well-structured middleware pipeline
- Proper error handling
- Clear logging
- Security considerations (origin validation)
- Follows MCP spec (StreamableHTTPServerTransport)
- Graceful shutdown handling

**Improvements Needed**:
- Add response wrapper with metadata
- Add token estimation
- Add memory hooks
- Add OAuth integration

**Not Issues**:
- Session memory doesn't need cleanup (can grow if sessions leak)
  - Mitigation: Add TTL for inactive sessions in Phase 2
  - Impact: Low for single user
  - Won't affect Phase 1 deployment

---

**Status**: Ready to begin Task A
**Owner**: David Kellam
**Timeline**: Day 1 (complete today)
**Next Review**: After Task D (deployment verification)
