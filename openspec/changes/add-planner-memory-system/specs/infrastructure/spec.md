# Spec: Infrastructure for Planner & Memory System

**Capability ID**: `infrastructure/planner-memory`
**Status**: NEW
**Change ID**: `add-planner-memory-system`

## Overview

Infrastructure extensions to support the Planner & Memory system:
- Postgres schema extensions (11 new tables)
- Zep Cloud integration (managed long-term memory)
- Valkey cache service
- ToolJet Cloud for admin UI
- Google Calendar OAuth integration

---

## NEW Requirements

### Requirement: Postgres Schema - Facts and Temporal Validity

The system SHALL implement a Facts table with bi-temporal validity pattern for tracking entity statements over time.

#### Scenario: Create a fact with validity window
- **WHEN** INSERT INTO facts (subject_type, subject_id, fact_type, content, valid_from, valid_to)
- **THEN** fact created with valid_from = NOW(), valid_to = NULL
- **AND** represents "this fact is currently true"
- **AND** can be queried: SELECT * FROM facts WHERE valid_to IS NULL

#### Scenario: Update fact (close old, insert new)
- **WHEN** calling update_fact_temporal(subject_type, subject_id, fact_type, new_content)
- **THEN** UPDATE existing fact where valid_to IS NULL: set valid_to = NOW()
- **AND** INSERT new fact with valid_from = NOW(), valid_to = NULL
- **AND** maintains full audit trail: both old and new facts in database
- **AND** query result: SELECT ... WHERE subject_id='1' AND fact_type='preference' ORDER BY valid_from DESC

#### Scenario: Fact expiration
- **WHEN** valid_to < NOW()
- **THEN** fact is considered expired/historical
- **AND** default queries exclude: WHERE valid_to IS NULL OR valid_to > NOW()
- **AND** historical facts remain queryable for audit/analysis

### Requirement: Postgres Schema - Pattern Ontology

The system SHALL implement Pattern Ontology tables as Postgres tables (replacing Coda):
- service_blueprints (service offerings)
- workflows (reusable workflow definitions)
- process_templates (workflow instances for specific engagements)
- execution_runs (actual execution telemetry)

#### Scenario: Pattern Ontology hierarchy
- **WHEN** Planner needs to find workflows for "client onboarding"
- **THEN** queries: SELECT * FROM workflows WHERE capability='delivery'
- **AND** retrieves available workflows
- **AND** can create process_template by linking workflow_id + engagement_id
- **AND** execution_runs track actual hours vs estimated for learning

#### Scenario: Variance tracking in execution_runs
- **WHEN** execution_run completed with actual_hours=3.5, estimated_hours=2.6
- **THEN** variance_pct GENERATED ALWAYS AS: ((3.5-2.6)/2.6)*100 = 34.6%
- **AND** Observer can query: SELECT * FROM execution_runs WHERE status='completed' ORDER BY variance_pct DESC
- **AND** identifies high-variance templates for estimation improvement

### Requirement: Events Table Extensions for Zep Integration

The system SHALL extend events table with Zep Cloud fields for hybrid memory.

#### Scenario: Event with Zep session linkage
- **WHEN** INSERT INTO events (content, client_id, zep_session_id, memory_scope, salience_score)
- **THEN** zep_session_id format: "client_1"
- **AND** memory_scope: 'run' | 'session' | 'user' | 'project' | 'global'
- **AND** salience_score: 0.0-1.0 (determines fact extraction threshold)
- **AND** expires_at: NULL (no expiration) or TIMESTAMP (auto-expire run/session scope)

#### Scenario: High-salience event promotion to facts
- **WHEN** salience_score >= 0.7
- **THEN** event eligible for fact extraction
- **AND** async task calls: fact_extractor.extract_facts_from_event(event_id)
- **AND** LLM extracts durable facts
- **AND** promoted_to_fact_id = facts.id (links event to resulting fact)

### Requirement: Zep Cloud Integration (Managed Service)

The system SHALL use Zep Cloud free tier for long-term memory and semantic search.

#### Scenario: Zep Cloud account and API key
- **WHEN** Zep Cloud free account created at https://www.getzep.com/
- **THEN** API key retrieved from dashboard
- **AND** stored in .env: ZEP_API_KEY=z_xxx...
- **AND** used by Memory Gateway zep.py service module
- **AND** free tier: 10,000 API calls/month (sufficient for single user)

#### Scenario: Zep sessions for semantic search
- **WHEN** Memory Gateway adds message to Zep: add_memory(session_id="client_1", content="...")
- **THEN** Zep Cloud stores message in session
- **AND** message indexed for semantic search
- **AND** later: search_memories(session_id="client_1", query="...") returns similar messages
- **AND** search returns top 10 results with similarity scores

