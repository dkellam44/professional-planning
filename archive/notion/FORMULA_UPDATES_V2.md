# Notion Formula Updates - Language 2.0

**Date**: 2025-10-17
**Version**: v02
**Status**: Ready for Implementation

---

## Overview

This document contains all formula updates required for the Notion work system, rewritten using Notion Formula Language 2.0 syntax. All formulas have been validated against the new language specification documented in `notion_formula_reference.md`.

**Total Formulas**: 8
- ✅ Already Working: 3
- ❌ Need Implementation: 5

---

## Formula Implementation Status

### Already Implemented ✅

These formulas are already working correctly:

1. **Offers → Margin**
2. **Projects → Margin**
3. **Deals → Weighted Value**

### Need Implementation ❌

These formulas need to be added or updated in Notion:

4. **Projects → Billable** (expression appears empty)
5. **Organizations → Total Lifetime Value** (expression appears empty)
6. **Sprints → Planned Billable Hrs** (not programmed)
7. **Sprints → Planned Learning Hrs** (not programmed)
8. **Sprints → Billable %** (not programmed)

---

## Formula Definitions

---

### 1. Offers → Margin ✅

**Database**: Offers (`2845c4eb-9526-8161-a4e4-d22141e25e0c`)
**Property Name**: Margin
**Property Type**: Formula
**Output Type**: Number
**Status**: ✅ Working

**Formula**:
```javascript
prop("Price") - prop("Cost to Deliver")
```

**Purpose**: Calculate profit margin by subtracting delivery cost from price.

**Dependencies**:
- `Price` (number) - Service/product price
- `Cost to Deliver` (number) - Total cost to deliver the service

**Test Case**:
```
Price: $10,000
Cost to Deliver: $4,000
Expected Result: $6,000
```

**Implementation**: Already implemented - no changes needed.

---

### 2. Projects → Margin ✅

**Database**: Projects (`2845c4eb-9526-814d-bb7a-c37948933b47`)
**Property Name**: Margin
**Property Type**: Formula
**Output Type**: Number
**Status**: ✅ Working

**Formula**:
```javascript
prop("Expected Revenue") - prop("Expense Actual")
```

**Purpose**: Calculate project profit by subtracting actual expenses from expected revenue.

**Dependencies**:
- `Expected Revenue` (number) - Projected project revenue
- `Expense Actual` (number) - Actual expenses incurred

**Test Case**:
```
Expected Revenue: $10,000
Expense Actual: $3,500
Expected Result: $6,500
```

**Implementation**: Already implemented - no changes needed.

---

### 3. Deals → Weighted Value ✅

**Database**: Deals (`2845c4eb-9526-816c-a03c-d5744f4e5198`)
**Property Name**: Weighted Value
**Property Type**: Formula
**Output Type**: Number
**Status**: ✅ Working

**Formula**:
```javascript
prop("Value Est") * prop("Probability")
```

**Purpose**: Calculate probability-weighted deal value for pipeline forecasting.

**Dependencies**:
- `Value Est` (number) - Estimated deal value
- `Probability` (number) - Decimal probability (0.0 to 1.0)

**Test Case**:
```
Value Est: $20,000
Probability: 0.75 (75%)
Expected Result: $15,000
```

**Implementation**: Already implemented - no changes needed.

---

### 4. Projects → Billable ❌

**Database**: Projects (`2845c4eb-9526-814d-bb7a-c37948933b47`)
**Property Name**: Billable
**Property Type**: Formula
**Output Type**: Boolean (Checkbox)
**Status**: ❌ Expression appears empty - needs implementation

**Formula**:
```javascript
not(empty(prop("Engagement"))) or prop("Type") == "Client Delivery"
```

**Alternative (more explicit)**:
```javascript
if(
  not(empty(prop("Engagement"))) or prop("Type") == "Client Delivery",
  true,
  false
)
```

**Purpose**: Automatically mark projects as billable if they have an associated engagement or are client delivery type.

**Dependencies**:
- `Engagement` (relation) - Link to Engagements database
- `Type` (select) - Project type ("Client Delivery", "Internal", "Learning", etc.)

**Test Cases**:
```
Test 1:
  Engagement: TEST-SYNC-ENGAGEMENT-001 (not empty)
  Type: "Client Delivery"
  Expected Result: ✓ true (checked)

Test 2:
  Engagement: empty
  Type: "Client Delivery"
  Expected Result: ✓ true (checked)

Test 3:
  Engagement: TEST-SYNC-ENGAGEMENT-001 (not empty)
  Type: "Internal"
  Expected Result: ✓ true (checked)

Test 4:
  Engagement: empty
  Type: "Internal"
  Expected Result: ☐ false (unchecked)
```

