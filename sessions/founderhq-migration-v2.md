# Founder HQ v0.4 Notion Migration - Execution Plan v2.0

## Status: UPDATED - NORMALIZED SCHEMA
**Last Updated:** 2025-10-05
**Version:** 2.0 - Two-Way Relations & Normalized Fields

---

## KEY CHANGES IN V2.0

### Philosophy
- **All relations are now TWO-WAY (bidirectional)**
- **Normalized field names** (consistent, concise)
- **Removed redundancies** (duplicate IDs, overlapping fields)
- **Clean slate approach** for problematic conversions

### Benefits
✅ Navigate relationships from both sides  
✅ Automatic rollups and counts  
✅ Better data integrity  
✅ Cleaner, more maintainable schema  
✅ Future-proof design

---

## COMPLETED ✅

### DB Outcomes
- [x] Renamed "Active?" → "Active"
- [x] Converted Ventures: text → relation (two-way)
- [x] Database renamed to "DB Outcomes"

---

## SESSION 1: Foundation & Business Architecture (120 min)

### 1. Topics (20 min)
**Database ID:** `2845c4eb-9526-8171-8581-ef47a3619cf0`

**Fields to Add:**
- Type (select): Industry, Channel, Persona, Tool, Skill
- Parent Topic (relation ↔ self): For hierarchy
- Aliases (text): Alternative names
- Color (select/color): Visual identifier
- Active (checkbox): Whether in use
- Slug (text): URL-friendly identifier

**Status:** [ ] Not Started

---

### 2. Areas (15 min)
**Database ID:** `2845c4eb-9526-8133-81f2-d40cdcd992f5`
**Current Name:** Functional Areas → **Rename to: Areas**

**Fields to Add:**
- Default Role (select): Primary role/context
- Active (checkbox): Whether active

**Fields to Keep:**
- Name (title) ✓
- Description (text) ✓

**Status:** [ ] Not Started

---

### 3. Ventures (25 min)
**Database ID:** `2845c4eb-9526-8192-b602-d15b1d2bc537`

**Fields to Update:**

```json
{
  "Type": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Agency", "color": "blue"},
        {"name": "Product", "color": "green"},
        {"name": "Service", "color": "purple"},
        {"name": "Internal", "color": "gray"}
      ]
    }
  },
  "Status": {
    "type": "select", 
    "select": {
      "options": [
        {"name": "Active", "color": "green"},
        {"name": "Paused", "color": "yellow"},
        {"name": "Archived", "color": "gray"}
      ]
    }
  },
  "Target Revenue": {
    "type": "number",
    "number": {"format": "dollar"}
  },
  "Start Date": {
    "type": "date"
  },
  "End Date": {
    "type": "date"
  }
}
```

**New Two-Way Relations:**
```json
{
  "Offers": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8112-8201-000ba408243f",
      "dual_property": {
        "synced_property_name": "Venture"
      }
    }
  }
}
```

**Fields to Add:**
- Unique ID (text): For UUID/ULID
- Venture ID (text): For VENT-001 format

**Status:** [ ] Not Started

---

### 4. Offers - NORMALIZED SCHEMA (45 min)
**Database ID:** `2845c4eb-9526-8161-a4e4-d22141e25e0c`

#### Phase 4A: Remove Redundancies (5 min)

**Delete these fields:**
```json
{
  "Offer ID": null,
  "Typical Engagement Length": null,
  "Change Notes": null,
  "Template Assets": null
}
```

**Status:** [ ] Not Started

---

#### Phase 4B: Rename Fields (5 min)

**Rename operations:**
```
"Time To Deliver Hrs" → "Delivery Hours"
"Experiment Log" → "Experiments" 
"Decision Journal" → "Decisions"
```

**Status:** [ ] Not Started

---

#### Phase 4C: Create Two-Way Relations (30 min)

**Delete old text fields first:**
```json
{
  "Process Templates": null,
  "Projects": null,
  "Deals": null,
  "Engagements": null
}
```

**Then create as two-way relations:**

