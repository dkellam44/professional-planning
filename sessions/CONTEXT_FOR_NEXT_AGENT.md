# Context & Instructions for Next Agent (5-Hour Session)

- entity: agent_context
- level: operational
- zone: internal
- version: v01
- tags: [handoff, agent-instructions, context, phase2-continuation]
- source_path: /sessions/CONTEXT_FOR_NEXT_AGENT.md
- date: 2025-11-04

---

## 🎯 Your Mission

**Continue Phase 2-3 execution on memory control plane droplet.**

Estimated time remaining in current sequence: **2-3 hours** of actual work.

---

## 📚 Essential Context Documents (Read in Order)

### **1. CURRENT_STATE_v1.md** (5 min read)
**Location:** `/CURRENT_STATE_v1.md`
- Actual running state as of Nov 4 evening
- Container list (9 active)
- Network topology
- Volume assignments
- **Why:** Verify nothing has regressed before continuing

### **2. SESSION_HANDOFF_PHASE2_20251104.md** (10 min read)
**Location:** `/sessions/SESSION_HANDOFF_PHASE2_20251104.md`
- Complete summary of what was accomplished
- Issues identified (3 blockers documented)
- Resource metrics (650MB / 1.9GB RAM)
- Exact file locations created
- **Why:** Understand where previous session left off

### **3. N8N Workflow Templates** (reference)
**Location:** `/workflows/n8n/WORKFLOW_README.md`
- Complete workflow specifications (3 workflows)
- Input/output schemas
- Integration points with Open WebUI
- Testing instructions
- **Why:** Your source of truth for Phase 3 workflow implementation

### **4. DEPLOYMENT_GUIDE.md** (for Cloudflare Workers decisions)
**Location:** `/integrations/cloudflare-workers/DEPLOYMENT_GUIDE.md`
- MCP server strategy
- Coda MCP migration details
- **Why:** Reference if doing Workers deployment

### **5. CLAUDE.md** (architecture reference)
**Location:** `/CLAUDE.md`
- High-level architecture & commands
- Directory structure overview
- Technology stack
- **Why:** Quick reference for project structure

---

## ⚠️ Critical Issues From Previous Session

### **Issue 1: Coda MCP Deployment Status** 🔴
**Status:** Build in progress (started at 19:28 PST)
- Command: `docker-compose build coda-mcp` (Node:20 image ~200MB, takes 3-5 mins)
- Check status immediately:
```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/mcp-servers && docker-compose ps"
# Should show coda-mcp: Up (if completed)
# Or still building if started recently
```

**Action if complete:** Test health check:
```bash
curl -s http://localhost:8085/health
curl -I https://coda.bestviable.com/health
```

**Action if still building:** Wait 2-3 more minutes, check again

**Action if failed:** Check logs:
```bash
ssh tools-droplet-agents "docker-compose -f /root/portfolio/infra/mcp-servers/docker-compose.yml logs coda-mcp"
```

### **Issue 2: Cloudflare Tunnel Routes Not Added** 🟡
**Status:** Phase 1 apps (openweb, kuma, dozzle) are running but NOT accessible externally
- nginx-proxy labels configured ✅
- SSL certs being generated (by acme-companion) ✅
- **BUT:** Cloudflare Tunnel routes missing ❌

**What to do:**
1. Go to Cloudflare Zero Trust Dashboard
2. Tunnels → [Your Tunnel Name] → Public Hostnames
3. Add 3 ingress rules:
   ```
   logs.bestviable.com → http://nginx-proxy:80
   openweb.bestviable.com → http://nginx-proxy:80
   kuma.bestviable.com → http://nginx-proxy:80
   ```
4. Wait ~30s for DNS propagation
5. Test: `curl -I https://openweb.bestviable.com`

### **Issue 3: OpenMemory Not Yet Deployed** 🟡
**Status:** Image unavailable publicly, deferred to Phase 3
- **Plan:** Build custom Dockerfile (would take 30-45 mins)
- **Alternative:** Skip for now, use n8n workflows without it (can add later)
- **Decision:** Your call - proceed with memory workflows, add OpenMemory later if needed

