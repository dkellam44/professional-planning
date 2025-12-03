# Coda MCP Pattern Integration - Design

## Overview

This change extends the coda-mcp HTTP API to expose Pattern Ontology tables (service_blueprints, workflows, process_templates, execution_runs) as MCP tools, enabling the Planner & Memory Architecture to read and write pattern data.

## Architecture

### Current coda-mcp Architecture

```
┌─────────────────────────────────────┐
│ coda-mcp (HTTP Server)              │
│                                     │
│  /mcp (POST)                        │
│    ↓                                │
│  Tool Router                        │
│    ↓                                │
│  mcp__coda__list_docs               │
│  mcp__coda__get_table               │
│  mcp__coda__list_rows               │
│  mcp__coda__get_row                 │
│  mcp__coda__create_row              │
│  mcp__coda__update_row              │
│    ↓                                │
│  Coda API Client                    │
└─────────────────────────────────────┘
         ↓ HTTPS
┌─────────────────────────────────────┐
│ Coda API (coda.io)                  │
│                                     │
│  GET /docs/{docId}/tables/{tableId}/rows │
│  POST /docs/{docId}/tables/{tableId}/rows│
└─────────────────────────────────────┘
```

### Extended Architecture (After This Change)

```
┌───────────────────────────────────────────────┐
│ coda-mcp (HTTP Server)                        │
│                                               │
│  Tool Router                                  │
│    ├─ Generic Tools (existing)               │
│    │   ├─ mcp__coda__list_docs               │
│    │   ├─ mcp__coda__get_table               │
│    │   └─ ...                                 │
│    │                                          │
│    └─ Pattern Tools (NEW)                    │
│        ├─ mcp__coda__get_service_blueprint   │
│        ├─ mcp__coda__list_workflows          │
│        ├─ mcp__coda__get_process_template    │
│        ├─ mcp__coda__create_process_template │
│        └─ mcp__coda__create_execution_run    │
│            ↓                                  │
│        Pattern Service (NEW)                 │
│         - Query blueprints                   │
│         - Query workflows                    │
│         - Create templates                   │
│         - Create execution runs              │
│            ↓                                  │
│        Coda API Client                       │
└───────────────────────────────────────────────┘
```

## Design Decisions

### Decision: Pattern-Specific Tools vs Generic Table Operations
**Problem**: Should pattern access use generic `mcp__coda__get_row` or specialized tools?

**Options**:
1. Use generic tools: `mcp__coda__get_row(table="service_blueprints", row_id=...)`
2. Create pattern-specific tools: `mcp__coda__get_service_blueprint(blueprint_id)`
3. Hybrid: Generic for writes, specific for reads

**Decision**: Pattern-specific tools (Option 2)

**Rationale**:
- **Type safety**: Specific tools return typed responses (blueprint has 5 layers, workflow has steps)
- **Relation expansion**: Automatically expand FKs (workflow.service_blueprint → {blueprint_id, name})
- **Validation**: Pattern-specific validation (template_type enum, checklist structure)
- **Discoverability**: Tools are self-documenting (clear names, parameters)
- **Performance**: Can optimize queries per pattern (e.g., pre-filter active workflows)

### Decision: Create vs Update Semantics
**Problem**: How to handle Process Template updates after AI generation?

**Options**:
1. Create-only: AI creates template, user edits in Coda (no update via API)
2. Full CRUD: AI can create, update, delete templates
3. Create + Limited Update: AI can create and update checklist/status only

**Decision**: Create + Limited Update (Option 3)

**Rationale**:
- **Human override**: User should be able to edit in Coda without AI overwriting
- **Status transitions**: AI should be able to mark template "Active" after validation
- **Checklist refinement**: AI should be able to update checklist based on feedback
- **No delete**: Deletion is destructive, should require human approval in Coda

### Decision: Bulk Task Creation from Template
**Problem**: Should coda-mcp create tasks individually or in bulk?

**Options**:
1. Individual: Call `create_row` once per task (N API calls)
2. Bulk: `create_tasks_from_template` parses checklist and creates all tasks (1 API call to MCP, N API calls to Coda)
3. Coda batch API: Use Coda's batch create endpoint (1 API call to Coda)

**Decision**: Bulk tool (Option 2) with future Coda batch upgrade path (Option 3)

**Rationale**:
- **Simplicity**: Planner Engine calls one tool, not N tools
- **Atomicity**: All tasks created or none (can rollback on partial failure)
- **Performance**: Reduces round-trips (1 MCP call vs N MCP calls)
- **Future optimization**: Can upgrade to Coda batch API internally without changing MCP tool signature

### Decision: Execution Run Deduplication
**Problem**: How to prevent duplicate execution runs if Observer Agent retries?

**Options**:
1. No deduplication: Allow duplicates, user cleans up in Coda
2. Idempotency key: Pass run_id, reject if exists
3. Natural key check: Check if (task_id + started_at) exists

**Decision**: Natural key check (Option 3)

**Rationale**:
- **Simple**: No need for client to generate unique IDs
- **Safe**: One task cannot have 2 execution runs at exact same timestamp
- **Retry-safe**: Observer Agent can retry without creating duplicates
- **Query**: `execution_runs.Filter(task = task_id AND started_at = timestamp).Count() > 0 → 409 Conflict`

## API Design

### Read Operations (Phase 1)

#### 1. mcp__coda__get_service_blueprint

**Request**:
```json
{
  "tool": "mcp__coda__get_service_blueprint",
  "params": {
    "blueprint_id": "coda:blueprint-i-abc123"
  }
}
```