```json
{
  "Venture": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8182-8ccf-000b14d4c431",
      "dual_property": {
        "synced_property_name": "Offers"
      }
    }
  },
  "Service Blueprint": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-818d-b5ba-000b6e95ec3d",
      "dual_property": {
        "synced_property_name": "Offers"
      }
    }
  },
  "Target ICP": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-81eb-b9dd-000b90af9399",
      "dual_property": {
        "synced_property_name": "Offers"
      }
    }
  },
  "Process Templates": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8168-8e87-000bf4f14d76",
      "dual_property": {
        "synced_property_name": "Offers"
      }
    }
  },
  "Resource Templates": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-81c0-9921-000bd9dd5664",
      "dual_property": {
        "synced_property_name": "Offers"
      }
    }
  },
  "Deals": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-816c-a03c-d5744f4e5198",
      "dual_property": {
        "synced_property_name": "Offer"
      }
    }
  },
  "Experiments": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-81e0-9f6e-c71b53d32c41",
      "dual_property": {
        "synced_property_name": "Offers"
      }
    }
  },
  "Decisions": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8187-98f3-ef3afbcaf7b6",
      "dual_property": {
        "synced_property_name": "Offers"
      }
    }
  },
  "Engagements": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-814a-9c47-c02f22543cd7",
      "dual_property": {
        "synced_property_name": "Offer"
      }
    }
  },
  "Projects": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-814d-bb7a-c37948933b47",
      "dual_property": {
        "synced_property_name": "Offer"
      }
    }
  }
}
```

**Status:** [ ] Not Started

---

#### Phase 4D: Final Schema Verification (5 min)

**Verify complete schema:**

```
OFFERS - FINAL SCHEMA
=====================

Identity:
✓ Name (title)
✓ Unique ID (text)

Status & Type:
✓ Status (select): Draft, Active, Sunset
✓ Type (select): Diagnostic, Sprint, Retainer, Product, Subscription
✓ Version (text)

Relations (All ↔):
✓ Venture ↔ Ventures
✓ Target ICP ↔ ICP Segments
✓ Service Blueprint ↔ Service Blueprints
✓ Process Templates ↔ Process Templates
✓ Resource Templates ↔ Resource Templates
✓ Deals ↔ Deals
✓ Engagements ↔ Engagements
✓ Projects ↔ Projects
✓ Experiments ↔ Experiments
✓ Decisions ↔ Decision Journal

Value Proposition:
✓ Problem Statement (text)
✓ Solution (text)
✓ Deliverables (text)
✓ Success Metrics (text)

Pricing:
✓ Price (currency)
✓ Cost to Deliver (currency)
✓ Margin (formula)
✓ Pricing Model (select)
✓ Payment Terms (text)

Delivery:
✓ Delivery Hours (number)
✓ Engagement Type (select): One-time, Retainer, Subscription
✓ Guarantee (text)
✓ Prerequisites (text)

Marketing:
✓ Sales Page (url)

Metadata:
✓ Create Date (date)
✓ Last Modified (date)
```

**Status:** [ ] Not Started

---

## SESSION 2: Commercial Management (90 min)

### 5. Organizations (25 min)
**Database ID:** `2845c4eb-9526-813e-a1ef-cbea16707f73`

**Convert to Two-Way Relations:**
```json
{
  "Industry Vertical": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8171-8581-ef47a3619cf0",
      "dual_property": {
        "synced_property_name": "Organizations"
      }
    }
  },
  "People": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-81d4-bc26-ce6a98a92cce",
      "dual_property": {
        "synced_property_name": "Organization"
      }
    }
  },
  "Deals": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-816c-a03c-d5744f4e5198",
      "dual_property": {
        "synced_property_name": "Organization"
      }
    }
  },
  "Engagements": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-814a-9c47-c02f22543cd7",
      "dual_property": {
        "synced_property_name": "Organization"
      }
    }
  }
}
```

**Add Formula:**
```json
{
  "Total Lifetime Value": {
    "type": "formula",
    "formula": {
      "expression": "sum(prop(\"Engagements\").map(current => current.prop(\"Contract Value\")))"
    }
  }
}
```

**Status:** [ ] Not Started

---

### 6. People (20 min)
**Database ID:** `2845c4eb-9526-81d4-bc26-ce6a98a92cce`

**Fields to Add:**
```json
{
  "Engagement Role": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Champion", "color": "green"},
        {"name": "Decision Maker", "color": "blue"},
        {"name": "End User", "color": "purple"},
        {"name": "Influencer", "color": "yellow"}
      ]
    }
  },
  "Warmth": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Warm", "color": "green"},
        {"name": "Cold", "color": "blue"},
        {"name": "Referral", "color": "purple"}
      ]
    }
  },
  "Preferred Communication": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Email", "color": "blue"},
        {"name": "Slack", "color": "purple"},
        {"name": "Phone", "color": "green"},
        {"name": "Text", "color": "yellow"}
      ]
    }
  },
  "Time Zone": {"type": "rich_text", "rich_text": {}},
  "Decision Maker": {"type": "checkbox", "checkbox": {}},
  "Consent": {"type": "checkbox", "checkbox": {}},
  "Last Contact": {"type": "date", "date": {}},
  "Unique ID": {"type": "rich_text", "rich_text": {}}
}
```

