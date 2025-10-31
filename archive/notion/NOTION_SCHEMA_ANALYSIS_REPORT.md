# Notion Database Schema Analysis Report

**Generated**: 2025-10-17
**Total Databases Analyzed**: 34
**Source**: Notion API via `analyze_schemas.py`

---

## Executive Summary

This report compares the actual Notion database schemas (as retrieved via API) against the planned state defined in `NOTION_BUILD_COMPLETION_PLAN_v01.md`.

### Key Findings

**Session 1 (Foundation):**
- Topics: Analyzed
- Areas: Analyzed
- Ventures: Analyzed
- Offers: Analyzed

**Session 2 (Commercial):**
- Organizations: Analyzed
- People: Analyzed
- Deals: Analyzed
- Engagements: Analyzed

**Session 3 (Execution):**
- Projects: Analyzed
- Tasks: Analyzed
- Sprints: Analyzed

---

## Session 1: Foundation

### Topics

**Database ID:** `2845c4eb-9526-8171-8581-ef47a3619cf0`
**Title:** Topics
**Total Properties:** 19
**Relations:** 10
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Active | `checkbox` |
| Resource Templates | `relation` |
| Ideas Inbox | `relation` |
| Topic ID | `multi_select` |
| Projects | `relation` |
| Organizations 1 | `relation` |
| People | `relation` |
| Notes | `rich_text` |
| Unique ID | `rich_text` |
| Slug | `rich_text` |
| Type | `select` |
| Aliases | `rich_text` |
| Deals | `relation` |
| Color | `rich_text` |
| Organizations | `relation` |
| Decision Journal | `relation` |
| Parent Topic | `relation` |
| Prompt Library | `relation` |
| Topic | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Resource Templates | Resource Templates | ✅ | None |
| Ideas Inbox | Ideas Inbox | ✅ | None |
| Projects | Projects | ✅ | None |
| Organizations 1 | Organizations | ✅ | None |
| People | People | ✅ | None |
| Deals | Deals | ✅ | None |
| Organizations | Organizations | ❌ | None |
| Decision Journal | Decision Journal | ✅ | None |
| Parent Topic | Topics | ❌ | None |
| Prompt Library | Prompt Library | ✅ | None |

---

### Areas

**Database ID:** `2845c4eb-9526-8133-81f2-d40cdcd992f5`
**Title:** Areas
**Total Properties:** 12
**Relations:** 6
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Assets | `relation` |
| Active | `checkbox` |
| Service Blueprints | `relation` |
| Default Role | `select` |
| Unique ID | `rich_text` |
| Projects | `relation` |
| Area ID | `rich_text` |
| Tasks | `relation` |
| Ideas Inbox | `relation` |
| Resource Templates | `relation` |
| Description | `rich_text` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Assets | Assets | ✅ | None |
| Service Blueprints | Service Blueprints | ✅ | None |
| Projects | Projects | ✅ | None |
| Tasks | Tasks | ✅ | None |
| Ideas Inbox | Ideas Inbox | ✅ | None |
| Resource Templates | Resource Templates | ✅ | None |

---

### Ventures

**Database ID:** `2845c4eb-9526-8192-b602-d15b1d2bc537`
**Title:** Ventures
**Total Properties:** 20
**Relations:** 9
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Status | `select` |
| KPIs | `relation` |
| Type | `select` |
| Created On | `date` |
| Deals | `relation` |
| Description | `rich_text` |
| End Date | `date` |
| Start Date | `date` |
| Venture ID | `rich_text` |
| Primary Outcome | `relation` |
| Projects | `relation` |
| Target Revenue | `number` |
| Organizations | `relation` |
| Modified On | `date` |
| Unique ID | `rich_text` |
| Offers | `relation` |
| Resource Templates | `relation` |
| People | `relation` |
| Experiments | `relation` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| KPIs | Kpis | ✅ | None |
| Deals | Deals | ✅ | None |
| Primary Outcome | Outcomes | ✅ | None |
| Projects | Projects | ✅ | None |
| Organizations | Organizations | ✅ | None |
| Offers | Offers | ✅ | None |
| Resource Templates | Resource Templates | ✅ | None |
| People | People | ✅ | None |
| Experiments | Experiments | ✅ | None |

---

### Offers

**Database ID:** `2845c4eb-9526-8161-a4e4-d22141e25e0c`
**Title:** Offers
**Total Properties:** 34
**Relations:** 11
**Formulas:** 1
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Resource Templates | `relation` |
| Delivery Hours | `number` |
| Guarantee | `rich_text` |
| Problem Statement | `rich_text` |
| Offer ID | `rich_text` |
| Service Blueprint | `relation` |
| Projects | `relation` |
| Offer Type | `select` |
| Sales Page | `url` |
| Engagements | `relation` |
| Price | `number` |
| Service Blueprints | `relation` |
| Last Modified | `date` |
| Version | `rich_text` |
| Status | `select` |
| Success Metrics | `rich_text` |
| Payment Terms | `rich_text` |
| Engagement Type | `select` |
| Unique ID | `rich_text` |
| Venture | `relation` |
| Target ICP | `relation` |
| Deliverables | `rich_text` |
| Decisions | `relation` |
| Prerequisites | `rich_text` |
| Create Date | `date` |
| Deals | `relation` |
| Experiments | `relation` |
| Cost to Deliver | `number` |
| Change Notes | `rich_text` |
| Process Templates | `relation` |
| Pricing Model | `select` |
| Solution | `rich_text` |
| Margin | `formula` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Resource Templates | Resource Templates | ✅ | None |
| Service Blueprint | Service Blueprints | ❌ | None |
| Projects | Projects | ✅ | None |
| Engagements | Engagements | ✅ | None |
| Service Blueprints | Service Blueprints | ✅ | None |
| Venture | Ventures | ✅ | None |
| Target ICP | Icp Segments | ❌ | None |
| Decisions | Decision Journal | ✅ | None |
| Deals | Deals | ✅ | None |
| Experiments | Experiments | ✅ | None |
| Process Templates | Process Templates | ✅ | None |

