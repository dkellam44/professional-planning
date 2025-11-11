# Deployment State v0.2

- entity: deployment_state
- level: documentation
- zone: internal
- version: v02
- tags: [architecture, deployment, state-tracking, operational]
- source_path: /sot/DEPLOYMENT_STATE_v0_2.md
- date: 2025-11-06

---

## Current Deployment Status

**Last Updated**: 2025-11-06 07:07
**Overall Status**: ✅ Phase 1 Complete | ✅ Phase 2A Local Complete | 🔄 Phase 2A Droplet Deploying | ⏳ Phase 2B-2C Pending

---

## Phase Breakdown

### Phase 1: N8N Foundation ✅ COMPLETE

**Status**: Production-ready on droplet
**Deployed**: September 2025
**Services**:
- ✅ n8n orchestration engine
- ✅ PostgreSQL database
- ✅ Qdrant vector store
- ✅ Nginx reverse proxy
- ✅ Cloudflare Tunnel
- ✅ SSL/TLS certificates

**Access**: https://n8n.bestviable.com

---

### Phase 2A: Archon Local Deployment ✅ COMPLETE

**Status**: Validated and tested locally
**Completed**: 2025-11-06
**Services Running**:
- ✅ archon-server (8181) - FastAPI backend - HEALTHY
- ✅ archon-mcp (8051) - IDE integration - HEALTHY
- ✅ archon-ui (3737) - React frontend - HEALTHY

**Database**:
- ✅ Supabase (ocvjzbzyvmfqixxwwqte.supabase.co)
- ✅ Tables: archon_settings, archon_sources, documents, code_examples, etc.
- ✅ pgvector extension enabled
- ✅ RLS policies configured

**Configuration**:
- ✅ OpenAI API key (text-embedding-3-small)
- ✅ Redis Cloud connected
- ✅ Settings encrypted in database

**Validation**:
- ✅ Health endpoints passing
- ✅ API endpoints tested
- ✅ Knowledge ingestion working (web crawl initiated)
- ✅ Search API ready

**Location**: `/Users/davidkellam/workspace/archon` (local)
**Target**: `/root/portfolio/infra/archon/` (droplet)

**Completion Report**: See `ARCHON_LOCAL_SETUP_COMPLETION_v01.md`

---

### Phase 2A: Archon Droplet Deployment ⚠️ DEPLOYMENT BLOCKED - HEALTH CHECK FAILURE

**Status**: BLOCKED - Docker compose dependency failed due to archon-server health check failure
**Date Started**: 2025-11-06 07:05 UTC
**Failure Detected**: 2025-11-06 20:00 UTC
**Current Time**: 2025-11-06 20:01 UTC

**Root Cause Analysis**:
- ✅ Docker images built successfully (archon-server, archon-mcp, archon-ui)
- ✅ Services started (archon-server container created and started)
- ❌ **archon-server health check failing** (persistent unhealthy status)
- ❌ **Docker compose dependency failure** - When archon-server marked unhealthy, compose dependency chain failed
- ❌ **Other services blocked from starting** - archon-mcp and archon-ui didn't start due to depends_on: [archon-server] dependency
- ❌ **Nginx-proxy switch not executed** - Compose was in failed state, so switch command didn't execute

**Telemetry from Task Execution**:
- Task 7c876f (docker compose up --build): Failed with "dependency failed to start: container archon-server is unhealthy"
- Task 71e08e (service status check after 20s): Only archon-server visible, marked "Up 2+ hours (unhealthy)"
- Task b7e016 (service status after 30s): Same pattern, archon-server showing "(unhealthy)"
- Task 79ea6f (immediate ps check): Only archon-server listed, no archon-mcp or archon-ui
- Task f8fd0b (config check): Backup copy succeeded, files in place

**Droplet Connectivity**:
- SSH unreachable (multiple timeouts: "Connection reset by peer", "Connection timed out during banner exchange")
- Likely cause: System under load from failed service restart cycles OR network connectivity issue

**Prerequisites Met**:
- ✅ Local testing complete (all services validated)
- ✅ Infrastructure design validated (Option B selected)
- ✅ Environment configuration documented (.env with corrected Supabase URL)
- ✅ SERVICE_DEPLOYMENT_GUIDE reviewed
- ✅ Docker build completed successfully
- ✅ Backup created: docker-compose.original.yml
- ✅ Nginx-proxy config pre-staged: docker-compose-nginx.yml

**Completed Actions**:
1. ✅ Created `/root/portfolio/infra/archon/` directory on droplet
2. ✅ Copied docker-compose.yml and .env to droplet
3. ✅ Copied application source code (python/, archon-ui-main/, migration/)
4. ✅ Initiated `docker compose up --build -d` (build completed, container started)
5. ✅ Docker images built: archon-server, archon-mcp, archon-ui (all in registry)
6. ✅ Created nginx-proxy docker-compose-nginx.yml on droplet (pre-staged)
7. ❌ Services startup **FAILED** - Health check failure prevented normal operation

