# Coda MCP Pattern Integration

## Why

**Current State**: coda-mcp HTTP API exposes basic Coda tables (docs, tables, rows) but does not expose Pattern Ontology tables (service_blueprints, workflows, process_templates, execution_runs).

**Problem**:
- Planner Engine cannot query Service Blueprints for planning context
- Planner Engine cannot query Workflows to adapt existing SOPs
- Planner Engine cannot create Process Templates in Coda
- Observer Agent cannot create Execution Runs for performance tracking
- Memory Gateway cannot query pattern hierarchy for graph storage

**Impact**: add-planner-memory-system Phase 1c-1e blocked without these MCP endpoints.

## What Changes

### New MCP Tools (Read Operations - Phase 1)
1. `mcp__coda__get_service_blueprint(blueprint_id)` - Fetch blueprint by ID
2. `mcp__coda__list_service_blueprints()` - List all active blueprints
3. `mcp__coda__get_workflow(workflow_id)` - Fetch workflow by ID
4. `mcp__coda__list_workflows(blueprint_id?)` - List workflows, optionally filter by blueprint
5. `mcp__coda__get_process_template(template_id)` - Fetch process template by ID
6. `mcp__coda__list_process_templates(workflow_id?)` - List templates, optionally filter by workflow
7. `mcp__coda__list_execution_runs(project_id?, task_id?, start_date?)` - List execution runs with filters

### New MCP Tools (Write Operations - Phase 2)
8. `mcp__coda__create_process_template({workflow_id, name, checklist, template_type})` - Create new template
9. `mcp__coda__update_process_template(template_id, updates)` - Update existing template
10. `mcp__coda__create_execution_run({task_id, project_id, process_template_id, started_at, ended_at, actual_hours, outcome_notes})` - Create execution run
11. `mcp__coda__create_tasks_from_template(process_template_id, project_id)` - Bulk create tasks from template checklist

### Updated MCP Tools
- `mcp__coda__list_tables()` - Include pattern tables in response

## Impact

### Benefits
- ✅ Planner Engine can query blueprints/workflows for context-aware planning
- ✅ Planner Engine can create Process Templates directly in Coda
- ✅ Observer Agent can create Execution Runs for performance tracking
- ✅ Memory Gateway can query full pattern hierarchy
- ✅ Human + AI hybrid workflow (AI generates, human edits in Coda)

### Breaking Changes
- None (additive changes only)

### Performance
- Read operations: < 500ms p95 (Coda API typically 200-300ms)
- Write operations: < 1s p95 (includes Coda write + validation)

### Risks
- **Risk**: Coda API rate limits (100 req/min per doc)
  - **Mitigation**: Implement request queueing, exponential backoff
- **Risk**: Large workflow steps field (>10KB) may timeout
  - **Mitigation**: Paginate or truncate large fields

## Dependencies

### Prerequisites
- `coda-pattern-tables-implementation` must be complete (tables exist in Coda)
- Coda API token with read/write permissions to pattern tables

### Dependent Changes
- `add-planner-memory-system` Phase 1c (Planner Engine) requires read operations
- `add-planner-memory-system` Phase 1e (Observer Agent) requires write operations

## Timeline

**Estimated Time**: 6-8 hours
- Phase 1 (3-4 hrs): Read operations (list/get endpoints for blueprints, workflows, templates, runs)
- Phase 2 (3-4 hrs): Write operations (create template, create execution run)
- Testing (1-2 hrs): Integration tests with Planner and Observer

**Critical Path**: Phase 1 must complete before add-planner-memory-system Phase 1c (week 3)
