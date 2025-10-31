# Notion Build Completion Plan

- entity: integration
- level: implementation
- zone: internal
- version: v01
- tags: [notion, founderhq, migration, implementation, ulid]
- source_path: /integrations/notion/NOTION_BUILD_COMPLETION_PLAN_v01.md
- date: 2025-10-17

---

## Executive Summary

**Current Status**: 5% complete (1 of 19 databases fully migrated)
**Estimated Time Remaining**: 5-6 hours across 3 sessions
**Critical Blockers**: 8 missing database IDs, ULID strategy undefined
**Next Action**: Pre-flight checklist (Session 0) before Session 1

---

## Current State Analysis

### Completed ✅
- **DB Outcomes** (1 database)
  - Renamed "Active?" → "Active"
  - Converted Ventures: text → relation (two-way)
  - Database renamed to "DB Outcomes"

### In Progress ⏳
- **All remaining databases** (18 databases across 3 sessions)
  - Session 1: Foundation (4 databases) - 0% complete
  - Session 2: Commercial (4 databases) - 0% complete
  - Session 3: Execution (3 databases) - 0% complete
  - **Missing**: 8 databases with no database IDs yet

---

## Database ID Status

### Known Database IDs (15 databases) ✅

| Database | Database ID | Status |
|----------|-------------|--------|
| DB Outcomes | `2845c4eb-9526-81b4-8cdb-000b6edd3ffc` | ✅ Complete |
| Topics | `2845c4eb-9526-8171-8581-ef47a3619cf0` | ⏳ Session 1 |
| Areas | `2845c4eb-9526-8133-81f2-d40cdcd992f5` | ⏳ Session 1 |
| Ventures | `2845c4eb-9526-8182-8ccf-000b14d4c431` | ⏳ Session 1 |
| Offers | `2845c4eb-9526-8112-8201-000ba408243f` | ⏳ Session 1 |
| Service Blueprints | `2845c4eb-9526-818d-b5ba-000b6e95ec3d` | Referenced |
| ICP Segments | `2845c4eb-9526-81eb-b9dd-000b90af9399` | Referenced |
| Process Templates | `2845c4eb-9526-8168-8e87-000bf4f14d76` | Referenced |
| Resource Templates | `2845c4eb-9526-81c0-9921-000bd9dd5664` | Referenced |
| Organizations | `2845c4eb-9526-813e-a1ef-cbea16707f73` | ⏳ Session 2 |
| People | `2845c4eb-9526-81d4-bc26-ce6a98a92cce` | ⏳ Session 2 |
| Deals | `2845c4eb-9526-816c-a03c-d5744f4e5198` | ⏳ Session 2 |
| Engagements | `2845c4eb-9526-814a-9c47-c02f22543cd7` | ⏳ Session 2 |
| Projects | `2845c4eb-9526-814d-bb7a-c37948933b47` | ⏳ Session 3 |
| Tasks | `2845c4eb-9526-8192-8a7b-d0888712291c` | ⏳ Session 3 |

### Missing Database IDs (8 databases) ⚠️

**Blockers for completion:**
- Sprints (needed for Session 3, Tasks relations)
- Daily Thread (needed for Tier 1 operations)
- Deliverables (needed for Projects, Engagements, Tasks relations)
- Results (needed for Engagements relations)
- Touchpoints (needed for People relations)
- Experiments (needed for Offers, Sprints relations)
- Decision Journal (needed for Offers, Sprints relations)
- Workflows (needed for Tasks relations)

**Action Required**: Find these database IDs in Notion workspace before proceeding.

**How to Find Database IDs:**
1. Open database in Notion
2. Click "..." (three dots menu)
3. Copy link to database
4. Extract 32-character ID from URL: `https://notion.so/<database_id>?v=...`
5. Format as: `2845c4eb-9526-xxxx-xxxx-xxxxxxxxxxxx`

---

## ULID Implementation Strategy

### Problem
Migration plan specifies "Unique ID" fields throughout but doesn't define:
- Generation method (when/where ULIDs created)
- Format validation
- Conflict resolution
- Migration of existing records

