# Notion Integration — Quick Start Guide

- entity: integration
- level: documentation
- zone: internal
- version: v01
- tags: [notion, quick-start, integration]
- source_path: /integrations/notion/QUICK_START.md
- date: 2025-10-17

---

## What Got Saved from This Session

✅ **Comprehensive Analysis**: `/integrations/notion/ANALYSIS_founderhq_notion_integration_v01.md` (full schema alignment, gap analysis, tooling recommendations)

✅ **ADR (Decision Record)**: `/decisions/2025-10-17_notion-integration-strategy_v01.md` (formal decision: Hybrid sync strategy with 3 tiers)

✅ **Session Summary**: `/context/sessions/2025-10-17_notion-integration-planning.md` (high-level overview, outcomes, action items)

✅ **Context Actions Log**: `/logs/context_actions.csv` (session logged for audit trail)

---

## TL;DR — What We Decided

**Integration Strategy**: **Hybrid — Notion as Write-Ahead Log**

**Three Tiers**:
1. **Tier 1 (Notion-Native)**: Daily Thread, Tasks, Sprints, Deals — stay in Notion (ephemeral)
2. **Tier 2 (Portfolio-First)**: Offers, Playbooks, ADRs — start in Portfolio, sync to Notion (strategic)
3. **Tier 3 (Hybrid)**: Projects, Engagements — start in Notion, promote to Portfolio when complete

**Tools**:
- **MCP Servers** (Phase 1) — Interactive workflows during planning sessions
- **Python Scripts** (Phase 2) — Weekly scheduled sync (Monday 9am)
- **n8n** (Phase 3, Optional) — Defer until need real-time or multi-system orchestration

**Weekly Ritual**: Monday 9am (15 min) — Promote completed work, sync strategic assets, review quality

---

## Your Next Steps

### Immediate (This Week)

1. **Continue Notion Migration** (Session 2: Commercial Management)
   - Organizations, People, Deals, Engagements
   - Use ULID for Unique ID (canonical PK)
   - Find missing database IDs (Sprints, Deliverables, etc.)

2. **Update Portfolio SoT to v0.3**
   - Add CRM entities: organization, person, deal
   - Add service design entities: service_blueprint, process_template
   - Document: `/sot/context_schemas_v03.yaml`

### Short-Term (Next 2 Weeks)

3. **Install MCP Servers**
   ```bash
   npm install -g @notionhq/notion-mcp-server
   npm install -g @modelcontextprotocol/server-filesystem
   ```

4. **Configure Claude Code for MCP**
   - Add to `.claude/config.json`
   - Test: "List Notion databases using MCP"

5. **Stub Out Integration Scripts**
   - Create `/integrations/notion-sync/` directory
   - Files: `promote_from_notion.py`, `sync_to_notion.py`, `config.yaml`, `test_sync.py`
   - No full implementation yet — just structure

### Medium-Term (Next Month)

6. **Implement Promotion Script** (`promote_from_notion.py`)
   - Fetch completed Projects/Engagements from Notion
   - Generate mode-aware briefs (planning/execution/review)
   - Create ADRs for decisions
   - Log to context_actions.csv

7. **Implement Sync Script** (`sync_to_notion.py`)
   - Read Offers/Playbooks from Portfolio
   - Push to Notion (upsert)
   - Handle conflicts (Portfolio wins)

8. **Set Up Weekly Automation**
   - Cron job: Monday 9am
   - Run both scripts
   - Send completion notification

---

## Quick Reference: When to Use What

| Scenario | Tool | Example |
|----------|------|---------|
| "Show me completed projects" | **MCP** | Interactive query during planning chat |
| "Create engagement files for KD project" | **MCP** | Generate files on-demand |
| Weekly bulk sync | **Python Script** | Automated, scheduled |
| Complex transformation | **Python Script** | Generate mode-aware briefs |
| Real-time Deal Won → Engagement | **n8n** (future) | Event-driven workflow |

---

## Files to Read Next

**For Full Context**:
1. `/integrations/notion/ANALYSIS_founderhq_notion_integration_v01.md` — Comprehensive analysis
2. `/decisions/2025-10-17_notion-integration-strategy_v01.md` — Formal decision record

**For Implementation**:
3. `/portfolio/sot/context_schemas_v02.yaml` — Current schema (update to v0.3)
4. `/portfolio/templates/planning_brief_v01.md` — Project brief templates (3 modes)
5. `/portfolio/founderhq-migration-v2.md` — Notion migration progress

---

## Key Insights from This Session

1. **95% Schema Match** — Your Founder HQ design validates Portfolio architecture
2. **Mode-Aware Already Present** — Daily Thread ritual is Planning/Execution/Review in practice
3. **CRM/Service Design Gaps** — Portfolio needs expansion to match Notion's operational entities
4. **Hybrid is Right Approach** — Balance operational speed + strategic governance for solo operator
5. **Weekly Ritual is Key** — 15 min Monday automation prevents divergence

---

## Questions? Start Here

**"How do I know which entity goes in which tier?"**
→ Read "Three-Tier Sync Strategy" in ANALYSIS doc

**"When should I use MCP vs Scripts?"**
→ Read "Tool Selection Decision Matrix" in ANALYSIS doc

**"How do I set up the weekly sync?"**
→ Read "Weekly Promotion Ritual" in ADR doc

**"What's the file structure for scripts?"**
→ See `/integrations/notion-sync/` (to be created)

---

## Status

**Analysis**: ✅ Complete
**Decision**: ✅ Documented (ADR)
**Implementation**: ⏳ Not Started
**Notion Migration**: 🔄 In Progress (Session 1 complete)

---

**Last Updated**: 2025-10-17
**Next Review**: 2025-10-24 (1 week progress check)
