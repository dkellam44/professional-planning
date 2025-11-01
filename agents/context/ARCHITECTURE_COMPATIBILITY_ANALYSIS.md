---
entity: analysis
level: technical
zone: architecture
version: "0.1"
tags: [mcp, http-native, gateway, compatibility, architecture]
source_path: agents/context/ARCHITECTURE_COMPATIBILITY_ANALYSIS.md
date: 2025-10-31
status: active
---

# MCP Architecture Compatibility Analysis

## Question
Before implementing HTTP-native Coda MCP with integrated OAuth, verify compatibility with other MCPs planned for deployment.

## Current & Planned MCP Services

**Currently Deployed:**
- coda-mcp-gateway (HTTP wrapper + OAuth)

**Planned for Deployment:**
- github-mcp-gateway
- memory-mcp-gateway
- firecrawl-mcp-gateway
- digitalocean-mcp-gateway
- cloudflare-mcp-gateway

## Current Architecture Pattern (Gateway Wrapper)

```
┌─────────────────────────────────────────────────────────┐
│ Docker Service: coda-mcp-gateway                        │
├─────────────────────────────────────────────────────────┤
│ HTTP Server (Express)                                   │
│ ├─ POST /mcp        → Streamable HTTP transport        │
│ ├─ GET /mcp         → SSE stream                        │
│ ├─ DELETE /mcp      → Session termination              │
│ ├─ /oauth/*         → OAuth 2.0 endpoints              │
│ └─ /health          → Health check                      │
├─────────────────────────────────────────────────────────┤
│ Stdio MCP Server (child process)                        │
│ └─ Coda API tools (40+ functions)                       │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- Reusable pattern for ANY stdio MCP
- Clean separation: HTTP transport vs MCP logic
- OAuth can be generalized for all MCPs
- Consistent Docker service structure

**Drawbacks:**
- Two processes per MCP
- Message bridging overhead
- More complex debugging

## Proposed Architecture (HTTP-Native - Coda Only)

```
┌─────────────────────────────────────────────────────────┐
│ Docker Service: coda-mcp                                │
├─────────────────────────────────────────────────────────┤
│ HTTP Server (Express) + MCP Server (integrated)         │
│ ├─ POST /mcp        → Streamable HTTP transport        │
│ ├─ GET /mcp         → SSE stream                        │
│ ├─ DELETE /mcp      → Session termination              │
│ ├─ /oauth/*         → OAuth 2.0 endpoints              │
│ ├─ /health          → Health check                      │
│ └─ MCP Server       → Direct tool execution             │
└─────────────────────────────────────────────────────────┘
```

**Benefits:**
- Simpler (one process)
- Better performance (no bridging)
- Integrated OAuth with MCP context
- Smaller Docker image

**Drawbacks:**
- Not reusable for other MCPs
- OAuth must be reimplemented for each MCP
- Architectural inconsistency

## Compatibility Analysis

### Scenario 1: Keep Gateway Pattern (Recommended)

**Coda + All Other MCPs use gateway wrapper:**

```
Docker Compose Stack:
├─ coda-mcp-gateway (gateway wrapper)
├─ github-mcp-gateway (gateway wrapper)
├─ memory-mcp-gateway (gateway wrapper)
├─ firecrawl-mcp-gateway (gateway wrapper)
├─ digitalocean-mcp-gateway (gateway wrapper)
├─ cloudflare-mcp-gateway (gateway wrapper)
├─ nginx-proxy
├─ acme-companion
├─ cloudflared
├─ n8n
├─ postgres
└─ qdrant
```

**Compatibility:** ✅ FULL - Consistent architecture across all MCPs

**To enable OAuth for all MCPs:** Generalize the oauth-routes.ts to support token passthrough from any source (Coda, GitHub, custom tokens, etc.)

### Scenario 2: HTTP-Native for Coda Only (Current Plan)

**Coda is HTTP-native, others use gateway:**

```
Docker Compose Stack:
├─ coda-mcp (HTTP-native) ← Different pattern
├─ github-mcp-gateway (gateway wrapper)
├─ memory-mcp-gateway (gateway wrapper)
├─ firecrawl-mcp-gateway (gateway wrapper)
├─ digitalocean-mcp-gateway (gateway wrapper)
├─ cloudflare-mcp-gateway (gateway wrapper)
├─ nginx-proxy
├─ acme-companion
├─ cloudflared
├─ n8n
├─ postgres
└─ qdrant
```

**Compatibility:** ⚠️ PARTIAL - Inconsistent architecture

**Issues:**
- Different deployment pattern for Coda vs others
- Two different OAuth implementations (Coda integrated vs gateway-based)
- Operator confusion: why is Coda different?
- Harder to maintain (learn two patterns)

**Works technically:** Yes, both patterns can coexist
**Operational clarity:** Low - inconsistent architecture

### Scenario 3: HTTP-Native for All MCPs (Long-term)

**All MCPs are HTTP-native (larger refactor):**

```
Docker Compose Stack:
├─ coda-mcp (HTTP-native)
├─ github-mcp (HTTP-native)
├─ memory-mcp (HTTP-native)
├─ firecrawl-mcp (HTTP-native)
├─ digitalocean-mcp (HTTP-native)
├─ cloudflare-mcp (HTTP-native)
├─ nginx-proxy
├─ acme-companion
├─ cloudflared
├─ n8n
├─ postgres
└─ qdrant
```

**Compatibility:** ✅ FULL - Consistent architecture

**Work required:**
- Implement HTTP server + OAuth for each MCP
- Duplicate effort (OAuth implemented 6x)
- Longer timeline

**Benefits:**
- Simpler deployment (no stdio bridge)
- Better performance
- Consistent architecture

## Recommendation

### Short-term (Next 2-4 weeks)

**Choose: Keep Gateway Pattern (Scenario 1)**

Rationale:
1. All MCPs share one architecture
2. Single OAuth implementation (in gateway)
3. Lower implementation risk
4. Faster to deploy remaining MCPs (github, memory, firecrawl, etc.)
5. Consistent with current coda-mcp-gateway approach

**Action:**
- Keep using coda-mcp-gateway (HTTP wrapper)
- Improve/generalize the gateway for other MCPs
- Focus on deploying remaining MCPs consistently

### Medium-term (After all MCPs deployed)

**Consider: Refactor to HTTP-Native (Scenario 3)**

Once all MCPs are deployed and stable:
1. Create reusable HTTP-native base server
2. OAuth as a middleware/module
3. Gradually migrate MCPs to HTTP-native
4. Eventually deprecate gateway wrapper

**Benefit:** Cleaner architecture after proving stability

## Implementation Decision Required

**Do you want to:**

A. **Continue with Gateway Pattern for Coda** (maintain consistency)
   - Keep coda-mcp-gateway as is
   - Deploy other MCPs using same pattern
   - OAuth in gateway layer

B. **Go HTTP-Native for Coda NOW** (accept architectural asymmetry for simplicity)
   - Proceed with http-native Coda MCP
   - Deploy other MCPs as gateway wrappers
   - Refactor to HTTP-native later if desired

C. **Create HTTP-Native Base Class** (more work upfront, cleaner long-term)
   - Build reusable HTTP server + OAuth module
   - All MCPs inherit from it
   - Consistent HTTP-native architecture from start

## Impact on Docker Compose

**Option A (Gateway Pattern):**
```yaml
coda-mcp-gateway:
  build: integrations/mcp/servers/coda/gateway/Dockerfile
  # (current configuration)
```

**Option B (HTTP-Native):**
```yaml
coda-mcp:
  build: integrations/mcp/servers/coda/Dockerfile  ← Different Dockerfile
  # (new configuration, based on http-server.ts)
```

**Option C (Reusable Base):**
```yaml
coda-mcp:
  build:
    context: integrations/mcp/servers/coda
    dockerfile: Dockerfile.http-native
  # (uses shared HTTP base + Coda-specific implementation)
```

## Testing Compatibility

Regardless of choice, verify:
1. Health endpoint responds: `curl https://coda.bestviable.com/health`
2. OAuth discovery works: `curl https://coda.bestviable.com/.well-known/oauth-authorization-server`
3. ChatGPT connector can register and authenticate
4. MCP tools execute correctly
5. Session management works (multiple concurrent sessions)

## Timeline

- **Option A:** 1-2 days (keep current, optimize if needed)
- **Option B:** 2-3 days (complete HTTP-native Coda, deploy current)
- **Option C:** 5-7 days (build reusable base, then all MCPs)

## Decision

**AWAITING USER DECISION** - Which option preferred?

Current status: HTTP-native Coda implementation in progress
- Phase 1 (HTTP server) complete
- Phase 2 (OAuth routes) complete
- Ready to proceed with either Option B or rollback to Option A

---

**User Input Needed:**
1. Proceed with HTTP-native Coda (Option B)?
2. Prefer gateway consistency (Option A)?
3. Invest in reusable base (Option C)?