### Recommended Approach

#### Option A: Pre-fill ULIDs via Script (Recommended)
**Approach**: Generate ULIDs for all existing records before using Notion operationally

**Pros:**
- One-time operation
- Ensures all records have stable IDs from start
- Can validate format consistency
- Supports sync scripts immediately

**Cons:**
- Requires Notion API access
- One-time setup cost

**Implementation:**
```python
# /integrations/notion-sync/prefill_ulids.py
import ulid
from notion_client import Client

notion = Client(auth=os.environ["NOTION_API_KEY"])

databases_to_update = [
    "2845c4eb-9526-8182-8ccf-000b14d4c431",  # Ventures
    "2845c4eb-9526-8112-8201-000ba408243f",  # Offers
    # ... all databases with "Unique ID" field
]

for db_id in databases_to_update:
    results = notion.databases.query(database_id=db_id)
    for page in results["results"]:
        unique_id = page["properties"]["Unique ID"]["rich_text"]
        if not unique_id or len(unique_id) == 0:
            new_ulid = str(ulid.new())
            notion.pages.update(
                page_id=page["id"],
                properties={"Unique ID": {"rich_text": [{"text": {"content": new_ulid}}]}}
            )
```

**Execution Plan:**
1. Install MCP Notion server or use Python Notion SDK
2. Run script after Session 1 complete (Ventures, Offers have "Unique ID" field)
3. Run incrementally after each session (Organizations, Projects, etc.)
4. Validate: Check all records have 26-character ULID format

#### Option B: Manual ULID Generation in Notion
**Approach**: Use Notion formula to generate ULID-like IDs

**Formula:**
```
concat(
  formatDate(now(), "YYYYMMDDHHMMSS"),
  "-",
  replaceAll(id(), "-", "")
)
```

**Pros:**
- No external tooling required
- Automatic for new records

**Cons:**
- Not true ULID (not lexicographically sortable by timestamp)
- Formula cannot generate random component
- Existing records need manual trigger

**Assessment**: Not recommended. Use Option A (scripted) or Option C (template).

#### Option C: Template-Based ULID Generation
**Approach**: Use Notion database templates with pre-filled ULIDs

**Implementation:**
1. Create database template for each entity type
2. Template includes button that calls API to generate ULID
3. Users create new records from template

**Pros:**
- Clean UX (one-click generation)
- No formula hacks
- True ULID format

**Cons:**
- Requires Notion button + API integration
- Users must remember to use template
- Existing records still need script

**Assessment**: Good for ongoing use after initial migration.

### Selected Strategy: Hybrid (A + C)

**Phase 1 (Immediate)**: Script-based backfill for existing records
**Phase 2 (Ongoing)**: Template-based generation for new records
**Phase 3 (Optional)**: Notion automation (when available) for automatic ULID on create

---

## Field Normalization Checklist

### Cross-Cutting Changes (All Databases)

**Add to ALL databases:**
- [ ] `Unique ID` (text/rich_text) — ULID format, canonical PK
- [ ] `Created Time` (created_time) — Notion built-in
- [ ] `Last Edited Time` (last_edited_time) — Notion built-in

**Remove "DB" prefix from database names:**
- [ ] "DB Outcomes" → "Outcomes"
- [ ] Verify no other databases have "DB" prefix

### Specific Field Normalizations

**Offers:**
- [ ] "Time To Deliver Hrs" → "Delivery Hours"
- [ ] "Experiment Log" → "Experiments"
- [ ] "Decision Journal" → "Decisions"

**Projects:**
- [ ] "Expense Budget ($)" → "Budget"
- [ ] "Expense Actual ($)" → "Actual Expenses"
- [ ] "Margin ($)" → "Margin"
- [ ] "Revenue Expected" → "Expected Revenue"
- [ ] "Revenue Recognized" → "Recognized Revenue"

**Tasks:**
- [ ] "Estimate Hrs" → "Estimated Hours"
- [ ] "Actual Hrs" → "Actual Hours"
- [ ] "MIT Today" → "MIT"

