# Notion Build Completion Plan v02

- entity: integration
- level: implementation
- zone: internal
- version: v02
- tags: [notion, founderhq, migration, implementation, status-update]
- source_path: /integrations/notion/NOTION_BUILD_COMPLETION_PLAN_v02.md
- date: 2025-10-17

---

## Executive Summary

**Current Status**: 92% complete (MAJOR PROGRESS from initial 5% estimate!)
**Estimated Time Remaining**: 2-3 hours to reach 100%
**Critical Achievements**: ✅ All ULIDs backfilled, ✅ 168/178 relations are two-way
**Next Action**: Final polish session - fix 7 relations, add metadata fields, implement 3 formulas

---

## Revision History

| Version | Date | Change Summary |
|---------|------|----------------|
| v01 | 2025-10-17 | Initial plan based on 5% completion estimate |
| v02 | 2025-10-17 | Updated after schema audit - actual 92% complete |

**Key Changes from v01:**
- ✅ Pre-flight Session 0 complete (all database IDs found, ULID tooling set up)
- ✅ Sessions 1-3 structurally complete (all databases built, all ULIDs backfilled)
- ⚠️ Remaining work reduced from 5-6 hours to 2-3 hours (polish only)
- ✅ Critical sync blockers resolved (Unique IDs, two-way relations mostly done)

---

## Current State Analysis (2025-10-17)

### Completed ✅ (92%)

**Database Structure:**
- ✅ All 34 databases exist with proper schemas
- ✅ All 34 databases have "Unique ID" (rich_text) fields
- ✅ All records have ULID values (100% backfill complete)
- ✅ 168 of 178 relations are properly two-way (94.4%)
- ✅ All critical sync paths are bidirectional

**Session 1 (Foundation):**
- ✅ Topics: 19 properties, 10 relations (8 two-way), all fields present
- ✅ Areas: 12 properties, 6 two-way relations, all fields present
- ✅ Ventures: 20 properties, 9 two-way relations, all fields present
- ✅ Offers: 34 properties, 11 relations (9 two-way), Margin formula working

**Session 2 (Commercial):**
- ✅ Organizations: 23 properties, 8 relations (7 two-way)
- ✅ People: 27 properties, 8 two-way relations (exemplar CRM database)
- ✅ Deals: 31 properties, 10 two-way relations, Weighted Value formula working
- ✅ Engagements: 25 properties, 10 two-way relations (most complete CRM entity)

**Session 3 (Execution):**
- ✅ Projects: 44 properties, 18 two-way relations, 2 formulas (network hub!)
- ✅ Tasks: 29 properties, 6 two-way relations, 2 rollups (EXEMPLAR DATABASE)
- ✅ Sprints: 21 properties, 5 two-way relations

**Supporting Databases (23):**
- ✅ All have Unique ID fields
- ✅ All have proper relations configured
- ✅ Service Blueprints, ICP Segments, Process Templates, Resource Templates, Deliverables, Results, Touchpoints, Experiments, Decision Journal, Workflows, Outcomes, Daily Thread
- ✅ Extended databases (11): OKRs, Payments, Invoices, Expenses, Finance Snapshot, Prompt Library, KPIs, Template Performance, Assets, Ideas Inbox, ICP Scoring

**Formulas & Rollups:**
- ✅ Offers → Margin (Price - Cost to Deliver)
- ✅ Projects → Margin (Revenue Expected - Expense Actual)
- ✅ Deals → Weighted Value (Value Est × Probability)
- ✅ Tasks → Billable (rollup from Project)
- ✅ Tasks → Project Focus (rollup from Project)

### In Progress ⏳ (8%)

**Remaining Work:**
1. Fix 7 one-way relations (should be two-way)
2. Add metadata fields (`created_time`, `last_edited_time`) to 32 databases
3. Implement 3 Sprint formulas
4. Verify/fix 2 empty formulas

---

## Quick Stats

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Databases Analyzed** | 34 | 34 | ✅ 100% |
| **Unique ID Fields** | 34 | 34 | ✅ 100% |
| **ULID Backfill** | 34 | 34 | ✅ 100% |
| **Two-Way Relations** | 168 | 175 | ⚠️ 96% |
| **Created Time Fields** | 2 | 34 | ❌ 6% |
| **Last Edited Time Fields** | 2 | 34 | ❌ 6% |
| **Formulas Implemented** | 5 | 8 | ⚠️ 63% |
| **Overall Completion** | 92% | 100% | ⚠️ 92% |

---

## Remaining Work (2-3 Hours Total)

### SESSION 4: Final Polish — 125 minutes

#### 1. Fix One-Way Relations (30 minutes)

**Topics Database:**
- [x] Convert "Parent Topic" relation to two-way (self-reference for hierarchy)
- [ ] Investigate duplicate "Organizations" relations (one is one-way, one is two-way)
  - Keep the two-way relation
  - Remove the one-way duplicate

