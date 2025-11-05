- entity: portfolio
- level: documentation
- zone: internal
- version: v1.0
- tags: [planning, infrastructure, n8n, mcp]
- source_path: /PLAN_SUMMARY.md
- date: 2025-11-02

---

# N8N Rebuild Plan - Summary & Status

**Status**: READY FOR EXECUTION
**Date Approved**: 2025-11-02
**Expected Timeline**: Phase 1 (~2-3 hrs) + Phase 2 (~1-2 hrs)

---

## What We're Doing

### The Problem
Current n8n deployment has **unsolvable docker-gen issue** with nginxproxy/nginx-proxy:
- Labels not recognized by template engine
- External HTTPS access returns 503
- Already investigated thoroughly - no quick fixes
- Rebuilds don't help (architectural issue)

### The Solution
**Phase 1**: Deploy proven syncbricks/n8n setup using **jwilder/nginx-proxy** (original, proven)
**Phase 2**: Separate MCP servers with **direct Cloudflare tunnel routing** (no nginx needed)

---

## Documents Created

### 1. **REBUILD_PLAN_APPROVED_v1.md** (MAIN REFERENCE)
   - Complete step-by-step execution guide
   - All 7 deployment steps documented
   - Troubleshooting section
   - Rollback procedures
   - Read this when executing Phase 1 & 2

### 2. **New docker-compose.yml** (IN /infra/n8n/)
   - Key changes from old setup:
     - ✅ jwilder/nginx-proxy (fixes docker-gen)
     - ✅ PostgreSQL 16-alpine (lighter)
     - ✅ n8n:1.83.2 (pinned version)
     - ✅ n8n-import service (for workflow restoration)
     - ✅ Better health check timing for Qdrant
     - ✅ Removed manual nginx config mounts
   - Ready to deploy to droplet

---

## Phase 1: N8N Foundation (2-3 hours)

**Goal**: Replace broken nginx with proven jwilder/nginx-proxy setup

### Key Changes
| Item | Before | After | Why |
|------|--------|-------|-----|
| Reverse Proxy | nginxproxy/nginx-proxy | **jwilder/nginx-proxy** | Fixes docker-gen label recognition |
| PostgreSQL | 15-alpine | **16-alpine** | Lighter, more optimized |
| n8n version | latest | **1.83.2 (pinned)** | Reproducible builds |
| Qdrant health | aggressive | **relaxed** | Stops false negatives |
| Import service | None | **n8n-import** | Enables workflow restoration |
| Network name | n8n | **syncbricks** | Clearer semantics |

### Expected Outcome
- ✅ All 6 services healthy
- ✅ External HTTPS access working (no 503)
- ✅ n8n accessible and functional
- ✅ Ready for Phase 2

---

## Phase 2: MCP Servers (1-2 hours)

**Goal**: Deploy MCP servers independently behind CF tunnel (no nginx)

### Architecture

```
Internet → CF Tunnel → MCP Container (direct)
                   (no reverse proxy!)
```

### Why This Works
- ✅ Simpler (fewer containers)
- ✅ Cloudflare handles HTTPS termination
- ✅ Each MCP on separate port + hostname
- ✅ Easy to troubleshoot
- ✅ Can add nginx-proxy layer later if needed

### Services
- coda-mcp (port 8085)
- github-mcp (port 8081)
- firecrawl-mcp (port 8084)
- More as needed

### Future nginx Addition (Optional)
If later needed, just add nginx-proxy to docker-compose and re-route. No rebuild required.

---

## Files Ready for Deployment

### Local Repository
```
/infra/n8n/
├── docker-compose.yml          ✅ NEW (jwilder/nginx-proxy)
├── .env                         ✅ (copy from config/.env.local)
├── .env.example                 ✅ (safe to commit)
└── .gitignore                   ✅ (existing)

/REBUILD_PLAN_APPROVED_v1.md    ✅ (detailed instructions)
```

### To Create
```
/infra/mcp-servers/
├── docker-compose.yml          (simple HTTP services)
├── .env                         (MCP secrets)
└── README.md                    (operations guide)
```

---

## Next Steps

### For User Approval
1. Review REBUILD_PLAN_APPROVED_v1.md (sections 1.1-1.2)
2. Confirm ready to proceed with Phase 1
3. Confirm environment variables available

### When Approved
1. Back up current n8n state (documented in plan)
2. Deploy Phase 1 (documented in plan, step-by-step)
3. Verify all checks pass
4. Commit to git
5. Plan Phase 2 separately (after Phase 1 verified)

---

## Success Criteria Checklist

### Phase 1 Success
- [ ] All 6 services show as healthy: `docker ps`
- [ ] nginx config includes n8n upstream: `docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 5 "upstream n8n"`
- [ ] External HTTPS returns 200: `curl -k https://n8n.bestviable.com`
- [ ] N8N UI loads in browser
- [ ] Test workflow persists after restart
- [ ] New compose committed to git

### Phase 2 Success (Later Sprint)
- [ ] MCP services running
- [ ] Direct HTTP access: `curl http://localhost:8085/health`
- [ ] CF HTTPS access: `curl https://coda-mcp.bestviable.com`
- [ ] All MCP endpoints responding

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| nginx still doesn't work | Low | Use CF-only access (tunnel already working) |
| Data loss | Very Low | 3 backups taken before deploy |
| Cloudflare tunnel breaks | Very Low | nginx fallback (proves n8n works locally) |
| Qdrant unhealthy warning | Medium | Service works despite status (health check tuned) |

---

## Key Insights

### Why jwilder/nginx-proxy Works
- Original, proven implementation
- Simpler label matching (not stateful docker-gen)
- Already working on this droplet before MCP bloat
- Stable, maintained, battle-tested

### Why Direct CF Tunnel for MCP
- Cloudflare already running and working
- No need to duplicate nginx for MCP
- Simpler architecture = fewer bugs
- Standards for MCP still evolving (Nov 2025)

### Future-Proof Design
- MCP servers can add nginx-proxy layer later without rebuild
- n8n stack isolated from MCP changes
- Each stack independently deployable
- Supports OAuth implementations as standards mature

---

## Questions?

Before executing, please confirm:
1. Ready to proceed with Phase 1? (Y/N)
2. All environment variables available? (Y/N)
3. Backup location confirmed? (Y/N)
4. Any concerns about the approach? (Notes)

Then reference **REBUILD_PLAN_APPROVED_v1.md** for detailed execution steps.

---

**Status**: Planning Complete, Awaiting Execution Approval
**Next Action**: User confirms → Execute Phase 1 → Test → Document → Phase 2