### Relationship Normalization

**Principle**: All relations are TWO-WAY (bidirectional)

**Delete old text fields, recreate as two-way relations:**
- [ ] Offers: Process Templates, Projects, Deals, Engagements (delete text, create relation)
- [ ] All entities: Verify synced property names are plural (e.g., "Offers" not "Offer")

---

## Session-by-Session Execution Plan

### PRE-FLIGHT SESSION (Session 0) — 30 minutes

**Objective**: Resolve blockers before Session 1

**Tasks:**
1. **Find Missing Database IDs** (15 min)
   - [ ] Open each missing database in Notion
   - [ ] Copy database link
   - [ ] Extract 32-char ID
   - [ ] Update migration plan v2 with IDs

2. **Set Up ULID Tooling** (10 min)
   - [ ] Install Python `ulid-py` library: `pip install python-ulid`
   - [ ] Install Notion SDK: `pip install notion-client`
   - [ ] Create Notion integration token (Settings & Members → Integrations → New Integration)
   - [ ] Share all databases with integration
   - [ ] Test API access: `python -c "from notion_client import Client; print(Client(auth='token').databases.list())"`

3. **Create Test Venture** (5 min)
   - [ ] Create fake venture "TEST-ACME-001"
   - [ ] Create fake offer "TEST-Offer-001"
   - [ ] Use for formula validation

**Status:** [ ] Not Started

---

### SESSION 1: Foundation & Business Architecture — 120 minutes

**Objective**: Migrate core business entities (Topics, Areas, Ventures, Offers)

#### 1. Topics (20 min)
**Database ID:** `2845c4eb-9526-8171-8581-ef47a3619cf0`

**Fields to Add:**
- [ ] Type (select): Industry, Channel, Persona, Tool, Skill
- [ ] Parent Topic (relation ↔ self): For hierarchy
- [ ] Aliases (text): Alternative names
- [ ] Color (select/color): Visual identifier
- [ ] Active (checkbox): Whether in use
- [ ] Slug (text): URL-friendly identifier
- [ ] Unique ID (rich_text): ULID

**Two-Way Relations:**
- [ ] Organizations ↔ Topics (Industry Vertical)
- [ ] Experiments ↔ Topics
- [ ] Deals ↔ Topics

**Status:** [ ] Not Started

---

#### 2. Areas (15 min)
**Database ID:** `2845c4eb-9526-8133-81f2-d40cdcd992f5`

**Rename Database:**
- [ ] "Functional Areas" → "Areas"

**Fields to Add:**
- [ ] Default Role (select): Primary role/context
- [ ] Active (checkbox): Whether active
- [ ] Unique ID (rich_text): ULID

**Keep Existing:**
- Name (title) ✓
- Description (text) ✓

**Two-Way Relations:**
- [ ] Projects ↔ Areas

**Status:** [ ] Not Started

---

#### 3. Ventures (25 min)
**Database ID:** `2845c4eb-9526-8182-8ccf-000b14d4c431`

**Fields to Add:**
- [ ] Unique ID (rich_text): ULID (canonical PK)
- [ ] Venture ID (text): Human-readable (e.g., "VENT-001")
- [ ] Type (select): Agency, Product, Service, Internal
- [ ] Status (select): Active, Paused, Archived
- [ ] Target Revenue (number, currency)
- [ ] Start Date (date)
- [ ] End Date (date)

**Two-Way Relations:**
- [ ] Offers ↔ Ventures
- [ ] Projects ↔ Ventures
- [ ] Deals ↔ Ventures

**Status:** [ ] Not Started

---

#### 4. Offers — NORMALIZED SCHEMA (45 min)

**Database ID:** `2845c4eb-9526-8112-8201-000ba408243f`

##### Phase 4A: Remove Redundancies (5 min)

**Delete these fields:**
- [ ] "Offer ID" (redundant with Unique ID)
- [ ] "Typical Engagement Length" (use Engagement Type)
- [ ] "Change Notes" (use Notion page history)
- [ ] "Template Assets" (use Resource Templates relation)

**Status:** [ ] Not Started

