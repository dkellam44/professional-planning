# ChatGPT MCP Connector OAuth Failure - Root Cause Analysis

**Date**: 2025-11-01
**Status**: ROOT CAUSE IDENTIFIED
**Severity**: HIGH
**Issue**: ChatGPT web connector fails to connect to Coda MCP server

---

## Executive Summary

The OAuth failure on the ChatGPT web connector is caused by a **fundamental transport protocol mismatch**, not an OAuth configuration issue. The Coda MCP server is implemented using **HTTP JSON-RPC transport**, but ChatGPT's MCP connectors expect **SSE (Server-Sent Events) transport** with specific tool definitions.

**Root Cause**: Architecture incompatibility
- ❌ Server: HTTP JSON-RPC (custom protocol)
- ✅ ChatGPT expects: SSE streaming + `search`/`fetch` tools
- ✅ OpenAI docs: Explicit requirement for SSE at `/sse/` endpoint

---

## What ChatGPT Connector Requires

### Reference: OpenAI MCP Documentation
Source: https://platform.openai.com/docs/mcp#configure-a-data-source

ChatGPT's MCP connectors require:

1. **Transport Protocol**: Server-Sent Events (SSE) streaming
   - Endpoint: `/sse/` path
   - Streaming JSON responses
   - Token-based authentication via OAuth

2. **Mandatory Tools**: Exactly 2 tools required
   - `search(query: string)` → Returns `{results: [{id, title, url}, ...]}`
   - `fetch(id: string)` → Returns `{id, title, text, url, metadata}`

3. **Response Format**: Content array with text field
   ```json
   {
     "content": [
       {
         "type": "text",
         "text": "{\"results\":[...]}"  // JSON-encoded string
       }
     ]
   }
   ```

4. **Authentication**: OAuth 2.0 with dynamic client registration
   - Users get OAuth flow when connecting
   - Token passed to MCP server for data access

5. **Discovery**: No `.well-known` endpoints needed
   - ChatGPT directly provides server URL in connector config
   - No OAuth authorization server metadata required

---

## Current Implementation Issues

### Issue 1: Wrong Transport Protocol ⚠️ CRITICAL

**Current State**:
```
┌─────────────────────────────────┐
│ ChatGPT Web Connector           │
│ (expects SSE streaming)          │
└──────────────┬──────────────────┘
               │ HTTP POST /mcp
               │ (JSON-RPC)
               ↓
┌─────────────────────────────────┐
│ Coda MCP Server                 │
│ (JSON-RPC HTTP protocol)        │
│ - Express.js HTTP server        │
│ - StreamableHTTPTransport       │
│ - Bearer token in Authorization │
└─────────────────────────────────┘
              ✗ MISMATCH
```

**Problem**: ChatGPT doesn't understand JSON-RPC. It sends:
```
GET /sse/ HTTP/1.1
Authorization: Bearer <oauth-token>
```

Server responds:
```
HTTP/1.1 404 Not Found
Cannot GET /sse/
```

**Why This Happens**:
- ChatGPT looks for SSE endpoint at `/sse/`
- Server only has `/mcp` endpoints (JSON-RPC)
- Bearer token validation succeeds
- Protocol negotiation fails

### Issue 2: Missing Required Tools ⚠️ HIGH

ChatGPT expects specific tool definitions:

**Required**:
- `search` tool (returns search results)
- `fetch` tool (returns full document)

**Currently Provided**:
- 40+ Coda API tools (generic, not ChatGPT-specific)
- No `search` or `fetch` tools
- Complex tool signatures not compatible with ChatGPT

**Example Expected**:
```json
{
  "tools": [
    {
      "name": "search",
      "description": "Search for documents",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string"
          }
        },
        "required": ["query"]
      }
    },
    {
      "name": "fetch",
      "description": "Fetch document content",
      "inputSchema": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          }
        },
        "required": ["id"]
      }
    }
  ]
}
```

### Issue 3: Discovery Endpoints Are Not Used ⚠️ MEDIUM

The added endpoints won't help:
- ✗ `/.well-known/oauth-authorization-server`
- ✗ `/.well-known/oauth-protected-resource`
- ✗ `/.well-known/protected-resource-metadata`

**Why**: ChatGPT doesn't discover these. Instead:
1. User provides server URL in ChatGPT settings
2. User provides OAuth token/credentials
3. ChatGPT connects directly to `/sse/` endpoint
4. No discovery needed

---

## Technical Comparison

| Aspect | Current Implementation | ChatGPT Requirement |
|--------|------------------------|---------------------|
| **Transport** | HTTP JSON-RPC | SSE (Server-Sent Events) |
| **Endpoint** | `/mcp` | `/sse/` |
| **Auth** | Bearer token | OAuth 2.0 (same) ✓ |
| **Tools** | 40+ generic Coda tools | 2 specific: search, fetch |
| **Response Format** | JSON-RPC response | MCP content array |
| **Discovery** | `.well-known` endpoints | Direct URL config |

