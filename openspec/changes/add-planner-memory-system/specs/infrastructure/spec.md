# Infrastructure Specification Delta

## ADDED Requirements

### Requirement: Valkey Cache Service
The system SHALL deploy Valkey 8.1 (Redis fork) as a short-term memory cache with 200MB memory limit, AOF persistence, and LRU eviction policy.

#### Scenario: Valkey deployment with memory limits
- **WHEN** Valkey is deployed via Docker Compose
- **THEN** the service SHALL be configured with `--maxmemory 200mb` flag
- **AND** use `--maxmemory-policy allkeys-lru` for eviction
- **AND** enable AOF persistence with `--appendonly yes --appendfsync everysec`
- **AND** bind to port 6379 (localhost only for security)
- **AND** join `docker_syncbricks` network (internal only, not exposed externally)

#### Scenario: Valkey health check
- **WHEN** checking Valkey health
- **THEN** the command `docker exec valkey redis-cli ping` SHALL return "PONG"
- **AND** the service SHALL respond within 100ms

#### Scenario: Valkey memory eviction
- **WHEN** Valkey reaches 200MB memory usage
- **THEN** the system SHALL evict least recently used keys
- **AND** prioritize keeping frequently accessed cache entries
- **AND** log eviction events for monitoring

---

### Requirement: Postgres Schema Extension
The system SHALL extend the existing Postgres database with 7 new tables to support events logging, planning, scheduling, execution tracking, graph storage, and prompt management.

#### Scenario: Events table creation
- **WHEN** the migration `002_planner_memory_schema.sql` is executed
- **THEN** the `events` table SHALL be created with columns: `id SERIAL PRIMARY KEY, event_type VARCHAR(100), event_source VARCHAR(50), client_id INTEGER, payload JSONB, metadata JSONB, created_at TIMESTAMP`
- **AND** indexes SHALL be created on `(event_type)`, `(event_source)`, `(created_at DESC)`
- **AND** foreign key constraint on `client_id` referencing existing `client_profiles` table

#### Scenario: Plans table creation
- **WHEN** the migration is executed
- **THEN** the `plans` table SHALL be created with columns: `id SERIAL PRIMARY KEY, plan_title VARCHAR(500), intent TEXT, sop JSONB, client_id INTEGER, status VARCHAR(20) DEFAULT 'draft', metadata JSONB, created_at TIMESTAMP, updated_at TIMESTAMP`
- **AND** status SHALL be constrained to `('draft', 'scheduled', 'active', 'completed')`
- **AND** indexes SHALL be created on `(client_id)`, `(status)`

#### Scenario: Graph tables creation
- **WHEN** the migration is executed
- **THEN** `graph_nodes` table SHALL be created with columns: `id SERIAL PRIMARY KEY, node_type VARCHAR(50), node_id VARCHAR(255) UNIQUE, properties JSONB, created_at TIMESTAMP, updated_at TIMESTAMP`
- **AND** `graph_edges` table SHALL be created with columns: `id SERIAL PRIMARY KEY, from_node_id VARCHAR(255) REFERENCES graph_nodes(node_id), to_node_id VARCHAR(255) REFERENCES graph_nodes(node_id), edge_type VARCHAR(50), properties JSONB, created_at TIMESTAMP`
- **AND** a unique constraint on `(from_node_id, to_node_id, edge_type)` to prevent duplicate edges

#### Scenario: Prompt templates seeded
- **WHEN** the migration is executed
- **THEN** the `prompt_templates` table SHALL be seeded with 5 default templates:
  - `sop_generator` (type: 'system') - for planning SOPs
  - `sop_generator_manifold` (type: 'system') - for complex planning using Manifold Navigator v1.3
  - `schedule_optimizer` (type: 'system') - for scheduling optimization
  - `daily_reflection` (type: 'system') - for daily reflections
  - `weekly_review` (type: 'system') - for weekly sprint reviews
- **AND** each template SHALL have version 'v1' initially
- **AND** `sop_generator_manifold` template SHALL include configuration metadata: `{analysis_scope: "full", gentleness: "balanced", math_depth: "operational", position_awareness: true, option_count: 3}`

#### Scenario: Helper function for graph traversal
- **WHEN** the migration is executed
- **THEN** a Postgres function `get_graph_neighbors(VARCHAR)` SHALL be created
- **AND** it SHALL return all neighboring nodes (both incoming and outgoing edges)
- **AND** return format: `TABLE(neighbor_id VARCHAR, edge_type VARCHAR, direction VARCHAR)`

#### Scenario: Execution runs table creation
- **WHEN** the migration is executed
- **THEN** the `execution_runs` table SHALL be created with columns: `id SERIAL PRIMARY KEY, run_id VARCHAR(100) UNIQUE, run_type VARCHAR(20), workflow_id VARCHAR(255), process_template_id VARCHAR(255), task_id VARCHAR(255), project_id VARCHAR(255), engagement_id VARCHAR(255), executed_by_person_id VARCHAR(255), started_at TIMESTAMP, ended_at TIMESTAMP, actual_hours DECIMAL(5,2), outcome_notes TEXT, metadata JSONB, created_at TIMESTAMP`
- **AND** run_type SHALL be constrained to `('Process', 'Touchpoint')`
- **AND** indexes SHALL be created on `(task_id)`, `(project_id)`, `(process_template_id)`, `(run_type)`, `(started_at DESC)`
- **AND** support foreign key references to Coda tables via string IDs (e.g., task_id = "coda:task-123")

