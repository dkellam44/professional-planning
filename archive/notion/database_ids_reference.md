# Notion Database IDs Reference

- entity: integration
- level: configuration
- zone: internal
- version: v01
- tags: [notion, database-ids, reference]
- source_path: /integrations/notion/database_ids_reference.md
- date: 2025-10-17

---

## Purpose

Canonical reference for all Notion database IDs in Founder HQ workspace. Used by sync scripts, MCP queries, and migration sessions.

---

## Core Migration Databases (23) ✅

These are part of the migration plan v2 (Sessions 1-3):

| Database | Database ID | Portfolio Entity | Session |
|----------|-------------|------------------|---------|
| Ventures | `2845c4eb-9526-8192-b602-d15b1d2bc537` | `venture` | Session 1 |
| Offers | `2845c4eb-9526-8161-a4e4-d22141e25e0c` | `offer` | Session 1 |
| Topics | `2845c4eb-9526-8171-8581-ef47a3619cf0` | `topic` | Session 1 |
| Areas | `2845c4eb-9526-8133-81f2-d40cdcd992f5` | `area` | Session 1 |
| Organizations | `2845c4eb-9526-813e-a1ef-cbea16707f73` | `organization` | Session 2 |
| People | `2845c4eb-9526-81d4-bc26-ce6a98a92cce` | `person` | Session 2 |
| Deals | `2845c4eb-9526-816c-a03c-d5744f4e5198` | `deal` | Session 2 |
| Engagements | `2845c4eb-9526-814a-9c47-c02f22543cd7` | `engagement` | Session 2 |
| Projects | `2845c4eb-9526-814d-bb7a-c37948933b47` | `project` | Session 3 |
| Tasks | `2845c4eb-9526-8192-8a7b-d0888712291c` | `task` | Session 3 |
| Sprints | `2845c4eb-9526-81dd-96c2-d477f7e4a140` | `sprint` | Session 3 |
| Service Blueprints | `2845c4eb-9526-8153-a593-c22af6165679` | `service_blueprint` | Referenced |
| ICP Segments | `2845c4eb-9526-8108-9a27-d8aea4894532` | `icp_segment` | Referenced |
| Process Templates | `2845c4eb-9526-816d-9931-ca60c74fa57b` | `process_template` | Referenced |
| Resource Templates | `2845c4eb-9526-8192-8c4c-f194473b034e` | `resource_template` | Referenced |
| Deliverables | `2845c4eb-9526-81cd-9c9b-f35fe889d53b` | `deliverable` | Referenced |
| Results | `2845c4eb-9526-81e3-aa8d-ec44220a022b` | `result` | Referenced |
| Touchpoints | `2845c4eb-9526-8187-bc25-ec9fa81d0261` | `touchpoint` | Referenced |
| Experiments | `2845c4eb-9526-818e-9426-f75ae47fadba` | `experiment` | Referenced |
| Decision Journal | `2845c4eb-9526-81bf-b8b7-cd20c04b5253` | `decision` | Referenced |
| Workflows | `2845c4eb-9526-81ec-a331-e346afbfc1ad` | `workflow` | Referenced |
| Outcomes | `2845c4eb-9526-816c-b367-d02659910f4d` | `outcome` | Referenced |
| Daily Thread | `2845c4eb-9526-8167-9431-e4b011250ecb` | `daily_thread` | Tier 1 Ops |

---

## Extended Databases (11) ✅

Operational databases not in migration plan but included in sync (workflow TBD):

| Database | Database ID | Portfolio Entity | Purpose |
|----------|-------------|------------------|---------|
| OKRs | `2845c4eb-9526-8177-8d20-dee8212093e6` | `okr` | Goal tracking |
| Payments | `2845c4eb-9526-8154-97d7-c12a652fddcd` | `payment` | Finance |
| Invoices | `2845c4eb-9526-812b-b788-eb809b7e7d02` | `invoice` | Finance |
| Expenses | `2845c4eb-9526-818a-8550-e08e41bee1e3` | `expense` | Finance |
| Finance Snapshot | `2845c4eb-9526-8192-91e4-d6ca369f2c52` | `finance_snapshot` | Finance |
| Prompt Library | `2845c4eb-9526-8130-afc4-ea436eec55fd` | `prompt` | AI prompts |
| KPIs (Dashboard Driver) | `2845c4eb-9526-8185-a3b9-e17d4ac5d7dd` | `kpi` | Metrics |
| Template Performance | `2845c4eb-9526-811e-8fb1-cb4f7d6bda94` | `template_performance` | Analytics |
| Assets | `2845c4eb-9526-816b-b005-fc64cb067815` | `asset` | Resource mgmt |
| Ideas Inbox | `2845c4eb-9526-8148-9fb6-cee23edfd497` | `idea` | Backlog |
| ICP Scoring | `2845c4eb-9526-8136-b12e-c5285eae5b23` | `icp_score` | Sales |

---

## Archive Databases (Excluded) 🗄️