**Convert to Two-Way Relations:**
```json
{
  "Organization": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-813e-a1ef-cbea16707f73",
      "dual_property": {
        "synced_property_name": "People"
      }
    }
  },
  "Deals": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-816c-a03c-d5744f4e5198",
      "dual_property": {
        "synced_property_name": "Primary Contact"
      }
    }
  },
  "Touchpoints": {
    "type": "relation",
    "relation": {
      "data_source_id": "TOUCHPOINTS_DATA_SOURCE_ID",
      "dual_property": {
        "synced_property_name": "Person"
      }
    }
  }
}
```

**Status:** [ ] Not Started

---

### 7. Deals (25 min)
**Database ID:** `2845c4eb-9526-816c-a03c-d5744f4e5198`

**Add Fields:**
```json
{
  "Probability": {
    "type": "number",
    "number": {"format": "percent"}
  },
  "Lost Reason": {
    "type": "select",
    "select": {
      "options": [
        {"name": "No Budget", "color": "red"},
        {"name": "Bad Timing", "color": "yellow"},
        {"name": "Competitor", "color": "orange"},
        {"name": "No Fit", "color": "gray"}
      ]
    }
  },
  "Win Factors": {"type": "rich_text", "rich_text": {}},
  "Unique ID": {"type": "rich_text", "rich_text": {}},
  "Deal ID": {"type": "rich_text", "rich_text": {}}
}
```

**Add Formula:**
```json
{
  "Weighted Value": {
    "type": "formula",
    "formula": {
      "expression": "prop(\"Value Est\") * prop(\"Probability\")"
    }
  }
}
```

**Convert to Two-Way Relations:**
```json
{
  "Organization": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-813e-a1ef-cbea16707f73",
      "dual_property": {
        "synced_property_name": "Deals"
      }
    }
  },
  "Primary Contact": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-81d4-bc26-ce6a98a92cce",
      "dual_property": {
        "synced_property_name": "Deals"
      }
    }
  },
  "Offer": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8112-8201-000ba408243f",
      "dual_property": {
        "synced_property_name": "Deals"
      }
    }
  },
  "Venture": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8182-8ccf-000b14d4c431",
      "dual_property": {
        "synced_property_name": "Deals"
      }
    }
  },
  "Engagement": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-814a-9c47-c02f22543cd7",
      "dual_property": {
        "synced_property_name": "Deal"
      }
    }
  }
}
```

**Status:** [ ] Not Started

---

### 8. Engagements (30 min)
**Database ID:** `2845c4eb-9526-814a-9c47-c02f22543cd7`

**CRITICAL - Most fields likely missing!**

**Fields to Add:**
```json
{
  "Type": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Service", "color": "blue"},
        {"name": "Subscription", "color": "green"},
        {"name": "Enrollment", "color": "purple"},
        {"name": "Partnership", "color": "yellow"}
      ]
    }
  },
  "Status": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Active", "color": "green"},
        {"name": "Paused", "color": "yellow"},
        {"name": "Complete", "color": "blue"},
        {"name": "Churned", "color": "red"}
      ]
    }
  },
  "Start Date": {"type": "date", "date": {}},
  "End Date": {"type": "date", "date": {}},
  "Contract Value": {"type": "number", "number": {"format": "dollar"}},
  "MRR": {"type": "number", "number": {"format": "dollar"}},
  "Health Score": {"type": "number", "number": {}},
  "Renewal Date": {"type": "date", "date": {}},
  "NPS Score": {"type": "number", "number": {}},
  "Success Metrics": {"type": "rich_text", "rich_text": {}},
  "Unique ID": {"type": "rich_text", "rich_text": {}},
  "Engagement ID": {"type": "rich_text", "rich_text": {}}
}
```