**Next Steps (BLOCKING ISSUE RESOLUTION)**:

**Immediate (when SSH stabilizes)**:
1. Reconnect to droplet: `ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose logs archon-server --tail 50"`
2. Analyze archon-server startup logs to determine health check failure cause
   - Possible causes: Supabase connection timeout, slow startup beyond 60s grace period, missing dependencies
3. Options based on diagnosis:
   - **If Supabase issue**: Verify .env file, check Supabase connectivity from droplet
   - **If startup too slow**: Increase health check `start_period` from 60s to 120s
   - **If dependency issue**: Check logs for specific errors

**Recovery Procedure**:
```bash
# 1. Check archon-server logs for failure reason
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose logs archon-server | tail -50"

# 2. Common fixes:
# Option A: Restart with more lenient health check
cp docker-compose.original.yml docker-compose.yml
# Then modify docker-compose.yml: increase health check start_period to 120s
# Then: docker compose up -d

# Option B: Check environment and credentials
grep SUPABASE docker-compose.yml
grep -A2 "archon-server:" docker-compose.yml | grep "environment:" -A 10

# 3. Once archon-server healthy:
# Execute nginx-proxy switch as planned
cp docker-compose-nginx.yml docker-compose.yml
docker compose down && sleep 3 && docker compose up -d
```

**Architecture Decision: OPTION B ✅ SELECTED**:
- ✅ Integrate with nginx-proxy for public HTTPS access on archon.bestviable.com
- ✅ Archon UI (3737) exposed via nginx-proxy reverse proxy with Let's Encrypt SSL
- ✅ Backend services (archon-server:8181, archon-mcp:8051) remain internal only
- ✅ Leverage existing Cloudflare Tunnel infrastructure
- ✅ Deployment guide: See `ARCHON_NGINX_DEPLOYMENT_v01.md`

**Files on Droplet**:
- Original: `/root/portfolio/infra/archon/docker-compose.yml` (currently in failed state)
- Nginx-Proxy: `/root/portfolio/infra/archon/docker-compose-nginx.yml` (pre-staged, ready to switch)
- Backup: `/root/portfolio/infra/archon/docker-compose.original.yml` (created successfully)
- Environment: `/root/portfolio/infra/archon/.env` (Supabase credentials verified)
- Source Code: `python/`, `archon-ui-main/`, `migration/` (all present and copied)

**Deployment Status Timeline**:
- 07:05 UTC: Docker build initiated
- 07:42 UTC: Backup copy completed (file timestamp)
- 08:08 UTC: Docker images built (task log)
- 20:00 UTC: Health check failure detected (task 7c876f, 71e08e output reviewed)
- 20:01 UTC: SSH unreachable, diagnostic analysis complete

**Pending Steps** (after health check resolved):
1. ⏳ Resolve archon-server health check failure
2. ⏳ Execute nginx-proxy configuration switch
3. ⏳ Verify services restarted with nginx-proxy config
4. ⏳ Verify nginx-proxy discovery of archon-ui
5. ⏳ Add Cloudflare Tunnel route
6. ⏳ Test external HTTPS access

---

### Phase 2B: Open WebUI + n8n Integration ⏳ PENDING

**Status**: Planned, not started
**Objectives**:
- [ ] Deploy Open WebUI on droplet
- [ ] Create n8n workflows for memory orchestration
- [ ] Wire pre/post hooks in Open WebUI
- [ ] Test end-to-end memory flow

**Workflows Required**:
- `/webhook/memory-assemble` - Pre-prompt context injection
- `/webhook/memory-writeback` - Post-conversation knowledge storage

**Estimated Duration**: 2-4 hours
**Target Date**: Week of 2025-11-10

---

### Phase 2C: Custom MCP Servers ⏳ PENDING

**Status**: Planned, not started
**Services to Deploy**:
- [ ] Coda MCP (8085)
- [ ] GitHub MCP (8081)
- [ ] Firecrawl MCP (8084)

**Integration**:
- [ ] Configure Claude Code MCP connections
- [ ] Test tool execution

**Estimated Duration**: 4-8 hours
**Target Date**: Week of 2025-11-17

---

## API Endpoint Updates

### Knowledge Items Routes (Corrected in Phase 2A)

Based on local testing, API routes follow this pattern:

```
POST   /api/knowledge-items/crawl                 Start web crawl
GET    /api/knowledge-items/sources               List all sources
GET    /api/knowledge-items/{source_id}           Get source details
POST   /api/knowledge-items/search                RAG search query
GET    /api/knowledge-items/{source_id}/chunks    Get document chunks
GET    /api/crawl-progress/{progress_id}          Get crawl status
```

**NOTE**: Plans referenced `/api/knowledge/*` but actual is `/api/knowledge-items/*`

---

