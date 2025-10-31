# Formula Implementation Checklist

**Date**: 2025-10-17
**Estimated Time**: 20-30 minutes
**Reference**: See `FORMULA_UPDATES_V2.md` for detailed documentation

---

## Quick Start

All formulas have been updated to use **Notion Formula Language 2.0** syntax. This checklist will guide you through implementing the 5 missing formulas in your Notion workspace.

**Already Working**: 3 formulas (Offers → Margin, Projects → Margin, Deals → Weighted Value)
**Need Implementation**: 5 formulas (listed below)

---

## Phase 1: Independent Formulas (10 min)

### ✅ Formula 1: Projects → Billable

**Database**: Projects
**Property**: Billable (Formula → Boolean/Checkbox)

1. [ ] Open Projects database in Notion
2. [ ] Find "Billable" property (should exist, but expression may be empty)
3. [ ] Click into formula editor
4. [ ] Paste this formula:

```javascript
not(empty(prop("Engagement"))) or prop("Type") == "Client Delivery"
```

5. [ ] Save (Cmd/Ctrl + Enter)
6. [x] Test with TEST-SYNC-PROJECT-001:
   - Has Engagement? → Should show ✓ (checked)
   - Change to remove engagement and set Type ≠ "Client Delivery" → Should show ☐ (unchecked)

**Status**: [x] Complete

---

### ✅ Formula 2: Organizations → Total Lifetime Value

**Database**: Organizations
**Property**: Total Lifetime Value (Formula → Number)

1. [ ] Open Organizations database in Notion
2. [ ] Find "Total Lifetime Value" property (should exist, but expression may be empty)
3. [ ] Click into formula editor
4. [ ] Paste this formula:

```javascript
prop("Engagements").map(current.prop("Total Contract Value")).sum()
```

**CRITICAL**: Do NOT use arrow syntax `=>` - Notion doesn't support it! This was the cause of the error.

5. [ ] Save (Cmd/Ctrl + Enter)
6. [ ] Test with TEST-SYNC-ORG-001:
   - 1 engagement ($10,000) → Should show: 10000
   - Add second engagement ($5,000) → Should show: 15000

**Status**: [x] Complete

---

## Phase 2: Sprint Formulas (10 min)

**IMPORTANT**: Implement in this order - Formula 3 depends on nothing, Formula 4 depends on nothing, Formula 5 depends on Formula 3.

### ✅ Formula 3: Sprints → Planned Billable Hrs

**Database**: Sprints
**Property**: Planned Billable Hrs (Formula → Number)

1. [ ] Open Sprints database in Notion
2. [ ] Find "Planned Billable Hrs" property (or create new Formula property with this name)
3. [ ] Click into formula editor
4. [ ] Paste this formula:

```javascript
prop("Tasks").filter(current.prop("Billable") == true).map(current.prop("Estimated Hours")).sum()
```

**CRITICAL**: Do NOT use arrow syntax `=>` - Notion doesn't support it! This was the cause of the error.

5. [ ] Save (Cmd/Ctrl + Enter)
6. [ ] Test with TEST-2025-W42:
   - Has TASK-001-BILLABLE (8h, Billable=true) + TASK-002-LEARNING (4h, Billable=false)
   - Should show: 8

**Status**: [x] Complete

---

### ✅ Formula 4: Sprints → Planned Learning Hrs

**Database**: Sprints
**Property**: Planned Learning Hrs (Formula → Number)

1. [ ] Open Sprints database in Notion
2. [ ] Find "Planned Learning Hrs" property (or create new Formula property with this name)
3. [ ] Click into formula editor
4. [ ] Paste this formula:

```javascript
prop("Tasks").filter(current.prop("Project Focus") == "Learning").map(current.prop("Estimated Hours")).sum()
```

**CRITICAL**: Do NOT use arrow syntax `=>` - Notion doesn't support it! This was the cause of the error.

5. [ ] Save (Cmd/Ctrl + Enter)
6. [ ] Test with TEST-2025-W42:
   - Has TASK-002-LEARNING with Project Focus="Learning", 4h
   - Should show: 4
   - Change task hours to 8h → Should update to: 8

**Status**: [x] Complete

---

### ✅ Formula 5: Sprints → Billable %

**Database**: Sprints
**Property**: Billable % (Formula → Number)

**PREREQUISITE**: Formula 3 (Planned Billable Hrs) must be implemented first!

1. [ ] Verify "Planned Billable Hrs" property exists and works
2. [ ] Open Sprints database in Notion
3. [ ] Find "Billable %" property (or create new Formula property with this name)
4. [ ] Click into formula editor
5. [ ] Paste this formula:

```javascript
if(prop("Capacity") == 0, 0, prop("Planned Billable Hrs") / prop("Capacity"))
```

6. [ ] Save (Cmd/Ctrl + Enter)
7. [ ] Test with TEST-2025-W42:
   - Capacity: 40, Planned Billable Hrs: 8
   - Should show: 0.2 (which is 20%)
8. [ ] Optional: Format column to display as percentage
   - Click column header → Number format → Percent

**Status**: [x] Complete

---

## Validation Tests

After implementing all formulas, run these quick tests:

### Projects → Billable
- [ ] Project with Engagement linked: ✓ true
- [ ] Project with Type="Client Delivery" (no engagement): ✓ true
- [ ] Project with neither: ☐ false

### Organizations → Total Lifetime Value
- [ ] Org with 0 engagements: 0
- [ ] Org with 1 engagement ($10k): 10000
- [ ] Org with 2 engagements ($10k + $5k): 15000

### Sprints → Planned Billable Hrs
- [ ] Sprint with 1 billable task (8h): 8
- [ ] Sprint with mixed tasks (8h billable + 4h learning): 8
- [ ] Sprint with no billable tasks: 0

### Sprints → Planned Learning Hrs
- [ ] Sprint with 1 learning task (4h): 4
- [ ] Change learning task to 8h: 8 (auto-updates)
- [ ] Sprint with no learning tasks: 0

### Sprints → Billable %
- [ ] 8h billable / 40h capacity: 0.2 (20%)
- [ ] 40h billable / 40h capacity: 1.0 (100%)
- [ ] 0h capacity (edge case): 0 (no error)

---

## Troubleshooting

### "Error" shows in formula cells

**Check**:
- [ ] Property names match exactly (case-sensitive)
- [ ] Dependent formulas created first (e.g., "Planned Billable Hrs" before "Billable %")
- [ ] Using `current` variable (not `t`, `e`, or other abbreviations)
- [ ] Property type is correct (Formula, not regular field)

### Formula returns empty instead of 0

**Solution**: The formulas above handle this correctly. `.sum()` on empty list returns 0.

### "Planned Billable Hrs" property not found (when implementing Billable %)

**Solution**: Go back and implement Formula 3 first. Formulas must be created in order.

### Relation shows empty when it shouldn't

**Check**:
- [ ] Relations are two-way (bidirectional)
- [ ] Test data actually has relations linked
- [ ] See `RELATION_NETWORK_MAP.md` for relation requirements

---

## Common Formula Syntax Notes

### ✅ Correct Notion 2.0 Syntax

```javascript
// List operations - use .sum() at the end (NO ARROW SYNTAX!)
prop("Relation").map(current.prop("Amount")).sum()

// List operations - chain filter, map, sum (NO ARROW SYNTAX!)
prop("Tasks")
  .filter(current.prop("Status") == "Done")
  .map(current.prop("Hours"))
  .sum()

// Use "current" variable directly (NOT "current => ")
current.prop("Property Name")

// Empty check with not()
not(empty(prop("Relation")))
```

### ❌ Incorrect/Old Syntax

```javascript
// DON'T: Arrow function syntax => (NOT SUPPORTED!)
prop("Relation").map(current => current.prop("Amount"))
prop("Tasks").filter(current => current.prop("Status") == "Done")

// DON'T: sum() wrapping everything (old Notion 1.0 style)
sum(prop("Relation").map(current.prop("Amount")))

// DON'T: Abbreviated variables
prop("Tasks").filter(t.prop("Billable"))

// DON'T: Direct property access on current without prop()
current.Status

// DON'T: Using !empty() instead of not(empty())
!empty(prop("Relation"))
```

---

## After Implementation

### Update Documentation

1. [ ] Open `CRITICAL_PATH_TESTING_GUIDE_v01.md`
2. [ ] Mark all formula tests as ✅ Pass (lines 115, 135, 145, 152-158, 239, 245)
3. [ ] Update test results summary (lines 373-381)

### Update Schema Status

1. [ ] Open `NOTION_SCHEMA_QUICK_REFERENCE.md`
2. [ ] Change "Formulas Implemented" from 5 to 8 (line 17)
3. [ ] Mark formulas as complete in checklist (lines 143-150)

### Run Full Critical Path Test

1. [ ] Follow complete test procedure in `CRITICAL_PATH_TESTING_GUIDE_v01.md`
2. [ ] Verify all 8 formulas pass
3. [ ] Document any issues found

---

## Time Tracking

**Start Time**: __________
**End Time**: __________
**Total Time**: __________ (Target: 20-30 minutes)

**Formulas Completed**: _5__ / 5

---

## Summary

| Formula | Database | Status |
|---------|----------|--------|
| Projects → Billable | Projects | [ ] Done |
| Organizations → Total Lifetime Value | Organizations | [ ] Done |
| Sprints → Planned Billable Hrs | Sprints | [ ] Done |
| Sprints → Planned Learning Hrs | Sprints | [ ] Done |
| Sprints → Billable % | Sprints | [ ] Done |

**All Formulas Complete?** [x] Yes [ ] No

**Ready for Sync Integration?** [ ] Yes [ ] No

---

## Reference Documents

- **Detailed Documentation**: `FORMULA_UPDATES_V2.md` (comprehensive formulas with examples)
- **Formula Language Reference**: `notion_formula_reference.md` (Notion 2.0 syntax guide)
- **Testing Guide**: `CRITICAL_PATH_TESTING_GUIDE_v01.md` (full test procedures)
- **Schema Reference**: `NOTION_SCHEMA_QUICK_REFERENCE.md` (system overview)

---

**Last Updated**: 2025-10-17
**Status**: Ready for implementation
