# Tasks: Create Dual-Schema ERP and Agent Database (Greenfield)

## Phase 0: Preparation

### 0.1 Create postgres-erp Infrastructure
- [ ] Create directory structure:
  - `mkdir -p /service-builds/postgres-erp/migrations`
  - `mkdir -p /service-builds/postgres-erp/data`
  - `mkdir -p /service-builds/postgres-erp/.env-example`

### 0.2 Create Docker Compose File
- [ ] Create `/service-builds/postgres-erp/docker-compose.yml` with postgres-erp and postgrest-erp services
- [ ] Configure portfolio-network (create if not exists)
- [ ] Set resource limits (postgres: 300MB mem, 0.5 CPU; postgrest: 100MB mem, 0.25 CPU)
- [ ] Add Traefik labels to postgrest-erp for erp-db.bestviable.com routing
- [ ] Create .env file with POSTGRES_PASSWORD, POSTGREST_JWT_SECRET

### 0.3 Archive Legacy Migrations
- [ ] Create deprecated directory: `mkdir -p /service-builds/postgres/migrations/deprecated`
- [ ] Move legacy migrations: `mv /service-builds/postgres/migrations/00{1,2,3}_*.sql /service-builds/postgres/migrations/deprecated/`
- [ ] Create README in deprecated/ explaining why migrations were archived

### 0.4 Fix Starter Schema Syntax
- [ ] Read `/Coda_to_Postgres/ERP_postgres_starter copy.sql` line 123
- [ ] Identify syntax error: missing comma after `profile_id BIGINT REFERENCES agent.profiles(id)`
- [ ] Document fix needed: Add comma after `profile_id` field in agent.sessions table

### 0.5 Create Validation Script
- [ ] Create file: `/service-builds/postgres/migrations/validate_schema.sql`
- [ ] Add table count validation (expect 14 erp + 21 agent = 35 total)
- [ ] Add FK constraint validation (expect ~15-20 FKs)
- [ ] Add sample query tests (SELECT * FROM erp.people LIMIT 1, etc.)
- [ ] Test validation script locally

## Phase 1: Develop Migrations

### 1.1 Create Migration 001 - ERP Schema
- [ ] Create file: `/service-builds/postgres/migrations/001_erp_schema.sql`
- [ ] Add file header with purpose, created date, schema version
- [ ] Create erp schema: `CREATE SCHEMA IF NOT EXISTS erp;`
- [ ] Create Core 6 tables from starter schema:
  - [ ] erp.people (id, global_id, full_name, email, handle, role_label, notes, is_active, created_at, updated_at)
  - [ ] erp.organizations (id, global_id, name, website, org_type, notes, is_active, created_at, updated_at)
  - [ ] erp.projects (id, global_id, name, description, owner_person_id FK, organization_id FK, status, start_date, end_date, tags, created_at, updated_at)
  - [ ] erp.engagements (id, global_id, name, client_org_id FK, primary_contact_id FK, project_id FK, offer_name, status, start_date, end_date, value_estimate, notes, created_at, updated_at)
  - [ ] erp.tasks (id, global_id, title, description, project_id FK, engagement_id FK, assignee_id FK, status, priority, due_date, estimated_hours, actual_hours, tags, created_at, updated_at)
  - [ ] erp.okrs (id, global_id, owner_person_id FK, venture_name, objective, key_results JSONB, time_horizon_start, time_horizon_end, status, created_at, updated_at)
- [ ] Create Pattern 8 tables (from Coda scope + starter schema):
  - [ ] erp.service_blueprints (id, global_id, name, description, customer_actions, frontstage, backstage, support_processes, evidence, version, status, tags, created_at, updated_at)
  - [ ] erp.workflows (id, global_id, service_blueprint_id FK, name, description, steps JSONB, estimated_hours, automation_status, version, status, tags, created_at, updated_at)
  - [ ] erp.process_templates (id, global_id, workflow_id FK, name, checklist JSONB, template_type, version, status, tags, created_at, updated_at)
  - [ ] erp.execution_runs (id, global_id, process_template_id FK, run_identifier UNIQUE, status, started_at, ended_at, estimated_hours, actual_hours, variance_pct GENERATED, metadata JSONB, created_at, updated_at)
  - [ ] erp.ventures (id, global_id, name, description, status, owner_person_id FK, created_at, updated_at)
  - [ ] erp.sprints (id, global_id, name, start_date, end_date, capacity_hours, status, created_at, updated_at)
  - [ ] erp.offers (id, global_id, service_blueprint_id FK, name, description, pricing_model, status, created_at, updated_at)
  - [ ] erp.deliverables (id, global_id, engagement_id FK, offer_id FK, name, description, due_date, status, created_at, updated_at)