---

##### Phase 4B: Rename Fields (5 min)

- [ ] "Time To Deliver Hrs" → "Delivery Hours"
- [ ] "Experiment Log" → "Experiments"
- [ ] "Decision Journal" → "Decisions"

**Status:** [ ] Not Started

---

##### Phase 4C: Create Two-Way Relations (30 min)

**Delete old text fields FIRST (data will be lost, plan accordingly):**
- [ ] Process Templates (text) → DELETE
- [ ] Projects (text) → DELETE
- [ ] Deals (text) → DELETE
- [ ] Engagements (text) → DELETE

**Then create as two-way relations:**
- [ ] Venture ↔ Ventures
- [ ] Service Blueprint ↔ Service Blueprints
- [ ] Target ICP ↔ ICP Segments
- [ ] Process Templates ↔ Process Templates
- [ ] Resource Templates ↔ Resource Templates
- [ ] Deals ↔ Deals
- [ ] Experiments ↔ Experiments
- [ ] Decisions ↔ Decision Journal
- [ ] Engagements ↔ Engagements
- [ ] Projects ↔ Projects

**Status:** [ ] Not Started

---

##### Phase 4D: Final Schema Verification (5 min)

**Verify complete Offers schema:**

**Identity:**
- [ ] Name (title)
- [ ] Unique ID (rich_text, ULID)

**Status & Type:**
- [ ] Status (select): Draft, Active, Sunset
- [ ] Type (select): Diagnostic, Sprint, Retainer, Product, Subscription
- [ ] Version (text)

**Relations (All ↔):**
- [ ] Venture ↔ Ventures
- [ ] Target ICP ↔ ICP Segments
- [ ] Service Blueprint ↔ Service Blueprints
- [ ] Process Templates ↔ Process Templates
- [ ] Resource Templates ↔ Resource Templates
- [ ] Deals ↔ Deals
- [ ] Engagements ↔ Engagements
- [ ] Projects ↔ Projects
- [ ] Experiments ↔ Experiments
- [ ] Decisions ↔ Decision Journal

**Value Proposition:**
- [ ] Problem Statement (text)
- [ ] Solution (text)
- [ ] Deliverables (text)
- [ ] Success Metrics (text)

**Pricing:**
- [ ] Price (currency)
- [ ] Cost to Deliver (currency)
- [ ] Margin (formula): `prop("Price") - prop("Cost to Deliver")`
- [ ] Pricing Model (select)
- [ ] Payment Terms (text)

**Delivery:**
- [ ] Delivery Hours (number)
- [ ] Engagement Type (select): One-time, Retainer, Subscription
- [ ] Guarantee (text)
- [ ] Prerequisites (text)

**Marketing:**
- [ ] Sales Page (url)

**Metadata:**
- [ ] Create Date (created_time)
- [ ] Last Modified (last_edited_time)

**Status:** [ ] Not Started

---

**SESSION 1 CHECKPOINT:**
- [ ] All 4 databases updated
- [ ] Test with fake data (TEST-ACME-001 venture, TEST-Offer-001)
- [ ] Run ULID backfill script for Session 1 databases
- [ ] Verify all two-way relations navigate correctly
- [ ] Take screenshot of final schemas for documentation

---

### SESSION 2: Commercial Management — 90 minutes

**Objective**: Migrate CRM entities (Organizations, People, Deals, Engagements)

#### 5. Organizations (25 min)
**Database ID:** `2845c4eb-9526-813e-a1ef-cbea16707f73`

**Fields to Add:**
- [ ] Unique ID (rich_text): ULID

**Convert to Two-Way Relations:**
- [ ] Industry Vertical ↔ Topics
- [ ] People ↔ Organizations
- [ ] Deals ↔ Organizations
- [ ] Engagements ↔ Organizations

**Add Formula:**
- [ ] Total Lifetime Value (formula): `sum(prop("Engagements").map(current => current.prop("Contract Value")))`

**Status:** [ ] Not Started

---

#### 6. People (20 min)
**Database ID:** `2845c4eb-9526-81d4-bc26-ce6a98a92cce`

