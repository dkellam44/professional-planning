# Implementation Tasks

## 1. Infrastructure Preparation

### 1.1 Archon Stack Deprecation
- [ ] 1.1.1 SSH to droplet, verify Archon containers running
- [ ] 1.1.2 Archive Archon docker-compose configuration
- [ ] 1.1.3 Stop and remove Archon containers (archon-server, archon-ui, archon-mcp)
- [ ] 1.1.4 Verify RAM freed (~809MB)
- [ ] 1.1.5 Update SERVICE_INVENTORY.md to mark Archon as deprecated

### 1.2 Valkey Deployment
- [ ] 1.2.1 Create `/home/david/services/valkey/docker-compose.yml`
- [ ] 1.2.2 Configure Valkey with 200MB memory limit, AOF persistence, LRU eviction
- [ ] 1.2.3 Add to `docker_syncbricks` network (internal only)
- [ ] 1.2.4 Deploy Valkey: `docker-compose up -d`
- [ ] 1.2.5 Validate: `docker exec valkey redis-cli ping` → PONG
- [ ] 1.2.6 Validate: `docker stats valkey` → memory <200MB

### 1.3 Postgres Schema Extension
- [ ] 1.3.1 Create migration file `002_planner_memory_schema.sql`
- [ ] 1.3.2 Define `events` table (id, event_type, event_source, client_id, payload JSONB, metadata JSONB, created_at)
- [ ] 1.3.3 Define `plans` table (id, plan_title, intent, sop JSONB, client_id, status, metadata JSONB, created_at, updated_at)
- [ ] 1.3.4 Define `scheduler_runs` table (id, plan_id FK, schedule_blocks JSONB, client_id, status, metadata JSONB, created_at)
- [ ] 1.3.5 Define `graph_nodes` table (id, node_type, node_id unique, properties JSONB, created_at, updated_at)
- [ ] 1.3.6 Define `graph_edges` table (id, from_node_id FK, to_node_id FK, edge_type, properties JSONB, created_at)
- [ ] 1.3.7 Define `prompt_templates` table (id, template_name unique, template_type, content TEXT, version, created_at)
- [ ] 1.3.8 Add indexes (events: type, source, created_at; plans: client_id, status; graph: node_id, edge types)
- [ ] 1.3.9 Add helper function `get_graph_neighbors(node_id)` (returns neighbors + edge types)
- [ ] 1.3.10 Seed prompt_templates (sop_generator, schedule_optimizer, daily_reflection, weekly_review)
- [ ] 1.3.11 Execute migration: `docker exec -i postgres psql -U n8n -d n8ndb < migration.sql`
- [ ] 1.3.12 Validate: 6 new tables exist, indexes created, prompt templates seeded
- [ ] 1.3.13 Verify execution_runs table structure
  - Query: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='execution_runs'`
  - Validate indexes exist: task_id, project_id, process_template_id, run_type
  - Test insert: Create sample execution_run record
  - Validate: Query by task_id returns inserted record

### 1.4 Qdrant Collections Setup
- [ ] 1.4.1 Create `setup_collections.py` script
- [ ] 1.4.2 Define `doc_chunks` collection (vector size: 1536, distance: COSINE)
- [ ] 1.4.3 Define `events` collection (vector size: 1536, distance: COSINE)
- [ ] 1.4.4 Define `agent_memories` collection (vector size: 1536, distance: COSINE)
- [ ] 1.4.5 Define `daily_threads` collection (vector size: 1536, distance: COSINE)
- [ ] 1.4.6 Execute script via Docker Python container
- [ ] 1.4.7 Validate: `curl http://localhost:6333/collections` → 4 collections listed

---

## 2. Memory Gateway Service