#### Formulas

**Margin:**
```
{{notion:block_property:PUaS:00000000-0000-0000-0000-000000000000:fffb1ef2-ecbc-4f32-a092-0a1d2a975f09}} - {{notion:block_property:rreE:00000000-0000-0000-0000-000000000000:fffb1ef2-ecbc-4f32-a092-0a1d2a975f09}}
```

---


---

## Session 2: Commercial

### Organizations

**Database ID:** `2845c4eb-9526-813e-a1ef-cbea16707f73`
**Title:** Organizations
**Total Properties:** 23
**Relations:** 8
**Formulas:** 1
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Unique ID | `rich_text` |
| People | `relation` |
| Ventures | `relation` |
| Tech Stack | `rich_text` |
| Org ID | `rich_text` |
| Notes | `rich_text` |
| Touchpoints | `relation` |
| Deals | `relation` |
| Location | `rich_text` |
| Assets | `relation` |
| CRM Present | `checkbox` |
| ICP Scoring | `relation` |
| Industry Vertical | `relation` |
| Op Budget | `number` |
| Total Lifetime Value | `formula` |
| Engagements | `relation` |
| Monthly Traffic | `number` |
| Website | `url` |
| Employee Count | `number` |
| Revenue Band | `select` |
| ICP Score | `number` |
| List Size | `number` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| People | People | ✅ | None |
| Ventures | Ventures | ✅ | None |
| Touchpoints | Touchpoints | ❌ | None |
| Deals | Deals | ✅ | None |
| Assets | Assets | ✅ | None |
| ICP Scoring | Icp Scoring | ✅ | None |
| Industry Vertical | Topics | ✅ | None |
| Engagements | Engagements | ✅ | None |

#### Formulas

**Total Lifetime Value:**
```

```

---

### People

**Database ID:** `2845c4eb-9526-81d4-bc26-ce6a98a92cce`
**Title:** People
**Total Properties:** 27
**Relations:** 8
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Active Status | `select` |
| Touchpoints | `relation` |
| Position | `multi_select` |
| Communication Preference | `select` |
| Consent | `checkbox` |
| Next Action | `date` |
| Ventures | `relation` |
| Last Touch | `date` |
| Projects | `relation` |
| Decision Authority | `checkbox` |
| Source | `select` |
| Topics | `relation` |
| Unique ID | `rich_text` |
| Deals | `relation` |
| Engagement Role | `select` |
| Organization | `relation` |
| Engagements | `relation` |
| Online Profile | `url` |
| Timezone | `rich_text` |
| Website | `url` |
| Person ID | `rich_text` |
| Assets | `relation` |
| Warmth | `select` |
| Notes | `rich_text` |
| Email | `email` |
| Last Contact | `date` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Touchpoints | Touchpoints | ✅ | None |
| Ventures | Ventures | ✅ | None |
| Projects | Projects | ✅ | None |
| Topics | Topics | ✅ | None |
| Deals | Deals | ✅ | None |
| Organization | Organizations | ✅ | None |
| Engagements | Engagements | ✅ | None |
| Assets | Assets | ✅ | None |

---

### Deals

**Database ID:** `2845c4eb-9526-816c-a03c-d5744f4e5198`
**Title:** Deals
**Total Properties:** 31
**Relations:** 10
**Formulas:** 1
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Lost Reason | `multi_select` |
| Next Action Step | `select` |
| ICP Segment | `relation` |
| Engagement | `relation` |
| Unique ID | `rich_text` |
| Primary Contact | `relation` |
| Win Factors | `rich_text` |
| Related Activities | `rich_text` |
| Next Action Date | `date` |
| Touchpoints | `relation` |
| Affordability Confirmed | `checkbox` |
| Venture | `relation` |
| Source | `select` |
| Channel | `select` |
| Source Campaign | `rich_text` |
| Close By | `date` |
| Discovery Notes | `rich_text` |
| Projects | `relation` |
| Value (Est) | `number` |
| ICP Score | `number` |
| Deal ID | `rich_text` |
| Touch Count | `number` |
| Notes | `rich_text` |
| Stage | `select` |
| Probability | `number` |
| Weighted Value | `formula` |
| Organization | `relation` |
| Topics | `relation` |
| Offers | `relation` |
| Decision Journal | `relation` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| ICP Segment | Icp Segments | ✅ | None |
| Engagement | Engagements | ✅ | None |
| Primary Contact | People | ✅ | None |
| Touchpoints | Touchpoints | ✅ | None |
| Venture | Ventures | ✅ | None |
| Projects | Projects | ✅ | None |
| Organization | Organizations | ✅ | None |
| Topics | Topics | ✅ | None |
| Offers | Offers | ✅ | None |
| Decision Journal | Decision Journal | ✅ | None |