#### Scenario: Execution runs enable pattern learning
- **WHEN** execution_runs records accumulate
- **THEN** the system SHALL support queries like "average actual_hours for process_template_id X"
- **AND** enable variance analysis: actual_hours vs estimated_hours from tasks
- **AND** feed Observer Agent for pattern performance analysis

---

### Requirement: Qdrant Vector Collections
The system SHALL create 4 Qdrant collections for storing vector embeddings with size 1536 (OpenAI ada-002 compatible) and cosine distance.

#### Scenario: Doc chunks collection creation
- **WHEN** the `setup_collections.py` script is executed
- **THEN** a collection named `doc_chunks` SHALL be created in Qdrant
- **AND** configured with vector size 1536, distance metric COSINE
- **AND** `on_disk_payload: true` for storage efficiency

#### Scenario: Events collection creation
- **WHEN** the script is executed
- **THEN** a collection named `events` SHALL be created
- **AND** configured with vector size 1536, distance metric COSINE
- **AND** payload schema SHALL support `{event_id INTEGER, event_type TEXT, client_id INTEGER, created_at TIMESTAMP}`

#### Scenario: Agent memories collection creation
- **WHEN** the script is executed
- **THEN** a collection named `agent_memories` SHALL be created
- **AND** configured for mem0 integration
- **AND** payload schema SHALL support `{memory_id TEXT, client_id INTEGER, memory_type TEXT, extracted_at TIMESTAMP}`

#### Scenario: Daily threads collection creation
- **WHEN** the script is executed
- **THEN** a collection named `daily_threads` SHALL be created
- **AND** configured for reflection storage
- **AND** payload schema SHALL support `{reflection_id INTEGER, reflection_date DATE, client_id INTEGER}`

#### Scenario: Collection validation
- **WHEN** all collections are created
- **THEN** querying `http://localhost:6333/collections` SHALL return all 4 collection names: `["doc_chunks", "events", "agent_memories", "daily_threads"]`

---

### Requirement: N8N Workflow Integration
The system SHALL deploy 5 n8n workflows for orchestrating Coda-Calendar sync, event logging, and Observer Agent triggers.

#### Scenario: Coda-to-Calendar sync workflow
- **WHEN** the workflow "coda-to-calendar-sync" is created in n8n
- **THEN** it SHALL expose a webhook at `/webhook/coda/task-created`
- **AND** on trigger, extract task data, call Planner Engine, call Scheduler Engine, log event to Postgres
- **AND** be activated for production use

#### Scenario: Calendar-to-Coda sync workflow
- **WHEN** the workflow "calendar-to-coda-sync" is created
- **THEN** it SHALL expose a webhook at `/webhook/gcal/event-updated`
- **AND** on trigger, extract event data, call Coda MCP to update task status
- **AND** be activated

#### Scenario: Event logger workflow
- **WHEN** the workflow "event-logger" is created
- **THEN** it SHALL expose a webhook at `/webhook/events/log`
- **AND** on trigger, validate payload, insert into Postgres `events` table
- **AND** be activated

#### Scenario: Daily Observer trigger workflow
- **WHEN** the workflow "daily-observer-trigger" is created
- **THEN** it SHALL be configured with cron schedule `0 18 * * *` (6 PM daily)
- **AND** on trigger, call Observer Agent `/api/v1/observer/reflect?mode=daily`
- **AND** log execution result to Postgres
- **AND** be activated

#### Scenario: Weekly Observer trigger workflow
- **WHEN** the workflow "weekly-observer-trigger" is created
- **THEN** it SHALL be configured with cron schedule `0 18 * * 5` (6 PM Friday)
- **AND** on trigger, call Observer Agent `/api/v1/observer/reflect?mode=weekly`
- **AND** log execution result to Postgres
- **AND** be activated

#### Scenario: Workflow error handling
- **WHEN** any workflow encounters an error (HTTP 500, timeout, etc.)
- **THEN** the workflow SHALL retry 3 times with exponential backoff (2s, 4s, 8s)
- **AND** if all retries fail, send error notification to Slack webhook
- **AND** log the failure in n8n execution history

---

### Requirement: Docker Networking
The system SHALL configure all new services with proper network isolation, using `docker_proxy` for external services and `docker_syncbricks` for internal communication.

#### Scenario: External service network configuration
- **WHEN** deploying Memory Gateway, Planner Engine, Scheduler Engine
- **THEN** each service SHALL join both `docker_proxy` (for Traefik reverse proxy) and `docker_syncbricks` (for database access)
- **AND** expose ports only within networks, not on host