#### Scenario: Zep graph for facts
- **WHEN** Memory Gateway creates fact: create_fact(entity_type="workflow", entity_id="client_onboarding", content="...")
- **THEN** Zep Cloud stores fact in knowledge graph
- **AND** fact linked to entity node
- **AND** enables entity-focused retrieval: "all facts about client_onboarding workflow"

### Requirement: Valkey Cache Service

The system SHALL use Valkey for session/run scope caching with <24h TTL.

#### Scenario: Valkey deployment
- **WHEN** Valkey service deployed in docker-compose
- **THEN** listens on port 6379 (Redis-compatible)
- **AND** allocated 50MB RAM (lightweight)
- **AND** no persistence needed (cache layer, not data store)
- **AND** runs on docker_syncbricks network (internal access only)

#### Scenario: Cache keys and TTL
- **WHEN** Memory Gateway stores result in Valkey
- **THEN** key format: "recall:{client_id}:{query_hash}"
- **AND** TTL: 3600 seconds (1h for recall results), 86400 (24h for events)
- **AND** auto-expires: Valkey removes expired keys
- **AND** reduces load on Postgres and Zep Cloud

### Requirement: Google Calendar OAuth Integration

The system SHALL implement OAuth 2.0 with Google Calendar for scheduling.

#### Scenario: OAuth credential storage
- **WHEN** user completes OAuth flow via /oauth/authorize → /oauth/callback
- **THEN** access token + refresh token stored in /app/credentials/gcal.json
- **AND** stored in docker volume mount (persisted across restarts)
- **AND** Planner API reads credentials on startup

#### Scenario: Calendar event creation
- **WHEN** Scheduler module calls gcal.create_event()
- **THEN** uses stored credentials to authenticate to Google Calendar API
- **AND** creates event with title, start_time, end_time, description
- **AND** timeZone: "America/Los_Angeles"
- **AND** returns event_id for tracking

### Requirement: ToolJet Cloud Integration

The system SHALL use ToolJet Cloud (managed) for admin UI without self-hosting.

#### Scenario: ToolJet Cloud workspace setup
- **WHEN** ToolJet Cloud account created and workspace configured
- **THEN** connects to Postgres via Cloudflare Tunnel endpoint (db.bestviable.com)
- **AND** SSL required for all connections
- **AND** zero self-hosted infrastructure needed
- **AND** runs on free tier (sufficient for single user admin tasks)

#### Scenario: Admin apps for ERP operations
- **WHEN** Tasks Manager app displays tasks from Postgres tasks table
- **THEN** provides CRUD interface: Create, View, Edit, Delete
- **AND** Plans Browser shows plans with SOP previews
- **AND** Sprint Capacity dashboard displays current week billing percentage

---

## Deployment Checklist

### Phase 1: Database Migration
- [ ] Create migration 003_facts_temporal.sql with 11 new tables
- [ ] Apply migration to Postgres
- [ ] Verify all tables and indexes created
- [ ] Verify extended columns added to events and plans tables

### Phase 2: Zep Cloud Setup
- [ ] Create Zep Cloud free account
- [ ] Generate API key
- [ ] Add to .env: ZEP_API_KEY
- [ ] Test connection: zep-cloud==2.1.0 SDK

### Phase 3: Valkey Service
- [ ] Update docker-compose to include valkey:8.1
- [ ] Expose on 6379 (internal network)
- [ ] Allocate 50MB memory limit
- [ ] Test connectivity from other services

### Phase 4: Google Calendar OAuth
- [ ] Create Google Cloud project
- [ ] Enable Calendar API
- [ ] Create OAuth 2.0 Web Application credentials
- [ ] Add redirect URI: https://planner.bestviable.com/oauth/callback
- [ ] Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env
- [ ] Test OAuth flow: visit /oauth/authorize

### Phase 5: ToolJet Cloud
- [ ] Create ToolJet Cloud account
- [ ] Create workspace "BestViable ERP Admin"
- [ ] Connect Postgres data source via Cloudflare Tunnel
- [ ] Create Tasks Manager, Plans Browser, Sprint Capacity apps
- [ ] Publish and test

### Phase 6: Traefik Routing
- [ ] Add routes for: memory.bestviable.com, planner.bestviable.com
- [ ] Update Traefik labels on Memory Gateway and Planner API containers
- [ ] Test: curl https://memory.bestviable.com/health, https://planner.bestviable.com/health

---

## Success Criteria

- All 11 Postgres tables exist with correct schema and indexes
- Zep Cloud account created and API key working (test 10 API calls)
- Valkey running and accessible from Memory Gateway/Planner API
- Google Calendar OAuth flow completes successfully
- ToolJet Cloud apps published and accessible
- All services respond to health checks within 1s
- Traefik routes all domains correctly