**Fields to Add:**
- [ ] Engagement Role (select): Champion, Decision Maker, End User, Influencer
- [ ] Warmth (select): Warm, Cold, Referral
- [ ] Preferred Communication (select): Email, Slack, Phone, Text
- [ ] Time Zone (rich_text)
- [ ] Decision Maker (checkbox)
- [ ] Consent (checkbox)
- [ ] Last Contact (date)
- [ ] Unique ID (rich_text): ULID

**Convert to Two-Way Relations:**
- [ ] Organization ↔ Organizations
- [ ] Deals ↔ People (Primary Contact)
- [ ] Touchpoints ↔ People

**Status:** [ ] Not Started

---

#### 7. Deals (25 min)
**Database ID:** `2845c4eb-9526-816c-a03c-d5744f4e5198`

**Fields to Add:**
- [ ] Probability (number, percent)
- [ ] Lost Reason (select): No Budget, Bad Timing, Competitor, No Fit
- [ ] Win Factors (rich_text)
- [ ] Unique ID (rich_text): ULID
- [ ] Deal ID (rich_text): Human-readable (e.g., "DEAL-001")

**Add Formula:**
- [ ] Weighted Value (formula): `prop("Value Est") * prop("Probability")`

**Convert to Two-Way Relations:**
- [ ] Organization ↔ Organizations
- [ ] Primary Contact ↔ People
- [ ] Offer ↔ Offers
- [ ] Venture ↔ Ventures
- [ ] Engagement ↔ Engagements

**Status:** [ ] Not Started

---

#### 8. Engagements (30 min)
**Database ID:** `2845c4eb-9526-814a-9c47-c02f22543cd7`

**CRITICAL**: Most fields likely missing! This database needs significant buildout.

**Fields to Add:**
- [ ] Type (select): Service, Subscription, Enrollment, Partnership
- [ ] Status (select): Active, Paused, Complete, Churned
- [ ] Start Date (date)
- [ ] End Date (date)
- [ ] Contract Value (number, currency)
- [ ] MRR (number, currency)
- [ ] Health Score (number)
- [ ] Renewal Date (date)
- [ ] NPS Score (number)
- [ ] Success Metrics (rich_text)
- [ ] Unique ID (rich_text): ULID
- [ ] Engagement ID (rich_text): Human-readable (e.g., "ENG-001")

**Convert to Two-Way Relations:**
- [ ] Organization ↔ Organizations
- [ ] Primary Contact ↔ People
- [ ] Deal ↔ Deals
- [ ] Offer ↔ Offers
- [ ] Service Blueprint ↔ Service Blueprints
- [ ] Projects ↔ Engagements
- [ ] Deliverables ↔ Engagements
- [ ] Results ↔ Engagements

**Status:** [ ] Not Started

---

**SESSION 2 CHECKPOINT:**
- [ ] All 4 CRM databases updated
- [ ] Test CRM workflow: Organization → Person → Deal → Engagement
- [ ] Run ULID backfill script for Session 2 databases
- [ ] Verify CRM formulas (Total Lifetime Value, Weighted Value)
- [ ] Update any existing records with fake CRM data for testing

---

### SESSION 3: Execution Core — 90 minutes

**Objective**: Migrate operational entities (Projects, Tasks, Sprints)

#### 9. Projects (40 min)
**Database ID:** `2845c4eb-9526-814d-bb7a-c37948933b47`

**Normalize Field Names:**
- [ ] "Expense Budget ($)" → "Budget"
- [ ] "Expense Actual ($)" → "Actual Expenses"
- [ ] "Margin ($)" → "Margin"
- [ ] "Revenue Expected" → "Expected Revenue"
- [ ] "Revenue Recognized" → "Recognized Revenue"

**Add/Update Fields:**
- [ ] Type (select): Client Delivery, Internal Development, Learning, Operations
- [ ] Status (select): Planning, Active, On Hold, Complete, Cancelled
- [ ] Hours Estimated (number)
- [ ] Hours Actual (number)
- [ ] Unique ID (rich_text): ULID
- [ ] Project ID (rich_text): Human-readable (e.g., "PROJ-001")