#### Formulas

**Weighted Value:**
```
multiply({{notion:block_property:V%3Cwf:00000000-0000-0000-0000-000000000000:fffb1ef2-ecbc-4f32-a092-0a1d2a975f09}}, {{notion:block_property:i_eg:00000000-0000-0000-0000-000000000000:fffb1ef2-ecbc-4f32-a092-0a1d2a975f09}})
```

---

### Engagements

**Database ID:** `2845c4eb-9526-814a-9c47-c02f22543cd7`
**Title:** Engagements
**Total Properties:** 25
**Relations:** 10
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Type | `select` |
| Health Score | `number` |
| Offer | `relation` |
| Renewal Date | `date` |
| Unique ID | `rich_text` |
| Results | `relation` |
| Status | `select` |
| NPS Score | `number` |
| Invoices | `relation` |
| Engagement ID | `rich_text` |
| End Date | `date` |
| Start Date | `date` |
| Total Contract Value | `number` |
| Organization | `relation` |
| Service Blueprint | `relation` |
| Deals | `relation` |
| Results Achieved | `rich_text` |
| MRR Value | `number` |
| Deliverables | `relation` |
| Projects | `relation` |
| Notes | `rich_text` |
| Success Metrics | `rich_text` |
| Primary Contact | `relation` |
| Touchpoints | `relation` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Offer | Offers | ✅ | None |
| Results | Results | ✅ | None |
| Invoices | Invoices | ✅ | None |
| Organization | Organizations | ✅ | None |
| Service Blueprint | Service Blueprints | ✅ | None |
| Deals | Deals | ✅ | None |
| Deliverables | Deliverables | ✅ | None |
| Projects | Projects | ✅ | None |
| Primary Contact | People | ✅ | None |
| Touchpoints | Touchpoints | ✅ | None |

---


---

## Session 3: Execution

### Projects

**Database ID:** `2845c4eb-9526-814d-bb7a-c37948933b47`
**Title:** Projects
**Total Properties:** 44
**Relations:** 18
**Formulas:** 2
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Hours Actual | `number` |
| Energy Required | `number` |
| Expense Actual | `number` |
| Context Required | `rich_text` |
| Venture | `relation` |
| Engagements | `relation` |
| Revenue Recognized | `number` |
| Deals | `relation` |
| Success Metrics | `rich_text` |
| Offer | `relation` |
| Expense Budget | `number` |
| Topics | `relation` |
| Project Focus | `select` |
| Start Date | `date` |
| Invoices | `relation` |
| Priority | `select` |
| Created On | `date` |
| Project ID | `rich_text` |
| Due Date | `date` |
| Billable | `formula` |
| Last Modified | `last_edited_time` |
| Margin | `formula` |
| Experiments | `relation` |
| Proj ID Test | `unique_id` |
| Status | `select` |
| Tasks | `relation` |
| OKR Link | `relation` |
| Service Blueprints | `relation` |
| People | `relation` |
| Lessons Learned | `rich_text` |
| Decision Journal | `relation` |
| Deliverables | `relation` |
| Description | `rich_text` |
| Outcome | `relation` |
| Process Template | `relation` |
| Unique ID | `rich_text` |
| Revenue Expected | `number` |
| Assets | `relation` |
| Hours Estimated | `number` |
| Where Left Off | `rich_text` |
| Area | `relation` |
| Resource Templates | `relation` |
| Project Type | `select` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Venture | Ventures | ✅ | None |
| Engagements | Engagements | ✅ | None |
| Deals | Deals | ✅ | None |
| Offer | Offers | ✅ | None |
| Topics | Topics | ✅ | None |
| Invoices | Invoices | ✅ | None |
| Experiments | Experiments | ✅ | None |
| Tasks | Tasks | ✅ | None |
| OKR Link | Okrs | ✅ | None |
| Service Blueprints | Service Blueprints | ✅ | None |
| People | People | ✅ | None |
| Decision Journal | Decision Journal | ✅ | None |
| Deliverables | Deliverables | ✅ | None |
| Outcome | Outcomes | ✅ | None |
| Process Template | Process Templates | ✅ | None |
| Assets | Assets | ✅ | None |
| Area | Areas | ✅ | None |
| Resource Templates | Resource Templates | ✅ | None |

#### Formulas

**Billable:**
```

```

**Margin:**
```
{{notion:block_property:r%3Af%3F:00000000-0000-0000-0000-000000000000:fffb1ef2-ecbc-4f32-a092-0a1d2a975f09}}.subtract({{notion:block_property:%3Fro%5E:00000000-0000-0000-0000-000000000000:fffb1ef2-ecbc-4f32-a092-0a1d2a975f09}})
```

---

### Tasks

