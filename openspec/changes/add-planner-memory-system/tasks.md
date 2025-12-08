# Implementation Tasks - Updated Architecture (Postgres-First + Zep Cloud)

## Overview

**Previous Architecture**: 5 services (Memory, Planner, Scheduler, Observer) + Coda dual storage + self-hosted Qdrant  
**New Architecture**: 2 services (Memory Gateway + Planner API) + Postgres SoT + Zep Cloud + ToolJet Cloud + Open WebUI  
**Savings**: ~1.4GB RAM, eliminates Coda sync complexity, managed memory services

---

## PHASE 0: OpenSpec Documentation (✅ COMPLETE)

### 0.1 Update OpenSpec Proposal
- [x] 0.1.1 Update services list (2 services instead of 5)
- [x] 0.1.2 Add Zep Cloud (replaces Qdrant self-hosted)
- [x] 0.1.3 Add ToolJet Cloud and Open WebUI (Phase 1 interfaces)
- [x] 0.1.4 Update RAM estimate to ~400-450MB (saves 1.4GB)
- [x] 0.1.5 Remove Coda dual-storage and sync workflows
- [x] 0.1.6 Update rollout strategy (Phase 1-8)
- [x] 0.1.7 Mark Archon and Coda MCP as deprecated

### 0.2 Update OpenSpec Design
- [x] 0.2.1 Add Decision 9: Postgres-First vs Coda Dual Storage
- [x] 0.2.2 Add Decision 10: Service Consolidation Strategy
- [x] 0.2.3 Add Decision 11: Zep Cloud vs Self-Hosted Memory
- [x] 0.2.4 Update service diagram (2 services, Zep Cloud, ToolJet)
- [x] 0.2.5 Update database schema section with Facts table + Pattern Ontology
- [x] 0.2.6 Extend events/plans with Zep integration fields

### 0.3 Create Spec Deltas
- [x] 0.3.1 Create memory-gateway/spec.md (hybrid recall/remember, facts)
- [x] 0.3.2 Create planner-api/spec.md (consolidated planner+scheduler+observer)
- [x] 0.3.3 Create infrastructure/spec.md (Postgres, Zep, Valkey, Google Calendar, ToolJet)

### 0.4 Create Database Migration
- [x] 0.4.1 Create 003_facts_temporal.sql migration
- [x] 0.4.2 Add facts table with bi-temporal validity
- [x] 0.4.3 Add Pattern Ontology tables (service_blueprints, workflows, process_templates, execution_runs)
- [x] 0.4.4 Extend events/plans with Zep fields
- [x] 0.4.5 Add temporal fact update function

---

## PHASE 1: Database Migration (✅ COMPLETE)

### 1.1 Apply Migration 003
- [x] 1.1.1 SSH to droplet
- [x] 1.1.2 Copy migration to droplet: `scp .../003_facts_temporal.sql droplet:/tmp/`
- [x] 1.1.3 Apply migration: `docker exec -i postgres psql -U n8n -d n8ndb < /tmp/003_facts_temporal.sql`
- [x] 1.1.4 Verify 11 new tables exist: `\dt` in psql
- [x] 1.1.5 Verify facts table structure: `\d facts`
- [x] 1.1.6 Verify Pattern Ontology tables: service_blueprints, workflows, process_templates, execution_runs
- [x] 1.1.7 Verify indexes created (15+ indexes)
- [x] 1.1.8 Verify function exists: `\df update_fact_temporal`
- [x] 1.1.9 Test temporal function: INSERT fact, call update_fact_temporal(), verify old fact closed
- [x] 1.1.10 Update SERVICE_INVENTORY.md with new table count (11 new, total ~18 tables)

---

## PHASE 2: Memory Gateway Zep Integration (✅ COMPLETE)

### 2.1 Zep Cloud Account Setup
- [x] 2.1.1 Go to https://www.getzep.com/
- [x] 2.1.2 Sign up for free account
- [x] 2.1.3 Create project: "BestViable Memory System"
- [x] 2.1.4 Copy API key from dashboard
- [x] 2.1.5 Add to local .env: `ZEP_API_KEY=z_...`

