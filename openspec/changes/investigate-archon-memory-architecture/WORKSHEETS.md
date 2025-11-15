# Investigation Worksheets: Context Engineering Architecture & Memory Management Strategy

**Change ID**: `investigate-archon-memory-architecture`
**Total Phases**: 4 (Learning → Discovery → Design → Documentation)
**Estimated Total Time**: 13-20 hours

---

## 📋 Worksheet 1: Phase 0 - Learning Context Engineering Fundamentals

### Section 0.1: Context Engineering Research (2-3 hours)

**Objective**: Understand what context engineering is and industry patterns

**Research Tasks**:
- [ ] **LLM Learning Session 1**: Fundamentals
  - Prompt Claude/ChatGPT: "What is context engineering in AI systems? Explain the main architectural patterns, trade-offs, and use cases."
  - Capture: Key patterns (stateless, stateful, RAG, semantic memory, hybrid)
  - Document: In `CONTEXT_ENGINEERING_PRIMER.md`

- [ ] **LLM Learning Session 2**: Industry Solutions
  - Prompt Claude/ChatGPT: "Compare Letta, mem0, LangChain memory, and LlamaIndex memory modules. What are their capabilities, limitations, and ideal use cases?"
  - Capture: Comparison table of 4-5 industry solutions
  - Document: In `CONTEXT_ENGINEERING_PRIMER.md`

- [ ] **LLM Learning Session 3**: Vector Database Patterns
  - Prompt Claude/ChatGPT: "What are best practices for using vector databases like Qdrant for embeddings and retrieval? Include indexing strategies, collection design, and query patterns."
  - Capture: Vector DB design principles
  - Document: In `CONTEXT_ENGINEERING_PRIMER.md`

**Deliverable**: `CONTEXT_ENGINEERING_PRIMER.md` with fundamentals section complete

---

### Section 0.2: System Goals & Requirements Definition (1 hour)

**Objective**: Define what problems THIS system should solve

**Goal Definition Tasks**:
- [ ] **Use Case Identification**
  - Prompt Claude/ChatGPT: "I have a system with Archon (agent memory), Open WebUI (chat interface), Qdrant (vector DB), and PostgreSQL. What are common use cases for context engineering in such a system?"
  - Capture: 3-5 clear use cases with user stories
  - Examples: Chat continuity, knowledge retrieval, personalization, agent memory

- [ ] **Requirements Framework**
  - Create MUST/SHOULD/MAY categories
  - Prompt Claude/ChatGPT: "For a context engineering system supporting chat, agents, and workflows, what are essential vs nice-to-have capabilities?"
  - Capture: Requirements categorized by priority

- [ ] **Constraints Definition**
  - Identify: Latency, cost, storage, complexity constraints
  - Prompt Claude/ChatGPT: "What are realistic constraints for a personal/professional context engineering system running on a 4GB droplet?"

**Deliverable**: Goals and requirements sections in `CONTEXT_ENGINEERING_PRIMER.md`

---

### Section 0.3: Evaluation Framework Creation (30 minutes)

**Objective**: Create systematic way to compare solutions

**Framework Tasks**:
- [ ] **Evaluation Criteria**
  - Define 5-7 weighted criteria (1-5 scale)
  - Examples: Ease of use, cost, complexity, maintainability, features, integration
  - Prompt Claude/ChatGPT: "How should I weight these criteria for a system that values maintainability and integration over advanced features?"

- [ ] **Decision Process**
  - Define scoring thresholds, must-have features, deal-breakers
  - Prompt Claude/ChatGPT: "What's a good decision framework for choosing between context engineering solutions?"

**Deliverable**: Evaluation framework in `CONTEXT_ENGINEERING_PRIMER.md`

---

## 🔍 Worksheet 2: Phase 1 - Discovery Investigation

### Section 1.1: Archon Stack Investigation (2 hours)

**Objective**: Understand what Archon actually does and how it works

**Investigation Tasks**:
- [ ] **Codebase Analysis**
  - Location: `/service-builds/archon/` or `/home/david/services/archon/`
  - Find: README files, API docs, source code
  - Document: Basic architecture understanding

- [ ] **Docker Configuration Review**
  - File: `docker-compose.yml` in archon directory
  - Document: Services, networks, volumes, environment variables
  - Capture: How archon-server, archon-mcp, archon-ui connect

- [ ] **Web Interface Testing**
  - URL: `https://archon.bestviable.com` or `http://localhost:3737`
  - Test: All features, admin capabilities, memory management
  - Document: UI capabilities and limitations

