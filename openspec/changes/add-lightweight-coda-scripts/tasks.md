# Implementation Tasks: Lightweight Coda Scripts

## 1. Research & Architecture Setup
- [ ] 1.1 Read Anthropic blog: Code Execution with MCP (✅ Done)
- [ ] 1.2 Read Cloudflare blog: Code Mode (✅ Done)
- [ ] 1.3 Study Dan Isler's beyond-mcp repository (✅ Done)
- [ ] 1.4 Review Coda MCP source (integrations/mcp/servers/coda/src/)
- [ ] 1.5 Extract Coda API patterns from MCP implementation
- [ ] 1.6 Design caching strategy (pandas-based local cache)
- [ ] 1.7 Set up directory structure:
  ```
  docs/system/scripts/coda-scripts/
  ├── cache/              # Pandas cache storage
  ├── tests/              # Test suite
  ├── get_document.py
  ├── list_documents.py
  ├── get_table.py
  ├── list_rows.py
  ├── create_row.py
  ├── update_row.py
  ├── delete_row.py
  └── USAGE.md
  ```

## 2. Core Infrastructure
- [ ] 2.1 Create base utilities module (error handling, caching, path resolution)
- [ ] 2.2 Implement pandas caching layer (following Isler pattern)
- [ ] 2.3 Create dual output formatter (JSON for agents, human-readable for debug)
- [ ] 2.4 Set up absolute path resolution (Path(__file__).resolve())
- [ ] 2.5 Create environment variable loader (CODA_API_TOKEN)

## 3. Script Development (200-300 lines each)
- [ ] 3.1 **get_document.py**:
  - API call to GET /docs/{docId}
  - Cache result in pandas DataFrame
  - Return filtered metadata (exclude large fields)
  - Error handling with retries

- [ ] 3.2 **list_documents.py**:
  - API call to GET /docs
  - Store in local pandas cache
  - Implement local search (compensates for missing API search)
  - Sort/filter options

- [ ] 3.3 **get_table.py**:
  - API call to GET /docs/{docId}/tables/{tableId}
  - Analyze column types and constraints
  - Cache schema for fast re-access

- [ ] 3.4 **list_rows.py**:
  - API call to GET /docs/{docId}/tables/{tableId}/rows
  - Local filtering with pandas (reduce tokens)
  - Pagination handling
  - Data transformation options

- [ ] 3.5 **create_row.py**:
  - Batch insert capability
  - Validation against cached schema
  - Conflict resolution

- [ ] 3.6 **update_row.py**:
  - Diff detection (only send changed fields)
  - Optimistic locking

- [ ] 3.7 **delete_row.py**:
  - Safety confirmation
  - Cascade handling

## 4. Testing
- [ ] 4.1 Create equivalence test framework (scripts vs MCP tools)
- [ ] 4.2 Test get_document.py (API parity, caching, error handling)
- [ ] 4.3 Test list_documents.py (caching, local search)
- [ ] 4.4 Test get_table.py (schema caching)
- [ ] 4.5 Test list_rows.py (filtering, transformation)
- [ ] 4.6 Test create_row.py (batch insert, validation)
- [ ] 4.7 Test update_row.py (diff detection)
- [ ] 4.8 Test delete_row.py (safety checks)
- [ ] 4.9 Measure token usage: MCP vs Scripts (reproduce 98.7% savings)
- [ ] 4.10 Validate caching performance (cache hit latency)

## 5. Documentation & Validation
- [ ] 5.1 Create USAGE.md:
  - Setup instructions (dependencies, API token)
  - Each script's usage with examples
  - Token comparison table (MCP vs Scripts)
  - Decision framework (when to use scripts vs MCP)
  - Caching behavior documentation

- [ ] 5.2 Document progressive disclosure pattern
- [ ] 5.3 Create sample workflows:
  - "List all docs and find one by name" (demonstrates caching)
  - "Batch create rows from CSV" (demonstrates data processing)
  - "Update multiple rows with transformation" (demonstrates filtering)

- [ ] 5.4 Test with real Coda workspace
- [ ] 5.5 Measure actual token savings (log before/after)
- [ ] 5.6 Update spec with validation results

## 6. Integration
- [ ] 6.1 Test scripts in Claude Code execution environment
- [ ] 6.2 Verify filesystem discovery pattern works
- [ ] 6.3 Validate caching persists across invocations
- [ ] 6.4 Document integration patterns for other AI clients
