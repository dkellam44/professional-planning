# Phase 1 Quick Start (After Session 2025-11-01)

**Status**: Ready to execute Days 2-3
**Duration**: 6-10 hours
**Difficulty**: Medium

## 5-Minute Orientation

1. Read this file (you're reading it!)
2. Open `/planning/PHASE_1_MASTER_INDEX.md` (navigation hub)
3. Skim `/planning/phase_1_day2_implementation_guide.md` (what you'll build)
4. Start with Task A (section "Step-by-Step Implementation")

## What You'll Build

```
POST /mcp request
    ↓
Express.js HTTP Server
    ↓
Token Estimation ← NEW
    ↓
Response Wrapper with Metadata ← NEW
    ├─ tokenEstimate: number (tokens used)
    ├─ summary: string (compressed)
    ├─ fullContentPath: string (on-demand)
    └─ success: boolean
    ↓
Send to Client
```

## Day 2-3 Tasks

| Task | Effort | What You Do |
|------|--------|-----------|
| A | 2-3 hrs | Token estimation + response wrapper |
| B | 1-2 hrs | Memory hook callbacks |
| C | 2-3 hrs | OAuth integration |
| D | 30 min | Update Dockerfile |
| Test | 1 hr | Local testing + git commit |

**Total**: 6-10 hours

## Files You'll Modify

- `/integrations/mcp/servers/coda/src/http-server.ts` (main file)
- `/integrations/mcp/servers/coda/Dockerfile` (entry point update)

## Files You'll Create

- `src/utils/token-counter.ts` (new)
- `src/middleware/response-wrapper.ts` (new)
- `src/types/memory-hooks.ts` (new)

## Build & Test

```bash
cd /integrations/mcp/servers/coda
pnpm build
node dist/http-server.js
curl http://localhost:8080/health
```

## Key Documents

| File | Purpose | Read Time |
|------|---------|-----------|
| PHASE_1_MASTER_INDEX.md | Navigation hub | 5 min |
| phase_1_day2_implementation_guide.md | Step-by-step with code | 15 min |
| agents/context/coda-mcp-day1-audit_v01.md | What's complete | 10 min |
| agents/decisions/2025-11-01_coda-http-native-migration_v01.md | Why HTTP-native? | 5 min |

## Success Criteria

- [ ] `curl http://localhost:8080/health` returns 200 OK
- [ ] Response includes `metadata.tokenEstimate`
- [ ] Response includes `metadata.summary`
- [ ] Session reuse works (Mcp-Session-Id header)
- [ ] All endpoints tested locally
- [ ] Code committed to git

## Rollback If Needed

If anything breaks:
1. Keep old Dockerfile with mcp-proxy
2. Can revert to `CMD ["mcp-proxy", "--host", "0.0.0.0", "--port", "8080", "--", "node", "dist/index.js"]`
3. Takes 5 minutes to recover

## Questions?

- "Why HTTP-native?" → Read agents/decisions/
- "How do I implement?" → Read phase_1_day2_implementation_guide.md
- "What's the architecture?" → Read PHASE_1_MASTER_INDEX.md
- "What's already done?" → Read agents/context/coda-mcp-day1-audit_v01.md

## Next Steps

1. Read `/planning/phase_1_day2_implementation_guide.md` (20 min)
2. Open `/integrations/mcp/servers/coda/src/src/http-server.ts` in editor
3. Start Task A, Step 1: Create token counter utility
4. Follow the code samples provided

## Commits Needed (Days 2-3)

After each task:
```bash
git add src/
git commit -m "Enhance: Coda MCP HTTP-native server - Task [A/B/C/D]"
```

Final push after all tests pass.

---

**Start Time**: Now!
**Estimated Completion**: 8-12 hours (next 1-2 days)
**Status**: Ready ✅