**Database ID:** `2845c4eb-9526-8192-8a7b-d0888712291c`
**Title:** Tasks
**Total Properties:** 29
**Relations:** 6
**Formulas:** 0
**Rollups:** 2

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Script Text MD | `rich_text` |
| Created On | `created_time` |
| Project | `relation` |
| Last Modified | `last_edited_time` |
| Unique ID | `rich_text` |
| Estimated Hours | `number` |
| Automation Status | `select` |
| Actual Hours | `number` |
| Priority | `select` |
| Billable | `rollup` |
| Blocked By | `rich_text` |
| Actual Outcome | `rich_text` |
| Project Focus | `rollup` |
| Role/Context | `relation` |
| Task ID Test | `unique_id` |
| Deliverable | `relation` |
| Task ID | `rich_text` |
| Sprint | `relation` |
| MIT Today | `checkbox` |
| Where Left Off | `rich_text` |
| Context Switch Cost | `number` |
| Status | `select` |
| Resource Templates | `relation` |
| Energy Required | `number` |
| Outcome | `select` |
| Due Date | `date` |
| Notes | `rich_text` |
| Workflows | `relation` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Project | Projects | ✅ | None |
| Role/Context | Areas | ✅ | None |
| Deliverable | Deliverables | ✅ | None |
| Sprint | Sprints | ✅ | None |
| Resource Templates | Resource Templates | ✅ | None |
| Workflows | Workflows | ✅ | None |

#### Rollups

| Property Name | Relation Property | Rollup Property | Function |
|---------------|-------------------|-----------------|----------|
| Billable | Project | Billable | show_original |
| Project Focus | Project | Project Focus | show_original |

---

### Sprints

**Database ID:** `2845c4eb-9526-81dd-96c2-d477f7e4a140`
**Title:** Sprints
**Total Properties:** 21
**Relations:** 5
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Experiments | `relation` |
| Unique ID | `rich_text` |
| Learning Cap | `number` |
| Decisions | `relation` |
| Velocity | `number` |
| End Date | `date` |
| Revenue Target | `number` |
| Start Date | `date` |
| Decision Journal | `relation` |
| Daily Threads | `relation` |
| Outreach Target | `rich_text` |
| Theme | `rich_text` |
| Tasks | `relation` |
| Capacity | `number` |
| Planned Learning Hrs | `number` |
| Planned Billable Hrs | `number` |
| Retrospective Notes | `rich_text` |
| Learning Focus | `rich_text` |
| Handoff to Next Sprint | `rich_text` |
| Billable % | `number` |
| Sprint ID | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Experiments | Experiments | ✅ | None |
| Decisions | Decision Journal | ✅ | None |
| Decision Journal | Decision Journal | ✅ | None |
| Daily Threads | Daily Thread | ✅ | None |
| Tasks | Tasks | ✅ | None |

---


---

## Supporting & Extended Databases

### Assets

**Database ID:** `2845c4eb-9526-816b-b005-fc64cb067815`
**Title:** Assets
**Total Properties:** 24
**Relations:** 5
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Location | `select` |
| Sensitivity | `select` |
| Notes | `rich_text` |
| Alt Link | `url` |
| Owner Type | `select` |
| Deliverables | `relation` |
| Project | `relation` |
| Version | `rich_text` |
| Topics Tags | `rich_text` |
| Audience | `select` |
| Asset ID | `rich_text` |
| Unique ID | `rich_text` |
| Owner Org | `relation` |
| File URL | `url` |
| Owner_Person | `relation` |
| Updated On | `date` |
| Type | `select` |
| Venture | `select` |
| Asset Type | `select` |
| License Rights | `select` |
| Origin | `select` |
| Status | `select` |
| Area | `relation` |
| Title | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Deliverables | Deliverables | ✅ | None |
| Project | Projects | ✅ | None |
| Owner Org | Organizations | ✅ | None |
| Owner_Person | People | ✅ | None |
| Area | Areas | ✅ | None |

---

### Daily Thread

**Database ID:** `2845c4eb-9526-8167-9431-e4b011250ecb`
**Title:** Daily Thread
**Total Properties:** 19
**Relations:** 1
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Created On | `date` |
| Morning Energy | `number` |
| Sprints | `relation` |
| Evening Done | `checkbox` |
| Morning Done | `checkbox` |
| MIT 1 | `rich_text` |
| Wins | `rich_text` |
| Unique ID | `rich_text` |
| MIT 3 | `rich_text` |
| Last Modified | `date` |
| Yesterday Handoff | `rich_text` |
| Gratitude | `rich_text` |
| Open Loops | `rich_text` |
| Evening Energy | `number` |
| Blockers | `rich_text` |
| Date | `date` |
| Tomorrow Setup | `rich_text` |
| MIT 2 | `rich_text` |
| Thread ID | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Sprints | Sprints | ✅ | None |

---

### Decision Journal

**Database ID:** `2845c4eb-9526-81bf-b8b7-cd20c04b5253`
**Title:** Decision Journal
**Total Properties:** 19
**Relations:** 6
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Sprint | `relation` |
| Success Criteria | `rich_text` |
| DecOutcome | `rich_text` |
| Decision | `rich_text` |
| Options Considered | `rich_text` |
| Sprints | `relation` |
| Decision ID | `rich_text` |
| Review Date | `date` |
| Offers | `relation` |
| Date | `date` |
| Category | `select` |
| Why This Choice | `rich_text` |
| Unique ID | `rich_text` |
| Deals | `relation` |
| Projects | `relation` |
| Related To | `rich_text` |
| Topics | `relation` |
| Lesson Learned | `rich_text` |
| Title | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Sprint | Sprints | ✅ | None |
| Sprints | Sprints | ✅ | None |
| Offers | Offers | ✅ | None |
| Deals | Deals | ✅ | None |
| Projects | Projects | ✅ | None |
| Topics | Topics | ✅ | None |