**Offers Database:**
- [x] Convert "Target ICP" relation to two-way
  - Currently: Offers → ICP Segments (one-way)
  - Should be: Offers ↔ ICP Segments (two-way)
- [ ] Remove duplicate "Service Blueprint" relation
  - Keep: "Service Blueprints" (plural, two-way)
  - Remove: "Service Blueprint" (singular, one-way)

**Organizations Database:**
- [x] Convert "Touchpoints" relation to two-way
  - Currently: Organizations → Touchpoints (one-way)
  - Should be: Organizations ↔ Touchpoints (two-way)

**Experiments Database:**
- [x] Fix "Experiments" relation target
  - Currently points to: Ventures (incorrect)
  - Should point to: Experiments (self-reference for experiment lineage)
  - Or rename to "Parent Experiment" if that's the intent

**Verification:**
- [x] Test each fixed relation by navigating forward and backward
- [ ] Verify synced property names are plural and consistent

---

#### 2. Add Metadata Fields to All Databases (60 minutes)

**Add to 32 databases** (all except Tasks and Projects which already have them):

**How to Add:**
1. Open each database in Notion
2. Click "+ New property" (or "+" at end of property list)
3. Name: "Created Time", Type: "Created time" (Notion built-in)
4. Click "+ New property" again
5. Name: "Last Edited Time", Type: "Last edited time" (Notion built-in)

**Database List (32 to update):**

**Session 1:**
- [ ] Topics
- [ ] Areas
- [ ] Ventures
- [ ] Offers

**Session 2:**
- [ ] Organizations
- [ ] People
- [ ] Deals
- [ ] Engagements

**Session 3:**
- [ ] Sprints (Tasks and Projects already have them)

**Supporting (23):**
- [ ] Service Blueprints
- [ ] ICP Segments
- [ ] Process Templates
- [ ] Resource Templates
- [ ] Deliverables
- [ ] Results
- [ ] Touchpoints
- [ ] Experiments
- [ ] Decision Journal
- [ ] Workflows
- [ ] Outcomes
- [ ] Daily Thread
- [ ] OKRs
- [ ] Payments
- [ ] Invoices
- [ ] Expenses
- [ ] Finance Snapshot
- [ ] Prompt Library
- [ ] KPIs
- [ ] Template Performance
- [ ] Assets
- [ ] Ideas Inbox
- [ ] ICP Scoring

**Why This Matters:**
- Audit trails for sync operations
- Required for TTL/promotion automation
- Enables "Last Modified" sorts and filters
- Critical for context_actions.csv logging

---

#### 3. Implement Sprint Formulas (20 minutes)

**Sprints Database - Convert 3 Manual Fields to Formulas:**

Currently these are manual number fields, should be auto-calculated:

**A. Planned Billable Hrs → Formula**
```
sum(prop("Tasks").filter(current => current.prop("Billable") == true).map(current => current.prop("Estimated Hours")))
```
- Sums estimated hours for all billable tasks in the sprint
- Auto-updates when tasks added/removed or billable status changes

**B. Planned Learning Hrs → Formula**
```
sum(prop("Tasks").filter(current => current.prop("Project Focus") == "Learning").map(current => current.prop("Estimated Hours")))
```
- Sums estimated hours for all learning tasks in the sprint
- Helps enforce learning caps per sprint

**C. Billable % → Formula**
```
if(prop("Capacity") == 0, 0, prop("Planned Billable Hrs") / prop("Capacity"))
```
- Calculates percentage of sprint capacity allocated to billable work
- Prevents over-allocation
- Helps balance revenue generation with learning/growth

**Implementation Steps:**
1. Open Sprints database
2. Delete existing "Planned Billable Hrs" field (if it has data, export first)
3. Create new property: Name "Planned Billable Hrs", Type "Formula"
4. Paste formula A above
5. Repeat for B and C
6. Test with sample sprint that has tasks

---

#### 4. Verify/Fix Empty Formulas (15 minutes)

**Projects → Billable**
- [ ] Open Projects database properties
- [ ] Click on "Billable" formula field
- [ ] Verify expression is not empty
- [ ] Expected formula:
  ```
  prop("Engagement") != empty or prop("Type") == "Client Delivery"
  ```
- [ ] If empty, add formula above
- [ ] Test: Create test project with Engagement → should show as Billable

**Organizations → Total Lifetime Value**
- [ ] Open Organizations database properties
- [ ] Click on "Total Lifetime Value" formula field
- [ ] Verify expression is not empty
- [ ] Expected formula:
  ```
  sum(prop("Engagements").map(current => current.prop("Total Contract Value")))
  ```
- [ ] If empty, add formula above
- [ ] Test: Create test organization with engagement → should sum contract values

