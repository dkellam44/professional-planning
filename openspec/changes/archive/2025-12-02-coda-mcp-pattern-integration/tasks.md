# Coda MCP Pattern Integration - Tasks

## Phase 1: Read Operations (3-4 hours)

### 1.1 Service Blueprint Endpoints
- [ ] 1.1.1 Implement `mcp__coda__get_service_blueprint(blueprint_id)`
  - Query Coda API: GET /docs/{docId}/tables/service_blueprints/rows/{blueprint_id}
  - Parse response: extract all fields (name, description, 5 layers, version, status)
  - Return JSON: `{blueprint_id, name, description, customer_actions, frontstage, backstage, support_processes, evidence, version, status}`
- [ ] 1.1.2 Implement `mcp__coda__list_service_blueprints()`
  - Query Coda API: GET /docs/{docId}/tables/service_blueprints/rows
  - Filter: status = "Active"
  - Return JSON array: `[{blueprint_id, name, description, ...}]`
- [ ] 1.1.3 Test: Call endpoints, verify data returned
- [ ] 1.1.4 Error handling: 404 if blueprint not found, 500 on Coda API error

### 1.2 Workflow Endpoints
- [ ] 1.2.1 Implement `mcp__coda__get_workflow(workflow_id)`
  - Query Coda API: GET /docs/{docId}/tables/workflows/rows/{workflow_id}
  - Parse response: include service_blueprint relation (expand to get blueprint_id and name)
  - Return JSON: `{workflow_id, name, description, steps, estimated_hours, automation_status, service_blueprint: {blueprint_id, name}, version, status}`
- [ ] 1.2.2 Implement `mcp__coda__list_workflows(blueprint_id?)`
  - Query Coda API: GET /docs/{docId}/tables/workflows/rows
  - If blueprint_id provided, filter rows where service_blueprint = blueprint_id
  - Return JSON array
- [ ] 1.2.3 Test: List workflows for specific blueprint, verify filtering
- [ ] 1.2.4 Error handling: Empty array if no workflows found

### 1.3 Process Template Endpoints
- [ ] 1.3.1 Implement `mcp__coda__get_process_template(template_id)`
  - Query Coda API: GET /docs/{docId}/tables/process_templates/rows/{template_id}
  - Parse response: include workflow relation (if exists)
  - Return JSON: `{process_template_id, name, checklist, template_type, workflow: {workflow_id, name}, version, status}`
- [ ] 1.3.2 Implement `mcp__coda__list_process_templates(workflow_id?)`
  - Query Coda API: GET /docs/{docId}/tables/process_templates/rows
  - If workflow_id provided, filter rows where workflow = workflow_id
  - Return JSON array
- [ ] 1.3.3 Test: List templates derived from specific workflow
- [ ] 1.3.4 Error handling: 404 if template not found

### 1.4 Execution Run Endpoints
- [ ] 1.4.1 Implement `mcp__coda__list_execution_runs(project_id?, task_id?, start_date?)`
  - Query Coda API: GET /docs/{docId}/tables/execution_runs/rows
  - Apply filters if provided:
    - project_id: filter where project = project_id
    - task_id: filter where task = task_id
    - start_date: filter where started_at >= start_date
  - Return JSON array: `[{run_id, run_type, task, project, process_template, actual_hours, outcome_notes, started_at, ended_at}]`
- [ ] 1.4.2 Test: Query execution runs for specific project
- [ ] 1.4.3 Test: Query execution runs after specific date
- [ ] 1.4.4 Performance: Limit to 100 most recent runs by default

### 1.5 Integration Testing
- [ ] 1.5.1 Test: Planner Engine calls list_service_blueprints, receives data
- [ ] 1.5.2 Test: Planner Engine calls get_workflow, receives steps
- [ ] 1.5.3 Test: Observer Agent calls list_execution_runs for project
- [ ] 1.5.4 Load test: 50 concurrent read requests, verify < 500ms p95

---

## Phase 2: Write Operations (3-4 hours)

### 2.1 Create Process Template Endpoint
- [ ] 2.1.1 Implement `mcp__coda__create_process_template({workflow_id, name, checklist, template_type})`
  - Validate input: name not empty, template_type in ["Operational", "Communication"]
  - Query Coda API: POST /docs/{docId}/tables/process_templates/rows
  - Set columns:
    - name, checklist, template_type (from input)
    - workflow (lookup row by workflow_id if provided)
    - version = "v1"
    - status = "Draft"
    - owner = system user
  - Return JSON: `{process_template_id, name, created_at}`
- [ ] 2.1.2 Test: Create template with workflow linkage, verify in Coda UI
- [ ] 2.1.3 Test: Create template without workflow (standalone), verify
- [ ] 2.1.4 Error handling: 400 if validation fails, 500 on Coda API error

### 2.2 Update Process Template Endpoint
- [ ] 2.2.1 Implement `mcp__coda__update_process_template(template_id, updates)`
  - Validate: template_id exists
  - Query Coda API: PUT /docs/{docId}/tables/process_templates/rows/{template_id}
  - Update fields: checklist, status (allow updates to these fields only)
  - Return JSON: `{process_template_id, updated_at}`