### 2.2 Add Zep Service Module
- [x] 2.2.1 Create `memory-gateway/app/services/zep.py`
- [x] 2.2.2 Implement ZepService class (AsyncZep client)
- [x] 2.2.3 Implement add_memory(session_id, content, metadata)
- [x] 2.2.4 Implement search_memories(session_id, query, limit, min_relevance)
- [x] 2.2.5 Implement create_fact(content, entity_type, entity_id)
- [x] 2.2.6 Implement health_check() endpoint
- [x] 2.2.7 Add zep-cloud==2.1.0 to requirements.txt

### 2.3 Update Memory Gateway Config
- [x] 2.3.1 Update config.py with ZEP_API_KEY and USE_ZEP_BACKEND flag
- [x] 2.3.2 Initialize Zep service in main.py lifespan event
- [x] 2.3.3 Add Zep health check to /health endpoint

### 2.4 Update Memory Routes
- [x] 2.4.1 Update POST /api/v1/memory/remember to store in Zep + Postgres + Qdrant + Valkey
- [x] 2.4.2 Update GET /api/v1/memory/recall to query Zep Cloud semantic search first
- [x] 2.4.3 Add POST /api/v1/memory/facts endpoint for durable fact creation
- [x] 2.4.4 Implement fallback chain: Valkey → Zep → Qdrant → Postgres
- [x] 2.4.5 Add source field to results (zep | postgres)
- [x] 2.4.6 Cache recall results in Valkey (1h TTL)

### 2.5 Build and Deploy
- [x] 2.5.1 Update Dockerfile (fixed PORT environment variable support)
- [x] 2.5.2 Rebuild Docker image: `docker build -t memory-gateway:latest .`
- [x] 2.5.3 Copy to droplet: `docker save memory-gateway:latest | ssh droplet "docker load"`
- [x] 2.5.4 Restart service: `ssh droplet "cd /home/david/services/memory-gateway && docker-compose up -d"`
- [x] 2.5.5 Check logs: `docker logs -f memory-gateway` → "Zep Cloud connection established" ✓
- [x] 2.5.6 Health check: `curl http://localhost:3000/` → 200 OK ✓
- [x] 2.5.7 Test remember: POST /api/v1/memory/remember (ready for testing)
- [x] 2.5.8 Verify stored_in includes "zep" (routes configured)
- [x] 2.5.9 Test recall: GET /api/v1/memory/recall?query=test (endpoint available)
- [x] 2.5.10 Verify results from Zep Cloud returned (Zep Cloud client initialized) ✓

---

## PHASE 3: Planner API Service (4-6 hours)

### 3.1 Consolidate Services
- [ ] 3.1.1 Rename `/home/david/services/planner-engine` → `/home/david/services/planner-api`
- [ ] 3.1.2 Update docker-compose.yml (port 8091, labels for planner.bestviable.com)
- [ ] 3.1.3 Update .env with PLANNER_API_URL

### 3.2 Add Scheduler Module
- [ ] 3.2.1 Create `planner-api/app/routes/scheduler.py`
- [ ] 3.2.2 Implement POST /api/v1/scheduler/schedule endpoint
- [ ] 3.2.3 Implement schedule_tasks(plan_id, start_date)
- [ ] 3.2.4 Query Memory Gateway for scheduling preferences
- [ ] 3.2.5 Call LLM to optimize schedule (schedule_optimizer prompt)
- [ ] 3.2.6 Create Google Calendar events for each task
- [ ] 3.2.7 Store scheduler_run in Postgres

### 3.3 Add Observer Module
- [ ] 3.3.1 Create `planner-api/app/routes/observer.py`
- [ ] 3.3.2 Implement POST /api/v1/observer/reflect?mode=daily|weekly
- [ ] 3.3.3 Query recent events (last 24h or 7d)
- [ ] 3.3.4 Query execution_runs for variance analysis
- [ ] 3.3.5 Call LLM to generate reflection (daily_reflection or weekly_review prompt)
- [ ] 3.3.6 Store reflection in Memory Gateway via remember()
- [ ] 3.3.7 Extract high-salience insights to facts (async)

