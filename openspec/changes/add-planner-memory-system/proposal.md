# Change: Add Planner & Memory Architecture System

## Why

Current state: Task planning, scheduling, and memory management are manual, fragmented, and lack intelligent automation. There's no unified system to:
- Transform planning intents into actionable SOPs and tasks
- Automatically schedule work to Google Calendar based on constraints
- Maintain contextual memory across planning sessions, agent interactions, and coding workflows
- Provide daily/weekly reflections and insights to improve productivity

**Problem**: Without this system, planning is ad-hoc, context is lost between sessions, and there's no feedback loop to improve over time.

**Opportunity**: Build an enterprise-grade Planner & Memory Architecture that serves as the foundation for BestViable ERP automation, future agentic SaaS products, and Ops Studio offerings.

## What Changes

### New Services (2 FastAPI microservices + cache)
1. **Memory Gateway** (150MB) - Unified memory API with Zep Cloud integration (`remember()`, `recall()`, `create_fact()`, `search_memories()`)
   - Hybrid memory stack: Zep Cloud (long-term memory, semantic search) + Postgres (facts, events) + Valkey (session cache)
   - Reusable service with clean API for future use cases
2. **Planner API** (250-300MB) - Consolidated service combining:
   - **Planner**: Intent → SOP → Tasks transformation (LLM-powered)
   - **Scheduler**: Tasks → Google Calendar blocks optimization
   - **Observer**: Daily/weekly reflections and fact extraction
3. **Valkey** (50MB) - Short-term memory cache (Redis fork, <24h TTL)

### Infrastructure Extensions
- **Postgres**: 11 new tables
  - Memory system: `events` (extended with Zep fields), `facts` (temporal validity model)
  - Planning: `plans`, `scheduler_runs`, `execution_runs`, `prompt_templates`
  - Pattern Ontology (replaces Coda): `service_blueprints`, `workflows`, `process_templates`
  - Graph (Phase 1 simple): `graph_nodes`, `graph_edges`
- **Zep Cloud** (free tier, 0MB self-hosted): Long-term memory, semantic search, knowledge graph
- **Qdrant** (reduced scope, Phase 2): Document chunks for RAG pipeline (Docling/Crawl4AI)
- **ToolJet Cloud** (0MB self-hosted): Admin UI for Postgres CRUD operations (tasks, plans, sprints)
- **Open WebUI** (already deployed): Chat interface with custom functions (Phase 1, not Phase 4)
- **n8n**: 3 automation workflows (event logging, daily Observer trigger, weekly Observer trigger)
  - **Deprecated**: Coda ↔ Calendar sync workflows (Postgres-first architecture, no Coda integration)

### External Integrations
- **Google Calendar API**: OAuth 2.0 for scheduling (personal account, America/Los_Angeles timezone)
- **Managed services**:
  - **Zep Cloud** (free tier, 10k API calls/month): Long-term memory, semantic search, graph-based facts
  - **Langfuse** (free tier): LLM observability and tracing
  - **Neo4j AuraDB** (Phase 3, future): Advanced graph queries
- **OpenRouter**: LLM provider for all AI operations (Claude, GPT, model selection per operation)

### Deprecations
- **Archon stack** (archon-server, archon-ui, archon-mcp) - No longer core services, removed to free 809MB RAM
- **Coda dual storage** - Architecture pivot to Postgres-first, eliminates sync complexity and two-way errors
- **Coda MCP server** - No longer needed (archived for reference implementation of MCP OAuth patterns)

## Impact

### Affected Specs
- **NEW**: `memory-gateway` - Core memory system capability (Zep Cloud + Postgres + Valkey hybrid)
- **NEW**: `planner-api` - Consolidated planning system capability (planner + scheduler + observer)
- **NEW**: `infrastructure/planner-memory` - Database schemas (Postgres Facts + Pattern Ontology), Zep Cloud, Valkey cache

### Affected Code
- **Key files/systems**:
  - `/service-builds/postgres/migrations/003_facts_temporal.sql` - New database schema (Facts + Pattern Ontology)
  - `/service-builds/memory-gateway/` - New service (FastAPI + Zep Cloud integration)
    - `app/services/zep.py` - Zep Cloud client
    - `app/routes/memory.py` - Updated with Zep hybrid recall/remember
  - `/service-builds/planner-api/` - New consolidated service (FastAPI + Google Calendar API)
    - `app/routes/planner.py` - Intent → SOP transformation
    - `app/routes/scheduler.py` - Calendar optimization
    - `app/routes/observer.py` - Reflection + fact extraction
    - `app/services/gcal.py` - Google Calendar integration
    - `app/services/fact_extractor.py` - Event → Fact promotion logic
  - `/service-builds/valkey/` - New cache service
  - n8n workflows (3 workflows via UI: event-logger, daily-observer-trigger, weekly-observer-trigger)
  - Traefik routing (2 new domains: memory.bestviable.com, planner.bestviable.com)
  - ToolJet Cloud apps (Tasks Manager, Plans Browser, Sprint Capacity Dashboard)
  - Open WebUI custom functions (create_plan.py, schedule_tasks.py, query_memory.py, reflect_daily.py)

