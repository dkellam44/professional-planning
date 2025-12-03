# Change: Investigate Context Engineering Architecture & Memory Management Strategy

**Change ID**: `investigate-archon-memory-architecture`
**Status**: PROPOSAL
**Created**: 2025-11-14
**Type**: Investigation → Learning → Design → Documentation

---

## Why

The system currently has **multiple deployed services with memory/context capabilities**, but lacks:
1. **Clear understanding of context engineering goals** and architecture patterns
2. **Documentation of what's already deployed** and how it works
3. **Strategic framework** for evaluating memory management solutions
4. **Informed basis** for choosing between Archon, Letta, mem0, Google offerings, or other solutions

### Deployed Services (Status: Production, Capabilities: Unclear)

1. **Archon Stack** (deployed 2025-11-12, healthy 38+ hours):
   - `archon-server` (port 8181) - function unknown
   - `archon-mcp` (port 8051, 12 MCP tools) - tools undocumented
   - `archon-ui` (port 3737) - web interface, purpose unclear
   - **Database usage**: Unknown (postgres? qdrant? separate DB?)
   - **Memory strategy**: Unknown (stateful? stateless? embedded?)
   - **Context capabilities**: Unknown (what problems does it solve?)

2. **Open WebUI** (deployed as `openweb`, port 8080):
   - **Purpose**: LLM chat interface with multiple model support
   - **Memory capabilities**: Unknown (does it store chat history? context? RAG?)
   - **Database usage**: Unknown (postgres? separate DB? file-based?)
   - **Integration potential**: Can it serve as memory layer? Context manager? UI for Archon?
   - **Overlap with Archon**: Unknown (complementary or redundant?)

3. **Qdrant** (vector database, port 6333):
   - **Purpose**: Vector embeddings and semantic search
   - **Usage**: Who writes? Who reads? What collections exist?
   - **Integration**: Connected to Archon? Open WebUI? n8n? Direct via API?

4. **PostgreSQL** (relational database, port 5432):
   - **Known usage**: n8n workflows, credentials
   - **Unknown usage**: Archon agent state? Open WebUI chat history? Memory persistence?
   - **Schema**: No documentation of tables/schemas beyond n8n

### Critical Knowledge Gaps

**Fundamental Understanding Gaps**:
- **What is context engineering?** (architectural patterns, industry best practices)
- **What are the goals?** (short-term memory? long-term memory? semantic retrieval? personalization?)
- **What are the requirements?** (persistence? search? multimodal? temporal reasoning?)
- **What are the trade-offs?** (latency vs accuracy, cost vs capability, complexity vs maintainability)

**Deployed System Gaps**:
- Where does conversational memory live? (RAM, postgres, qdrant, distributed?)
- How is context embedded and stored in Qdrant? (collections? indexing strategy?)
- What is the data flow between archon-server ↔ postgres ↔ qdrant ↔ archon-mcp?
- What does Open WebUI store? (chat logs? embeddings? user preferences?)
- How do these systems interact (if at all)?

**Strategic Decision Gaps** (Blocking Future Choices):
- Should we keep **Archon** as primary memory system?
- Should we deploy **Letta** (agent memory management with RAG)?
- Should we deploy **mem0** (context persistence and retrieval)?
- Should we adopt **Google's new memory offering** (Gemini context caching)?
- Can **Open WebUI** serve memory management needs?
- Should we consolidate to one system or keep multiple specialized systems?
- How does **n8n** fit into context engineering workflows?

### Current Pain Points

1. **Zero foundational knowledge** of context engineering architecture patterns
2. **Zero documentation** of Archon architecture despite 38+ hours in production
3. **Zero understanding** of Open WebUI's memory/context capabilities
4. **Cannot make informed decisions** without understanding goals and requirements first
5. **Risk of wrong solution** (deploying Letta when Archon already does what we need)
6. **Risk of redundant deployments** (multiple systems doing same thing)
7. **Risk of missing capabilities** (none of current systems meet actual requirements)

### Desired Outcome

**By end of this initiative**:

