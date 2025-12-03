# Memory Gateway Service

**Unified Memory API for Planner & Memory Architecture**

A Python/FastAPI service that provides a simple API for storing and retrieving memories with semantic search capabilities.

## Architecture

The Memory Gateway connects to multiple backends for a resilient, multi-layered memory system:

- **Postgres**: Primary storage for events, durability
- **Qdrant**: Vector database for semantic search
- **Valkey**: Redis-compatible cache for short-term memory (24h TTL)
- **mem0** (Phase 2): Long-term memory consolidation

## API Endpoints

### Health Checks

```bash
GET /health
GET /health/detailed
```

### Memory Operations

#### POST `/api/v1/memory/remember`

Store a memory (fact, event, preference, or observation).

**Request:**
```json
{
  "client_id": 1,
  "content": "User prefers morning deep work blocks",
  "memory_type": "preference",
  "metadata": {"source": "observation"},
  "tags": ["work_habits", "productivity"]
}
```

**Response:**
```json
{
  "memory_id": 42,
  "client_id": 1,
  "stored_in": ["postgres", "qdrant", "valkey"],
  "timestamp": "2025-12-03T01:45:00"
}
```

#### GET `/api/v1/memory/recall`

Search for memories using semantic similarity.

**Request:**
```bash
GET /api/v1/memory/recall?query=morning+work+preference&client_id=1&k=5&memory_type=preference
```

**Response:**
```json
{
  "query": "morning work preference",
  "client_id": 1,
  "results": [
    {
      "memory_id": 42,
      "content": "User prefers morning deep work blocks",
      "memory_type": "preference",
      "similarity_score": 0.95,
      "stored_at": "2025-12-03T01:45:00",
      "metadata": {"source": "observation"}
    }
  ],
  "result_count": 1,
  "search_time_ms": 145.3
}
```

## Setup

### Prerequisites

- Docker & Docker Compose
- Postgres running (n8n database)
- Qdrant running (collections pre-created)
- Valkey running

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `POSTGRES_PASSWORD`: Your Postgres password
- `OPENROUTER_API_KEY`: For embeddings via OpenRouter API
- `MEM0_API_KEY`: (Optional, Phase 2)
- `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`: (Optional, tracing)

### Build & Deploy

```bash
# Build image
docker-compose build

# Run service
docker-compose up -d

# View logs
docker-compose logs -f memory-gateway

# Stop service
docker-compose down
```

### Verify Health

```bash
curl http://localhost:8090/health
curl http://localhost:8090/health/detailed
```

## Testing

### Remember Endpoint

```bash
curl -X POST http://localhost:8090/api/v1/memory/remember \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": 1,
    "content": "Learned about memory architecture patterns",
    "memory_type": "fact",
    "metadata": {"topic": "architecture"}
  }'
```

### Recall Endpoint

```bash
curl "http://localhost:8090/api/v1/memory/recall?query=memory+patterns&client_id=1&k=5"
```

## Architecture Decisions

### Multi-Layer Storage

1. **Postgres**: Structured event log for durability, compliance, and analytical queries
2. **Qdrant**: Vector embeddings for semantic search (AI-friendly)
3. **Valkey**: Short-term cache for fast recall of recent memories

### Fallback Strategy

- Primary: Qdrant semantic search (best quality)
- Fallback: Postgres structured query (if Qdrant unavailable)
- Cache: Valkey for repeated queries (fastest)

### Async/Await

All I/O operations are asynchronous for better concurrency and resource utilization.

## Future Enhancements (Phase 2+)

- **mem0 Integration**: Long-term memory consolidation and forgetting curves
- **Langfuse Tracing**: Full observability of memory operations
- **Graph Storage**: Neo4j for entity relationships and reasoning
- **RAG Pipeline**: Docling/Crawl4AI for document ingestion
- **Persistence Tuning**: Optimize based on actual usage patterns

## Performance Targets

- Remember endpoint: <500ms (including embeddings)
- Recall endpoint: <200ms (with cache), <1s (vector search)
- Memory usage: <200MB steady state
- Valkey hit rate: >80% for repeated queries