- [ ] Add all indexes from starter schema
- [ ] Add all foreign key constraints (must reference tables in order)
- [ ] Test locally

### 1.2 Create Migration 002 - Agent Schema
- [ ] Create file: `/service-builds/postgres/migrations/002_agent_schema.sql`
- [ ] Add file header with purpose, created date, schema version
- [ ] Create agent schema: `CREATE SCHEMA IF NOT EXISTS agent;`
- [ ] Create Memory tables (6):
  - [ ] agent.client_profiles (id, client_id UNIQUE, name, preferences JSONB, created_at, updated_at)
  - [ ] agent.memory_entries (id, client_id, content, memory_type, embedding vector(1536), ttl_minutes, expires_at, metadata JSONB, created_at)
  - [ ] agent.memory_facts (id, client_id, fact_key UNIQUE, fact_value, category, confidence_score, metadata JSONB, created_at, updated_at)
  - [ ] agent.working_state (id, client_id, state_key UNIQUE, state_value JSONB, updated_at)
  - [ ] agent.episodes (id, client_id, session_id, summary, embedding vector(1536), metadata JSONB, created_at)
  - [ ] agent.webhook_executions (id, client_id, webhook_url, payload JSONB, response JSONB, status, executed_at)
- [ ] Create Operations tables (7):
  - [ ] agent.sessions (id, global_id, profile_id FK, session_type, client_person_id FK erp.people, subject_type, subject_id, status, started_at, ended_at, trace_id, context_recipe_id FK, applied_harness_config JSONB, metadata JSONB) **Fix syntax: add comma after profile_id**
  - [ ] agent.events (id, session_id FK, occurred_at, event_type, event_source, subject_type, subject_id, message, payload JSONB, memory_scope, salience_score, promoted_fact_id FK agent.facts, created_at, updated_at)
  - [ ] agent.facts (id, global_id UNIQUE, subject_type, subject_id, fact_type, category, content, salience_score, valid_from, valid_to, source_event_id FK agent.events, source_ref, metadata JSONB, created_at, updated_at)
  - [ ] agent.goals (id, global_id UNIQUE, subject_type, subject_id, title, description, success_criteria JSONB, status, priority, time_horizon_start, time_horizon_end, parent_goal_id FK, created_at, updated_at)
  - [ ] agent.reflections (id, session_id FK, reflection_date, mode, client_person_id FK erp.people, scope, focal_entity_type, focal_entity_id, goals, accomplishments, blockers, decisions, metrics JSONB, next_actions, raw_text, created_at)
  - [ ] agent.step_evaluations (id, execution_run_id FK erp.execution_runs, step_name, step_index, validator_type, status, score, feedback, needs_human, created_at)
  - [ ] agent.artifacts (id, global_id UNIQUE, artifact_type, external_id, title, summary, source_system, metadata JSONB, created_at)
- [ ] Create Configuration tables (4):
  - [ ] agent.profiles (id, global_id UNIQUE, name UNIQUE, description, system_prompt_template, harness_config JSONB, default_model, default_context_recipe_id FK agent.context_recipes, is_active, created_at, updated_at)
  - [ ] agent.tools (id, global_id UNIQUE, name UNIQUE, description, schema_definition JSONB, is_active, created_at, updated_at)
  - [ ] agent.context_recipes (id, name UNIQUE, description, retrieval_spec JSONB, created_at)
  - [ ] agent.profile_tools (profile_id FK agent.profiles, tool_id FK agent.tools, is_enabled, PRIMARY KEY (profile_id, tool_id))
- [ ] Create Graph/Blocks tables (4):
  - [ ] agent.graph_nodes (id, node_type, node_id UNIQUE, properties JSONB, created_at, updated_at)
  - [ ] agent.graph_edges (id, from_node_id FK agent.graph_nodes, to_node_id FK agent.graph_nodes, edge_type, properties JSONB, created_at, updated_at)
  - [ ] agent.blocks (id, global_id UNIQUE, block_type, title, body_md, source_table, source_id, artifact_id FK agent.artifacts, vector_key, graph_key, metadata JSONB, created_at, updated_at)
  - [ ] agent.block_actions (id, block_id FK agent.blocks, action_type, tool_name, tool_params_template JSONB, is_default, metadata JSONB, unique index on is_default per block_id)
- [ ] Create Planning tables (3):
  - [ ] agent.plans (id, plan_title, intent, sop JSONB, client_id, status, metadata JSONB, created_at, updated_at)
  - [ ] agent.scheduler_runs (id, plan_id FK agent.plans, schedule_blocks JSONB, client_id, status, calendar_events JSONB, metadata JSONB, created_at, updated_at)
  - [ ] agent.prompt_templates (id, template_name UNIQUE, template_type, content, version, variables JSONB, metadata JSONB, created_at, updated_at)
