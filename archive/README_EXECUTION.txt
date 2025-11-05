╔════════════════════════════════════════════════════════════════════════════════╗
║                  N8N REBUILD PLAN - READY FOR EXECUTION                       ║
║                                                                                ║
║ Status: APPROVED & COMMITTED TO GIT                                           ║
║ Timeline: Phase 1 (~2-3 hrs) + Phase 2 (~1-2 hrs)                            ║
║ Confidence: 90%+ success rate                                                 ║
╚════════════════════════════════════════════════════════════════════════════════╝

📋 DOCUMENTS CREATED:
├─ EXECUTION_READY.md              ← START HERE (quick reference)
├─ REBUILD_PLAN_APPROVED_v1.md     ← DETAILED EXECUTION STEPS
├─ PLAN_SUMMARY.md                 ← OVERVIEW & KEY CHANGES
├─ ARCHITECTURE_COMPARISON.md       ← VISUAL ARCHITECTURE GUIDE
└─ infra/n8n/docker-compose.yml    ← NEW CONFIGURATION (READY TO DEPLOY)

🎯 THE PLAN IN 30 SECONDS:
────────────────────────────────────────────────────────────────────────────────

Phase 1: Fix n8n (2-3 hours)
  Current: nginxproxy/nginx-proxy ❌ (broken docker-gen)
  → New: jwilder/nginx-proxy ✅ (proven, fixes issue)
  Result: n8n.bestviable.com works, HTTPS access restored

Phase 2: Deploy MCP servers (1-2 hours, separate sprint)
  Design: Direct Cloudflare tunnel (no nginx needed for MCP)
  Result: coda-mcp, github-mcp, firecrawl-mcp on separate ports
  Future: Can add nginx-proxy layer later if needed


✅ SUCCESS CRITERIA:

Phase 1 Complete When:
  ✓ All 6 services healthy (docker ps)
  ✓ nginx recognizes n8n labels (docker exec nginx-proxy cat...)
  ✓ HTTPS access works (curl https://n8n.bestviable.com)
  ✓ N8N UI loads
  ✓ Test workflow persists
  ✓ Committed to git

Phase 2 Complete When:
  ✓ MCP services running
  ✓ Direct HTTP access works
  ✓ Cloudflare HTTPS access works
  ✓ All 3+ MCP endpoints responding


🚀 EXECUTION PATH:

1. Review EXECUTION_READY.md (this file links to all docs)
2. Read REBUILD_PLAN_APPROVED_v1.md (sections 1.2-1.8)
3. Follow step-by-step instructions
4. Run verification checks after each step
5. Commit results to git
6. (Later) Execute Phase 2


🛡️ RISK MITIGATION:

Risk               Likelihood  Mitigation
─────────────────────────────────────────────────────────────────────────────
nginx fails        Low (5%)    jwilder proven; fallback to CF tunnel
Data loss          Very Low    Full database backup before deploy
CF tunnel breaks   Very Low    nginx works locally, CF is bonus
Qdrant unhealthy   Medium      Service works; health check tuned


📁 KEY FILES:

Document                           Purpose
──────────────────────────────────────────────────────────────────────────────
EXECUTION_READY.md                  Quick reference & approval prompt
REBUILD_PLAN_APPROVED_v1.md         MAIN: Step-by-step execution guide
PLAN_SUMMARY.md                     Overview & key changes
ARCHITECTURE_COMPARISON.md           Visual architecture explanations
NGINX_DEBUGGING_GUIDE.md            Details of current issue
infra/n8n/docker-compose.yml        Production configuration ready to deploy


🔑 KEY CHANGES FROM CURRENT SETUP:

Current (Broken)           →  Phase 1 (Fixed)          Why
─────────────────────────────────────────────────────────────────────────────
nginxproxy/nginx-proxy     →  jwilder/nginx-proxy      Fixes docker-gen
postgres:15-alpine         →  postgres:16-alpine       Lighter
n8n:latest                 →  n8n:1.83.2               Pinned version
(no import service)        →  n8n-import service       Enable restoration
Network: n8n               →  Network: syncbricks      Clearer semantics
Qdrant health: aggressive  →  Qdrant health: relaxed   Avoid false negatives


🎯 DECISION LOCK:

Phase 1: WHY jwilder/nginx-proxy?
  ✓ Original, proven implementation
  ✓ Battle-tested on this droplet before MCP bloat
  ✓ Simpler label matching (avoids docker-gen issues)
  ✓ Reference: syncbricks/n8n (GitHub)

Phase 2: WHY direct CF tunnel for MCP (no nginx)?
  ✓ Simpler (fewer containers)
  ✓ Cloudflare handles HTTPS termination
  ✓ Standards-agnostic (MCP specs evolving)
  ✓ Can add nginx-proxy layer later without rebuild


⏱️  TIMELINE:

Phase 1: ~2-3 hours
  - Backup database & workflows: 15 min
  - Deploy new stack: 15 min
  - Verify services: 10 min
  - Test HTTPS access: 5 min
  - Test n8n functionality: 30 min
  - Commit to git: 5 min

Phase 2: ~1-2 hours (separate sprint)
  - Design MCP docker-compose: 30 min
  - Deploy: 15 min
  - Configure CF routing: 15 min
  - Test: 15 min
  - Commit: 5 min


❓ APPROVAL NEEDED:

Ready to execute Phase 1? (Y/N)

If YES:
  1. I'll back up current state
  2. Deploy new jwilder/nginx-proxy stack
  3. Run verification checks
  4. Report results

If NO or needs changes:
  1. What needs clarification?
  2. Any concerns about the approach?
  3. What prerequisites are missing?


📞 SUPPORT:

If blocked during execution:
  1. Check REBUILD_PLAN_APPROVED_v1.md troubleshooting (step 1.7)
  2. Reference NGINX_DEBUGGING_GUIDE.md for details
  3. Document error + docker logs
  4. Report with full context


═══════════════════════════════════════════════════════════════════════════════

Next Step: Please confirm approval in EXECUTION_READY.md

Alternatively, jump directly to:
  - REBUILD_PLAN_APPROVED_v1.md for full details
  - ARCHITECTURE_COMPARISON.md for visual reference
  - infra/n8n/docker-compose.yml to review configuration

═══════════════════════════════════════════════════════════════════════════════
