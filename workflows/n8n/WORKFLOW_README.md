# N8N Memory Workflows

- entity: n8n_workflows
- level: operational
- zone: internal
- version: v01
- tags: [n8n, workflows, memory, orchestration]
- source_path: /workflows/n8n/WORKFLOW_README.md
- date: 2025-11-04

---

## Overview

Three core workflows implement memory orchestration for the control plane:

1. **memory-assemble** - Retrieve context before model inference
2. **memory-writeback** - Persist facts/episodes after conversation
3. **nightly-cleanup** - Maintenance (purge expired state, archive old episodes)

---

## Deployment

**Via N8N UI:**
1. Open https://n8n.bestviable.com
2. Settings → Workflows → Import
3. Upload JSON file

**Via API:**
```bash
curl -X POST https://n8n.bestviable.com/api/v1/workflows \
  -H "X-N8N-API-KEY: $N8N_API_KEY" \
  -H "Content-Type: application/json" \
  -d @memory-assemble.json
```

---

## Workflow 1: memory-assemble

**Purpose:** Retrieve personalized context before chat

**Trigger:** Webhook `POST /webhook/memory/assemble`

**Input:**
```json
{
  "client_id": 1,
  "query": "What do you know about my projects?"
}
```

**Flow:**
1. Extract client_id & query
2. Call OpenRouter embeddings API → get vector
3. Search Qdrant/pgvector for similar chunks (top 10)
4. Fetch client profile from Postgres
5. Fetch recent episodes (past 7 days)
6. Merge all context
7. Return JSON

**Output:**
```json
{
  "client_id": 1,
  "profile": { ... },
  "similar_chunks": [ ... ],
  "recent_episodes": [ ... ],
  "timestamp": "2025-11-04T..."
}
```

**Status:** Template ready, needs n8n node implementation

---

## Workflow 2: memory-writeback

**Purpose:** Persist facts and episodes after conversation

**Trigger:** Webhook `POST /webhook/memory/writeback`

**Input:**
```json
{
  "client_id": 1,
  "conversation": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

**Flow:**
1. Extract conversation transcript
2. Call LLM (OpenRouter) to extract facts
3. Upsert facts to Postgres client_profiles table
4. Call LLM to summarize conversation
5. Insert episode to episodes table
6. Optionally: embed summary & store to pgvector
7. Return success

**Status:** Template ready, needs n8n node implementation

---

## Workflow 3: nightly-cleanup

**Purpose:** Database maintenance

**Trigger:** Cron `0 2 * * *` (2 AM daily)

**Flow:**
1. Delete expired working_state entries
2. Archive low-importance episodes (< 3 stars, > 90 days old)
3. Run VACUUM ANALYZE on Postgres
4. Send notification webhook (optional)

**Status:** Template ready, needs n8n node implementation

---

## Integration Points

### Open WebUI Hooks

**Pre-request Hook:** Call `/webhook/memory/assemble` before model inference
```javascript
// Hook payload
{
  "client_id": "{{ user.id }}",
  "query": "{{ prompt }}"
}
```

**Post-request Hook:** Call `/webhook/memory/writeback` after response
```javascript
{
  "client_id": "{{ user.id }}",
  "conversation": {{ messages }}
}
```

### Credentials Needed in N8N

- `OpenRouter API Key` - For embeddings & LLM calls
- `Postgres Credentials` - DSN for profile/episodes tables
- `Qdrant API Key` (if using Cloud) - For vector search
- `Redis Credentials` (optional) - For caching

---

## Testing

**Test memory-assemble:**
```bash
curl -X POST https://n8n.bestviable.com/webhook/memory/assemble \
  -H "Content-Type: application/json" \
  -d '{"client_id": 1, "query": "test"}'
```

**Test memory-writeback:**
```bash
curl -X POST https://n8n.bestviable.com/webhook/memory/writeback \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "conversation": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi there"}
    ]
  }'
```

**Verify execution:** N8N → Executions tab

---

## Next Steps (For Next Agent)

1. Create workflows in N8N (use UI or import JSON)
2. Configure Open WebUI hooks
3. Test with sample data
4. Monitor execution logs
5. Adjust as needed