1. ✅ **Understand context engineering fundamentals**:
   - Learn industry patterns (short-term vs long-term memory, RAG, semantic search)
   - Understand architectural approaches (stateless vs stateful, embedded vs external)
   - Define clear goals and requirements for THIS system
   - Establish evaluation framework for comparing solutions

2. ✅ **Understand current deployed state**:
   - Document Archon's architecture (components, data flow, persistence, capabilities)
   - Document Open WebUI's capabilities (memory, RAG, context management)
   - Map database usage (which service writes/reads where)
   - Document Qdrant collections and embedding strategy
   - List archon-mcp's 12 MCP tools with descriptions

3. ✅ **Design memory management strategy**:
   - Define system goals (what problems are we solving?)
   - Define requirements (MUST/SHOULD capabilities)
   - Evaluate alternatives against requirements (Archon vs Letta vs mem0 vs Google vs Open WebUI vs hybrid)
   - Make informed strategic decisions with clear rationale
   - Design integration patterns (n8n orchestration, MCP tools, UI layers)

4. ✅ **Create architectural documentation**:
   - `CONTEXT_ENGINEERING_PRIMER.md` - fundamentals, patterns, goals
   - `ARCHON_ARCHITECTURE.md` - current Archon implementation
   - `OPEN_WEBUI_CAPABILITIES.md` - Open WebUI memory features
   - `DATA_PERSISTENCE_TOPOLOGY.md` - who writes where, schema inventory
   - `MEMORY_MANAGEMENT_STRATEGY.md` - strategic decisions, rationale, roadmap
   - Update existing docs (SERVICE_INVENTORY, MCP_CATALOG, DIAGRAMS)

---

## What Changes

This is a **four-phase learning, investigation, and design initiative**, not a deployment project.

### Phase 0: Learning (Context Engineering Fundamentals)

**Goal**: Understand what context engineering is and what this system should achieve

**Activities**:
1. **Research context engineering patterns**:
   - Use LLM (Claude, ChatGPT) to learn fundamentals
   - Read industry resources on RAG, semantic memory, agent memory
   - Understand architectural patterns (stateless, stateful, hybrid)
   - Learn about vector databases, embeddings, retrieval strategies

2. **Define system goals**:
   - What problems are we solving? (chat continuity? personalization? knowledge retrieval?)
   - What user experiences do we want? (remember past conversations? recall facts? context-aware responses?)
   - What scale/scope? (single user? multi-user? per-project? global?)
   - What latency/cost constraints? (real-time? batch? token budget?)

3. **Establish evaluation framework**:
   - Define capability categories (persistence, retrieval, integration, UX)
   - Define evaluation criteria (ease of use, cost, complexity, maintainability)
   - Create decision matrix for comparing solutions

4. **Document foundational knowledge**:
   - Create `CONTEXT_ENGINEERING_PRIMER.md` in change directory
   - Architectural patterns explained
   - Goals and requirements for THIS system
   - Evaluation framework for Phase 2

**Deliverable**: Clear understanding of context engineering goals and requirements framework

---

### Phase 1: Discovery (Investigation)

**Goal**: Understand what's already deployed and how it works

**Activities**:
1. **Inspect Archon stack**:
   - Read codebase/docs (if available in service-builds/)
   - Identify persistence layer (postgres? separate DB? in-memory?)
   - Understand archon-mcp tool implementations
   - Test archon-ui web interface
   - Review docker-compose configuration

2. **Inspect Open WebUI (openweb)**:
   - Access web interface at `https://openweb.bestviable.com` (or localhost:8080)
   - Explore memory/context features (chat history, RAG, knowledge bases)
   - Identify database backend (separate DB? postgres? file-based?)
   - Review docker-compose configuration and volumes
   - Test creating conversations, uploading documents, context retrieval

3. **Inspect databases**:
   - Query postgres: `psql -l` to list databases, identify Archon/Open WebUI tables
   - Query Qdrant: `curl /collections` to list vector collections
   - Analyze schemas and data models
   - Map which service owns which data

