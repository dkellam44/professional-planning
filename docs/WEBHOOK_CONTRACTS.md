# N8N Webhook Contracts - Phase 3

- entity: webhook_contracts
- level: operational
- zone: internal
- version: v01
- tags: [webhooks, n8n, memory, contracts, phase3]
- source_path: /docs/WEBHOOK_CONTRACTS.md
- date: 2025-11-05

---

## Overview

This document defines the exact request/response contracts for the three core webhooks that wire Open WebUI to the n8n memory orchestration engine.

---

## Webhook 1: memory/assemble

**Purpose:** Retrieve personalized context before chat message inference

**Endpoint:** `POST https://n8n.bestviable.com/webhook/memory/assemble`

**When Called:** Before every chat message (Open WebUI pre-request hook)

### Request

```json
{
  "client_id": 1,
  "query": "What do you know about my projects?",
  "timestamp": "2025-11-05T08:30:00.000Z"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client_id` | integer | ✅ | Unique identifier for the user/client (from `client_profiles.client_id`) |
| `query` | string | ✅ | The user's chat message or query |
| `timestamp` | ISO8601 | ❌ | When the request was made (for audit/logging) |

### Response

```json
{
  "success": true,
  "client_id": 1,
  "profile": {
    "full_name": "David Kellam",
    "tags": ["founder", "memory-test"],
    "metadata": { "tier": "test", "region": "us-west" }
  },
  "similar_chunks": [
    {
      "content": "Currently working on portfolio automation project",
      "score": 0.92,
      "source_type": "episode",
      "created_at": "2025-11-04T15:30:00Z"
    },
    {
      "content": "Planning to integrate Coda with n8n workflows",
      "score": 0.87,
      "source_type": "fact",
      "created_at": "2025-11-03T12:00:00Z"
    }
  ],
  "recent_episodes": [
    {
      "id": 5,
      "summary": "Discussed memory control plane architecture",
      "rating": 5,
      "message_count": 12,
      "created_at": "2025-11-05T02:00:00Z"
    },
    {
      "id": 4,
      "summary": "Reviewed infrastructure deployment options",
      "rating": 4,
      "message_count": 8,
      "created_at": "2025-11-04T18:00:00Z"
    }
  ],
  "execution_time_ms": 1245,
  "timestamp": "2025-11-05T08:30:01.245Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the assembly succeeded |
| `client_id` | integer | Echo of the request client_id |
| `profile` | object | Client profile (full_name, tags, metadata) |
| `similar_chunks` | array | Top similar memory entries (vector search results) |
| `recent_episodes` | array | Recent conversation summaries (sorted by date, newest first) |
| `execution_time_ms` | integer | Workflow execution time (for monitoring) |
| `timestamp` | ISO8601 | When the response was generated |

**Error Responses:**

```json
{
  "success": false,
  "error": "client_not_found",
  "client_id": 999,
  "timestamp": "2025-11-05T08:30:01Z"
}
```

**Possible Errors:**
- `client_not_found` - Invalid `client_id`
- `embeddings_failed` - OpenRouter embeddings API call failed
- `vector_search_failed` - Qdrant search failed
- `database_error` - Postgres query failed
- `timeout` - Request took > 5 seconds

**Performance Target:** < 2 seconds

---

## Webhook 2: memory/writeback

**Purpose:** Persist facts and episodes after conversation

**Endpoint:** `POST https://n8n.bestviable.com/webhook/memory/writeback`

**When Called:** After every chat message response (Open WebUI post-request hook)

### Request