- [ ] 2.2.2 Test: Update template checklist, verify in Coda
- [ ] 2.2.3 Test: Update template status to "Active"
- [ ] 2.2.4 Error handling: 404 if template not found

### 2.3 Create Execution Run Endpoint
- [ ] 2.3.1 Implement `mcp__coda__create_execution_run({task_id, project_id, process_template_id, started_at, ended_at, actual_hours, outcome_notes})`
  - Validate input: started_at < ended_at, actual_hours > 0
  - Query Coda API: POST /docs/{docId}/tables/execution_runs/rows
  - Set columns:
    - run_type = "Process"
    - task (lookup row by task_id)
    - project (lookup row by project_id)
    - process_template (lookup row by process_template_id if provided)
    - started_at, ended_at, actual_hours, outcome_notes (from input)
    - executed_by = system user
  - Return JSON: `{run_id, actual_hours, created_at}`
- [ ] 2.3.2 Test: Create execution run for task, verify in Coda
- [ ] 2.3.3 Test: Link execution run to process template, verify lineage
- [ ] 2.3.4 Error handling: 400 if validation fails

### 2.4 Bulk Create Tasks from Template
- [ ] 2.4.1 Implement `mcp__coda__create_tasks_from_template(process_template_id, project_id)`
  - Query: GET process_template checklist
  - Parse checklist: extract steps (step_number, description, estimated_hours)
  - For each step, create task via POST /docs/{docId}/tables/tasks/rows
  - Set columns:
    - name = step description
    - project (lookup by project_id)
    - estimated_hours = step estimated_hours
    - status = "Backlog"
  - Return JSON: `{tasks_created: count, task_ids: [...]}`
- [ ] 2.4.2 Test: Create 5 tasks from template, verify all appear in project
- [ ] 2.4.3 Test: Verify tasks have correct estimates
- [ ] 2.4.4 Performance: Create 20 tasks in < 5 seconds

### 2.5 Integration Testing
- [ ] 2.5.1 End-to-end test: Planner Engine creates process template, then creates tasks
- [ ] 2.5.2 End-to-end test: Observer Agent creates execution run for task
- [ ] 2.5.3 Test: Verify execution run links to task, project, template correctly
- [ ] 2.5.4 Load test: 20 concurrent write requests, verify < 1s p95

---

## Phase 3: Error Handling & Validation (1 hour)

### 3.1 Coda API Error Handling
- [ ] 3.1.1 Handle 429 (rate limit): Implement exponential backoff (1s, 2s, 4s)
- [ ] 3.1.2 Handle 401 (unauthorized): Return clear error message
- [ ] 3.1.3 Handle 404 (table/row not found): Return 404 to client
- [ ] 3.1.4 Handle 5xx (Coda API error): Retry once, then return 503

### 3.2 Input Validation
- [ ] 3.2.1 Validate blueprint_id format: "coda:blueprint-{id}" or Coda row ID
- [ ] 3.2.2 Validate workflow_id format
- [ ] 3.2.3 Validate template_type enum: ["Operational", "Communication"]
- [ ] 3.2.4 Validate dates: started_at < ended_at, no future dates for execution runs

### 3.3 Logging & Observability
- [ ] 3.3.1 Log all MCP tool calls: tool name, params, duration, status
- [ ] 3.3.2 Log Coda API responses: status code, response time
- [ ] 3.3.3 Add metrics: mcp_coda_requests_total, mcp_coda_request_duration_seconds
- [ ] 3.3.4 Add tracing: Langfuse trace for each MCP tool call (if applicable)

---

## Phase 4: Documentation (1 hour)

### 4.1 API Documentation
- [ ] 4.1.1 Document each MCP tool: name, parameters, return type, example
- [ ] 4.1.2 Document error codes: 400, 404, 429, 500, 503
- [ ] 4.1.3 Document rate limits: Coda API 100 req/min per doc
- [ ] 4.1.4 Create Postman collection or equivalent for testing

### 4.2 Integration Guide
- [ ] 4.2.1 Document how Planner Engine calls coda-mcp for blueprints
- [ ] 4.2.2 Document how Observer Agent creates execution runs
- [ ] 4.2.3 Document data flow: Coda → coda-mcp → Planner → Postgres → Observer → coda-mcp → Coda
- [ ] 4.2.4 Create troubleshooting guide: common errors and solutions

---

## Completion Checklist

- [ ] All 7 read operations implemented and tested
- [ ] All 4 write operations implemented and tested
- [ ] Error handling for Coda API errors (429, 401, 404, 5xx)
- [ ] Input validation for all write operations
- [ ] Integration tests with Planner Engine and Observer Agent passed
- [ ] Load testing passed (50 read req, 20 write req)
- [ ] Documentation complete (API docs, integration guide)
- [ ] Ready for add-planner-memory-system Phase 1c deployment
