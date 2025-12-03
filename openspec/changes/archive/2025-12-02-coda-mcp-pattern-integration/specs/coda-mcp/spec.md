# Coda MCP API Specification Delta

## ADDED Requirements

### Requirement: Service Blueprint MCP Tools
The system SHALL provide MCP tools to query Service Blueprints from Coda via HTTP API.

#### Scenario: Get Service Blueprint by ID
- **WHEN** a client calls MCP tool `mcp__coda__get_service_blueprint` with `{blueprint_id: "coda:blueprint-i-abc123"}`
- **THEN** the system SHALL query Coda API GET `/docs/{docId}/tables/service_blueprints/rows/{blueprint_id}`
- **AND** return JSON: `{blueprint_id, name, description, customer_actions, frontstage, backstage, support_processes, evidence, version, status}`
- **AND** return 404 if blueprint not found
- **AND** return 401 if Coda API token invalid

#### Scenario: List all active Service Blueprints
- **WHEN** a client calls MCP tool `mcp__coda__list_service_blueprints`
- **THEN** the system SHALL query Coda API GET `/docs/{docId}/tables/service_blueprints/rows`
- **AND** filter results where status = "Active"
- **AND** return JSON array: `[{blueprint_id, name, description, ...}]`

---

### Requirement: Workflow MCP Tools
The system SHALL provide MCP tools to query Workflows with expanded Service Blueprint relations.

#### Scenario: Get Workflow by ID with relation expansion
- **WHEN** a client calls MCP tool `mcp__coda__get_workflow` with `{workflow_id: "coda:workflow-i-def456"}`
- **THEN** the system SHALL query Coda API GET `/docs/{docId}/tables/workflows/rows/{workflow_id}`
- **AND** expand service_blueprint relation to include {blueprint_id, name}
- **AND** return JSON: `{workflow_id, name, description, steps, estimated_hours, automation_status, service_blueprint: {blueprint_id, name}, version, status}`

#### Scenario: List Workflows filtered by blueprint
- **WHEN** a client calls MCP tool `mcp__coda__list_workflows` with `{blueprint_id: "coda:blueprint-i-abc123"}`
- **THEN** the system SHALL query Coda API GET `/docs/{docId}/tables/workflows/rows`
- **AND** filter results where service_blueprint = blueprint_id
- **AND** return JSON array of Workflow objects

---

### Requirement: Process Template MCP Tools
The system SHALL provide MCP tools to query and create Process Templates.

#### Scenario: Get Process Template by ID
- **WHEN** a client calls MCP tool `mcp__coda__get_process_template` with `{template_id: "coda:template-i-ghi789"}`
- **THEN** the system SHALL query Coda API GET `/docs/{docId}/tables/process_templates/rows/{template_id}`
- **AND** expand workflow relation (if exists) to include {workflow_id, name}
- **AND** return JSON: `{process_template_id, name, checklist, template_type, workflow: {workflow_id, name}, version, status}`

#### Scenario: List Process Templates filtered by workflow
- **WHEN** a client calls MCP tool `mcp__coda__list_process_templates` with `{workflow_id: "coda:workflow-i-def456"}`
- **THEN** the system SHALL filter results where workflow = workflow_id
- **AND** return JSON array of Process Template objects

#### Scenario: Create new Process Template
- **WHEN** a client calls MCP tool `mcp__coda__create_process_template` with `{workflow_id: "coda:workflow-i-def456", name: "Acme Corp Audit", checklist: "1. Get access\n2. Run analysis", template_type: "Operational"}`
- **THEN** the system SHALL validate: name not empty, template_type in ['Operational', 'Communication']
- **AND** call Coda API POST `/docs/{docId}/tables/process_templates/rows`
- **AND** set columns: name, checklist, template_type, workflow (lookup by workflow_id), version = "v1", status = "Draft"
- **AND** return JSON: `{process_template_id, name, created_at, status: "Draft"}`
- **AND** return 400 if validation fails

#### Scenario: Update Process Template checklist
- **WHEN** a client calls MCP tool `mcp__coda__update_process_template` with `{template_id: "coda:template-i-ghi789", updates: {checklist: "Updated steps", status: "Active"}}`
- **THEN** the system SHALL call Coda API PUT `/docs/{docId}/tables/process_templates/rows/{template_id}`
- **AND** update only allowed fields: checklist, status
- **AND** return JSON: `{process_template_id, updated_at}`
- **AND** return 404 if template not found