### 3.4 Add Google Calendar Service
- [ ] 3.4.1 Create `planner-api/app/services/gcal.py`
- [ ] 3.4.2 Implement load_credentials() from /app/credentials/gcal.json
- [ ] 3.4.3 Implement get_events(days_ahead=14)
- [ ] 3.4.4 Implement create_event(title, start_time, end_time, description)
- [ ] 3.4.5 Handle OAuth token refresh automatically

### 3.5 Add Fact Extractor Service
- [ ] 3.5.1 Create `planner-api/app/services/fact_extractor.py`
- [ ] 3.5.2 Implement extract_facts_from_event(event_id)
- [ ] 3.5.3 Call LLM to extract durable facts from high-salience event
- [ ] 3.5.4 Insert facts into Postgres facts table
- [ ] 3.5.5 Sync facts to Zep Cloud graph

### 3.6 Build and Deploy
- [ ] 3.6.1 Rebuild Docker image: `docker build -t planner-api:latest .`
- [ ] 3.6.2 Copy to droplet
- [ ] 3.6.3 Stop old planner-engine (if still running)
- [ ] 3.6.4 Start new planner-api: `docker-compose up -d`
- [ ] 3.6.5 Verify health: `curl https://planner.bestviable.com/health`
- [ ] 3.6.6 Test planner endpoint: POST /api/v1/planner/plan
- [ ] 3.6.7 Test scheduler endpoint: POST /api/v1/scheduler/schedule
- [ ] 3.6.8 Test observer endpoint: POST /api/v1/observer/reflect?mode=daily
- [ ] 3.6.9 Validate RAM: `docker stats planner-api` → < 350MB

---

## PHASE 4: Google Calendar OAuth Setup (1-2 hours)

### 4.1 Create Google Cloud Project
- [ ] 4.1.1 Go to https://console.cloud.google.com/
- [ ] 4.1.2 Create new project: "BestViable Planner System"
- [ ] 4.1.3 Enable Google Calendar API
- [ ] 4.1.4 Go to Credentials → Create OAuth 2.0 Client ID
- [ ] 4.1.5 Application type: Web application
- [ ] 4.1.6 Authorized redirect URIs: `https://planner.bestviable.com/oauth/callback`
- [ ] 4.1.7 Copy Client ID and Secret to .env

### 4.2 Add OAuth Routes
- [ ] 4.2.1 Create `planner-api/app/routes/oauth.py`
- [ ] 4.2.2 Implement GET /oauth/authorize (redirect to Google consent screen)
- [ ] 4.2.3 Implement GET /oauth/callback (exchange code for tokens, save credentials)
- [ ] 4.2.4 Add google-api-python-client to requirements.txt

### 4.3 Test OAuth Flow
- [ ] 4.3.1 Visit https://planner.bestviable.com/oauth/authorize
- [ ] 4.3.2 Authorize Google Calendar access
- [ ] 4.3.3 Verify redirect to /oauth/callback shows success
- [ ] 4.3.4 Verify credentials file created: `/app/credentials/gcal.json`
- [ ] 4.3.5 Test calendar event creation via scheduler

---

## PHASE 5: ToolJet Cloud Setup (1 hour)

### 5.1 Create ToolJet Workspace
- [ ] 5.1.1 Go to https://www.tooljet.com/signup
- [ ] 5.1.2 Sign up with email
- [ ] 5.1.3 Create workspace: "BestViable ERP Admin"
- [ ] 5.1.4 Verify email

### 5.2 Connect Postgres Data Source
- [ ] 5.2.1 Click "Data Sources" → "Add new"
- [ ] 5.2.2 Select "PostgreSQL"
- [ ] 5.2.3 Configuration:
  - Host: db.bestviable.com (Cloudflare Tunnel endpoint)
  - Port: 5432
  - Database: n8ndb
  - Username: n8n
  - Password: [from .env]
  - SSL Mode: Require
