# Critical Path Testing Guide

- entity: integration
- level: testing
- zone: internal
- version: v01
- tags: [notion, testing, validation, critical-paths]
- source_path: /integrations/notion/CRITICAL_PATH_TESTING_GUIDE_v01.md
- date: 2025-10-17

---

## Purpose

Validate that all critical sync paths in Notion are working correctly before implementing sync integration. This ensures two-way relations navigate properly, formulas calculate correctly, and ULIDs are present.

**Estimated Time**: 30 minutes

---

## Critical Path 1: Business Operations Flow

**Flow**: Venture → Offer → Engagement → Project → Task → Sprint

### Test Data to Create

Use these exact values for consistency and easy identification:

```
Venture:
- Name: "TEST-SYNC-VENTURE-001"
- Type: Internal
- Status: Active
- Unique ID: [auto-generated ULID]
- Target Revenue: $50,000

Offer:
- Name: "TEST-SYNC-OFFER-001"
- Venture: Link to TEST-SYNC-VENTURE-001
- Status: Active
- Type: Sprint
- Price: $10,000
- Cost to Deliver: $4,000
- Delivery Hours: 40
- Unique ID: [auto-generated ULID]

Engagement:
- Name: "TEST-SYNC-ENGAGEMENT-001"
- Offer: Link to TEST-SYNC-OFFER-001
- Status: Active
- Type: Service
- Contract Value: $10,000
- MRR: $0
- Start Date: 2025-10-17
- Unique ID: [auto-generated ULID]

Project:
- Name: "TEST-SYNC-PROJECT-001"
- Engagement: Link to TEST-SYNC-ENGAGEMENT-001
- Type: Client Delivery
- Status: Active
- Expected Revenue: $10,000
- Expense Budget: $4,000
- Expense Actual: $3,500
- Unique ID: [auto-generated ULID]

Task 1 (Billable):
- Name: "TEST-SYNC-TASK-001-BILLABLE"
- Project: Link to TEST-SYNC-PROJECT-001
- Status: In Progress
- Estimated Hours: 8
- Actual Hours: 6
- Priority: High
- Unique ID: [auto-generated ULID]

Task 2 (Learning):
- Name: "TEST-SYNC-TASK-002-LEARNING"
- Project: Link to TEST-SYNC-PROJECT-001
- Status: Not Started
- Estimated Hours: 4
- Actual Hours: 0
- Priority: Medium
- Unique ID: [auto-generated ULID]

Sprint:
- Sprint ID: "TEST-2025-W42"
- Start Date: 2025-10-14
- End Date: 2025-10-20
- Capacity: 40
- Theme: "Sync Integration Testing"
- Tasks: Link to TEST-SYNC-TASK-001-BILLABLE and TEST-SYNC-TASK-002-LEARNING
- Unique ID: [auto-generated ULID]
```

### Validation Checklist

#### 1. Venture ↔ Offer (Two-Way)

- [x] **Forward**: Open TEST-SYNC-VENTURE-001
- [x] Verify "Offers" relation property shows TEST-SYNC-OFFER-001
- [x] Click the offer link (should navigate to offer page)
- [x] **Backward**: On offer page, verify "Venture" property shows TEST-SYNC-VENTURE-001
- [x] Click venture link (should navigate back to venture page)
- [x] **Sync Test**: Edit offer name to "TEST-SYNC-OFFER-001-EDITED"
- [x] Return to venture page, refresh, verify offer name updated in relation
- [✅] **Status**: ✅ Pass / ❌ Fail

#### 2. Offer ↔ Engagement (Two-Way)

- [ ] **Forward**: Open TEST-SYNC-OFFER-001
- [ ] Verify "Engagements" relation property shows TEST-SYNC-ENGAGEMENT-001
- [ ] Click engagement link
- [ ] **Backward**: On engagement page, verify "Offer" property shows TEST-SYNC-OFFER-001
- [ ] Click offer link (should navigate back)
- [ ] **Formula Check**: Verify "Margin" on offer = $6,000 (Price $10k - Cost $4k)
- [✅ ] **Status**: ✅ Pass / ❌ Fail

#### 3. Engagement ↔ Project (Two-Way)

