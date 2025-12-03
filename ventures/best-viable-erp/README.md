# BestViable ERP

**Personal ERP system built on Coda, implementing the Pattern Ontology**

**Coda Doc ID**: CxcSmXz318
**Doc Name**: BestViable ERP _(formerly "Founder HQ", "DK Enterprise OS")_

---

## Overview

BestViable ERP is a Coda-based personal enterprise resource planning system that implements a three-layer Pattern Ontology:

- **Pattern Layer**: Service Blueprints → Workflows → Process Templates
- **Asset Layer**: Resource Templates
- **Instance Layer**: Execution Runs, Touchpoints

This ontology provides a framework for capturing reusable work patterns, tracking actual execution, and learning from variance between planned vs. actual effort.

---

## Documentation

### Primary References

| Document | Purpose | Location |
|----------|---------|----------|
| **Schema** | Authoritative schema reference (36 tables) | [coda-schema.md](./coda-schema.md) |
| **Pattern Ontology** | Design philosophy and naming conventions | [pattern-ontology.md](./pattern-ontology.md) |
| **Table IDs** | Table ID reference for API access | [coda_table_ids.txt](./coda_table_ids.txt) |

### Related Documentation

- **OpenSpec Specification**: `../../openspec/specs/coda-schema/spec.md` (formal requirements & scenarios)
- **Lightweight Scripts**: `../../docs/system/scripts/coda-scripts/` (token-efficient API access)
- **Planner Integration**: `../../openspec/changes/add-planner-memory-system/` (Planner & Memory Architecture specs)
- **Coda Config**: `../../config/coda-config.md` (central SoT for Coda doc references)

---

## Schema Summary

**36 Tables Total**:

### Pattern Tables (5)
- Service Blueprints - End-to-end service journey maps
- Workflows - Canonical SOPs for capabilities
- Process Templates - Context-specific checklists
- Resource Templates - Document/communication templates
- Execution Runs - Work session telemetry _(PENDING: user to add manually)_

### Business Tables (31)
- Ventures, Offers, Engagements, Projects, Tasks, Sprints
- People, Organizations, Touchpoints, Deliverables, Results
- Daily Thread, Decision Journal, Experiments
- Finance (Expenses, Invoices, Payments, KPIs, Finance Snapshot)
- Outcomes, Functional Areas, OKRs, Ideas, Assets
- ICP (Segments, Scoring), Template Performance

See [coda-schema.md](./coda-schema.md) for complete table details and relationships.

---

## Pattern Ontology Quick Reference

### Core Concepts

**Patterns** (reusable designs of work):
- **Service Blueprint**: Meta-SOP defining end-to-end service (5 layers: customer actions, frontstage, backstage, support processes, evidence)
- **Workflow**: Core SOP for a capability (canonical, estimated hours, automation status)
- **Process Template**: Context-specific checklist derived from Workflow (Operational or Communication type)

**Assets** (reusable materials):
- **Resource Template**: Documents, communications, media used in patterns (Document, Communication, or Media type)

**Instances** (concrete executions):
- **Execution Run**: Actual work session (tracks actual hours vs. estimates for pattern learning)
- **Touchpoint**: Communication instance (emails sent, calls made, meetings, etc.)

### Hierarchy Flow

```
Service Blueprint (strategic)
    ↓
Workflow (operational)
    ↓
Process Template (tactical checklist)
    ↓
Execution Run (actual work session)
```

See [pattern-ontology.md](./pattern-ontology.md) for complete design rationale.

---

## API Access

### Lightweight Scripts (Recommended for CLI)
- **Location**: `../../docs/system/scripts/coda-scripts/`
- **Benefits**: 95-99% token savings vs. MCP, local pandas caching, progressive disclosure
- **Usage**: See `../../docs/system/scripts/coda-scripts/USAGE.md`

**Example**:
```bash
export CODA_API_TOKEN="your-token"

# List documents
python list_documents.py

# Get table data with local filtering
python list_rows.py CxcSmXz318 grid-YYWnWyA2ek --filter status=active
```

### MCP Server (Future - Phase 2)
- **Status**: Custom MCP server planned for Phase 2 (2-6 months)
- **Spec**: MCP 2025-11-25 (CIMD OAuth, Tasks API, Authorization Extensions)
- **Purpose**: Generic CRUD tools for external clients (ChatGPT, Open WebUI, Claude.ai web)

---

## Archive

Legacy documentation from "Founder HQ" era (2024-2025) is preserved in `/archive/` subdirectory for historical reference. See `archive/README.md` for details.

**Current active docs**: This directory (parent of `archive/`)

---

## Integration with Planner & Memory Architecture

BestViable ERP integrates with the Planner & Memory Architecture:

- **Planner Engine**: Queries Service Blueprints, Workflows, Process Templates to generate context-specific plans
- **Observer Agent**: Posts daily/weekly reflections to Daily Thread table
- **Scheduler Engine**: Creates execution runs, links tasks to calendar events
- **Memory Gateway**: Stores execution run telemetry for pattern learning and variance analysis

See `../../openspec/changes/add-planner-memory-system/` for integration specifications.

---

## Contributing

When making schema changes:

1. Update live Coda doc (primary SoT)
2. Regenerate `coda_table_ids.txt` (via `list_tables.py` script)
3. Update `coda-schema.md` (authoritative reference)
4. Update `openspec/specs/coda-schema/spec.md` if adding new table types
5. Update integration code (lightweight scripts, OpenSpec changes)

See `../../config/coda-config.md` for update protocol.

---

**Maintainer**: David Kellam
**Last Updated**: 2025-12-02
**Status**: Active (Phase 1 - Lightweight Scripts)
