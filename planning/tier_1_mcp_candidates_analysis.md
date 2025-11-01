---
entity: research
level: strategic
zone: internal
version: v01
tags: [mcp, tier-1, oem, candidates, strategy, github, n8n, qdrant, postgresql, graphql]
source_path: /planning/tier_1_mcp_candidates_analysis.md
date: 2025-11-01
status: active
related:
  - planning/phase_1_mcp_http_native_coda.md
  - planning/context_engineering_research_v01.md
  - agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md
---

# Tier 1 MCP Candidates — Strategic Analysis

## Executive Summary

Based on your two-hemisphere SoT architecture (GitHub ↔ Coda) + context engineering needs, these MCPs should be evaluated for Tier 1 (remote HTTP-native, droplet-deployed) status:

**Priority Tier**:
1. **GitHub** (CRITICAL) — Code hemisphere of SoT
2. **n8n** (CRITICAL) — Automation orchestration backbone
3. **Memory** (CRITICAL) — Cross-session state + persistent learning
4. **Qdrant** (HIGH) — Phase 4 RAG layer foundation
5. **GraphQL** (MEDIUM) — Enhanced Coda API queries
6. **PostgreSQL** (MEDIUM) — Direct data access if needed later

---

## MCP Search Strategy

### OEM First (2025 Update)
As of November 2025, major platforms are releasing official MCPs:
- **GitHub**: Check @anthropic and @modelcontextprotocol repos
- **n8n**: New SaaS integrations likely include MCP
- **Qdrant**: Vector DB companies pushing MCP adoption
- **Others**: Anthropic announcing weekly

**Search Pattern**:
```
GitHub: github.com/[org]/[service]-mcp
NPM: npm search [service]-mcp (sort by recently updated)
Anthropic Cookbooks: github.com/anthropics/claude-cookbooks
MCP Directory: modelcontextprotocol.io (if exists by Nov 2025)
```

### Fallback Strategy
If OEM not available:
1. Look for community implementations (@modelcontextprotocol, @sgl-project, etc.)
2. Use Anthropic's cookbook examples as templates
3. Fork and modify for HTTP-native if needed
4. Last resort: Build from scratch (unlikely needed)

---

## Candidate Evaluation

### 1. GitHub MCP — CRITICAL

**Purpose**: Left hemisphere of SoT (code, PRs, issues, discussions)

**Why Tier 1**:
- Central to your architecture (GitHub ↔ Coda sync)
- Used in 80%+ of agent sessions (estimated)
- Requires centralized token management
- Performance-critical (code review workflows)

**What to Look For**:
- ✅ Official @modelcontextprotocol/server-github (verify if still maintained)
- ✅ Supports major operations: list_repos, get_file, search_code, list_prs, create_issue
- ✅ HTTP-native capability (or easily adaptable)
- ⚠️ Token scoping (personal access token vs OAuth)

**Decision Point**:
- If OEM available: Use as-is, wrap in HTTP-native
- If not available: Use fork model (same as Coda)
- Timeline: Start immediately in Phase 2 (Days 7-8)

---

### 2. n8n MCP — CRITICAL (Newly Identified)

**Purpose**: Automation orchestration (core to your system)

**Why Tier 1**:
- You already have n8n running on droplet
- Enables workflows as first-class agent tools
- Central nervous system for GitHub ↔ Coda sync
- Reduces need for custom integrations

**What You Can Do With It**:
- Agents can trigger workflows: "Create deployment workflow for this PR"
- Agents can query workflow logs: "Show me executions from last 24 hours"
- Agents can monitor automation health: "Are there failed jobs?"
- Combines with other MCPs: GitHub PR → n8n workflow → Coda document update

**What to Look For**:
- ✅ Official n8n MCP (@n8n or @anthropic)
- ✅ Can trigger workflows by name or ID
- ✅ Can query execution logs and status
- ✅ Supports webhook integration if needed
- ⚠️ Rate limiting (n8n free tier has limits)

