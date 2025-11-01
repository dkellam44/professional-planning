# Multi-Platform MCP Strategy: Claude & ChatGPT Support

**Date**: 2025-11-01
**Status**: STRATEGIC ANALYSIS COMPLETE
**Objective**: Support both Claude and ChatGPT platforms while maintaining implementation flexibility

---

## Executive Summary

After reviewing both Claude's Remote MCP server specs and ChatGPT's MCP connector requirements, we have identified a **two-protocol strategy** that maintains compatibility with both platforms:

- **Claude**: HTTP Streamable (JSON-RPC) ✓ Already implemented, fully compatible
- **ChatGPT**: SSE Transport (Server-Sent Events) ✗ Needs implementation
- **Flexibility**: Support both protocols in single server deployment

---

## Platform Comparison

### Claude Specifications
**Source**: https://support.claude.com/en/articles/11503834-building-custom-connectors-via-remote-mcp-servers

| Aspect | Claude Support |
|--------|---|
| **Transport Protocols** | SSE (may deprecate soon) + HTTP Streamable ✓ |
| **Recommended** | HTTP Streamable (JSON-RPC over HTTP) ✓ |
| **Current Implementation** | Fully compatible ✓ |
| **Authentication** | OAuth 2.0 (3/26 & 6/18 specs) or Authless ✓ |
| **Callback URL** | `https://claude.ai/api/mcp/auth_callback` |
| **Tools Support** | Full (text + images) ✓ |
| **Resources Support** | Text + binary ✓ |
| **Prompts Support** | Full ✓ |
| **Advanced Features** | Resource subscriptions (not yet) |

### ChatGPT Requirements
**Source**: https://platform.openai.com/docs/mcp#configure-a-data-source

| Aspect | ChatGPT Requirement |
|--------|---|
| **Transport Protocol** | SSE (Server-Sent Events) - mandatory |
| **Endpoint** | `/sse/` path required |
| **Mandatory Tools** | Exactly 2: `search` and `fetch` |
| **Tool Signature** | Specific formats for input/output |
| **Authentication** | OAuth 2.0 with Dynamic Client Registration |
| **Response Format** | MCP content array with JSON text |
| **Use Cases** | Chat, Deep Research, Connectors |

---

## Critical Finding: Protocol Compatibility

### Current Situation

**Claude with current implementation**: ✅ WORKING
```
┌──────────────┐
│ Claude       │  HTTP POST /mcp (JSON-RPC)
│ (Remote MCP) │
└──────────────┘
         │
         ↓ (StreamableHTTP)
┌────────────────────────────────┐
│ Coda MCP Server                │
│ - Express.js                   │
│ - `/mcp` endpoint              │
│ - Bearer token auth            │
│ - 40+ tools                    │
└────────────────────────────────┘
```

**ChatGPT with current implementation**: ❌ BROKEN
```
┌──────────────┐
│ ChatGPT      │  Looking for: GET /sse/ (SSE)
│ (Connectors) │
└──────────────┘
         │
         ↓ (Tries to connect)
┌────────────────────────────────┐
│ Coda MCP Server                │
│ - Only has `/mcp` (JSON-RPC)   │
│ - No `/sse/` endpoint          │
│ - Returns: 404 Not Found       │
└────────────────────────────────┘
```

---

## Strategic Options

### Option 1: Dual-Protocol Server (RECOMMENDED) ⭐

**Approach**: Implement both transports in single server

