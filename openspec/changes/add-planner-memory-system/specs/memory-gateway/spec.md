# Memory Gateway Specification Delta

## ADDED Requirements

### Requirement: Unified Memory API
The system SHALL provide a unified HTTP/REST API for all memory operations, exposing endpoints for storing, retrieving, searching, and querying contextual memory across multiple backend storage systems.

#### Scenario: Remember operation stores across all backends
- **WHEN** a client calls POST `/api/v1/memory/remember` with `{client_id: 1, content: "User prefers morning deep work", memory_type: "fact"}`
- **THEN** the system SHALL generate an embedding via OpenRouter
- **AND** store the event in Postgres `events` table
- **AND** store the vector embedding in Qdrant `events` collection
- **AND** cache the memory in Valkey with 24h TTL
- **AND** send the content to mem0 for long-term memory extraction
- **AND** return status 200 with `{memory_id, stored_in: ["postgres", "qdrant", "valkey", "mem0"]}`

#### Scenario: Recall operation uses cache first
- **WHEN** a client calls GET `/api/v1/memory/recall?query=morning&client_id=1&k=5`
- **THEN** the system SHALL check Valkey cache for the query result
- **AND** if cache hit, return cached results immediately
- **AND** if cache miss, generate query embedding, perform semantic search in Qdrant, fetch full records from Postgres, cache the result for 1h, and return top-k results

#### Scenario: Invalid client ID rejected
- **WHEN** a client calls POST `/api/v1/memory/remember` with `client_id: null`
- **THEN** the system SHALL return status 400 with error `{error: "client_id is required"}`

---

### Requirement: Semantic Search
The system SHALL provide semantic search capabilities over stored memories using vector embeddings, returning results ranked by cosine similarity.

#### Scenario: Semantic search returns relevant memories
- **WHEN** a client calls GET `/api/v1/memory/recall?query=productivity tips&client_id=1&k=10`
- **THEN** the system SHALL generate an embedding for "productivity tips"
- **AND** perform cosine similarity search in Qdrant `events` collection
- **AND** return top 10 memories ranked by relevance score (0.0-1.0)
- **AND** include full content and metadata from Postgres

---

### Requirement: Document Search
The system SHALL provide RAG (Retrieval-Augmented Generation) search over ingested documents, enabling semantic search across document chunks.

#### Scenario: Document search with no results
- **WHEN** a client calls GET `/api/v1/memory/search/docs?query=machine learning&k=5`
- **AND** no documents have been ingested yet
- **THEN** the system SHALL return status 200 with `{results: [], total: 0}`

#### Scenario: Document search returns chunks
- **WHEN** a client calls GET `/api/v1/memory/search/docs?query=API authentication&k=3`
- **AND** documents have been ingested
- **THEN** the system SHALL search Qdrant `doc_chunks` collection
- **AND** return top 3 document chunks with `{doc_id, chunk_index, content, similarity_score, metadata}`

---

### Requirement: Graph Traversal
The system SHALL provide graph traversal capabilities to query entity relationships, returning connected nodes and edge types.

#### Scenario: Get neighbors for existing entity
- **WHEN** a client calls GET `/api/v1/memory/graph/neighbors?entity_id=coda:task-123`
- **AND** the entity exists in `graph_nodes` table
- **THEN** the system SHALL query `graph_edges` for all edges where `from_node_id = "coda:task-123"` OR `to_node_id = "coda:task-123"`
- **AND** return `{neighbors: [{node_id, edge_type, direction: "outgoing|incoming", properties}]}`

#### Scenario: Get neighbors for non-existent entity
- **WHEN** a client calls GET `/api/v1/memory/graph/neighbors?entity_id=invalid-123`
- **THEN** the system SHALL return status 404 with `{error: "Entity not found"}`

---

### Requirement: Event Similarity
The system SHALL provide event-based similarity search, finding similar historical events based on vector embeddings.

#### Scenario: Find similar events
- **WHEN** a client calls GET `/api/v1/memory/similar/events?event_id=42&k=5`
- **AND** event ID 42 exists in Postgres `events` table
- **THEN** the system SHALL fetch the vector embedding for event 42 from Qdrant
- **AND** perform similarity search in Qdrant `events` collection
- **AND** return top 5 similar events (excluding event 42 itself)

---

### Requirement: Health Monitoring
The system SHALL expose health check endpoints for service monitoring and dependency status validation.

#### Scenario: Health check with all dependencies healthy
- **WHEN** a client calls GET `/health`
- **AND** Postgres, Qdrant, and Valkey are all reachable
- **THEN** the system SHALL return status 200 with `{status: "healthy", dependencies: {postgres: "up", qdrant: "up", valkey: "up"}, uptime_seconds: ...}`