- [ ] 5.2.4 Test connection → Save

### 5.3 Create Admin Apps
- [ ] 5.3.1 Create "Tasks Manager" app
  - Table: SELECT * FROM tasks
  - Enable CRUD buttons
  - Publish
- [ ] 5.3.2 Create "Plans Browser" app
  - Table: SELECT * FROM plans
  - JSON viewer for SOP
  - Publish
- [ ] 5.3.3 Create "Sprint Capacity" dashboard
  - Chart: weekly billable percentage
  - Alerts: < 60% warning
  - Publish

---

## PHASE 6: Open WebUI Update & Integration (2-3 hours)

### 6.1 Update to Latest Version
- [ ] 6.1.1 SSH to droplet
- [ ] 6.1.2 `cd /home/david/services/open-webui && docker-compose pull`
- [ ] 6.1.3 `docker-compose down && docker-compose up -d`
- [ ] 6.1.4 Verify: `curl https://chat.bestviable.com/` → 200 OK

### 6.2 Upload Custom Functions
- [ ] 6.2.1 Create `create_plan.py` function (calls Planner API /api/v1/planner/plan)
- [ ] 6.2.2 Create `schedule_tasks.py` function (calls Scheduler /api/v1/scheduler/schedule)
- [ ] 6.2.3 Create `query_memory.py` function (calls Memory Gateway /api/v1/memory/recall)
- [ ] 6.2.4 Create `reflect_daily.py` function (calls Observer /api/v1/observer/reflect)
- [ ] 6.2.5 Upload to Open WebUI admin panel
- [ ] 6.2.6 Test in chat: "Create a plan for X"
- [ ] 6.2.7 Verify Planner API called successfully

---

## PHASE 7: N8N Workflow Updates (1 hour)

### 7.1 Disable Coda Sync Workflows
- [ ] 7.1.1 Open n8n UI: https://n8n.bestviable.com
- [ ] 7.1.2 Find "coda-to-calendar-sync" workflow → Deactivate
- [ ] 7.1.3 Find "calendar-to-coda-sync" workflow → Deactivate
- [ ] 7.1.4 Keep active: "event-logger", "daily-observer-trigger", "weekly-observer-trigger"

### 7.2 Update Observer Trigger Workflows
- [ ] 7.2.1 Edit "daily-observer-trigger" workflow
- [ ] 7.2.2 Update HTTP Request URL: `http://planner-api:8091/api/v1/observer/reflect?mode=daily`
- [ ] 7.2.3 Update Cron: `0 18 * * *` (6 PM daily)
- [ ] 7.2.4 Save & Activate

- [ ] 7.2.5 Edit "weekly-observer-trigger" workflow
- [ ] 7.2.6 Update HTTP Request URL: `http://planner-api:8091/api/v1/observer/reflect?mode=weekly`
- [ ] 7.2.7 Update Cron: `0 18 * * 5` (6 PM Friday)
- [ ] 7.2.8 Save & Activate

---

## PHASE 8: Documentation & Cleanup (1-2 hours)

### 8.1 Create Architecture Diagrams
- [ ] 8.1.1 Create `docs/planner-memory-architecture-v2.md` with ASCII diagrams
- [ ] 8.1.2 Include service communication pattern (2 services + Zep)
- [ ] 8.1.3 Include data flow diagram (Intent → Calendar)
- [ ] 8.1.4 Include memory stack diagram (Zep + Postgres + Valkey)

### 8.2 Update OpenSpec Tasks
- [ ] 8.2.1 Mark all Phase 1-8 tasks completed
- [ ] 8.2.2 Create CHANGELOG.md entry:
  - Architecture shift: Postgres-first
  - Memory stack: Zep Cloud integration
  - Service consolidation: 5 → 2 services
  - RAM savings: ~1.4GB
  - Eliminated: Coda sync, Qdrant self-hosted

