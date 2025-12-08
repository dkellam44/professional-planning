# Spec: Memory Gateway Capability

**Capability ID**: `memory-gateway`
**Status**: NEW
**Change ID**: `add-planner-memory-system`

## Overview

The Memory Gateway is a reusable FastAPI service that provides unified access to the hybrid memory stack:
- **Zep Cloud** (long-term memory, semantic search, fact graphs)
- **Postgres** (structured facts with temporal validity, events)
- **Valkey** (session cache, <24h TTL)

This capability replaces fragmented memory operations and serves as the foundation for future agentic services.

---

## NEW Requirements

### Requirement: Hybrid Memory Write (remember)

The Memory Gateway SHALL accept memory write requests and store across all three layers (Postgres, Zep Cloud, Valkey) with fallback logic.

#### Scenario: User stores a high-salience event
- **WHEN** service receives POST /api/v1/memory/remember with salience_score >= 0.7
- **THEN** event is stored in Postgres events table
- **AND** event is sent to Zep Cloud via add_memory(session_id, content)
- **AND** event is cached in Valkey with 24h TTL
- **AND** response includes memory_id and stored_in array: ["postgres", "zep", "valkey"]

#### Scenario: Zep Cloud is unavailable
- **WHEN** Zep Cloud API times out or returns 5xx error
- **THEN** event is still stored in Postgres and Valkey
- **AND** response includes stored_in: ["postgres", "valkey"] (without "zep")
- **AND** error is logged but request succeeds (graceful degradation)

#### Scenario: Low-salience event (< 0.7)
- **WHEN** service receives event with salience_score = 0.5
- **THEN** event stored in Postgres + Valkey only
- **AND** NOT sent to Zep Cloud (optimization for noise reduction)

### Requirement: Hybrid Memory Recall (recall)

The Memory Gateway SHALL retrieve memories using a tiered retrieval strategy: cache → Zep semantic search → Postgres facts.

#### Scenario: Valkey cache hit
- **WHEN** GET /api/v1/memory/recall?query=X&client_id=1 with exact query in cache
- **THEN** cached result returned immediately (<50ms)

#### Scenario: Valkey cache miss, Zep search succeeds
- **WHEN** GET /api/v1/memory/recall?query="scheduling preferences"&client_id=1 with cache miss
- **THEN** Zep Cloud searched with semantic query
- **AND** Returns top 10 results ranked by similarity_score

#### Scenario: Both Zep and Postgres queries
- **WHEN** multiple result sources returned
- **THEN** response includes source field: "zep" | "fact"
- **AND** client can weight results differently

### Requirement: Fact Creation and Promotion

The Memory Gateway SHALL provide endpoints for creating durable facts with temporal validity.

#### Scenario: Create fact from event
- **WHEN** POST /api/v1/memory/facts with { subject_type, subject_id, fact_type, content, salience_score }
- **THEN** fact inserted into Postgres facts table
- **AND** fact.valid_from = NOW(), valid_to = NULL
- **AND** fact sent to Zep Cloud graph via create_fact()
- **AND** response includes fact_id, zep_fact_id

#### Scenario: Update fact (temporal validity pattern)
- **WHEN** POST /api/v1/memory/facts/{id}/update with new content
- **THEN** old fact.valid_to set to NOW() (closes the fact)
- **AND** new fact inserted with valid_from = NOW(), valid_to = NULL
- **AND** maintains full audit trail of fact evolution

### Requirement: Memory Scopes

The Memory Gateway SHALL support memory scope classification for filtering and lifecycle management.

#### Scenario: Memory scope classification
- **WHEN** event written with memory_scope field
- **THEN** event assigned scope: 'run', 'session', 'user', 'project', 'global'
- **AND** scope affects expiration and retention policy
- **AND** run scope: expires when execution_run.ended_at set
- **AND** session scope: expires 24h after creation

#### Scenario: Scope-filtered recall
- **WHEN** GET /api/v1/memory/recall?scopes=["user","global"]
- **THEN** only events/facts with matching memory_scope returned
- **AND** excludes 'run' and 'session' scope memories

---

## API Contract

### /api/v1/memory/remember (POST)

Request body:
```json
{
  "content": "memory content text",
  "client_id": 1,
  "memory_type": "event | reflection | decision",
  "memory_scope": "run | session | user | project | global",
  "salience_hint": 0.7,
  "metadata": {}
}
```

Response 201:
```json
{
  "memory_id": 123,
  "stored_in": ["postgres", "zep", "valkey"],
  "zep_session_id": "client_1"
}
```

### /api/v1/memory/recall (GET)

Query params: `query`, `client_id`, `k=10`, `scopes=[]`

Response 200:
```json
{
  "query": "search text",
  "results": [
    {
      "content": "fact content",
      "similarity_score": 0.85,
      "source": "zep | fact",
      "created_at": "2025-12-07T..."
    }
  ],
  "result_count": 5,
  "cached": false
}
```

### /api/v1/memory/facts (POST)

Request body:
```json
{
  "subject_type": "user | workflow | engagement",
  "subject_id": "1",
  "fact_type": "preference | constraint | identity",
  "content": "fact statement",
  "salience_score": 0.8
}
```

Response 201:
```json
{
  "fact_id": 456,
  "zep_fact_id": "zf_uuid...",
  "valid_from": "2025-12-07T...",
  "valid_to": null
}
```

---

## Success Criteria

- Recall queries: < 200ms cache hit, < 500ms Zep search
- Fact extraction: salience >= 0.7 automatically promoted to facts table
- Zep Cloud free tier: < 1000 API calls/month
- Graceful degradation: recalls work via Postgres if Zep unavailable
- All memory operations logged to Postgres events table
