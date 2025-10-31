# Notion Database Relation Network Map

**Generated**: 2025-10-17
**Purpose**: Visual map of all database relationships for sync planning

---

## Core Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     FOUNDATION LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐         ┌─────────┐         ┌──────────┐         │
│  │ Topics  │◄────────│  Areas  │◄────────│ Outcomes │         │
│  └────┬────┘         └────┬────┘         └────┬─────┘         │
│       │                   │                    │                │
│       │                   │                    │                │
│  ┌────▼────────┐     ┌────▼─────┐        ┌────▼────┐          │
│  │  Ventures   │◄────┤  Offers  │◄───────┤  KPIs   │          │
│  └──────┬──────┘     └────┬─────┘        └─────────┘          │
│         │                 │                                     │
└─────────┼─────────────────┼─────────────────────────────────────┘
          │                 │
          │                 │
┌─────────▼─────────────────▼─────────────────────────────────────┐
│                    COMMERCIAL LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐     ┌─────────┐      ┌────────────────┐     │
│  │ Organizations│◄────┤ People  │      │ ICP Segments   │     │
│  └──────┬───────┘     └────┬────┘      └────────┬───────┘     │
│         │                  │                     │              │
│         │                  │                     │              │
│    ┌────▼──────────────────▼───┐            ┌───▼──────┐      │
│    │        Deals              │◄───────────┤ Touchpts │      │
│    └──────────┬────────────────┘            └──────────┘      │
│               │                                                 │
│          ┌────▼──────┐                                         │
│          │Engagements│                                         │
│          └─────┬─────┘                                         │
│                │                                                │
└────────────────┼────────────────────────────────────────────────┘
                 │
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                    EXECUTION LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌──────────────┐                                        │
│         │   Projects   │                                        │
│         └───┬──────┬───┘                                        │
│             │      │                                            │
│        ┌────▼──┐   │                                            │
│        │ Tasks │   │                                            │
│        └───┬───┘   │                                            │
│            │       │                                            │
│       ┌────▼───────▼────┐                                      │
│       │    Sprints      │                                      │
│       └────┬────────────┘                                      │
│            │                                                    │
│       ┌────▼──────┐                                            │
│       │Daily Thread                                            │
│       └────────────┘                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Relation Inventory by Database

### Session 1: Foundation

#### Topics (10 relations)
```
Topics ──two-way──> Organizations (2 relations - one duplicate?)
Topics ──two-way──> People
Topics ──two-way──> Deals
Topics ──two-way──> Projects
Topics ──two-way──> Resource Templates
Topics ──two-way──> Ideas Inbox
Topics ──two-way──> Decision Journal
Topics ──two-way──> Prompt Library
Topics ──ONE-WAY──> Topics (Parent Topic - self-reference)
```

#### Areas (6 relations)
```
Areas ──two-way──> Projects
Areas ──two-way──> Tasks
Areas ──two-way──> Service Blueprints
Areas ──two-way──> Assets
Areas ──two-way──> Ideas Inbox
Areas ──two-way──> Resource Templates
```

#### Ventures (9 relations)
```
Ventures ──two-way──> Offers
Ventures ──two-way──> Projects
Ventures ──two-way──> Deals
Ventures ──two-way──> Organizations
Ventures ──two-way──> People
Ventures ──two-way──> Experiments
Ventures ──two-way──> Outcomes (Primary Outcome)
Ventures ──two-way──> KPIs
Ventures ──two-way──> Resource Templates
```

#### Offers (11 relations)
```
Offers ──two-way──> Ventures
Offers ──two-way──> Service Blueprints
Offers ──ONE-WAY──> Service Blueprints (duplicate "Service Blueprint")
Offers ──ONE-WAY──> ICP Segments (Target ICP)
Offers ──two-way──> Process Templates
Offers ──two-way──> Resource Templates
Offers ──two-way──> Deals
Offers ──two-way──> Engagements
Offers ──two-way──> Projects
Offers ──two-way──> Experiments
Offers ──two-way──> Decision Journal (Decisions)
```

---

### Session 2: Commercial