- [ ] **Forward**: Open TEST-SYNC-ENGAGEMENT-001
- [ ] Verify "Projects" relation property shows TEST-SYNC-PROJECT-001
- [ ] Click project link
- [ ] **Backward**: On project page, verify "Engagement" property shows TEST-SYNC-ENGAGEMENT-001
- [ ] Click engagement link (should navigate back)
- [✅] **Status**: ✅ Pass / ❌ Fail

#### 4. Project ↔ Task (Two-Way)

- [ ] **Forward**: Open TEST-SYNC-PROJECT-001
- [ ] Verify "Tasks" relation property shows both test tasks
- [ ] Click on TEST-SYNC-TASK-001-BILLABLE
- [ ] **Backward**: On task page, verify "Project" property shows TEST-SYNC-PROJECT-001
- [ ] Click project link (should navigate back)
- [ ] **Formula Check**: Verify "Margin" on project = $6,500 (Revenue $10k - Actual $3.5k)
- [❌] **Formula Check**: Verify "Billable" on project = true (has engagement)
- [ ] **Status**: ✅ Pass / ❌ Fail

#### 5. Task ↔ Sprint (Two-Way)

- [ ] **Forward**: Open TEST-SYNC-TASK-001-BILLABLE
- [ ] Verify "Sprint" relation property shows TEST-2025-W42
- [ ] Click sprint link
- [ ] **Backward**: On sprint page, verify "Tasks" property shows both test tasks
- [ ] Click task link (should navigate back)
- [❌] **Rollup Check**: On task page, verify "Billable" rollup = true (from project)
- [❌] **Rollup Check**: Verify "Project Focus" rollup matches project type
- [ ] **Status**: ✅ Pass / ❌ Fail

#### 6. Sprint Formula Validation

- [ ] Open TEST-2025-W42 sprint
- [❌] **Formula 1**: "Planned Billable Hrs" should = 8 (only billable task)
- [❌] **Formula 2**: "Planned Learning Hrs" should = 4 (only learning task)
- [❌] **Formula 3**: "Billable %" should = 20% (8 billable / 40 capacity)
- [x] Change TEST-SYNC-TASK-002-LEARNING estimated hours to 8
- [❌] Refresh sprint, verify "Planned Learning Hrs" updates to 8
- [❌] Verify "Billable %" still 20% (only counts billable tasks)
- [❌] **Status**: ✅ Pass / ❌ Fail

---

## Critical Path 2: CRM Flow

**Flow**: Organization → Person → Deal → Engagement

### Test Data to Create

```
Organization:
- Name: "TEST-SYNC-ORG-001"
- Type: Client
- Industry: Technology
- Status: Active
- Unique ID: [auto-generated ULID]

Person:
- Name: "TEST-SYNC-PERSON-001"
- Email: test-sync@example.com
- Organization: Link to TEST-SYNC-ORG-001
- Role: Decision Maker
- Engagement Role: Champion
- Decision Maker: ✓
- Unique ID: [auto-generated ULID]

Deal:
- Name: "TEST-SYNC-DEAL-001"
- Organization: Link to TEST-SYNC-ORG-001
- Primary Contact: Link to TEST-SYNC-PERSON-001
- Stage: Proposal
- Value Est: $20,000
- Probability: 75%
- Close Date: 2025-11-01
- Unique ID: [auto-generated ULID]

Engagement (reuse from Path 1):
- Name: "TEST-SYNC-ENGAGEMENT-001"
- Organization: Link to TEST-SYNC-ORG-001
- Primary Contact: Link to TEST-SYNC-PERSON-001
- Deal: Link to TEST-SYNC-DEAL-001
- [other fields as before]
```

### Validation Checklist

#### 1. Organization ↔ Person (Two-Way)

- [ ] **Forward**: Open TEST-SYNC-ORG-001
- [ ] Verify "People" relation shows TEST-SYNC-PERSON-001
- [ ] Click person link
- [ ] **Backward**: On person page, verify "Organization" shows TEST-SYNC-ORG-001
- [ ] Click org link (should navigate back)
- [ ] **Status**: ✅ Pass / ❌ Fail

#### 2. Organization ↔ Deal (Two-Way)

