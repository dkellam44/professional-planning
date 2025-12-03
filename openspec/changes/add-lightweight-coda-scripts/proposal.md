# Change: Add Lightweight Coda Script Alternative

## Why

**Current State**:
- Coda MCP server provides 34 tools via JSON-RPC protocol
- Each AI conversation loads all 34 tool schemas
- Multi-step workflows pass intermediate results through LLM multiple times

**Evidence-Based Problem**:
- Anthropic research: Tool definitions can consume 150,000 tokens for complex workflows
- Token waste: Intermediate data (like full documents) flow through model context unnecessarily
- Pattern mismatch: LLMs trained on real code (millions of examples) vs. synthetic tool-calling patterns
- Missing capabilities: MCP tools can't cache data or do local processing

**Proven Opportunity** (from Anthropic/Cloudflare research):
- **98.7% token reduction**: 150,000 → 2,000 tokens (Anthropic case study)
- **Better performance**: "LLMs are better at writing code to call MCP than calling MCP directly" (Cloudflare)
- **Progressive disclosure**: Load only needed tools via filesystem exploration
- **Local processing**: Filter/transform data in execution environment, not LLM context
- **Caching**: Compensate for missing API search with local pandas cache (Dan Isler pattern)

## What Changes

**ADDED**: Substantial Python scripts (200-300 lines each) following beyond-mcp patterns

**Scope** (7 core scripts):
1. `get_document.py` - Retrieve document with caching
2. `list_documents.py` - List docs with local pandas search
3. `get_table.py` - Get table schema with column analysis
4. `list_rows.py` - Query rows with local filtering/transformation
5. `create_row.py` - Batch insert with validation
6. `update_row.py` - Smart update with diff detection
7. `delete_row.py` - Safe delete with confirmation

**Script Features** (beyond simple API wrappers):
- **Caching layer**: Pandas-based local cache for instant re-queries
- **Data processing**: Filter/transform results before returning to LLM
- **Error handling**: Comprehensive validation and retry logic
- **Dual output modes**: JSON for agents, human-readable for debugging
- **Absolute path resolution**: Portable across invocation contexts

**Progressive Disclosure Pattern**:
- Scripts organized in `docs/system/scripts/coda-scripts/`
- AI agent explores filesystem to discover needed tools
- Only loads script content when executing (vs. loading all 34 MCP schemas)

**Out of Scope**:
- Replacing Coda MCP (remains primary integration for external clients)
- Real-time updates (scripts are one-shot with caching)
- Complex workflows (Phase 1 focuses on core CRUD + caching)

## Impact

**Affected specs**: New capability: `lightweight-api-scripts`

**Affected code**:
- New: `docs/system/scripts/coda-scripts/` (7 Python scripts, 200-300 lines each)
- New: `docs/system/scripts/coda-scripts/cache/` (local pandas cache)
- New: `docs/system/scripts/coda-scripts/tests/` (comprehensive test suite)
- New: `docs/system/scripts/coda-scripts/USAGE.md` (guide with token metrics)

**Benefits**:
- **Token efficiency**: 98.7% reduction (proven by Anthropic research)
- **Better LLM performance**: Code-writing leverages training on real repositories
- **Local processing**: Data filtering in scripts, not LLM context
- **Caching**: Instant re-queries without API calls
- **Full control**: Scripts customizable vs. locked MCP implementations

**Use Cases** (from Dan Isler's 80/10/10 framework):
- **80% of agent tasks**: Direct script execution for custom workflows
- Coda MCP remains for: External clients (ChatGPT, Claude.ai), OAuth flows

**Non-Breaking**: Coda MCP OAuth 2.1 implementation continues unchanged

---

## Strategic Context (Updated 2025-12-02)

**Status**: Phase 1 PRIORITY - This approach is now the recommended Coda access strategy for local CLI workflows.

**Key Decisions**:
1. **Pattern-specific MCP tools archived**: `coda-mcp-pattern-integration` change archived as over-engineered for personal use (generic CRUD sufficient)
2. **Pattern tables already exist**: `coda-pattern-tables-implementation` change archived (Coda schema already has Service Blueprints, Workflows, Process Templates)
3. **Hybrid approach**: Lightweight scripts for Phase 1 (0-2 months), custom MCP server with CIMD OAuth for Phase 2 (2-6 months)
4. **Token efficiency validated**: 95-99% savings (Anthropic research) makes scripts ideal for Claude Code CLI contexts

**Integration with Planner & Memory Architecture**:
- Planner Engine will use lightweight scripts to query Coda (Service Blueprints, Workflows, Process Templates)
- Observer Agent will use scripts to post reflections to Coda Daily Thread
- Execution runs will be created via `create_row.py` script (user adding `execution_runs` table manually)
- Future: Custom MCP server (Phase 2) will provide generic CRUD for external clients (ChatGPT, Open WebUI)

**Remaining Work**:
- Complete 5 script implementations (get_table, list_rows, create_row, update_row, delete_row)
- Measure actual token savings in production use
- Document integration patterns with Planner/Observer services

**Future Phases**:
- Phase 2 (2-6 months): Build custom MCP server with MCP 2025-11-25 spec (CIMD OAuth, Tasks API)
- Phase 4 (6+ months): Integrate with Open WebUI for personal chat interface
- Phase 5 (12+ months): Evaluate pattern-specific tools if building multi-tenant SaaS

See `/Users/davidkellam/.claude/plans/coda-access-strategy.md` for full strategic analysis.