- [ ] **Log Analysis**
  - Commands: 
    ```bash
    docker logs archon-server --tail 200
    docker logs archon-mcp --tail 200
    docker logs archon-ui --tail 200
    ```
  - Document: Database connections, memory operations, key patterns

- [ ] **MCP Tools Documentation**
  - Test via Claude Code: `/mcp list` and `/mcp use archon`
  - Document: All 12 tools with names, descriptions, input/output formats
  - Capture: What each tool actually does

**Deliverable**: Archon section in `DISCOVERY_FINDINGS.md`

---

### Section 1.2: Open WebUI Investigation (1.5 hours)

**Objective**: Understand Open WebUI's memory and context capabilities

**Investigation Tasks**:
- [ ] **Web Interface Exploration**
  - URL: `https://openweb.bestviable.com` or `http://localhost:8080`
  - Test: Chat history, document upload, RAG features, model memory
  - Document: All memory/context features discovered

- [ ] **Memory Testing**
  - Create: Test conversation with multiple turns
  - Upload: Test document and test RAG retrieval
  - Document: How memory persists, what gets stored

- [ ] **Docker Configuration Review**
  - File: `docker-compose.yml` for openweb service
  - Document: Volumes, databases, environment variables
  - Capture: Storage backend (postgres? file-based? separate DB?)

- [ ] **Log Analysis**
  - Command: `docker logs openweb --tail 200`
  - Document: Database connections, embedding operations, memory storage

**Deliverable**: Open WebUI section in `DISCOVERY_FINDINGS.md`

---

### Section 1.3: Database Investigation (1 hour)

**Objective**: Map what data is stored where and by whom

**Database Tasks**:
- [ ] **PostgreSQL Analysis**
  - Commands:
    ```bash
    docker exec postgres psql -U postgres -l
    # For each database:
    docker exec postgres psql -U postgres -d database_name -c "\dt"
    docker exec postgres psql -U postgres -d database_name -c "\d table_name"
    ```
  - Document: All databases, tables, schemas, which service owns what

- [ ] **Qdrant Analysis**
  - Commands:
    ```bash
    curl http://localhost:6333/collections
    curl http://localhost:6333/collections/{collection_name}
    ```
  - Document: All collections, what's embedded, indexing strategy

- [ ] **Data Ownership Mapping**
  - Create matrix: Service → Database → Tables/Collections → Purpose
  - Document: Who writes where, who reads where

**Deliverable**: Database topology section in `DISCOVERY_FINDINGS.md`

---

### Section 1.4: Data Flow & Dependencies (30 minutes)

**Objective**: Understand how services interact

**Mapping Tasks**:
- [ ] **Network Analysis**
  - Command: `docker network ls` and `docker network inspect docker_syncbricks`
  - Document: Which services can communicate with which

- [ ] **Data Flow Tracing**
  - Test: Create memory in Archon, trace where it goes
  - Test: Chat in Open WebUI, trace data storage
  - Document: End-to-end data flow diagrams

**Deliverable**: Data flow diagrams in `DISCOVERY_FINDINGS.md`

---

## 🎯 Worksheet 3: Phase 2 - Strategic Design Decisions

### Section 2.1: Alternative Solution Evaluation (2 hours)

**Objective**: Systematically evaluate all options against requirements

**Evaluation Tasks**:
- [ ] **Research Each Alternative**
  - **Option A**: Keep Archon (based on Phase 1 findings)
  - **Option B**: Keep Open WebUI (based on Phase 1 findings)
  - **Option C**: Deploy Letta (research capabilities, integration needs)
  - **Option D**: Deploy mem0 (research capabilities, integration needs)
  - **Option E**: Google memory (research Gemini context caching)
  - **Option F**: Hybrid (Archon + Open WebUI + n8n)
  - **Option G**: Replace both (research unified solutions)

- [ ] **Apply Evaluation Framework**
  - Use framework from Phase 0
  - Score each option 1-5 on each criterion
  - Calculate weighted scores
  - Document: Completed evaluation matrix

**Deliverable**: Evaluation matrix in `design.md`

---

### Section 2.2: Strategic Decision Making (1 hour)

**Objective**: Make informed decisions with clear rationale

**Decision Tasks**:
- [ ] **Primary Memory System Selection**
  - Based on evaluation scores and requirements
  - Consider: Integration complexity, resource usage, maintenance
  - Document: Decision with detailed rationale