4. **Trace data flow**:
   - Follow archon-server logs during initialization
   - Test archon-mcp tools via Claude Code (if accessible)
   - Check Open WebUI memory features during chat
   - Map network connections (which services talk to which)

5. **Document findings**:
   - Create `DISCOVERY_FINDINGS.md` in change directory
   - Diagrams of Archon components and data flow
   - Diagrams of Open WebUI architecture
   - List of capabilities discovered
   - List of unknowns that require deeper investigation

**Deliverable**: Complete understanding of deployed services' capabilities and architecture

---

### Phase 2: Design (Strategic Decision-Making)

**Goal**: Make informed decisions about memory management strategy using learned framework

**Activities**:
1. **Evaluate alternatives against requirements**:
   - **Option A**: Keep Archon as primary memory system
   - **Option B**: Keep Open WebUI as primary memory system
   - **Option C**: Deploy Letta (agent memory + RAG)
   - **Option D**: Deploy mem0 (lightweight context persistence)
   - **Option E**: Adopt Google memory offering (Gemini context caching)
   - **Option F**: Hybrid approach (Archon for agents, Open WebUI for chat, n8n for orchestration)
   - **Option G**: Replace both with single unified solution

2. **Apply evaluation framework** (from Phase 0):
   - Score each option against defined criteria
   - Consider integration complexity, resource footprint, developer experience
   - Consider maintenance burden, community support, documentation quality
   - Consider cost (compute, storage, API calls)

3. **Make strategic decisions**:
   - Primary memory system selection (with rationale)
   - Database architecture (shared postgres vs separate DBs)
   - n8n integration pattern (orchestrator vs parallel systems)
   - Vector storage strategy (Qdrant collections, indexing approach)
   - Context lifecycle management (TTL, archival, compression)
   - UI layer strategy (Open WebUI vs archon-ui vs custom)

4. **Document design choices**:
   - Create `design.md` in change directory (OpenSpec pattern)
   - Architecture diagrams for chosen approach
   - Migration path if replacing systems (Archon and/or Open WebUI)
   - Integration specifications for n8n, MCP, workflows
   - Clear rationale for each decision

**Deliverable**: Strategic memory management plan with informed decisions and rationale

---

### Phase 3: Documentation (Knowledge Capture)

**Goal**: Create architectural documentation reflecting learned fundamentals, investigated reality, and design decisions

**Activities**:
1. **Create new foundational documentation**:
   - `docs/system/architecture/CONTEXT_ENGINEERING_PRIMER.md`
     - Fundamentals of context engineering
     - Architectural patterns (stateless, stateful, RAG, semantic memory)
     - Goals for THIS system (requirements, constraints, priorities)
     - Evaluation framework used for solution selection

