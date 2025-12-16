# Infrastructure Specification - Dual-Schema Database

## ADDED Requirements

### Requirement: Dual-Schema Database Architecture

The system SHALL organize Postgres database into two schemas: `erp` for business entities and `agent` for agent execution state.

#### Scenario: Schema separation
- **WHEN** querying business data (people, projects, tasks)
- **THEN** tables exist in `erp` schema with fully qualified names (e.g., `erp.projects`)

#### Scenario: Agent data isolation
- **WHEN** querying agent execution data (sessions, events, facts)
- **THEN** tables exist in `agent` schema with fully qualified names (e.g., `agent.sessions`)

#### Scenario: Cross-schema relationships
- **WHEN** execution run references a session
- **THEN** foreign key `erp.execution_runs.session_id REFERENCES agent.sessions(id)` enforces referential integrity

### Requirement: ERP Schema Tables

The `erp` schema SHALL contain 14 tables organized into core business entities and pattern/workflow tables.

#### Scenario: Core business entities exist
- **WHEN** querying core business data
- **THEN** the following tables exist: `erp.people`, `erp.organizations`, `erp.projects`, `erp.engagements`, `erp.tasks`, `erp.okrs`

#### Scenario: Pattern and workflow tables exist
- **WHEN** querying service patterns and workflows
- **THEN** the following tables exist: `erp.service_blueprints`, `erp.workflows`, `erp.process_templates`, `erp.execution_runs`, `erp.ventures`, `erp.sprints`, `erp.offers`, `erp.deliverables`

#### Scenario: Global IDs for cross-system references
- **WHEN** creating new ERP entity (project, task, OKR)
- **THEN** table includes `global_id TEXT UNIQUE` column for human-readable cross-system identifiers

### Requirement: Agent Schema Tables

The `agent` schema SHALL contain 21 tables organized into memory, operations, configuration, graph/blocks, and planning categories.

#### Scenario: Memory tables exist
- **WHEN** querying memory control plane
- **THEN** the following tables exist: `agent.client_profiles`, `agent.memory_entries`, `agent.memory_facts`, `agent.working_state`, `agent.episodes`, `agent.webhook_executions`

#### Scenario: Agent operations tables exist
- **WHEN** querying agent execution state
- **THEN** the following tables exist: `agent.sessions`, `agent.events`, `agent.facts`, `agent.goals`, `agent.reflections`, `agent.step_evaluations`, `agent.artifacts`

#### Scenario: Agent configuration tables exist
- **WHEN** querying agent profiles and tools
- **THEN** the following tables exist: `agent.profiles`, `agent.tools`, `agent.context_recipes`, `agent.profile_tools`

#### Scenario: Graph and block tables exist
- **WHEN** querying semantic blocks and knowledge graph
- **THEN** the following tables exist: `agent.graph_nodes`, `agent.graph_edges`, `agent.blocks`, `agent.block_actions`

#### Scenario: Planning tables exist
- **WHEN** querying planning and scheduling data
- **THEN** the following tables exist: `agent.plans`, `agent.scheduler_runs`, `agent.prompt_templates`

### Requirement: Table Merging Strategy

The system SHALL merge conflicting table definitions from multiple migrations by extending tables with additional columns.

#### Scenario: Events table merged
- **WHEN** events table moved from public to agent schema
- **THEN** table includes columns from all sources:
  - Original 002 columns: `event_type`, `event_source`, `client_id`, `payload`, `metadata`
  - Extension 003 columns: `zep_session_id`
  - Starter schema columns: `session_id`, `subject_type`, `subject_id`, `message`, `memory_scope`, `salience_score`, `promoted_to_fact_id`

#### Scenario: Facts table merged
- **WHEN** facts table moved from public to agent schema
- **THEN** table includes columns from all sources:
  - Original 003 columns: `content`, `valid_from`, `valid_to`, `ttl`, `zep_fact_id`
  - Starter schema columns: `global_id`, `subject_type`, `subject_id`, `fact_type`, `category`, `salience_score`, `source_event_id`, `source_ref`

#### Scenario: Execution runs table merged
- **WHEN** execution_runs table moved from public to agent schema
- **THEN** table includes columns from all sources:
  - Original 003 columns: `process_template_id`, `run_identifier`, `started_at`, `ended_at`, `estimated_hours`, `actual_hours`, `variance_pct` (GENERATED)
  - Starter schema columns: `global_id`, `session_id`, `process_name`, `subject_type`, `subject_id`, `status`, `outcome_status`, `outcome_score`, `human_minutes`, `llm_cost`, `telemetry`

