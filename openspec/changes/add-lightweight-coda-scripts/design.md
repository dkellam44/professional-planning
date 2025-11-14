# Design: Lightweight Coda Scripts

## Context

**MCP Architecture** (Current):
- 34 tools loaded as JSON-RPC schemas
- Every conversation: Full schema in context (~3-5K tokens)
- Multi-step: Intermediate results through LLM context
- No caching: Each query hits Coda API
- No local processing: Data transformation in LLM context

**Code Execution Pattern** (Research-Backed):
- **Anthropic findings**: 98.7% token reduction (150K → 2K)
- **Cloudflare findings**: LLMs better at code than tool-calling
- **Dan Isler patterns**: 200-300 line scripts with caching
- **Progressive disclosure**: Load tools on-demand via filesystem

## Goals / Non-Goals

**Goals**:
- ✅ **98.7% token efficiency**: Match Anthropic's proven metrics
- ✅ **Substantial scripts**: 200-300 lines (not thin wrappers)
- ✅ **Caching layer**: Local pandas cache for instant re-queries
- ✅ **Data processing**: Filter/transform before returning to LLM
- ✅ **Progressive disclosure**: Filesystem-based tool discovery
- ✅ **Dual output**: JSON (agents) + human-readable (debug)

**Non-Goals**:
- ❌ Replace Coda MCP (complementary pattern)
- ❌ All 34 tools (only core 7 operations)
- ❌ Real-time sync (one-shot execution with caching)
- ❌ Production library (reference implementation)

## Decisions

### Decision 1: Script Complexity

**Choice**: 200-300 line implementations (following Dan Isler pattern)

**Rationale**:
- Simple wrappers don't provide value over MCP
- Caching, error handling, data processing justify complexity
- Matches proven beyond-mcp architecture

**Example Structure**:
```python
# get_document.py (~250 lines)

# 1. Imports & Constants (20 lines)
import requests, pandas as pd, json, sys
from pathlib import Path

# 2. Caching Layer (50 lines)
class DocumentCache:
    def __init__(self):
        self.cache_dir = Path(__file__).parent / "cache"
        self.cache_file = self.cache_dir / "documents.parquet"

    def get(self, doc_id): ...
    def set(self, doc_id, data): ...

# 3. API Client (50 lines)
class CodaClient:
    def get_document(self, doc_id):
        # Retries, error handling, logging
        ...

# 4. Data Processing (50 lines)
def filter_document_metadata(raw_data):
    # Remove large fields, format dates, etc.
    ...

# 5. Output Formatting (30 lines)
def format_output(data, mode="json"):
    if mode == "json":
        return json.dumps({"success": True, "data": data})
    else:
        # Human-readable table format
        ...

# 6. Main Entry Point (50 lines)
if __name__ == "__main__":
    # Arg parsing, execution, error handling
    ...
```

### Decision 2: Caching Strategy

**Choice**: Pandas-based local cache (following Dan Isler pattern)

**Why Pandas**:
- Fast local search (compensates for missing Coda API search)
- DataFrames persist easily (parquet format)
- Natural data transformation primitives

**Cache Locations**:
```
docs/system/scripts/coda-scripts/cache/
├── documents.parquet      # List of all documents
├── tables_{docId}.parquet # Tables per document
└── rows_{tableId}.parquet # Rows per table (TTL: 1 hour)
```

**Cache Invalidation**:
- Documents/tables: Manual invalidation (rarely change)
- Rows: 1-hour TTL (balance freshness vs. API calls)

### Decision 3: Progressive Disclosure Pattern

**Implementation**: Filesystem-based tool discovery

**How It Works**:
```
AI Agent: "What Coda scripts are available?"
→ Reads: ls docs/system/scripts/coda-scripts/
→ Sees: get_document.py, list_documents.py, ...
→ Loads ONLY needed script when executing
```

**Token Comparison**:

| Approach | Schema Loading | Execution | Total |
|----------|----------------|-----------|-------|
| MCP (34 tools) | 3,000 tokens | 50 tokens/call | 3,050+ |
| Scripts (7 tools) | 0 tokens | 20 tokens/script | 20-140 |

**Savings**: 95-99% depending on workflow complexity

### Decision 4: Dual Output Modes

**Choice**: Support both JSON (agents) and human-readable (debugging)

**Example**:
```python
# JSON mode (default for AI agents)
{"success": true, "data": {"name": "Project Plan", "id": "abc123"}}

# Human mode (for manual debugging)
Document: Project Plan
ID: abc123
Created: 2025-01-15
Tables: 3
```

**Invocation**:
```bash
python get_document.py abc123              # JSON mode
python get_document.py abc123 --human      # Human mode
```

### Decision 5: Error Handling

**Pattern**: Comprehensive validation + retries (match MCP behavior)

**Levels**:
1. **Input validation**: Check doc_id format before API call
2. **API errors**: Retry with exponential backoff (3 attempts)
3. **Data validation**: Verify response schema
4. **Cache errors**: Fallback to API if cache corrupted

**Output Format**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Document abc123 not found",
    "details": "API returned 404"
  }
}
```

## Token Usage Analysis

**Scenario**: "Find document named 'Q1 Goals' and list its tables"

### MCP Approach:
```
1. Load all 34 tool schemas          3,000 tokens
2. Call list_documents tool             50 tokens
3. LLM processes full list           1,000 tokens (20 docs)
4. LLM filters to find "Q1 Goals"      200 tokens
5. Call list_tables tool                50 tokens
6. Return result                       100 tokens
-------------------------------------------
Total:                               4,400 tokens
```

### Script Approach:
```
1. No schema loading                     0 tokens
2. Execute list_documents.py            20 tokens
   - Checks cache (instant)
   - Filters locally: name="Q1 Goals"
   - Returns only matching doc
3. Execute list_tables.py               20 tokens
   - Gets tables for doc_id
   - Returns formatted list
-------------------------------------------
Total:                                  40 tokens

Token savings: 99.1% (4,400 → 40)
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Scripts break when Coda API changes | Pin to API version, monitor Coda changelog |
| Cache staleness | Implement TTL, provide force-refresh flag |
| Complexity (200 lines vs. simple wrapper) | Comprehensive tests, clear documentation |
| Security (API token in scripts) | Environment variable only, never hardcoded |
| Maintenance (7 scripts vs. 1 MCP server) | Focus on core CRUD, document update process |

## Use Case Framework (Dan Isler's 80/10/10)

**Use Scripts (80% of tasks)**:
- Custom workflows requiring caching
- Data processing before LLM (filtering, transformation)
- Batch operations (bulk inserts)
- Token-constrained contexts
- Full control over implementation

**Use Coda MCP (10% of tasks)**:
- External clients (ChatGPT, Claude.ai web)
- Shared tools across projects
- OAuth flows required

**Use Direct API (10% of tasks)**:
- One-off scripts
- Non-AI automation

## Migration Plan

**Phase 1** (This Change): Core implementation
- Build 7 scripts with caching
- Test equivalence with MCP
- Measure token savings

**Phase 2**: Expansion (if successful)
- Add page operations (create, update, delete)
- Add formula operations
- Add control operations (buttons)

**Phase 3**: Ecosystem integration
- Create Claude Code skill (auto-discovery)
- Document integration patterns
- Share findings with community

## Open Questions

1. **Should cache be opt-in or default?**
   - **Lean**: Default with `--no-cache` flag (maximize performance)

2. **Should scripts support batch operations from CSV/JSON?**
   - **Lean**: Yes for create_row.py (common use case)

3. **Should we create a shared utilities module?**
   - **Lean**: Yes (`coda_utils.py`) to avoid duplication across 7 scripts