**Implementation Steps**:
1. Open Projects database in Notion
2. Locate "Billable" property (should already exist as Formula type)
3. Click into the formula editor
4. Copy and paste the formula above
5. Save and verify with test cases
6. Confirm rollup to Tasks database still works correctly

**Rollup Impact**: The Tasks database has a "Billable" rollup that inherits this value from the Project relation. After updating this formula, verify the rollup still functions correctly.

---

### 5. Organizations → Total Lifetime Value ❌

**Database**: Organizations (`2845c4eb-9526-813e-a1ef-cbea16707f73`)
**Property Name**: Total Lifetime Value
**Property Type**: Formula
**Output Type**: Number
**Status**: ❌ Expression appears empty - needs implementation

**Formula**:
```javascript
prop("Engagements").map(current.prop("Total Contract Value")).sum()
```

**Note**: Do NOT use arrow function syntax `=>` - Notion formulas don't support it!

**Purpose**: Sum all engagement contract values for an organization to calculate total lifetime revenue.

**Dependencies**:
- `Engagements` (relation) - Link to Engagements database (list of Page objects)
- `Total Contract Value` in Engagements database (number)

**How It Works**:
1. `prop("Engagements")` - Returns a list of related engagement pages
2. `.map(current.prop("Total Contract Value"))` - For each engagement, extract the Total Contract Value property
3. `.sum()` - Sum all the extracted values

**Test Cases**:
```
Test 1 (Single Engagement):
  Organization: TEST-SYNC-ORG-001
  Engagements: [TEST-SYNC-ENGAGEMENT-001]
  Engagement Contract Value: $10,000
  Expected Result: $10,000

Test 2 (Multiple Engagements):
  Organization: TEST-SYNC-ORG-001
  Engagements: [ENGAGEMENT-001, ENGAGEMENT-002]
  Contract Values: [$10,000, $5,000]
  Expected Result: $15,000

Test 3 (No Engagements):
  Organization: TEST-SYNC-ORG-002
  Engagements: []
  Expected Result: 0
```

**Implementation Steps**:
1. Open Organizations database in Notion
2. Locate "Total Lifetime Value" property (should already exist as Formula type)
3. Click into the formula editor
4. Copy and paste the formula above
5. Save and test with organizations that have 0, 1, and 2+ engagements
6. Verify the sum updates dynamically when engagement contract values change

**Notes**:
- This formula uses Notion 2.0's list functions (`map`, `sum`)
- The `current` variable represents each engagement page in the relation
- If there are no engagements, `sum()` returns 0 (not empty)
- Changes to engagement contract values will automatically update this calculation

---

### 6. Sprints → Planned Billable Hrs ❌

**Database**: Sprints (`2845c4eb-9526-81dd-96c2-d477f7e4a140`)
**Property Name**: Planned Billable Hrs
**Property Type**: Formula
**Output Type**: Number
**Status**: ❌ Not programmed - needs implementation

**Formula**:
```javascript
prop("Tasks").filter(current.prop("Billable") == true).map(current.prop("Estimated Hours")).sum()
```

**Note**: Do NOT use arrow function syntax `=>` - Notion formulas don't support it!

**Purpose**: Calculate total planned billable hours for a sprint by summing estimated hours of all billable tasks.

**Dependencies**:
- `Tasks` (relation) - Link to Tasks database (list of Page objects)
- `Billable` in Tasks database (boolean/checkbox) - Inherited from Project via rollup
- `Estimated Hours` in Tasks database (number)

**How It Works**:
1. `prop("Tasks")` - Returns list of all tasks in the sprint
2. `.filter(current.prop("Billable") == true)` - Keep only billable tasks
3. `.map(current.prop("Estimated Hours"))` - Extract estimated hours from each billable task
4. `.sum()` - Sum all the hours

**Test Cases**:
```
Test 1 (Mixed Tasks):
  Sprint: TEST-2025-W42
  Tasks:
    - TASK-001-BILLABLE: Billable=true, Estimated Hours=8
    - TASK-002-LEARNING: Billable=false, Estimated Hours=4
  Expected Result: 8 hours

Test 2 (All Billable):
  Sprint: TEST-2025-W43
  Tasks:
    - TASK-003: Billable=true, Estimated Hours=8
    - TASK-004: Billable=true, Estimated Hours=12
  Expected Result: 20 hours

Test 3 (No Billable Tasks):
  Sprint: TEST-2025-W44
  Tasks:
    - TASK-005: Billable=false, Estimated Hours=8
    - TASK-006: Billable=false, Estimated Hours=4
  Expected Result: 0 hours

Test 4 (No Tasks):
  Sprint: TEST-2025-W45
  Tasks: []
  Expected Result: 0 hours
```

