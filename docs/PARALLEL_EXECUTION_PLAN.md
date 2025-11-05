# Parallel Execution Plan: Memory Control Plane Phase 3

- entity: execution_plan
- level: operational
- zone: internal
- version: v01
- tags: [phase3, parallel, workflows, n8n, memory]
- source_path: /docs/PARALLEL_EXECUTION_PLAN.md
- date: 2025-11-05

---

## Overview

While n8n workflows are being built by another agent, execute 5 parallel workstreams to prepare the full memory control plane stack for production.

**Estimated Duration:** 2-3 hours total (tasks can overlap)
**Blocking Factor:** None (all tasks are independent or have clear handoff points)

---

## Workstream 1: Open WebUI Configuration

**Objective:** Prepare Open WebUI to call n8n webhooks once endpoints are live

**Tasks:**

### 1.1 Configure Pre-Request Hook
- **Access:** Open WebUI Admin → Settings → Integrations → Pre-Request Hook
- **Endpoint:** `https://n8n.bestviable.com/webhook/memory/assemble`
- **Trigger:** Before every chat message inference
- **Payload structure:**
```javascript
{
  "client_id": "{{ user.id }}",
  "query": "{{ prompt }}",
  "timestamp": new Date().toISOString()
}
```

### 1.2 Configure Post-Request Hook
- **Access:** Open WebUI Admin → Settings → Integrations → Post-Request Hook
- **Endpoint:** `https://n8n.bestviable.com/webhook/memory/writeback`
- **Trigger:** After model response is generated
- **Payload structure:**
```javascript
{
  "client_id": "{{ user.id }}",
  "conversation": [
    {{ messages }}
  ],
  "response": "{{ response }}",
  "timestamp": new Date().toISOString()
}
```

### 1.3 Set Up Client Metadata
Create per-client entries with tags and identifiers for meaningful webhook data:

**Database table to populate (Postgres):**
```sql
-- In the Open WebUI schema, or a custom memory schema:
CREATE TABLE IF NOT EXISTS client_profiles (
  client_id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sample insert:
INSERT INTO client_profiles (user_id, full_name, tags)
VALUES ('user_123', 'David Kellam', '["founder", "memory-test"]');
```

**In Open WebUI UI:**
1. Create test user: `test-client-001`
2. Tag with: `memory-test`, `phase3-eval`
3. Set full name: `Test Client 001`
4. Record the `user_id` (used in hook payloads)

### 1.4 Test Hook Configuration
Once n8n endpoints are live, test with:
```bash
# 1. Start chat in Open WebUI
curl -X POST https://openweb.bestviable.com/api/chat \
  -H "Authorization: Bearer $OPENWEBUI_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-client-001",
    "prompt": "What do you know about my memory?"
  }'

# 2. Check n8n execution logs for webhook hit
# https://n8n.bestviable.com → Executions tab
```

**Status:** Ready to configure (awaiting n8n endpoint availability)

---

## Workstream 2: Postgres Schema + Qdrant Collection Design

**Objective:** Prepare database infrastructure so n8n can write immediately upon workflow activation

### 2.1 Postgres DDL for Memory Tables

**Connection Details:**
```
Host: postgres (internal, via n8n_syncbricks network)
Port: 5432
User: n8n
Database: n8ndb
```

**Table 1: memory_entries (RAG vector storage)**
```sql
CREATE TABLE IF NOT EXISTS memory_entries (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id),
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- pgvector for OpenRouter embeddings
  source_type VARCHAR(50),  -- 'episode', 'fact', 'working_state'
  metadata JSONB DEFAULT '{}'::jsonb,
  ttl_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_memory_client_created ON memory_entries(client_id, created_at DESC);
CREATE INDEX idx_memory_embedding ON memory_entries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_memory_expires ON memory_entries(expires_at);
```

**Table 2: memory_facts (Upserted from LLM extraction)**
```sql
CREATE TABLE IF NOT EXISTS memory_facts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id),
  fact_key VARCHAR(255),  -- Extracted key (e.g., "company_name", "project_active")
  fact_value TEXT NOT NULL,  -- Extracted value
  confidence NUMERIC(3,2),  -- 0.0-1.0 confidence score from LLM
  source_episode_id INTEGER,  -- Which episode this came from
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, fact_key)  -- Upsert on fact_key
);

CREATE INDEX idx_facts_client ON memory_facts(client_id);
CREATE INDEX idx_facts_updated ON memory_facts(updated_at DESC);
```