- [ ] Add all indexes from starter schema
- [ ] Add all foreign key constraints (including cross-schema FKs to erp tables)
- [ ] Add helper functions (if needed):
  - [ ] get_graph_neighbors(node_id) - returns neighboring nodes with edge info
  - [ ] update_updated_at_column() - trigger function for automatic timestamp updates
- [ ] Add triggers for updated_at columns on all tables with updated_at field
- [ ] Test locally

## Phase 2: Local Testing

### 2.1 Setup Local Test Environment
- [ ] Start postgres-erp container locally: `docker-compose up -d postgres-erp`
- [ ] Verify postgres-erp running: `docker ps | grep postgres-erp`
- [ ] Check logs for startup success: `docker logs postgres-erp`

### 2.2 Execute Migrations Locally
- [ ] Run migration 001: `docker exec -i postgres-erp psql -U erp_admin -d portfolio < /service-builds/postgres-erp/migrations/001_erp_schema.sql`
- [ ] Check for errors in output
- [ ] Run migration 002: `docker exec -i postgres-erp psql -U erp_admin -d portfolio < /service-builds/postgres-erp/migrations/002_agent_schema.sql`
- [ ] Check for errors in output

### 2.3 Run Validation Script
- [ ] Execute validation script: `docker exec -i postgres-erp psql -U erp_admin -d portfolio < /service-builds/postgres-erp/migrations/validate_schema.sql`
- [ ] Verify table counts: 14 erp + 21 agent = 35 total
- [ ] Verify FK constraints: ~15-20 FKs across both schemas
- [ ] Verify sample queries return successfully (even if 0 rows)
- [ ] Check for any errors or warnings

### 2.4 Manual Validation Checks
- [ ] List all tables in erp schema: `docker exec postgres-erp psql -U erp_admin -d portfolio -c "\dt erp.*"`
- [ ] List all tables in agent schema: `docker exec postgres-erp psql -U erp_admin -d portfolio -c "\dt agent.*"`
- [ ] Check cross-schema FKs work: `\d erp.execution_runs` (should show FK to agent.sessions if referenced)
- [ ] Check computed column: `\d erp.execution_runs` (should show variance_pct as GENERATED)
- [ ] Check triggers: `\d agent.events` (should show updated_at trigger)
- [ ] Test INSERT into erp.people (basic functionality test)
- [ ] Test INSERT into agent.sessions (basic functionality test)

### 2.5 Test PostgREST Locally (Optional)
- [ ] Start postgrest-erp container: `docker-compose up -d postgrest-erp`
- [ ] Test API endpoint: `curl http://localhost:3000/erp/people`
- [ ] Test API endpoint: `curl http://localhost:3000/agent/sessions`
- [ ] Verify JSON responses returned

### 2.6 Documentation of Local Test Results
- [ ] Document any issues found
- [ ] Document fixes applied
- [ ] Confirm all tests pass before proceeding to production

## Phase 3: Production Deployment

### 3.1 Pre-Deployment
- [ ] Copy postgres-erp directory to droplet: `scp -r /service-builds/postgres-erp droplet:/home/david/services/`
- [ ] SSH to droplet: `ssh droplet`
- [ ] Navigate to postgres-erp: `cd /home/david/services/postgres-erp`
- [ ] Verify .env file exists with POSTGRES_PASSWORD and POSTGREST_JWT_SECRET

### 3.2 Deploy postgres-erp Container
- [ ] Start postgres-erp: `docker-compose up -d postgres-erp`
- [ ] Verify container started: `docker ps | grep postgres-erp`
- [ ] Check logs for successful startup: `docker logs postgres-erp | tail -20`
- [ ] Verify portfolio-network created: `docker network ls | grep portfolio`

### 3.3 Execute Migrations
- [ ] Run migration 001: `docker exec -i postgres-erp psql -U erp_admin -d portfolio < migrations/001_erp_schema.sql`
- [ ] Check for errors in output
- [ ] Run migration 002: `docker exec -i postgres-erp psql -U erp_admin -d portfolio < migrations/002_agent_schema.sql`
- [ ] Check for errors in output

### 3.4 Validation
- [ ] Run validation script: `docker exec -i postgres-erp psql -U erp_admin -d portfolio < migrations/validate_schema.sql`
- [ ] Verify table counts: 14 erp + 21 agent = 35 total
- [ ] Verify FK constraints exist
- [ ] Test sample queries: `docker exec postgres-erp psql -U erp_admin -d portfolio -c "SELECT COUNT(*) FROM erp.people;"`
- [ ] Check Postgres logs: `docker logs postgres-erp | tail -100 | grep -i error`

