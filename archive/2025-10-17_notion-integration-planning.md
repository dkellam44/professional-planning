# Session: Notion Integration Planning

- entity: session
- level: summary
- zone: internal
- version: v01
- tags: [session, notion, integration, planning, founderhq]
- source_path: /context/sessions/2025-10-17_notion-integration-planning.md
- date: 2025-10-17

---

## Session Overview

**Date**: 2025-10-17
**Duration**: ~2 hours
**Participants**: David Kellam + Claude (AI Assistant)
**Focus**: Analyze Founder HQ (Coda → Notion migration) integration with Portfolio context architecture

---

## Objectives

1. Evaluate Founder HQ Notion system design against Portfolio SoT schema
2. Identify alignment, gaps, and integration opportunities
3. Design sync strategy between Notion (operational) and Portfolio (strategic)
4. Recommend tooling approach (MCP vs Scripts vs n8n)
5. Document decisions and create implementation plan

---

## Key Outcomes

### 1. Schema Alignment Assessment
**Result**: **95% match** between Founder HQ entities and Portfolio SoT

**Perfect Alignments**:
- Ventures, Offers, Engagements, Projects, Tasks, Deliverables, Sprints, Experiments, Areas, Workflows

**Gaps Identified**:
- CRM entities (Organizations, People, Deals, Touchpoints) missing from Portfolio
- Service design entities (Service Blueprints, Process Templates) missing from Portfolio

**Recommendation**: Expand Portfolio SoT to v0.3 with CRM and service design entities

---

### 2. Integration Strategy Decision

**Selected Approach**: **Hybrid — Notion as Write-Ahead Log**

**Three-Tier Sync Strategy**:
- **Tier 1 (Notion-Native)**: Ephemeral operational data (Daily Thread, Tasks, Sprints)
- **Tier 2 (Portfolio-First)**: Strategic durable assets (Offers, Playbooks, ADRs)
- **Tier 3 (Hybrid)**: Start Notion, promote when complete (Projects, Engagements)

**Promotion Workflow**: Weekly Monday 9am ritual (15 min)

**Documented In**: `/decisions/2025-10-17_notion-integration-strategy_v01.md`

---

### 3. Tooling Decisions

**Hybrid Approach**:
- **MCP Servers** (Phase 1): Interactive workflows during planning sessions
  - Notion MCP: Query/update databases
  - Filesystem MCP: Read/write Portfolio files
  - Use Case: Ad-hoc promotion, validation, queries

- **Python Scripts** (Phase 2): Scheduled automation
  - `promote_from_notion.py`: Notion → Portfolio (completed work)
  - `sync_to_notion.py`: Portfolio → Notion (strategic assets)
  - Schedule: Weekly via cron/GitHub Actions

- **n8n** (Phase 3, Optional): Event-driven workflows
  - Defer until need real-time sync or multi-system orchestration

**Rationale**: MCP for immediate interactive value + Scripts for reliable automation

---

### 4. Mode-Aware Insight

**Discovery**: Founder HQ already implements Portfolio's mode-aware workflow!

**Mapping**:
- Morning Ritual (Daily Thread) → **Planning Mode** (set 3 MITs)
- Task Execution (Sprint Board) → **Execution Mode** (precise work)
- Evening Ritual + Sprint Retro → **Review Mode** (learnings)

**Implication**: Operational system validates Portfolio architecture design

---

## Artifacts Created

1. **Analysis Document**: `/integrations/notion/ANALYSIS_founderhq_notion_integration_v01.md`
   - Comprehensive schema alignment analysis
   - Gap identification
   - Three-tier sync strategy
   - Tool selection decision matrix
   - Migration plan assessment

2. **ADR**: `/decisions/2025-10-17_notion-integration-strategy_v01.md`
   - Context and problem statement
   - Three options evaluated
   - Decision rationale (Option B: Hybrid)
   - Implementation details
   - Consequences and mitigations

3. **Session Summary**: This document

