---
entity: index
level: strategic
zone: internal
version: v01
tags: [phase-1, master-index, coda-mcp, http-native, implementation]
source_path: /planning/PHASE_1_MASTER_INDEX.md
date: 2025-11-01
status: master-reference
---

# Phase 1 Master Index — Complete Reference

**Phase**: Phase 1 (HTTP-Native Coda MCP)
**Duration**: 6 days (Days 1-6)
**Status**: Day 1 ✅ Complete | Days 2-6 Ready to Execute
**Owner**: David Kellam

---

## Quick Navigation

### 📋 Overview & Planning
- **[phase_1_mcp_http_native_coda.md](./phase_1_mcp_http_native_coda.md)** — Original 6-day plan with daily breakdown
- **[PHASE_1_MASTER_INDEX.md](./PHASE_1_MASTER_INDEX.md)** ← You are here

### 🔍 Decision & Analysis
- **[../agents/decisions/2025-11-01_coda-http-native-migration_v01.md](../agents/decisions/2025-11-01_coda-http-native-migration_v01.md)** — Architecture decision (HTTP-native vs mcp-proxy)
- **[../agents/context/coda-mcp-day1-audit_v01.md](../agents/context/coda-mcp-day1-audit_v01.md)** — Detailed codebase audit and status

### 🚀 Implementation Guides
- **[phase_1_day2_implementation_guide.md](./phase_1_day2_implementation_guide.md)** — Step-by-step Days 2-3 with code samples
- **[phase_1_completion_handoff_template.md](./phase_1_completion_handoff_template.md)** — Template for end-of-phase summary

### 📊 Session Summaries
- **[../sessions/session_2025_11_01_compact_summary.md](../sessions/session_2025_11_01_compact_summary.md)** — First session (research + planning)
- **[../sessions/session_2025_11_01_phase1_day1_summary.md](../sessions/session_2025_11_01_phase1_day1_summary.md)** — This session (Day 1 audit)

### 📈 Future Phases
- **[tier_1_mcp_candidates_analysis.md](./tier_1_mcp_candidates_analysis.md)** — Phase 2+ MCP evaluation
- **[context_engineering_research_v01.md](./context_engineering_research_v01.md)** — Foundational research

---

## Day-by-Day Status

### ✅ Day 1: Repository Setup & Architecture Planning
**Status**: COMPLETE

**Tasks Completed**:
1. ✅ Explored coda-enhanced-mcp source code
2. ✅ Located existing http-server.ts (326 lines, 80% complete)
3. ✅ Analyzed architecture options (Option A: HTTP-native vs Option B: keep mcp-proxy)
4. ✅ Made decision: Proceed with HTTP-native migration
5. ✅ Created audit documentation
6. ✅ Identified 4 tasks (A-D) for Days 2-6

**Deliverables**:
- Architecture decision document
- Day 1 audit document
- Implementation path (Tasks A-D)
- Session summary

**Key Finding**: http-server.ts is 80% complete! Only needs token estimation, memory hooks, OAuth, and Docker updates.

---

### 🎯 Days 2-3: HTTP-Native Enhancement & OAuth (6-10 hours)
**Status**: READY TO EXECUTE

**Tasks** (in order):
- [ ] **Task A**: Token estimation framework (2-3 hours)
  - Create token counter utility
  - Add response wrapper with metadata
  - Test all endpoints locally

- [ ] **Task B**: Memory hook callbacks (1-2 hours)
  - Implement MemoryHooks interface
  - Add hook invocation points

- [ ] **Task C**: OAuth integration (2-3 hours)
  - Add Cloudflare Access OIDC endpoints
  - Integrate token validation

**Reference**: [phase_1_day2_implementation_guide.md](./phase_1_day2_implementation_guide.md)

**Build & Test**:
```bash
cd /integrations/mcp/servers/coda
pnpm install && pnpm build
node dist/http-server.js
curl http://localhost:8080/health
```

---

### 🐳 Days 4-5: Docker Config & Droplet Deployment (2-3 hours)
**Status**: READY TO EXECUTE

**Tasks**:
- [ ] **Task D**: Dockerfile update (1 hour)
  - Remove mcp-proxy wrapper
  - Update entry point: `node dist/http-server.js`
  - Test build locally

- [ ] Deploy to droplet (1-2 hours)
  - Build on droplet
  - Test endpoints
  - Verify session persistence

**Reference**: Original phase_1_mcp_http_native_coda.md Days 5-6

---

### 📚 Day 6: Documentation & Monitoring (2-3 hours)
**Status**: READY TO EXECUTE

**Tasks**:
- [ ] Create CLAUDE.md (agent guidance)
- [ ] Create examples folder (test scripts)
- [ ] Configure Uptime Robot (5 min)
- [ ] Setup health check dashboard

**Reference**: Original phase_1_mcp_http_native_coda.md Day 5

---

## File Structure After Completion

```
/integrations/mcp/servers/coda/
├── Dockerfile (updated: HTTP-native entry)
├── package.json
├── tsconfig.json
├── pnpm-lock.yaml
├── src/
│   ├── index.ts (stdio entry - unchanged)
│   ├── server.ts (tool definitions - unchanged)
│   ├── config.ts (unchanged)
│   ├── http-server.ts (ENHANCED - main work)
│   ├── utils/
│   │   └── token-counter.ts (NEW)
│   ├── middleware/
│   │   └── response-wrapper.ts (NEW)
│   ├── types/
│   │   └── memory-hooks.ts (NEW)
│   └── client/ (unchanged)
├── CLAUDE.md (NEW)
├── examples/
│   ├── oauth_flow.md (NEW)
│   ├── test_health.sh (NEW)
│   ├── test_mcp.sh (NEW)
│   ├── test_session.sh (NEW)
│   └── token_estimation.md (NEW)
└── DEPLOYMENT.md (updated)
```