#### Scenario: Internal service network configuration
- **WHEN** deploying Valkey and Observer Agent
- **THEN** these services SHALL join only `docker_syncbricks` network (internal only)
- **AND** not be accessible from the external `docker_proxy` network
- **AND** not have Traefik labels (no public domain)

#### Scenario: Network isolation validation
- **WHEN** networks are configured
- **THEN** external clients SHALL NOT be able to directly access Valkey on port 6379
- **AND** external clients SHALL NOT be able to directly access Postgres on port 5432
- **AND** external clients SHALL only access public services through Traefik (memory.bestviable.com, planner.bestviable.com, scheduler.bestviable.com)

---

### Requirement: Traefik Routing Configuration
The system SHALL configure Traefik routing for new public services using Docker labels and Cloudflare Tunnel integration.

#### Scenario: Memory Gateway Traefik routing
- **WHEN** Memory Gateway is deployed
- **THEN** the service SHALL have Traefik labels:
  - `traefik.enable=true`
  - `traefik.http.routers.memory-gateway.rule=Host(\`memory.bestviable.com\`)`
  - `traefik.http.routers.memory-gateway.entrypoints=web`
  - `traefik.http.services.memory-gateway.loadbalancer.server.port=8090`
- **AND** Cloudflare Tunnel SHALL route `memory.bestviable.com` to `http://traefik:80`

#### Scenario: Planner Engine Traefik routing
- **WHEN** Planner Engine is deployed
- **THEN** the service SHALL have Traefik labels for `planner.bestviable.com`
- **AND** route to internal port 8091
- **AND** be accessible via HTTPS through Cloudflare Tunnel (SSL terminated by Cloudflare)

#### Scenario: Scheduler Engine Traefik routing
- **WHEN** Scheduler Engine is deployed
- **THEN** the service SHALL have Traefik labels for `scheduler.bestviable.com`
- **AND** route to internal port 8092
- **AND** handle OAuth callback redirect at `https://scheduler.bestviable.com/oauth/callback`

---

### Requirement: Health Check Configuration
The system SHALL configure Docker health checks for all services to enable automatic failure detection and restart.

#### Scenario: Memory Gateway health check
- **WHEN** Memory Gateway is deployed
- **THEN** the Docker Compose configuration SHALL include health check:
  - `test: ["CMD", "curl", "-f", "http://localhost:8090/health"]`
  - `interval: 30s`
  - `timeout: 10s`
  - `retries: 3`
- **AND** if health check fails 3 times, Docker SHALL mark the container as unhealthy
- **AND** restart policy `unless-stopped` SHALL restart the container

#### Scenario: Valkey health check
- **WHEN** Valkey is deployed
- **THEN** the health check SHALL use: `test: ["CMD", "redis-cli", "ping"]`
- **AND** interval: 10s, timeout: 5s, retries: 3

---

### Requirement: Resource Limits
The system SHALL enforce memory and CPU limits on all services to prevent resource exhaustion.

#### Scenario: Service memory limits
- **WHEN** services are deployed
- **THEN** each service SHALL have Docker memory limits:
  - Valkey: 200m
  - Memory Gateway: 200m
  - Planner Engine: 200m
  - Scheduler Engine: 200m
  - Observer Agent: 150m
- **AND** if a service exceeds its memory limit, Docker SHALL kill and restart it

#### Scenario: Service CPU limits
- **WHEN** services are deployed
- **THEN** each service SHALL have CPU limits:
  - Valkey: 0.5 CPUs
  - Memory Gateway: 0.5 CPUs
  - Planner/Scheduler/Observer: 0.5 CPUs each
- **AND** ensure fair CPU sharing across services

---

### Requirement: Logging Configuration
The system SHALL configure Docker logging with rotation to prevent disk exhaustion from log files.

#### Scenario: Service logging configuration
- **WHEN** any service is deployed
- **THEN** the Docker Compose configuration SHALL include:
  - `driver: "json-file"`
  - `options: {max-size: "10m", max-file: "3"}`
- **AND** limit total log storage to 30MB per service (10MB × 3 files)
- **AND** rotate logs when file reaches 10MB

---

### Requirement: Archon Deprecation
The system SHALL deprecate the Archon stack (archon-server, archon-ui, archon-mcp) by stopping containers, archiving configurations, and freeing resources.

#### Scenario: Archon containers stopped
- **WHEN** Archon deprecation is executed
- **THEN** all Archon containers SHALL be stopped: `docker-compose down`
- **AND** configurations SHALL be archived to `/home/david/services/archive/archon-YYYYMMDD.yml`
- **AND** containers SHALL be removed (not just stopped)

#### Scenario: Archon resources freed
- **WHEN** Archon containers are removed
- **THEN** ~809MB RAM SHALL be freed
- **AND** verified with `free -h` showing increased available memory
- **AND** Docker stats SHALL no longer show archon-server, archon-ui, archon-mcp

#### Scenario: Archon marked deprecated in documentation
- **WHEN** Archon is removed
- **THEN** SERVICE_INVENTORY.md SHALL be updated with status: "DEPRECATED (2025-12-01)"
- **AND** reason: "Replaced by Planner & Memory Architecture system"
- **AND** archive location documented for reference