### 2.1 Project Setup
- [ ] 2.1.1 Create directory structure `/home/david/services/memory-gateway/app/`
- [ ] 2.1.2 Create `Dockerfile` (Python 3.11-slim, uvicorn, health check)
- [ ] 2.1.3 Create `docker-compose.yml` (networks: docker_proxy + docker_syncbricks, Traefik labels)
- [ ] 2.1.4 Create `requirements.txt` (fastapi, uvicorn, psycopg2, qdrant-client, redis, openai, langfuse, httpx)
- [ ] 2.1.5 Create `.env.example` (OPENROUTER_API_KEY, POSTGRES_PASSWORD, MEM0_API_KEY, LANGFUSE keys)

### 2.2 Core Application
- [ ] 2.2.1 Create `app/main.py` (FastAPI app, CORS, Langfuse middleware, startup/shutdown events)
- [ ] 2.2.2 Create `app/config.py` (Pydantic Settings for env vars)
- [ ] 2.2.3 Create `app/models.py` (Pydantic models: MemoryPayload, RecallRequest, RecallResponse)

### 2.3 Database Clients
- [ ] 2.3.1 Create `app/services/postgres.py` (connection pooling, insert_event, query_events, get_graph_neighbors)
- [ ] 2.3.2 Create `app/services/qdrant.py` (QdrantClient, insert_vector, semantic_search)
- [ ] 2.3.3 Create `app/services/valkey.py` (Redis client, get/set with TTL, cache invalidation)
- [ ] 2.3.4 Create `app/services/mem0.py` (mem0 API client, extract_memory, retrieve_memory)

### 2.4 API Routes
- [ ] 2.4.1 Create `app/routes/health.py` (GET /health, GET /metrics endpoints)
- [ ] 2.4.2 Create `app/routes/memory.py` (POST /api/v1/memory/remember endpoint)
- [ ] 2.4.3 Implement `remember()`: Store in Postgres, generate embedding (OpenRouter), store in Qdrant, cache in Valkey, send to mem0
- [ ] 2.4.4 Create GET /api/v1/memory/recall endpoint
- [ ] 2.4.5 Implement `recall()`: Check Valkey cache, semantic search Qdrant, fetch Postgres metadata, cache result
- [ ] 2.4.6 Create GET /api/v1/memory/search/docs endpoint (RAG search over doc_chunks)
- [ ] 2.4.7 Create GET /api/v1/memory/graph/neighbors endpoint (query Postgres graph)
- [ ] 2.4.8 Create GET /api/v1/memory/similar/events endpoint (vector similarity)

### 2.5 Deployment & Testing
- [ ] 2.5.1 Build Docker image locally
- [ ] 2.5.2 Deploy to droplet: `scp -r memory-gateway/ droplet:/home/david/services/`
- [ ] 2.5.3 Start service: `docker-compose up -d`
- [ ] 2.5.4 Validate health: `curl https://memory.bestviable.com/health` → 200 OK
- [ ] 2.5.5 Test remember: POST with sample payload, verify Postgres insert, Qdrant vector, Valkey cache
- [ ] 2.5.6 Test recall: GET with query, verify results returned
- [ ] 2.5.7 Validate RAM: `docker stats memory-gateway` → <200MB
- [ ] 2.5.8 Check logs: `docker logs -f memory-gateway` → no errors

- [ ] 2.8 Test pattern hierarchy graph queries
  - Create test graph nodes: blueprint, workflow, template, execution_run
  - Create test edges: blueprint_has_workflow, workflow_has_template, template_used_in_run
  - Query: GET `/api/v1/memory/graph/neighbors?entity_id=coda:workflow-test`
  - Validate: Returns linked templates and execution runs

---

## 3. Planner Engine Service

**Prerequisites**: Requires `coda-pattern-tables-implementation` completed (service_blueprints, workflows, process_templates tables exist in Coda)
**Dependency**: Requires `coda-mcp-pattern-integration` Phase 1 (read-only endpoints) completed before Phase 3c

### 3.1 Project Setup
- [ ] 3.1.1 Create directory structure `/home/david/services/planner-engine/app/`
- [ ] 3.1.2 Create `Dockerfile` (Python 3.11-slim)
- [ ] 3.1.3 Create `docker-compose.yml` (Traefik labels: planner.bestviable.com)
- [ ] 3.1.4 Create `requirements.txt` (fastapi, uvicorn, openai, langfuse, psycopg2, httpx)
- [ ] 3.1.5 Create `.env.example` (OPENROUTER_API_KEY, POSTGRES_PASSWORD, MEMORY_GATEWAY_URL)

