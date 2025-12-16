---
Deprication Notice: 2025-12-09 - Coda has been demoted from the workflow SoT in the BestViable ERP system and replaced with PostgreSQL. This is the foundational ERP schema that needs to be updated for DAG state-tracking and migrated with PostgreSQL(not yet built)
---

# Coda Schema Reference

**Cross-reference to Authoritative Schema Documentation**

> For the authoritative Coda schema reference, see:
> **`/ventures/best-viable-erp/coda-schema.md`**

This page serves as a navigation hub for Coda-related documentation.

---

## Quick Links

### Primary References
- **Schema Details**: `/ventures/best-viable-erp/coda-schema.md` (36 tables, relationships, constraints)
- **Pattern Ontology**: `/ventures/best-viable-erp/pattern-ontology.md` (design philosophy)
- **Table IDs**: `/ventures/best-viable-erp/coda_table_ids.txt` (quick ID lookup)
- **Entry Point**: `/ventures/best-viable-erp/README.md` (overview)

### Configuration
- **Coda Config**: `/config/coda-config.md` (Doc ID, naming conventions, update protocol)

### API Access
- **Lightweight Scripts**: `/docs/system/scripts/coda-scripts/` (95-99% token savings)
  - USAGE.md: Examples and token efficiency comparison
  - Available scripts: get_document, list_documents, get_table, list_rows, create_row, update_row, delete_row
- **MCP Server**: Planned for Phase 2 (custom server with CIMD OAuth)

### Formal Specifications
- **OpenSpec Spec**: `openspec/specs/coda-schema/spec.md` (ADDED/MODIFIED requirements, scenarios)
- **Integration Specs**: `openspec/changes/add-planner-memory-system/` (Planner integration)

---

## About BestViable ERP

**Coda Doc**: CxcSmXz318 ("BestViable ERP", formerly "Founder HQ")

A personal ERP implementing the Pattern Ontology with:
- **5 Pattern Tables**: Service Blueprints, Workflows, Process Templates, Resource Templates, Execution Runs
- **31 Business Tables**: Ventures, projects, tasks, offers, engagements, finance, etc.

**Schema Status**:
- ✅ Pattern tables implemented
- ⚠️ Execution Runs pending (user to add)
- ✅ Sprint relationship computed (no FK)

---

## Integration Points

### Planner & Memory Architecture
Coda integrates with the Planner & Memory Architecture:
- **Planner Engine**: Queries blueprints, workflows, templates for planning
- **Observer Agent**: Posts reflections to Daily Thread
- **Scheduler**: Links tasks to calendar, creates execution runs
- **Memory Gateway**: Stores execution run telemetry for pattern learning

See `openspec/changes/add-planner-memory-system/` for specs.

### Lightweight Scripts (Phase 1)
Direct Python script access for CLI workflows:
- Token-efficient (95-99% savings vs. MCP)
- Local caching and filtering
- Progressive disclosure pattern

See `docs/system/scripts/coda-scripts/` for implementation.

### MCP Server (Phase 2)
Custom MCP server for external clients:
- Generic CRUD tools (list_rows, create_rows, update_row, delete_row, etc.)
- CIMD OAuth 2.0 (new MCP 2025-11-25 spec pattern)
- Tasks API for async operations
- Expected 2-6 months out

---

## Documentation Structure

```
portfolio/
├── config/
│   └── coda-config.md                    # Central Coda SoT
├── docs/
│   ├── README.md                         # Documentation index (points here)
│   └── system/architecture/
│       ├── CODA_SCHEMA.md               # This file (navigation hub)
│       ├── SERVICE_INVENTORY.md         # All services
│       └── ...
├── ventures/best-viable-erp/
│   ├── README.md                        # Overview & entry point
│   ├── coda-schema.md                   # AUTHORITATIVE schema reference
│   ├── pattern-ontology.md              # Design philosophy
│   ├── coda_table_ids.txt               # Table ID lookup
│   └── archive/                         # Legacy docs
├── openspec/
│   ├── specs/coda-schema/
│   │   └── spec.md                      # Formal OpenSpec requirements
│   └── changes/add-planner-memory-system/  # Integration specs
└── docs/system/scripts/coda-scripts/
    ├── README.md                        # Overview
    ├── USAGE.md                         # Token efficiency examples
    └── [7 core scripts]
```

---

## Updating Documentation

When Coda schema changes:

1. **Update Live Doc**: Change in Coda web UI
2. **Regenerate Table IDs**: `python list_tables.py > coda_table_ids.txt`
3. **Update Schema Doc**: Edit `/ventures/best-viable-erp/coda-schema.md`
4. **Update Specs**: Edit `openspec/specs/coda-schema/spec.md` if new table types
5. **Update Config**: Edit `/config/coda-config.md` if major changes

---

## For Agents

**This document is a navigation hub**. When you need Coda schema information:

1. **For current schema**: → `/ventures/best-viable-erp/coda-schema.md`
2. **For design philosophy**: → `/ventures/best-viable-erp/pattern-ontology.md`
3. **For table IDs**: → `/ventures/best-viable-erp/coda_table_ids.txt`
4. **For API examples**: → `/docs/system/scripts/coda-scripts/USAGE.md`
5. **For formal specs**: → `openspec/specs/coda-schema/spec.md`
6. **For config/conventions**: → `/config/coda-config.md`

**Do NOT use this file as SoT** - it's a navigation reference.

---

**Maintainer**: David Kellam
**Last Updated**: 2025-12-02
**Status**: Active (Navigation Hub)
