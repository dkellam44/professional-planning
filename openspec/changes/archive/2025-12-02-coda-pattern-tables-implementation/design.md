# Coda Pattern Tables Implementation - Design

## Overview

This change implements the Pattern Ontology in the Founder HQ Coda schema, adding structured tables for service delivery templates, execution tracking, and pattern-based learning.

## Schema Design

### Table Hierarchy

```
Service Blueprints (meta-SOPs, service-level)
  ↓
Workflows (capability-level SOPs)
  ↓
Process Templates (context-specific checklists)
  ↓
Execution Runs (actual work telemetry)
```

### Key Tables

#### 1. service_blueprints
**Purpose**: End-to-end service journey maps across 5 layers

**Schema**:
```
blueprint_id: Text (primary key)
name: Text
description: Text
customer_actions: Text (what customer does)
frontstage: Text (visible interactions)
backstage: Text (behind-scenes work)
support_processes: Text (enabling systems)
evidence: Text (artifacts produced)
version: Text
status: Select (Draft, Active, Deprecated)
owner: Person
```

**Relationships**:
- → offers (1-to-many): An offer implements a blueprint
- → workflows (1-to-many): A blueprint decomposes into workflows

#### 2. workflows
**Purpose**: Canonical SOPs for capabilities (reusable across engagements)

**Schema**:
```
workflow_id: Text (primary key)
name: Text
description: Text
service_blueprint: Relation → service_blueprints
steps: Text (JSON or structured list)
estimated_hours: Number
automation_status: Select (Manual, Semi-automated, Automated)
version: Text
status: Select (Draft, Active, Deprecated)
```

**Computed Columns**:
```
execution_runs_count = execution_runs.Count()
avg_actual_hours = execution_runs.Average(actual_hours)
variance_pct = (avg_actual_hours - estimated_hours) / estimated_hours * 100
```

**Relationships**:
- ← service_blueprints (many-to-1): Workflow belongs to blueprint
- → process_templates (1-to-many): Templates derived from workflow
- → execution_runs (1-to-many): Runs of this workflow

#### 3. process_templates
**Purpose**: Context-specific checklists (adapted for specific engagement/project)

**Schema**:
```
process_template_id: Text (primary key)
name: Text
workflow: Relation → workflows (nullable, if derived from workflow)
template_type: Select (Operational, Communication)
checklist: Text (structured steps)
version: Text
status: Select (Draft, Active, Deprecated)
```

**Relationships**:
- ← workflows (many-to-1, nullable): Template derived from workflow
- ← projects (1-to-many): Projects use this template
- → execution_runs (1-to-many): Runs using this template

#### 4. execution_runs
**Purpose**: Actual work session telemetry for pattern learning

**Schema**:
```
run_id: Text (primary key)
run_type: Select (Process, Touchpoint)
workflow: Relation → workflows (nullable)
process_template: Relation → process_templates (nullable)
task: Relation → tasks (nullable)
project: Relation → projects (nullable)
engagement: Relation → engagements (nullable)
executed_by: Person
started_at: Date & Time
ended_at: Date & Time
actual_hours: Number (formula: duration in hours)
outcome_notes: Text
```

**Computed Columns**:
```
actual_hours = (ended_at - started_at) in hours
variance_vs_estimate = actual_hours - task.estimated_hours (if task linked)
```

**Relationships**:
- ← workflows (many-to-1): Run of a workflow
- ← process_templates (many-to-1): Run using a template
- ← tasks (many-to-1): Run completing a task
- ← projects (many-to-1): Run within a project

### Updated Tables

#### offers (updated)
**New Column**: `service_blueprint` (Relation → service_blueprints)

**Why**: Links commercial offer to service delivery pattern

#### projects (updated)
**New Column**: `process_template` (Relation → process_templates)

**Why**: Links project to specific checklist used for delivery

#### tasks (updated)
**New Columns**:
- `execution_run` (Relation → execution_runs, nullable)
- `scheduled_start_date` (Date)
- `scheduled_end_date` (Date)

**Removed Column**: `sprint` (FK removed)

**Why**:
- execution_run links task to actual work session
- scheduled_start_date enables computed Sprint relationship
- No manual sprint assignment needed

#### sprints (updated)
**New Columns**:
- `start_date` (Date, formula: Monday of sprint week)
- `end_date` (Date, formula: Sunday of sprint week)

**Updated Formula**:
```coda
tasks = tasks.Filter(
  scheduled_start_date >= thisRow.start_date AND
  scheduled_start_date <= thisRow.end_date
)
```

**Why**: Enables agentic task scheduling without manual sprint assignment

---

## Design Decisions

### Decision: Separate Process Templates from Resource Templates
**Problem**: Current "DB Templates" table mixes operational checklists with document templates
**Options**:
1. Keep combined, use `template_type` field
2. Split into process_templates + resource_templates
3. Use sub-tables with views