### Resource Impact
- **RAM**: +400-450MB peak usage
  - Memory Gateway: 150MB (Zep Cloud integration, no self-hosted vector DB)
  - Planner API: 250-300MB (consolidated planner + scheduler + observer)
  - Valkey: 50MB (session cache, <24h TTL)
  - **Zep Cloud**: 0MB (managed service, free tier)
  - **ToolJet**: 0MB (cloud version, no self-hosting)
  - **Qdrant**: Deferred to Phase 2 (RAG pipeline)
- **RAM freed**: -809MB (Archon deprecation) + avoided Qdrant self-hosting (~500MB)
- **Net RAM**: +450MB - 809MB = **-359MB** (improves available headroom from 1.4GB → 1.76GB)
- **Disk**: +1.5GB (2 services vs 5, Docker images, data volumes)
- **Cost**: +$30-80/month (OpenRouter token usage, all managed services on free tier)
- **Infrastructure**:
  - Valkey (50MB cache)
  - Postgres extended schema (11 tables: Facts, Pattern Ontology, execution_runs)
  - Zep Cloud (free tier, 10k API calls/month)
  - ToolJet Cloud (free tier)
  - n8n workflows (3, down from 5 - no Coda sync)

### Breaking Changes
- **None** - This is additive, no existing services modified

### Migration Required
- Postgres schema migration (11 new tables: Facts + Pattern Ontology, no data migration needed - fresh start)
- Google Calendar OAuth setup (one-time manual setup via web flow)
- Zep Cloud account setup (free tier signup, API key)
- ToolJet Cloud workspace setup (connect to Postgres, create 3 admin apps)
- Open WebUI custom functions upload (4 Python functions)
- **No Coda migration** - Fresh start approach, Pattern Ontology tables start empty

### Dependencies
- **Python 3.11+** (for all new services)
- **FastAPI, Uvicorn** (web framework)
- **psycopg2, redis** (database clients)
- **zep-cloud==2.1.0** (Zep Cloud SDK for long-term memory)
- **openai, langfuse** (LLM integrations)
- **google-api-python-client, google-auth-oauthlib** (Google Calendar OAuth)
- **qdrant-client** (Phase 2 only, RAG pipeline)

### Security Considerations
- Google Calendar OAuth 2.0 tokens stored in mounted volume (`/app/credentials/gcal.json`)
- API keys for OpenRouter, Zep Cloud, Langfuse in `.env` files (git-ignored)
- Services on internal `docker_syncbricks` network not externally accessible
- Traefik reverse proxy for external services with Cloudflare Access
- No authentication between internal services in Phase 1 (isolated network trust model)
- ToolJet Cloud connects via Cloudflare Tunnel to Postgres (SSL required)
- Zep Cloud: End-to-end encryption in transit, data isolation per API key

### Rollout Strategy
Big bang deployment - all changes in one coordinated release:
- **Phase 1**: Database (2-3 hours) - Migration 003_facts_temporal.sql
- **Phase 2**: Memory Gateway Zep Integration (3-4 hours) - Zep Cloud account, SDK integration
- **Phase 3**: Planner API (4-6 hours) - Consolidated service (planner + scheduler + observer)
- **Phase 4**: Google Calendar OAuth (1-2 hours) - OAuth flow setup
- **Phase 5**: ToolJet Setup (1 hour) - Cloud workspace, Postgres connection, 3 admin apps
- **Phase 6**: Open WebUI Update (2-3 hours) - Custom functions upload
- **Phase 7**: n8n Workflow Updates (1 hour) - Disable Coda sync, update Observer triggers
- **Phase 8**: Documentation & Cleanup (1-2 hours) - OpenSpec updates, architecture diagrams
- **Total**: 15-23 hours estimated (2-3 focused work days)

### Testing Plan
- Per-service health checks and unit tests
- Integration tests for Planner → Scheduler flow
- End-to-end test: Intent → Plan → Calendar event creation
- n8n workflow validation with test payloads
- Observation: Manual daily/weekly reflection trigger

### Success Metrics
- Memory Gateway responding < 200ms for recall queries (Zep Cloud + Postgres hybrid)
- Planner generating SOPs within 10 seconds
- Scheduler creating Google Calendar events successfully
- Observer generating daily/weekly reflections and extracting facts
- Fact extraction: High-salience events (>= 0.7) promoted to facts table
- RAM usage within 450MB budget (Memory Gateway 150MB, Planner API 300MB max)
- Zep Cloud usage < 1000 API calls/month (well under 10k free tier limit)
- Zero service crashes/restarts in first week
- End-to-end test: Open WebUI chat → create plan → schedule tasks → calendar events created

### Future Phases
- **Phase 2** (2-4 weeks): RAG pipeline (Docling for PDFs, Crawl4AI for web scraping, Qdrant deployment)
- **Phase 3** (1-2 months): Neo4j AuraDB migration, Graphiti knowledge graph, advanced graph queries
- **Phase 4** (2-3 months): TipTap editor integration in ToolJet (Notion-like docs, bidirectional Git sync)
  - Note: Open WebUI already provides chat interface in Phase 1
- **Phase 5** (3-6 months): Multi-tenant SaaS preparation (row-level security, workspace isolation, billing)
