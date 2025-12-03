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

### New Services (5 FastAPI microservices)
1. **Memory Gateway** - Unified memory API (`remember()`, `recall()`, `search_docs()`, `graph_neighbors()`, `similar_events()`)
2. **Planner Engine** - Intent → SOP → Tasks transformation (LLM-powered)
3. **Scheduler Engine** - Tasks → Google Calendar blocks optimization
4. **Observer Agent** - Daily/weekly reflections → Coda Daily Thread
5. **Valkey** - Short-term memory cache (Redis fork)

### Infrastructure Extensions
- **Postgres**: 7 new tables (events, plans, scheduler_runs, execution_runs, graph_nodes, graph_edges, prompt_templates)
- **Qdrant**: 4 new collections (doc_chunks, events, agent_memories, daily_threads)
- **n8n**: 5 new automation workflows (Coda ↔ Calendar sync, event logging, Observer triggers)

### External Integrations
- **Google Calendar API**: OAuth 2.0 for scheduling
- **Managed services**: mem0 (free tier), Langfuse (free tier), Neo4j AuraDB (Phase 3)
- **OpenRouter**: LLM provider for all AI operations

### Deprecations
- **Archon stack** (archon-server, archon-ui, archon-mcp) - No longer core services, removed to free 809MB RAM

## Impact

### Affected Specs
- **NEW**: `memory-gateway` - Core memory system capability
- **NEW**: `planner-engine` - Planning system capability
- **NEW**: `scheduler-engine` - Scheduling system capability
- **NEW**: `observer-agent` - Reflection system capability
- **NEW**: `infrastructure/planner-memory` - Database schemas, caching, vector storage

### Affected Code
- **Key files/systems**:
  - `/service-builds/postgres/migrations/002_planner_memory_schema.sql` - New database schema
  - `/home/david/services/memory-gateway/` - New service (FastAPI)
  - `/home/david/services/planner-engine/` - New service (FastAPI)
  - `/home/david/services/scheduler-engine/` - New service (FastAPI + Google Calendar API)
  - `/home/david/services/observer-agent/` - New service (FastAPI)
  - `/home/david/services/valkey/` - New cache service
  - `/home/david/services/qdrant/setup_collections.py` - Collection configuration
  - n8n workflows (5 new workflows via UI)
  - Traefik routing (4 new domains: memory.*, planner.*, scheduler.*, observer.*)

### Resource Impact
- **RAM**: +700MB peak usage (Valkey 200MB, Memory Gateway 150MB, Planner 200MB, Scheduler 150MB, Observer 100-150MB)
- **RAM freed**: -809MB (Archon deprecation)
- **Net RAM**: +700MB - 809MB = **-109MB** (improves available headroom from 1.4GB → 1.5GB)
- **Disk**: +2GB (new services, Docker images, data volumes)
- **Cost**: +$60-150/month (OpenRouter token usage, managed services are free tier)
- **Infrastructure**: Valkey (200MB cache), extended Postgres schema (7 tables including execution_runs), Qdrant collections (4), n8n workflows (5)

### Breaking Changes
- **None** - This is additive, no existing services modified

### Migration Required
- Postgres schema migration (new tables, no data migration needed)
- Qdrant collection creation (fresh collections, no migration)
- Google Calendar OAuth setup (one-time manual setup)

### Dependencies
- **Python 3.11+** (for all new services)
- **FastAPI, Uvicorn** (web framework)
- **psycopg2, qdrant-client, redis** (database clients)
- **openai, langfuse** (LLM integrations)
- **google-api-python-client** (Google Calendar)
- **MCP 2025-11-25 spec** (noted for future Phase 2 updates to coda-mcp)

### Security Considerations
- Google Calendar OAuth 2.0 tokens stored encrypted on filesystem
- API keys for OpenRouter, mem0, Langfuse in `.env` files (git-ignored)
- Services on internal `docker_syncbricks` network not externally accessible
- Traefik reverse proxy for external services with Cloudflare Access
- No authentication between internal services in Phase 1 (isolated network trust model)

### Rollout Strategy
- **Phase 1a**: Infrastructure prep (2-3 hours) - Archon removal, Valkey, database extensions
- **Phase 1b**: Memory Gateway MVP (4-6 hours)
- **Phase 1c**: Planner & Scheduler Engines (6-8 hours)
- **Phase 1d**: n8n workflow integration (3-4 hours)
- **Phase 1e**: Observer Agent MVP (3-4 hours)
- **Total**: 18-25 hours estimated

### Testing Plan
- Per-service health checks and unit tests
- Integration tests for Planner → Scheduler flow
- End-to-end test: Intent → Plan → Calendar event creation
- n8n workflow validation with test payloads
- Observation: Manual daily/weekly reflection trigger

### Success Metrics
- Memory Gateway responding < 200ms for recall queries
- Planner generating SOPs within 10 seconds
- Scheduler creating calendar events successfully
- Observer posting reflections to Coda Daily Thread
- RAM usage within 700MB budget
- Zero service crashes/restarts in first week

### Future Phases
- **Phase 2** (2-4 weeks): RAG ingest (Docling, Crawl4AI), advanced mem0 integration
- **Phase 3** (1-2 months): Neo4j migration, Graphiti knowledge graph
- **Phase 4** (2-3 months): Next.js Planning UI
- **Phase 5** (3-6 months): Multi-tenant SaaS preparation