2. **Create new architecture documentation**:
   - `docs/system/architecture/ARCHON_ARCHITECTURE.md`
     - Component diagram (archon-server, archon-mcp, archon-ui)
     - Data flow (memory creation → storage → retrieval)
     - Persistence strategy (postgres tables, qdrant collections)
     - MCP tool descriptions (all 12 tools documented)
     - Capabilities and limitations

   - `docs/system/architecture/OPEN_WEBUI_CAPABILITIES.md`
     - Architecture overview (containers, databases, volumes)
     - Memory features (chat history, RAG, knowledge bases, model memory)
     - Integration points (APIs, MCP, n8n)
     - Capabilities and limitations

   - `docs/system/architecture/DATA_PERSISTENCE_TOPOLOGY.md`
     - Database usage matrix (which service writes/reads where)
     - PostgreSQL schema inventory (n8n, archon, openweb tables)
     - Qdrant collection inventory (what's embedded, indexing strategy)
     - Data lifecycle (creation → embedding → retrieval → deletion)

   - `docs/system/architecture/MEMORY_MANAGEMENT_STRATEGY.md`
     - Strategic decisions (chosen solution with rationale)
     - Comparison matrix (alternatives evaluated)
     - Integration patterns (n8n, MCP, Claude Code, UI layers)
     - Migration plan (if replacing systems)
     - Future roadmap (Phase 2D, Phase 3+)

3. **Update existing documentation**:
   - `docs/system/architecture/SERVICE_INVENTORY.md`
     - Archon services: full details (currently "optional")
     - Open WebUI: memory capabilities documented
     - Database connections and dependencies
     - Resource allocation and health endpoints

   - `docs/system/architecture/MCP_SERVER_CATALOG.md`
     - archon-mcp: tool descriptions, usage examples
     - Integration guidance for Claude Code

   - `docs/system/architecture/ARCHITECTURE_DIAGRAMS.md`
     - Add Archon memory flow diagram
     - Add Open WebUI architecture diagram
     - Add data persistence topology diagram
     - Add context engineering flow diagram

4. **Create OpenSpec capability specifications**:
   - `specs/memory-persistence/spec.md`
     - Requirements: MUST persist across restarts, SHOULD support semantic search
     - Scenarios: Memory creation, retrieval, expiration

   - `specs/context-engineering/spec.md`
     - Requirements: MUST embed context, SHOULD retrieve relevant memories
     - Scenarios: n8n workflow retrieval, MCP tool access, LLM context injection

**Deliverable**: Complete architectural documentation ready for operational use and future decision-making

---

## Phases and Timeline

| Phase | Duration | Effort | Deliverables |
|-------|----------|--------|--------------|
| **Phase 0: Learning** | 2-3 hours | Research & Framework | CONTEXT_ENGINEERING_PRIMER.md, evaluation framework |
| **Phase 1: Discovery** | 3-5 hours | Investigation | DISCOVERY_FINDINGS.md, component diagrams, data flow maps |
| **Phase 2: Design** | 3-5 hours | Analysis & Decision | design.md, strategic plan, comparison matrix |
| **Phase 3: Documentation** | 5-7 hours | Writing | 5 new docs + 3 updated docs + 2 capability specs |
| **Total** | **13-20 hours** | **Medium-High** | **Complete context engineering knowledge base** |

---

## Success Criteria

### Learning Phase ✅
- [ ] Understand context engineering fundamentals (patterns, approaches, trade-offs)
- [ ] Define clear goals for THIS system (what problems are we solving?)
- [ ] Define requirements framework (MUST/SHOULD capabilities)
- [ ] Create evaluation criteria for comparing solutions
- [ ] Document foundational knowledge in CONTEXT_ENGINEERING_PRIMER.md

### Discovery Phase ✅
- [ ] Understand where agent memory is stored (postgres? qdrant? RAM?)
- [ ] Document all 12 archon-mcp MCP tools with descriptions
- [ ] Map Archon data flow: archon-server ↔ postgres ↔ qdrant ↔ archon-mcp
- [ ] Document Open WebUI memory capabilities (chat history, RAG, knowledge bases)
- [ ] Identify all postgres tables (n8n, archon, openweb)
- [ ] List Qdrant collections and indexing strategy
- [ ] Map integration points (n8n, MCP, UI layers)

### Design Phase ✅
- [ ] Evaluate 7 alternatives (Archon, Open WebUI, Letta, mem0, Google, hybrid, replace-both)
- [ ] Apply evaluation framework to score each option
- [ ] Make strategic decision on primary memory system (with rationale)
- [ ] Define database architecture (shared vs separate)
- [ ] Design n8n integration pattern
- [ ] Design UI layer strategy
- [ ] Specify context lifecycle management approach

### Documentation Phase ✅
- [ ] Create 5 new architecture documents (primer, archon, openweb, data topology, memory strategy)
- [ ] Update 3 existing documents (SERVICE_INVENTORY, MCP_CATALOG, DIAGRAMS)
- [ ] Create 2 OpenSpec capability specs (memory persistence, context engineering)
- [ ] All documentation reflects learned fundamentals and investigated reality
- [ ] Zero architectural unknowns remaining for memory/context systems

---

## Dependencies

- **Requires**: SSH access to droplet (✅ available)
- **Requires**: Archon services running (✅ healthy since 2025-11-12)
- **Requires**: Open WebUI running (✅ healthy as `openweb`)
- **Requires**: postgres and qdrant accessible (✅ on docker_syncbricks network)
- **Requires**: Access to LLM for learning context engineering (✅ Claude available)
- **Blocks**: Phase 2D (Letta deployment decision)
- **Blocks**: Database consolidation decisions
- **Blocks**: n8n workflow memory integration

---

## Risks & Mitigations

### Low Risk
- **Learning takes longer than expected**
  - Mitigation: Start with focused LLM prompts, limit scope to essential patterns
  - Impact: Timeline extends by 1-2 hours

- **Discovery reveals minimal documentation**
  - Mitigation: Inspect code, trace logs, reverse-engineer from behavior
  - Impact: Increases discovery time, but still achievable

### Medium Risk
- **Strategic decision reveals need to replace both Archon and Open WebUI**
  - Mitigation: Design migration path in Phase 2, leverage downtime tolerance
  - Impact: Future deployment work, but not blocking this investigation

- **Multiple systems needed (no single winner)**
  - Mitigation: Design integration patterns, define clear boundaries
  - Impact: Increased operational complexity, document trade-offs

### Downtime Risk: NONE ✅
- **Project not yet launched** - downtime is not a concern
- Services can be stopped/restarted for investigation without user impact
- Can test destructive operations (data deletion, schema changes) safely
- Can migrate/replace systems without production urgency

---

## Out of Scope

This change does **NOT** include:
- ❌ Deploying Letta (separate initiative if chosen in Phase 2)
- ❌ Deploying mem0 (separate initiative if chosen in Phase 2)
- ❌ Adopting Google memory offering (separate initiative if chosen in Phase 2)
- ❌ Implementing new memory features
- ❌ Migrating data between systems (design only, execution later)
- ❌ Building custom memory management code
- ❌ Launching the project to production

This is **learning + investigation + design + documentation only**.

**Note**: Archon is ONE POSSIBLE SOLUTION among many. The goal is to understand requirements first, then choose the best solution (which may be Archon, may be something else, may be a combination). No assumptions about keeping or replacing any current system.

---

## Related Context

**Related OpenSpec Changes**:
- `update-infrastructure-docs-post-droplet-upgrade` (archived 2025-11-14) - Infrastructure documentation baseline
- `implement-mcp-oauth-strategy-and-sop` (active 33% complete) - MCP authentication patterns

**Related Documentation**:
- `docs/system/architecture/SERVICE_INVENTORY.md` - Current service catalog (Archon listed as "optional")
- `docs/system/architecture/MCP_SERVER_CATALOG.md` - archon-mcp listed, tools undocumented
- `docs/system/architecture/ARCHITECTURE_DIAGRAMS.md` - No Archon or Open WebUI memory diagrams

**Related Services**:
- `openspec/project.md` Phase 2A: Archon deployment (marked COMPLETE, but undocumented)
- `openspec/project.md` Phase 2D: Letta integration (BLOCKED pending this investigation)

**Research Resources** (for Phase 0):
- LLM consultation (Claude, ChatGPT) for context engineering fundamentals
- Industry documentation (LangChain memory, LlamaIndex memory modules, Letta docs, mem0 docs)
- Vector database patterns (Qdrant, Pinecone, Weaviate best practices)

---

## Next Steps

1. **Review and approve this proposal** - Confirm scope, approach, and emphasis on learning-first
2. **Create `tasks.md`** - Break down learning, discovery, design, documentation into actionable tasks
3. **Create `design.md` skeleton** - Prepare for Phase 2 strategic decisions
4. **Begin Phase 0: Learning** - Use LLM to understand context engineering fundamentals, define goals
5. **Then Phase 1: Discovery** - Inspect Archon, Open WebUI, databases with clear requirements framework

**Estimated Start**: 2025-11-14 (today)
**Estimated Completion**: 2025-11-15 to 2025-11-18 (depending on learning depth and findings complexity)