**Decision**: Split into 2 tables (Option 2)
**Rationale**:
- Different schemas (process: checklist, resource: storage_url)
- Different relationships (process links to workflows, resource links to touchpoints)
- Clearer semantics (process = how to do work, resource = what to use)

### Decision: Execution Runs in Coda (not just Postgres)
**Problem**: Where to store execution telemetry?
**Options**:
1. Postgres only (fast queries, no human visibility)
2. Coda only (human visibility, slower queries)
3. Both Postgres + Coda (dual storage)

**Decision**: Both (Option 3)
**Rationale**:
- Postgres: Fast variance analysis for Observer Agent
- Coda: Human visibility, manual creation possible
- Sync via Coda MCP write operations

### Decision: Sprint Computed Relationship (not FK)
**Problem**: Manual sprint assignment is tedious, error-prone
**Options**:
1. Keep task.sprint FK (manual assignment)
2. Computed relationship via scheduled_start_date (automatic)
3. Remove Sprint table entirely

**Decision**: Computed relationship (Option 2)
**Rationale**:
- Agentic: Scheduler Engine sets scheduled_start_date, Sprint auto-computes
- Flexible: Rescheduling task auto-moves to different Sprint
- Human override: User can manually edit scheduled_start_date in Coda

### Decision: Workflow Variance Tracking as Formula
**Problem**: How to calculate workflow estimate drift?
**Options**:
1. Manual calculation in Observer Agent
2. Coda formula columns (auto-updating)
3. Materialized view in Postgres

**Decision**: Coda formulas (Option 2)
**Rationale**:
- Real-time updates (no batch job needed)
- Human visibility in Coda UI
- Queryable via Coda MCP for Observer Agent

---

## Migration Strategy

### Phase 1: Parallel Creation
- Create new tables alongside existing "DB Templates"
- Do NOT delete old table yet
- Populate new tables with subset of data for testing

### Phase 2: Data Copy
- Write migration script to copy existing templates
- Process templates: Templates tagged as "checklist" or "SOP"
- Resource templates: Templates tagged as "document" or "email"
- Validate: No data loss

### Phase 3: Relationship Update
- Update existing offers to link to new service_blueprints
- Update existing projects to link to new process_templates
- Update existing tasks to set scheduled_start_date (from sprint.start_date)

### Phase 4: Cutover
- Mark old "DB Templates" table as deprecated
- Update all views and dashboards to use new tables
- Monitor for broken formulas/references

### Rollback Plan
- Keep old "DB Templates" table for 30 days
- If issues arise, can restore from old table
- Document known issues in rollback procedure

---

## Performance Considerations

### Coda Formula Optimization

**Concern**: Computed Sprint relationship requires filtering all tasks
**Mitigation**:
- Index on scheduled_start_date (Coda auto-creates)
- Limit Sprint.tasks view to 100 most recent
- Use Sprint week filter (only 7-day range)

**Expected Performance**: < 2 seconds for 500 tasks

### Workflow Variance Calculation

**Concern**: Aggregating execution_runs for workflows
**Mitigation**:
- Coda auto-memoizes formula results
- Only recalculates when execution_runs change
- Limit to last 90 days of runs (ignore old data)

**Expected Performance**: < 1 second for 50 workflows

---

## Validation Testing

### Test Cases

1. **Create Blueprint → Workflow → Template → Run**
   - Create service blueprint "Test Sprint"
   - Create workflow "Test Onboarding" linked to blueprint
   - Create process template "Test Client A" derived from workflow
   - Create execution run for task using template
   - Verify: Workflow variance_pct updates

2. **Sprint Auto-Population**
   - Create Sprint "2025-W50"
   - Create task with scheduled_start_date = 2025-12-09 (Monday W50)
   - Verify: Task appears in Sprint "2025-W50" view
   - Reschedule task to 2025-12-16 (Monday W51)
   - Verify: Task disappears from W50, appears in W51

3. **Workflow Performance Tracking**
   - Create workflow "Test Workflow" with estimated_hours = 4
   - Create 5 execution runs: actual_hours = [3, 4, 5, 6, 5]
   - Verify: avg_actual_hours = 4.6, variance_pct = +15%

4. **Process Template Lineage**
   - Create workflow "Parent Workflow"
   - Create process template "Child Template" with workflow = "Parent Workflow"
   - Verify: workflow.process_templates includes "Child Template"
   - Verify: template.workflow = "Parent Workflow"

---

## Documentation Requirements

### User Guides
1. "How to create a Service Blueprint" (5 layers, examples)
2. "How to create a Workflow" (steps, estimates, automation status)
3. "How to adapt a Workflow into Process Template" (context-specific changes)
4. "How to log an Execution Run" (manual entry, automatic creation)

### Technical Docs
1. Table schemas and relationships diagram
2. Sprint computed relationship formula explanation
3. Workflow variance tracking formula explanation
4. Migration procedure and rollback plan
