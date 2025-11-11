# ADR: Notion Integration Strategy

- entity: decision
- level: policy
- zone: internal
- version: v01
- tags: [adr, notion, integration, founderhq]
- source_path: /decisions/2025-10-17_notion-integration-strategy_v01.md
- date: 2025-10-17

## Status
**ACCEPTED**

## Context

### Problem Statement
Need to integrate Founder HQ operational system (migrating from Coda to Notion) with Portfolio file-based Source of Truth while maintaining:
1. **Operational fluidity** for daily work (fast, transactional, live updates)
2. **Strategic governance** for durable assets (versioning, ADRs, zone control, TTL)
3. **Single logical truth** (no conflicting data between systems)
4. **Mode-aware workflows** (Planning/Execution/Review)

### Current State
- **Portfolio**: File-based SoT with governance (MD, YAML, CSV), mode-aware briefs, ADRs, zone inheritance
- **Founder HQ**: Operational system in Notion with 20+ databases, daily workflow, CRM, project management
- **Gap**: No sync mechanism; risk of dual source-of-truth divergence

### Requirements
- Solo operator scale (low maintenance overhead)
- Weekly promotion workflow acceptable (not real-time)
- Must support interactive queries during planning sessions
- Must enforce Portfolio governance (metadata headers, zones, TTL)
- Must preserve Notion's operational speed and usability

---

## Options Considered

### Option A: Notion as Read-Only Projection

**Approach**: Portfolio files are canonical SoT; Notion is generated view.

**Flow**:
```
Portfolio (SoT) → [Sync Script] → Notion (Projection)
```

**Pros**:
- Clear source of truth (files only)
- Governance enforced (ADRs, zones, TTL)
- Easy rollback (regenerate Notion from files)

**Cons**:
- Notion can't be primary input (update files first)
- Two-step workflow (edit file → sync)
- Sync lag

**Assessment**: Too restrictive for operational work. Friction would prevent adoption.

---

### Option B: Notion as Write-Ahead Log (Hybrid) ✅ SELECTED

**Approach**: Notion is where operational work happens; Portfolio captures promoted/archived state.

**Flow**:
```
Notion (Transactional) → [Promotion] → Portfolio (Canonical)
       ↓                                        ↑
  Daily Ops                            Weekly Promotion
```

**Tiers**:
- **Tier 1 (Notion-Native)**: Daily Thread, Tasks, Sprints, Deals, Touchpoints — ephemeral, high-churn
- **Tier 2 (Portfolio-First)**: Offers, Service Blueprints, Playbooks, ADRs — strategic, durable
- **Tier 3 (Hybrid)**: Projects, Engagements, Deliverables — start Notion, promote when complete

**Pros**:
- Notion remains fast, operational, live
- No friction in daily work
- Portfolio captures promoted/archival state
- Aligns with TTL policy (Notion = ephemeral, Portfolio = durable)
- Mode-aware promotion (generate 3 briefs when project completes)

**Cons**:
- Notion becomes partial SoT (dual-source risk)
- Requires explicit promotion workflow
- Potential divergence if promotion lags

**Mitigation**:
- Weekly promotion ritual (Monday 9am with sprint planning)
- Automation via cron/GitHub Actions
- Monitoring dashboard (last sync, entity counts, errors)
- Clear tier boundaries (documented in integration spec)

**Assessment**: Best balance of operational speed + strategic governance for solo operator.

---

### Option C: Bidirectional Real-Time Sync

**Approach**: Keep Notion and Portfolio in perfect sync at all times.

**Flow**:
```
Portfolio Files ←→ [Real-time Sync] ←→ Notion Databases
```

**Pros**:
- Single logical SoT (distributed physically)
- Edit anywhere, see everywhere

**Cons**:
- High complexity (conflict resolution, race conditions)
- Sync errors catastrophic (data loss, corruption)
- Difficult to govern (which side "wins"?)
- Overkill for solo operator scale

**Assessment**: Defer until 5+ team members or production-critical need. Not warranted now.

---

## Decision

**Selected**: **Option B — Notion as Write-Ahead Log (Hybrid)**

Implement three-tier sync strategy with MCP for interactive workflows + Python scripts for scheduled sync.

---

## Implementation Details

### Tool Selection

| Tool | Use Case | Rationale |
|------|----------|-----------|
| **MCP Servers** | Interactive promotion during planning chat | Real-time, natural language, no deployment |
| **Python Scripts** | Weekly scheduled sync | Reliable, testable, complex logic support |
| **n8n** (future) | Event-driven workflows | Defer until need real-time or multi-system |

### Sync Boundaries (Three Tiers)

#### Tier 1: Notion-Native (Operational, Ephemeral)
- **Entities**: Daily Thread, Tasks, Sprints, Deals, Touchpoints, Experiments (active)
- **Lifespan**: Short (14-30 days TTL)
- **Promotion**: Only when reaching stable state (e.g., Sprint Complete → retro.md)

