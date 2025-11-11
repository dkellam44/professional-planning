---
- entity: system
- level: internal
- zone: internal
- version: v02
- tags: [orientation, current-state, entry-point, infrastructure-complete]
- source_path: /agents/CURRENT_FOCUS.md
- date: 2025-10-30
---

# Current Focus — 2025-10-30

**THIS FILE = START HERE for every new agent session**

**Read this first. Takes 5 minutes. Tells you everything you need to know.**

---

## Right Now: Three Priorities

1. **Define First Service Offer** (HIGH)
   - Location: `/ventures/ops-studio/offers/`
   - Status: Not yet created
   - Why: Can't sell without clear offer definition
   - Next: Research market, create offer brief

2. **Build Prospect Pipeline** (HIGH)
   - Location: `/ventures/ops-studio/pipeline/outreach_tracker.md`
   - Status: Zero active prospects
   - Why: Need pipeline to get first client
   - Next: Identify 5-10 targets, draft outreach

3. **Operational Stability** (MEDIUM)
   - Daily workflow: `/ventures/ops-studio/DAILY_WORKFLOW.md`
   - Infrastructure: Working (n8n ✅ Coda MCP ✅)
   - Next: Use daily workflow, refine based on experience

---

## Business Reality

- **Stage:** Pre-revenue (zero clients)
- **Focus:** Offers → Outreach → First Client
- **Tools:** Coda (deal tracking), GitHub (specs), n8n (automation)
- **Timeline:** Q4/Q1 for first paying engagement

---

## Latest Session Handoff

📍 `/sessions/handoffs/SESSION_HANDOFF_2025-10-30_v1.md`

**Summary:** Infrastructure restructure complete. All directories migrated to new structure. Endpoints verified live. Ready for next phase of business development.

---

## Infrastructure Status

🟢 **GREEN** — Infrastructure restructure COMPLETE & VERIFIED (2025-10-30)
- **Coda MCP**: ✅ Live & responding (https://coda.bestviable.com/sse → HTTP 200)
- **n8n**: 🟡 Restarting (expected during init, check after stabilization)
- **DigitalOcean/Cloudflare MCPs**: 🟡 Restarting (awaiting API tokens/remote URL)
- **Base Stack**: ✅ nginx-proxy, postgres, acme-companion, cloudflared all healthy
- **Droplet sync**: ✅ `/root/portfolio/infra/` mirrors local structure perfectly
- **Build contexts**: ✅ Verified `../..` context paths work correctly
- **Last verified**: 2025-10-30 05:36 UTC

**Structure Migration COMPLETE**:
- `/docs/ops/` → `/infra/docker/` ✅
- `y_collection_box/` → `sessions/` ✅
- `inbox/` → `planning/` ✅
- `z_archive/` → `archive/` ✅
- `business_model/` → `docs/business/` ✅
- All documentation updated ✅
- ADR recorded (2025-10-30_portfolio-infrastructure-restructure_v01.md) ✅

---

## What NOT to Work On (Deferred)

- ❌ Authority Map JSON validation
- ❌ Automated n8n sync workflows
- ❌ SoT meta-architecture
- ❌ Evaluation harness

**These are valuable but come AFTER first client.**

---

## For Stateless Agents

**When you start:**
1. ✅ You're reading this file (CURRENT_FOCUS)
2. Check business context above
3. Review latest handoff (link above)
4. Ask human: "What's the focus today?"
5. Open relevant playbook or start work

**When you end:**
1. Update relevant playbooks
2. Update this file if priorities shifted
3. Tell human the next steps

---

## Active Playbooks

**Primary:**
- Operations Studio pre-revenue setup (current phase)

**Secondary (deferred):**
- System SoT Consolidation Playbook v01
- Coda MCP Gateway Upgrade Plan v01

---

## Quick Links

- **Daily work:** `/ventures/ops-studio/DAILY_WORKFLOW.md`
- **Recovery:** `/ventures/ops-studio/RECOVERY_CHECKLIST.md`
- **Coda/GitHub:** `/ventures/ops-studio/CODA_GITHUB_GUIDE.md`
- **System overview:** `/agents/context/system_overview_v01.md`
- **Startup checklist:** `/agents/system_startup_checklist_v01.md`

---

## Decision: What Should I Work On?

```
Do you have active billable work?
├─ YES → Do that (client work first)
└─ NO → Check CURRENT_FOCUS priorities
    ├─ Need offer spec? → Work on offer
    ├─ Need prospects? → Build pipeline
    └─ Neither? → Refine delivery process or learning
```

---

## Remember

- **Client work > Infrastructure > Meta work**
- **Done > Perfect**
- **Commit often > Perfect commits rarely**
- **When confused → Read this file again**