---

### Deliverables

**Database ID:** `2845c4eb-9526-81cd-9c9b-f35fe889d53b`
**Title:** Deliverables
**Total Properties:** 14
**Relations:** 4
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Unique ID | `rich_text` |
| Tasks | `relation` |
| Template Used | `rich_text` |
| Assets | `relation` |
| Deliverable ID | `rich_text` |
| Version | `rich_text` |
| Notes | `rich_text` |
| Project | `relation` |
| Delivery Date | `rich_text` |
| Status | `select` |
| Engagements | `relation` |
| Type | `select` |
| File Link | `url` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Tasks | Tasks | ✅ | None |
| Assets | Assets | ✅ | None |
| Project | Projects | ✅ | None |
| Engagements | Engagements | ✅ | None |

---

### Expenses

**Database ID:** `2845c4eb-9526-818a-8550-e08e41bee1e3`
**Title:** Expenses
**Total Properties:** 10
**Relations:** 0
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Unique ID | `rich_text` |
| Notes | `rich_text` |
| Channel | `select` |
| Expense ID | `rich_text` |
| Venture | `rich_text` |
| Amount ($) | `number` |
| Project | `rich_text` |
| Date | `date` |
| Category | `select` |
| Name | `title` |

---

### Experiments

**Database ID:** `2845c4eb-9526-818e-9426-f75ae47fadba`
**Title:** Experiments
**Total Properties:** 20
**Relations:** 5
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Unique ID | `rich_text` |
| Status | `select` |
| Sprints | `relation` |
| Ventures | `relation` |
| Test Description | `rich_text` |
| Projects | `relation` |
| Time Invested Hrs | `number` |
| Experiment ID | `rich_text` |
| Hypothesis | `rich_text` |
| Notes | `rich_text` |
| Next Action | `rich_text` |
| ICE Score | `number` |
| Category | `select` |
| Offers | `relation` |
| Cost | `number` |
| Success Metrics | `rich_text` |
| Experiments | `relation` |
| Decision | `select` |
| Actual Results | `rich_text` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Sprints | Sprints | ✅ | None |
| Ventures | Ventures | ✅ | None |
| Projects | Projects | ✅ | None |
| Offers | Offers | ✅ | None |
| Experiments | Ventures | ❌ | None |

---

### Finance Snapshot

**Database ID:** `2845c4eb-9526-8192-91e4-d6ca369f2c52`
**Title:** Finance Snapshot
**Total Properties:** 7
**Relations:** 0
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Unique ID | `rich_text` |
| Cash On Hand | `number` |
| Runway Weeks | `number` |
| Notes | `rich_text` |
| Finance ID | `rich_text` |
| Monthly Burn | `number` |
| Date | `title` |

---

### Icp Scoring

**Database ID:** `2845c4eb-9526-8136-b12e-c5285eae5b23`
**Title:** ICP Scoring
**Total Properties:** 15
**Relations:** 2
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Notes | `rich_text` |
| ICP Segment | `relation` |
| Total Score | `number` |
| Missing Data | `rich_text` |
| Affordability Check | `rich_text` |
| Qualification Status | `rich_text` |
| Unique ID | `rich_text` |
| Organization | `relation` |
| Data Readiness | `number` |
| Next Action | `rich_text` |
| Revenue Score | `number` |
| Decision Maker Access | `number` |
| Urgency Score | `number` |
| Budget Score | `number` |
| ICP Score ID | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| ICP Segment | Icp Segments | ✅ | None |
| Organization | Organizations | ✅ | None |

---

### Icp Segments

**Database ID:** `2845c4eb-9526-8108-9a27-d8aea4894532`
**Title:** ICP Segments
**Total Properties:** 17
**Relations:** 2
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Qualification Score Threshold | `number` |
| Pain Points | `rich_text` |
| Buying Triggers | `rich_text` |
| Unique ID | `rich_text` |
| Industry | `rich_text` |
| Revenue Range | `rich_text` |
| Budget Range | `rich_text` |
| Sales Cycle Days | `number` |
| Affordability Formula | `rich_text` |
| Decision Maker | `rich_text` |
| Deals | `relation` |
| Segment ID | `rich_text` |
| Sample Companies | `rich_text` |
| ICP Scoring | `relation` |
| Employee Count | `rich_text` |
| Disqualifiers | `rich_text` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Deals | Deals | ✅ | None |
| ICP Scoring | Icp Scoring | ✅ | None |

---

### Ideas Inbox

