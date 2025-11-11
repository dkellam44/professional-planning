---
entity: guide
level: execution
zone: internal
version: v01
tags: [phase-1, day-2-3, implementation, token-estimation, http-native, coda-mcp]
source_path: /planning/phase_1_day2_implementation_guide.md
date: 2025-11-01
status: ready-to-execute
---

# Phase 1 Days 2-3: HTTP-Native Enhancement Implementation Guide

**Start Date**: After Day 1 completion (2025-11-01)
**Duration**: 6-10 hours (Days 2-3)
**Owner**: David Kellam
**Status**: Ready to execute

---

## Overview

Days 2-3 focus on **completing** the HTTP-native server by adding three critical enhancements:
1. **Token Estimation Framework** (2-3 hours)
2. **Memory Hook Callbacks** (1-2 hours)
3. **OAuth Integration** (2-3 hours)

The core HTTP server (326 lines) is already written. We're adding the context-engineering layer.

---

## Starting Point

**Files ready in your portfolio**:
```
/integrations/mcp/servers/coda/
├── Dockerfile (current: uses mcp-proxy)
├── package.json (has dependencies)
├── tsconfig.json
└── src/
    ├── index.ts (stdio entry - won't change)
    ├── server.ts (tool definitions - will enhance)
    ├── config.ts
    ├── client/ (Coda API client - won't change)
    └── src/ (redundant copy - ignore)
```

**HTTP server location**:
- `/integrations/mcp/servers/coda/src/src/http-server.ts` (current, 326 lines)
- **Should be**: `/integrations/mcp/servers/coda/src/http-server.ts` (after cleanup)

**Decision made**: Use HTTP-native instead of mcp-proxy

---

## Quick Reference: What Each Task Does

### Task A: Token Estimation (2-3 hours)
**Goal**: Every MCP response includes token usage estimate

**Impact**:
- Enables context budgeting at higher layers
- Required for Phase 2 memory integration
- Foundational for meta-skills

**Changes**:
```typescript
// Before (in server.ts tool response)
return { content: [{ type: "text", text: JSON.stringify(data) }] };

// After (in http-server.ts response wrapper)
{
  success: true,
  data: { /* actual tool response */ },
  metadata: {
    timestamp: new Date().toISOString(),
    resourceId: "doc-123",
    source: "coda",
    tokenEstimate: 450,  // NEW
    summary: "List of 10 documents..." // NEW
  },
  fullContentPath: "/api/coda/documents?id=doc-123" // NEW
}
```

### Task B: Memory Hooks (1-2 hours)
**Goal**: Track tool calls for persistent learning

**Impact**:
- Pluggable interface for Phase 2 persistent memory layer
- Enables session-aware context management
- Foundation for "system learning over time"

**Changes**:
```typescript
// In http-server.ts POST /mcp handler
// Before: const response = await transport.handleRequest(...);
// After:
const sessionId = /* from header */;
const toolName = /* from body */;
const params = /* from body */;

// Call hook BEFORE execution
if (hooks?.onToolCall) {
  await hooks.onToolCall(sessionId, toolName, params);
}

// Execute tool
const response = await transport.handleRequest(...);

// Call hook AFTER execution
if (hooks?.onResponse) {
  await hooks.onResponse(sessionId, toolName, response);
}
```

### Task C: OAuth Integration (2-3 hours)
**Goal**: Cloudflare Access OIDC endpoints for client authentication

**Impact**:
- Remote clients (Claude Desktop, Claude Code) can authenticate
- Enables proper access control
- Matches production deployment requirement

**Changes**:
```typescript
// In http-server.ts, add before MCP endpoints
app.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: process.env.OAUTH_ISSUER,
    authorization_endpoint: process.env.OAUTH_AUTH_ENDPOINT,
    token_endpoint: process.env.OAUTH_TOKEN_ENDPOINT,
    // ... other OAuth metadata
  });
});
```

---

## Step-by-Step Implementation (Task A)

### Step 1: Create Token Counter Utility
**File**: `/integrations/mcp/servers/coda/src/utils/token-counter.ts`

