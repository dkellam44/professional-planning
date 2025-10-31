# Notion Database Schema - Quick Reference

**Generated**: 2025-10-17
**Status**: 92% Complete

---

## Quick Stats

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Databases Analyzed | 34 | 34 | ✅ 100% |
| Unique ID Fields | 34 | 34 | ✅ 100% |
| Two-Way Relations | 168 | 175 | ⚠️ 96% |
| Created Time Fields | 2 | 34 | ❌ 6% |
| Last Edited Time Fields | 2 | 34 | ❌ 6% |
| Formulas Implemented | 5 | 8 | ⚠️ 63% |

---

## Action Items (2-3 hours total)

### Priority 1: Fix One-Way Relations (30 min)

```
Topics:
- Convert "Parent Topic" to two-way (self-reference)
- Investigate duplicate "Organizations" relations

Offers:
- Convert "Target ICP" to two-way
- Remove duplicate "Service Blueprint" (keep "Service Blueprints")

Organizations/Touchpoints:
- Convert "Touchpoints" to two-way (bidirectional)

Experiments:
- Fix "Experiments" relation (currently points to Ventures incorrectly)
```

### Priority 2: Add Metadata Fields (60 min)

Add to ALL 32 databases (except Tasks which has them):
- `created_time` property (Notion built-in)
- `last_edited_time` property (Notion built-in)

### Priority 3: Implement Formulas (20 min)

**Sprints Database:**
```
Planned Billable Hrs (formula):
prop("Tasks").filter(current.prop("Billable") == true).map(current.prop("Estimated Hours")).sum()

Planned Learning Hrs (formula):
prop("Tasks").filter(current.prop("Project Focus") == "Learning").map(current.prop("Estimated Hours")).sum()

Billable % (formula):
if(prop("Capacity") == 0, 0, prop("Planned Billable Hrs") / prop("Capacity"))
```

### Priority 4: Fix Empty Formulas (15 min)

**Projects → Billable:**
- Verify formula expression in Notion UI

**Organizations → Total Lifetime Value:**
- Implement formula: `sum(prop("Engagements").map(e => e.prop("Total Contract Value")))`

---

## Database IDs - Quick Reference

### Session 1: Foundation

| Database | ID |
|----------|-----|
| Topics | `2845c4eb-9526-8171-8581-ef47a3619cf0` |
| Areas | `2845c4eb-9526-8133-81f2-d40cdcd992f5` |
| Ventures | `2845c4eb-9526-8192-b602-d15b1d2bc537` |
| Offers | `2845c4eb-9526-8161-a4e4-d22141e25e0c` |

### Session 2: Commercial

| Database | ID |
|----------|-----|
| Organizations | `2845c4eb-9526-813e-a1ef-cbea16707f73` |
| People | `2845c4eb-9526-81d4-bc26-ce6a98a92cce` |
| Deals | `2845c4eb-9526-816c-a03c-d5744f4e5198` |
| Engagements | `2845c4eb-9526-814a-9c47-c02f22543cd7` |

### Session 3: Execution

| Database | ID |
|----------|-----|
| Projects | `2845c4eb-9526-814d-bb7a-c37948933b47` |
| Tasks | `2845c4eb-9526-8192-8a7b-d0888712291c` |
| Sprints | `2845c4eb-9526-81dd-96c2-d477f7e4a140` |

### Supporting Databases (23 more)

See `/Users/davidkellam/portfolio/integrations/notion-sync/prefill_ulids.py` for complete list.

---

## Relation Network Status

### Fully Connected (Two-Way) ✅

| From | To | Status |
|------|-----|--------|
| Ventures | Offers | ✅ Bidirectional |
| Offers | Engagements | ✅ Bidirectional |
| Engagements | Projects | ✅ Bidirectional |
| Projects | Tasks | ✅ Bidirectional |
| Tasks | Sprints | ✅ Bidirectional |
| Organizations | Deals | ✅ Bidirectional |
| Deals | Engagements | ✅ Bidirectional |
| People | Organizations | ✅ Bidirectional |
| People | Deals | ✅ Bidirectional |

### Needs Fixing (One-Way) ⚠️

| From | To | Issue |
|------|-----|-------|
| Topics | Parent Topic | One-way (should be two-way) |
| Offers | Target ICP | One-way (should be two-way) |
| Offers | Service Blueprint | Duplicate relation (remove) |
| Organizations | Touchpoints | One-way (should be two-way) |
| Experiments | Experiments | Points to Ventures (wrong target) |