**Convert to Two-Way Relations:**
- [ ] Venture ↔ Ventures
- [ ] Area ↔ Areas
- [ ] Engagement ↔ Engagements
- [ ] Offer ↔ Offers
- [ ] Process Template ↔ Process Templates
- [ ] Tasks ↔ Projects
- [ ] Deliverables ↔ Projects

**Add Formulas:**
- [ ] Billable (formula): `prop("Engagement") != empty or prop("Type") == "Client Delivery"`
- [ ] Margin (formula): `prop("Expected Revenue") - prop("Actual Expenses")`

**Status:** [ ] Not Started

---

#### 10. Tasks (35 min)
**Database ID:** `2845c4eb-9526-8192-8a7b-d0888712291c`

**Normalize Field Names:**
- [ ] "Estimate Hrs" → "Estimated Hours"
- [ ] "Actual Hrs" → "Actual Hours"
- [ ] "MIT Today" → "MIT"

**Add Fields:**
- [ ] Automation Status (select): Manual, Semi-automated, Automated
- [ ] Energy Required (select): 1, 2, 3, 4, 5
- [ ] Context Switch Cost (select): 1, 2, 3, 4, 5
- [ ] Unique ID (rich_text): ULID
- [ ] Task ID (rich_text): Human-readable (e.g., "TASK-001")

**Convert to Two-Way Relations:**
- [ ] Project ↔ Projects
- [ ] Sprint ↔ Sprints
- [ ] Deliverable ↔ Deliverables
- [ ] Workflow Step ↔ Workflows
- [ ] Resource Template ↔ Resource Templates

**Add Formulas:**
- [ ] Type (formula): `prop("Project").prop("Type")`
- [ ] Billable (formula): `prop("Project").prop("Billable")`

**Status:** [ ] Not Started

---

#### 11. Sprints (15 min)
**Database ID:** TO FIND ⚠️

**Verify/Add Fields:**
- [ ] Sprint ID (title): Human-readable (e.g., "2025-W42")
- [ ] Start Date (date)
- [ ] End Date (date)
- [ ] Capacity (number): Total hours available
- [ ] Theme (rich_text): Sprint focus
- [ ] Learning Focus (rich_text): What to learn this sprint
- [ ] Learning Cap (number): Max learning hours
- [ ] Revenue Target (number, currency)
- [ ] Outreach Target (number): Number of touchpoints
- [ ] Unique ID (rich_text): ULID

**Convert to Two-Way Relations:**
- [ ] Tasks ↔ Sprints
- [ ] Experiments ↔ Sprints
- [ ] Decisions ↔ Sprints

**Add Formulas:**
- [ ] Planned Billable Hrs (formula): `prop("Tasks").filter(current.prop("Billable") == true).map(current.prop("Estimated Hours")).sum()`
- [ ] Planned Learning Hrs (formula): `prop("Tasks").filter(current.prop("Project Focus") == "Learning").map(current.prop("Estimated Hours")).sum()`
- [ ] Billable % (formula): `if(prop("Capacity") == 0, 0, prop("Planned Billable Hrs") / prop("Capacity"))`

**Status:** [ ] Not Started

---

**SESSION 3 CHECKPOINT:**
- [ ] All 3 execution databases updated
- [ ] Test operational workflow: Project → Tasks → Sprint
- [ ] Run ULID backfill script for Session 3 databases
- [ ] Verify execution formulas (Billable, Margin, Planned Billable)
- [ ] Create test sprint with fake tasks for validation

---

### POST-MIGRATION SESSION (Session 4) — 60 minutes

**Objective**: Verification, cleanup, and preparation for operational use

#### 1. Relationship Integrity Check (20 min)

For each two-way relation, verify:
- [ ] Relation exists in Table A pointing to Table B
- [ ] Synced property exists in Table B pointing back to Table A
- [ ] Both properties have matching names
- [ ] Test navigation: Click relation → opens related record → click synced property → returns to original

