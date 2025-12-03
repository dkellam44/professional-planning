# Coda Pattern Tables Implementation

## Why

**Current State**: Founder HQ Coda schema has basic tables (ventures, offers, projects, tasks) but lacks formal Pattern Ontology structure for service delivery templates and execution tracking.

**Problem**:
- No Service Blueprints table (end-to-end service maps)
- No Workflows table (canonical SOPs for capabilities)
- Process Templates mixed with Resource Templates in single "DB Templates" table
- No Execution Runs table (work telemetry for pattern learning)
- Cannot track pattern lineage: Blueprint → Workflow → Template → Run

**Impact**:
- Planner Engine cannot query Service Blueprints for context-aware planning
- Observer Agent cannot analyze execution performance vs estimates
- No pattern-based learning (similar projects took X hours)

## What Changes

### New Tables
1. **service_blueprints** - End-to-end service journey maps (5 layers: customer actions, frontstage, backstage, support processes, evidence)
2. **workflows** - Canonical SOPs for capabilities (e.g., "Client Onboarding", "Marketing Audit")
3. **process_templates** - Context-specific checklists derived from workflows
4. **resource_templates** - Rename/restructure existing "DB Templates" for documents/communications/media
5. **execution_runs** - Work session telemetry (actual hours, outcome notes, variance tracking)

### Updated Tables
- **offers** - Add column: `service_blueprint` (reference → service_blueprints)
- **projects** - Add column: `process_template` (reference → process_templates)
- **tasks** - Add column: `execution_run` (reference → execution_runs), remove `sprint` (replaced by computed relationship via scheduled_start_date)
- **sprints** - Add columns: `start_date`, `end_date` for computed task relationship

### Key Relationships
```
Venture → Offer → Service Blueprint → Workflows
                ↓
          Engagement → Project → Process Template
                            ↓
                        Tasks → Execution Runs
```

## Impact

### Benefits
- ✅ Pattern-based planning (adapt existing workflows to new contexts)
- ✅ Execution learning (identify workflow estimate drift)
- ✅ Service delivery systematization (blueprints define service structure)
- ✅ Human + AI readable (templates visible in Coda, queryable via API)
- ✅ Multi-venture support (patterns reusable across Operations Studio, SaaS ventures)

### Breaking Changes
- ⚠️ Existing "DB Templates" table needs split into process_templates + resource_templates
- ⚠️ Existing task.sprint relationship changes from FK to computed (based on scheduled_start_date)

### Migration Required
- Split existing templates into process vs resource categories
- Create initial Service Blueprints for existing offers
- Document existing workflows (Client Onboarding, Marketing Audit, etc.)

### Risks
- **Risk**: Coda formula complexity for computed Sprint relationship
  - **Mitigation**: Test with small dataset first, document formula clearly
- **Risk**: Existing tasks lose Sprint assignment during migration
  - **Mitigation**: Set scheduled_start_date = sprint.start_date for existing tasks before migration

## Dependencies

### Prerequisites
- None (standalone Coda schema change)

### Dependent Changes
- `add-planner-memory-system` Phase 1c requires this complete (Planner Engine queries blueprints/workflows)
- `coda-mcp-pattern-integration` requires this complete (MCP endpoints expose these tables)

## Timeline

**Estimated Time**: 6-8 hours
- Phase 1 (2-3 hrs): Create new tables (service_blueprints, workflows, process_templates, resource_templates, execution_runs)
- Phase 2 (2-3 hrs): Add relationships (FK columns, formulas)
- Phase 3 (1-2 hrs): Migrate existing data (split templates, create initial blueprints)
- Phase 4 (1 hr): Validate and document

**Critical Path**: Must complete before add-planner-memory-system Phase 1c (week 3 of main project)
