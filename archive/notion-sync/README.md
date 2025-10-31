# Notion Sync Scripts

- entity: integration
- level: documentation
- zone: internal
- version: v01
- tags: [notion, sync, integration, scripts]
- source_path: /integrations/notion-sync/README.md
- date: 2025-10-17

---

## Purpose

Automated sync scripts between Notion (operational system) and Portfolio (strategic SoT).

**Integration Strategy**: Hybrid — Notion as Write-Ahead Log (see `/decisions/2025-10-17_notion-integration-strategy_v01.md`)

---

## Directory Contents

### Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `prefill_ulids.py` | Backfill ULIDs for Notion records | ✅ Ready |
| `promote_from_notion.py` | Notion → Portfolio promotion | ⏳ Planned |
| `sync_to_notion.py` | Portfolio → Notion sync | ⏳ Planned |
| `test_sync.py` | Unit tests for sync logic | ⏳ Planned |

### Configuration

| File | Purpose | Status |
|------|---------|--------|
| `config.yaml` | Database IDs, API keys | ⏳ Planned |
| `requirements.txt` | Python dependencies | ⏳ Planned |

---

## Quick Start

### 1. Install Dependencies

```bash
pip install notion-client python-ulid pyyaml
```

### 2. Set Notion API Token

```bash
export NOTION_API_TOKEN="secret_your_token_here"
```

**How to Get Token:**
1. Go to https://www.notion.so/my-integrations
2. Click "New integration"
3. Name: "Portfolio Sync"
4. Associated workspace: Your workspace
5. Copy "Internal Integration Token"
6. Share databases with integration (in Notion: Database → ... → Add connections → Portfolio Sync)

### 3. Run ULID Backfill

**Dry run (preview):**
```bash
python prefill_ulids.py --dry-run --all
```

**Backfill specific databases:**
```bash
python prefill_ulids.py --databases ventures offers projects
```

**Backfill all databases:**
```bash
python prefill_ulids.py --all
```

---

## Script Details

### prefill_ulids.py

**Purpose**: Generate ULIDs for Notion records with empty "Unique ID" fields.

**Usage:**
```bash
# List available databases
python prefill_ulids.py --list

# Dry run (preview changes)
python prefill_ulids.py --dry-run --databases ventures offers

# Backfill all databases
python prefill_ulids.py --all

# Backfill specific databases
python prefill_ulids.py --databases ventures offers organizations people deals engagements projects tasks
```

**What it does:**
1. Queries Notion databases for records with empty "Unique ID" field
2. Generates ULID for each record
3. Updates Notion via API
4. Logs actions to `/logs/context_actions.csv`

**Safety:**
- Idempotent: safe to run multiple times (only fills empty fields)
- Dry-run mode available (preview without writing)
- Logs all changes

**When to run:**
- After Session 1 (Ventures, Offers, Topics, Areas)
- After Session 2 (Organizations, People, Deals, Engagements)
- After Session 3 (Projects, Tasks, Sprints)
- Anytime new records are created without Unique ID

---

### promote_from_notion.py (Planned)

**Purpose**: Promote completed Notion work to Portfolio SoT.

**Flow:**
```
Notion (Complete Projects/Engagements)
  → Generate mode-aware briefs (planning/execution/review)
  → Create ADRs for decisions
  → Write to Portfolio files
  → Log to context_actions.csv
```

**Tier 3 Entities (Start Notion, Promote Portfolio):**
- Projects (Complete)
- Engagements (Complete)
- Deliverables (Approved)

**Schedule**: Weekly Monday 9am (with sprint planning)

**Status**: ⏳ Not started

---

### sync_to_notion.py (Planned)

**Purpose**: Sync Portfolio strategic assets to Notion (read-only projection).

**Flow:**
```
Portfolio (Offers, Playbooks, ADRs)
  → Read from files
  → Upsert to Notion (create or update)
  → Portfolio wins conflicts
  → Log to context_actions.csv
```

**Tier 2 Entities (Portfolio-First):**
- Offers
- Service Blueprints
- Playbooks
- ADRs (reference only)
- Templates

**Schedule**: Weekly Monday 9am (with sprint planning)

**Status**: ⏳ Not started

---

## Three-Tier Sync Strategy

### Tier 1: Notion-Native (Operational, Ephemeral)
**Stay in Notion, do NOT sync to Portfolio:**
- Daily Thread (TTL: 30 days)
- Tasks (ephemeral, high-churn)
- Sprints (active only, promote retro when complete)
- Deals (pipeline, promote when won)
- Touchpoints (CRM, archive quarterly)
- Experiments (active, promote decision when complete)

**Promotion Trigger**: Only when reaching stable state (e.g., Sprint Complete → retro.md)

---

### Tier 2: Portfolio-First (Strategic, Durable)
**Create in Portfolio, sync TO Notion (read-only):**
- Offers
- Service Blueprints
- Playbooks
- ADRs
- Templates

**Sync Direction**: Portfolio → Notion (one-way)
**Frequency**: On commit (git hook) or weekly
**Conflicts**: Portfolio wins