**Critical Relations to Test:**
- [ ] Ventures ↔ Offers
- [ ] Offers ↔ Engagements
- [ ] Engagements ↔ Projects
- [ ] Projects ↔ Tasks
- [ ] Organizations ↔ Deals
- [ ] Deals ↔ Engagements

---

#### 2. Formula Validation (15 min)

Test all formulas with sample data:
- [ ] Offers: Margin = Price - Cost to Deliver
- [ ] Projects: Billable = Engagement exists OR Type = Client Delivery
- [ ] Projects: Margin = Expected Revenue - Actual Expenses
- [ ] Tasks: Type inherits from Project
- [ ] Tasks: Billable inherits from Project
- [ ] Sprints: Planned Billable = sum of billable task hours
- [ ] Sprints: Billable % = Planned Billable / Capacity
- [ ] Organizations: Total Lifetime Value = sum of engagement contract values
- [ ] Deals: Weighted Value = Value Est * Probability

---

#### 3. Data Migration Verification (10 min)

For fields that had data before conversion:
- [ ] Check if any data was lost during text → relation conversion
- [ ] Verify all Unique IDs are 26-character ULID format
- [ ] Verify all human-readable IDs follow convention (VENT-001, ENG-001, etc.)
- [ ] Verify dates converted correctly (no timezone issues)

---

#### 4. View Configuration (15 min)

Update all database views:
- [ ] Remove deleted fields from all views
- [ ] Add new relation fields to appropriate views
- [ ] Add Unique ID to all "All [Entity]" views
- [ ] Reorder fields logically (Identity → Status → Relations → Content → Metadata)
- [ ] Update filters and sorts (e.g., filter by Active = true)
- [ ] Create "Active [Entity]" views with Status filters

**Recommended View Structure (per database):**
- All [Entity] (table view, all records, all fields)
- Active [Entity] (filtered by Status = Active)
- By Venture (grouped by Venture)
- By Status (grouped by Status)
- Calendar (if date fields exist)

---

**SESSION 4 CHECKPOINT:**
- [ ] All relationships verified
- [ ] All formulas tested and working
- [ ] All data migrated successfully
- [ ] All views updated and organized
- [ ] Documentation updated with final database IDs
- [ ] Ready for operational use

---

## Critical Issues and Mitigations

### Issue 1: Missing Database IDs (8 databases)
**Blocker**: Cannot complete two-way relations without target database IDs

**Mitigation**:
1. Find all missing database IDs during Session 0 (pre-flight)
2. Update migration plan v2 with discovered IDs
3. Document in `/integrations/notion/database_ids_reference.md`

### Issue 2: ULID Strategy Undefined
**Blocker**: Sync scripts depend on stable Unique IDs

**Mitigation**:
1. Implement scripted ULID backfill (Option A)
2. Create database templates for new record creation (Option C)
3. Document ULID format validation in sync scripts

### Issue 3: Formula Complexity
**Risk**: Notion formula engine limited vs Portfolio retrieval

**Examples**:
- Engagement Health Score (NPS + approval rates) may not work in Notion
- Complex nested rollups may timeout

**Mitigation**:
1. Test formulas with fake data during sessions
2. Move complex calculations to sync scripts if formulas fail
3. Write calculated values back to Notion as static fields

### Issue 4: Text → Relation Conversion Data Loss
**Risk**: Deleting text fields before creating relations loses data

**Mitigation**:
1. Export CSV backup before each session
2. Document which fields have data to preserve
3. Consider manual data migration if critical data exists
4. Worst case: Use Notion version history (Settings → Version history)

### Issue 5: Sync Lag During Migration
**Risk**: Operational work continues in old system during migration

**Mitigation**:
1. Announce migration schedule (block calendar)
2. Freeze operational updates during sessions (120 min max)
3. Complete sessions in off-hours if possible
4. Use test venture for validation, not production data

---

## Post-Migration Deliverables

### 1. Database ID Reference Document
**Path**: `/integrations/notion/database_ids_reference.md`