**Database ID:** `2845c4eb-9526-8148-9fb6-cee23edfd497`
**Title:** Ideas Inbox
**Total Properties:** 12
**Relations:** 2
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Area | `relation` |
| Last Modified | `date` |
| Idea ID | `rich_text` |
| Effort Score | `number` |
| Created On | `date` |
| Notes | `rich_text` |
| Unique ID | `rich_text` |
| Impact Score | `number` |
| Topics | `relation` |
| Stage | `select` |
| Venture | `select` |
| Title | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Area | Areas | ✅ | None |
| Topics | Topics | ✅ | None |

---

### Invoices

**Database ID:** `2845c4eb-9526-812b-b788-eb809b7e7d02`
**Title:** Invoices
**Total Properties:** 13
**Relations:** 3
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Balance | `number` |
| Due Date | `date` |
| Invoice ID | `rich_text` |
| Payments | `relation` |
| Project | `relation` |
| Issue Date | `date` |
| Amount Paid | `number` |
| Amount | `number` |
| Unique ID | `rich_text` |
| Engagement | `relation` |
| Paid Date | `date` |
| Status | `select` |
| Invoice Item | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Payments | Payments | ✅ | None |
| Project | Projects | ✅ | None |
| Engagement | Engagements | ✅ | None |

---

### Kpis

**Database ID:** `2845c4eb-9526-8185-a3b9-e17d4ac5d7dd`
**Title:** KPIs 
**Total Properties:** 10
**Relations:** 2
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Target | `number` |
| Notes | `rich_text` |
| Venture | `relation` |
| Unique ID | `rich_text` |
| Actual | `number` |
| Metric Type | `select` |
| KPI ID | `rich_text` |
| Date | `date` |
| Outcome | `relation` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Venture | Ventures | ✅ | None |
| Outcome | Outcomes | ✅ | None |

---

### Okrs

**Database ID:** `2845c4eb-9526-8177-8d20-dee8212093e6`
**Title:** OKRs
**Total Properties:** 9
**Relations:** 1
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| KR2 | `rich_text` |
| Progress | `number` |
| KR1 | `rich_text` |
| KR3 | `rich_text` |
| Projects | `relation` |
| OKR ID | `rich_text` |
| Notes | `rich_text` |
| Unique ID | `rich_text` |
| Objective | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Projects | Projects | ✅ | None |

---

### Outcomes

**Database ID:** `2845c4eb-9526-816c-b367-d02659910f4d`
**Title:** Outcomes
**Total Properties:** 10
**Relations:** 3
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Color | `number` |
| Counts as Billable Hrs | `checkbox` |
| Active | `checkbox` |
| KPIs | `relation` |
| Description | `rich_text` |
| Ventures | `relation` |
| Unique ID | `rich_text` |
| Projects | `relation` |
| Outcome ID | `rich_text` |
| Outcome | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| KPIs | Kpis | ✅ | None |
| Ventures | Ventures | ✅ | None |
| Projects | Projects | ✅ | None |

---

### Payments

**Database ID:** `2845c4eb-9526-8154-97d7-c12a652fddcd`
**Title:** Payments
**Total Properties:** 8
**Relations:** 1
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Amount | `number` |
| Unique ID | `rich_text` |
| Payment ID | `rich_text` |
| Method | `select` |
| Invoice | `relation` |
| Date | `date` |
| Note | `rich_text` |
| Payment Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Invoice | Invoices | ✅ | None |

---

### Process Templates

**Database ID:** `2845c4eb-9526-816d-9931-ca60c74fa57b`
**Title:** Process Templates
**Total Properties:** 13
**Relations:** 4
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Notes | `rich_text` |
| Projects | `relation` |
| Process ID | `rich_text` |
| Unique ID | `rich_text` |
| Template Version | `rich_text` |
| Checklist Items (Text) | `rich_text` |
| Checklist Items (JSON) | `rich_text` |
| Offers | `relation` |
| Order Matters | `checkbox` |
| Required Resources | `relation` |
| Category | `select` |
| Related Service Blueprint | `relation` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Projects | Projects | ✅ | None |
| Offers | Offers | ✅ | None |
| Required Resources | Resource Templates | ✅ | None |
| Related Service Blueprint | Service Blueprints | ✅ | None |

---

### Prompt Library

**Database ID:** `2845c4eb-9526-8130-afc4-ea436eec55fd`
**Title:** Prompt Library
**Total Properties:** 5
**Relations:** 1
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Topics | `relation` |
| Notes | `rich_text` |
| Prompt ID | `rich_text` |
| Unique ID | `rich_text` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Topics | Topics | ✅ | None |

---

### Resource Templates

**Database ID:** `2845c4eb-9526-8192-8c4c-f194473b034e`
**Title:** Resource Templates
**Total Properties:** 23
**Relations:** 8
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Template Performance | `rich_text` |
| Service Blueprints | `relation` |
| Process Templates | `relation` |
| Content | `rich_text` |
| Variables | `rich_text` |
| Template Type | `select` |
| Status | `select` |
| Topics | `relation` |
| Success Rate | `rich_text` |
| Area | `relation` |
| Performance Metrics | `rich_text` |
| Tasks | `relation` |
| Resource ID | `rich_text` |
| Version | `rich_text` |
| Last Updated | `date` |
| Projects | `relation` |
| Created Date | `date` |
| Times Used | `rich_text` |
| Venture | `relation` |
| Unique ID | `rich_text` |
| File URL | `url` |
| Offers | `relation` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Service Blueprints | Service Blueprints | ✅ | None |
| Process Templates | Process Templates | ✅ | None |
| Topics | Topics | ✅ | None |
| Area | Areas | ✅ | None |
| Tasks | Tasks | ✅ | None |
| Projects | Projects | ✅ | None |
| Venture | Ventures | ✅ | None |
| Offers | Offers | ✅ | None |