```
┌──────────────────────────────────────────────────┐
│ Coda MCP Server (Enhanced)                       │
├──────────────────────────────────────────────────┤
│                                                   │
│ ┌────────────────────────────────────┐          │
│ │ HTTP JSON-RPC Transport (Claude)   │          │
│ │ POST /mcp                          │          │
│ │ - Bearer token auth ✓              │          │
│ │ - 40+ tools ✓                      │          │
│ └────────────────────────────────────┘          │
│                                                   │
│ ┌────────────────────────────────────┐          │
│ │ SSE Transport (ChatGPT)            │          │
│ │ GET /sse/                          │          │
│ │ - Bearer token auth ✓              │          │
│ │ - search tool (Coda API)           │          │
│ │ - fetch tool (Coda API)            │          │
│ └────────────────────────────────────┘          │
│                                                   │
│ ┌────────────────────────────────────┐          │
│ │ OAuth & Discovery Endpoints        │          │
│ │ - /.well-known/* endpoints         │          │
│ │ - /oauth/* validation              │          │
│ └────────────────────────────────────┘          │
│                                                   │
│ ┌────────────────────────────────────┐          │
│ │ Health & Status                    │          │
│ │ - /health endpoint                 │          │
│ └────────────────────────────────────┘          │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Advantages**:
- ✅ Support both Claude and ChatGPT
- ✅ Single deployment, no extra infrastructure
- ✅ Shared authentication and configuration
- ✅ Flexible tool exposure per platform
- ✅ Future-proof (other platforms can use JSON-RPC)

**Disadvantages**:
- ⚠️ Moderate development effort (4-6 hours)
- ⚠️ Increased code complexity (two transports)
- ⚠️ Testing required for both paths

**Effort**: MEDIUM (4-6 hours)
**Complexity**: MEDIUM
**Recommendation**: ⭐ BEST CHOICE

---

### Option 2: API Gateway Bridge

**Approach**: Keep JSON-RPC server, add translation gateway

```
┌────────────┐              ┌──────────────┐
│ ChatGPT    │──GET /sse──→ │ API Gateway  │
└────────────┘              │ (Translator) │
                            └──────┬───────┘
                                   │ POST /mcp (JSON-RPC)
                                   ↓
                            ┌──────────────────┐
                            │ Coda MCP Server  │
                            │ (unchanged)      │
                            └──────────────────┘

┌────────────┐
│ Claude     │──POST /mcp──→ Coda MCP Server (unchanged)
└────────────┘
```

**Advantages**:
- ✅ Minimal changes to existing server
- ✅ Clear separation of concerns
- ✅ Independent scaling

**Disadvantages**:
- ⚠️ Extra infrastructure to maintain
- ⚠️ Additional latency (extra hop)
- ⚠️ Doubles deployment complexity
- ⚠️ More failure points

**Effort**: MEDIUM (3-4 hours)
**Complexity**: HIGH
**Recommendation**: ⚠️ ACCEPTABLE FALLBACK

---

### Option 3: Dedicated ChatGPT Server

**Approach**: Deploy separate SSE server for ChatGPT only

```
Coda MCP Server (JSON-RPC)    Coda MCP ChatGPT (SSE)
- Claude                      - ChatGPT
- Existing tools              - search & fetch tools
```

**Advantages**:
- ✅ Independent scaling
- ✅ Optimized per platform
- ✅ Easy to maintain separately

**Disadvantages**:
- ❌ Duplicate deployment and maintenance
- ❌ Inconsistent configurations
- ❌ Code duplication
- ❌ Future platform support requires new servers

**Effort**: LOW (2-3 hours, but ongoing)
**Complexity**: LOW (each server simple)
**Recommendation**: ❌ NOT RECOMMENDED

---

## Recommended Implementation: Option 1

**Dual-Protocol Server with shared infrastructure**

### Architecture

```typescript
// Single Express.js server supporting both transports

app.post('/mcp', async (req, res) => {
  // Claude: HTTP JSON-RPC transport
  // StreamableHTTPServerTransport handles this
  await transport.handleRequest(req, res, req.body);
});

app.get('/sse', async (req, res) => {
  // ChatGPT: SSE transport
  // Set up SSE streaming and handle requests
  res.setHeader('Content-Type', 'text/event-stream');
  const sseTransport = new SSETransport(res);

  // Register ChatGPT-specific tools
  server.setTool('search', ...);
  server.setTool('fetch', ...);

  await sseTransport.connect();
});