### 3.2 LLM Integration
- [ ] 3.2.1 Create `app/services/llm.py` (OpenAI client with OpenRouter base URL)
- [ ] 3.2.2 Implement Langfuse tracing wrapper
- [ ] 3.2.3 Create prompt template loader (fetch from Postgres prompt_templates table)
- [ ] 3.2.4 Implement `generate_sop(intent, context)` (calls OpenRouter Claude 3.5 Sonnet)
- [ ] 3.2.5 Implement response parser (LLM JSON → structured SOP dict)

### 3.3 Planning Logic
- [ ] 3.3.1 Create `app/routes/planner.py` (POST /api/v1/planner/plan endpoint)
- [ ] 3.3.2 Implement planning flow: Receive intent → Query Memory Gateway for user preferences → Load prompt template → Generate SOP → Store in Postgres plans table
- [ ] 3.3.3 Create `app/services/memory.py` (HTTP client to Memory Gateway)
- [ ] 3.3.4 Create `app/services/postgres.py` (insert_plan, get_plan, update_plan_status)

### 3.4 Deployment & Testing
- [ ] 3.4.1 Build and deploy to droplet
- [ ] 3.4.2 Start service: `docker-compose up -d`
- [ ] 3.4.3 Validate health: `curl https://planner.bestviable.com/health` → 200 OK
- [ ] 3.4.4 Test plan generation: POST /api/v1/planner/plan with test intent
- [ ] 3.4.5 Verify plan stored in Postgres: `SELECT * FROM plans ORDER BY created_at DESC LIMIT 1;`
- [ ] 3.4.6 Check Langfuse dashboard for traced LLM call
- [ ] 3.4.7 Validate RAM: `docker stats planner-engine` → <200MB

- [ ] 3.8 Test Service Blueprint context retrieval
  - Call: POST `/api/v1/planner/plan` with engagement_id
  - Verify: Planner queries Coda for offer → service_blueprint
  - Verify: LLM receives blueprint structure as context
  - Validate: Generated Process Template references blueprint_id

- [ ] 3.9 Test Workflow adaptation
  - Call: POST `/api/v1/planner/plan` with workflow_id
  - Verify: Planner queries Coda Workflows table
  - Verify: Generated Process Template links to parent workflow_id
  - Validate: Process Template created in Coda via MCP

---

## 4. Scheduler Engine Service

### 4.1 Project Setup
- [ ] 4.1.1 Create directory structure `/home/david/services/scheduler-engine/app/`
- [ ] 4.1.2 Create `Dockerfile` (Python 3.11-slim)
- [ ] 4.1.3 Create `docker-compose.yml` (Traefik labels: scheduler.bestviable.com, volume mount for /app/credentials)
- [ ] 4.1.4 Create `requirements.txt` (fastapi, uvicorn, google-api-python-client, google-auth, openai, psycopg2)
- [ ] 4.1.5 Create `.env.example` (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, OPENROUTER_API_KEY)

### 4.2 Google Calendar OAuth
- [ ] 4.2.1 Go to Google Cloud Console, create project "Planner Memory Architecture"
- [ ] 4.2.2 Enable Google Calendar API
- [ ] 4.2.3 Create OAuth 2.0 credentials (Web application)
- [ ] 4.2.4 Add authorized redirect URI: `https://scheduler.bestviable.com/oauth/callback`
- [ ] 4.2.5 Save Client ID and Secret to `.env`
- [ ] 4.2.6 Create `app/routes/oauth.py` (GET /oauth/authorize, GET /oauth/callback endpoints)
- [ ] 4.2.7 Implement OAuth authorization flow (redirect to Google consent screen)
- [ ] 4.2.8 Implement OAuth callback handler (exchange code for tokens, save to /app/credentials/gcal.json)
- [ ] 4.2.9 Test OAuth flow: Visit `/oauth/authorize`, authorize, verify tokens saved