**Table 3: working_state (Temporary conversation state)**
```sql
CREATE TABLE IF NOT EXISTS working_state (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id),
  session_id VARCHAR(255) NOT NULL,
  state_key VARCHAR(100),
  state_value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, session_id, state_key)
);

CREATE INDEX idx_state_client_session ON working_state(client_id, session_id);
CREATE INDEX idx_state_expires ON working_state(expires_at);
```

**Table 4: episodes (Conversation summaries)**
```sql
CREATE TABLE IF NOT EXISTS episodes (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id),
  conversation_hash VARCHAR(64) UNIQUE,
  summary TEXT NOT NULL,
  embedding VECTOR(1536),  -- Summary embedding for similarity search
  rating INTEGER DEFAULT 0,  -- User rating (1-5)
  tags JSONB DEFAULT '[]'::jsonb,
  message_count INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_episodes_client ON episodes(client_id, created_at DESC);
CREATE INDEX idx_episodes_rating ON episodes(rating DESC) WHERE rating > 0;
CREATE INDEX idx_episodes_embedding ON episodes USING ivfflat (embedding vector_cosine_ops);
```

### 2.2 Qdrant Collection Schema

**Collection Name:** `memory_vectors`
**Vector Size:** 1536 (OpenRouter embeddings)
**Distance Metric:** Cosine
**Payload Structure:**

```json
{
  "collection_name": "memory_vectors",
  "vectors": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "client_id": { "type": "integer" },
    "source_type": { "type": "text" },
    "content": { "type": "text" },
    "created_at": { "type": "integer" },
    "ttl_days": { "type": "integer" }
  }
}
```

**Indices:**
- `client_id` (for filtering by client)
- `source_type` (for filtering by memory type: fact, episode, working_state)
- `created_at` (for time-range queries)

### 2.3 Deployment Steps

**Option A: Direct SQL (if you have psql access)**
```bash
ssh tools-droplet-agents "docker exec postgres psql -U n8n -d n8ndb << 'SQL'
CREATE TABLE IF NOT EXISTS memory_entries (
  id SERIAL PRIMARY KEY,
  ...
);
-- (run full DDL above)
SQL
"
```

**Option B: Via N8N Postgres Nodes**
1. Create "Setup Memory Tables" workflow in N8N
2. Add Postgres Execute Query node
3. Paste DDL statements
4. Execute before launching main workflows

**Option C: Terraform/Liquibase** (for future reproducibility)
- Create `/infra/postgres/migrations/001_memory_tables.sql`
- Track schema versioning in Git

**Status:** DDL ready, deployment pending database access confirmation

---

## Workstream 3: Documentation Refresh

**Objective:** Update playbooks with webhook contracts, CLI steps, and architecture diagrams

### 3.1 Update Droplet Memory Plan

**File:** `/Droplet Memory Plan.md`
**Additions:**

1. **Webhook Contract Section**
```markdown
### Webhook Contracts

#### POST /webhook/memory/assemble
Request:
{
  "client_id": integer,
  "query": string,
  "timestamp": ISO8601
}

Response:
{
  "client_id": integer,
  "profile": { name, tags, metadata },
  "similar_chunks": [ { content, score, source_type } ],
  "recent_episodes": [ { summary, rating, created_at } ],
  "timestamp": ISO8601,
  "execution_time_ms": integer
}

#### POST /webhook/memory/writeback
Request:
{
  "client_id": integer,
  "conversation": [ { role, content } ],
  "response": string,
  "timestamp": ISO8601
}

Response:
{
  "success": boolean,
  "episode_id": integer,
  "facts_upserted": integer,
  "state_saved": boolean,
  "timestamp": ISO8601
}
```

2. **Architecture Diagram**
```
User Chat (Open WebUI)
         ↓
    [Pre-Hook]
         ↓
    https://n8n.bestviable.com/webhook/memory/assemble
         ↓
    [N8N Workflow: memory-assemble]
    ├─ Call OpenRouter embeddings
    ├─ Search Qdrant (vector similarity)
    ├─ Fetch Postgres profile + episodes
    └─ Merge & return context
         ↓
    [LLM Inference with Context]
         ↓
    [Post-Hook]
         ↓
    https://n8n.bestviable.com/webhook/memory/writeback
         ↓
    [N8N Workflow: memory-writeback]
    ├─ Extract facts (LLM)
    ├─ Upsert to Postgres
    ├─ Embed summary (OpenRouter)
    ├─ Store to Qdrant + Postgres
    └─ Return success
         ↓
    Chat Response to User
```

