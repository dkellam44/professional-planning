# Design: Planner & Memory Architecture

## Context

Building an enterprise-grade planning and memory system for BestViable ERP that will serve as:
1. Immediate productivity tool for personal planning and scheduling
2. Foundation for future agentic SaaS products (Ops Studio)
3. Reference architecture for AI agent memory systems

**Constraints:**
- Current droplet: 4GB RAM, 2 vCPUs, 80GB SSD ($24/month)
- Budget: Minimize recurring costs (use free tiers, self-host where feasible)
- Timeline: Phase 1 deployable in 18-25 hours of work
- Maintainability: Simple, boring tech stack for one-person operation

**Stakeholders:**
- Primary user: David (bootstrapped founder)
- Future: Ops Studio customers (multi-tenant expansion)

---

## Goals / Non-Goals

### Goals
1. **Unified Memory API** - Single interface for all memory operations (remember, recall, search)
2. **Intelligent Planning** - LLM-powered transformation of intents into SOPs and tasks
3. **Automated Scheduling** - Optimize task placement in Google Calendar based on preferences
4. **Continuous Improvement** - Daily/weekly reflections to improve planning over time
5. **Scalable Foundation** - Architecture ready for multi-tenant SaaS (Phase 5)
6. **Resource Efficiency** - Fit within current droplet capacity (~700MB RAM budget)