// Shared endpoints
app.get('/health', ...);
app.get('/.well-known/oauth-authorization-server', ...);
app.post('/oauth/validate-token', ...);
```

### Tool Strategy

**Claude Path** (`/mcp`):
- Expose all 40+ Coda API tools
- Full API coverage
- Users choose which tools to use

**ChatGPT Path** (`/sse`):
- Expose 2 required tools: `search` and `fetch`
- Wrapper tools that call Coda API
- Optimized for document discovery and retrieval

### Implementation Phases

**Phase 1** (2 hours): Add SSE transport support
- Implement `/sse/` endpoint
- Set up SSE streaming headers
- Create SSE-specific transport class

**Phase 2** (2 hours): Implement ChatGPT tools
- Create `search` tool (calls Coda docs search)
- Create `fetch` tool (calls Coda docs get)
- Ensure response format compliance

**Phase 3** (1 hour): Testing and validation
- Test SSE endpoint manually
- Connect via ChatGPT settings
- Verify tools work in both platforms
- Load test both transports

**Phase 4** (1 hour): Documentation
- Update README with both protocols
- Create platform-specific guides
- Document architecture decisions

**Total**: ~6 hours, phased over 1-2 days

---

## Authentication Strategy

Both platforms support OAuth 2.0. Current implementation is compatible:

### Bearer Token Flow (Current)
```
User provides token → Claude/ChatGPT sends in header → Server validates
```

### OAuth Dynamic Client Registration (DCR) Flow
```
Claude/ChatGPT registers with server → Server generates client credentials
→ Future requests use DCR credentials (more secure)
```

### Implementation

Keep current Bearer token support (backwards compatible)
Add optional DCR support (future enhancement)

```typescript
const validateAuth = (req: Request) => {
  // Support both Bearer token and OAuth
  const bearerToken = req.headers.authorization?.split(' ')[1];
  const oauthToken = req.body?.oauth_token;

  return bearerToken || oauthToken;
};
```

---

## Platform-Specific Considerations

### Claude
- ✓ Prefers HTTP Streamable (our current implementation)
- ✓ Supports OAuth (3/26 and 6/18 specs)
- ✓ Full tool/resource/prompt support
- ✓ Callback URL: `https://claude.ai/api/mcp/auth_callback`
- → No changes needed, already compatible

### ChatGPT
- ✓ Expects SSE transport at `/sse/`
- ✓ Requires exactly 2 tools: `search` and `fetch`
- ✓ Supports OAuth with dynamic registration
- ✓ Callback URL: Uses standard OAuth flow
- → Needs SSE implementation + 2 wrapper tools

---

## Risk Assessment

### Option 1 (Dual-Protocol) - RECOMMENDED
| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| Increased complexity | Medium | Good separation of concerns, clear code structure |
| Testing burden | Medium | Automated tests for both transports |
| Performance impact | Low | Shared infrastructure, efficient routing |
| Maintenance overhead | Low | Single codebase, clear documentation |

**Overall Risk**: LOW ✓

### Option 2 (Gateway Bridge)
| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| Extra latency | Medium | Optimize gateway code |
| Infrastructure failure | High | Requires health checks, monitoring |
| Complexity | High | More services to maintain |

**Overall Risk**: MEDIUM ⚠️

---

## Deployment Impact

### Current State
- Docker image: 268MB
- Service: Single container
- Endpoints: `/mcp`, `/health`, `/.well-known/*`, `/oauth/*`

### With Option 1 (Dual-Protocol)
- Docker image: ~270-280MB (minimal increase)
- Service: Same single container
- Endpoints: Add `/sse/` alongside existing `/mcp`
- Configuration: OAuth callback URLs for both platforms