3. **Troubleshooting Section**
- Webhook timeout (check n8n execution queue)
- 401 Unauthorized (verify API keys in n8n credentials)
- Vector embedding failures (check OpenRouter quota)
- Postgres connection errors (check network isolation)

### 3.2 Expand WORKFLOW_README.md

**File:** `/workflows/n8n/WORKFLOW_README.md`
**Additions:**

1. **Implementation Checklist**
```markdown
- [ ] memory-assemble workflow created in N8N
- [ ] webhook endpoint: /webhook/memory/assemble
- [ ] OpenRouter credentials configured
- [ ] Postgres connection tested
- [ ] Qdrant vector search tested
- [ ] Pre-hook configured in Open WebUI
- [ ] Test with curl (sample command provided)
- [ ] Metrics tracked in Dozzle
```

2. **CLI Testing Guide**
```bash
# Test memory-assemble
curl -X POST https://n8n.bestviable.com/webhook/memory/assemble \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "query": "What projects am I working on?"
  }'

# Expected response (within 2 seconds):
{
  "client_id": 1,
  "profile": { ... },
  "similar_chunks": [ ... ],
  "recent_episodes": [ ... ],
  "timestamp": "2025-11-05T...",
  "execution_time_ms": 1234
}
```

3. **Performance Targets**
- memory-assemble: < 2s (embedding + vector search + DB queries)
- memory-writeback: < 3s (LLM extraction + upserts + embedding)
- nightly-cleanup: < 30s (maintenance window 2 AM)

### 3.3 Create Decision Log

**File:** `/docs/architecture/PHASE3_DECISIONS.md`
**Content:**
- Why pgvector + Qdrant (hybrid approach)
- Hook placement (pre vs. post vs. both)
- TTL strategy for memory decay
- Confidence scoring on facts

**Status:** Documentation outline ready, implementation in progress

---

## Workstream 4: Secrets Management Research

**Objective:** Shortlist OSS secrets manager for API keys, DB credentials post-go-live

### 4.1 Evaluation Matrix

| Criteria | Infisical | Vault | Notes |
|----------|-----------|-------|-------|
| **Setup Time** | 15 mins | 30 mins | Infisical has faster Docker setup |
| **API Key Rotation** | Automatic | Manual | Infisical can auto-rotate |
| **Audit Logging** | ✅ Built-in | ✅ Enterprise | Both track access |
| **Cost** | Free tier | Open source | Both OSS options available |
| **Docker Integration** | ✅ Easy | ✅ Moderate | Both have Docker images |
| **N8N Integration** | Partial | Good | Vault has native N8N support |
| **Learning Curve** | Low | Moderate | Infisical more intuitive |
| **Production Ready** | ✅ Yes | ✅ Yes | Both suitable for prod |

### 4.2 Recommendation: Infisical

**Why:**
1. Faster setup (critical for 2GB droplet)
2. Auto-rotation for API keys (reduces manual ops)
3. Better Open WebUI/N8N integration
4. Lower resource footprint
5. Built-in audit logging

**Deployment Plan:**
```bash
# 1. Deploy Infisical as Docker service
docker run -d --name infisical \
  -p 127.0.0.1:8080:8080 \
  -e ENCRYPTION_KEY=$(openssl rand -base64 32) \
  infisical/infisical

# 2. Set up Postgres backend for secret storage
# 3. Configure N8N to fetch credentials from Infisical API
# 4. Create rotation policies for:
#    - OPENROUTER_API_KEY
#    - CODA_API_TOKEN
#    - DATABASE_PASSWORD
#    - CLOUDFLARE_TUNNEL_TOKEN
```

### 4.3 Integration Points

**N8N Credentials:**
- Instead of storing secrets in N8N directly, use Infisical API calls
- Create N8N "HTTP Request" nodes that fetch from Infisical before workflow execution
- Add 60-second rotation check (low overhead)

**Open WebUI:**
- Store OPENROUTER_API_KEY in Infisical
- Retrieve at startup via environment variable injection

**Postgres:**
- Store connection string (user, password, host) in Infisical
- Auto-rotate password every 90 days

**Status:** Research complete, deployment plan ready. Can proceed post-Phase 3.

---

## Workstream 5: Monitoring Hooks (Uptime Kuma + Dozzle)

**Objective:** Surface failures quickly once webhook traffic flows

### 5.1 Uptime Kuma Webhook Monitors

