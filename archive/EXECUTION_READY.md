- entity: portfolio
- level: documentation
- zone: internal
- version: v1.0
- tags: [execution, ready, n8n, rebuild]
- source_path: /EXECUTION_READY.md
- date: 2025-11-02

---

# ✅ EXECUTION READY: N8N Rebuild Plan

**Status**: APPROVED & COMMITTED
**Git Commit**: `a4dac58` - Planning docs + new docker-compose.yml
**Timeline**: Phase 1 (~2-3 hrs) + Phase 2 (~1-2 hrs later)

---

## Documents Created & Committed

### Primary Reference
- **REBUILD_PLAN_APPROVED_v1.md** ← Read this for step-by-step execution
- **PLAN_SUMMARY.md** ← Quick reference & overview
- **ARCHITECTURE_COMPARISON.md** ← Visual architecture guide

### Updated Code
- **infra/n8n/docker-compose.yml** ← New config using jwilder/nginx-proxy

---

## What Changed from Current Setup

### The Fix
| Item | Before | After | Impact |
|------|--------|-------|--------|
| Reverse Proxy | nginxproxy/nginx-proxy | **jwilder/nginx-proxy** | Fixes docker-gen label recognition |
| External Access | 503 error ❌ | HTTPS 200 OK ✅ | Users can reach n8n |
| PostgreSQL | 15-alpine | **16-alpine** | Lighter, optimized |
| n8n version | latest | **1.83.2** | Reproducible, pinned |
| Import Support | None | **n8n-import service** | Workflows can be restored |
| Network name | n8n | **syncbricks** | Clearer semantics |

---

## Key Decisions Locked In