---

### Tier 3: Hybrid (Start Notion, Promote Portfolio)
**Create in Notion, promote when complete:**
- Projects (Complete → portfolio files with 3 mode-aware briefs)
- Engagements (Complete → engagement brief)
- Deliverables (Approved → deliverable spec)

**Sync Direction**: Notion → Portfolio (promotion)
**Frequency**: Weekly (or ad-hoc via MCP)
**Promotion**: Generates mode-aware briefs (planning/execution/review)

---

## Weekly Promotion Ritual

**Schedule**: Every Monday 9am (aligned with sprint planning)

**Steps:**
1. Run `promote_from_notion.py` (10 min)
   - Fetch completed Projects/Engagements from Notion
   - Generate Portfolio files with mode-aware briefs
   - Create ADRs for decisions

2. Run `sync_to_notion.py` (5 min)
   - Read updated Offers/Playbooks from Portfolio
   - Push to Notion (upsert)

3. Manual review (10-15 min)
   - Check promoted files for quality
   - Verify ADRs capture decisions
   - Archive stale Notion records (TTL)

**Automation**: Cron job or GitHub Actions (future)

---

## Configuration Reference

### Environment Variables

```bash
# Required
export NOTION_API_TOKEN="secret_..."

# Optional
export PORTFOLIO_ROOT="/Users/davidkellam/portfolio"
export LOG_PATH="/Users/davidkellam/portfolio/logs/context_actions.csv"
```

### config.yaml (Planned)

```yaml
notion:
  api_token: ${NOTION_API_TOKEN}

  databases:
    ventures:
      id: "2845c4eb-9526-8182-8ccf-000b14d4c431"
      entity: venture
      unique_id_field: "Unique ID"
      human_id_field: "Venture ID"

    # ... (see /integrations/notion/database_ids_reference.md for full list)

portfolio:
  root: ${PORTFOLIO_ROOT}
  sot_path: sot/
  ventures_path: ventures/
  decisions_path: decisions/
  logs_path: logs/

sync:
  tier1_entities: [daily_thread, tasks, sprints, deals, touchpoints, experiments]
  tier2_entities: [offer, service_blueprint, playbook, decision]
  tier3_entities: [project, engagement, deliverable]

  promotion_triggers:
    project: ["Status == Complete"]
    engagement: ["Status == Complete"]
    deliverable: ["Approved == true"]
```

---

## Troubleshooting

### Error: NOTION_API_TOKEN not set
```bash
export NOTION_API_TOKEN="secret_your_token_here"
```

### Error: Database not found
- Verify database ID in `/integrations/notion/database_ids_reference.md`
- Check integration has access to database (Notion: Database → ... → Add connections)

### Error: Permission denied
- Check integration permissions (Settings & Members → Integrations)
- Ensure "Content" capabilities enabled (Read, Update, Insert)

### ULID backfill fails silently
- Check if "Unique ID" field exists in database
- Verify field type is "Text" or "Rich text" (not "Number" or "Formula")
- Check Notion API rate limits (3 requests/second)

### Sync conflicts
- Portfolio wins (Tier 2)
- Notion wins (Tier 1)
- Promotion only (Tier 3, one-way)

---

## Monitoring

### Logs
All actions logged to `/logs/context_actions.csv`:
```csv
ts,agent,action,entity,path,latency_ms,token_in,token_out,success,notes
2025-10-17T14:00:00Z,prefill_ulids_v01,ulid_backfill,venture,/integrations/notion-sync/prefill_ulids.py,0,0,0,true,5/5 records updated in ventures
```

### Success Metrics
- All Unique IDs populated (100%)
- Weekly sync success rate ≥ 95%
- Zero data loss incidents
- All Portfolio files have metadata headers (100%)

---

## Next Steps

### Immediate
1. Run ULID backfill after each migration session
2. Verify all records have stable Unique IDs

### Short-Term (Next 2 Weeks)
3. Build `promote_from_notion.py` (Tier 3 promotion)
4. Build `sync_to_notion.py` (Tier 2 sync)
5. Create `test_sync.py` (unit tests)
6. Create `config.yaml` (configuration)

### Medium-Term (Next Month)
7. Set up weekly automation (cron or GitHub Actions)
8. Build monitoring dashboard (last sync, entity counts, errors)
9. Implement TTL automation (archive stale records, promote learnings)

---

## References

- **Integration Analysis**: `/integrations/notion/ANALYSIS_founderhq_notion_integration_v01.md`
- **Integration Strategy ADR**: `/decisions/2025-10-17_notion-integration-strategy_v01.md`
- **Database IDs**: `/integrations/notion/database_ids_reference.md`
- **Notion Build Plan**: `/integrations/notion/NOTION_BUILD_COMPLETION_PLAN_v01.md`
- **Notion Migration Plan**: `/portfolio/founderhq-migration-v2.md`

---

**Last Updated**: 2025-10-17
**Status**: ULID backfill ready, promotion/sync scripts planned
**Next Action**: Run ULID backfill after Session 1 complete