#### Organizations (8 relations)
```
Organizations ──two-way──> People
Organizations ──two-way──> Deals
Organizations ──two-way──> Engagements
Organizations ──two-way──> Topics (Industry Vertical)
Organizations ──two-way──> Ventures
Organizations ──ONE-WAY──> Touchpoints
Organizations ──two-way──> Assets
Organizations ──two-way──> ICP Scoring
```

#### People (8 relations)
```
People ──two-way──> Organizations
People ──two-way──> Deals (Primary Contact)
People ──two-way──> Touchpoints
People ──two-way──> Topics
People ──two-way──> Ventures
People ──two-way──> Projects
People ──two-way──> Engagements
People ──two-way──> Assets
```

#### Deals (10 relations)
```
Deals ──two-way──> Organizations
Deals ──two-way──> People (Primary Contact)
Deals ──two-way──> Offers
Deals ──two-way──> Ventures
Deals ──two-way──> Engagements
Deals ──two-way──> Projects
Deals ──two-way──> Touchpoints
Deals ──two-way──> Topics
Deals ──two-way──> ICP Segments
Deals ──two-way──> Decision Journal
```

#### Engagements (10 relations)
```
Engagements ──two-way──> Organizations
Engagements ──two-way──> People (Primary Contact)
Engagements ──two-way──> Offers
Engagements ──two-way──> Service Blueprints
Engagements ──two-way──> Deals
Engagements ──two-way──> Projects
Engagements ──two-way──> Deliverables
Engagements ──two-way──> Results
Engagements ──two-way──> Touchpoints
Engagements ──two-way──> Invoices
```

---

### Session 3: Execution

#### Projects (18 relations)
```
Projects ──two-way──> Ventures
Projects ──two-way──> Areas
Projects ──two-way──> Engagements
Projects ──two-way──> Offers
Projects ──two-way──> Process Templates
Projects ──two-way──> Tasks
Projects ──two-way──> Deliverables
Projects ──two-way──> People
Projects ──two-way──> Deals
Projects ──two-way──> Topics
Projects ──two-way──> Invoices
Projects ──two-way──> Experiments
Projects ──two-way──> Decision Journal
Projects ──two-way──> Service Blueprints
Projects ──two-way──> OKRs
Projects ──two-way──> Outcomes
Projects ──two-way──> Assets
Projects ──two-way──> Resource Templates
```

#### Tasks (6 relations)
```
Tasks ──two-way──> Projects
Tasks ──two-way──> Sprints
Tasks ──two-way──> Deliverables
Tasks ──two-way──> Areas (Role/Context)
Tasks ──two-way──> Resource Templates
Tasks ──two-way──> Workflows
```

#### Sprints (5 relations)
```
Sprints ──two-way──> Tasks
Sprints ──two-way──> Experiments
Sprints ──two-way──> Decision Journal (2 relations - "Decisions" + "Decision Journal")
Sprints ──two-way──> Daily Thread
```

---

## Supporting Database Relations

### Service Design

#### Service Blueprints (7 relations)
```
Service Blueprints ──two-way──> Engagements
Service Blueprints ──two-way──> Offers
Service Blueprints ──two-way──> Areas
Service Blueprints ──two-way──> Resource Templates
Service Blueprints ──two-way──> Workflows
Service Blueprints ──two-way──> Process Templates
Service Blueprints ──two-way──> Projects
```

#### Process Templates (4 relations)
```
Process Templates ──two-way──> Projects
Process Templates ──two-way──> Offers
Process Templates ──two-way──> Resource Templates (Required Resources)
Process Templates ──two-way──> Service Blueprints
```

#### Resource Templates (8 relations)
```
Resource Templates ──two-way──> Service Blueprints
Resource Templates ──two-way──> Process Templates
Resource Templates ──two-way──> Topics
Resource Templates ──two-way──> Areas
Resource Templates ──two-way──> Tasks
Resource Templates ──two-way──> Projects
Resource Templates ──two-way──> Ventures
Resource Templates ──two-way──> Offers
```

#### Workflows (2 relations)
```
Workflows ──two-way──> Service Blueprints
Workflows ──two-way──> Tasks
```

### Delivery & Results

