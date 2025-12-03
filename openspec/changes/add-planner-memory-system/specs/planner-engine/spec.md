# Planner Engine Specification Delta

## ADDED Requirements

### Requirement: Intent to Process Template Transformation
The system SHALL transform natural language planning intents into structured Process Templates (context-specific checklists) with tasks, estimates, and dependencies using LLM-powered generation and pattern-based retrieval from Coda.

#### Scenario: Generate Process Template from simple intent
- **WHEN** a client calls POST `/api/v1/planner/plan` with `{intent: "Launch portfolio website", context: {client_id: 1, deadline: "2025-12-31"}}`
- **THEN** the system SHALL query Memory Gateway for user preferences
- **AND** load the "sop_generator" prompt template from Postgres
- **AND** call OpenRouter with Claude 3.5 Sonnet to generate a Process Template
- **AND** parse the LLM response into structured JSON with `{name, workflow_id, template_type: "Operational", checklist: [{step_number, description, estimated_hours, dependencies}]}`
- **AND** store the plan metadata in Postgres `plans` table with status "draft"
- **AND** call Coda MCP to create Process Template in `process_templates` table
- **AND** return status 201 with `{plan_id, process_template_id, name, checklist, created_at}`

#### Scenario: Generate Process Template with user preferences
- **WHEN** a client calls POST `/api/v1/planner/plan` with `{intent: "Implement new feature", context: {client_id: 1}}`
- **AND** Memory Gateway returns user preferences `{prefers_morning_deep_work: true, max_task_duration: 2 hours}`
- **THEN** the generated Process Template SHALL incorporate these preferences
- **AND** tasks SHALL be designed with 2-hour maximum duration
- **AND** the template SHALL include a note recommending morning scheduling for focused tasks

#### Scenario: Invalid intent rejected
- **WHEN** a client calls POST `/api/v1/planner/plan` with `{intent: ""}`
- **THEN** the system SHALL return status 400 with `{error: "Intent cannot be empty"}`

#### Scenario: Query Service Blueprint for context
- **WHEN** a client calls POST `/api/v1/planner/plan` with `{intent: "Deliver client onboarding", context: {engagement_id: "coda:eng-42"}}`
- **THEN** the system SHALL query Coda MCP for engagement details
- **AND** query Coda `offers` table for the associated offer
- **AND** query Coda `service_blueprints` table for the blueprint linked to the offer
- **AND** use blueprint structure (customer_actions, frontstage, backstage, support_processes, evidence) as context for LLM prompt
- **AND** include blueprint context in generated Process Template metadata

#### Scenario: Adapt Workflow to specific engagement
- **WHEN** a client calls POST `/api/v1/planner/plan` with `{workflow_id: "coda:wf-onboarding", context: {engagement_id: "coda:eng-42", client_name: "Acme Corp"}}`
- **THEN** the system SHALL query Coda `workflows` table for workflow steps
- **AND** query Memory Gateway for similar past execution runs (same workflow_id)
- **AND** use workflow steps as base template
- **AND** adapt for specific engagement context (client name, engagement type, constraints)
- **AND** store reference to parent workflow_id in generated Process Template
- **AND** call Coda MCP to create tasks from Process Template checklist

---

### Requirement: LLM Integration
The system SHALL integrate with OpenRouter for LLM operations, using Claude 3.5 Sonnet as the primary model with Langfuse tracing for observability.

#### Scenario: LLM call with Langfuse tracing
- **WHEN** the system calls OpenRouter to generate a Process Template
- **THEN** the call SHALL be traced in Langfuse with metadata `{model: "anthropic/claude-3.5-sonnet", temperature: 0.7, max_tokens: 4000}`
- **AND** token usage and costs SHALL be recorded
- **AND** the trace SHALL be tagged with `{operation: "process_template_generation", client_id, plan_id, engagement_id}`

#### Scenario: LLM call fails with retry
- **WHEN** the system calls OpenRouter and receives a 429 (rate limit) error
- **THEN** the system SHALL retry with exponential backoff (1s, 2s, 4s)
- **AND** if all retries fail, return status 503 with `{error: "LLM service temporarily unavailable, please retry"}`

---

### Requirement: Prompt Template Management
The system SHALL load prompt templates from the Postgres `prompt_templates` table, enabling prompt versioning and A/B testing without code deployments.

#### Scenario: Load prompt template
- **WHEN** the system needs to generate a Process Template
- **THEN** the system SHALL query Postgres for `SELECT content FROM prompt_templates WHERE template_name = 'sop_generator' AND version = 'v1'`
- **AND** use the template content as the system prompt
- **AND** if the template is not found, fallback to a default hardcoded prompt

#### Scenario: Load Manifold Navigator prompt for complex planning
- **WHEN** a client calls POST `/api/v1/planner/plan` with `{intent: "<brainstorm>...</brainstorm>", use_manifold: true}`
- **THEN** the system SHALL query Postgres for `SELECT content FROM prompt_templates WHERE template_name = 'sop_generator_manifold' AND version = 'v1'`
- **AND** load configuration metadata from template: `{analysis_scope, gentleness, math_depth, position_awareness, option_count}`
- **AND** use Manifold Navigator v1.3 prompt structure for multi-scale analysis
- **AND** parse LLM response into structured Process Template with action vectors and trajectories

#### Scenario: Prompt template versioning
- **WHEN** multiple versions of "sop_generator" exist (v1, v2, v3)
- **THEN** the system SHALL use the version specified in `PROMPT_TEMPLATE_VERSION` environment variable (default: "v1")
- **AND** allow A/B testing by routing different clients to different versions