- [ ] **Forward**: Open TEST-SYNC-ORG-001
- [ ] Verify "Deals" relation shows TEST-SYNC-DEAL-001
- [ ] Click deal link
- [ ] **Backward**: On deal page, verify "Organization" shows TEST-SYNC-ORG-001
- [ ] Click org link (should navigate back)
- [ ] **Status**: ✅ Pass / ❌ Fail

#### 3. Person ↔ Deal (Two-Way)

- [ ] **Forward**: Open TEST-SYNC-PERSON-001
- [ ] Verify "Deals" relation shows TEST-SYNC-DEAL-001
- [ ] Click deal link
- [ ] **Backward**: On deal page, verify "Primary Contact" shows TEST-SYNC-PERSON-001
- [ ] Click person link (should navigate back)
- [ ] **Status**: ✅ Pass / ❌ Fail

#### 4. Deal ↔ Engagement (Two-Way)

- [ ] **Forward**: Open TEST-SYNC-DEAL-001
- [ ] Verify "Engagement" relation shows TEST-SYNC-ENGAGEMENT-001
- [ ] Click engagement link
- [ ] **Backward**: On engagement page, verify "Deal" shows TEST-SYNC-DEAL-001
- [ ] Click deal link (should navigate back)
- [❌] **Formula Check**: On deal, verify "Weighted Value" = $15,000 (Value $20k × Probability 75%)
- [ ] **Status**: ✅ Pass / ❌ Fail

#### 5. Organization Total Lifetime Value

- [ ] Open TEST-SYNC-ORG-001
- [❌] Verify "Total Lifetime Value" formula = $10,000 (sum of engagement contract values)
- [ ] Create second engagement for same org with contract value $5,000
- [❌] Verify "Total Lifetime Value" updates to $15,000
- [ ] **Status**: ✅ Pass / ❌ Fail

---

## All Formulas Validation Summary

### 1. Offers → Margin

- [ ] Formula: `prop("Price") - prop("Cost to Deliver")`
- [ ] Test: $10,000 - $4,000 = $6,000
- [ ] Expected: $6,000
- [ ] Actual: _________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 2. Projects → Margin

- [ ] Formula: `prop("Expected Revenue") - prop("Expense Actual")`
- [ ] Test: $10,000 - $3,500 = $6,500
- [ ] Expected: $6,500
- [ ] Actual: _________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 3. Projects → Billable

- [ ] Formula: `prop("Engagement") != empty or prop("Type") == "Client Delivery"`
- [ ] Test: Has engagement = true
- [ ] Expected: true (checkbox checked)
- [ ] Actual: _________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 4. Deals → Weighted Value

- [ ] Formula: `prop("Value Est") * prop("Probability")`
- [ ] Test: $20,000 × 0.75 = $15,000
- [ ] Expected: $15,000
- [ ] Actual: _________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 5. Organizations → Total Lifetime Value

- [ ] Formula: `prop("Engagements").map(current.prop("Total Contract Value")).sum()`
- [ ] Test: Sum of engagement contract values
- [ ] Expected: $10,000 (or $15,000 if second engagement created)
- [ ] Actual: _________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 6. Sprints → Planned Billable Hrs

- [ ] Formula: `prop("Tasks").filter(current.prop("Billable") == true).map(current.prop("Estimated Hours")).sum()`
- [ ] Test: Sum of billable task hours
- [ ] Expected: 8 hours
- [ ] Actual: _________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 7. Sprints → Planned Learning Hrs

- [ ] Formula: `prop("Tasks").filter(current.prop("Project Focus") == "Learning").map(current.prop("Estimated Hours")).sum()`
- [ ] Test: Sum of learning task hours
- [ ] Expected: 4 hours (or 8 if changed)
- [ ] Actual: _________
- [ ] **Status**: ✅ Pass / ❌ Fail

### 8. Sprints → Billable %

- [ ] Formula: `if(prop("Capacity") == 0, 0, prop("Planned Billable Hrs") / prop("Capacity"))`
- [ ] Test: 8 / 40 = 0.20 = 20%
- [ ] Expected: 20% (or 0.20)
- [ ] Actual: _________
- [ ] **Status**: ✅ Pass / ❌ Fail

---

## ULID Verification

Run the ULID verification script to confirm all test records have ULIDs:

```bash
cd /Users/davidkellam/portfolio/integrations/notion-sync
export NOTION_API_TOKEN="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"
python3 prefill_ulids.py --all --dry-run
```