These databases are old/archived and excluded from sync:
- Team Tasks, Task List, Meeting Notes, Docs (2022 templates)
- Product roadmap, Launch calendar (8 duplicates), Weekly product update (2024 templates)
- Meeting notes, Channel Strategy, Deliverables tracker (2024 templates)
- Untitled, Tools, Credentials, Digital Toolbox, Launch Checklist, Assets/Resource Locker (misc/old)
- META performance, Audiences, Placements, ADS, Persona, Campaigns (old marketing project)
- ST Graphics, ST Logos, ST, ST Inspiration (old brand project)

---

## How to Find Database IDs

1. Open the database in Notion (full-page view)
2. Click "..." (three dots menu) in top right
3. Select "Copy link"
4. Paste link - it will look like:
   ```
   https://www.notion.so/2845c4eb95268171858ef47a3619cf0?v=...
   ```
5. Extract the 32-character hex string (remove hyphens, split every 8 chars):
   ```
   2845c4eb95268171858ef47a3619cf0
   → 2845c4eb-9526-8171-8581-ef47a3619cf0
   ```

**Alternative Method (Notion API):**
```bash
curl -X POST https://api.notion.com/v1/search \
  -H "Authorization: Bearer YOUR_NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"filter":{"value":"database","property":"object"}}' \
  | jq '.results[] | {title: .title[0].text.content, id: .id}'
```

---

## Sync Script Configuration

Use this format in `/integrations/notion-sync/config.yaml`:

```yaml
notion:
  api_token: ${NOTION_API_TOKEN}

  databases:
    # Core Business
    ventures:
      id: "2845c4eb-9526-8182-8ccf-000b14d4c431"
      entity: venture
      unique_id_field: "Unique ID"
      human_id_field: "Venture ID"

    offers:
      id: "2845c4eb-9526-8112-8201-000ba408243f"
      entity: offer
      unique_id_field: "Unique ID"
      human_id_field: null

    # CRM
    organizations:
      id: "2845c4eb-9526-813e-a1ef-cbea16707f73"
      entity: organization
      unique_id_field: "Unique ID"
      human_id_field: null

    people:
      id: "2845c4eb-9526-81d4-bc26-ce6a98a92cce"
      entity: person
      unique_id_field: "Unique ID"
      human_id_field: null

    deals:
      id: "2845c4eb-9526-816c-a03c-d5744f4e5198"
      entity: deal
      unique_id_field: "Unique ID"
      human_id_field: "Deal ID"

    engagements:
      id: "2845c4eb-9526-814a-9c47-c02f22543cd7"
      entity: engagement
      unique_id_field: "Unique ID"
      human_id_field: "Engagement ID"

    # Execution
    projects:
      id: "2845c4eb-9526-814d-bb7a-c37948933b47"
      entity: project
      unique_id_field: "Unique ID"
      human_id_field: "Project ID"

    tasks:
      id: "2845c4eb-9526-8192-8a7b-d0888712291c"
      entity: task
      unique_id_field: "Unique ID"
      human_id_field: "Task ID"

    sprints:
      id: "MISSING"
      entity: sprint
      unique_id_field: "Unique ID"
      human_id_field: "Sprint ID"

    # TODO: Add remaining databases once IDs found
```

---

## Portfolio SoT Gaps

**Entities in Notion but NOT in Portfolio SoT v0.2:**
- `topic` — Industry/Channel/Persona taxonomy
- `icp_segment` — Ideal Customer Profile definitions
- `organization` — CRM companies ⚠️
- `person` — CRM contacts ⚠️
- `deal` — Sales pipeline ⚠️
- `touchpoint` — CRM interactions
- `daily_thread` — Daily ritual log
- `result` — Engagement outcomes
- `service_blueprint` — Service design ⚠️
- `process_template` — Reusable checklists ⚠️

**Recommendation**: Update Portfolio SoT to v0.3 to include entities marked ⚠️ (CRM + service design).

---

## Usage Examples

### Python (notion-client)
```python
from notion_client import Client
import os

notion = Client(auth=os.environ["NOTION_API_KEY"])

# Query ventures database
ventures = notion.databases.query(
    database_id="2845c4eb-9526-8182-8ccf-000b14d4c431"
)

for page in ventures["results"]:
    print(page["properties"]["Name"]["title"][0]["text"]["content"])
```

### MCP (via Claude)
```
User: "List all active ventures from Notion"
Claude: [Uses Notion MCP server with database ID 2845c4eb-9526-8182-8ccf-000b14d4c431]
```

### curl (REST API)
```bash
curl https://api.notion.com/v1/databases/2845c4eb-9526-8182-8ccf-000b14d4c431 \
  -H "Authorization: Bearer ${NOTION_API_TOKEN}" \
  -H "Notion-Version: 2022-06-28"
```

---

## Maintenance

**When to Update:**
- New database created in Notion
- Database renamed
- Database ID changes (rare, only if duplicated)
- Entity mapping changes

**Update Process:**
1. Edit this file with new database ID
2. Update `/integrations/notion-sync/config.yaml`
3. Test sync scripts with new ID
4. Update migration plan if relevant
5. Log change to `/logs/context_actions.csv`

---

**Last Updated**: 2025-10-17
**Next Review**: After Session 0 (pre-flight) when missing IDs are found
**Owner**: David Kellam