---

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Use Hybrid sync strategy | Best balance operational speed + governance | ✅ Accepted |
| MCP + Scripts (not n8n yet) | Immediate value + reliable automation, defer complexity | ✅ Accepted |
| Three-tier entity classification | Clear sync boundaries reduce confusion | ✅ Accepted |
| Weekly promotion ritual (Monday 9am) | Aligns with sprint planning, manageable time commitment | ✅ Accepted |
| Expand Portfolio SoT to v0.3 | Must include CRM and service design entities | ⏳ Pending |

---

## Action Items

### Immediate (Before Continuing Notion Migration)
- [ ] Update Portfolio SoT to v0.3 with CRM entities (organization, person, deal)
- [ ] Update Portfolio SoT to v0.3 with service design entities (service_blueprint, process_template)
- [ ] Create test venture in Notion with fake data
- [ ] Find missing Notion database IDs (Sprints, Deliverables, etc.)
- [ ] Decide on ID strategy (recommendation: ULID as canonical PK)

### Short-Term (Parallel to Notion Migration)
- [ ] Build `/integrations/notion-sync/` directory structure
- [ ] Write `promote_from_notion.py` (Notion → Portfolio promotion script)
- [ ] Write `sync_to_notion.py` (Portfolio → Notion sync script)
- [ ] Create `config.yaml` (Notion database IDs, API keys)
- [ ] Write test suite (`test_sync.py`)

### Medium-Term (Post-Migration)
- [ ] Install MCP servers (Notion + Filesystem + GitHub optional)
- [ ] Configure Claude Code for MCP access
- [ ] Set up weekly promotion ritual automation (cron or GitHub Actions)
- [ ] Build monitoring dashboard (last sync, entity counts, errors)
- [ ] Implement TTL automation (archive stale records, promote learnings)

---

## Insights & Learnings

### 1. Operational System Validates Architecture
Founder HQ (designed before formal Portfolio architecture) exhibits same patterns (mode-awareness, hierarchical entities, governance). **Conclusion**: Portfolio architecture formalizes proven practice, not theoretical design.

### 2. Notion Migration is Well-Designed
Two-way relations, normalized fields, phased approach all align with best practices. Minor gaps (missing DB IDs, formula complexity) easily addressable.

### 3. Integration is the Missing Layer
Both systems are solid independently. Integration design (Tier 1/2/3, MCP + Scripts) bridges operational fluidity with strategic governance.

### 4. Weekly Ritual is Key
15-minute Monday morning promotion ritual prevents divergence, enforces governance, and creates learning feedback loop.

---

## Next Session Recommendations

### Continue Notion Migration (Session 2: Commercial Management)
- Organizations, People, Deals, Engagements
- Ensure Unique IDs use ULID strategy
- Test formulas with fake data
- Document database IDs as discovered

### Begin Integration Implementation (Parallel Track)
- Update Portfolio SoT to v0.3
- Install MCP servers and test interactive workflows
- Stub out Python scripts (directory structure, config, basic functions)

---

## References

- **Analysis**: `/integrations/notion/ANALYSIS_founderhq_notion_integration_v01.md`
- **ADR**: `/decisions/2025-10-17_notion-integration-strategy_v01.md`
- **Founder HQ v0.4.1 Context**: `/portfolio/founder-hq-v041-context (1).txt`
- **Founder HQ v0.4.2 Context**: `/portfolio/founder-hq-v042-context.txt`
- **Notion Migration Plan v1**: `/portfolio/founderhq-migration-plan.txt`
- **Notion Migration Plan v2**: `/portfolio/founderhq-migration-v2.md`
- **Portfolio Architecture**: `/portfolio/architecture-spec_v0.3.md`
- **Portfolio SoT Schema**: `/portfolio/sot/context_schemas_v02.yaml`
- **Portfolio Repo Structure**: `/portfolio/repo_structure_v01.json`

---

## Tags for Future Retrieval

`#notion` `#founderhq` `#integration` `#sync-strategy` `#mcp` `#hybrid-approach` `#three-tier` `#weekly-promotion` `#mode-aware` `#schema-alignment`

---

**Session Status**: Complete
**Documentation Status**: Comprehensive
**Implementation Status**: Planned, not started
**Next Review**: 2025-10-24 (1 week) — Progress check on Notion migration + integration setup