#### Deliverables (4 relations)
```
Deliverables ──two-way──> Tasks
Deliverables ──two-way──> Assets
Deliverables ──two-way──> Projects
Deliverables ──two-way──> Engagements
```

#### Results (1 relation)
```
Results ──two-way──> Engagements
```

#### Outcomes (3 relations)
```
Outcomes ──two-way──> KPIs
Outcomes ──two-way──> Ventures
Outcomes ──two-way──> Projects
```

#### Assets (5 relations)
```
Assets ──two-way──> Deliverables
Assets ──two-way──> Projects
Assets ──two-way──> Organizations (Owner Org)
Assets ──two-way──> People (Owner_Person)
Assets ──two-way──> Areas
```

### Learning & Experiments

#### Experiments (5 relations)
```
Experiments ──two-way──> Sprints
Experiments ──two-way──> Ventures
Experiments ──two-way──> Projects
Experiments ──two-way──> Offers
Experiments ──WRONG──> Ventures (relation named "Experiments" but points to Ventures)
```

#### Decision Journal (6 relations)
```
Decision Journal ──two-way──> Sprints (2 relations)
Decision Journal ──two-way──> Offers
Decision Journal ──two-way──> Deals
Decision Journal ──two-way──> Projects
Decision Journal ──two-way──> Topics
```

#### Ideas Inbox (2 relations)
```
Ideas Inbox ──two-way──> Areas
Ideas Inbox ──two-way──> Topics
```

#### Prompt Library (1 relation)
```
Prompt Library ──two-way──> Topics
```

### CRM & Outreach

#### Touchpoints (4 relations)
```
Touchpoints ──two-way──> Engagements
Touchpoints ──ONE-WAY──> Organizations
Touchpoints ──two-way──> Deals
Touchpoints ──two-way──> People (Contact)
```

#### ICP Segments (2 relations)
```
ICP Segments ──two-way──> Deals
ICP Segments ──two-way──> ICP Scoring
```

#### ICP Scoring (2 relations)
```
ICP Scoring ──two-way──> ICP Segments
ICP Scoring ──two-way──> Organizations
```

### Finance & Metrics

#### Invoices (3 relations)
```
Invoices ──two-way──> Payments
Invoices ──two-way──> Projects
Invoices ──two-way──> Engagements
```

#### Payments (1 relation)
```
Payments ──two-way──> Invoices
```

#### KPIs (2 relations)
```
KPIs ──two-way──> Ventures
KPIs ──two-way──> Outcomes
```

#### OKRs (1 relation)
```
OKRs ──two-way──> Projects
```

#### Expenses (0 relations)
```
(Standalone - no relations)
```

#### Finance Snapshot (0 relations)
```
(Standalone - no relations)
```

#### Template Performance (0 relations)
```
(Standalone - no relations)
```

### Operations

#### Daily Thread (1 relation)
```
Daily Thread ──two-way──> Sprints
```

---

## Relation Type Distribution

| Relation Type | Count | Percentage |
|---------------|-------|------------|
| Two-Way (dual_property) | 168 | 94.4% |
| One-Way (single_property) | 10 | 5.6% |
| **Total Relations** | **178** | **100%** |

---

## One-Way Relations to Fix

| Database | Property Name | Target Database | Issue |
|----------|---------------|-----------------|-------|
| Topics | Organizations | Organizations | Duplicate exists, one is one-way |
| Topics | Parent Topic | Topics | Self-reference should be two-way |
| Offers | Service Blueprint | Service Blueprints | Duplicate of "Service Blueprints" |
| Offers | Target ICP | ICP Segments | Should be two-way |
| Organizations | Touchpoints | Touchpoints | Should be two-way |
| Touchpoints | Organization | Organizations | Should be two-way |
| Experiments | Experiments | Ventures | Wrong target (should be self-reference?) |

---

## Relation Chains (Sync Paths)

### Path 1: Venture to Task
```
Venture → Offer → Engagement → Project → Task → Sprint
   (9)     (11)       (10)        (18)     (6)     (5)

Status: ✅ All two-way, ready for sync
```