**Create 4 new monitors in Uptime Kuma:**

#### Monitor 1: memory/assemble Endpoint
- **Name:** N8N Memory Assemble Webhook
- **Type:** HTTP(s)
- **URL:** `https://n8n.bestviable.com/webhook/memory/assemble`
- **Method:** POST
- **Body:** `{"client_id": 1, "query": "test"}`
- **Interval:** Every 5 minutes
- **Alert on:** Response time > 3s OR status != 200

#### Monitor 2: memory/writeback Endpoint
- **Name:** N8N Memory Writeback Webhook
- **Type:** HTTP(s)
- **URL:** `https://n8n.bestviable.com/webhook/memory/writeback`
- **Method:** POST
- **Body:** `{"client_id": 1, "conversation": [{"role": "user", "content": "test"}]}`
- **Interval:** Every 10 minutes
- **Alert on:** Response time > 5s OR status != 200

#### Monitor 3: Postgres Connection (from N8N container)
- **Name:** N8N Postgres Health
- **Type:** TCP
- **Host:** postgres
- **Port:** 5432
- **Interval:** Every 2 minutes
- **Alert on:** Connection fails

#### Monitor 4: Qdrant Vector Search
- **Name:** N8N Qdrant Health
- **Type:** HTTP(s)
- **URL:** `http://qdrant:6333/health`
- **Interval:** Every 5 minutes
- **Alert on:** Status != 200

### 5.2 Dozzle Log Filters

**Access:** `https://logs.bestviable.com`

**Create 3 filter dashboards:**

#### Dashboard 1: N8N Workflow Executions
```
Filter: container=n8n AND (level=error OR level=warn)
Display: Last 100 logs
Sort: Most recent first
```

#### Dashboard 2: Memory Webhook Hits
```
Filter: container=n8n AND message contains webhook AND (memory-assemble OR memory-writeback)
Display: Last 50 logs
Sort: Most recent first
```

#### Dashboard 3: Database Errors
```
Filter: (container=postgres OR container=n8n) AND (error OR ERROR OR Error)
Display: Last 100 logs
Sort: Most recent first
```

### 5.3 Alert Configuration

**Webhook Alerts (in Uptime Kuma):**
- **Channel:** N8N Execution Webhook
- **Endpoint:** `https://n8n.bestviable.com/webhook/alerts`
- **Trigger:** Any monitor down for > 5 minutes
- **Payload:**
```json
{
  "monitor_name": "{{ monitor_name }}",
  "status": "{{ status }}",
  "uptime": "{{ uptime }}%",
  "response_time": "{{ response_time }}ms",
  "timestamp": "{{ timestamp }}"
}
```

### 5.4 Dashboard Setup in Open WebUI

**Create monitoring dashboard view:**
1. Open WebUI Admin → Custom Integrations
2. Add iframe widget pointing to Uptime Kuma status page
3. Add iframe widget pointing to Dozzle filters
4. Auto-refresh every 30 seconds

**Status:** Configuration ready, can be set up immediately

---

## Execution Timeline

```
Start: Phase 3 n8n workflow builds (parallel)
├── T+0:00   → Start Workstreams 1, 2, 3, 4, 5 in parallel
├── T+0:30   → Workstream 2 (Postgres DDL) complete
├── T+1:00   → Workstream 3 (Docs) complete
├── T+1:30   → Workstream 1 (OpenWebUI config) complete
├── T+2:00   → Workstream 5 (Monitoring) complete
├── T+2:30   → Workstream 4 (Secrets research) complete
├── T+2:30   → N8N workflows expected ready (from other agent)
└── T+3:00   → All systems ready for end-to-end testing
```

---

## Success Criteria

- ✅ Open WebUI pre/post hooks configured
- ✅ Postgres schema created with indices
- ✅ Qdrant collection ready for writes
- ✅ Documentation updated with contracts + diagrams
- ✅ Uptime Kuma monitoring all webhook endpoints
- ✅ Dozzle filters ready for error tracking
- ✅ Secrets manager evaluated and deployment plan ready

---

## Next Steps

1. Execute all 5 workstreams in parallel
2. Merge results as n8n workflows complete
3. Run end-to-end integration test (chat → memory → persistence)
4. Document actual performance metrics
5. Proceed to Phase 4 (optional enhancements)

---

**Generated:** 2025-11-05 03:45 PST
**Status:** Ready for parallel execution
**Estimated Duration:** 2-3 hours (can overlap with n8n workflow building)