#### Scenario: Health check with dependency down
- **WHEN** a client calls GET `/health`
- **AND** Valkey is unreachable
- **THEN** the system SHALL return status 503 with `{status: "degraded", dependencies: {postgres: "up", qdrant: "up", valkey: "down"}}`

---

### Requirement: API Performance
The system SHALL respond to recall queries within 200ms (p95 latency) and remember operations within 500ms (p95 latency) under normal load.

#### Scenario: Recall query performance
- **WHEN** the system receives a recall query
- **THEN** the system SHALL respond within 200ms for 95% of requests
- **AND** cache frequently queried results in Valkey to improve performance

#### Scenario: Remember operation performance
- **WHEN** the system receives a remember operation
- **THEN** the system SHALL complete all storage operations (Postgres, Qdrant, Valkey, mem0) within 500ms for 95% of requests
- **AND** log any operations exceeding this threshold for performance monitoring

---

### Requirement: Error Handling
The system SHALL provide clear error messages with appropriate HTTP status codes and handle partial failures gracefully.

#### Scenario: Partial storage failure (Qdrant unavailable)
- **WHEN** a client calls POST `/api/v1/memory/remember`
- **AND** Qdrant is unavailable
- **THEN** the system SHALL still store the event in Postgres
- **AND** cache in Valkey
- **AND** send to mem0
- **AND** return status 207 (Multi-Status) with `{memory_id, stored_in: ["postgres", "valkey", "mem0"], failed: ["qdrant"], warning: "Vector storage failed, will retry in background"}`

#### Scenario: Critical failure (Postgres unavailable)
- **WHEN** a client calls POST `/api/v1/memory/remember`
- **AND** Postgres is unavailable
- **THEN** the system SHALL return status 503 with `{error: "Primary storage unavailable, please retry"}`
- **AND** NOT store in any backend (consistency over availability)

---

### Requirement: Observability
The system SHALL integrate with Langfuse for LLM call tracing and provide metrics endpoints for monitoring.

#### Scenario: LLM call traced in Langfuse
- **WHEN** the system generates an embedding via OpenRouter
- **THEN** the call SHALL be automatically traced in Langfuse with `{model, prompt_tokens, completion_tokens, latency, cost}`

#### Scenario: Metrics endpoint provides stats
- **WHEN** a client calls GET `/metrics`
- **THEN** the system SHALL return Prometheus-compatible metrics including `{memory_gateway_requests_total, memory_gateway_request_duration_seconds, memory_gateway_cache_hit_rate}`

---

### Requirement: Pattern Hierarchy Graph Storage
The system SHALL store business and pattern hierarchy in graph_nodes and graph_edges tables, enabling traversal queries across Venture → Offer → Blueprint → Workflow → Template → Execution Run relationships.

#### Scenario: Store Service Blueprint hierarchy
- **WHEN** a Service Blueprint is created in Coda
- **THEN** the system SHALL create graph node with node_id "coda:blueprint-{id}"
- **AND** set node_type "service_blueprint"
- **AND** store properties: {name, version, status}

#### Scenario: Store Workflow to Blueprint relationship
- **WHEN** a Workflow is linked to a Service Blueprint
- **THEN** the system SHALL create graph edge from "coda:blueprint-{id}" to "coda:workflow-{id}"
- **AND** set edge_type "blueprint_has_workflow"
- **AND** store properties: {created_at}

#### Scenario: Query Process Templates derived from Workflow
- **WHEN** a client calls GET `/api/v1/memory/graph/neighbors?entity_id=coda:workflow-{id}&edge_type=workflow_has_template`
- **THEN** the system SHALL return all Process Templates created from this Workflow
- **AND** include execution_runs count for each template

#### Scenario: Store Execution Run linkage
- **WHEN** an Execution Run is created
- **THEN** the system SHALL create graph edges:
  - template_used_in_run (process_template → execution_run)
  - run_belongs_to_project (execution_run → project)
  - project_serves_engagement (project → engagement)
- **AND** enable graph queries like "all execution runs for engagement X"

#### Scenario: Query similar past projects by pattern
- **WHEN** a client calls GET `/api/v1/memory/similar/projects?blueprint_id=coda:blueprint-{id}&k=5`
- **THEN** the system SHALL use graph traversal to find projects using same blueprint
- **AND** return execution_runs statistics for those projects
- **AND** enable pattern-based learning: "Similar projects took avg X hours"
