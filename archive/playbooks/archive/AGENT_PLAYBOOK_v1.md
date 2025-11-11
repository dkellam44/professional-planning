# Agent Playbook: Portfolio Context & Priorities
**Version**: 1.0
**Date Created**: November 2, 2025
**Last Updated**: November 2, 2025
**Audience**: Stateless agents resuming portfolio work

---

## ⚠️ CRITICAL: Read This First

**Before making ANY decisions about the droplet, local infra, or repo structure**, you MUST read:
1. **This file** (AGENT_PLAYBOOK_v1.md) — Strategic context
2. **CURRENT_STATE_v1.md** — Actual deployed state (not what docs say)
3. **README.md** — Architecture principles
4. **infra/n8n/README.md** — N8N deployment specifics

---

## TL;DR: What You Need to Know Right Now

### Current Priority (as of 2025-11-02)
**Phase 1 (N8N) is COMPLETE and DEPLOYED.** Phase 2 (MCP servers) has NOT started.

### Current Droplet State
- ✅ **N8N stack running** (all services healthy)
  - postgres, qdrant, n8n, nginx-proxy, acme-companion, cloudflared
  - Located: `/root/portfolio/infra/n8n/`
  - Accessible internally on port 5678
  - **Minor issue**: nginx-proxy routing not yet working for external HTTPS access

- ⚠️ **Legacy services still running** (from old setup)
  - coda-mcp, memory-mcp-gateway, github-mcp-gateway, firecrawl-mcp-gateway, cloudflare-mcp-gateway
  - Located: Various old paths (mixed deployments)
  - Status: DEPRECATED - should be removed in Phase 2

- ❌ **NOT deployed yet**
  - Phase 2: Clean MCP server stack
  - Phase 3: Coda/n8n synchronization

### Local Repo State
- ✅ **New n8n files created** at `/infra/n8n/`
  - docker-compose.yml (fixed health check dependency issue)
  - .env (contains actual secrets)
  - .env.example (template)
  - README.md (comprehensive guide)

- ⚠️ **Legacy files still present** (intentionally)
  - `/docs/ops/` — Old deployment docs (some content merged into `/infra/n8n/README.md`)
  - `/infra/docker/` — Old compose files (should be archived after Phase 2)
  - Various old scripts and configs

---

## Strategic Context: Why Things Are the Way They Are

### The Problem We Solved
User's droplet had accumulated technical debt from multiple reconfigurations:
- Mixture of old and new services
- Unclear which containers were actually serving traffic
- Missing .env configuration
- Outdated deployment documentation
- No clear separation between infrastructure layers

### The Solution: Separate Concerns (Three Phases)

**Phase 1: Foundation (COMPLETE - Nov 2, 2025)**
- Build clean n8n stack using SyncBricks pattern
- Document thoroughly with comprehensive README
- Deploy to droplet
- Verify all services healthy
- Result: `/root/portfolio/infra/n8n/` with clear dependencies

**Phase 2: MCP Servers (NOT STARTED)**
- Remove legacy MCP services from droplet
- Create clean separate MCP server stack at `/root/portfolio/integrations/mcp/servers/`
- Deploy fresh (separate from n8n)
- Test MCP services independently

**Phase 3: Integration (NOT STARTED)**
- Set up n8n ↔ Coda synchronization
- Configure MCP servers as n8n nodes/services
- Test complete workflow

---

## How to Avoid Common Agent Mistakes

### ❌ Mistake 1: "I see old docs in /docs/ops, I should follow those"
**Why it's wrong**: Those docs are from Phase 0 (pre-cleanup). They describe the messy state.
**What to do instead**:
- Read `/infra/n8n/README.md` for n8n deployment
- Read `/CURRENT_STATE_v1.md` for actual droplet state
- Ignore `/docs/ops/` unless specifically researching what we cleaned up

### ❌ Mistake 2: "There are old MCP services running, maybe I should update them"
**Why it's wrong**: We intentionally left them running during Phase 1 cleanup. They will be removed in Phase 2.
**What to do instead**:
- Check `CURRENT_STATE_v1.md` to see which services are "active" vs "legacy"
- Only touch services that are marked "active" for the current phase
- If asked to work on MCP, follow the Phase 2 plan, not the old deployment paths