### 4.3 Google Calendar Integration
- [ ] 4.3.1 Create `app/services/gcal.py` (Google Calendar API client)
- [ ] 4.3.2 Implement `load_credentials()` (load from /app/credentials/gcal.json, auto-refresh if expired)
- [ ] 4.3.3 Implement `get_calendar_events(start_date, end_date)` (fetch existing commitments)
- [ ] 4.3.4 Implement `create_calendar_event(task, time_block)` (create event with task metadata)
- [ ] 4.3.5 Implement `update_calendar_event(event_id, updates)` (modify existing event)

### 4.4 Scheduling Logic
- [ ] 4.4.1 Create `app/routes/scheduler.py` (POST /api/v1/scheduler/schedule endpoint)
- [ ] 4.4.2 Implement scheduling flow: Receive plan_id + tasks → Fetch existing calendar events → Query Memory Gateway for scheduling preferences → Call LLM to optimize schedule → Create calendar events → Store in scheduler_runs table
- [ ] 4.4.3 Create `app/services/llm.py` (LLM client for schedule optimization)
- [ ] 4.4.4 Create `app/services/postgres.py` (insert_scheduler_run, get_scheduler_run)

### 4.5 Deployment & Testing
- [ ] 4.5.1 Build and deploy to droplet
- [ ] 4.5.2 Start service: `docker-compose up -d`
- [ ] 4.5.3 Complete OAuth flow (authorize Google Calendar access)
- [ ] 4.5.4 Test scheduling: POST /api/v1/scheduler/schedule with test plan
- [ ] 4.5.5 Verify calendar events created in Google Calendar
- [ ] 4.5.6 Verify scheduler_run stored in Postgres
- [ ] 4.5.7 Validate RAM: `docker stats scheduler-engine` → <200MB

---

## 5. Observer Agent Service

### 5.1 Project Setup
- [ ] 5.1.1 Create directory structure `/home/david/services/observer-agent/app/`
- [ ] 5.1.2 Create `Dockerfile` (Python 3.11-slim)
- [ ] 5.1.3 Create `docker-compose.yml` (networks: docker_syncbricks only, no Traefik - internal service)
- [ ] 5.1.4 Create `requirements.txt` (fastapi, uvicorn, openai, psycopg2, httpx)
- [ ] 5.1.5 Create `.env.example` (OPENROUTER_API_KEY, POSTGRES_PASSWORD, MEMORY_GATEWAY_URL, CODA_MCP_URL)

### 5.2 Reflection Logic
- [ ] 5.2.1 Create `app/routes/observer.py` (POST /api/v1/observer/reflect?mode=daily|weekly endpoint)
- [ ] 5.2.2 Create `app/services/postgres.py` (query_events_since, aggregate_stats)
- [ ] 5.2.3 Create `app/services/gcal.py` (fetch_completion_stats from Google Calendar)
- [ ] 5.2.4 Create `app/services/coda.py` (HTTP client to coda-mcp, fetch_task_status, post_to_daily_thread)
- [ ] 5.2.5 Create `app/services/llm.py` (generate_reflection with daily/weekly prompts)
- [ ] 5.2.6 Create `app/prompts/daily_reflection.txt` (system prompt for daily reflections)
- [ ] 5.2.7 Create `app/prompts/weekly_review.txt` (system prompt for weekly reviews)

### 5.3 Reflection Flow Implementation
- [ ] 5.3.1 Implement daily reflection: Query events (last 24h) → Fetch calendar stats → Fetch Coda task status → Aggregate data → Generate reflection via LLM → Post to Coda Daily Thread → Store in Memory Gateway
- [ ] 5.3.2 Implement weekly reflection: Query events (last 7d) → Fetch calendar stats → Fetch Coda task status → Generate sprint review → Post to Coda → Store in Memory Gateway