**Implementation Steps**:
1. Open Sprints database in Notion
2. Create new property called "Planned Billable Hrs" (or locate if it exists)
3. Set property type to "Formula"
4. Copy and paste the formula above
5. Save and verify with test cases
6. Confirm formula updates when tasks are added/removed or hours change

**Notes**:
- This formula chains three list operations: `filter`, `map`, `sum`
- The `current` variable in both `filter` and `map` refers to each task page
- If no billable tasks exist, returns 0 (not empty)
- This value is used by the "Billable %" formula (#8)

---

### 7. Sprints → Planned Learning Hrs ❌

**Database**: Sprints (`2845c4eb-9526-81dd-96c2-d477f7e4a140`)
**Property Name**: Planned Learning Hrs
**Property Type**: Formula
**Output Type**: Number
**Status**: ❌ Not programmed - needs implementation

**Formula**:
```javascript
prop("Tasks").filter(current.prop("Project Focus") == "Learning").map(current.prop("Estimated Hours")).sum()
```

**Note**: Do NOT use arrow function syntax `=>` - Notion formulas don't support it!

**Purpose**: Calculate total planned learning hours for a sprint by summing estimated hours of all learning-focused tasks.

**Dependencies**:
- `Tasks` (relation) - Link to Tasks database (list of Page objects)
- `Project Focus` in Tasks database (select or text) - Inherited from Project via rollup
- `Estimated Hours` in Tasks database (number)

**How It Works**:
1. `prop("Tasks")` - Returns list of all tasks in the sprint
2. `.filter(current.prop("Project Focus") == "Learning")` - Keep only learning tasks
3. `.map(current.prop("Estimated Hours"))` - Extract estimated hours from each learning task
4. `.sum()` - Sum all the hours

**Test Cases**:
```
Test 1 (Mixed Tasks):
  Sprint: TEST-2025-W42
  Tasks:
    - TASK-001-BILLABLE: Project Focus="Client Delivery", Estimated Hours=8
    - TASK-002-LEARNING: Project Focus="Learning", Estimated Hours=4
  Expected Result: 4 hours

Test 2 (Change Learning Hours):
  Sprint: TEST-2025-W42
  Tasks:
    - TASK-001-BILLABLE: Project Focus="Client Delivery", Estimated Hours=8
    - TASK-002-LEARNING: Project Focus="Learning", Estimated Hours=8 (changed from 4)
  Expected Result: 8 hours

Test 3 (Multiple Learning Tasks):
  Sprint: TEST-2025-W43
  Tasks:
    - TASK-003: Project Focus="Learning", Estimated Hours=4
    - TASK-004: Project Focus="Learning", Estimated Hours=6
  Expected Result: 10 hours

Test 4 (No Learning Tasks):
  Sprint: TEST-2025-W44
  Tasks:
    - TASK-005: Project Focus="Client Delivery", Estimated Hours=8
  Expected Result: 0 hours
```

**Implementation Steps**:
1. Open Sprints database in Notion
2. Create new property called "Planned Learning Hrs" (or locate if it exists)
3. Set property type to "Formula"
4. Copy and paste the formula above
5. Save and verify with test cases
6. Test dynamic updates by changing task estimated hours

**Notes**:
- Similar structure to "Planned Billable Hrs" but filters by Project Focus instead of Billable
- Assumes `Project Focus` is a property in Tasks (likely a rollup from Projects)
- The exact value to match ("Learning") should match the select option name in Projects
- If the select value is different, adjust the filter accordingly (e.g., "learning", "LEARNING")

---

### 8. Sprints → Billable % ❌

**Database**: Sprints (`2845c4eb-9526-81dd-96c2-d477f7e4a140`)
**Property Name**: Billable %
**Property Type**: Formula
**Output Type**: Number (displays as decimal, e.g., 0.20 for 20%)
**Status**: ❌ Not programmed - needs implementation

**Formula**:
```javascript
if(
  prop("Capacity") == 0,
  0,
  prop("Planned Billable Hrs") / prop("Capacity")
)
```

**Alternative (using ternary operator)**:
```javascript
prop("Capacity") == 0 ? 0 : prop("Planned Billable Hrs") / prop("Capacity")
```

**Purpose**: Calculate what percentage of sprint capacity is allocated to billable work. Prevents division by zero error.

**Dependencies**:
- `Capacity` (number) - Total available hours for the sprint
- `Planned Billable Hrs` (formula #6) - Sum of billable task hours

**How It Works**:
1. Check if `Capacity` is zero (to avoid division by zero)
2. If zero, return 0
3. If not zero, divide `Planned Billable Hrs` by `Capacity`
4. Result is a decimal (0.20 = 20%)

**Test Cases**:
```
Test 1 (Normal Case):
  Sprint: TEST-2025-W42
  Capacity: 40 hours
  Planned Billable Hrs: 8 hours
  Expected Result: 0.20 (20%)

Test 2 (Full Capacity):
  Sprint: TEST-2025-W43
  Capacity: 40 hours
  Planned Billable Hrs: 40 hours
  Expected Result: 1.00 (100%)

Test 3 (Over Capacity):
  Sprint: TEST-2025-W44
  Capacity: 40 hours
  Planned Billable Hrs: 50 hours
  Expected Result: 1.25 (125%)

Test 4 (Zero Capacity - Edge Case):
  Sprint: TEST-2025-W45
  Capacity: 0 hours
  Planned Billable Hrs: 8 hours
  Expected Result: 0 (prevents division by zero)

Test 5 (No Billable Work):
  Sprint: TEST-2025-W46
  Capacity: 40 hours
  Planned Billable Hrs: 0 hours
  Expected Result: 0.00 (0%)
```

**Display Options**:
```
To display as percentage in Notion, you can:
1. Leave as decimal (0.20) - simplest
2. Multiply by 100 and concatenate "%" for display:
   format((prop("Capacity") == 0 ? 0 : prop("Planned Billable Hrs") / prop("Capacity")) * 100) + "%"

   However, this changes output type to String, which limits filtering/sorting.

   RECOMMENDED: Keep as Number (decimal) for better database functionality.
```

**Implementation Steps**:
1. Open Sprints database in Notion
2. Create new property called "Billable %" (or locate if it exists)
3. Set property type to "Formula"
4. Copy and paste the formula above (use first version for Number output)
5. Save and verify with test cases
6. Test with capacity=0 to ensure no error
7. Optionally format the column display to show as percentage

**Notes**:
- MUST implement "Planned Billable Hrs" formula (#6) first
- The division by zero check is critical - Notion formulas error without it
- Returns a number between 0 and potentially >1 (if over-capacity)
- Can be used in filters, sorts, and conditional formatting
- To show as "20%" in views, use Notion's number formatting options (not in formula)

---

## Implementation Order

Implement formulas in this order to satisfy dependencies:

### Phase 1: Independent Formulas
1. **Projects → Billable** (no dependencies)
2. **Organizations → Total Lifetime Value** (no dependencies)

### Phase 2: Sprint Calculations (dependent chain)
3. **Sprints → Planned Billable Hrs** (depends on Tasks → Billable rollup)
4. **Sprints → Planned Learning Hrs** (depends on Tasks → Project Focus rollup)
5. **Sprints → Billable %** (depends on #3: Planned Billable Hrs)

**Estimated Time**: 20-30 minutes total

---

## Validation Tests

After implementing all formulas, run the critical path tests from `CRITICAL_PATH_TESTING_GUIDE_v01.md`:

### Quick Validation Checklist

**Projects → Billable**:
- [ ] Project with Engagement: ✓ true
- [ ] Project with Type="Client Delivery": ✓ true
- [ ] Project with neither: ☐ false

**Organizations → Total Lifetime Value**:
- [ ] Org with 1 engagement ($10k): $10,000
- [ ] Org with 2 engagements ($10k + $5k): $15,000
- [ ] Org with 0 engagements: $0

**Sprints → Planned Billable Hrs**:
- [ ] Sprint with 1 billable task (8h): 8
- [ ] Sprint with mixed tasks (8h billable + 4h non-billable): 8
- [ ] Sprint with 0 billable tasks: 0

**Sprints → Planned Learning Hrs**:
- [ ] Sprint with 1 learning task (4h): 4
- [ ] Sprint with 1 learning task (changed to 8h): 8
- [ ] Sprint with 0 learning tasks: 0

**Sprints → Billable %**:
- [ ] 8 billable hrs / 40 capacity: 0.20 (20%)
- [ ] 40 billable hrs / 40 capacity: 1.00 (100%)
- [ ] 0 billable hrs / 0 capacity: 0 (no error)

---

## Common Issues & Troubleshooting

### Issue: Formula shows "Error" in cells

**Possible Causes**:
- Missing dependent property (e.g., Planned Billable Hrs not created before Billable %)
- Property name mismatch (e.g., "Billable" vs "Is Billable")
- Incorrect property type (e.g., expecting number but getting text)
- Circular reference (formula references itself)

**Solutions**:
1. Check all property names match exactly (case-sensitive)
2. Verify dependent formulas are created first
3. Check property types in database schema
4. Test with simple values first, then add complexity

### Issue: Formula returns empty/null instead of 0

**Cause**: Using `sum()` on empty list or null values

**Solution**: The formulas above handle this correctly - `sum()` on empty list returns 0 in Notion 2.0

### Issue: Relation doesn't show related data

**Cause**: One-way relation instead of two-way

**Solution**: Convert relations to two-way in database settings (see `NOTION_SCHEMA_QUICK_REFERENCE.md` for list of one-way relations to fix)

### Issue: Billable % shows very large number

**Cause**: Displaying decimal as percentage without proper formatting

**Solution**: Use Notion's column number formatting (click column header → Number format → Percent)

### Issue: Map/filter not working

**Cause**: Using Notion 1.0 syntax or incorrect `current` variable

**Solution**:
- Use `current` (not `c` or `item`)
- Use `prop("Property Name")` not dot notation for initial property access
- Chain methods correctly: `.filter().map().sum()`

---

## Formula Language 2.0 Features Used

This update leverages the following Notion Formula 2.0 features:

### List Functions
- `map(list, expression)` - Transform each item in a list
- `filter(list, condition)` - Filter list items by condition
- `sum()` - Sum numeric values in a list

### Built-in Variables
- `current` - Represents current item in list operations
- Used in both `map` and `filter` operations

### Relation/Page Access
- `prop("Relation").prop("Property")` - Access properties of related pages
- Chained property access: `current.prop("Billable")`

### Logical Functions
- `if(condition, true_value, false_value)` - Conditional logic
- `empty(value)` - Check for empty/falsy values
- `not()` - Logical negation

### Operators
- `==` - Equality comparison
- `or` - Logical OR
- `/` - Division
- `-` - Subtraction

---

## Migration from Formula 1.0 (if applicable)

If you previously had formulas in the old Notion 1.0 syntax, here are the key changes:

### Key Differences

**Relation Properties**:
- **Old**: `prop("Relation")` returned comma-separated string
- **New**: `prop("Relation")` returns list of Page objects
- **Migration**: Use `.map()` to access related page properties

**Multi-Select Properties**:
- **Old**: Returned comma-separated string
- **New**: Returns list of strings
- **Migration**: Use `.length()` instead of counting commas

**List Operations**:
- **Old**: Limited support, manual string manipulation
- **New**: Native `map`, `filter`, `sum`, etc.
- **Migration**: Replace string parsing with list functions

**Example Migration**:

Old Formula 1.0:
```javascript
// Counting engagements (old way with string length)
length(replaceAll(prop("Engagements"), "[^,]", "")) + 1
```

New Formula 2.0:
```javascript
// Counting engagements (new way with list)
prop("Engagements").length()
```

---

## Next Steps

1. **Implement Formulas** (20-30 minutes)
   - Follow implementation order above
   - Copy formulas exactly as written
   - Test each formula after implementation

2. **Run Validation Tests** (30 minutes)
   - Use test data from `CRITICAL_PATH_TESTING_GUIDE_v01.md`
   - Verify all 8 formulas pass tests
   - Document any issues found

3. **Update Testing Guide** (5 minutes)
   - Mark formula tests as ✅ Pass
   - Update `CRITICAL_PATH_TESTING_GUIDE_v01.md` with results

4. **Update Schema Quick Reference** (5 minutes)
   - Change "Formulas Implemented" from 5 to 8
   - Mark formula items as complete in `NOTION_SCHEMA_QUICK_REFERENCE.md`

5. **Begin Sync Integration**
   - With formulas complete, system is ready for sync implementation
   - All critical paths verified and working

---

## Reference Documents

- **Formula Language Reference**: `/Users/davidkellam/portfolio/integrations/notion/notion_formula_reference.md`
- **Testing Guide**: `/Users/davidkellam/portfolio/integrations/notion/CRITICAL_PATH_TESTING_GUIDE_v01.md`
- **Schema Quick Reference**: `/Users/davidkellam/portfolio/integrations/notion/NOTION_SCHEMA_QUICK_REFERENCE.md`
- **Relation Network**: `/Users/davidkellam/portfolio/integrations/notion/RELATION_NETWORK_MAP.md`

---

**Document Status**: ✅ Ready for Implementation
**Last Updated**: 2025-10-17
**Next Review**: After formula implementation and testing