**Decision Point**:
- If OEM available: High priority (add to Phase 2)
- If not: Consider Phase 3 (lower priority)
- Timeline: Research now, implement Phase 2 or 3

---

### 3. Memory MCP — CRITICAL (Already Planned)

**Purpose**: Cross-session state + persistent learning

**Why Tier 1**:
- Core to your context engineering architecture
- Two-tier memory (session + persistent) enables long-term learning
- Essential for "system learning over time" goal
- Feeds future meta-skills layer

**Already Identified**:
- @modelcontextprotocol/server-memory exists
- HTTP-native ready (modern implementation)
- Needs persistent storage: `/data/mcp-memory` volume

**Implementation Strategy**:
- Phase 2 (Days 9-10): Add to droplet
- File-based storage in volume mount
- Implement memory hooks in Coda/GitHub MCPs
- Track: Learned patterns, decision history, recurring issues

**Critical Success Factor**:
- Persistent storage must survive restarts
- Cross-session retrieval must work
- Enables Phase 4 RAG layer to have indexed knowledge

---

### 4. Qdrant MCP — HIGH (Phase 4 Foundation)

**Purpose**: Vector database access for RAG layer

**Why Tier 1 (Eventually)**:
- You already have Qdrant running on droplet
- Foundation for semantic search across GitHub + Coda
- Phase 4 RAG layer depends on this
- Enables "smart retrieval" vs "dump everything" approach

**What to Look For**:
- ✅ Official Qdrant MCP (likely available by Q1 2026)
- ✅ Can create/update collections
- ✅ Can perform similarity searches
- ✅ Can filter by metadata
- ⚠️ Ensure HTTP-native support

**Timeline**:
- Phase 2: Research available implementations
- Phase 4: Implement and integrate with RAG layer
- Not urgent for Phase 1

---

### 5. GraphQL MCP — MEDIUM (Enhancement)

**Purpose**: Enhanced Coda API querying

**Why Consider**:
- Coda API may have GraphQL endpoint
- Enables richer queries than REST
- Better token efficiency (fetch exactly what needed)
- Supports complex relationships (docs → tables → rows)

**What to Look For**:
- ✅ Generic GraphQL MCP (@anthropic or community)
- ✅ Can connect to any GraphQL endpoint
- ✅ Query builder or template system
- ⚠️ Might be overkill if REST sufficient

**Timeline**:
- Phase 2: Evaluate if needed (may not be)
- Phase 3+: Add if REST becomes bottleneck
- Priority: Low initially, revisit after Coda MCP stable

---

### 6. PostgreSQL MCP — MEDIUM (Optional)

**Purpose**: Direct database queries

**Why Consider**:
- Your system may need direct data access later
- PostgreSQL likely backend for n8n, future systems
- Enables complex queries without API wrapping
- Useful for reporting/analysis

**What to Look For**:
- ✅ Official @modelcontextprotocol/server-postgres
- ✅ Safe query execution (parameterized)
- ✅ Connection pooling
- ⚠️ Security critical (requires careful scoping)

**Timeline**:
- Phase 3+: Research only
- Implement only if REST/GraphQL insufficient
- Priority: Low initially

---

## Port Allocation Strategy

**Reserve for Tier 1 MCPs**:
```
8080: Coda (deployed Phase 1)
8081: GitHub (Phase 2)
8082: Memory (Phase 2)
8083: Firecrawl (Phase 2)
8084: n8n (Phase 2 or 3)
8085: Qdrant (Phase 4)
8086: GraphQL (Phase 3+, if needed)
8087: PostgreSQL (Phase 3+, if needed)
8088: (Reserve for future)
```

Each follows same pattern:
- Cloudflare Access OAuth
- HTTP-native with session state
- Token estimation
- Memory hooks

---