### 3.5 Deploy PostgREST Container (Optional but Recommended)
- [ ] Start postgrest-erp: `docker-compose up -d postgrest-erp`
- [ ] Verify container started: `docker ps | grep postgrest-erp`
- [ ] Check logs: `docker logs postgrest-erp | tail -20`
- [ ] Test API locally on droplet: `curl http://localhost:3000/erp/people`

### 3.6 Configure Cloudflare Tunnel for PostgREST
- [ ] Update Cloudflare tunnel config to add ingress route:
  ```yaml
  - hostname: erp-db.bestviable.com
    service: http://traefik:80
  ```
- [ ] Restart cloudflared container if needed
- [ ] Test external access: `curl https://erp-db.bestviable.com/erp/people`
- [ ] Verify Traefik routing: `docker logs traefik | grep postgrest`

### 3.7 Post-Deployment Verification
- [ ] Verify postgres-erp healthy: `docker ps | grep postgres-erp`
- [ ] Verify postgrest-erp healthy: `docker ps | grep postgrest-erp`
- [ ] Test internal database access from portfolio-network
- [ ] Test external API access via Cloudflare
- [ ] Document deployment completion timestamp
- [ ] Mark deployment as successful

## Phase 4: Documentation for Service Developers

### 4.1 Update SERVICE_INVENTORY.md
- [ ] Update Postgres section with new schema information
- [ ] Document table counts: 14 erp + 21 agent = 35 total
- [ ] Document memory usage (should be similar, ~150MB for Postgres service)
- [ ] Update "Current Database State" section

### 4.2 Create Schema Documentation
- [ ] Create file: `/docs/system/architecture/DATABASE_SCHEMA.md`
- [ ] Document ERP schema purpose and tables
- [ ] Document Agent schema purpose and tables
- [ ] Provide example queries for common patterns:
  - [ ] Query projects for a person: `SELECT * FROM erp.projects WHERE owner_person_id = 1;`
  - [ ] Query agent sessions for a project: `SELECT * FROM agent.sessions WHERE subject_type = 'project' AND subject_id = 1;`
  - [ ] Query facts for a session: `SELECT * FROM agent.facts WHERE source_event_id IN (SELECT id FROM agent.events WHERE session_id = 1);`
- [ ] Document cross-schema FK relationships (erp.execution_runs → agent.sessions, etc.)
- [ ] Document global_id usage and patterns

### 4.3 Create Service Integration Guide
- [ ] Create file: `/docs/system/architecture/SERVICE_DATABASE_INTEGRATION.md`
- [ ] Document connection pattern (asyncpg with connection pooling)
- [ ] Document required environment variables (POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD)
- [ ] Document schema-qualified query requirements (MUST use `erp.` or `agent.` prefixes)
- [ ] Provide Python code examples for common operations:
  - [ ] Connecting to database with asyncpg
  - [ ] Inserting into erp.tasks
  - [ ] Querying agent.plans with joins
  - [ ] Creating agent.sessions with cross-schema FKs
- [ ] Document transaction patterns for cross-schema operations

### 4.4 Create Migration Reference
- [ ] Update `/service-builds/postgres/migrations/README.md`
- [ ] Document migration history:
  - [ ] 001-003: Legacy migrations (archived 2025-12-XX, never used in production)
  - [ ] 001_erp_schema.sql: ERP schema creation (deployed 2025-12-XX)
  - [ ] 002_agent_schema.sql: Agent schema creation (deployed 2025-12-XX)
- [ ] Document how to run migrations (for future reference)
- [ ] Document validation procedures

## Phase 5: Cleanup and Finalization

### 5.1 Confirm Legacy Archive
- [ ] Verify legacy migrations moved to deprecated/ directory
- [ ] Verify README.md in deprecated/ explains why archived
- [ ] Verify new migrations (001-002) are the active migrations

### 5.2 Final Validation
- [ ] Confirm Postgres service healthy: `docker ps | grep postgres`
- [ ] Confirm no errors in Postgres logs: `docker logs postgres | grep -i error | tail -20`
- [ ] Confirm database size reasonable: `docker exec postgres psql -U n8n -d n8n -c "SELECT pg_size_pretty(pg_database_size('n8n'));"`
- [ ] Confirm schemas exist: `docker exec postgres psql -U n8n -d n8n -c "\dn"`

### 5.3 Mark Change Complete
- [ ] Update OpenSpec change status (if using openspec tooling)
- [ ] Document lessons learned (if any)
- [ ] Archive change proposal (if appropriate)
- [ ] Notify stakeholders that schema is ready for service development
