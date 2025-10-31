# Founder HQ → Notion Integration Analysis

- entity: integration
- level: analysis
- zone: internal
- version: v01
- tags: [notion, founderhq, integration, analysis]
- source_path: /integrations/notion/ANALYSIS_founderhq_notion_integration_v01.md
- date: 2025-10-17

---

## Executive Summary

**Assessment**: **85% Aligned — Strong foundation with strategic integration opportunities**

Founder HQ (Notion migration from Coda v0.4) aligns remarkably well (95% schema match) with Portfolio context architecture. The Notion system demonstrates mature operational thinking and serves as validation of Portfolio design decisions. Integration strategy: **Hybrid approach** using MCP servers for interactive workflows + Python scripts for scheduled sync.

---

## Schema Alignment Analysis

### Entities: 95% Match

| Founder HQ Entity | Portfolio SoT Entity | Alignment | Status |
|-------------------|---------------------|-----------|--------|
| Ventures | `venture` | Perfect | ✅ |
| Offers | `offer` | Perfect | ✅ |
| Engagements | `engagement` | Perfect | ✅ |
| Projects | `project` | Perfect | ✅ |
| Tasks | `task` | Perfect | ✅ |
| Deliverables | `deliverable` | Perfect | ✅ |
| Sprints | `sprint` | Perfect | ✅ |
| Experiments | `experiment` | Perfect | ✅ |
| Areas | `area` | Perfect | ✅ |
| Workflows | `workflow` | In SoT YAML | ✅ |
| Decision Journal | `decision` (ADRs) | Conceptual | ✅ |
| Organizations | N/A | **GAP** | ⚠️ |
| People | N/A | **GAP** | ⚠️ |
| Deals | N/A | **GAP** | ⚠️ |
| Service Blueprints | N/A | **GAP** | ⚠️ |
| Process Templates | N/A | **GAP** | ⚠️ |
| Touchpoints | N/A | **GAP** | ⚠️ |
| Outcomes | N/A | Different Concept | ℹ️ |
| Topics | N/A | Tagging System | ℹ️ |

---

## Critical Gaps Identified

### Gap 1: CRM Entities Missing from Portfolio SoT

**Missing Entities**:
- Organizations (companies)
- People (contacts)
- Deals (sales pipeline)
- Touchpoints (CRM interactions)

**Impact**: Cannot track client relationships, ICP scoring, pipeline in file-based SoT

**Recommendation**: Add to `context_schemas_v03.yaml`:
```yaml
entities:
  - name: organization
    pk: organization_id
    fields:
      - {key: name, type: text, required: true}
      - {key: revenue_band, type: enum}
      - {key: icp_score, type: number}
      - {key: engagement_history, type: array[engagement_id]}
      - {key: zone, type: enum, default: private}

  - name: person
    pk: person_id
    fields:
      - {key: name, type: text, required: true}
      - {key: organization_id, type: fk}
      - {key: engagement_role, type: enum}
      - {key: warmth, type: enum}
      - {key: zone, type: enum, default: private}

  - name: deal
    pk: deal_id
    fields:
      - {key: name, type: text, required: true}
      - {key: organization_id, type: fk}
      - {key: offer_id, type: fk}
      - {key: stage, type: enum}
      - {key: value_est, type: number}
      - {key: probability, type: number}
```

### Gap 2: Service Design Entities Missing

**Missing Entities**:
- Service Blueprints (5-layer service journey maps)
- Process Templates (reusable checklists)

**Impact**: Central to "Everything is a Recipe" philosophy but undefined in Portfolio schema

**Recommendation**: Add to `context_schemas_v03.yaml`:
```yaml
entities:
  - name: service_blueprint
    pk: blueprint_id
    fields:
      - {key: name, type: text, required: true}
      - {key: offer_id, type: fk}
      - {key: customer_actions, type: markdown}
      - {key: frontstage, type: markdown}
      - {key: backstage, type: markdown}
      - {key: support_processes, type: markdown}
      - {key: evidence, type: markdown}

  - name: process_template
    pk: process_template_id
    fields:
      - {key: name, type: text, required: true}
      - {key: category, type: enum}
      - {key: checklist_md, type: markdown}
      - {key: estimated_hours, type: number}
```

### Gap 3: No Sync Strategy Defined

**Problem**: Two separate systems (Notion operational, Portfolio strategic) with no explicit data flow

**Scenarios Requiring Sync**:
1. New Engagement in Notion → Create Portfolio files?
2. Project Complete in Notion → Generate mode-aware briefs?
3. Offer Updated in Portfolio → Sync to Notion?
4. ADR Created in Portfolio → Reference in Notion?

**Solution**: See Integration Architecture section below

---

## Integration Architecture

### Three-Tier Sync Strategy

#### **Tier 1: Notion-Native (Operational, Ephemeral)**