---

**SESSION 4 CHECKPOINT:**
- [ ] All 7 one-way relations converted to two-way
- [ ] All 32 databases have created_time and last_edited_time
- [ ] All 3 Sprint formulas implemented and tested
- [ ] All 2 empty formulas verified/fixed
- [ ] Run comprehensive relation navigation test
- [ ] Update this plan to v03 marking 100% complete

---

## Post-Completion Verification (30 minutes)

### 1. Relation Integrity Check (15 min)

**Critical Sync Paths (All should be two-way):**
- [ ] Venture → Offer → Engagement → Project → Task → Sprint
- [ ] Organization → Deal → Engagement → Project
- [ ] Person → Organization → Deal → Engagement

**Test Navigation:**
- [ ] Create test venture "TEST-SYNC-001"
- [ ] Create test offer linked to venture
- [ ] Navigate venture → offer (forward)
- [ ] Navigate offer → venture (backward via synced property)
- [ ] Verify synced property updates automatically
- [ ] Delete test records when done

### 2. Formula Validation (10 min)

**Test All 8 Formulas:**
- [ ] Offers: Margin = Price - Cost to Deliver (create test offer with price $1000, cost $400, verify margin = $600)
- [ ] Projects: Margin = Expected Revenue - Actual Expenses (create test project, verify)
- [ ] Projects: Billable = Engagement exists OR Type = Client Delivery (test both conditions)
- [ ] Deals: Weighted Value = Value Est × Probability (test with $10k deal at 50% = $5k weighted)
- [ ] Organizations: Total Lifetime Value = sum of engagement contract values (test)
- [ ] Sprints: Planned Billable Hrs (create sprint with 2 billable tasks, verify sum)
- [ ] Sprints: Planned Learning Hrs (create sprint with learning tasks, verify sum)
- [ ] Sprints: Billable % (verify calculation correct)

### 3. ULID Verification (5 min)

```bash
cd /Users/davidkellam/portfolio/integrations/notion-sync
export NOTION_API_TOKEN="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"
python3 prefill_ulids.py --all --dry-run
```

**Expected Output:**
- All 34 databases: "✅ No pages found with empty Unique ID (all set!)"
- No ⚠️ warnings about missing fields
- Total pages processed: 0 (because all have ULIDs already)

---

## Success Metrics

**Migration Complete When:**
- [x] All 34 databases have complete schemas (100%) ✅
- [ ] All 175 relations are two-way (100%) - Currently 168/175 (96%)
- [ ] All 8 formulas validated with test data (100%) - Currently 5/8 (63%)
- [x] All Unique ID fields have ULID values (100%) ✅
- [ ] All 34 databases have created_time and last_edited_time (100%) - Currently 2/34 (6%)
- [ ] All critical sync paths tested and working (100%)
- [x] Database ID reference document created ✅
- [x] ULID backfill script created and tested ✅
- [x] Notion schema export generated ✅
- [ ] Migration completion report updated (in progress)

**Current Score: 92%**

**Red Flags (None Blocking):**
- ⚠️ 7 relations still one-way (minor - easy to fix)
- ⚠️ Metadata fields missing from 32 databases (tedious but not critical for sync)
- ⚠️ 3 Sprint formulas not implemented (minor - can operate manually short-term)

---

## Next Steps

### Immediate (Session 4 - This Week)
1. **Execute Final Polish Session (2-3 hours)**
   - Fix 7 one-way relations (30 min)
   - Add metadata fields to 32 databases (60 min)
   - Implement 3 Sprint formulas (20 min)
   - Verify/fix 2 empty formulas (15 min)

2. **Run Post-Completion Verification (30 min)**
   - Test all critical sync paths
   - Validate all 8 formulas
   - Run ULID verification script

3. **Update Documentation**
   - Mark completion plan v03 as 100% complete
   - Generate migration completion report
   - Update database IDs reference if any changes

### Short-Term (Next Week)
4. **Begin Sync Integration Implementation**
   - Use `/integrations/notion/notion_schema_export_v01.json` for schema reference
   - Build `promote_from_notion.py` script
     - Query Notion databases via API
     - Extract records with ULIDs
     - Transform to Portfolio SoT format
     - Write to Portfolio context/ directories
   - Build `sync_to_notion.py` script (reverse direction)
   - Set up weekly promotion ritual (Sundays)

5. **Update Portfolio SoT to v0.3**
   - Add missing entity schemas (organization, person, deal, topic, etc.)
   - Align Portfolio schemas with Notion schemas
   - Update context_schemas_v02.yaml → context_schemas_v03.yaml