### Non-Goals (Phase 1)
- ❌ Multi-user support (single-user only, David's calendar)
- ❌ Real-time collaboration
- ❌ Mobile apps (web-only)
- ❌ Advanced graph query language (basic graph traversal only)
- ❌ Custom MCP protocol implementation (use HTTP/REST, convert later)
- ❌ Comprehensive RAG pipeline (defer Docling/Crawl4AI to Phase 2)

---

## Decisions

### Decision 1: Python/FastAPI for All Services

**Choice:** Python 3.11 + FastAPI + Uvicorn

**Alternatives Considered:**
- Node.js/TypeScript (matches existing coda-mcp pattern)
- Go (better performance, lower memory)
- Rust (maximum performance)

**Rationale:**
- **LLM ecosystem**: Python has best library support (openai, langfuse, mem0, qdrant-client)
- **Speed to ship**: FastAPI auto-generates OpenAPI docs, built-in validation, async support
- **Developer familiarity**: Python more accessible for future contributors
- **Trade-off**: Slightly higher memory (Python ~150MB vs Node ~100MB per service), acceptable given budget

### Decision 2: Valkey (Not Redis)

**Choice:** Valkey 8.1 (Redis fork)

**Alternatives Considered:**
- Redis 7.x (original, widely supported)
- Upstash managed Redis (free tier 100MB)
- Dragonfly (high-performance Redis alternative)

**Rationale:**
- **Licensing**: Valkey is truly open-source (BSD 3-clause), no future licensing risk
- **Performance**: 20-30% better memory efficiency than Redis 7.x
- **Self-hosted**: $15-60/month savings vs managed
- **Compatibility**: Drop-in Redis replacement, easy migration if needed
- **Trade-off**: Newer project (less battle-tested), acceptable for non-critical caching

### Decision 3: Managed Services for mem0, Langfuse, Neo4j

**Choice:** Use free tiers of managed services

**Alternatives Considered:**
- Self-host all (mem0 requires 8-16GB RAM + Neo4j + ChromaDB)
- Skip these services entirely

**Rationale:**
- **mem0**: Free tier sufficient (long-term memory extraction), self-hosting requires 8GB+ RAM
- **Langfuse**: Free tier 100K events/month (plenty for single user), self-hosting requires 16GB+ RAM
- **Neo4j AuraDB**: Free tier for Phase 3 graph migration, self-hosting requires 2-4GB RAM
- **Cost**: $0 vs $65-146/month managed paid plans vs $24/month droplet upgrade
- **Trade-off**: Vendor lock-in risk, but all have export capabilities and open-source self-host options

### Decision 4: Postgres Graph vs Neo4j (Phase 1)

**Choice:** Implement graph as Postgres tables (graph_nodes, graph_edges), migrate to Neo4j in Phase 3

**Alternatives Considered:**
- Neo4j from day 1 (proper graph database)
- Skip graph entirely (simpler, no relationships)
- SQLite graph (lighter than Postgres)

**Rationale:**
- **Existing infrastructure**: Postgres already running, no new dependency
- **Simplicity**: SQL queries easier to debug than Cypher for simple graph traversal
- **RAM budget**: Saves 2-4GB that Neo4j would require
- **Migration path**: Clear upgrade path to Neo4j when scale demands it (Phase 3)
- **Trade-off**: Limited graph query capabilities (no multi-hop traversal, no graph algorithms), acceptable for Phase 1 knowledge graph

### Decision 5: Google Calendar OAuth 2.0 (Not Service Account)

**Choice:** User OAuth 2.0 with authorization code flow

**Alternatives Considered:**
- Service account (simpler, no user consent needed)
- Google Workspace domain-wide delegation

**Rationale:**
- **User control**: User explicitly authorizes access, aligns with privacy principles
- **Future multi-tenant**: OAuth pattern scales to multiple users
- **Security**: No long-lived service account credentials
- **Trade-off**: Requires manual OAuth flow setup (one-time), token refresh logic needed, acceptable complexity

### Decision 6: HTTP/REST APIs (Not MCP Protocol) for Phase 1

**Choice:** Standard FastAPI HTTP/REST endpoints, consider MCP in Phase 2

**Alternatives Considered:**
- Implement as MCP servers from day 1
- Custom protocol (WebSocket, gRPC)

**Rationale:**
- **Speed**: HTTP/REST faster to implement, well-understood patterns
- **MCP spec evolving**: 2025-11-25 spec just released, ecosystem still maturing
- **Future-proof**: Easy to wrap HTTP APIs in MCP server later (Tasks API, CIMD OAuth)
- **Existing patterns**: coda-mcp already HTTP-native MCP, can replicate pattern
- **Trade-off**: Some rework needed for MCP conversion (Phase 2), but HTTP APIs remain useful regardless

### Decision 7: n8n for Orchestration (Not Custom)

**Choice:** Use n8n workflows for Coda ↔ Calendar sync, event logging, Observer triggers

**Alternatives Considered:**
- Custom Python orchestrator (Celery, Temporal, Prefect)
- Airflow (heavyweight)
- GitHub Actions (limited to periodic tasks)

**Rationale:**
- **Already deployed**: n8n running, no new infrastructure
- **Visual debugging**: Workflow UI makes debugging easier
- **Flexibility**: Easy to modify workflows without code changes
- **Proven**: Already using for github_to_coda_sync, works well
- **Trade-off**: n8n not ideal for complex DAGs, acceptable for simple linear workflows

### Decision 8: OpenRouter as LLM Provider

**Choice:** Route all LLM calls through OpenRouter (Claude 3.5 Sonnet)

**Alternatives Considered:**
- Direct Anthropic API (simpler)
- LiteLLM proxy (already deployed)
- Multiple providers (OpenAI, Anthropic, Groq)

**Rationale:**
- **Cost optimization**: OpenRouter has competitive pricing, automatic routing
- **Already integrated**: OpenWebUI uses OpenRouter, credentials exist
- **Flexibility**: Easy to switch models without code changes
- **Fallback**: Can route to cheaper models (GPT-3.5) for non-critical tasks
- **Trade-off**: Extra network hop (latency +50-100ms), acceptable for async planning tasks

---

## Technical Architecture

### Service Communication Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    External Layer                        │
│  (Cloudflare Tunnel → Traefik → docker_proxy network)  │
└─────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
     │ Memory   │    │ Planner  │    │Scheduler │
     │ Gateway  │    │ Engine   │    │ Engine   │
     │  :8090   │    │  :8091   │    │  :8092   │
     └────┬─────┘    └────┬─────┘    └────┬─────┘
          │               │                │
          └───────┬───────┴────────┬───────┘
                  │                │
┌─────────────────▼────────────────▼─────────────────┐
│            Internal Layer (docker_syncbricks)       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐│
│  │Postgres │  │ Qdrant  │  │ Valkey  │  │Observer││
│  │  :5432  │  │  :6333  │  │  :6379  │  │  :8093 ││
│  └─────────┘  └─────────┘  └─────────┘  └────────┘│
└────────────────────────────────────────────────────┘
                          │
                    ┌─────▼─────┐
                    │    n8n    │
                    │  :5678    │
                    └───────────┘
```

**Communication Rules:**
1. **External → Internal**: Only via Traefik reverse proxy (HTTP-only, SSL terminated by Cloudflare)
2. **Internal ↔ Internal**: Direct HTTP calls (no auth, network isolation trust model)
3. **Service → Postgres/Qdrant/Valkey**: Direct connection (connection pooling, retry logic)
4. **n8n → Services**: HTTP webhooks and scheduled cron triggers

### Data Flow: Intent → Calendar Event

```
1. User intent (chat/API)
       │
       ▼
2. POST /api/v1/planner/plan
   ├─ Query Memory Gateway (user preferences)
   ├─ Load prompt template (Postgres)
   ├─ Call OpenRouter LLM (Claude 3.5 Sonnet)
   ├─ Parse SOP JSON
   └─ Store plan in Postgres
       │
       ▼
3. POST /api/v1/scheduler/schedule
   ├─ Fetch plan from Postgres
   ├─ Query Google Calendar (existing events)
   ├─ Query Memory Gateway (scheduling preferences)
   ├─ Call OpenRouter LLM (schedule optimization)
   ├─ Create calendar events (Google Calendar API)
   └─ Store scheduler_run in Postgres
       │
       ▼
4. Webhook to n8n (optional)
   └─ Sync to Coda (task records)
       │
       ▼
5. Observer Agent (daily 6 PM)
   ├─ Query Postgres events (last 24h)
   ├─ Fetch Google Calendar stats
   ├─ Fetch Coda task status (via coda-mcp)
   ├─ Call OpenRouter LLM (reflection)
   ├─ Post to Coda Daily Thread
   └─ Store reflection in Memory Gateway
```

### Memory Gateway Internal Architecture

```
┌─────────────────────────────────────────────────┐
│            POST /api/v1/memory/remember         │
│  ┌───────────────────────────────────────────┐  │
│  │ 1. Validate payload (Pydantic)            │  │
│  │ 2. Generate embedding (OpenRouter)        │  │
│  │ 3. Store in Postgres (events table)       │  │
│  │ 4. Store vector in Qdrant (events coll)   │  │
│  │ 5. Cache in Valkey (24h TTL)              │  │
│  │ 6. Send to mem0 for LTM extraction        │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            GET /api/v1/memory/recall            │
│  ┌───────────────────────────────────────────┐  │
│  │ 1. Check Valkey cache (cache key: query) │  │
│  │ 2. If miss:                               │  │
│  │    a. Generate query embedding            │  │
│  │    b. Semantic search in Qdrant (top-k)  │  │
│  │    c. Fetch full records from Postgres   │  │
│  │    d. Cache result in Valkey (1h TTL)    │  │
│  │ 3. Return results                         │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## Database Schema

### Postgres Tables

**events** - Audit log of all system events
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,          -- 'planning', 'scheduling', 'memory', 'reflection'
  event_source VARCHAR(50) NOT NULL,         -- 'planner', 'scheduler', 'observer', 'n8n', 'user'
  client_id INTEGER,                         -- Foreign key to client_profiles (existing table)
  payload JSONB NOT NULL,                    -- Event-specific data
  metadata JSONB DEFAULT '{}'::jsonb,        -- Tags, timestamps, etc.
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_source ON events(event_source);
CREATE INDEX idx_events_created ON events(created_at DESC);
```

**plans** - SOP and task plans
```sql
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  plan_title VARCHAR(500) NOT NULL,
  intent TEXT NOT NULL,                      -- Original user intent
  sop JSONB NOT NULL,                        -- Structured SOP (steps, tasks, estimates)
  client_id INTEGER,
  status VARCHAR(20) DEFAULT 'draft',        -- 'draft', 'scheduled', 'active', 'completed'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_plans_client ON plans(client_id);
CREATE INDEX idx_plans_status ON plans(status);
```

**scheduler_runs** - Scheduling execution history
```sql
CREATE TABLE scheduler_runs (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
  schedule_blocks JSONB NOT NULL,            -- Array of {start, end, task_id, calendar_event_id}
  client_id INTEGER,
  status VARCHAR(20) DEFAULT 'scheduled',    -- 'scheduled', 'completed', 'failed'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_scheduler_runs_plan ON scheduler_runs(plan_id);
CREATE INDEX idx_scheduler_runs_client ON scheduler_runs(client_id);
```

**graph_nodes** - Entity graph (Phase 1: Postgres, Phase 3: Neo4j)
```sql
CREATE TABLE graph_nodes (
  id SERIAL PRIMARY KEY,
  node_type VARCHAR(50) NOT NULL,            -- 'person', 'org', 'project', 'doc', 'decision'
  node_id VARCHAR(255) UNIQUE NOT NULL,      -- External ID (e.g., 'coda:task-123', 'gcal:event-abc')
  properties JSONB DEFAULT '{}'::jsonb,      -- Node attributes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_graph_nodes_type ON graph_nodes(node_type);
CREATE INDEX idx_graph_nodes_id ON graph_nodes(node_id);
```

**graph_edges** - Entity relationships
```sql
CREATE TABLE graph_edges (
  id SERIAL PRIMARY KEY,
  from_node_id VARCHAR(255) NOT NULL REFERENCES graph_nodes(node_id) ON DELETE CASCADE,
  to_node_id VARCHAR(255) NOT NULL REFERENCES graph_nodes(node_id) ON DELETE CASCADE,
  edge_type VARCHAR(50) NOT NULL,            -- 'depends_on', 'assigned_to', 'mentions', 'blocks'
  properties JSONB DEFAULT '{}'::jsonb,      -- Edge attributes (weight, timestamp)
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_node_id, to_node_id, edge_type)
);
CREATE INDEX idx_graph_edges_from ON graph_edges(from_node_id);
CREATE INDEX idx_graph_edges_to ON graph_edges(to_node_id);
```

**prompt_templates** - System prompts for LLM operations
```sql
CREATE TABLE prompt_templates (
  id SERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,  -- 'sop_generator', 'schedule_optimizer', 'daily_reflection'
  template_type VARCHAR(50) NOT NULL,          -- 'system', 'user', 'few_shot'
  content TEXT NOT NULL,                       -- Prompt text
  version VARCHAR(20) DEFAULT 'v1',            -- Versioning for A/B testing
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Qdrant Collections

**doc_chunks** - RAG document embeddings (Phase 2)
```python
{
  "vectors": {
    "size": 1536,         # OpenAI text-embedding-ada-002
    "distance": "Cosine"
  },
  "payload_schema": {
    "doc_id": "keyword",
    "chunk_index": "integer",
    "content": "text",
    "metadata": {
      "source": "text",
      "created_at": "datetime"
    }
  }
}
```

**events** - Event embeddings for semantic search
```python
{
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "event_id": "integer",  # Maps to Postgres events.id
    "event_type": "keyword",
    "client_id": "integer",
    "created_at": "datetime"
  }
}
```

**agent_memories** - mem0 long-term memory (managed by mem0)
```python
{
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "memory_id": "keyword",
    "client_id": "integer",
    "memory_type": "keyword",  # 'fact', 'preference', 'episode'
    "extracted_at": "datetime"
  }
}
```

**daily_threads** - Daily reflection embeddings
```python
{
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "reflection_id": "integer",
    "reflection_date": "datetime",
    "client_id": "integer"
  }
}
```

---

## Business Architecture Integration

### BestViable ERP Schema Integration

The Planner & Memory Architecture integrates deeply with the BestViable ERP personal ERP schema, following the Pattern Ontology for service delivery.

#### Business Object Hierarchy
```
Venture (Operations Studio, SaaS ventures)
  ↓
Offer (Marketing Ops Sprint, Diagnostic, Retainer)
  ↓
Engagement (Active commercial relationship)
  ↓
Project (Work container)
  ↓
Task (Executable work items)
  ↓
Deliverable (Work products)
  ↓
Result (Measured outcomes)
```

#### Pattern Object Hierarchy
```
Service Blueprint (End-to-end service map)
  ↓
Workflow (Canonical SOP for capability)
  ↓
Process Template (Context-specific checklist)
  ↓
Execution Run (Actual work session telemetry)
```

#### Key Integration Points

**1. Planner Engine → Service Blueprints**
- When planning for engagement, query offer → service blueprint
- Use blueprint structure as LLM context
- Generate Process Template adapted to engagement context

**2. Planner Engine → Workflows**
- Query existing workflows for capability (e.g., "Client Onboarding")
- Adapt workflow steps to specific client context
- Store lineage: process_template.workflow_id → workflows

**3. Planner Engine → Process Templates**
- Store generated plans as Process Templates in Coda
- Link to parent Workflow (if adapted from existing)
- Create tasks from Process Template checklist

**4. Scheduler Engine → Sprint**
- Query Sprint table for weekly capacity constraints
- Respect capacity_hrs limit
- Enforce billable_pct >= 60% when runway < 12 weeks
- Tasks auto-populate Sprint via computed relationship (scheduled_start_date in sprint week)

**5. Observer Agent → Execution Runs**
- Query execution_runs for actual work telemetry
- Compare actual_hours vs estimated_hours
- Detect workflow estimate drift (> 30% variance)
- Feed performance data to Memory Gateway for learning

**6. Memory Gateway → Graph Storage**
- Store full business + pattern hierarchy in graph_nodes/graph_edges
- Enable queries: "all execution runs for engagement X"
- Pattern-based learning: "similar projects using same blueprint took avg X hours"

#### Dual Storage Strategy

**Postgres (Intelligence Layer)**:
- events, plans, execution_runs
- graph_nodes, graph_edges
- prompt_templates
- Fast queries, vector search integration

**Coda (Business Layer)**:
- service_blueprints, workflows, process_templates
- ventures, offers, engagements, projects, tasks
- sprints, daily_thread
- Human-readable, manual override possible

**Integration via Coda MCP**:
- Read: blueprints, workflows, offers, engagements, sprints, finance_snapshot
- Write: process_templates, tasks, execution_runs

#### Sprint Evolution: Manual → Agentic

**Old Pattern (Manual)**:
1. Monday: User creates Sprint "2025-W49"
2. User drags 15 tasks into Sprint
3. User verifies billable_pct >= 60%

**New Pattern (Agentic)**:
1. Monday: Scheduler Engine creates Sprint (or uses existing)
2. Scheduler Engine allocates tasks, sets scheduled_start_date in week range
3. Sprint automatically computes tasks (where scheduled_start_date in sprint week)
4. Sprint.planned_billable_hrs auto-updates
5. User reviews in Coda, can manually adjust

**Key Change**: task.sprint_id removed, replaced by computed relationship via scheduled_start_date.

---

## Risks / Trade-offs

### Risk 1: RAM Overflow
**Description**: 5 new services + existing services exceed 3.8GB total RAM

**Mitigation:**
- Memory limits enforced via Docker (`--memory=200m`)
- Disable Observer Agent if needed (least critical, can run on-demand)
- Upgrade to 8GB droplet if necessary (+$24/month)

**Residual Risk:** Medium (can upgrade if needed)

### Risk 2: LLM API Costs Exceed Budget
**Description**: High token usage (planning, scheduling, reflections) costs >$200/month

**Mitigation:**
- Cache SOP templates in Postgres (avoid regeneration)
- Use cheaper models for non-critical tasks (GPT-3.5 vs Claude 3.5 Sonnet)
- Set monthly budget alerts in OpenRouter
- Rate limit planning requests (max 10/day in Phase 1)

**Residual Risk:** Low (single user, predictable usage)

### Risk 3: Google Calendar API Rate Limits
**Description**: Hit 10,000 requests/day quota, scheduling fails

**Mitigation:**
- Batch calendar operations (create multiple events in single request)
- Implement exponential backoff on 429 errors
- Cache calendar data (refresh every 5 minutes)
- Request quota increase if needed (typically granted for legitimate use)

**Residual Risk:** Low (single user unlikely to hit limits)

### Risk 4: Postgres Storage Growth
**Description**: `events` table grows >10GB, slows queries

**Mitigation:**
- Implement 90-day retention policy (archive old events)
- Partition `events` table by month (Postgres 12+ native partitioning)
- Archive to S3-compatible storage (DigitalOcean Spaces $5/month for 250GB)
- Monitor disk usage weekly

**Residual Risk:** Low (can archive before problem arises)

### Risk 5: OAuth Token Expiry
**Description**: Google Calendar refresh token expires, scheduling breaks

**Mitigation:**
- Implement automatic token refresh (Google SDK handles this)
- Email alert when refresh fails
- Store refresh token encrypted (not just access token)
- Re-authorize flow documented in runbook

**Residual Risk:** Low (handled by Google SDK)

### Risk 6: n8n Workflow Failures
**Description**: Silent failures in workflows, data not synced

**Mitigation:**
- Error webhooks to Slack (n8n built-in)
- Retry logic on HTTP request failures (n8n built-in, 3 retries with exponential backoff)
- Daily health check workflow (calls all services, alerts on failure)
- Manual workflow execution log review (weekly)

**Residual Risk:** Medium (n8n lacks robust error visibility)

### Risk 7: Service Dependencies
**Description**: Memory Gateway down → Planner/Scheduler/Observer fail

**Mitigation:**
- Graceful degradation (Planner works without Memory Gateway, just no personalization)
- Circuit breaker pattern (after 3 failures, skip Memory Gateway calls)
- Health checks expose dependency status (`/health` returns 200 but warns if deps down)

**Residual Risk:** Medium (acceptable for Phase 1, improve in Phase 2)

---

## Pattern Ontology Design Decisions

### Decision: Execution Runs Table
**Problem**: How to track actual work performance vs estimates for pattern learning?
**Options**:
1. Extend tasks table with actual_hours field
2. Create execution_runs table
3. Use Coda-only tracking

**Decision**: Create execution_runs table (Option 2)
**Rationale**:
- Tasks represent planned work, Execution Runs represent actual sessions
- One task may have multiple execution runs (paused/resumed work)
- Separates planning concerns from telemetry
- Enables pattern learning: "workflow X consistently takes Y hours"
- Can store in both Postgres (fast queries) and Coda (human visibility)

### Decision: Keep Sprint Table
**Problem**: Is Sprint redundant with Execution Runs?
**Options**:
1. Remove Sprint, use dynamic time-based grouping
2. Keep Sprint for capacity planning
3. Merge Sprint into Execution Runs

**Decision**: Keep Sprint (Option 2)
**Rationale**:
- Sprint = forward-looking capacity planning
- Execution Runs = backward-looking telemetry
- Sprint enforces financial constraint: billable_pct >= 60% when runway < 12 weeks
- Sprint provides weekly rhythm anchor for Daily Thread + Weekly Review
- Sprint auto-computes tasks (no manual assignment) via scheduled_start_date

### Decision: Process Template Storage Location
**Problem**: Where to store generated Process Templates?
**Options**:
1. Postgres only (plans.sop JSONB)
2. Coda only (process_templates table)
3. Both Postgres + Coda (dual storage)

**Decision**: Both (Option 3)
**Rationale**:
- Postgres: Fast queries, version history, LLM integration
- Coda: Human-readable, manual editing, workflow lineage
- Metadata in Postgres (plan_id, intent, client_id)
- Full template in Coda (checklist, steps, estimates)
- Coda MCP bridges the two systems

---

## Migration Plan

### Pre-Migration Checklist
- [ ] Backup Postgres: `pg_dump n8ndb > backup_$(date +%Y%m%d).sql`
- [ ] Tag current Docker images: `docker tag IMAGE:latest IMAGE:backup`
- [ ] Document current RAM/disk usage
- [ ] Verify Cloudflare Tunnel healthy

### Migration Steps (Phase 1a)

**Step 1: Deprecate Archon** (15 minutes)
```bash
ssh droplet
cd /home/david/services/archon
docker-compose config > /home/david/services/archive/archon-$(date +%Y%m%d).yml
docker-compose down
docker system prune -f  # Free disk space
free -h  # Verify RAM freed
```

**Step 2: Deploy Valkey** (15 minutes)
```bash
mkdir -p /home/david/services/valkey
scp valkey/docker-compose.yml droplet:/home/david/services/valkey/
ssh droplet "cd /home/david/services/valkey && docker-compose up -d"
docker exec valkey redis-cli ping  # Validate
```

**Step 3: Postgres Migration** (30 minutes)
```bash
scp 002_planner_memory_schema.sql droplet:/tmp/
ssh droplet "docker exec -i postgres psql -U n8n -d n8ndb < /tmp/002_planner_memory_schema.sql"
# Validate
ssh droplet "docker exec postgres psql -U n8n -d n8ndb -c '\dt' | grep -E '(events|plans|scheduler_runs|graph_nodes|graph_edges|prompt_templates)'"
```

**Step 4: Qdrant Collections** (15 minutes)
```bash
scp setup_collections.py droplet:/tmp/
ssh droplet "docker run --rm --network docker_syncbricks -v /tmp:/scripts python:3.11-slim bash -c 'pip install qdrant-client && python /scripts/setup_collections.py'"
# Validate
curl http://droplet:6333/collections | jq '.result.collections[] | .name'
```

**Rollback:** If migration fails, restore from backup:
```bash
ssh droplet "docker exec -i postgres psql -U n8n -d n8ndb < /tmp/backup_YYYYMMDD.sql"
```

### Migration Steps (Phase 1b-1e)

Each service deployed incrementally with rollback capability (stop container, delete).

---

## Open Questions

1. **Rate limiting**: Should Memory Gateway implement per-user rate limiting? (Deferred to Phase 5 multi-tenant)
2. **Backup strategy**: Automate Postgres backups to S3? (Manual for Phase 1, automate in Phase 2)
3. **Monitoring**: Deploy Prometheus + Grafana? (Uptime-Kuma sufficient for Phase 1)
4. **API authentication**: Add JWT/API keys between services? (Network isolation sufficient for Phase 1)
5. **Logging**: Centralized logging (Loki + Grafana)? (Docker logs + Dozzle sufficient for Phase 1)

**Decision:** All deferred to Phase 2+ to minimize complexity and ship faster.

---

## Future Phases

### Phase 2: RAG Pipeline (2-4 weeks)
**Scope**: Document ingestion and semantic search enhancement

**Capabilities:**
- Document ingestion via Docling (PDF parsing, layout-aware chunking)
- Web scraping via Crawl4AI (JavaScript rendering, markdown extraction)
- Advanced mem0 features (episodic memory, temporal context)
- Populate `doc_chunks` Qdrant collection (currently empty)

**Why deferred from Phase 1:**
- Core planning/scheduling works without docs (uses Coda data)
- Adds complexity (crawling, parsing, chunking pipelines)
- Phase 1 delivers value first, Phase 2 enhances quality

### Phase 3: Graph Database Migration (1-2 months)
**Scope**: Postgres graph → Neo4j AuraDB for advanced graph queries

**Capabilities:**
- Migrate `graph_nodes` and `graph_edges` to Neo4j
- Multi-hop traversal queries (e.g., "Find all tasks affected by Service Blueprint change")
- Graph algorithms (PageRank for pattern importance, community detection for capability clustering)
- Graphiti integration (LLM-powered graph construction from unstructured data)

**Why deferred from Phase 1:**
- Postgres graph tables sufficient for simple hierarchy queries
- Neo4j requires learning Cypher query language
- Free tier (50MB) constrains design, self-hosting requires 2-4GB RAM

### Phase 4: Centralized Planning UI (2-3 months)
**Scope**: Build integrated UI for memory/context/model/prompt/task management

**Critical Gap Identified**:
The Phase 1 backend architecture (Memory Gateway, Planner Engine, Scheduler Engine, Observer Agent) provides powerful APIs but lacks a unified control interface. This was a key capability in the deprecated Archon system.

**UI Requirements (captured from investigate-archon-memory-architecture investigation):**

#### 1. Core Features
- **Memory Browser**: View/edit stored memories, events, execution runs, pattern performance
  - Filter by type (fact, preference, episode), client_id, date range
  - Manual memory creation (direct calls to Memory Gateway)
  - Bulk operations (archive old memories, export for backup)

- **Planning Interface**: Review/modify generated Process Templates before execution
  - Display LLM-generated checklist with estimated hours
  - Inline editing (add/remove steps, adjust estimates)
  - Approval workflow (draft → approved → executed)
  - Version history (compare v1 vs v2 of template)

- **Schedule Visualization**: Calendar view with task distribution, capacity analysis
  - Week view with color-coded tasks (billable vs internal)
  - Drag-and-drop rescheduling (updates scheduled_start_date, auto-updates Sprint)
  - Sprint capacity bar (shows billable_pct, warns if < 60% when runway < 12 weeks)
  - Conflict detection (overlapping events, overbooked days)

- **Reflection Dashboard**: Daily/weekly Observer insights, pattern drift alerts
  - Daily Thread timeline (scrollable history)
  - Weekly review summaries with trend charts (actual vs estimated hours)
  - Pattern performance table (workflows with variance > 30%)
  - Actionable recommendations ("Workflow X consistently over-runs, review estimates")

- **Prompt Management**: Edit/version prompt templates in Postgres
  - Live editor for `prompt_templates` table (sop_generator, scheduler_optimizer, etc.)
  - Version control (create v2, A/B test v1 vs v2, rollback)
  - Preview LLM output (test prompt changes before saving)
  - Usage stats (which prompts most frequently used, token costs)

- **Model Selection**: Choose LLM for different operations
  - Dropdown per operation type (planning, scheduling, reflection, pattern analysis)
  - Model library (Claude 3.5 Sonnet, GPT-4, GPT-3.5, Llama 3.1)
  - Cost estimation ("Switching to GPT-3.5 saves ~$40/month")
  - Temperature/max_tokens sliders for tuning

- **Credential Management**: OAuth tokens, API keys, service health
  - Google Calendar OAuth status (connected/expired, re-authorize button)
  - OpenRouter API key masking (last 4 digits visible)
  - Service health dashboard (Memory Gateway, Planner, Scheduler, Observer, Valkey, Postgres, Qdrant)
  - Connection test buttons ("Test Coda MCP connection")

#### 2. Integration Points (API endpoints)
- **Memory Gateway**:
  - `GET /api/v1/memory/recall?query={q}&client_id={id}&k={limit}` - Browse memories
  - `POST /api/v1/memory/remember` - Create manual memory entry
  - `GET /api/v1/memory/events?start_date={date}&end_date={date}` - Event timeline

- **Planner Engine**:
  - `GET /api/v1/planner/plans?client_id={id}&status={draft|active}` - List plans
  - `GET /api/v1/planner/plans/{plan_id}` - View plan details
  - `PUT /api/v1/planner/plans/{plan_id}` - Edit plan (checklist, estimates)
  - `POST /api/v1/planner/plans/{plan_id}/approve` - Approve draft plan

- **Scheduler Engine**:
  - `GET /api/v1/scheduler/calendar?start_date={date}&end_date={date}` - Fetch calendar events
  - `PUT /api/v1/scheduler/calendar/{event_id}` - Reschedule event
  - `GET /api/v1/scheduler/sprints/{sprint_id}` - Sprint capacity analysis

- **Observer Agent**:
  - `GET /api/v1/observer/reflections?mode={daily|weekly}&limit={n}` - Reflection history
  - `GET /api/v1/observer/patterns` - Pattern performance metrics

- **Coda MCP** (via Memory Gateway proxy):
  - `GET /api/v1/coda/execution_runs?project_id={id}` - Execution run telemetry
  - `GET /api/v1/coda/workflows` - Workflow list with performance stats

#### 3. Technology Stack Options

**Option A: Next.js Dashboard** (recommended for Phase 4)
- **Pros**: Modern React framework, TypeScript support, API routes for BFF pattern, Vercel deployment
- **Cons**: New codebase to maintain, requires frontend expertise
- **Fit**: Best for polished, standalone UI with authentication (NextAuth.js for Google OAuth)

**Option B: Extend n8n UI with Custom Nodes**
- **Pros**: Leverage existing n8n infrastructure, workflow-centric UX
- **Cons**: Limited UI customization, not designed for human-facing dashboards
- **Fit**: Good for power users comfortable with workflow paradigm, poor for general usability

**Option C: Standalone React/Vue App**
- **Pros**: Maximum flexibility, lightweight (no SSR), can deploy to Cloudflare Pages
- **Cons**: Manual routing, state management, auth implementation
- **Fit**: Similar to Option A but more DIY

**Option D: CLI with Rich TUI (Textual, Rich)**
- **Pros**: Fast to build, terminal-native, no deployment complexity
- **Cons**: No graphical calendar view, limited for non-technical users
- **Fit**: Good for developer-first tools, poor for planning/scheduling UX

**Option E: Open WebUI** (user preference for later phases)
- **Pros**: Existing chat interface with memory, RAG, and tool integration; supports both ChatGPT and Claude API subscriptions; self-hosted with Docker; extensible with custom functions
- **Cons**: Chat-centric UX (not ideal for calendar/planning views), requires adaptation of Memory Gateway APIs to Open WebUI's function format, less visual than dashboard options
- **Fit**: Best for conversational interaction with planning system, good for users who prefer chat over dashboards, aligns with personal chat interface preference
- **Integration Path**:
  - Deploy Open WebUI via Docker on droplet (Traefik routing to `chat.bestviable.com`)
  - Connect Memory Gateway, Planner, Scheduler APIs as Open WebUI functions
  - Use ChatGPT/Claude subscriptions for LLM calls (offload cost from OpenRouter)
  - Estimated RAM: 200-300MB

**Recommendation**: For Phase 4, evaluate **Option E (Open WebUI)** as primary personal interface alongside **Option A (Next.js)** for visual planning/calendar features. Open WebUI handles conversational workflows well, while Next.js provides dashboard views for calendar, Sprint capacity, and pattern performance analytics. Deploy both if RAM allows (~300-450MB combined), or start with Open WebUI and add Next.js dashboard later if visual planning needs emerge.

#### 4. UI Development Timeline (Phase 4)

**Week 1-2: Core Layout & Authentication**
- [ ] Next.js project setup with TypeScript
- [ ] Google OAuth integration (NextAuth.js)
- [ ] Layout components (sidebar nav, header, footer)
- [ ] API client (fetch wrappers for all backend services)

**Week 3-4: Memory & Planning Screens**
- [ ] Memory browser (table view, filters, search)
- [ ] Plan list (draft/active tabs, approval workflow)
- [ ] Plan editor (inline checklist editing, drag-reorder steps)

**Week 5-6: Calendar & Reflection Screens**
- [ ] Calendar grid component (FullCalendar.js or react-big-calendar)
- [ ] Drag-and-drop task rescheduling
- [ ] Sprint capacity bar chart
- [ ] Reflection timeline (Daily Thread cards, expandable)

**Week 7-8: Settings & Admin**
- [ ] Prompt template editor (CodeMirror for syntax highlighting)
- [ ] Model selection dropdowns (per operation type)
- [ ] Credential management (OAuth re-auth, API key rotation)
- [ ] Service health dashboard (polling `/health` endpoints)

**Week 9: Polish & Deploy**
- [ ] Responsive design (mobile/tablet support)
- [ ] Loading states, error handling
- [ ] Docker image, Traefik labels
- [ ] Deploy to droplet, test end-to-end

**Why deferred from Phase 1:**
- Phase 1 backend APIs are fully functional via curl/Postman/scripts
- UI is productivity enhancement, not functional blocker
- Allows backend to stabilize before frontend work begins
- Reduces Phase 1 scope for faster delivery (18-25 hours → 12-16 hours)

### Phase 5: Multi-Tenant SaaS (3-6 months)
**Scope**: Ops Studio customer expansion

**Capabilities:**
- Multi-tenant data isolation (client_id → workspace_id)
- Billing integration (Stripe for subscription management)
- Team collaboration (shared plans, role-based access control)
- White-label UI (custom branding per workspace)

**Why deferred from Phase 1:**
- Single-user architecture simpler, faster to ship
- Multi-tenancy requires security review (row-level security in Postgres)
- Billing adds compliance overhead (PCI, GDPR)

---

## Success Criteria

### Phase 1a (Infrastructure)
- ✅ Archon removed, RAM freed (verify with `free -h`)
- ✅ Valkey running, responding to `PING`
- ✅ Postgres migration complete, 6 tables exist
- ✅ Qdrant 4 collections created

### Phase 1b (Memory Gateway)
- ✅ Health endpoint responds 200 OK
- ✅ `remember()` stores in all 3 backends (Postgres, Qdrant, Valkey)
- ✅ `recall()` returns results < 200ms (p95)
- ✅ RAM usage <200MB

### Phase 1c (Planner & Scheduler)
- ✅ Planner generates SOP in <10 seconds
- ✅ Scheduler creates calendar events successfully
- ✅ Google Calendar OAuth flow completed
- ✅ Combined RAM usage <400MB

### Phase 1d (n8n)
- ✅ 5 workflows created, all active
- ✅ Webhook tests succeed (200 OK responses)
- ✅ Events logged to Postgres

### Phase 1e (Observer)
- ✅ Daily reflection generated and posted to Coda
- ✅ Weekly reflection generated and posted to Coda
- ✅ n8n cron triggers at 6 PM
- ✅ RAM usage <150MB when running

### Overall
- ✅ Total RAM usage <700MB peak (all services)
- ✅ No service crashes in first 48 hours
- ✅ End-to-end test: Intent → Plan → Calendar → Reflection (complete flow)