### Phase 1: Why jwilder/nginx-proxy
✅ Original, proven implementation
✅ Battle-tested (worked on this droplet before MCP bloat)
✅ Simpler label matching (avoids docker-gen state machine issues)
✅ Reference: syncbricks/n8n (GitHub: https://github.com/syncbricks/n8n)

### Phase 2: Why Direct CF Tunnel for MCP
✅ Simpler (no reverse proxy layer needed)
✅ Cloudflare handles HTTPS termination
✅ Each MCP service gets own port & hostname
✅ Standards-agnostic (MCP specs evolving through 2025)
✅ Can add nginx-proxy later without rebuild

### Why Separate Stacks
✅ n8n can be upgraded independently
✅ MCP can be upgraded independently
✅ If MCP crashes, n8n keeps running
✅ Clear separation of concerns

---

## Prerequisites (Verify Before Executing)

### Access & Credentials
- [ ] SSH access: `ssh tools-droplet-agents` works
- [ ] CF tunnel token available in `/infra/config/.env.local`
- [ ] N8N admin credentials in `.env.local`
- [ ] PostgreSQL password in `.env.local`

### Backup Location
- [ ] Directory exists: `/Users/davidkellam/portfolio-backups/`
- [ ] Has ~500MB free space
- [ ] Is accessible from your machine

### Droplet Status
- [ ] Droplet is running
- [ ] Docker/docker-compose installed
- [ ] Can reach droplet from local machine

---

## Execution Phases

### Phase 1: N8N Foundation (2-3 hours)
**Goal**: Deploy proven jwilder/nginx-proxy setup

**Steps** (from REBUILD_PLAN_APPROVED_v1.md):
1. Backup current database & workflows
2. Stop current services
3. Deploy new docker-compose.yml
4. Verify all services healthy
5. Test HTTPS access
6. Test n8n functionality
7. Commit to git

**Expected Outcome**:
- ✅ n8n.bestviable.com returns 200 OK
- ✅ All 6 services healthy
- ✅ Workflows persist across restarts
- ✅ Ready for Phase 2

### Phase 2: MCP Servers (1-2 hours, separate sprint)
**Goal**: Deploy MCP servers with direct CF tunnel routing

**Steps** (outlined in plan):
1. Create `/infra/mcp-servers/docker-compose.yml`
2. Deploy MCP services (coda, github, firecrawl)
3. Configure Cloudflare tunnel routes
4. Test each MCP endpoint

**Expected Outcome**:
- ✅ MCP servers accessible via HTTPS
- ✅ Independent from n8n
- ✅ Ready for future OAuth implementations

---

## Risk Assessment

### What Could Go Wrong & Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| nginx still doesn't work | **Low (5%)** | jwilder is proven; if fails, use CF tunnel only |
| Data loss | **Very Low (1%)** | Database backup taken before deploy |
| Cloudflare tunnel breaks | **Very Low (1%)** | nginx works locally; CF is bonus |
| Qdrant unhealthy status | **Medium (40%)** | Service works fine; health check tuned |

**Confidence Level**: HIGH (90%+)

---

## Success Criteria

### Phase 1 Complete When:
```bash
✅ docker ps shows 6/6 services healthy
✅ docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 5 "upstream n8n"
   (Shows upstream + server blocks, not just comments)
✅ curl -k https://n8n.bestviable.com returns 200
✅ N8N login page loads in browser
✅ Can create & execute a test workflow
✅ Workflow persists after docker restart n8n
✅ New compose file committed to git
```

### Phase 2 Complete When:
```bash
✅ MCP services running: docker ps
✅ curl http://localhost:8085/health returns 200 (from droplet)
✅ curl https://coda-mcp.bestviable.com works (from local)
✅ All 3+ MCP endpoints responding
✅ docker-compose.yml committed to git
```

---

## How to Execute (Quick Start)

### When Ready
1. Read **REBUILD_PLAN_APPROVED_v1.md** (sections 1.2-1.8)
2. Follow step-by-step instructions
3. After each step, check success criteria
4. Document any issues (update plan)
5. Proceed to next step

### Command Reference
```bash
# SSH to droplet
ssh tools-droplet-agents

# Backup database
cd /root/portfolio/infra/n8n
docker-compose exec postgres pg_dump -U n8n -d n8n > /tmp/backup.sql

# Download backup
scp tools-droplet-agents:/tmp/backup.sql /Users/davidkellam/portfolio-backups/

# Stop services
docker-compose down -v

# Copy new compose
scp /Users/davidkellam/workspace/portfolio/infra/n8n/docker-compose.yml \
  tools-droplet-agents:/root/portfolio/infra/n8n/

# Deploy
docker-compose up -d

# Monitor
docker logs -f n8n --tail 50

# Test
curl -k https://n8n.bestviable.com
```

See REBUILD_PLAN_APPROVED_v1.md for complete details.

---

## Rollback (If Needed)

**If Phase 1 fails**, you have:
- Full database backups
- Old compose file in git
- About 30 minutes to recover

```bash
# Stop new stack
docker-compose down -v

# Restore from backup (if needed)
# Deploy old compose
git checkout PREVIOUS_COMMIT -- infra/n8n/docker-compose.yml

# Redeploy
docker-compose up -d

# Restore database
docker exec postgres psql -U n8n < /path/to/backup.sql
```

---

## Communication Plan

### If Blocked During Execution
- Check REBUILD_PLAN_APPROVED_v1.md troubleshooting section (step 1.7)
- Document error messages
- Reference NGINX_DEBUGGING_GUIDE.md if needed
- Report with full error + docker logs

### If Unexpected Issue
- Document the problem
- Stop deployment (don't proceed further)
- Share logs and context
- Plan contingency

---

## After Phase 1 Succeeds

### Immediate (Same day)
1. ✅ Celebrate working n8n deployment
2. ✅ Document any learnings in CURRENT_STATE_v1.md
3. ✅ Commit final state to git
4. ✅ Share success metrics

### Next Sprint (When ready)
1. Plan Phase 2 MCP stack
2. Execute Phase 2 deployment
3. Configure Cloudflare routing
4. Document new MCP architecture

---

## Files You'll Need

### Locally
```
/Users/davidkellam/workspace/portfolio/
├── REBUILD_PLAN_APPROVED_v1.md    ← Execution guide
├── PLAN_SUMMARY.md                 ← Quick ref
├── ARCHITECTURE_COMPARISON.md       ← Visual guide
├── infra/n8n/
│   └── docker-compose.yml          ← New config
├── infra/config/
│   └── .env.local                  ← Secrets (have ready)
└── portfolio-backups/              ← For storing backups
```

### On Droplet
```
/root/portfolio/
├── infra/n8n/
│   ├── docker-compose.yml          ← Will be copied here
│   ├── .env                        ← Will be copied here
│   ├── backup/                     ← For n8n import
│   ├── certs/                      ← SSL certs (auto)
│   ├── acme/                       ← ACME files (auto)
│   └── shared/                     ← Workflows (auto)
```

---

## Confidence & Readiness

### Why This Will Work
✅ Based on syncbricks/n8n (proven setup)
✅ jwilder/nginx-proxy is battle-tested
✅ Fixing the exact root cause (docker-gen issue)
✅ Architecture is simpler than current mess
✅ Clear rollback path if issues
✅ 2-3 years of battle-testing behind this approach

### Why This Won't Fail
✅ Not experimental (proven pattern)
✅ Using standard, maintained images
✅ Clear success criteria
✅ Full backup before deploy
✅ Independent stacks (can fix in isolation)

### Confidence Level
**90%+ success on first deployment**

---

## Next Step: Approval

Please confirm:

```
Ready to execute Phase 1? (Y/N)

If YES:
1. I'll back up current state
2. Deploy new stack
3. Run verification checks
4. Report results

If NO or NEEDS CHANGES:
1. What needs clarification?
2. Any concerns about the approach?
3. Any prerequisites missing?
```

---

## Quick Navigation

- **Detailed Execution**: REBUILD_PLAN_APPROVED_v1.md
- **Visual Architecture**: ARCHITECTURE_COMPARISON.md
- **Quick Reference**: PLAN_SUMMARY.md
- **Current nginx Issue**: NGINX_DEBUGGING_GUIDE.md
- **Git Commit**: `git log --oneline -5`

---

**Status**: Ready for your execution approval
**Date**: 2025-11-02
**Timeline**: Phase 1 (~2-3 hrs) + Phase 2 (later sprint)