#### Tier 2: Portfolio-First (Strategic, Durable)
- **Entities**: Offers, Service Blueprints, Playbooks, ADRs, Templates
- **Source**: Portfolio files (versioned, governed)
- **Sync**: Portfolio → Notion (read-only projection)
- **Frequency**: On commit (git hook) or weekly

#### Tier 3: Hybrid (Start Notion, Promote Portfolio)
- **Entities**: Projects, Engagements, Deliverables
- **Flow**: Create in Notion → Work operationally → Complete → Promote to Portfolio
- **Promotion**: Generates mode-aware briefs (planning/execution/review)

### Weekly Promotion Ritual

**Schedule**: Monday 9am (with sprint planning)

**Steps**:
1. Run `promote_from_notion.py` — Generate Portfolio files from completed Notion entities
2. Run `sync_to_notion.py` — Push updated Portfolio offers/playbooks to Notion
3. Manual review (10-15 min) — Verify quality, ADRs, archive stale records

**Automation**: Cron job or GitHub Actions

### MCP Configuration

**Servers to Install**:
- `@notionhq/notion-mcp-server` — Query/update Notion databases
- `@modelcontextprotocol/server-filesystem` — Read/write Portfolio files
- `@modelcontextprotocol/server-github` (optional) — PR workflow for governed changes

**Usage**:
- Ad-hoc queries: "Show completed projects"
- File generation: "Create engagement files from Notion"
- Validation: "Check all projects have Portfolio files"

---

## Consequences

### Positive
- ✅ Operational fluidity maintained (Notion fast for daily work)
- ✅ Strategic governance enforced (Portfolio for durable assets)
- ✅ Clear sync boundaries (Tier 1/2/3 documented)
- ✅ Mode-aware promotion (3 briefs per project)
- ✅ Low maintenance (weekly automation, 15 min review)
- ✅ Interactive workflows via MCP (natural language queries)
- ✅ TTL enforcement (ephemeral in Notion, promoted to Portfolio)
- ✅ Zone inheritance maintained (Portfolio controls sensitivity)

### Negative
- ⚠️ Dual partial SoT (Notion for operational, Portfolio for strategic)
- ⚠️ Sync lag acceptable but present (weekly not real-time)
- ⚠️ Promotion discipline required (automation helps but not enforced)
- ⚠️ Potential divergence if promotion skipped
- ⚠️ Two systems to maintain (Notion + Portfolio + sync scripts)

### Neutral
- ℹ️ Script maintenance required (Python code to update)
- ℹ️ MCP servers require Claude session for interactive use
- ℹ️ Weekly ritual becomes dependency (must not skip)

---

## Mitigations

### For Divergence Risk
- **Monitoring dashboard**: Track last sync, entity counts, health
- **Automated alerts**: Email if sync fails or >7 days stale
- **Validation script**: Check for mismatches (Notion vs Portfolio)

### For Sync Lag
- **Clear tier boundaries**: Document which entities sync when
- **User expectation management**: Weekly sync is design, not bug
- **Critical path**: Identify entities needing faster sync (add to Tier 1)

### For Maintenance Burden
- **Comprehensive tests**: Unit + integration tests for scripts
- **Documentation**: README with setup, troubleshooting, architecture
- **Logging**: All actions to `/logs/context_actions.csv` for debugging

---

## Success Metrics

**Integration Working Well**:
1. All completed Projects → Portfolio files with 3 mode-aware briefs (100%)
2. All active Offers in Portfolio → appear in Notion (100%)
3. Weekly sync success rate ≥ 95%
4. Promotion workflow time < 15 min/week
5. Zero data loss incidents
6. All Portfolio files have metadata headers (100%)
7. Zone inheritance enforced (no violations)

**Review Schedule**: Monthly (first Monday) — assess metrics, tune as needed

---

## Future Considerations

### When to Add n8n (Phase 3)
- Need real-time sync (not weekly)
- Adding more systems (Slack, Email, Google Sheets)
- Want monitoring/alerting beyond logs
- Team grows beyond solo operator

### When to Reconsider Bidirectional (Option C)
- Team size ≥ 5 people
- Multiple users editing same entities
- Real-time collaboration required
- Production-critical sync dependency

### Portfolio SoT Expansion
- **Add CRM entities**: organization, person, deal (currently only in Notion)
- **Add service design entities**: service_blueprint, process_template
- **Update to v0.3**: Incorporate learnings from Notion migration

---

## References

- **Analysis**: `/integrations/notion/ANALYSIS_founderhq_notion_integration_v01.md`
- **Integration Spec**: `/integrations/notion/INTEGRATION_SPEC_v01.md`
- **Founder HQ Context**: `/portfolio/founder-hq-v041-context (1).txt`
- **Notion Migration Plan**: `/portfolio/founderhq-migration-v2.md`
- **Portfolio Architecture**: `/portfolio/architecture-spec_v0.3.md`

---

## Approval

**Proposed By**: Claude (AI Assistant)
**Date**: 2025-10-17
**Status**: Accepted
**Next Review**: 2025-11-17 (1 month)