---

### Results

**Database ID:** `2845c4eb-9526-81e3-aa8d-ec44220a022b`
**Title:** Results
**Total Properties:** 11
**Relations:** 1
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Target Value | `number` |
| Engagement | `relation` |
| Evidence | `rich_text` |
| Notes | `rich_text` |
| Metric Name | `rich_text` |
| Improvement % | `number` |
| Date Measured | `date` |
| Baseline Value | `number` |
| Current Value | `number` |
| Unique ID | `rich_text` |
| Result ID | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Engagement | Engagements | ✅ | None |

---

### Service Blueprints

**Database ID:** `2845c4eb-9526-8153-a593-c22af6165679`
**Title:** Service Blueprints
**Total Properties:** 22
**Relations:** 7
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Success Criteria | `rich_text` |
| Tools Required | `multi_select` |
| Engagements | `relation` |
| Step Name | `rich_text` |
| Launch Checklist | `rich_text` |
| Blueprint ID | `rich_text` |
| Related Offer | `relation` |
| Area | `relation` |
| Stage | `select` |
| Common Issues | `rich_text` |
| Templates | `rich_text` |
| Description | `rich_text` |
| Resource Templates | `relation` |
| Time Estimate (Min) | `number` |
| Workflows | `relation` |
| Process Templates | `relation` |
| Unique ID | `rich_text` |
| Step Number | `number` |
| Templates Used | `multi_select` |
| Projects | `relation` |
| Next Step | `rich_text` |
| Service Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Engagements | Engagements | ✅ | None |
| Related Offer | Offers | ✅ | None |
| Area | Areas | ✅ | None |
| Resource Templates | Resource Templates | ✅ | None |
| Workflows | Workflows | ✅ | None |
| Process Templates | Process Templates | ✅ | None |
| Projects | Projects | ✅ | None |

---

### Template Performance

**Database ID:** `2845c4eb-9526-811e-8fb1-cb4f7d6bda94`
**Title:** Template Performance
**Total Properties:** 14
**Relations:** 0
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Notes | `rich_text` |
| Cost Per Reply | `number` |
| Open Rate | `number` |
| Reply Rate | `number` |
| Date Range End | `date` |
| Date Range Start | `date` |
| Positive Reply Rate | `number` |
| Times Sent | `number` |
| Deal Creation Rate | `number` |
| Template | `rich_text` |
| Meeting Book Rate | `number` |
| Revenue Generated | `number` |
| Unique ID | `rich_text` |
| Performance ID | `title` |

---

### Touchpoints

**Database ID:** `2845c4eb-9526-8187-bc25-ec9fa81d0261`
**Title:** Touchpoints
**Total Properties:** 26
**Relations:** 4
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Engagements | `relation` |
| Sent | `checkbox` |
| Acquisition Channel | `select` |
| Meeting Booked | `checkbox` |
| Direction | `select` |
| A/B Test Version | `rich_text` |
| Next Step | `rich_text` |
| Followup Required? | `checkbox` |
| Follow Up Date | `date` |
| Organization | `relation` |
| Notes | `rich_text` |
| Deals | `relation` |
| Replied | `checkbox` |
| Contact | `relation` |
| Touch Number | `number` |
| Sequence Name | `rich_text` |
| Response Time | `rich_text` |
| Related Deal | `rich_text` |
| Timezone | `rich_text` |
| Personalization | `rich_text` |
| Reply Sentiment | `select` |
| Touchpoint ID | `rich_text` |
| Template Used | `rich_text` |
| Unique ID | `rich_text` |
| Opened | `checkbox` |
| Title | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Engagements | Engagements | ✅ | None |
| Organization | Organizations | ❌ | None |
| Deals | Deals | ✅ | None |
| Contact | People | ✅ | None |

---

### Workflows

**Database ID:** `2845c4eb-9526-81ec-a331-e346afbfc1ad`
**Title:** Workflows
**Total Properties:** 13
**Relations:** 2
**Formulas:** 0
**Rollups:** 0

✅ **Unique ID field present**

#### All Properties

| Property Name | Type |
|---------------|------|
| Required Tools | `multi_select` |
| Notes | `rich_text` |
| Service Blueprints | `relation` |
| Workflow ID | `rich_text` |
| Automation Potential | `number` |
| Tasks | `relation` |
| Estimated Hours | `number` |
| Current/Target State | `select` |
| Required Skills | `rich_text` |
| Unique ID | `rich_text` |
| Steps (JSON) | `rich_text` |
| Steps (Text) | `rich_text` |
| Name | `title` |

#### Relations

| Property Name | Target Database | Two-Way Sync | Synced Property |
|---------------|-----------------|--------------|------------------|
| Service Blueprints | Service Blueprints | ✅ | None |
| Tasks | Tasks | ✅ | None |

---


---

## Summary: Unique ID Coverage