Entities that live ONLY in Notion until promoted to Portfolio:

| Entity | Notion DB | Promotion Trigger | Portfolio Destination |
|--------|-----------|-------------------|----------------------|
| Daily Thread | ✅ | Never (TTL: 30d) | N/A (archived in Notion) |
| Tasks | ✅ | Project Complete | `/projects/{proj}/tasks.csv` |
| Sprints | ✅ | Sprint Complete | `/projects/{proj}/sprints/{sprint}/retro.md` |
| Deals | ✅ | Won → Engagement | `/engagements/{eng}/deal_history.md` |
| Touchpoints | ✅ | Quarterly | `/logs/crm_touchpoints_{Q}.csv` |
| Experiments (Active) | ✅ | Decision Made | `/decisions/{date}_experiment-{name}_v01.md` |

**Rationale**: Transactional, high-churn entities. Notion is perfect. Promote only when reaching stable archival state.

#### **Tier 2: Portfolio-First (Strategic, Durable)**

Entities that start as Portfolio files and sync TO Notion:

| Entity | Portfolio SoT | Sync to Notion | Frequency |
|--------|---------------|----------------|-----------|
| Offers | `/ventures/{v}/offers/{o}/context/offer_brief_v01.md` | ✅ | On commit |
| Service Blueprints | `/ventures/{v}/offers/{o}/service_blueprint_v01.md` | ✅ | On commit |
| Playbooks | `/context/playbooks/{playbook}.md` | ✅ | Weekly |
| ADRs | `/decisions/{date}_{topic}_v01.md` | ✅ Ref | Weekly |
| Templates | `/templates/*.md` | ❌ | N/A |

**Rationale**: Strategic assets with governance requirements (versioning, ADRs, zones). Portfolio is canonical. Notion gets read-only projection.

#### **Tier 3: Hybrid (Start Notion, Promote to Portfolio)**

Entities that start in Notion and promote to Portfolio when complete:

| Entity | Notion DB | Promotion Trigger | Portfolio Destination | Mode-Aware |
|--------|-----------|-------------------|----------------------|------------|
| Projects (Active) | ✅ | Status = Complete | `/ventures/{v}/engagements/{e}/projects/{p}/` | 3 briefs |
| Engagements (Active) | ✅ | Status = Complete | `/ventures/{v}/engagements/{e}/` | Engagement brief |
| Deliverables | ✅ | Approved | `/projects/{p}/deliverables/{d}/` | Deliverable spec |

**Rationale**: Need operational fluidity during execution but durable records after completion.

---

## Tool Selection: MCP vs Scripts vs n8n

### Decision Matrix

| Use Case | Best Tool | Rationale |
|----------|-----------|-----------|
| Ad-hoc promotion during planning chat | **MCP** | Real-time, interactive, no deployment |
| Weekly scheduled bulk sync | **Python Script** | Reliable, testable, no session dependency |
| Complex transformations | **Python Script** | Full programming, error handling |
| Event-driven sync (webhook) | **n8n** | Built-in webhooks, visual workflow |
| Interactive file generation | **MCP + Claude** | Natural language interface |
| Governed changes (PR workflow) | **MCP → GitHub** | Versioning, review gates |
| Multi-system orchestration | **n8n** | Multiple integrations, monitoring |
| Data quality validation | **Python Script** | Complex logic (metadata, zones, TTL) |

### Recommended Hybrid Approach

**Phase 1: MCP Foundation (Immediate Value)**

Install MCP servers for interactive workflows:
- `@notionhq/notion-mcp-server` — Query/update Notion databases
- `@modelcontextprotocol/server-filesystem` — Read/write Portfolio files
- `@modelcontextprotocol/server-github` (optional) — PR workflow

**Use Cases**:
- "Show me completed projects from Notion"
- "Generate Portfolio files for KD Collaboration project"
- "Validate all active projects have corresponding files"

**Benefits**:
- Immediate value during planning sessions
- Natural language interface
- No deployment/scheduling needed

**Phase 2: Scripting Layer (Reliable Automation)**

Build Python scripts for scheduled sync:
- `/integrations/notion-sync/promote_from_notion.py` — Notion → Portfolio
- `/integrations/notion-sync/sync_to_notion.py` — Portfolio → Notion
- `/integrations/notion-sync/config.yaml` — Database IDs, API keys
- `/integrations/notion-sync/test_sync.py` — Unit tests

**Schedule**: Weekly (Monday 9am) via cron

**Benefits**:
- Set and forget automation
- Complex logic supported
- Testable, maintainable
- Error handling

**Phase 3: n8n (Optional, Month 2+)**

Add n8n for event-driven workflows:
- Deal Won → Create Engagement → Slack notification
- Project Blocked → Alert via email
- Sprint Complete → Generate retro report