- [ ] **Architecture Decisions**
  - Database topology (shared vs separate)
  - n8n integration pattern
  - UI layer strategy
  - Vector storage strategy
  - Context lifecycle management

**Deliverable**: Strategic decisions section in `design.md`

---

## 📚 Worksheet 4: Phase 3 - Documentation Creation

### Section 3.1: New Architecture Documents (3-4 hours)

**Documentation Tasks**:
- [ ] **CONTEXT_ENGINEERING_PRIMER.md**
  - Move from change directory to: `/docs/system/architecture/`
  - Review and refine based on all phases

- [ ] **ARCHON_ARCHITECTURE.md**
  - Location: `/docs/system/architecture/`
  - Content: Components, data flow, persistence, MCP tools, capabilities, limitations

- [ ] **OPEN_WEBUI_CAPABILITIES.md**
  - Location: `/docs/system/architecture/`
  - Content: Architecture, memory features, integration points, capabilities, limitations

- [ ] **DATA_PERSISTENCE_TOPOLOGY.md**
  - Location: `/docs/system/architecture/`
  - Content: Database usage matrix, schema inventory, collection inventory, lifecycle

- [ ] **MEMORY_MANAGEMENT_STRATEGY.md**
  - Location: `/docs/system/architecture/`
  - Content: Strategic decisions, rationale, comparison matrix, roadmap

---

### Section 3.2: Documentation Updates (1-2 hours)

**Update Tasks**:
- [ ] **SERVICE_INVENTORY.md**
  - Add Archon details (currently "optional")
  - Add Open WebUI memory capabilities
  - Document database connections

- [ ] **MCP_SERVER_CATALOG.md**
  - Add archon-mcp tool descriptions
  - Add integration guidance

- [ ] **ARCHITECTURE_DIAGRAMS.md**
  - Add memory flow diagrams
  - Add data persistence topology
  - Add context engineering flow

---

### Section 3.3: OpenSpec Capability Specs (1 hour)

**Specification Tasks**:
- [ ] **memory-persistence/spec.md**
  - Requirements: MUST persist, SHOULD support semantic search
  - Scenarios: Memory creation, retrieval, expiration

- [ ] **context-engineering/spec.md**
  - Requirements: MUST embed context, SHOULD retrieve memories
  - Scenarios: n8n workflow retrieval, MCP tool access, LLM context injection

---

## ✅ Validation Checklist

### Phase 0 Completion ✅
- [ ] Context engineering fundamentals understood and documented
- [ ] System goals clearly defined (3-5 use cases)
- [ ] Requirements framework created (MUST/SHOULD/MAY)
- [ ] Evaluation framework ready (criteria + decision process)
- [ ] `CONTEXT_ENGINEERING_PRIMER.md` complete

### Phase 1 Completion ✅
- [ ] Archon architecture fully documented
- [ ] All 12 archon-mcp tools described
- [ ] Open WebUI memory capabilities documented
- [ ] PostgreSQL schemas inventoried
- [ ] Qdrant collections cataloged
- [ ] Data flow mapped and diagrammed
- [ ] `DISCOVERY_FINDINGS.md` complete

### Phase 2 Completion ✅
- [ ] 7 alternatives evaluated with scores
- [ ] Strategic decisions made with rationale
- [ ] Architecture designed (components, data flow, integration)
- [ ] Migration plan created (if replacing systems)
- [ ] `design.md` complete

### Phase 3 Completion ✅
- [ ] 5 new architecture documents created
- [ ] 3 existing documents updated
- [ ] 2 OpenSpec capability specs created
- [ ] All documentation reflects investigation findings
- [ ] Zero architectural unknowns remaining

---

## 📝 Progress Tracking

**Current Phase**: 
**Hours Spent**: 
**Key Findings**: 
**Blocking Issues**: 
**Next Steps**: 

---

**Estimated Total Time**: 13-20 hours
**Target Completion**: 
**Actual Completion**: 

---

## 🎯 Success Metrics

### Quantitative
- ✅ 100% of Archon capabilities documented
- ✅ 100% of Open WebUI memory features documented
- ✅ 100% of database schemas inventoried
- ✅ 100% of Qdrant collections cataloged
- ✅ 7 alternatives evaluated with scoring
- ✅ 5 new documentation files created
- ✅ 3 existing documentation files updated

### Qualitative
- ✅ Clear understanding of context engineering goals
- ✅ Informed strategic decision on memory management
- ✅ Complete architectural documentation
- ✅ Framework for evaluating future solutions
- ✅ Zero blocking unknowns for Phase 2D (Letta)