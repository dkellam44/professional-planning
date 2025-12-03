# Coda Schema - BestViable ERP

**Authoritative Schema Reference**

**Doc ID**: CxcSmXz318
**Doc Name**: BestViable ERP
**Last Updated**: 2025-12-02
**Total Tables**: 36

---

## Overview

BestViable ERP implements the Pattern Ontology with 5 pattern tables and 31 business tables across four functional areas:

- **Operations** (ventures, projects, tasks, sprints)
- **Client Management** (offers, engagements, deliverables, results)
- **Knowledge & Patterns** (blueprints, workflows, templates, execution runs)
- **Finance & Planning** (expenses, invoices, KPIs, OKRs)

---

## Pattern Tables (5)

### Service Blueprints
- **Table ID**: grid-pgL9kxkhKI
- **Purpose**: End-to-end service journey maps (5 layers)
- **Key Fields**: blueprint_id, name, description, customer_actions, frontstage, backstage, support_processes, evidence, version, status
- **Relationships**: 1→many to Offers, Workflows

### Workflows
- **Table ID**: grid-BccTVdgIEo
- **Purpose**: Canonical SOPs for capabilities
- **Key Fields**: workflow_id, name, description, service_blueprint, steps, estimated_hours, automation_status, version, status
- **Relationships**: many→1 to Service Blueprints, 1→many to Process Templates
- **Computed**: execution_runs_count, avg_actual_hours, variance_pct

### Process Templates
- **Table ID**: grid-6ZlgsRtZO7
- **Purpose**: Context-specific checklists derived from workflows
- **Key Fields**: process_template_id, name, checklist, template_type (Operational/Communication), workflow, version, status
- **Relationships**: many→1 to Workflows, 1→many to Execution Runs

### Resource Templates
- **Table ID**: grid-v4BEeA-eq1
- **Purpose**: Reusable documents, communications, media
- **Key Fields**: resource_template_id, name, template_type (Document/Communication/Media), storage_url, version, status
- **Relationships**: used by Process Templates, Touchpoints

### Execution Runs ⚠️ PENDING
- **Table ID**: TBD (user to add)
- **Purpose**: Work session telemetry for pattern learning
- **Key Fields**: run_id, run_type (Process/Touchpoint), task, project, engagement, process_template, workflow, started_at, ended_at, actual_hours, outcome_notes, executed_by, created_at
- **Relationships**: many→1 to Tasks, Projects, Engagements, Process Templates, Workflows
- **Computed**: variance_vs_estimate (actual_hours vs task.estimated_hours)
- **Status**: Schema provided, user to create manually

---

## Business Tables (31)

### Operations Core
| Table | ID | Purpose |
|-------|----|---------|
| Ventures | grid-7nQc5Vde63 | Business entities |
| Projects | grid-4xp4uJfrCX | Work containers |
| Tasks | grid-YYWnWyA2ek | Executable work items (links to scheduled_start_date, no FK to sprint) |
| Sprints | grid-Dssve7Rjvt | Weekly capacity planning (tasks computed via scheduled_start_date) |

### Client & Commercial
| Table | ID | Purpose |
|-------|----|---------|
| Offers | grid-TcKoLLI4Of | Service offerings (linked to Service Blueprints) |
| Engagements | grid-9kDjcu0gpy | Active client work |
| Deliverables | grid-feAP4JK8EJ | Outputs/results |
| Results | grid-NXB5mCFBj2 | Outcomes & impact |

### Organization
| Table | ID | Purpose |
|-------|----|---------|
| People | grid-lXbBizx_qG | Team members |
| Organizations | grid-IEkBj5Nwnp | Clients, partners, vendors |

### Communication & Engagement
| Table | ID | Purpose |
|-------|----|---------|
| Touchpoints | grid-qOH6nJMZEW | Communication instances (emails, calls, meetings) |
| ICP Segments | grid-CLQRLZModD | Customer segments |
| ICP Scoring | grid-RG2RCvIEOv | Lead qualification |

### Knowledge & Execution
| Table | ID | Purpose |
|-------|----|---------|
| Daily Thread | grid-33magJT7Om | Daily notes & reflections |
| Decision Journal | grid-fcSRcR12d8 | Decisions & rationale |
| Experiments | grid-mIz62q1JqD | Learning projects |
| Prompt Library | grid-DrVH4Xzndu | LLM prompt templates |
| Notebook | grid-EI7q6Ly4c7 | Unstructured notes |

### Finance & Planning
| Table | ID | Purpose |
|-------|----|---------|
| Expenses | grid-AqoPAWoCXA | Cost tracking |
| Invoices | grid-Fqlzvh-KOi | Customer billing |
| Payments | grid-sB8w3ynJMF | Outgoing payments |
| KPIs | grid-ceolH5J2c7 | Key performance indicators |
| Finance Snapshot | grid-Tu0UbYGGZM | Dashboard metrics |
| Deals | grid-J7LlLCm16p | Sales pipeline |

### Strategic & Planning
| Table | ID | Purpose |
|-------|----|---------|
| Outcome Types | grid-wVuFB2odV8 | Categories of outcomes |
| OKRs | grid-VzFgkj2Fxq | Objectives & key results |
| Functional Areas | grid-ssVNmhrIKs | Capability domains |
| Topics | grid-nIighffAjV | Knowledge domains |