**Convert to Two-Way Relations:**
```json
{
  "Organization": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-813e-a1ef-cbea16707f73",
      "dual_property": {
        "synced_property_name": "Engagements"
      }
    }
  },
  "Primary Contact": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-81d4-bc26-ce6a98a92cce",
      "dual_property": {
        "synced_property_name": "Engagements"
      }
    }
  },
  "Deal": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-816c-a03c-d5744f4e5198",
      "dual_property": {
        "synced_property_name": "Engagement"
      }
    }
  },
  "Offer": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8112-8201-000ba408243f",
      "dual_property": {
        "synced_property_name": "Engagements"
      }
    }
  },
  "Service Blueprint": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-818d-b5ba-000b6e95ec3d",
      "dual_property": {
        "synced_property_name": "Engagements"
      }
    }
  },
  "Projects": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-814d-bb7a-c37948933b47",
      "dual_property": {
        "synced_property_name": "Engagement"
      }
    }
  },
  "Deliverables": {
    "type": "relation",
    "relation": {
      "data_source_id": "DELIVERABLES_DATA_SOURCE_ID",
      "dual_property": {
        "synced_property_name": "Engagement"
      }
    }
  },
  "Results": {
    "type": "relation",
    "relation": {
      "data_source_id": "RESULTS_DATA_SOURCE_ID",
      "dual_property": {
        "synced_property_name": "Engagement"
      }
    }
  }
}
```

**Status:** [ ] Not Started

---

## SESSION 3: Execution Core (90 min)

### 9. Projects (40 min)
**Database ID:** `2845c4eb-9526-814d-bb7a-c37948933b47`

**Normalize Field Names:**
```
"Expense Budget ($)" → "Budget"
"Expense Actual ($)" → "Actual Expenses"
"Margin ($)" → "Margin"
"Revenue Expected" → "Expected Revenue"
"Revenue Recognized" → "Recognized Revenue"
```

**Add/Update Fields:**
```json
{
  "Type": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Client Delivery", "color": "blue"},
        {"name": "Internal Development", "color": "purple"},
        {"name": "Learning", "color": "yellow"},
        {"name": "Operations", "color": "gray"}
      ]
    }
  },
  "Status": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Planning", "color": "gray"},
        {"name": "Active", "color": "green"},
        {"name": "On Hold", "color": "yellow"},
        {"name": "Complete", "color": "blue"},
        {"name": "Cancelled", "color": "red"}
      ]
    }
  },
  "Hours Estimated": {"type": "number", "number": {}},
  "Hours Actual": {"type": "number", "number": {}},
  "Unique ID": {"type": "rich_text", "rich_text": {}},
  "Project ID": {"type": "rich_text", "rich_text": {}}
}
```

**Convert to Two-Way Relations:**
```json
{
  "Venture": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8182-8ccf-000b14d4c431",
      "dual_property": {
        "synced_property_name": "Projects"
      }
    }
  },
  "Area": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8133-81f2-d40cdcd992f5",
      "dual_property": {
        "synced_property_name": "Projects"
      }
    }
  },
  "Engagement": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-814a-9c47-c02f22543cd7",
      "dual_property": {
        "synced_property_name": "Projects"
      }
    }
  },
  "Offer": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8112-8201-000ba408243f",
      "dual_property": {
        "synced_property_name": "Projects"
      }
    }
  },
  "Process Template": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8168-8e87-000bf4f14d76",
      "dual_property": {
        "synced_property_name": "Projects"
      }
    }
  },
  "Tasks": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8192-8a7b-d0888712291c",
      "dual_property": {
        "synced_property_name": "Project"
      }
    }
  },
  "Deliverables": {
    "type": "relation",
    "relation": {
      "data_source_id": "DELIVERABLES_DATA_SOURCE_ID",
      "dual_property": {
        "synced_property_name": "Project"
      }
    }
  }
}
```

**Add Formulas:**
```json
{
  "Billable": {
    "type": "formula",
    "formula": {
      "expression": "prop(\"Engagement\") != empty or prop(\"Type\") == \"Client Delivery\""
    }
  },
  "Margin": {
    "type": "formula",
    "formula": {
      "expression": "prop(\"Expected Revenue\") - prop(\"Actual Expenses\")"
    }
  }
}
```

**Status:** [ ] Not Started

---

### 10. Tasks (35 min)
**Database ID:** `2845c4eb-9526-8192-8a7b-d0888712291c`

**Normalize Field Names:**
```
"Estimate Hrs" → "Estimated Hours"
"Actual Hrs" → "Actual Hours"
"MIT Today" → "MIT"
```