### Requirement: Migration File Organization

The system SHALL implement schema changes through 5 sequential migration files.

#### Scenario: Schema creation migration
- **WHEN** executing migration 004
- **THEN** `erp` and `agent` schemas created with `CREATE SCHEMA IF NOT EXISTS`

#### Scenario: ERP tables migration
- **WHEN** executing migration 005
- **THEN** all 14 ERP tables created in `erp` schema with indexes and constraints

#### Scenario: Agent new tables migration
- **WHEN** executing migration 006
- **THEN** 11 new agent tables created (sessions, profiles, tools, blocks, etc.) in `agent` schema

#### Scenario: Existing tables migration
- **WHEN** executing migration 007
- **THEN** 17 existing tables moved from public to agent/erp schemas with ALTER TABLE SET SCHEMA
- **AND** conflicting tables extended with additional columns via ALTER TABLE ADD COLUMN

#### Scenario: Compatibility views migration
- **WHEN** executing migration 008
- **THEN** views created in public schema pointing to agent/erp tables for zero-downtime service migration

### Requirement: Data Preservation

The system SHALL preserve all existing data during schema reorganization with zero data loss.

#### Scenario: ALTER TABLE instead of DROP/CREATE
- **WHEN** moving existing table to new schema
- **THEN** migration uses `ALTER TABLE [table] SET SCHEMA [schema]` command (not DROP + CREATE)
- **AND** all data, indexes, and constraints preserved

#### Scenario: Additive column changes
- **WHEN** merging conflicting table definitions
- **THEN** migration uses `ALTER TABLE ADD COLUMN IF NOT EXISTS` with nullable columns
- **AND** no UPDATE statements required (columns default to NULL for existing rows)

#### Scenario: Mandatory backup before migration
- **WHEN** executing production migration
- **THEN** pg_dump backup created before any schema changes
- **AND** CSV exports created for critical tables (events, facts, execution_runs)

### Requirement: Service Compatibility

The system SHALL maintain service compatibility during migration via compatibility views.

#### Scenario: Compatibility views for moved tables
- **WHEN** table moved from public to agent schema
- **THEN** view created in public schema: `CREATE VIEW public.[table] AS SELECT * FROM agent.[table];`
- **AND** existing service queries continue working without code changes

#### Scenario: Service query updates
- **WHEN** services updated to use schema-qualified names
- **THEN** planner-api queries use `agent.` prefix (4 queries in postgres.py)
- **AND** memory-gateway queries use `agent.` prefix (2 queries in postgres.py)

#### Scenario: Gradual service migration
- **WHEN** database migration complete with compatibility views
- **THEN** services can be updated independently after validating migration success
- **AND** compatibility views removed in future migration after all services updated

### Requirement: Validation and Rollback

The system SHALL provide validation scripts and rollback procedures for safe migration.

#### Scenario: Table count validation
- **WHEN** migration completes
- **THEN** validation script confirms 14 tables in `erp` schema
- **AND** validation script confirms 21 tables in `agent` schema
- **AND** total 35 tables across both schemas

#### Scenario: Data integrity validation
- **WHEN** migration completes
- **THEN** validation script confirms row counts match pre-migration counts for all moved tables
- **AND** foreign key constraints validated (no orphaned records)

#### Scenario: Rollback on failure
- **WHEN** migration fails at any step
- **THEN** rollback script drops `erp` and `agent` schemas with CASCADE
- **AND** pg_restore executed to restore from backup
- **AND** database returns to pre-migration state

### Requirement: Index Preservation

The system SHALL preserve all indexes from existing migrations and add indexes for new columns.

#### Scenario: Original indexes preserved
- **WHEN** table moved to new schema
- **THEN** all indexes from original table preserved
- **AND** index performance characteristics unchanged

#### Scenario: Indexes for merged columns
- **WHEN** new columns added to merged tables
- **THEN** indexes created on commonly queried columns:
  - `agent.events`: indexes on `memory_scope`, `salience_score`, `zep_session_id`
  - `agent.facts`: indexes on `fact_type`, `subject_type/subject_id`, `salience_score`, `global_id`
  - `agent.execution_runs`: indexes on `session_id`, `global_id`

#### Scenario: Partial indexes for filtered queries
- **WHEN** creating indexes on nullable columns with common filters
- **THEN** partial indexes used: `CREATE INDEX ... WHERE [condition]`
- **EXAMPLE**: `CREATE INDEX idx_facts_salience ON agent.facts(salience_score DESC) WHERE valid_to IS NULL;`