**Defer until**: Need real-time sync or multi-system orchestration

---

## Weekly Promotion Ritual

**Schedule**: Every Monday 9am (aligned with sprint planning)

**Steps**:
1. **Run promotion script** (`promote_from_notion.py`):
   - Fetch completed Projects/Engagements from Notion
   - Generate Portfolio files with mode-aware briefs
   - Create ADRs for decisions
   - Log to `/logs/context_actions.csv`

2. **Run sync script** (`sync_to_notion.py`):
   - Read updated Offers/Playbooks from Portfolio
   - Push to Notion (upsert)
   - Log actions

3. **Manual review** (10-15 min):
   - Check promoted files for quality
   - Verify ADRs capture decisions
   - Archive stale Notion records (TTL)

**Automation**: GitHub Actions or cron job

---

## Mode-Aware Thinking (Already Present!)

Founder HQ **implicitly implements** Portfolio's Planning/Execution/Review cycle:

**Founder HQ Pattern** → **Portfolio Mode**
- Morning Ritual (Daily Thread) → **Planning Mode** (set 3 MITs)
- Task Execution (Sprint Board) → **Execution Mode** (precise constraints)
- Evening Ritual + Sprint Retro → **Review Mode** (wins, blockers, learnings)

**Insight**: Your operational system already practices mode-aware context switching. Portfolio architecture just makes it explicit with separate brief templates.

---

## Notion Migration Plan Assessment

**Migration Plan v2.0 Evaluation**:

✅ **Excellent**:
- Two-way relations everywhere (critical for navigability)
- Normalized field names (consistency)
- Phased approach (Foundation → Commercial → Execution)
- Formula-driven inheritance

⚠️ **Concerns**:
1. **Unique ID Strategy**: You have both UUID and human-readable IDs. **Recommendation**: Use ULID for `Unique ID` (canonical PK), human IDs as display-only.

2. **Formula Complexity**: Notion formulas limited vs Portfolio retrieval. Example: Engagement Health Score (NPS + approval rates) won't work in Notion formula engine. **Solution**: Calculate in sync script, write to Notion.

3. **Missing Database IDs**: "TO FIND" list for Sprints, Deliverables, etc. **Blocker**: Create these first before Session 3.

4. **No Test Data**: How to verify formulas? **Solution**: Create test venture with fake data first.

---

## Concrete Next Steps

### Immediate (Before Continuing Notion Migration)

1. ✅ **Update Portfolio SoT to v0.3** with CRM and Service Design entities
2. ✅ **Create test venture in Notion** with fake data to validate formulas
3. ⚠️ **Find missing database IDs** (Sprints, Daily Thread, etc.)
4. ✅ **Decide on ID strategy**: ULID as canonical PK

### Short-Term (Parallel to Migration)

5. ✅ **Build `/integrations/notion-sync/` directory**
6. ⏳ **Write promotion script** (`promote_from_notion.py`)
7. ⏳ **Write sync script** (`sync_to_notion.py`)
8. ✅ **Create ADR**: `/decisions/2025-10-17_notion-integration-strategy_v01.md`

### Medium-Term (Post-Migration)

9. ⏳ **Install MCP servers** (Notion + Filesystem)
10. ⏳ **Set up weekly promotion ritual** (Monday sprint planning + sync)
11. ⏳ **Build Notion → Portfolio file generator** (completed Projects/Engagements)
12. ⏳ **Implement TTL automation** (archive stale Daily Threads, promote learnings)

---

## Success Metrics

**Integration Working Well When**:
1. All completed Projects have Portfolio files with 3 mode-aware briefs
2. All active Offers in Portfolio appear in Notion (read-only)
3. Weekly sync runs automatically with 0 manual intervention
4. Promotion workflow takes <15 min/week
5. No data loss or divergence between systems
6. All Portfolio files have proper metadata headers
7. Zone inheritance enforced (no private data in public files)

**Red Flags**:
- Manual copying between systems
- Sync failing silently
- Data divergence (Notion says X, Portfolio says Y)
- Stale data (last sync >7 days ago)
- Missing ADRs for significant decisions

---

## References

- **Founder HQ Context**: `/portfolio/founder-hq-v041-context (1).txt`
- **Notion Migration Plan**: `/portfolio/founderhq-migration-v2.md`
- **Portfolio Architecture**: `/portfolio/architecture-spec_v0.3.md`
- **Portfolio SoT Schema**: `/portfolio/sot/context_schemas_v02.yaml`
- **Integration Strategy ADR**: `/portfolio/decisions/2025-10-17_notion-integration-strategy_v01.md`

---

**Version**: 0.1
**Date**: 2025-10-17
**Status**: Analysis Complete, Implementation Pending
**Next Action**: Create ADR and begin Phase 1 (MCP setup)