**Add Fields:**
```json
{
  "Automation Status": {
    "type": "select",
    "select": {
      "options": [
        {"name": "Manual", "color": "red"},
        {"name": "Semi-automated", "color": "yellow"},
        {"name": "Automated", "color": "green"}
      ]
    }
  },
  "Energy Required": {
    "type": "select",
    "select": {
      "options": [
        {"name": "1", "color": "green"},
        {"name": "2", "color": "blue"},
        {"name": "3", "color": "yellow"},
        {"name": "4", "color": "orange"},
        {"name": "5", "color": "red"}
      ]
    }
  },
  "Context Switch Cost": {
    "type": "select",
    "select": {
      "options": [
        {"name": "1", "color": "green"},
        {"name": "2", "color": "blue"},
        {"name": "3", "color": "yellow"},
        {"name": "4", "color": "orange"},
        {"name": "5", "color": "red"}
      ]
    }
  },
  "Unique ID": {"type": "rich_text", "rich_text": {}},
  "Task ID": {"type": "rich_text", "rich_text": {}}
}
```

**Convert to Two-Way Relations:**
```json
{
  "Project": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-814d-bb7a-c37948933b47",
      "dual_property": {
        "synced_property_name": "Tasks"
      }
    }
  },
  "Sprint": {
    "type": "relation",
    "relation": {
      "data_source_id": "SPRINTS_DATA_SOURCE_ID",
      "dual_property": {
        "synced_property_name": "Tasks"
      }
    }
  },
  "Deliverable": {
    "type": "relation",
    "relation": {
      "data_source_id": "DELIVERABLES_DATA_SOURCE_ID",
      "dual_property": {
        "synced_property_name": "Tasks"
      }
    }
  },
  "Workflow Step": {
    "type": "relation",
    "relation": {
      "data_source_id": "WORKFLOWS_DATA_SOURCE_ID",
      "dual_property": {
        "synced_property_name": "Tasks"
      }
    }
  },
  "Resource Template": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-81c0-9921-000bd9dd5664",
      "dual_property": {
        "synced_property_name": "Tasks"
      }
    }
  }
}
```

**Add Formulas:**
```json
{
  "Type": {
    "type": "formula",
    "formula": {
      "expression": "prop(\"Project\").prop(\"Type\")"
    }
  },
  "Billable": {
    "type": "formula",
    "formula": {
      "expression": "prop(\"Project\").prop(\"Billable\")"
    }
  }
}
```

**Status:** [ ] Not Started

---

### 11. Sprints (15 min)
**Database ID:** TBD - Need to find

**Verify/Add Fields:**
```json
{
  "Sprint ID": {"type": "title"},
  "Start Date": {"type": "date", "date": {}},
  "End Date": {"type": "date", "date": {}},
  "Capacity": {"type": "number", "number": {}},
  "Theme": {"type": "rich_text", "rich_text": {}},
  "Learning Focus": {"type": "rich_text", "rich_text": {}},
  "Learning Cap": {"type": "number", "number": {}},
  "Revenue Target": {"type": "number", "number": {"format": "dollar"}},
  "Outreach Target": {"type": "number", "number": {}}
}
```

**Convert to Two-Way Relations:**
```json
{
  "Tasks": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8192-8a7b-d0888712291c",
      "dual_property": {
        "synced_property_name": "Sprint"
      }
    }
  },
  "Experiments": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-81e0-9f6e-c71b53d32c41",
      "dual_property": {
        "synced_property_name": "Sprints"
      }
    }
  },
  "Decisions": {
    "type": "relation",
    "relation": {
      "data_source_id": "2845c4eb-9526-8187-98f3-ef3afbcaf7b6",
      "dual_property": {
        "synced_property_name": "Sprints"
      }
    }
  }
}
```

**Add Formulas:**
```json
{
  "Planned Billable": {
    "type": "formula",
    "formula": {
      "expression": "sum(prop(\"Tasks\").filter(current => current.prop(\"Billable\") == true).map(current => current.prop(\"Estimated Hours\")))"
    }
  },
  "Planned Learning": {
    "type": "formula",
    "formula": {
      "expression": "sum(prop(\"Tasks\").filter(current => current.prop(\"Type\") == \"Learning\").map(current => current.prop(\"Estimated Hours\")))"
    }
  },
  "Billable %": {
    "type": "formula",
    "formula": {
      "expression": "if(prop(\"Capacity\") == 0, 0, prop(\"Planned Billable\") / prop(\"Capacity\"))"
    }
  }
}
```

**Status:** [ ] Not Started