### 5.4 Deployment & Testing
- [ ] 5.4.1 Build and deploy to droplet
- [ ] 5.4.2 Start service: `docker-compose up -d`
- [ ] 5.4.3 Test manual trigger: `curl -X POST http://localhost:8093/api/v1/observer/reflect?mode=daily`
- [ ] 5.4.4 Verify reflection generated (check response)
- [ ] 5.4.5 Verify reflection posted to Coda Daily Thread (open Coda BestViable ERP)
- [ ] 5.4.6 Verify reflection stored in Memory Gateway (check Postgres events table)
- [ ] 5.4.7 Validate RAM: `docker stats observer-agent` → <150MB when running

- [ ] 5.6 Test execution run performance analysis
  - Create test execution_runs with variance > 30%
  - Trigger: POST `/api/v1/observer/reflect?mode=weekly`
  - Verify: Reflection includes "Pattern Performance" section
  - Validate: Flags workflows with estimate drift

- [ ] 5.7 Test Sprint vs Execution Run comparison
  - Create Sprint with planned_billable_hrs
  - Create execution_runs for tasks in Sprint
  - Generate weekly review
  - Validate: Review compares planned vs actual billable hours

---

## 6. N8N Workflow Integration

### 6.1 Workflow: coda-to-calendar-sync
- [ ] 6.1.1 Open n8n UI: https://n8n.bestviable.com
- [ ] 6.1.2 Create new workflow: "coda-to-calendar-sync"
- [ ] 6.1.3 Add Webhook trigger: `/webhook/coda/task-created`
- [ ] 6.1.4 Add Function node: Extract task data (task_id, title, estimated_hours, client_id)
- [ ] 6.1.5 Add HTTP Request node: POST to Planner Engine `/api/v1/planner/plan`
- [ ] 6.1.6 Add HTTP Request node: POST to Scheduler Engine `/api/v1/scheduler/schedule`
- [ ] 6.1.7 Add Postgres node: Log event to events table
- [ ] 6.1.8 Activate workflow
- [ ] 6.1.9 Test: `curl -X POST https://n8n.bestviable.com/webhook/coda/task-created -d '{"task_id":"t-001",...}'`

### 6.2 Workflow: calendar-to-coda-sync
- [ ] 6.2.1 Create new workflow: "calendar-to-coda-sync"
- [ ] 6.2.2 Add Webhook trigger: `/webhook/gcal/event-updated`
- [ ] 6.2.3 Add Function node: Extract event data (event_id, task_id, status)
- [ ] 6.2.4 Add HTTP Request node: POST to Coda MCP to update task status
- [ ] 6.2.5 Activate workflow
- [ ] 6.2.6 Test with sample event update

### 6.3 Workflow: event-logger
- [ ] 6.3.1 Create new workflow: "event-logger"
- [ ] 6.3.2 Add Webhook trigger: `/webhook/events/log`
- [ ] 6.3.3 Add Function node: Validate payload schema
- [ ] 6.3.4 Add Postgres node: INSERT INTO events table
- [ ] 6.3.5 Activate workflow
- [ ] 6.3.6 Test with sample event payload

### 6.4 Workflow: daily-observer-trigger
- [ ] 6.4.1 Create new workflow: "daily-observer-trigger"
- [ ] 6.4.2 Add Cron trigger: `0 18 * * *` (6 PM daily)
- [ ] 6.4.3 Add HTTP Request node: POST to Observer Agent `/api/v1/observer/reflect?mode=daily`
- [ ] 6.4.4 Add Postgres node: Log execution result
- [ ] 6.4.5 Activate workflow
- [ ] 6.4.6 Manually execute to test

### 6.5 Workflow: weekly-observer-trigger
- [ ] 6.5.1 Create new workflow: "weekly-observer-trigger"
- [ ] 6.5.2 Add Cron trigger: `0 18 * * 5` (6 PM Friday)
- [ ] 6.5.3 Add HTTP Request node: POST to Observer Agent `/api/v1/observer/reflect?mode=weekly`
- [ ] 6.5.4 Add Postgres node: Log execution result
- [ ] 6.5.5 Activate workflow
- [ ] 6.5.6 Manually execute to test

