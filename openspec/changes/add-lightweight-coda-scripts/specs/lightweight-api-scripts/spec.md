# Specification: Lightweight API Scripts

## ADDED Requirements

### Requirement: Substantial Script Implementation

Scripts SHALL be 200-300 lines with caching, data processing, and comprehensive error handling (following beyond-mcp patterns).

#### Scenario: Script includes caching layer
- **GIVEN** script executed for first time
- **WHEN** data retrieved from Coda API
- **THEN** result cached locally in pandas DataFrame
- **AND** subsequent queries read from cache (instant response)

#### Scenario: Script processes data locally
- **GIVEN** list_documents.py executed with search query
- **WHEN** search filter applied
- **THEN** filtering happens in pandas (not LLM context)
- **AND** only matching results returned to agent

### Requirement: 98.7% Token Efficiency

Scripts SHALL achieve 95-99% token reduction compared to MCP tool loading (validated by Anthropic research).

#### Scenario: Multi-step workflow token comparison
- **GIVEN** workflow: "Find document by name, list its tables"
- **WHEN** executed via MCP approach
- **THEN** token usage ≥ 3,000 tokens (schema loading)
- **WHEN** executed via scripts
- **THEN** token usage ≤ 100 tokens (no schema, progressive disclosure)
- **AND** savings ≥ 95%

### Requirement: Progressive Disclosure Pattern

Scripts SHALL be discoverable via filesystem exploration, loading only when executed.

#### Scenario: Agent discovers available tools
- **GIVEN** AI agent needs Coda integration
- **WHEN** agent explores `docs/system/scripts/coda-scripts/`
- **THEN** agent sees 7 Python scripts
- **AND** no tool schemas loaded until script execution
- **AND** agent can read script docstring to understand usage

### Requirement: Dual Output Modes

Scripts SHALL support both JSON (for agents) and human-readable (for debugging) output formats.

#### Scenario: JSON output for AI agent
- **GIVEN** script executed without --human flag
- **WHEN** script completes successfully
- **THEN** output is valid JSON: `{"success": true, "data": {...}}`

#### Scenario: Human-readable output for debugging
- **GIVEN** script executed with --human flag
- **WHEN** script completes
- **THEN** output is formatted table/text for manual review

### Requirement: Caching Layer

Scripts SHALL implement pandas-based local cache to compensate for missing API search endpoints.

#### Scenario: Cache hit performance
- **GIVEN** document previously retrieved
- **WHEN** same document requested again
- **THEN** result retrieved from cache (< 10ms)
- **AND** no API call made

#### Scenario: Cache invalidation
- **GIVEN** cache TTL expired (1 hour for row data)
- **WHEN** script executed
- **THEN** fresh data fetched from API
- **AND** cache updated with new data

### Requirement: Comprehensive Error Handling

Scripts SHALL handle validation, API errors, and retries matching MCP tool behavior.

#### Scenario: Invalid input validation
- **GIVEN** invalid document ID format
- **WHEN** script executes
- **THEN** error returned before API call
- **AND** clear error message provided

#### Scenario: API error with retry
- **GIVEN** Coda API returns 429 (rate limit)
- **WHEN** script receives error
- **THEN** script retries with exponential backoff
- **AND** succeeds on retry OR returns clear error

### Requirement: CRUD Coverage

Scripts SHALL cover Create, Read, Update, Delete operations for documents, tables, and rows.

#### Scenario: Full CRUD lifecycle
- **GIVEN** user needs table data management
- **WHEN** user reviews available scripts
- **THEN** scripts exist for: list_rows, create_row, update_row, delete_row
- **AND** each script includes caching and data processing

### Requirement: Usage Documentation

Documentation SHALL include token comparison metrics, decision framework, and caching behavior.

#### Scenario: User chooses appropriate approach
- **GIVEN** user reviews USAGE.md
- **WHEN** user reads decision framework
- **THEN** clear guidance provided: "Use scripts for 80% of tasks (custom workflows, caching needed)"
- **AND** "Use MCP for 10% of tasks (external clients, OAuth flows)"
- **AND** token comparison table shows 95-99% savings