```json
{
  "client_id": 1,
  "conversation": [
    {
      "role": "user",
      "content": "What projects am I working on?"
    },
    {
      "role": "assistant",
      "content": "Based on your memory, you're currently working on: 1) Portfolio automation 2) Memory control plane..."
    }
  ],
  "response": "Based on your memory, you're currently working on: 1) Portfolio automation 2) Memory control plane...",
  "timestamp": "2025-11-05T08:30:15.000Z"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `client_id` | integer | ✅ | User identifier |
| `conversation` | array | ✅ | Full conversation history (user + assistant turns) |
| `response` | string | ❌ | The final assistant response (for optimization) |
| `timestamp` | ISO8601 | ❌ | When the conversation ended |

### Response

```json
{
  "success": true,
  "client_id": 1,
  "episode_id": 6,
  "facts_upserted": 3,
  "facts": [
    {
      "key": "current_projects",
      "value": "Portfolio automation, Memory control plane",
      "confidence": 0.95
    },
    {
      "key": "project_status",
      "value": "Phase 3 in progress",
      "confidence": 0.88
    },
    {
      "key": "last_conversation",
      "value": "2025-11-05T08:30Z",
      "confidence": 1.0
    }
  ],
  "episode_summary": "Discussed current projects and memory control plane progress",
  "execution_time_ms": 2134,
  "timestamp": "2025-11-05T08:30:17.134Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the writeback succeeded |
| `client_id` | integer | Echo of request client_id |
| `episode_id` | integer | ID of the created/updated episode |
| `facts_upserted` | integer | Number of facts created or updated |
| `facts` | array | The extracted facts (for verification) |
| `episode_summary` | string | LLM-generated summary of the conversation |
| `execution_time_ms` | integer | Workflow execution time |
| `timestamp` | ISO8601 | When response was generated |

**Error Responses:**

```json
{
  "success": false,
  "error": "extraction_failed",
  "client_id": 1,
  "message": "LLM fact extraction timed out",
  "timestamp": "2025-11-05T08:30:17Z"
}
```

**Possible Errors:**
- `client_not_found` - Invalid `client_id`
- `extraction_failed` - LLM fact extraction failed
- `embeddings_failed` - Cannot generate summary embedding
- `database_error` - Postgres upsert failed
- `vector_store_failed` - Qdrant write failed
- `timeout` - Request took > 10 seconds

**Performance Target:** < 3 seconds

---

## Webhook 3: nightly/cleanup

**Purpose:** Maintenance (expire old entries, vacuum database)

**Endpoint:** `POST https://n8n.bestviable.com/webhook/nightly/cleanup`

**When Called:** Cron schedule: `0 2 * * *` (2 AM UTC daily)

### Request

```json
{
  "timestamp": "2025-11-05T02:00:00Z"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `timestamp` | ISO8601 | ❌ | When maintenance was triggered |

### Response

```json
{
  "success": true,
  "deleted_entries": 42,
  "deleted_state": 12,
  "archived_episodes": 5,
  "vacuum_duration_ms": 3421,
  "total_duration_ms": 8765,
  "execution_time_ms": 8765,
  "timestamp": "2025-11-05T02:00:08.765Z"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether cleanup succeeded |
| `deleted_entries` | integer | Number of expired memory_entries deleted |
| `deleted_state` | integer | Number of expired working_state entries deleted |
| `archived_episodes` | integer | Number of old episodes archived |
| `vacuum_duration_ms` | integer | Time spent on VACUUM ANALYZE |
| `total_duration_ms` | integer | Total maintenance time |
| `timestamp` | ISO8601 | When maintenance finished |

**Performance Target:** < 30 seconds

---

## Integration with Open WebUI

### Pre-Request Hook Configuration

**In Open WebUI Admin → Settings → Integrations:**

```javascript
// Pre-request hook (called before model inference)
const payload = {
  client_id: parseInt({{ user.id }}),
  query: {{ prompt }},
  timestamp: new Date().toISOString()
};

fetch('https://n8n.bestviable.com/webhook/memory/assemble', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => {
  // Store context for post-hook
  window._memoryContext = data;
  // Optionally inject context into prompt
  if (data.similar_chunks) {
    console.log('Retrieved memory chunks:', data.similar_chunks.length);
  }
})
.catch(e => console.error('Memory assembly failed:', e));
```

### Post-Request Hook Configuration

```javascript
// Post-request hook (called after model response)
const payload = {
  client_id: parseInt({{ user.id }}),
  conversation: {{ messages }},
  response: {{ response }},
  timestamp: new Date().toISOString()
};

fetch('https://n8n.bestviable.com/webhook/memory/writeback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
})
.then(r => r.json())
.then(data => {
  console.log('Memory writeback success, episode_id:', data.episode_id);
})
.catch(e => console.error('Memory writeback failed:', e));
```

---

## Testing

### Test memory/assemble

```bash
curl -X POST https://n8n.bestviable.com/webhook/memory/assemble \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "query": "What projects am I working on?"
  }' | jq .
```

**Expected:**
```json
{
  "success": true,
  "client_id": 1,
  "profile": { ... },
  "similar_chunks": [ ... ],
  "recent_episodes": [ ... ]
}
```

### Test memory/writeback

```bash
curl -X POST https://n8n.bestviable.com/webhook/memory/writeback \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "conversation": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi there!"}
    ]
  }' | jq .
```

**Expected:**
```json
{
  "success": true,
  "client_id": 1,
  "episode_id": 1,
  "facts_upserted": 0,
  "episode_summary": "User greeted assistant"
}
```

### Monitor Execution

After calling webhooks, check N8N execution logs:
```bash
# Open N8N UI
https://n8n.bestviable.com

# Go to: Executions tab
# Filter by workflow: "memory-assemble", "memory-writeback", or "nightly-cleanup"
# View execution details, output, and any errors
```

---

## SLA & Monitoring

### Response Time SLA
- **memory/assemble:** 95th percentile < 2s
- **memory/writeback:** 95th percentile < 3s
- **nightly/cleanup:** All completions < 30s

### Availability SLA
- **Uptime target:** 99.5% (allows ~22 minutes downtime/month)
- **Retry policy:** Exponential backoff (1s, 2s, 4s) for failures
- **Timeout threshold:** 10 seconds (fail gracefully if exceeded)

### Monitoring

Use Uptime Kuma monitors (configured in Workstream 5):
- Monitor `memory/assemble` health every 5 minutes
- Monitor `memory/writeback` health every 10 minutes
- Alert if any endpoint is down for > 5 minutes

---

## Migration & Rollback

### Deployment Process

1. Deploy new n8n workflows to test instance
2. Test with curl (scripts provided above)
3. Once verified, promote to production
4. Enable webhooks in Open WebUI
5. Monitor execution logs for 24 hours

### Rollback

If webhooks are causing failures:

1. **Disable in Open WebUI:** Settings → Integrations → clear webhook URLs
2. **Chat will work normally** (just without memory)
3. **Investigate n8n logs:** Check workflow executions for errors
4. **Fix and re-enable** once issues are resolved

---

**Version:** 1.0
**Last Updated:** 2025-11-05
**Status:** Ready for implementation