### Zero Downtime Deployment
```bash
# 1. Build new image with both transports
docker build -t coda-mcp:v1.1.0 .

# 2. Start new container on parallel port
docker run --name coda-mcp-v1.1 -p 8086:8080 coda-mcp:v1.1.0

# 3. Verify both /mcp and /sse work
curl http://127.0.0.1:8086/health

# 4. Switch nginx-proxy to new container
docker update --env-file config/.env coda-mcp-v1.1

# 5. Stop old container
docker stop coda-mcp-service
```

---

## Success Criteria

### Phase Completion
- ✓ SSE endpoint responds to GET /sse/
- ✓ Search tool executes and returns correct format
- ✓ Fetch tool executes and returns correct format
- ✓ Claude still works via /mcp
- ✓ Both transports accept bearer tokens
- ✓ Health check remains operational

### Testing
- ✓ Manual curl tests for both endpoints
- ✓ Connect via Claude Remote MCP (existing)
- ✓ Connect via ChatGPT Connectors (new)
- ✓ Load test both transports
- ✓ Error handling verified

### Production Readiness
- ✓ Docker image builds successfully
- ✓ Service starts without errors
- ✓ Logging captures both protocols
- ✓ Monitoring covers both endpoints
- ✓ Documentation complete

---

## Timeline Estimate

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Planning & Design | 1 hour | 2025-11-01 23:30 | 2025-11-02 00:30 |
| Phase 1: SSE Transport | 2 hours | 2025-11-02 00:30 | 2025-11-02 02:30 |
| Phase 2: Tools Implementation | 2 hours | 2025-11-02 02:30 | 2025-11-02 04:30 |
| Phase 3: Testing | 1 hour | 2025-11-02 04:30 | 2025-11-02 05:30 |
| Phase 4: Documentation | 1 hour | 2025-11-02 05:30 | 2025-11-02 06:30 |
| **Total** | **~6-7 hours** | **2025-11-02 00:30** | **2025-11-02 06:30** |

---

## Decision Matrix

| Criteria | Option 1 (Dual) | Option 2 (Gateway) | Option 3 (Separate) |
|----------|---|---|---|
| Claude Support | ✓ Excellent | ✓ Good | ✓ Good |
| ChatGPT Support | ✓ Excellent | ✓ Good | ✓ Good |
| Effort | Medium (6h) | Medium (4h) | Low (3h) |
| Maintenance | Low | Medium | High |
| Scalability | Good | Excellent | Good |
| Flexibility | Excellent | Good | Poor |
| Single Deployment | ✓ Yes | ✗ No | ✗ No |
| Future Platforms | ✓ Easy | ✓ Easy | ✗ Hard |
| **Recommendation** | ⭐⭐⭐ | ⭐⭐ | ⭐ |

---

## Next Steps

### Immediate
1. **Review this strategy** — Confirm Option 1 approach
2. **Get stakeholder approval** — Proceed with dual-protocol design
3. **Plan implementation** — Schedule 6-7 hour dev window

### Development
1. **Implement SSE transport** — Add `/sse/` endpoint
2. **Create wrapper tools** — `search` and `fetch` for ChatGPT
3. **Test both platforms** — Claude and ChatGPT integration
4. **Update documentation** — Platform guides and ADR

### Post-Implementation
1. **Deploy to droplet** — Zero-downtime update
2. **Monitor both transports** — Logging and performance
3. **Gather feedback** — Both platform users
4. **Plan enhancements** — Advanced features for each platform

---

## Summary

**Current Situation**: Claude works ✓, ChatGPT broken ✗

**Root Cause**: Missing SSE transport (ChatGPT requirement)

**Recommended Solution**: Option 1 - Dual-Protocol Server
- Keep Claude support (JSON-RPC at `/mcp`)
- Add ChatGPT support (SSE at `/sse/`)
- Shared authentication and infrastructure
- Single deployment, maximum flexibility

**Effort**: 6-7 hours (phased)

**Risk**: LOW

**Benefit**: Support both major AI platforms with single server

---

**Status**: Ready for implementation planning
**Next Decision**: Approve Option 1 and schedule development window