## Configuration Matrix

### Environment Variables

| Variable | Local | Droplet | Notes |
|----------|-------|---------|-------|
| SUPABASE_URL | ✅ Set | ✅ Same URL | Shared cloud DB |
| SUPABASE_SERVICE_KEY | ✅ Set | ✅ Same key | Keep secure |
| OPENAI_API_KEY | ✅ In Supabase | ✅ In Supabase | Encrypted storage |
| REDIS_URL | ✅ In Supabase | ✅ In Supabase | Encrypted storage |
| HOST | localhost | droplet IP | For service binding |
| PROD | false | false | Keep dev mode for now |

### Service Ports (Droplet)

| Service | Port | External Route | Protocol |
|---------|------|----------------|----------|
| archon-ui | 3737 | archon.bestviable.com | HTTPS via Cloudflare |
| archon-server | 8181 | (internal) | HTTP |
| archon-mcp | 8051 | (internal) | HTTP |

---

## Known Issues & Solutions

### 1. DNS Configuration (Resolved)
**Issue**: SUPABASE_URL typo (`.com` vs `.co`)
**Status**: ✅ FIXED
**Solution**: Updated .env with correct TLD

### 2. API Endpoint Naming (Updated)
**Issue**: Plans showed `/api/knowledge/*` but actual is `/api/knowledge-items/*`
**Status**: ✅ DOCUMENTED
**Solution**: Update n8n workflows to use correct endpoints

### 3. Settings Storage (Clarified)
**Issue**: Credentials not in .env, stored in Supabase
**Status**: ✅ VALIDATED
**Solution**: Ensure database migration runs before services start

---

## Deployment Checklist

### Phase 2A Droplet Deployment

- [ ] SSH to droplet: `ssh tools-droplet-agents`
- [ ] Create directory: `mkdir -p /root/portfolio/infra/archon`
- [ ] Copy docker-compose.yml from local
- [ ] Copy .env with production credentials
- [ ] Run database migration (if new project)
- [ ] Start services: `docker compose up --build -d`
- [ ] Verify health: `curl http://localhost:8181/health`
- [ ] Configure nginx for archon.bestviable.com
- [ ] Add Cloudflare Tunnel route
- [ ] Test external access via HTTPS
- [ ] Monitor logs for 5 minutes
- [ ] Mark deployment complete

### Phase 2B n8n Integration

- [ ] Access n8n UI: https://n8n.bestviable.com
- [ ] Create `/webhook/memory-assemble` workflow
- [ ] Create `/webhook/memory-writeback` workflow
- [ ] Deploy Open WebUI
- [ ] Configure Open WebUI environment variables
- [ ] Wire up pre/post hooks
- [ ] Test end-to-end flow

---

## Success Metrics

### Phase 2A (Archon)
- ✅ All services healthy on droplet
- ✅ Archon UI accessible via HTTPS
- ✅ API endpoints responding
- ✅ Database connected
- ✅ Can crawl documentation

### Phase 2B (Memory)
- [ ] Chat → Archon context injection working
- [ ] Post-conversation upload working
- [ ] Conversations visible in Archon UI

### Phase 2C (MCPs)
- [ ] Claude Code connects to all MCP servers
- [ ] Tools execute successfully

---

## Timeline

| Phase | Status | Start | Target Complete | Notes |
|-------|--------|-------|-----------------|-------|
| Phase 1 | ✅ Complete | Sep 2025 | Sep 2025 | N8N foundation |
| Phase 2A (Local) | ✅ Complete | Nov 5 | Nov 6 | Archon local setup |
| Phase 2A (Droplet) | ⏳ Pending | - | Nov 10-12 | Next: Deploy to droplet |
| Phase 2B | ⏳ Pending | - | Nov 12-15 | n8n + Open WebUI |
| Phase 2C | ⏳ Pending | - | Nov 15-20 | MCP servers |
| Phase 3 | 🔜 Future | - | Dec 2025 | Letta agents (optional) |

---

## Related Documents

**Reference Docs**:
- `/docs/architecture/integrations/archon/ARCHON_INTEGRATION_PLAN_v01.md` - Full deployment plan
- `/docs/architecture/integrations/archon/ARCHON_LOCAL_SETUP_COMPLETION_v01.md` - Local testing results
- `/docs/architecture/architecture-spec_v0.3.md` - Architecture principles
- `/infra/n8n/README.md` - N8N operations

**Action Items**:
- Create `/root/portfolio/infra/archon/docker-compose.yml` on droplet
- Create `/root/portfolio/infra/archon/.env` on droplet (copy from local)
- Update n8n workflows with correct API endpoints
- Configure Cloudflare routes for archon.bestviable.com

---

**Version History**

| Version | Date | Changes |
|---------|------|---------|
| v0.1 | 2025-11-05 | Initial state tracking |
| v0.2 | 2025-11-06 | Phase 2A local completion documented |

