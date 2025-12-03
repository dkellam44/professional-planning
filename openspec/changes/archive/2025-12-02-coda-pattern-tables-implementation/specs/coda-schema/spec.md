# Coda Schema Specification Delta

## ADDED Requirements

### Requirement: Service Blueprints Table
The system SHALL provide a table for storing service journey maps with 5-layer structure (customer_actions, frontstage, backstage, support_processes, evidence).

#### Scenario: Service Blueprint table exists with required columns
- **WHEN** the Coda schema is updated
- **THEN** the `service_blueprints` table SHALL exist with columns: blueprint_id (primary key), name, description, customer_actions, frontstage, backstage, support_processes, evidence, version, status, owner, created_at, updated_at
- **AND** status SHALL be constrained to `('Draft', 'Active', 'Deprecated')`

---

### Requirement: Workflows Table
The system SHALL provide a table for canonical SOPs with performance tracking and execution telemetry.

#### Scenario: Workflows table exists with required columns
- **WHEN** the Coda schema is updated
- **THEN** the `workflows` table SHALL exist with columns: workflow_id (primary key), name, description, service_blueprint (relation → service_blueprints), steps, estimated_hours, automation_status, version, status, owner, created_at, updated_at
- **AND** automation_status SHALL be constrained to `('Manual', 'Semi-automated', 'Automated')`

#### Scenario: Workflows table includes performance tracking formulas
- **WHEN** the workflows table is created
- **THEN** computed columns SHALL exist: execution_runs_count, avg_actual_hours, variance_pct
- **AND** variance_pct formula: `(avg_actual_hours - estimated_hours) / estimated_hours * 100`

---

### Requirement: Process Templates Table
The system SHALL provide a table for context-specific checklists derived from workflows.

#### Scenario: Process Templates table exists with required columns
- **WHEN** the Coda schema is updated
- **THEN** the `process_templates` table SHALL exist with columns: process_template_id (primary key)
- name, checklist, template_type, workflow (relation, nullable), version, status, owner
- **AND** template_type SHALL be constrained to `('Operational', 'Communication')`

---

### Requirement: Resource Templates Table
The system SHALL provide a table for document/communication asset templates.

#### Scenario: Resource Templates table exists with required columns
- **WHEN** the Coda schema is updated
- **THEN** the `resource_templates` table SHALL exist with columns: resource_template_id (primary key), name, template_type, storage_url, version, status, owner, created_at, updated_at
- **AND** template_type SHALL be constrained to `('Document', 'Communication', 'Media')`

---

### Requirement: Execution Runs Table
The system SHALL provide a table for work session telemetry to enable pattern learning and variance tracking.

#### Scenario: Execution Runs table exists with required columns
- **WHEN** the Coda schema is updated
- **THEN** the `execution_runs` table SHALL exist with columns: run_id (primary key), run_type, started_at, ended_at, actual_hours, outcome_notes, workflow (relation), process_template (relation), task (relation), project (relation), engagement (relation), executed_by, created_at
- **AND** run_type SHALL be constrained to `('Process', 'Touchpoint')`

#### Scenario: Execution Runs enable variance analysis
- **WHEN** execution runs are created
- **THEN** actual_hours SHALL be comparable to task.estimated_hours for variance calculation
- **AND** workflow performance SHALL be trackable via workflow.execution_runs.Average(actual_hours)

---

## MODIFIED Requirements

### Requirement: Offers Table Enhancement
The system SHALL link offers to service blueprints for pattern-based delivery.

#### Scenario: Offers linked to Service Blueprints
- **WHEN** the Coda schema is updated
- **THEN** the `offers` table SHALL have column: service_blueprint (relation → service_blueprints)
- **AND** existing offers SHALL be updatable to link to blueprints

---

### Requirement: Projects Table Enhancement
The system SHALL link projects to process templates for execution tracking.

#### Scenario: Projects linked to Process Templates
- **WHEN** the Coda schema is updated
- **THEN** the `projects` table SHALL have column: process_template (relation → process_templates)
- **AND** projects SHALL inherit checklist from linked template

---

### Requirement: Tasks Table Enhancement
The system SHALL link tasks to execution runs and use scheduled dates for Sprint assignment.

#### Scenario: Tasks linked to Execution Runs
- **WHEN** the Coda schema is updated
- **THEN** the `tasks` table SHALL have columns: execution_run (relation → execution_runs), scheduled_start_date (date), scheduled_end_date (date)
- **AND** column sprint (FK) SHALL be removed
- **AND** Sprint assignment SHALL be computed via scheduled_start_date

---

### Requirement: Sprints Table Enhancement
The system SHALL use computed task relationship based on scheduled dates.

#### Scenario: Sprints use computed task relationship
- **WHEN** the Coda schema is updated
- **THEN** the `sprints` table SHALL have columns: start_date (date), end_date (date)
- **AND** formula for tasks SHALL be: `tasks.Filter(scheduled_start_date >= thisRow.start_date AND scheduled_start_date <= thisRow.end_date)`
- **AND** planned_billable_hrs formula SHALL auto-update based on computed tasks