### Assets & Ideation
| Table | ID | Purpose |
|-------|----|---------|
| Assets | grid-aprrpKni50 | Reusable resources |
| Ideas Inbox | grid-ETK5XRNhSf | Brainstorm capture |
| Template Performance | grid-LMZfkAk4AE | Pattern metrics & analysis |

---

## Schema Evolution

### Current State (2025-12-02)
- ✅ Service Blueprints implemented
- ✅ Workflows implemented
- ✅ Process Templates implemented
- ✅ Resource Templates implemented
- ⚠️ **Execution Runs pending** - User to add manually
- ✅ Sprint uses computed relationship via scheduled_start_date
- ✅ Tasks table: added scheduled_start_date, scheduled_end_date columns

### Recent Changes (add-planner-memory-system)
- Added scheduled_start_date, scheduled_end_date to Tasks table (for Sprint computation)
- Removed direct sprint FK from Tasks (computed relationship instead)
- Added execution_runs table schema (pending manual creation)

### Planned Changes (Phase 2+)
- Add execution_runs table relationships to Execution Runs in Postgres
- Add Graph storage (graph_nodes, graph_edges) for pattern hierarchy
- Enhanced performance analytics (Template Performance table)

---

## API Integration Points

### Lightweight Scripts
Scripts in `/docs/system/scripts/coda-scripts/` provide token-efficient access:

- `list_documents.py` - Find docs
- `get_document.py` - Doc metadata
- `list_rows.py` - Query rows (with local filtering)
- `create_row.py` - Batch insert
- `update_row.py` - Smart updates
- `delete_row.py` - Safe delete
- `get_table.py` - Schema inspection

**Example**: Query tasks with local pandas filtering
```bash
python list_rows.py CxcSmXz318 grid-YYWnWyA2ek --filter status=active
```

### OpenSpec Specifications
Formal requirements documented in `openspec/specs/coda-schema/spec.md` with scenarios for:
- Service Blueprint CRUD operations
- Workflow queries with relation expansion
- Process Template creation & updates
- Execution Run deduplication (natural key: task_id + started_at)
- Coda API error handling (rate limits, auth, retries)

---

## Key Design Decisions

### 1. Dual Storage (Postgres + Coda)
- **Postgres**: Events table, Execution Runs table, Graph storage (fast queries for pattern learning)
- **Coda**: Authoritative business data (human-readable, manual editing)
- **Bridge**: Coda MCP provides read/write sync

### 2. Sprint Evolution (Computed Relationship)
- **Old**: Tasks table had `sprint` FK (manual assignment)
- **New**: Sprint computes tasks via scheduled_start_date (agentic, flexible)
- **Formula**: `tasks.Filter(scheduled_start_date >= start_date AND scheduled_start_date <= end_date)`
- **Benefit**: Reschedule task → auto-moves to different Sprint

### 3. Process Templates vs. Workflows
- **Workflow**: Single canonical SOP per capability
- **Process Template**: Context-specific variations (e.g., "Onboarding - Sprint" vs. "Onboarding - Retainer")
- **Benefit**: Reuse workflow structure, customize for context

### 4. Execution Runs vs. Tasks
- **Task**: Planned work (estimated_hours, status)
- **Execution Run**: Actual session (actual_hours, outcome_notes)
- **Why separate**: One task can have multiple execution runs (paused/resumed work)
- **Enables**: Pattern learning (actual vs. estimated, variance analysis)

### 5. Service Blueprint ↔ Offer ↔ Engagement
- **Service Blueprint**: How a service is delivered (5-layer model)
- **Offer**: Specific service offering linked to blueprint
- **Engagement**: Active commercial relationship using offer
- **Benefit**: Pattern reuse across multiple engagements, consistent delivery

---

## Constraints & Validation

### run_type (Execution Runs)
- Must be 'Process' or 'Touchpoint'
- 'Process' = operational workflow execution
- 'Touchpoint' = communication instance

### template_type (Process Templates)
- Must be 'Operational' or 'Communication'
- Operational = checklist-based workflow
- Communication = outreach sequence, email templates, etc.

### template_type (Resource Templates)
- Must be 'Document', 'Communication', or 'Media'
- Document = proposals, contracts, reports
- Communication = email templates, scripts
- Media = decks, images, creative assets

### automation_status (Workflows)
- Must be 'Manual', 'Semi-automated', or 'Automated'

### status (all pattern tables)
- Must be 'Draft', 'Active', or 'Deprecated'

---

## References

- **Pattern Ontology**: See `/ventures/best-viable-erp/pattern-ontology.md` for design philosophy
- **Table IDs**: See `/ventures/best-viable-erp/coda_table_ids.txt` for complete reference
- **OpenSpec**: See `openspec/specs/coda-schema/spec.md` for formal requirements
- **Coda Config**: See `/config/coda-config.md` for central SoT

---

**Maintainer**: David Kellam
**Status**: ACTIVE (Source of Truth)
**Next Update**: After user adds execution_runs table