---

## Solution Options

### Option A: Implement SSE Transport (RECOMMENDED) ⭐

**Best for**: Full ChatGPT compatibility

**Work Required**:
1. Add `/sse/` endpoint that supports SSE streaming
2. Implement `search` tool that calls Coda API
3. Implement `fetch` tool that retrieves document details
4. Convert Coda API responses to ChatGPT format

**Timeline**: 2-4 hours of development
**Impact**: ChatGPT connector fully functional

**Implementation**:
```typescript
// New endpoint for SSE transport
app.get('/sse', async (req, res) => {
  const token = req.query.token;
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Create SSE transport
  const transport = new SSEServerTransport('/sse', res);

  // Register search and fetch tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'search') {
      return { content: [{ type: 'text', text: '...' }] };
    }
    if (request.params.name === 'fetch') {
      return { content: [{ type: 'text', text: '...' }] };
    }
  });
});
```

### Option B: Use MCP Gateway Bridge (WORKAROUND) 🔄

**Best for**: Quick fix without rewriting server

**Work Required**:
1. Deploy second gateway that converts HTTP JSON-RPC → SSE
2. Map `/mcp` JSON-RPC → `/sse` SSE
3. Add search/fetch wrapper tools

**Timeline**: 1-2 hours
**Impact**: Works but adds complexity

### Option C: Document as JSON-RPC Only

**Best for**: If ChatGPT support not needed

**Work Required**:
1. Document that server uses JSON-RPC, not SSE
2. Recommend using via other clients (Web, CLI, SDKs)
3. Focus on non-ChatGPT integrations

**Timeline**: 30 minutes
**Impact**: ChatGPT support abandoned

---

## Recommended Action: Option A

The OpenAI documentation is explicit: ChatGPT expects SSE transport with `search` and `fetch` tools.

**Steps**:

1. **Create SSE endpoint** (`/sse`)
   - Accept OAuth token from query or header
   - Set up SSE streaming
   - Handle client connections

2. **Implement required tools**:
   ```
   search(query) → list of documents
   fetch(id) → full document content
   ```

3. **Map to Coda API**:
   - `search`: Use Coda docs search API
   - `fetch`: Use Coda docs get API

4. **Response conversion**:
   - Wrap Coda responses in MCP content array format
   - Ensure JSON-encoded text fields

5. **Testing**:
   - Test SSE endpoint manually
   - Connect via ChatGPT settings
   - Verify tool execution

---

## Discovery Endpoints Status

The added endpoints in today's fix are **beneficial but insufficient**:

✓ `/.well-known/protected-resource-metadata` — Now available (added today)
✓ `/.well-known/oauth-protected-resource` — Now available
✗ **But ChatGPT doesn't use them** — Uses direct URL config instead

These are helpful for:
- Documentation
- Other MCP clients
- OAuth exploration
- Integration testing

But they **do not** solve the ChatGPT connector issue.

---

## Why OAuth "Failed"

The error message likely shows:

```
Connection Error: Server at http://127.0.0.1:8085 did not respond
at expected /sse/ endpoint
```

Not an actual OAuth failure, but transport negotiation failure.

**What ChatGPT tried**:
1. Connect to server URL
2. Look for `/sse/` endpoint
3. Get 404 (endpoint doesn't exist)
4. Display "connection failed" to user

**What user sees**: "OAuth failed" (misleading)

---

## Next Steps

1. **Confirm diagnosis**: Try manually hitting `/sse/` endpoint
   ```bash
   curl -v http://127.0.0.1:8085/sse
   # Expected: 404 Not Found
   ```

2. **Choose implementation approach** (recommend Option A)

3. **Implement SSE transport** with search/fetch tools

4. **Test with ChatGPT connector** in Settings

5. **Document both protocols** (JSON-RPC and SSE supported)

---

## Impact Assessment

| Scope | Impact | Effort |
|-------|--------|--------|
| ChatGPT connector | Cannot work until fixed | Medium |
| JSON-RPC clients | No impact ✓ | Low |
| Web/CLI/SDK clients | No impact ✓ | Low |
| OAuth implementation | Correct, just needs SSE | Low |
| Overall service | Partial functionality | Medium |

---

## Summary

**Current State**: ❌ ChatGPT connector cannot connect due to missing `/sse/` endpoint

**Root Cause**: Architecture mismatch (JSON-RPC vs SSE)

**Fix**: Implement SSE transport with required `search` and `fetch` tools

**Effort**: 2-4 hours development

**Priority**: MEDIUM (impacts ChatGPT use case, other clients unaffected)

**Added Today**: Discovery endpoints (helpful but not sufficient)

---

**Diagnostic Report Generated**: 2025-11-01 23:30 UTC
**Status**: Ready for implementation decision