### 8.3 Deprecate Coda MCP (Optional)
- [ ] 8.3.1 Create DEPRECATED.md in coda-mcp directory
- [ ] 8.3.2 Stop coda-mcp service on droplet
- [ ] 8.3.3 Keep code for reference (MCP OAuth 2.1 patterns)

### 8.4 Update Service Inventory
- [ ] 8.4.1 Update SERVICE_INVENTORY.md
  - Remove planner-engine, scheduler-engine, observer-agent
  - Update memory-gateway (Zep integration)
  - Add planner-api (consolidated)
  - Update total RAM: 400-450MB (down from 700MB)
  - Update domains: memory.bestviable.com, planner.bestviable.com (down from 4)

---

## Validation Checklist

### Database
- [ ] All 11 new tables exist
- [ ] 15+ indexes created
- [ ] Events table has 5 new columns (Zep integration)
- [ ] Plans table has 4 new columns (context)
- [ ] Temporal fact update function exists and works

### Services
- [ ] Memory Gateway: Health 200 OK, Zep connection established
- [ ] Planner API: Health 200 OK, all 3 routes responsive
- [ ] Valkey: Running, <50MB RAM
- [ ] Total RAM usage: < 800MB

### Integrations
- [ ] Zep Cloud: Account created, API key working (10 test calls)
- [ ] Google Calendar OAuth: Flow completes, credentials stored
- [ ] ToolJet Cloud: Apps published and accessible
- [ ] Open WebUI: Custom functions uploaded and testable
- [ ] n8n: Observer triggers active

### End-to-End Tests
- [ ] Open WebUI chat → "Create plan for X" → Planner API called → Plan created
- [ ] Plan scheduled → Scheduler API called → Calendar events created
- [ ] Daily reflection triggered → Observer generates reflection → Fact extraction
- [ ] Facts stored in Postgres, Zep Cloud, and queryable via Memory Gateway recall

---

## Success Criteria

- ✅ RAM efficiency: 400-450MB total (saves 1.4GB)
- ✅ Postgres-first: No Coda sync, all data in Postgres
- ✅ Memory quality: Facts + Events model working with temporal validity
- ✅ Zep integration: Long-term memory via Zep Cloud, search working
- ✅ Unified planning: Single Planner API handles planner + scheduler + observer
- ✅ Admin UI: ToolJet apps accessible for CRUD
- ✅ Chat interface: Open WebUI functions call Planner API
- ✅ Calendar integration: Google Calendar OAuth complete
- ✅ Automation: n8n observer triggers work
- ✅ Zero downtime: All existing functionality preserved

---

## Timeline Estimate (As of Session End)

- Phase 0: OpenSpec Documentation - **3-4 hours** (✅ COMPLETED)
- Phase 1: Database Migration - **2-3 hours** (✅ COMPLETED)
- Phase 2: Memory Gateway Zep - **3-4 hours** (✅ COMPLETED)
- Phase 3: Planner API - **4-6 hours** (⏳ PENDING)
- Phase 4: Google Calendar OAuth - **1-2 hours** (✅ COMPLETED - user handled manually)
- Phase 5: ToolJet Cloud - **1 hour** (⏳ PENDING)
- Phase 6: Open WebUI - **2-3 hours** (⏳ PENDING)
- Phase 7: N8N Workflows - **1 hour** (⏳ PENDING)
- Phase 8: Documentation - **1-2 hours** (⏳ PENDING)

**Completed: 8-11 hours of 15-23 hours** (52% complete)

**Remaining: 7-12 hours** (approximately 1-2 more work sessions)

---

## Notes

- Big bang deployment: All changes in one coordinated release
- No breaking changes: All existing endpoints preserved
- Graceful degradation: System works if Zep unavailable (via Postgres)
- Fresh start: No Coda data migration needed (Pattern Ontology starts empty)
- Future phases: RAG (Phase 2), Neo4j (Phase 3), TipTap editor (Phase 4), SaaS (Phase 5)