```typescript
/**
 * Simple token estimation based on character count
 * 1 token ≈ 4 characters (conservative estimate)
 * Round up to nearest 50 for safety margin
 */
export function estimateTokens(content: string): number {
  const charCount = content.length;
  const tokens = Math.ceil(charCount / 4);
  return Math.ceil(tokens / 50) * 50; // Round to nearest 50
}

/**
 * Estimate tokens in object (JSON serialized)
 */
export function estimateObjectTokens(obj: any): number {
  const json = JSON.stringify(obj);
  return estimateTokens(json);
}

/**
 * Create summary from content (first 200 chars + ellipsis)
 */
export function createSummary(content: string, maxLength = 200): string {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
}
```

### Step 2: Create Response Wrapper Middleware
**File**: `/integrations/mcp/servers/coda/src/middleware/response-wrapper.ts`

```typescript
import { estimateObjectTokens, createSummary } from '../utils/token-counter';

export interface MCPToolResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; recoverable: boolean };
  metadata: {
    timestamp: string;
    resourceId: string;
    source: 'coda';
    tokenEstimate: number;
    summary: string;
  };
  fullContentPath?: string;
}

/**
 * Wrap tool response with metadata
 */
export function wrapResponse<T>(
  data: T,
  resourceId: string = 'unknown',
  summary?: string
): MCPToolResponse<T> {
  const dataStr = JSON.stringify(data);
  const estimatedTokens = estimateObjectTokens(data);
  const autoSummary = summary || createSummary(dataStr, 150);

  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      resourceId,
      source: 'coda',
      tokenEstimate: estimatedTokens,
      summary: autoSummary
    },
    fullContentPath: `/api/coda/resource/${resourceId}` // For on-demand retrieval
  };
}

/**
 * Wrap error response
 */
export function wrapError(
  error: Error | string,
  recoverable = true
): MCPToolResponse<null> {
  const message = error instanceof Error ? error.message : error;
  return {
    success: false,
    error: {
      code: 'CODA_ERROR',
      message,
      recoverable
    },
    metadata: {
      timestamp: new Date().toISOString(),
      resourceId: 'error',
      source: 'coda',
      tokenEstimate: estimateObjectTokens({ error: message }),
      summary: `Error: ${message.substring(0, 100)}`
    }
  };
}
```

### Step 3: Update HTTP Server to Use Wrapper
**File**: `/integrations/mcp/servers/coda/src/src/http-server.ts`

In the POST /mcp handler, after `transport.handleRequest()`:

```typescript
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    // ... existing code ...

    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    // ... session management code ...

    // Handle the request
    const response = await transport.handleRequest(req, res, req.body);

    // Wrap response with metadata
    const wrappedResponse = wrapResponse(
      response,
      sessionId || 'no-session',
      'MCP tool response'
    );

    // If response not already sent by transport, send wrapped version
    if (!res.headersSent) {
      res.json(wrappedResponse);
    }

    console.log('[MCP] POST /mcp handled', {
      sessionId: transport.sessionId,
      tokenEstimate: wrappedResponse.metadata.tokenEstimate,
      headersSent: res.headersSent
    });
  } catch (error) {
    // ... error handling ...
  }
});
```

### Step 4: Test Token Estimation
```bash
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda

# Install if needed
pnpm install

# Build
pnpm build

# Run locally
node dist/src/http-server.js

# In another terminal, test
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: test-1" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'

# Should return wrapped response with metadata.tokenEstimate
```

---

## Implementation Checklist

### Task A: Token Estimation (2-3 hours)
- [ ] Create `/src/utils/token-counter.ts`
- [ ] Create `/src/middleware/response-wrapper.ts`
- [ ] Update `/src/src/http-server.ts` POST handler
- [ ] Update `/src/src/http-server.ts` error handling
- [ ] Test locally (build + curl test)
- [ ] Verify token estimates reasonable
- [ ] Commit changes