---

## 📋 Your Task Sequence (High Priority First)

### **Task 1: Verify Coda MCP Build** (5 mins)
**Do this first:**
```bash
# Check if container is running
ssh tools-droplet-agents "docker ps | grep coda-mcp"

# If running, test health
curl -s http://localhost:8085/health

# If not running or errored, check logs
ssh tools-droplet-agents "docker-compose -f /root/portfolio/infra/mcp-servers/docker-compose.yml logs coda-mcp | tail -50"
```

**Outcome:** Either Coda is ready for Phase 3, or needs debugging

### **Task 2: Configure Cloudflare Tunnel Routes** (10-15 mins)
**Critical for external access:**
1. Open Cloudflare Zero Trust → Your Tunnel
2. Add 3 public hostname routes (see Issue 2 above)
3. Verify DNS resolves: `dig openweb.bestviable.com`
4. Test accessibility: `curl -I https://openweb.bestviable.com`

**Why:** Phase 3 workflows need webhooks to n8n, which need external HTTPS access

### **Task 3: Begin Phase 3 - N8N Workflows** (1-2 hours)
**Once Coda & routes are working:**

**3.1: Create memory-assemble workflow**
- Open N8N: https://n8n.bestviable.com
- Create new workflow
- Template: `/workflows/n8n/WORKFLOW_README.md` section "Workflow 1"
- **Purpose:** Retrieve context before chat inference
- **Inputs:** client_id, query
- **Outputs:** profile, similar_chunks, episodes, timestamp

**3.2: Create memory-writeback workflow**
- Same process as 3.1
- **Purpose:** Persist facts after conversation
- **Inputs:** client_id, conversation transcript
- **Outputs:** success/error

**3.3: Create nightly-cleanup workflow**
- Same process
- **Trigger:** Cron `0 2 * * *` (2 AM daily)
- **Purpose:** Maintenance (delete expired, archive old, vacuum DB)

**3.4: Configure Open WebUI hooks**
- Open WebUI: https://openweb.bestviable.com
- Admin Settings → Integrations
- Pre-request hook: `https://n8n.bestviable.com/webhook/memory/assemble`
- Post-request hook: `https://n8n.bestviable.com/webhook/memory/writeback`

**3.5: Test end-to-end**
- Start chat in Open WebUI
- Verify memory-assemble is called (check n8n executions)
- Verify facts persist (check memory-writeback)
- Check episode was created in Postgres

### **Task 4: Verification & Documentation** (30 mins)
**Before wrapping up:**
```bash
# Full health check
ssh tools-droplet-agents "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# RAM usage
ssh tools-droplet-agents "free -h && docker stats --no-stream"

# Test each endpoint
curl -I https://n8n.bestviable.com
curl -I https://openweb.bestviable.com
curl -I https://kuma.bestviable.com
curl -I https://logs.bestviable.com
curl -I https://coda.bestviable.com
```

Update `/sessions/SESSION_SUMMARY_PHASE2_[DATE].md` with:
- What was completed
- Any issues encountered & solutions
- Current RAM/resource state
- Next agent instructions

---

## 🔑 Key Files You'll Touch

**Read-only reference:**
- `/docs/infrastructure/PHASE2_MEMORY_CONTROL_PLANE_PLAYBOOK.md`
- `/sessions/SESSION_HANDOFF_PHASE2_20251104.md`
- `/CURRENT_STATE_v1.md`

**Will modify/create:**
- `/infra/mcp-servers/docker-compose.yml` (already created, may need edits)
- `/workflows/n8n/memory-assemble.json` (create via UI)
- `/workflows/n8n/memory-writeback.json` (create via UI)
- `/workflows/n8n/nightly-cleanup.json` (create via UI)
- `/sessions/SESSION_SUMMARY_PHASE2_[DATE].md` (create at end)