### ❌ Mistake 3: "The README.md says /infra/docker/ but I'm seeing files elsewhere"
**Why it's wrong**: README.md describes DESIRED state. Reality may lag during cleanup.
**What to do instead**:
- Check `CURRENT_STATE_v1.md` for ACTUAL file locations
- Trust the "Actual State" section over architectural diagrams
- If there's a mismatch, note it and ask user for clarification

### ❌ Mistake 4: "I should test by SSHing to droplet and running commands"
**Why it's wrong**: You might disturb running services or trigger unintended side effects.
**What to do instead**:
- Read `CURRENT_STATE_v1.md` first to understand what's running
- Check docker-compose status with: `docker ps`
- Only modify services when explicitly asked
- Always check `/infra/n8n/README.md` troubleshooting section before manual changes

### ❌ Mistake 5: "I'll just follow the steps in the old deployment scripts"
**Why it's wrong**: Old scripts may assume the messy pre-cleanup state.
**What to do instead**:
- Read `CURRENT_STATE_v1.md` to confirm current state matches script assumptions
- Use scripts from `/infra/` only
- Old scripts in `/docs/ops/scripts/` are archived - don't use them

---

## Navigation Guide: Which Files to Trust

| Document | Purpose | Trust Level | When to Use |
|---|---|---|---|
| **AGENT_PLAYBOOK_v1.md** | This file - strategic context | ✅ High | First - read immediately |
| **CURRENT_STATE_v1.md** | Actual deployed state | ✅ High | Before any changes |
| **README.md** | Architecture & principles | ✅ High | Understanding philosophy |
| **infra/n8n/README.md** | N8N deployment guide | ✅ High | Deploying/troubleshooting n8n |
| **docs/ops/** | Historical deployment docs | ⚠️ Medium | Only if researching Phase 0 |
| **Old compose files** | Legacy configuration | ❌ Low | NEVER use directly |
| **README_PHASE_1_QUICKSTART.md** | Old Phase 1 notes | ⚠️ Medium | Reference only |

---

## Asking the Right Questions

When you're unsure about what to do, ask yourself in this order:

### 1. What phase am I working on?
- Look at `CURRENT_STATE_v1.md` → "Current Phase" section
- If not explicitly told to work on Phase 2 or 3, assume Phase 1 follow-ups only

### 2. Is this service supposed to be running now?
- Check `CURRENT_STATE_v1.md` → "Droplet Services" section
- Look for "Status: Active" vs "Status: Legacy"

### 3. Should I modify this file?
- Is it in `/infra/` or `/infra/n8n/`? → Yes (current)
- Is it in `/docs/ops/` or `/infra/docker/`? → No (legacy)

### 4. If I'm stuck, what should I read?
Priority order:
1. `CURRENT_STATE_v1.md` (what actually exists)
2. `infra/n8n/README.md` (how to work with it)
3. `README.md` (why it's designed that way)

---

## Quick Reference: Service Status

### N8N Stack (Phase 1 - ACTIVE)
```
Location: /root/portfolio/infra/n8n/ (droplet) & /infra/n8n/ (local)
Services: postgres, qdrant, n8n, nginx-proxy, acme-companion, cloudflared
Status: ✅ Running (internal access works)
Minor Issue: External HTTPS routing needs nginx-proxy label configuration
Config: /infra/n8n/docker-compose.yml (MODIFIED: health check dependencies)
```

### Legacy MCP Services (Phase 1 - LEAVE ALONE)
```
Status: Running but deprecated
Services: coda-mcp, memory-mcp-gateway, github-mcp-gateway, firecrawl-mcp-gateway, cloudflare-mcp-gateway
Action: SKIP for now. Will be removed in Phase 2.
```

---

## If You Need to Resume Work

### Resuming Phase 1 (N8N Final Testing)
1. Read `CURRENT_STATE_v1.md` → "N8N Stack" section
2. SSH to droplet: `ssh tools-droplet-agents`
3. Check status: `cd /root/portfolio/infra/n8n && docker ps`
4. If services unhealthy: Read `infra/n8n/README.md` → "Troubleshooting" section
5. To test browser access: Check `CURRENT_STATE_v1.md` → "Known Issues" section

### Starting Phase 2 (MCP Server Cleanup)
1. Read `CURRENT_STATE_v1.md` → "Recommended Next Steps" section
2. Create plan in `/planning/` directory
3. Before touching any services: `docker ps` to see what's running
4. Remove services one at a time, testing after each removal

### Starting Phase 3 (Integration)
- Not ready yet. Will require Phase 2 to complete.

---

## Common Scenarios & How to Handle Them

### Scenario: "User asks me to fix n8n HTTPS access"
**Steps**:
1. Read `CURRENT_STATE_v1.md` → "Known Issues" section
2. The 503 error is likely the nginx-proxy label issue
3. Solution: Restart nginx-proxy or manually add upstream
4. Reference: `infra/n8n/README.md` → "Troubleshooting" → "503 Service Unavailable"

### Scenario: "Should I update the legacy MCP services?"
**Steps**:
1. Answer: NO. They're deprecated.
2. Reference: `CURRENT_STATE_v1.md` → "Legacy Services - DO NOT MODIFY"
3. Tell user: "Phase 2 will replace these with clean stack"

### Scenario: "I see a deployment script in /docs/ops, should I run it?"
**Steps**:
1. Answer: ONLY if explicitly asked to research Phase 0
2. Check `CURRENT_STATE_v1.md` → "Legacy Files" section
3. If unsure: Ask user which phase to work on

### Scenario: "docker-compose.yml says X but I'm seeing Y"
**Steps**:
1. Check if it's the health check dependency issue (Phase 1 final fix)
2. Reference: `infra/n8n/docker-compose.yml` lines 181-183 (simplified dependencies)
3. If different issue: Report to user with actual state from `docker inspect`

---

## Red Flags: When to STOP and Ask

🛑 Stop if you see:
- A deploy script that tries to use `/infra/docker/` files
- Services being modified without understanding Phase context
- Assumptions about file locations that differ from `CURRENT_STATE_v1.md`
- Requests to work on "MCP connectors" before Phase 2 cleanup
- Commands that would affect multiple unrelated services at once

When you see red flags: Document what you found, then ask user before proceeding.

---

## Success Criteria for Each Phase

### Phase 1 Success (ACHIEVED)
- ✅ N8N stack deployed to `/root/portfolio/infra/n8n/`
- ✅ All services healthy: postgres, qdrant, n8n, nginx-proxy, acme-companion, cloudflared
- ✅ Comprehensive README created at `infra/n8n/README.md`
- ✅ Environment files (.env, .env.example) in place
- ✅ Clean local mirror at `/infra/n8n/`
- ✅ Legacy code archived but not interfering
- ⏳ External HTTPS access working (minor routing fix remaining)

### Phase 2 Success (NOT YET)
- [ ] Legacy MCP services removed from droplet
- [ ] Clean MCP server stack planned in `/planning/`
- [ ] `/root/portfolio/integrations/mcp/servers/` ready for deployment
- [ ] Old `/infra/docker/` directory archived or removed
- [ ] Phase 2 README created

### Phase 3 Success (NOT YET)
- [ ] n8n ↔ Coda sync configured
- [ ] MCP servers callable from n8n
- [ ] End-to-end workflow tested

---

## Final Guidance

**Remember**: You're operating in a deliberately hybrid state during cleanup. Old and new coexist by design, not accident. Your job is to:

1. **Understand the phase** — Know what's current and what's legacy
2. **Read the docs** — Check CURRENT_STATE_v1.md and README files first
3. **Move deliberately** — Don't change things without understanding consequences
4. **Document changes** — Every modification should update both droplet and local mirror
5. **Ask when uncertain** — Better to ask than to create new mess

Good luck! 🚀

---

**Next Document**: Read `CURRENT_STATE_v1.md` for actual deployed state.