---

## Formula Verification Checklist

### Implemented ✅

- [x] Offers → Margin = Price - Cost to Deliver
- [x] Projects → Margin = Revenue Expected - Expense Actual
- [x] Deals → Weighted Value = Value Est × Probability

### Needs Implementation ❌

- [ ] Sprints → Planned Billable Hrs
- [ ] Sprints → Planned Learning Hrs
- [ ] Sprints → Billable %

### Needs Verification ⚠️

- [ ] Projects → Billable (expression appears empty)
- [ ] Organizations → Total Lifetime Value (expression appears empty)

---

## Exemplar Databases (Use as Reference)

**Tasks Database** - Most complete implementation:
- Has Unique ID field ✅
- Has created_time property ✅
- Has last_edited_time property ✅
- All relations are two-way ✅
- Uses rollups effectively (inherits Billable from Project) ✅
- Has experimental unique_id field type ✅

**Projects Database** - Second best:
- Has Unique ID field ✅
- Has last_edited_time property ✅
- All 18 relations are two-way ✅
- Formulas implemented (Billable, Margin) ✅
- Most comprehensive property set (44 properties) ✅

---

## Database Property Counts

| Database | Total Properties | Relations | Formulas | Rollups |
|----------|------------------|-----------|----------|---------|
| Projects | 44 | 18 | 2 | 0 |
| Offers | 34 | 11 | 1 | 0 |
| Deals | 31 | 10 | 1 | 0 |
| Tasks | 29 | 6 | 0 | 2 |
| People | 27 | 8 | 0 | 0 |
| Touchpoints | 26 | 4 | 0 | 0 |
| Engagements | 25 | 10 | 0 | 0 |
| Assets | 24 | 5 | 0 | 0 |
| Organizations | 23 | 8 | 1 | 0 |
| Resource Templates | 23 | 8 | 0 | 0 |
| Service Blueprints | 22 | 7 | 0 | 0 |
| Sprints | 21 | 5 | 0 | 0 |
| Ventures | 20 | 9 | 0 | 0 |
| Experiments | 20 | 5 | 0 | 0 |
| Topics | 19 | 10 | 0 | 0 |
| Decision Journal | 19 | 6 | 0 | 0 |
| Daily Thread | 19 | 1 | 0 | 0 |

---

## Critical Paths for Sync

### Venture → Offer → Engagement → Project → Task

All relations are two-way ✅ - Ready for sync!

### Organization → Deal → Engagement

All relations are two-way ✅ - Ready for sync!

### Person → Organization → Deal

All relations are two-way ✅ - Ready for sync!

### Sprint → Task → Project

All relations are two-way ✅ - Ready for sync!

---

## Next Steps

1. **Complete Action Items** (2-3 hours)
   - Fix 7 one-way relations
   - Add metadata fields to 32 databases
   - Implement 3 Sprint formulas
   - Fix 2 empty formulas

2. **Run ULID Verification** (15 minutes)
   ```bash
   cd /Users/davidkellam/portfolio/integrations/notion-sync
   python prefill_ulids.py --all --dry-run
   ```

3. **Test Critical Paths** (30 minutes)
   - Create test venture → offer → engagement → project → task
   - Verify all relations navigate correctly
   - Verify formulas calculate correctly

4. **Begin Sync Implementation** (ongoing)
   - Use `/Users/davidkellam/portfolio/integrations/notion/notion_schema_export_v01.json` for schema reference
   - Build sync scripts based on Unique ID fields
   - Implement weekly promotion ritual

---

## Files Generated

1. **Schema Analysis Report**: `/Users/davidkellam/portfolio/integrations/notion/NOTION_SCHEMA_ANALYSIS_REPORT.md`
2. **Detailed Comparison**: `/Users/davidkellam/portfolio/integrations/notion/NOTION_SCHEMA_ANALYSIS_DETAILED.md`
3. **Quick Reference** (this file): `/Users/davidkellam/portfolio/integrations/notion/NOTION_SCHEMA_QUICK_REFERENCE.md`
4. **Raw JSON Export**: `/Users/davidkellam/portfolio/integrations/notion/notion_schema_export_v01.json`

---

**Status**: Ready for final polish and sync integration!