---

### Requirement: Plan Storage and Retrieval
The system SHALL store generated plans with dual storage: metadata in Postgres `plans` table and Process Templates in Coda `process_templates` table via Coda MCP.

#### Scenario: Store plan after generation
- **WHEN** a Process Template is successfully generated
- **THEN** the system SHALL insert a record into Postgres `plans` table
- **AND** set initial status to "draft"
- **AND** store plan metadata: `{plan_title, intent, client_id, engagement_id, workflow_id, process_template_id}`
- **AND** call Coda MCP to create Process Template in Coda `process_templates` table
- **AND** link Coda Process Template to parent Workflow (if applicable)
- **AND** record `created_at` and `updated_at` timestamps in both Postgres and Coda

#### Scenario: Retrieve plan by ID
- **WHEN** a client calls GET `/api/v1/planner/plans/{plan_id}`
- **AND** the plan exists
- **THEN** the system SHALL return status 200 with the full plan record
- **AND** include `{id, plan_title, intent, process_template_id, workflow_id, engagement_id, status, created_at, updated_at}`
- **AND** optionally fetch Process Template details from Coda MCP if requested

#### Scenario: List plans for client
- **WHEN** a client calls GET `/api/v1/planner/plans?client_id=1&limit=10`
- **THEN** the system SHALL return the 10 most recent plans for client_id 1
- **AND** order by `created_at DESC`

---

### Requirement: Process Template Parsing and Validation
The system SHALL parse LLM-generated Process Template text into structured JSON and validate the schema before storage in Coda.

#### Scenario: Parse valid Process Template JSON
- **WHEN** the LLM returns a response with JSON structure `{name: "...", workflow_id: "...", template_type: "Operational", checklist: [{step_number: 1, description: "...", estimated_hours: 2, dependencies: []}]}`
- **THEN** the system SHALL extract the JSON from the LLM response (handling markdown code blocks)
- **AND** validate against the Process Template schema (required fields: name, template_type, checklist array with step_number, description, estimated_hours)
- **AND** if valid, proceed with storage in both Postgres and Coda

#### Scenario: Parse invalid Process Template JSON
- **WHEN** the LLM returns malformed JSON or incomplete structure
- **THEN** the system SHALL log the error with full LLM response
- **AND** retry the LLM call once with additional guidance in the prompt
- **AND** if retry fails, return status 500 with `{error: "Failed to generate valid Process Template, please try rephrasing your intent"}`

---

### Requirement: Health Monitoring
The system SHALL expose health check endpoints and validate connectivity to dependencies (Memory Gateway, Postgres, OpenRouter, Coda MCP).

#### Scenario: Health check with all dependencies healthy
- **WHEN** a client calls GET `/health`
- **THEN** the system SHALL return status 200 with `{status: "healthy", dependencies: {memory_gateway: "up", postgres: "up", openrouter: "up", coda_mcp: "up"}}`

#### Scenario: Health check with Memory Gateway unreachable
- **WHEN** a client calls GET `/health`
- **AND** Memory Gateway is unreachable
- **THEN** the system SHALL return status 200 with `{status: "degraded", dependencies: {memory_gateway: "down", postgres: "up", openrouter: "up", coda_mcp: "up"}, warning: "Planner will work without personalization"}`

#### Scenario: Health check with Coda MCP unreachable
- **WHEN** a client calls GET `/health`
- **AND** Coda MCP is unreachable
- **THEN** the system SHALL return status 503 with `{status: "unhealthy", dependencies: {coda_mcp: "down"}, error: "Cannot create Process Templates without Coda access"}`

---

### Requirement: Performance
The system SHALL generate Process Templates within 10 seconds (p95 latency) and handle concurrent requests without degradation.

#### Scenario: Process Template generation completes within SLA
- **WHEN** a client submits a planning request
- **THEN** the system SHALL return a response within 10 seconds for 95% of requests
- **AND** log any requests exceeding this threshold for performance monitoring

#### Scenario: Concurrent request handling
- **WHEN** the system receives 5 concurrent planning requests
- **THEN** the system SHALL process all requests in parallel
- **AND** not block or queue requests unnecessarily
- **AND** maintain p95 latency under 10 seconds

---

### Requirement: Cost Optimization
The system SHALL implement caching strategies to minimize LLM API costs and provide cost tracking per plan generation.

#### Scenario: Cache similar intents
- **WHEN** a client submits an intent very similar to a recent intent (e.g., "Launch website" vs "Launch my website")
- **THEN** the system SHALL check Memory Gateway for similar planning intents
- **AND** if a cached Process Template exists and is <7 days old, offer to reuse it with modifications
- **AND** avoid regenerating from scratch

#### Scenario: Track LLM costs per plan
- **WHEN** a plan is generated
- **THEN** the system SHALL record the LLM cost in Langfuse
- **AND** log `{plan_id, model, prompt_tokens, completion_tokens, estimated_cost_usd}` to application logs
- **AND** make this data available for cost analytics

---

### Requirement: Error Handling
The system SHALL provide clear error messages and handle LLM failures gracefully with retry logic.

#### Scenario: OpenRouter timeout
- **WHEN** OpenRouter takes >30 seconds to respond
- **THEN** the system SHALL timeout the request
- **AND** return status 504 with `{error: "LLM request timeout, please retry"}`

#### Scenario: Invalid LLM response
- **WHEN** the LLM returns a valid response but with unexpected content (e.g., refusal to plan)
- **THEN** the system SHALL detect this case
- **AND** return status 422 with `{error: "Unable to generate plan from this intent, please provide more details or rephrase"}`