### Task B: Memory Hooks (1-2 hours)
- [ ] Create `/src/types/memory-hooks.ts` interface
- [ ] Add hooks to http-server.ts context
- [ ] Implement onToolCall hook point (before execution)
- [ ] Implement onResponse hook point (after execution)
- [ ] Implement onSessionEnd hook point (on DELETE)
- [ ] Test hook invocation (add console.log)
- [ ] Commit changes

### Task C: OAuth Integration (2-3 hours)
- [ ] Add environment variables (OAUTH_ISSUER, etc.)
- [ ] Create OAuth discovery endpoints
- [ ] Implement token validation middleware
- [ ] Test with Cloudflare Access (if available locally)
- [ ] Document OAuth endpoints
- [ ] Commit changes

### Task D: Cleanup & Prepare for Deploy (30 min - 1 hour)
- [ ] Remove `/src/src/` duplicate (keep only `/src/`)
- [ ] Update Dockerfile entry point
- [ ] Test Docker build locally
- [ ] Verify all imports work after cleanup
- [ ] Commit final changes

---

## File Organization (After Cleanup)

```
/integrations/mcp/servers/coda/
├── src/
│   ├── index.ts (stdio entry)
│   ├── server.ts (tool definitions)
│   ├── config.ts
│   ├── http-server.ts (HTTP entry - MAIN WORK FILE)
│   ├── utils/
│   │   └── token-counter.ts (NEW)
│   ├── middleware/
│   │   └── response-wrapper.ts (NEW)
│   ├── types/
│   │   └── memory-hooks.ts (NEW)
│   └── client/
│       ├── client.gen.ts
│       ├── helpers.ts
│       ├── index.ts
│       ├── sdk.gen.ts
│       └── types.gen.ts
├── Dockerfile (UPDATE ENTRY POINT)
├── package.json
├── tsconfig.json
└── pnpm-lock.yaml
```

---

## Testing Commands (Days 2-3)

### Build & Run
```bash
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda
pnpm build
node dist/http-server.js
```

### Test Health Endpoint
```bash
curl http://localhost:8080/health
# Expected: { "status": "ok", "service": "coda-mcp", "version": "1.0.0", ... }
```

### Test Token Estimation
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer [coda-api-key]" \
  -H "Mcp-Session-Id: test-1" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Expected: Response wrapped with metadata.tokenEstimate
```

### Test Session Persistence
```bash
# First request
SESSION_ID=$(uuidgen)
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer [token]" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list"}'

# Second request (should reuse session)
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer [token]" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc": "2.0", "id": 2, "method": "coda_list_documents"}'
```

---

## Context for Days 4-6

**Day 4**: Update Dockerfile and deploy to droplet
- New Dockerfile entry: `CMD ["node", "dist/http-server.js"]`
- No more mcp-proxy wrapper
- Port 8080 (same as current)

**Day 5**: Documentation and monitoring
- Create CLAUDE.md with HTTP-native conventions
- Create examples folder with test scripts
- Configure Uptime Robot

**Day 6**: Validation
- Verify https://coda.bestviable.com/mcp working
- Test all endpoints
- Configure health check dashboard

---

## Reference Documents

When you start Day 2:
1. Read `/agents/decisions/2025-11-01_coda-http-native-migration_v01.md`
2. Read `/agents/context/coda-mcp-day1-audit_v01.md`
3. Read `/sessions/session_2025_11_01_phase1_day1_summary.md`
4. This file: `/planning/phase_1_day2_implementation_guide.md`

Then begin Task A (Step 1-4 above).

---

## Commit Message Template (For Each Task)

```
Enhance: Coda MCP HTTP-native server - Task [A/B/C/D]

Task A: Token estimation framework
- Add token counter utility (character → token conversion)
- Add response wrapper with metadata envelope
- Include tokenEstimate, summary, fullContentPath
- Test all endpoints with Bearer token

Status: HTTP-native implementation 80% → 95% complete
Next: Task B (memory hooks)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

**Version**: v01
**Status**: Ready to execute
**Difficulty**: Medium (2-3 hours per task)
**Risk**: Low (keep mcp-proxy backup, can rollback)
**Timeline**: Days 2-3 (6-10 hours total)