**Content**:
```markdown
# Notion Database IDs Reference

| Database | Database ID | Entity Type |
|----------|-------------|-------------|
| Ventures | 2845c4eb-9526-8182-8ccf-000b14d4c431 | venture |
| Offers | 2845c4eb-9526-8112-8201-000ba408243f | offer |
...
```

### 2. ULID Backfill Script
**Path**: `/integrations/notion-sync/prefill_ulids.py`

**Functionality**:
- Query all databases with "Unique ID" field
- Generate ULID for records with empty Unique ID
- Update records via Notion API
- Log actions to `/logs/context_actions.csv`

### 3. Notion Schema Export
**Path**: `/integrations/notion/notion_schema_export_v01.json`

**Functionality**:
- Export final schema of all databases (via Notion API)
- Include: database IDs, field names, field types, relations, formulas
- Used for comparison with Portfolio SoT schema

### 4. Migration Completion Report
**Path**: `/integrations/notion/MIGRATION_COMPLETION_REPORT_v01.md`

**Content**:
- Final status (% complete, hours spent)
- Issues encountered and resolutions
- Schema differences vs migration plan
- Recommendations for ongoing maintenance

---

## Success Metrics

**Migration Complete When:**
- [ ] All 19 databases have complete schemas (100%)
- [ ] All two-way relations tested and working (100%)
- [ ] All formulas validated with test data (100%)
- [ ] All Unique ID fields have ULID values (100%)
- [ ] All human-readable IDs follow convention (100%)
- [ ] All database views updated and organized (100%)
- [ ] Database ID reference document created (complete)
- [ ] ULID backfill script created and tested (complete)
- [ ] Notion schema export generated (complete)
- [ ] Migration completion report written (complete)

**Red Flags:**
- Any two-way relation fails to navigate
- Any formula returns error or unexpected value
- Any Unique ID field empty after backfill
- Any data lost during text → relation conversion
- Any database ID still missing after Session 0

---

## Next Steps

### Immediate (Before Session 1)
1. **Execute Pre-Flight Session (Session 0)**
   - Find all 8 missing database IDs
   - Set up ULID tooling (Python SDK, Notion integration)
   - Create test venture and offer for validation

2. **Review this completion plan**
   - Confirm session schedule (when to execute)
   - Identify any questions or concerns
   - Gather Notion API token and workspace access

### Short-Term (Sessions 1-3)
3. **Execute migration sessions**
   - Session 1: Foundation (2 hours)
   - Session 2: Commercial (1.5 hours)
   - Session 3: Execution (1.5 hours)
   - Session 4: Post-migration (1 hour)

4. **Run ULID backfill incrementally**
   - After Session 1: Ventures, Offers, Topics, Areas
   - After Session 2: Organizations, People, Deals, Engagements
   - After Session 3: Projects, Tasks, Sprints

### Medium-Term (Post-Migration)
5. **Generate deliverables**
   - Database ID reference document
   - Notion schema export
   - Migration completion report

6. **Begin integration implementation**
   - Update Portfolio SoT to v0.3 (add CRM, service design entities)
   - Build sync scripts (`promote_from_notion.py`, `sync_to_notion.py`)
   - Set up weekly promotion ritual

---

## Questions for Clarification

Before proceeding, please clarify:

1. **Session Timing**: When do you want to execute Session 0 and Session 1? (Recommend blocking 2.5 hours for both)

2. **Notion API Access**: Do you have a Notion integration token, or do we need to create one?

3. **Existing Data**: Do any of the text fields being converted to relations (Offers: Process Templates, Projects, Deals, Engagements) contain data that needs to be preserved?

4. **Test Data**: Should we use the test venture (TEST-ACME-001) or production data for validation?

5. **ULID Format**: Confirm ULID library preference: `python-ulid` (recommended) or alternative?

6. **Migration Pause**: Can operational work pause during sessions, or do we need to account for concurrent updates?

---

**Version**: v01
**Date**: 2025-10-17
**Status**: Plan Created, Sessions Not Started
**Next Action**: Execute Pre-Flight Session (Session 0) to resolve missing database IDs and set up ULID tooling