| Database | Unique ID Present | Created Time | Last Edited Time |
|----------|-------------------|--------------|------------------|
| Areas | ✅ | ❌ | ❌ |
| Assets | ✅ | ❌ | ❌ |
| Daily Thread | ✅ | ❌ | ❌ |
| Deals | ✅ | ❌ | ❌ |
| Decision Journal | ✅ | ❌ | ❌ |
| Deliverables | ✅ | ❌ | ❌ |
| Engagements | ✅ | ❌ | ❌ |
| Expenses | ✅ | ❌ | ❌ |
| Experiments | ✅ | ❌ | ❌ |
| Finance Snapshot | ✅ | ❌ | ❌ |
| Icp Scoring | ✅ | ❌ | ❌ |
| Icp Segments | ✅ | ❌ | ❌ |
| Ideas Inbox | ✅ | ❌ | ❌ |
| Invoices | ✅ | ❌ | ❌ |
| Kpis | ✅ | ❌ | ❌ |
| Offers | ✅ | ❌ | ❌ |
| Okrs | ✅ | ❌ | ❌ |
| Organizations | ✅ | ❌ | ❌ |
| Outcomes | ✅ | ❌ | ❌ |
| Payments | ✅ | ❌ | ❌ |
| People | ✅ | ❌ | ❌ |
| Process Templates | ✅ | ❌ | ❌ |
| Projects | ✅ | ❌ | ✅ |
| Prompt Library | ✅ | ❌ | ❌ |
| Resource Templates | ✅ | ❌ | ❌ |
| Results | ✅ | ❌ | ❌ |
| Service Blueprints | ✅ | ❌ | ❌ |
| Sprints | ✅ | ❌ | ❌ |
| Tasks | ✅ | ✅ | ✅ |
| Template Performance | ✅ | ❌ | ❌ |
| Topics | ✅ | ❌ | ❌ |
| Touchpoints | ✅ | ❌ | ❌ |
| Ventures | ✅ | ❌ | ❌ |
| Workflows | ✅ | ❌ | ❌ |

---

## Summary: Two-Way Relations

| Database | Total Relations | Two-Way Relations | One-Way Relations |
|----------|-----------------|-------------------|-------------------|
| Areas | 6 | 6 | 0 |
| Assets | 5 | 5 | 0 |
| Daily Thread | 1 | 1 | 0 |
| Deals | 10 | 10 | 0 |
| Decision Journal | 6 | 6 | 0 |
| Deliverables | 4 | 4 | 0 |
| Engagements | 10 | 10 | 0 |
| Expenses | 0 | 0 | 0 |
| Experiments | 5 | 4 | 1 |
| Finance Snapshot | 0 | 0 | 0 |
| Icp Scoring | 2 | 2 | 0 |
| Icp Segments | 2 | 2 | 0 |
| Ideas Inbox | 2 | 2 | 0 |
| Invoices | 3 | 3 | 0 |
| Kpis | 2 | 2 | 0 |
| Offers | 11 | 9 | 2 |
| Okrs | 1 | 1 | 0 |
| Organizations | 8 | 7 | 1 |
| Outcomes | 3 | 3 | 0 |
| Payments | 1 | 1 | 0 |
| People | 8 | 8 | 0 |
| Process Templates | 4 | 4 | 0 |
| Projects | 18 | 18 | 0 |
| Prompt Library | 1 | 1 | 0 |
| Resource Templates | 8 | 8 | 0 |
| Results | 1 | 1 | 0 |
| Service Blueprints | 7 | 7 | 0 |
| Sprints | 5 | 5 | 0 |
| Tasks | 6 | 6 | 0 |
| Template Performance | 0 | 0 | 0 |
| Topics | 10 | 8 | 2 |
| Touchpoints | 4 | 3 | 1 |
| Ventures | 9 | 9 | 0 |
| Workflows | 2 | 2 | 0 |

---

## Summary: Formulas & Rollups

| Database | Formulas | Rollups |
|----------|----------|----------|
| Areas | 0 | 0 |
| Assets | 0 | 0 |
| Daily Thread | 0 | 0 |
| Deals | 1 | 0 |
| Decision Journal | 0 | 0 |
| Deliverables | 0 | 0 |
| Engagements | 0 | 0 |
| Expenses | 0 | 0 |
| Experiments | 0 | 0 |
| Finance Snapshot | 0 | 0 |
| Icp Scoring | 0 | 0 |
| Icp Segments | 0 | 0 |
| Ideas Inbox | 0 | 0 |
| Invoices | 0 | 0 |
| Kpis | 0 | 0 |
| Offers | 1 | 0 |
| Okrs | 0 | 0 |
| Organizations | 1 | 0 |
| Outcomes | 0 | 0 |
| Payments | 0 | 0 |
| People | 0 | 0 |
| Process Templates | 0 | 0 |
| Projects | 2 | 0 |
| Prompt Library | 0 | 0 |
| Resource Templates | 0 | 0 |
| Results | 0 | 0 |
| Service Blueprints | 0 | 0 |
| Sprints | 0 | 0 |
| Tasks | 0 | 2 |
| Template Performance | 0 | 0 |
| Topics | 0 | 0 |
| Touchpoints | 0 | 0 |
| Ventures | 0 | 0 |
| Workflows | 0 | 0 |