---

## 7. External Services Setup

### 7.1 mem0 Setup
- [ ] 7.1.1 Sign up at https://mem0.ai/
- [ ] 7.1.2 Create project: "Planner Memory Architecture"
- [ ] 7.1.3 Get API key from dashboard
- [ ] 7.1.4 Add to Memory Gateway `.env`: `MEM0_API_KEY=m0-proj-xxxxx`
- [ ] 7.1.5 Test integration: Call Memory Gateway `/remember`, verify mem0 receives data

### 7.2 Langfuse Setup
- [ ] 7.2.1 Sign up at https://cloud.langfuse.com/
- [ ] 7.2.2 Create project: "Planner Memory Architecture"
- [ ] 7.2.3 Get Public Key and Secret Key
- [ ] 7.2.4 Add to all service `.env` files: `LANGFUSE_PUBLIC_KEY=pk-lf-xxxxx`, `LANGFUSE_SECRET_KEY=sk-lf-xxxxx`
- [ ] 7.2.5 Test integration: Generate plan, verify trace in Langfuse dashboard

### 7.3 OpenRouter Setup
- [ ] 7.3.1 Verify OpenRouter API key is valid
- [ ] 7.3.2 Set monthly budget alert ($200 threshold)
- [ ] 7.3.3 Test API access: Call Claude 3.5 Sonnet via OpenRouter
- [ ] 7.3.4 Monitor token usage in OpenRouter dashboard

---

## 8. Documentation & Finalization

### 8.1 Update Documentation
- [ ] 8.1.1 Update SERVICE_INVENTORY.md (add 5 new services, deprecate Archon)
- [ ] 8.1.2 Create MCP_SERVER_CATALOG.md entry for Memory Gateway (if converting to MCP in Phase 2)
- [ ] 8.1.3 Document API contracts (OpenAPI spec for Memory Gateway, Planner, Scheduler)
- [ ] 8.1.4 Update deployment guides with new services

### 8.2 Monitoring & Observability
- [ ] 8.2.1 Add all 5 services to Uptime-Kuma monitoring
- [ ] 8.2.2 Configure Dozzle to include new service logs
- [ ] 8.2.3 Set up alerting for service down/unhealthy
- [ ] 8.2.4 Create Grafana dashboard (optional, Phase 2)

### 8.3 Validation
- [ ] 8.3.1 Run full end-to-end test: Submit planning intent → Verify plan created → Verify calendar events → Verify reflection posted
- [ ] 8.3.2 Validate RAM usage: `docker stats` → total new services <700MB
- [ ] 8.3.3 Validate disk usage: `df -h` → <45GB total used
- [ ] 8.3.4 Validate all health checks passing
- [ ] 8.3.5 Run for 24 hours, verify no crashes/restarts

### 8.4 Rollback Plan
- [ ] 8.4.1 Document rollback procedure (stop services, restore Archon if needed)
- [ ] 8.4.2 Create Postgres backup before migration: `pg_dump n8ndb > backup_$(date +%Y%m%d).sql`
- [ ] 8.4.3 Tag Docker images for rollback: `docker tag memory-gateway:latest memory-gateway:backup`

---

## 9. Future Phase Preparation

### 9.1 MCP Spec Update (Phase 2)
- [ ] 9.1.1 Create separate OpenSpec change for coda-mcp update to MCP 2025-11-25
- [ ] 9.1.2 Document CIMD (Client ID Metadata Documents) migration path
- [ ] 9.1.3 Plan Tasks API integration for Memory Gateway async operations

### 9.2 Neo4j Migration (Phase 3)
- [ ] 9.2.1 Sign up for Neo4j AuraDB free tier
- [ ] 9.2.2 Plan graph data migration from Postgres to Neo4j
- [ ] 9.2.3 Evaluate Graphiti integration

### 9.3 Next.js UI (Phase 4)
- [ ] 9.3.1 Design Planning UI mockups
- [ ] 9.3.2 Plan API integration with Planner/Scheduler/Memory Gateway
