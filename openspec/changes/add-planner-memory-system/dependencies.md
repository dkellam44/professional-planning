# Change Dependencies

## Overview

The `add-planner-memory-system` change requires coordination with two supporting OpenSpec changes for full Pattern Ontology integration.

## Prerequisites

**None** - This is the foundational infrastructure change.

## Parallel Changes

These changes can be started in parallel with `add-planner-memory-system` implementation:

### 1. coda-pattern-tables-implementation

**Repository**: Coda workspace (BestViable ERP doc)
**Timeline**: Start after Phase 1a (Archon removal), complete before Phase 1c (Planner Engine deployment)
**Scope**: Implement Pattern Ontology tables in Coda schema

**Tables to create/update**:
- `service_blueprints` (if not exists)
- `workflows` (if not exists)
- `process_templates` (rename from `DB Templates` or create new)
- `resource_templates` (rename from `DB Templates`)
- `execution_runs` (new table)

**Relationships to establish**:
- offers.service_blueprint → service_blueprints
- workflows.service_blueprint → service_blueprints
- process_templates.workflow → workflows
- projects.process_template → process_templates
- tasks.execution_run → execution_runs
- execution_runs.project → projects
- execution_runs.process_template → process_templates

**Critical Path**: Must be complete before Phase 1c (Planner Engine) attempts to query Coda for blueprints/workflows.

---

### 2. coda-mcp-pattern-integration

**Repository**: `portfolio/integrations/mcp/servers/coda/`
**Timeline**: Start after `coda-pattern-tables-implementation` complete, needed for Phase 1e (Observer Agent)
**Scope**: Extend coda-mcp HTTP API to expose pattern tables

**New MCP Tools Required**:

**Read Operations** (Phase 1):
- `mcp__coda__get_service_blueprint(blueprint_id)`
- `mcp__coda__list_workflows(blueprint_id?)`
- `mcp__coda__get_process_template(template_id)`
- `mcp__coda__get_workflow(workflow_id)`
- `mcp__coda__list_execution_runs(project_id?, task_id?)`

**Write Operations** (Phase 2):
- `mcp__coda__create_process_template({workflow_id, name, checklist, template_type})`
- `mcp__coda__create_execution_run({task_id, project_id, process_template_id, actual_hours, outcome_notes})`
- `mcp__coda__update_process_template(template_id, updates)`

**Critical Path**: Read operations must be complete before Phase 1c (Planner Engine). Write operations needed before Phase 1e (Observer Agent).

---

## Dependent Changes (Future)

These changes depend on `add-planner-memory-system` being complete:

### 3. coda-mcp-update-to-2025-spec (Phase 2)

**Timeline**: After Phase 1 complete
**Scope**: Update coda-mcp to MCP 2025-11-25 specification patterns (CIMD OAuth, Tasks API, M2M auth)

### 4. pattern-improvement-ai (Phase 2)

**Timeline**: After Phase 1 complete, requires execution_runs data accumulation
**Scope**: AI-driven workflow optimization based on execution_runs analysis

---

## Implementation Sequencing

### Week 1-2: Parallel Foundation
- **Main track**: add-planner-memory-system Phase 1a-1b (Infrastructure, Memory Gateway)
- **Parallel track 1**: coda-pattern-tables-implementation (Coda schema updates)
- **Parallel track 2**: coda-mcp-pattern-integration Phase 1 (read-only endpoints)

### Week 3: Integration
- **Main track**: add-planner-memory-system Phase 1c (Planner Engine) - requires coda-pattern-tables complete
- **Parallel track**: coda-mcp-pattern-integration Phase 2 (write endpoints)

### Week 4: Completion
- **Main track**: add-planner-memory-system Phase 1d-1e (n8n, Observer Agent) - requires coda-mcp write endpoints
- **Validation**: End-to-end flow: Plan → Schedule → Execute → Observe

---

## Risk: Missing Dependencies

**If coda-pattern-tables-implementation is delayed**:
- Phase 1c Planner Engine cannot query Service Blueprints/Workflows
- Workaround: Deploy Planner Engine with generic SOP generation (no blueprint context)
- Upgrade: Add blueprint integration after Coda tables created

**If coda-mcp-pattern-integration is delayed**:
- Phase 1c Planner Engine cannot create Process Templates in Coda
- Workaround: Store templates in Postgres only, manually create in Coda
- Phase 1e Observer Agent cannot analyze execution_runs in Coda
- Workaround: Use Postgres execution_runs only

---

## Validation Checkpoints

Before starting each phase, verify dependencies:

**Before Phase 1c (Planner Engine)**:
```bash
# Verify Coda tables exist
curl https://coda.bestviable.com/mcp -d '{"tool":"list_tables"}' | grep -E "service_blueprints|workflows|process_templates"

# Verify coda-mcp read endpoints work
curl https://coda.bestviable.com/mcp -d '{"tool":"mcp__coda__list_workflows"}'
```

**Before Phase 1e (Observer Agent)**:
```bash
# Verify coda-mcp write endpoints work
curl https://coda.bestviable.com/mcp -d '{"tool":"mcp__coda__create_execution_run", "params":{...}}'
```