**Expected Output:**
- All 34 databases: "✅ No pages found with empty Unique ID (all set!)"
- Total pages processed: 0

### Verification Checklist

- [x] All 34 databases show "✅ No pages found with empty Unique ID"
- [x] No ⚠️ warnings about missing 'Unique ID' field
- [x] Script completes without errors
- [x] **Status**: ✅ Pass / ❌ Fail

---

## Test Results Summary

**Date**: _________
**Tester**: _________
**Duration**: _________ minutes

### Critical Path 1: Business Operations

| Test | Status | Notes |
|------|--------|-------|
| Venture ↔ Offer | ☐ Pass ☐ Fail | |
| Offer ↔ Engagement | ☐ Pass ☐ Fail | |
| Engagement ↔ Project | ☐ Pass ☐ Fail | |
| Project ↔ Task | ☐ Pass ☐ Fail | |
| Task ↔ Sprint | ☐ Pass ☐ Fail | |
| Sprint Formulas | ☐ Pass ☐ Fail | |

### Critical Path 2: CRM Flow

| Test | Status | Notes |
|------|--------|-------|
| Organization ↔ Person | ☐ Pass ☐ Fail | |
| Organization ↔ Deal | ☐ Pass ☐ Fail | |
| Person ↔ Deal | ☐ Pass ☐ Fail | |
| Deal ↔ Engagement | ☐ Pass ☐ Fail | |
| Org Total Lifetime Value | ☐ Pass ☐ Fail | |

### Formula Validation

| Formula | Expected | Actual | Status | Notes |
|---------|----------|--------|--------|-------|
| Offers → Margin | $6,000 | | ☐ Pass ☐ Fail | |
| Projects → Margin | $6,500 | | ☐ Pass ☐ Fail | |
| Projects → Billable | true | | ☐ Pass ☐ Fail | |
| Deals → Weighted Value | $15,000 | | ☐ Pass ☐ Fail | |
| Orgs → Total LTV | $10,000 | | ☐ Pass ☐ Fail | |
| Sprints → Billable Hrs | 8 | | ☐ Pass ☐ Fail | |
| Sprints → Learning Hrs | 4 | | ☐ Pass ☐ Fail | |
| Sprints → Billable % | 20% | | ☐ Pass ☐ Fail | |

### ULID Verification

- [ ] All 34 databases verified
- [ ] No missing ULIDs
- [ ] Script ran successfully

---

## Issues Found

Document any issues discovered during testing:

### Issue 1
- **Component**: _______________
- **Severity**: ☐ Blocker ☐ High ☐ Medium ☐ Low
- **Description**: _______________
- **Resolution**: _______________

### Issue 2
- **Component**: _______________
- **Severity**: ☐ Blocker ☐ High ☐ Medium ☐ Low
- **Description**: _______________
- **Resolution**: _______________

---

## Overall Assessment

**Total Tests**: 22
**Passed**: ___ / 22
**Failed**: ___ / 22
**Pass Rate**: ____%

**Ready for Sync Integration?**: ☐ Yes ☐ No (fix issues first)

**Recommendations**:
- _______________________________________________
- _______________________________________________
- _______________________________________________

---

## Cleanup Instructions

After testing is complete and results documented:

1. **Option A: Keep Test Data** (recommended for reference)
   - Rename records with "[ARCHIVE]" prefix
   - Move to archive view/filter
   - Useful for future testing and sync script development

2. **Option B: Delete Test Data** (clean slate)
   - Delete TEST-2025-W42 sprint
   - Delete TEST-SYNC-TASK-001-BILLABLE and TEST-SYNC-TASK-002-LEARNING
   - Delete TEST-SYNC-PROJECT-001
   - Delete TEST-SYNC-ENGAGEMENT-001
   - Delete TEST-SYNC-DEAL-001
   - Delete TEST-SYNC-PERSON-001
   - Delete TEST-SYNC-ORG-001
   - Delete TEST-SYNC-OFFER-001
   - Delete TEST-SYNC-VENTURE-001
   - Verify relations cleaned up automatically

**Cleanup Complete**: ☐ Yes ☐ No

---

**Version**: v01
**Last Updated**: 2025-10-17
**Next Review**: After sync integration implementation

Note Formulas fail (need to update notion language 2)