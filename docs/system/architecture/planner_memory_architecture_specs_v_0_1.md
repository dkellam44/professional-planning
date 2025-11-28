# Planner OS & Memory Architecture Specs (v0.1)

This document contains two coordinated specifications:
1. **Planner Architecture Spec (Updated)** – Akiflow/Motion-style planning & scheduling system.
2. **Memory Architecture Spec (v0.1)** – Enterprise‑pattern memory system for agents, planning, coding workflows, and future SaaS.

Both specs are modular, updatable, and designed to serve Founder HQ + future ventures.

---

# 1. Planner Architecture Spec (Updated v0.1.1)

## Purpose
A self‑hosted planning and execution system that delivers:
- Akiflow‑grade human‑first planning UX.
- Motion‑grade AI‑first workflow compilation (intent → SOP → tasks → schedule → automations).
- Integration with Founder HQ (Coda), n8n, Google Calendar, Postgres, qdrant, and the new Memory Architecture.
- Deprecation of Archon stack as a core service.

---
## Architecture Overview

### Layers
1. **Intent & Planning Layer**
   - LLM Planner (prompt → SOP → tasks JSON)
   - Planning UI (Next.js, phase 2)
   - Chat interfaces (Open WebUI / ChatGPT / Claude)

2. **Scheduling & Execution Layer**
   - LLM-based Scheduler
   - n8n orchestrations
   - Google Calendar event engine
   - GitHub Actions for heavy/periodic agent tasks

3. **Data & Memory Layer**
   - Founder HQ (Coda)
   - Postgres event log
   - qdrant semantic memory
   - Memory Gateway (connects Planner/Scheduler/Agents to memory system)

4. **Observer & Feedback Layer**
   - Observer Agent (analysis, reflection, recommendations)
   - Daily Thread & Sprint Review updates

5. **UI Layer**
   - Phase 1: Coda + Google Calendar + Open WebUI
   - Phase 2: Next.js Planner UI

---
## Component Details

### 1. Founder HQ (Coda)
- Primary execution OS.
- Stores tasks, projects, sprints, daily thread.
- Source of truth for work commitments.

### 2. Google Calendar
- True drag-drop surface for time-blocking.
- Each block linked to Coda tasks.

### 3. Planner Engine
- LLM Planner: SOP → tasks → constraints.
- Scheduler: tasks/constraints → blocks/events.

### 4. Orchestration
**n8n:**
- Capture → Process → Plan → Schedule → Execute flows.
- Calendar ↔ Coda sync.
- Writes events to Postgres.

**GitHub Actions:**
- Heavy agent tasks
- Workflow audits
- RAG evaluations

### 5. Observer Agent
- Reads events, Coda, qdrant.
- Writes reflections to Daily Thread.
- Produces weekly sprint reviews.

---
## Archon Deprecation
Archon-server, archon-ui, archon-mcp are deprecated as core services.
They remain:
- Reference patterns for MCP tools
- Optional sidecar for experimentation

Actions:
- Stop containers
- Export configs
- Mark as deprecated in service inventory

---
## Implementation Phases

### Phase 1
- Coda ↔ n8n ↔ Google Calendar integration
- Scheduler MVP
- Event log in Postgres

### Phase 2
- Observer Agent MVP
- Daily + Weekly feedback flows

### Phase 3
- Next.js Planning UI (thin surface)
- API integration to Planner/Scheduler/Memory Gateway

---

# 2. Memory Architecture Spec (v0.1)

## Purpose
Create a scalable, enterprise-grade memory architecture suitable for:
- Planning agents
- Code agents (Claude Code, Codex, OpenCode, Antigravity, VS Code extensions)
- Autonomous agents
- Personal ERP (Founder HQ)
- Future Ops Studio and agentic SaaS products

---
## Memory Architecture Overview
A unified **Memory Gateway** exposes a simple interface to all agents:
- `remember()`
- `recall()`
- `search_docs()`
- `graph_neighbors()`
- `similar_events()`

Internally, the gateway fans out to specialized stores:
- Redis/Valkey → short-term memory
- mem0 → long-term agent memory
- Postgres → events, structured knowledge, graph tables
- qdrant → vector embeddings (semantic memory)
- Docling/Crawl4AI → RAG ingest
- Langfuse → tracing
- RAGAS → RAG evaluation
- Web search APIs → external augmentation

---
## Memory Layers

### **1. Short-Term Memory (Ephemeral)**
Purpose: fast context for a single interaction/session.
- Redis/Valkey for TTL-based KV
- In-process caches for agents

### **2. Long-Term Memory (Persistent)**
Purpose: personalized memory, preferences, recurring patterns.
- mem0 orchestrates memory extraction, consolidation
- Stored in Postgres + qdrant

### **3. Graph Memory (Entity + System Graph)**
Purpose: capture:
- Ventures → Offers → Engagements → Projects → Tasks → Docs → Events
- People, Orgs, Decisions, Context

Implementation path:
1. Phase 1–2: Graph-on-Postgres (tables + edges)
2. Phase 3+: Neo4j with Graphiti schema

### **4. RAG Knowledge Base**
Sources:
- PDFs, docs, internal specs → Docling chunking
- Websites → Crawl4AI
- Output: normalized chunks with metadata → qdrant

### **5. Observability & Evaluation**
- Langfuse for traces, cost, prompt metadata
- RAGAS for eval of RAG pipelines
- Used by Planner & Observer for model improvement

### **6. External Retrieval**
Optional web search:
- Brave/OpenSearch/Perplexity API
- Integrated into the RAG pipeline

---
## Memory Gateway (API Contract)
The core abstraction agents should call:

### `remember(payload, metadata)`
- Stores event, preference, fact, observation
- mem0 extracts long-term knowledge
- Postgres logs event
- qdrant stores embedding
- Optional graph update

### `recall(query, k)`
- Semantic search via qdrant
- Retrieve LTM via mem0
- Return structured + vector results

### `graph_neighbors(entity_id)`
- Return all connected nodes + edges

### `search_docs(query, k)`
- Docling/Crawl4AI → qdrant search

### `similar_events(event_id, k)`
- Embedding-based similarity over `events` table

---
## Data Stores

### Postgres
- Tables: `events`, `graph_nodes`, `graph_edges`, `mem0_store`, `plans`, `scheduler_runs`
- Acts as structured SoT for memory state

### qdrant
- Collections: `doc_chunks`, `events`, `agent_memories`, `daily_threads`, etc.

### Redis/Valkey
- Short-term working memory

### Optional
- Neo4j (Phase 3+)
- Langfuse
- RAGAS

---
## Implementation Phases

### **Phase 1 — Foundation**
- Postgres event schema
- qdrant collections
- Docling + Crawl4AI ingest pipeline (n8n or GitHub Actions)
- Basic Memory Gateway (thin layer)

### **Phase 2 — Long-Term Memory (mem0)**
- Stand up mem0
- Route Planner/Observer/CLI agents through mem0
- Consolidate long-term memory

### **Phase 3 — Observability**
- Deploy Langfuse (Docker)
- Wrap LLM usage
- RAG eval with RAGAS

### **Phase 4 — Knowledge Graph**
- Implement graph-on-Postgres
- Migrate to Neo4j when ready
- Add Graphiti for schema + API

### **Phase 5 — Multi-Tenant & SaaS**
- Namespacing in Memory Gateway
- Prepare system to support client Ops Studio + agentic SaaS

---

# End of Document

This canvas file is designed for active iteration and expansion.