**Response**:
```json
{
  "blueprint_id": "coda:blueprint-i-abc123",
  "name": "Marketing Ops Sprint",
  "description": "2-week intensive marketing ops audit and optimization",
  "customer_actions": "Submit intake form, provide analytics access, review recommendations",
  "frontstage": "Kickoff call, weekly check-ins, final presentation",
  "backstage": "Audit analytics, build dashboards, document recommendations",
  "support_processes": "Analytics tools, reporting templates, CRM access",
  "evidence": "Audit report, optimization roadmap, dashboard templates",
  "version": "v1",
  "status": "Active"
}
```

#### 2. mcp__coda__list_workflows

**Request**:
```json
{
  "tool": "mcp__coda__list_workflows",
  "params": {
    "blueprint_id": "coda:blueprint-i-abc123"  // optional filter
  }
}
```

**Response**:
```json
{
  "workflows": [
    {
      "workflow_id": "coda:workflow-i-def456",
      "name": "Marketing Audit Workflow",
      "description": "3-step audit process",
      "steps": "1. Collect data access\n2. Run analysis\n3. Generate report",
      "estimated_hours": 8,
      "automation_status": "Semi-automated",
      "service_blueprint": {
        "blueprint_id": "coda:blueprint-i-abc123",
        "name": "Marketing Ops Sprint"
      },
      "version": "v1",
      "status": "Active"
    }
  ],
  "total": 1
}
```

### Write Operations (Phase 2)

#### 3. mcp__coda__create_process_template

**Request**:
```json
{
  "tool": "mcp__coda__create_process_template",
  "params": {
    "workflow_id": "coda:workflow-i-def456",  // optional
    "name": "Acme Corp Marketing Audit",
    "checklist": "1. Get GA4 access\n2. Pull 90-day data\n3. Build dashboard\n4. Write recommendations",
    "template_type": "Operational"
  }
}
```

**Response**:
```json
{
  "process_template_id": "coda:template-i-ghi789",
  "name": "Acme Corp Marketing Audit",
  "created_at": "2025-12-01T10:30:00Z",
  "status": "Draft"
}
```

#### 4. mcp__coda__create_execution_run

**Request**:
```json
{
  "tool": "mcp__coda__create_execution_run",
  "params": {
    "task_id": "coda:task-i-jkl012",
    "project_id": "coda:project-i-mno345",
    "process_template_id": "coda:template-i-ghi789",
    "started_at": "2025-12-03T09:00:00Z",
    "ended_at": "2025-12-03T11:30:00Z",
    "actual_hours": 2.5,
    "outcome_notes": "Completed audit, found 3 optimization opportunities"
  }
}
```

**Response**:
```json
{
  "run_id": "coda:run-i-pqr678",
  "actual_hours": 2.5,
  "variance_vs_estimate": 0.5,  // task estimated 2 hrs, actual 2.5 hrs
  "created_at": "2025-12-03T11:30:00Z"
}
```

## Error Handling

### Coda API Error Codes

| Coda Status | MCP Status | Response | Action |
|-------------|------------|----------|--------|
| 429 (Rate Limit) | 429 | `{error: "Rate limit exceeded, retry after X seconds"}` | Exponential backoff (1s, 2s, 4s) |
| 401 (Unauthorized) | 401 | `{error: "Coda API token invalid or expired"}` | Return to client, no retry |
| 404 (Not Found) | 404 | `{error: "Blueprint/Workflow/Template not found"}` | Return to client |
| 400 (Bad Request) | 400 | `{error: "Invalid parameters: ..."}` | Return to client |
| 5xx (Server Error) | 503 | `{error: "Coda API unavailable, please retry"}` | Retry once, then fail |

### Input Validation Errors

| Validation | Status | Response |
|------------|--------|----------|
| Missing required param | 400 | `{error: "Missing required parameter: blueprint_id"}` |
| Invalid template_type | 400 | `{error: "template_type must be 'Operational' or 'Communication'"}` |
| Invalid date range | 400 | `{error: "started_at must be before ended_at"}` |
| Duplicate execution run | 409 | `{error: "Execution run already exists for task at this timestamp"}` |

## Performance Considerations

### Coda API Rate Limits
- **Limit**: 100 requests per minute per doc
- **Strategy**: Implement request queue with rate limiting
- **Burst handling**: Allow burst up to 10 req/sec, then throttle

### Response Time Targets
- **Read operations**: < 500ms p95 (Coda API typically 200-300ms)
- **Write operations**: < 1s p95 (includes validation + Coda write)
- **Bulk task creation**: < 5s for 20 tasks

### Caching Strategy
- **Do NOT cache**: Pattern data changes frequently (user edits in Coda)
- **Exception**: List operations cache for 60 seconds (reduce load)
- **Cache invalidation**: On write operations, invalidate related list caches

## Testing Strategy

### Unit Tests
- Mock Coda API responses
- Test input validation
- Test error handling (429, 404, 5xx)
- Test relation expansion (workflow.service_blueprint)

### Integration Tests
- Test against real Coda doc (test workspace)
- Create blueprint → workflow → template → execution run
- Verify data appears in Coda UI
- Test idempotency (create same execution run twice)

### Load Tests
- 50 concurrent read requests (list_workflows, get_blueprint)
- 20 concurrent write requests (create_template, create_execution_run)
- Verify rate limiting works (no 429 errors)
- Measure p95 latency

## Security Considerations

### Authentication
- Coda API token stored in environment variable (never in code)
- Token scoped to specific doc (not account-wide)
- Token rotation: Update token in coda-mcp config, no code changes needed

### Authorization
- coda-mcp has read/write access to all pattern tables
- No row-level security (Coda API limitation)
- Trust model: Only Planner/Observer agents call coda-mcp (internal only)

### Data Validation
- Sanitize all text inputs (prevent Coda formula injection)
- Validate all relation IDs (must start with "coda:" or match Coda row ID format)
- Limit text field sizes (checklist < 10KB, steps < 10KB)