**Will commit to Git:**
- Updated workflow files
- Final session summary
- Any configuration changes

---

## 🧠 Decision Matrix

### **If Coda MCP Build Failed:**
- **Quick fix:** Skip Coda for now, proceed with phase 3 using alternative (direct HTTP to n8n)
- **Proper fix:** Debug Dockerfile, rebuild, test
- **Time cost:** 30-45 mins for proper fix
- **Recommendation:** Proper fix (Coda needed for downstream workflows)

### **If Cloudflare Routes Won't Work:**
- Check: Is tunnel actually running? `ssh tools-droplet-agents "docker ps | grep cloudflared"`
- Check: Are nginx labels correct? `docker inspect openweb | grep VIRTUAL`
- Fallback: Use IP-based access for testing (but webhooks won't work externally)

### **If N8N Workflows Are Complex:**
- Use UI builder (drag-and-drop) rather than JSON import
- Test each node individually before connecting
- Credentials might be missing (set in N8N Settings → Credentials first)

### **If Time Running Low:**
- **Priority 1:** Verify Coda MCP works (5 mins)
- **Priority 2:** Add Cloudflare routes (10 mins)
- **Priority 3:** Create 1 workflow (30 mins) - at least memory-assemble
- **Priority 4:** Config webhooks (15 mins)
- **Priority 5:** Tests & documentation (20 mins)
- **Defer:** Nightly cleanup, secondary testing if short on time

---

## 📞 Quick Reference Commands

```bash
# Check everything
ssh tools-droplet-agents "docker ps && echo '---' && docker stats --no-stream && echo '---' && free -h"

# Check Coda specifically
ssh tools-droplet-agents "curl -s http://localhost:8085/health | jq ."

# View n8n execution logs
# (via UI: https://n8n.bestviable.com → Executions)

# View app logs
ssh tools-droplet-agents "docker logs openweb | tail -50"
ssh tools-droplet-agents "docker logs uptime-kuma | tail -50"
ssh tools-droplet-agents "docker logs dozzle | tail -50"

# Restart a service
ssh tools-droplet-agents "docker restart openweb"

# Check Cloudflare tunnel
ssh tools-droplet-agents "docker logs cloudflared | tail -20"

# Create/check n8n credentials
# (via UI: https://n8n.bestviable.com → Settings → Credentials)
```

---

## ✅ Success Criteria (For Session Close)

At minimum:
- [ ] Coda MCP verified working (health check passes)
- [ ] Cloudflare tunnel routes configured (external HTTPS working)
- [ ] At least 1 n8n workflow created (memory-assemble)
- [ ] Open WebUI pre-hook configured
- [ ] End-to-end test passed (chat → memory retrieval)
- [ ] Session summary documented & committed

Stretch goals:
- [ ] All 3 workflows created
- [ ] Post-hooks configured
- [ ] Nightly cleanup scheduled
- [ ] Full test suite passing

---

## 📚 Where to Find Help

**If stuck, read:**
1. Playbook (detailed steps): `/docs/infrastructure/PHASE2_MEMORY_CONTROL_PLANE_PLAYBOOK.md`
2. Previous handoff: `/sessions/SESSION_HANDOFF_PHASE2_20251104.md`
3. N8N workflows guide: `/workflows/n8n/WORKFLOW_README.md`
4. Deployment guide: `/integrations/cloudflare-workers/DEPLOYMENT_GUIDE.md`
5. CLAUDE.md (architecture): `/CLAUDE.md`

**Common issues solutions:**
- Playbook "Troubleshooting" section (bottom)
- Check logs: `docker logs <container_name>`
- Check health: `curl http://localhost:PORT/health`
- Restart services: `docker-compose down && docker-compose up -d`

---

**Generated:** 2025-11-04 23:45 PST
**For:** Next agent (5-hour session)
**Status:** Previous session used 2/5 hours effectively, good runway remaining