---

### Requirement: Execution Run MCP Tools
The system SHALL provide MCP tools to query and create Execution Runs with deduplication.

#### Scenario: List Execution Runs with filters
- **WHEN** a client calls MCP tool `mcp__coda__list_execution_runs` with `{project_id: "coda:project-i-mno345", start_date: "2025-12-01"}`
- **THEN** the system SHALL query Coda API GET `/docs/{docId}/tables/execution_runs/rows`
- **AND** filter where project = project_id AND started_at >= start_date
- **AND** limit to 100 most recent runs
- **AND** return JSON array: `[{run_id, run_type, task, project, process_template, actual_hours, outcome_notes, started_at, ended_at}]`

#### Scenario: Create Execution Run with deduplication
- **WHEN** a client calls MCP tool `mcp__coda__create_execution_run` with `{task_id: "coda:task-i-jkl012", project_id: "coda:project-i-mno345", started_at: "2025-12-03T09:00:00Z", ended_at: "2025-12-03T11:30:00Z", actual_hours: 2.5, outcome_notes: "Completed"}`
- **THEN** the system SHALL validate: started_at < ended_at, actual_hours > 0
- **AND** check for duplicate: query if (task_id + started_at) already exists
- **AND** if duplicate exists, return 409 Conflict with `{error: "Execution run already exists for task at this timestamp"}`
- **AND** if no duplicate, call Coda API POST `/docs/{docId}/tables/execution_runs/rows`
- **AND** set columns: run_type = "Process", task (lookup), project (lookup), process_template (lookup if provided), started_at, ended_at, actual_hours, outcome_notes, executed_by = system
- **AND** return JSON: `{run_id, actual_hours, variance_vs_estimate, created_at}`
- **AND** return 400 if validation fails

---

### Requirement: Bulk Task Creation from Template
The system SHALL provide MCP tool to bulk-create tasks from Process Template checklist.

#### Scenario: Create tasks from template checklist
- **WHEN** a client calls MCP tool `mcp__coda__create_tasks_from_template` with `{process_template_id: "coda:template-i-ghi789", project_id: "coda:project-i-mno345"}`
- **THEN** the system SHALL query GET process_template to fetch checklist
- **AND** parse checklist into steps (step_number, description, estimated_hours)
- **AND** for each step, call Coda API POST `/docs/{docId}/tables/tasks/rows` with: name = step description, project (lookup), estimated_hours = step estimate, status = "Backlog"
- **AND** return JSON: `{tasks_created: count, task_ids: [...]}`
- **AND** complete all task creation in < 5 seconds for 20 tasks

---

### Requirement: Coda API Error Handling
The system SHALL handle Coda API errors with retry logic and clear error messages.

#### Scenario: Coda API rate limit handling
- **WHEN** Coda API returns 429 (rate limit exceeded)
- **THEN** the system SHALL extract Retry-After header
- **AND** retry with exponential backoff (1s, 2s, 4s)
- **AND** if all retries exhausted, return 429 with `{error: "Rate limit exceeded, retry after X seconds"}`

#### Scenario: Coda API unauthorized
- **WHEN** Coda API returns 401 (unauthorized)
- **THEN** the system SHALL return 401 with `{error: "Coda API token invalid or expired"}`
- **AND** not retry (permanent failure)

#### Scenario: Coda API server error
- **WHEN** Coda API returns 5xx (server error)
- **THEN** the system SHALL retry once
- **AND** if retry fails, return 503 with `{error: "Coda API unavailable, please retry"}`

---

## MODIFIED Requirements

### Requirement: List Tables Tool Enhancement
The system SHALL include pattern tables in list_tables response.

#### Scenario: List tables includes pattern tables
- **WHEN** a client calls MCP tool `mcp__coda__list_tables`
- **THEN** the response SHALL include pattern tables in the tables array
- **AND** include: `{table_id: "service_blueprints", name: "Service Blueprints"}`, `{table_id: "workflows", name: "Workflows"}`, `{table_id: "process_templates", name: "Process Templates"}`, `{table_id: "execution_runs", name: "Execution Runs"}`
