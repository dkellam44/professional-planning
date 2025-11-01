---
entity: architecture-decision
level: strategic
zone: internal
version: v01
tags: [mcp, coda, http-native, migration, phase-1]
source_path: /agents/decisions/2025-11-01_coda-http-native-migration_v01.md
date: 2025-11-01
status: decision-required
---

# Architecture Decision: Coda MCP HTTP-Native Migration

## Current State (As of 2025-11-01)

### What's Deployed
- **Transport**: stdio MCP wrapped via mcp-proxy (Python wrapper)
- **Endpoint**: https://coda.bestviable.com/sse (working, 200 OK)
- **Pattern**: SyncBricks architecture (Cloudflare Tunnel → nginx-proxy → container)
- **Tools**: 34 Coda tools available
- **Status**: Production-ready for current use

### What Exists in Codebase
- **File**: `/src/src/http-server.ts` (10KB, ~250 lines)
- **Features Implemented**:
  - Express.js HTTP server
  - StreamableHTTPServerTransport integration
  - Session management via `Mcp-Session-Id` header
  - Bearer token validation middleware
  - Health check endpoint (`/health`)
  - POST/GET/DELETE MCP endpoints with proper error handling
  - CORS configuration
  - Origin validation (security)
  - Logging infrastructure
  - Proper JSON-RPC error responses

### Gap Analysis

**Missing (Phase 1 Architecture Goals)**:
1. Token estimation framework (metadata.tokenEstimate)
2. Summary field (compressed response content)
3. fullContentPath (progressive disclosure)
4. Memory hook callbacks (persistent learning layer)
5. Cloudflare Access OAuth integration
6. Updated Dockerfile/docker-compose to use http-server entry point

---

## Decision: Which Path?

### Option A: Migrate to HTTP-Native (Recommended)
**Status**: HTTP server already exists, partially complete

**Advantages**:
- ✅ Matches Phase 1 architecture plan exactly
- ✅ Enables token estimation and memory hooks
- ✅ Better performance (no Python wrapper overhead)
- ✅ More secure (direct Express.js, not mcp-proxy)
- ✅ Code is already 80% implemented
- ✅ Easier to test locally
- ✅ Enables OAuth integration directly

**Effort**:
- Complete/audit http-server.ts: 1-2 hours
- Add token estimation: 2-3 hours
- Add memory hooks: 1-2 hours
- Update Dockerfile: 30 minutes
- Test + deploy: 1-2 hours
- **Total**: 6-10 hours (fits in Days 2-3 plan)

**Risk**: Must ensure session management and error handling are production-ready

---

### Option B: Keep mcp-proxy Wrapper
**Status**: Currently deployed and working

**Advantages**:
- ✅ Already deployed and tested
- ✅ Zero risk to current operation
- ✅ Python wrapper handles stdio → HTTP translation

**Disadvantages**:
- ❌ Can't add token estimation easily
- ❌ Can't add memory hooks
- ❌ Extra layer (Python → Node) adds latency
- ❌ Blocks context engineering goals
- ❌ Won't support OAuth integration
- ❌ Less maintainable long-term

**Effort**: 0 (already done)

**Risk**: Staying on suboptimal architecture

---

## Recommendation

**→ Option A: Migrate to HTTP-Native**

**Rationale**:
1. Code is already written and integrated
2. Enables all Phase 1 architecture goals
3. Time investment fits in current sprint
4. Risk is manageable (can rollback to mcp-proxy if needed)
5. Foundation for future MCPs (GitHub, Memory, etc.)

**Implementation Plan**:

### Task 1: Audit http-server.ts (2 hours)
- [ ] Review all middleware
- [ ] Verify session lifecycle
- [ ] Test error handling
- [ ] Document current capabilities
- [ ] Identify gaps for token estimation

### Task 2: Add Token Estimation (3 hours)
- [ ] Create token counter utility
- [ ] Add to all response paths
- [ ] Conservative estimates (round up)
- [ ] Track in metadata

### Task 3: Add Memory Hooks (2 hours)
- [ ] Implement MemoryHooks interface
- [ ] Call onToolCall before execution
- [ ] Call onResponse after execution
- [ ] Call onSessionEnd on cleanup
- [ ] Placeholder implementation (ready for Phase 2 persistent layer)

### Task 4: Update Docker Config (1 hour)
- [ ] Modify Dockerfile to use http-server.ts entry point
- [ ] Update CMD to `node dist/http-server.js`
- [ ] Update EXPOSE to port 8080
- [ ] Test build locally

### Task 5: OAuth Integration (2 hours)
- [ ] Add Cloudflare Access OIDC configuration
- [ ] Integrate OAuth validation middleware
- [ ] Test locally with Bearer token
- [ ] Document OAuth endpoints

### Task 6: Deploy & Test (2 hours)
- [ ] Build Docker image
- [ ] Test on droplet
- [ ] Verify health endpoint
- [ ] Verify session persistence
- [ ] Verify error handling
- [ ] Configure Uptime Robot

---

## Phase 1 Timeline Impact

**Current Plan**: Days 1-6
- Day 1: Fork & architecture ← **This decision**
- Days 2-3: HTTP implementation
- Day 4: OAuth
- Day 5: Documentation
- Day 6: Deploy

**Adjusted Plan**:
- Day 1: ✅ Complete (http-server.ts audit, add token estimation)
- Days 2-3: Finish enhancements + OAuth
- Day 4: Documentation (CLAUDE.md)
- Day 5: Deploy to droplet
- Day 6: Monitoring + cleanup

**Net Effect**: No timeline slip, actually **ahead** because http-server is partially done

---

## Rollback Strategy

If http-server.ts implementation causes issues:
1. Keep mcp-proxy Dockerfile as backup
2. Test all endpoints before deploying
3. Can revert to `CMD ["mcp-proxy", "--host", "0.0.0.0", "--port", "8080", "--", "node", "dist/index.js"]` in 5 minutes

---

## Next Steps

1. **Approve Decision**: Proceed with HTTP-Native migration
2. **Audit http-server.ts**: Document what's complete vs. incomplete
3. **Begin Day 1 enhancement work**
4. **Track changes in git**

---

**Status**: Ready for approval
**Owner**: David Kellam
**Created**: 2025-11-01
**Decision Made**: TBD