---

## DATA SOURCE IDS REFERENCE

```
CONFIRMED:
- DB Outcomes: 2845c4eb-9526-81b4-8cdb-000b6edd3ffc
- Topics: 2845c4eb-9526-8171-8581-ef47a3619cf0
- Areas: 2845c4eb-9526-8133-81f2-d40cdcd992f5
- Ventures: 2845c4eb-9526-8182-8ccf-000b14d4c431
- Offers: 2845c4eb-9526-8112-8201-000ba408243f
- Service Blueprints: 2845c4eb-9526-818d-b5ba-000b6e95ec3d
- ICP Segments: 2845c4eb-9526-81eb-b9dd-000b90af9399
- Process Templates: 2845c4eb-9526-8168-8e87-000bf4f14d76
- Resource Templates: 2845c4eb-9526-81c0-9921-000bd9dd5664
- Organizations: 2845c4eb-9526-813e-a1ef-cbea16707f73
- People: 2845c4eb-9526-81d4-bc26-ce6a98a92cce
- Deals: 2845c4eb-9526-816c-a03c-d5744f4e5198
- Engagements: 2845c4eb-9526-814a-9c47-c02f22543cd7
- Projects: 2845c4eb-9526-814d-bb7a-c37948933b47
- Tasks: 2845c4eb-9526-8192-8a7b-d0888712291c

TO FIND:
- Sprints
- Daily Thread
- Deliverables
- Results
- Touchpoints
- Experiments
- Decision Journal
- Workflows
```

---

## POST-MIGRATION VERIFICATION

### 1. Relationship Integrity Check
For each two-way relation, verify:
- [ ] Relation exists in Table A pointing to Table B
- [ ] Synced property exists in Table B pointing back to Table A
- [ ] Both properties have matching names

### 2. Formula Validation
Test all formulas with sample data:
- [ ] Margin calculations correct
- [ ] Billable percentages accurate
- [ ] Inheritance formulas working
- [ ] Rollup aggregations correct

### 3. Data Migration Verification
For fields that had data before conversion:
- [ ] No data lost during text → relation conversion
- [ ] All IDs properly formatted
- [ ] Dates converted correctly

### 4. View Configuration
Update all views to show new field names:
- [ ] Remove deleted fields from views
- [ ] Add new relation fields to views
- [ ] Reorder fields logically
- [ ] Update filters and sorts

---

## ROLLBACK PLAN

If critical issues occur:

1. **Database Level:** Use Notion's version history (Settings → Version history)
2. **Property Level:** Can restore deleted properties within 30 days
3. **Data Level:** Keep CSV exports before major changes
4. **Relations:** Can delete and recreate without data loss (if both sides preserved)

---

## NOTES & DECISIONS

### v2.0 Changes
- **Two-way relations everywhere** for better navigation
- **Normalized field names** for consistency
- **Removed redundancies** (Offer ID, Typical Engagement Length, Change Notes)
- **Simplified names** (Time To Deliver Hrs → Delivery Hours)
- **Clean slate approach** for problematic conversions

### API Limitations Encountered
- Cannot convert text → relation in single step if data exists
- Need to delete then recreate as relation
- `dual_property` requires explicit synced property name
- Some relations fail silently - may need manual creation in UI

### Best Practices
- Always delete old text field before creating relation
- Use meaningful synced property names (plural for many relations)
- Test formulas with sample data before full migration
- Keep old fields temporarily for verification

---

## EXECUTION CHECKLIST

Session 1:
- [ ] Topics (20 min)
- [ ] Areas (15 min)  
- [ ] Ventures (25 min)
- [ ] Offers Phase A: Remove redundancies (5 min)
- [ ] Offers Phase B: Rename fields (5 min)
- [ ] Offers Phase C: Create two-way relations (30 min)
- [ ] Offers Phase D: Verify final schema (5 min)

Session 2:
- [ ] Organizations (25 min)
- [ ] People (20 min)
- [ ] Deals (25 min)
- [ ] Engagements (30 min)

Session 3:
- [ ] Projects (40 min)
- [ ] Tasks (35 min)
- [ ] Sprints (15 min)

Post-Migration:
- [ ] Verify all two-way relations
- [ ] Test all formulas
- [ ] Update all views
- [ ] Remove "DB" prefix from database names
- [ ] Generate UUIDs for Unique ID fields
- [ ] Create primary dashboards

**Total Estimated Time:** 5-6 hours across 3 sessions