## Tier 1 vs Tier 2/3 Decision Matrix

| MCP | Tier 1 Rationale | Tier 2 Rationale | Decision |
|-----|------------------|------------------|----------|
| GitHub | Central to SoT; used constantly | Local dev only | **→ Tier 1** |
| n8n | Automation backbone; high value | Too new; not essential yet | **→ Tier 1 (Phase 2)** |
| Memory | Cross-session learning; critical | Insufficient for architecture | **→ Tier 1** |
| Qdrant | Future RAG layer depends on it | Can implement later with RAG | **→ Tier 1 (Phase 4)** |
| Firecrawl | Web scraping; expensive API key | Available locally if needed | **→ Tier 1 (as planned)** |
| GraphQL | Enhancement only; not essential | Can wait for REST bottleneck | **→ Tier 2/3** |
| PostgreSQL | Optional; not central | Can use SQL for reporting | **→ Tier 2/3** |

---

## Action Items for You (Research Phase)

While Phase 1 implementation happens, evaluate:

### Immediate (This Week)
- [ ] Search GitHub for `github-mcp` OR `server-github` with recent updates
- [ ] Search NPM for `n8n-mcp` OR check n8n official repos
- [ ] Check Anthropic cookbook examples for GitHub pattern
- [ ] Note which are HTTP-native vs stdio (we'll wrap as needed)

### Record
Create a simple table in your search:
| Service | Repository | Last Updated | HTTP-Native | Status |
|---------|-----------|--------------|-------------|--------|
| GitHub | [URL] | [Date] | Y/N | [Notes] |
| n8n | [URL] | [Date] | Y/N | [Notes] |

### Decision Points
For each service found:
1. Is it OEM? (Higher quality/maintenance)
2. Is it HTTP-native? (Lower implementation cost)
3. When was it last updated? (Active maintenance?)
4. Does it have good examples? (Easier to deploy)

---

## Why n8n is Critical Discovery

Your current system:
```
GitHub → n8n → Coda
```

Making n8n a first-class MCP means:
```
Agent → n8n MCP ← trigger/query workflows
  ↓
GitHub MCP ← code changes
  ↓
Coda MCP ← documentation
  ↓
Memory MCP ← learned patterns
```

This closes the loop: **Agents can orchestrate your entire system**.

---

## Implementation Order (Recommended)

**Phase 2 (Days 7-14)**:
1. GitHub MCP (Days 7-8) — OEM if available, else fork
2. Memory MCP (Days 9-10) — Standard implementation + persistent storage
3. Firecrawl MCP (Days 10-11) — As planned
4. n8n MCP (Days 11-14, if found) — If OEM available

**Phase 3 (Days 15+)**:
- Client configuration (Claude Code, Claude Desktop, n8n)
- Skills creation (mcp-context-manager, mcp-memory-bridge)
- Compaction strategy

**Phase 4+ (Month 2-4)**:
- Qdrant MCP (RAG foundation)
- GraphQL MCP (if needed)
- PostgreSQL MCP (if needed)
- Meta-skills layer

---

## Risk Management

**Risk**: Spend time searching and find nothing good
**Mitigation**: Have fallback plan ready (use forks like Coda)

**Risk**: OEM MCPs not stable yet
**Mitigation**: Test locally first before deploying to droplet

**Risk**: Too many MCPs = context bloat
**Mitigation**: Tier 1 only for critical services; defer others

---

## Success Metrics for MCP Selection

✅ **Selected well if**:
- Reduces token usage vs manual approach
- Enables new capabilities (automation, persistent memory)
- Minimal maintenance burden
- Clear examples exist

❌ **Selected poorly if**:
- Adds context bloat without benefit
- Requires constant fixes/updates
- Better alternatives exist
- Examples/docs are sparse

---

**Version**: v01
**Created**: 2025-11-01
**Status**: Active (research phase)
**Next Review**: After you complete search (record findings in this doc)