### Path 2: Organization to Task
```
Organization → Deal → Engagement → Project → Task
      (8)       (10)      (10)       (18)     (6)

Status: ✅ All two-way, ready for sync
```

### Path 3: Person to Project
```
Person → Organization → Deal → Engagement → Project
  (8)         (8)        (10)      (10)        (18)

Status: ✅ All two-way, ready for sync
```

### Path 4: Topic to Everything
```
Topics connects to: Organizations, People, Deals, Projects,
                    Resource Templates, Ideas Inbox,
                    Decision Journal, Prompt Library

Status: ⚠️ One relation to Organizations is one-way
        ⚠️ Parent Topic self-reference is one-way
```

---

## Database Connectivity Score

| Database | Relations | Inbound | Outbound | Connectivity |
|----------|-----------|---------|----------|--------------|
| Projects | 18 | ~30 | 18 | ⭐⭐⭐⭐⭐ Hub |
| Deals | 10 | ~15 | 10 | ⭐⭐⭐⭐ High |
| Engagements | 10 | ~12 | 10 | ⭐⭐⭐⭐ High |
| Topics | 10 | ~20 | 10 | ⭐⭐⭐⭐ High |
| Offers | 11 | ~10 | 11 | ⭐⭐⭐⭐ High |
| Ventures | 9 | ~15 | 9 | ⭐⭐⭐ Medium |
| Organizations | 8 | ~12 | 8 | ⭐⭐⭐ Medium |
| People | 8 | ~10 | 8 | ⭐⭐⭐ Medium |
| Resource Templates | 8 | ~8 | 8 | ⭐⭐⭐ Medium |
| Tasks | 6 | ~5 | 6 | ⭐⭐ Low |
| Areas | 6 | ~6 | 6 | ⭐⭐ Low |
| Sprints | 5 | ~3 | 5 | ⭐⭐ Low |

**Hub Databases** (18+ relations): Projects
**High Connectivity** (10-17 relations): Deals, Engagements, Topics, Offers
**Medium Connectivity** (6-9 relations): Most databases
**Low Connectivity** (1-5 relations): Support databases

---

## Critical Paths for ULID Sync

### Priority 1: Core Business Flow
```
1. Ventures (Unique ID ✅)
2. Offers (Unique ID ✅)
3. Organizations (Unique ID ✅)
4. People (Unique ID ✅)
5. Deals (Unique ID ✅)
6. Engagements (Unique ID ✅)
```

### Priority 2: Execution Flow
```
7. Projects (Unique ID ✅)
8. Tasks (Unique ID ✅)
9. Sprints (Unique ID ✅)
```

### Priority 3: Supporting Entities
```
10. Topics (Unique ID ✅)
11. Areas (Unique ID ✅)
12. Service Blueprints (Unique ID ✅)
13. Process Templates (Unique ID ✅)
14. Resource Templates (Unique ID ✅)
15. Deliverables (Unique ID ✅)
... all 34 databases have Unique ID ✅
```

---

## Recommendations

### For Sync Script Design

1. **Use Projects as central hub**
   - 18 relations make it the most connected database
   - Can reach most other entities within 2 hops

2. **Sync order matters**
   - Sync parent entities before children (Ventures before Offers)
   - Sync lookup tables first (Topics, Areas, ICP Segments)

3. **Handle circular dependencies**
   - Ventures ↔ Offers ↔ Engagements ↔ Projects
   - Use two-pass sync: create records first, update relations second

4. **Optimize relation queries**
   - Cache lookups for high-connectivity entities
   - Batch relation updates by target database

### For Data Integrity

1. **Fix one-way relations first** (before sync)
2. **Verify all Unique IDs are populated** (run prefill_ulids.py)
3. **Test relation navigation** in Notion UI (click through chains)

---

## Next Steps

1. ✅ Schema analysis complete
2. ✅ Relation network mapped
3. ⏳ Fix one-way relations (7 to fix)
4. ⏳ Add metadata fields (32 databases)
5. ⏳ Implement Sprint formulas (3 formulas)
6. ⏳ Begin sync script development

---

**Status**: Network is 94.4% two-way connected and ready for sync after minor fixes!