### Medium-Term (Next 2 Weeks)
6. **Implement Hybrid Integration Strategy**
   - Tier 1 (Hot): Notion as SoT (Daily Thread, current sprint tasks)
   - Tier 2 (Warm): Notion primary, Portfolio archive (active projects, deals)
   - Tier 3 (Cold): Portfolio as SoT (completed projects, playbooks, decisions)
   - Set up promotion automation (Tier 2 → Tier 3 after 90 days)

7. **Set Up Eval Harness**
   - Implement DSPy or Ax framework
   - Configure RAGAS or DeepEval
   - Set up weekly eval runs
   - Establish ≥0.80 acceptance gate

---

## Key Insights

### What Went Right ✅

1. **ULID Strategy Worked Perfectly**
   - Script-based backfill completed successfully
   - All 34 databases now have stable canonical IDs
   - No conflicts, no format issues
   - Ready for sync operations
nto
2. **Relation Architecture Solid**
   - 94.4% of relations are properly two-way
   - All critical sync paths are bidirectional
   - Network connectivity is excellent (Projects is hub with 18 relations)
   - Minimal cleanup needed

3. **Database Schemas Well-Designed**
   - Tasks database is exemplar implementation (should be reference model)
   - Projects database is most comprehensive (44 properties, network hub)
   - CRM databases (Organizations, People, Deals, Engagements) are complete
   - Supporting databases properly structured

4. **Progress Significantly Underestimated**
   - Original estimate: 5% complete, 5-6 hours remaining
   - Actual state: 92% complete, 2-3 hours remaining
   - Most structural work already done
   - Only polish needed, no major rework

### What Needs Attention ⚠️

1. **Metadata Fields Missing**
   - Only 2 of 34 databases have created_time/last_edited_time
   - Tedious but important for audit trails
   - Should be added systematically (60 minutes)

2. **Sprint Formulas Not Implemented**
   - Currently using manual number fields
   - Should be auto-calculated from Tasks
   - Critical for capacity planning accuracy

3. **Empty Formula Expressions**
   - Projects → Billable appears empty
   - Organizations → Total Lifetime Value appears empty
   - Need verification in Notion UI

4. **Minor Relation Cleanup**
   - 7 relations need conversion from one-way to two-way
   - Easy fixes, just needs attention

### Recommendations

1. **Use Tasks Database as Template**
   - Has all required fields (Unique ID, created_time, last_edited_time)
   - All relations are two-way
   - Uses rollups effectively
   - Should be reference model for other databases

2. **Prioritize Metadata Field Addition**
   - Critical for sync operations
   - Enables TTL/promotion automation
   - Required for context_actions.csv logging
   - Do this before implementing sync scripts

3. **Test Formulas Before Production**
   - Create test records with known values
   - Verify calculations match expectations
   - Document any Notion formula limitations
   - Consider moving complex calculations to sync scripts if needed

4. **Document Relation Network**
   - Use generated RELATION_NETWORK_MAP.md
   - Understand which databases are hubs (Projects, Offers, Engagements)
   - Design sync operations to follow relation graph
   - Consider graph-based promotion (sync connected entities together)

---

## Files Generated

All reports saved in `/Users/davidkellam/portfolio/integrations/notion/`:

1. **NOTION_BUILD_COMPLETION_PLAN_v02.md** (this file)
   - Updated completion plan based on schema audit
   - Reduced scope from 5-6 hours to 2-3 hours
   - Focused on final polish only

2. **NOTION_SCHEMA_ANALYSIS_REPORT.md** (42KB)
   - Complete property listing for all 34 databases
   - Detailed relation mappings
   - Formula and rollup inventories
   - Summary tables

3. **NOTION_SCHEMA_ANALYSIS_DETAILED.md** (30KB)
   - Database-by-database comparison vs completion plan v01
   - Implementation status for each planned field
   - Specific action items per database
   - Gap analysis

4. **NOTION_SCHEMA_QUICK_REFERENCE.md** (7KB)
   - Quick stats and action items
   - Database IDs for all entities
   - Priority task list (2-3 hours)
   - Critical path verification

5. **RELATION_NETWORK_MAP.md** (19KB)
   - Visual relation network diagram
   - Complete relation inventory
   - Connectivity scores
   - Sync path recommendations

6. **notion_schema_export_v01.json** (377KB)
   - Raw JSON export of all database schemas
   - Full property configurations
   - Relation metadata
   - Formula expressions
   - Use as reference for sync script implementation

7. **database_ids_reference.md** (existing, up to date)
   - Canonical database ID reference
   - Entity type mappings
   - Sync script configuration examples

---

## Questions for Clarification

None! The path forward is clear:

1. Execute Session 4 (Final Polish) - 2-3 hours
2. Run post-completion verification - 30 minutes
3. Begin sync integration implementation

---

**Version**: v02
**Date**: 2025-10-17
**Status**: 92% Complete, 2-3 Hours Remaining
**Next Action**: Execute Session 4 (Final Polish) - fix relations, add metadata fields, implement formulas