---

## Key Architectural Changes

### Before (mcp-proxy wrapper)
```
MCP Client
    ↓
nginx-proxy (reverse proxy)
    ↓
Python mcp-proxy wrapper
    ↓ (stdio)
Node.js Coda MCP (stdio transport)
    ↓
Coda API
```

### After (HTTP-native)
```
MCP Client
    ↓ (HTTPS via Cloudflare Tunnel)
Express.js HTTP Server (http-server.ts)
    ↓
Bearer token validation
    ↓
StreamableHTTPServerTransport (MCP spec)
    ↓
Node.js Coda MCP (no change)
    ↓
Coda API
```

**Benefits**:
- ✅ Token estimation (enables context budgeting)
- ✅ Memory hooks (enables persistent learning)
- ✅ OAuth support (Cloudflare Access OIDC)
- ✅ Better performance (no Python wrapper)
- ✅ Simpler deployment (no mcp-proxy dependency)

---

## Success Criteria

### Phase 1 Definition of Done

All 6 of the following must be ✅:

- [ ] Coda MCP responds at `https://coda.bestviable.com/mcp`
- [ ] OAuth/Bearer token validation working
- [ ] Tools return token-efficient responses with metadata
  - metadata.tokenEstimate present
  - metadata.summary present
  - metadata.timestamp present
- [ ] Session state tracking working (Mcp-Session-Id reuse)
- [ ] CLAUDE.md and examples created
- [ ] Monitoring active (Uptime Robot + health dashboard)

---

## Troubleshooting Reference

### Build Fails
```bash
# Clean and rebuild
rm -rf dist/ node_modules/ pnpm-lock.yaml
pnpm install
pnpm build
```

### Port 8080 Already in Use
```bash
# Find what's using 8080
lsof -i :8080

# Use different port
PORT=8081 node dist/http-server.js
```

### HTTP Server Fails to Start
```bash
# Check logs
node dist/http-server.js 2>&1 | head -50

# Verify dependencies
pnpm list @modelcontextprotocol/sdk
pnpm list express
```

### Bearer Token Issues
```bash
# Test with valid token
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer your-coda-api-key" \
  -H "Mcp-Session-Id: test" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Should NOT return 401
```

---

## Essential Commands (Copy-Paste Ready)

### Development
```bash
# Build
cd /integrations/mcp/servers/coda && pnpm build

# Run locally
node dist/http-server.js

# Test health
curl http://localhost:8080/health

# Test token estimation
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer [token]" \
  -H "Mcp-Session-Id: test-1" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Deployment
```bash
# Build Docker image
docker build -t coda-mcp:latest .

# Run container
docker run -p 8080:8080 \
  -e PORT=8080 \
  coda-mcp:latest

# Deploy to droplet (from droplet)
cd /root/portfolio/integrations/mcp/servers/coda
docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml up -d coda-mcp
```

---

## Document Reading Order

**For Next Session (Days 2-3)**:
1. Read this file (PHASE_1_MASTER_INDEX.md) ← Quick orientation
2. Read `/sessions/session_2025_11_01_phase1_day1_summary.md` ← Context
3. Read `/planning/phase_1_day2_implementation_guide.md` ← Implementation steps
4. Begin Task A (token estimation)

**For Understanding Architecture**:
1. Read `/agents/decisions/2025-11-01_coda-http-native-migration_v01.md` ← Why HTTP-native?
2. Read `/agents/context/coda-mcp-day1-audit_v01.md` ← What's complete?
3. Read `/planning/tier_1_mcp_candidates_analysis.md` ← Future MCPs (GitHub, n8n, etc.)

---

## Phase 1 Timeline Summary

| Day | Status | Duration | Key Deliverable |
|-----|--------|----------|-----------------|
| 1 | ✅ DONE | 3-4 hrs | Architecture decision + audit |
| 2-3 | 🎯 READY | 6-10 hrs | Token estimation + OAuth |
| 4-5 | 🎯 READY | 2-3 hrs | Docker deploy |
| 6 | 🎯 READY | 2-3 hrs | Documentation + monitoring |
| **Total** | **50%** | **15-20 hrs** | **HTTP-native Coda MCP live** |

---

## Context Preservation

**If you need to pause**:
- Commit current work to git
- Read `/sessions/session_2025_11_01_phase1_day1_summary.md` for quick context
- Continue from todo list

**If this is next session**:
- Start with PHASE_1_MASTER_INDEX.md (this file)
- Jump to relevant day/task section
- All reference docs are linked

---

## Questions? Reference Documents

- "What's the architecture decision?" → Read decision document (agents/decisions/)
- "What code do I need to write?" → Read day2_implementation_guide.md
- "What's the overall plan?" → Read phase_1_mcp_http_native_coda.md
- "What was discovered?" → Read coda-mcp-day1-audit_v01.md
- "How do I test?" → Read phase_1_day2_implementation_guide.md (Testing Commands section)
- "What's Phase 2?" → Read tier_1_mcp_candidates_analysis.md

---

**Status**: ✅ Master Index Complete
**Last Updated**: 2025-11-01
**Ready**: Yes
**Next Action**: Begin Task A (Days 2-3)
