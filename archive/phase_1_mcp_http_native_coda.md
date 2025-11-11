---
entity: plan
level: execution
zone: internal
version: v01
tags: [mcp, http-native, coda, phase-1, context-engineering, memory-architecture]
source_path: /planning/phase_1_mcp_http_native_coda.md
date: 2025-11-01
status: in_progress
related:
  - agents/context/playbooks/http_native_mcp_server_v01.md
  - planning/context_engineering_research_v01.md
  - planning/better_auth_migration_plan_v01.md
---

# Phase 1: HTTP-Native Coda MCP Implementation Plan

**Duration**: 6 days (Days 1-6 of Week 1)
**Owner**: David Kellam
**Status**: IN PROGRESS
**Last Updated**: 2025-11-01

---

## Strategic Context

This phase establishes the foundation for a **context-engineered, state-aware HTTP-native MCP architecture** based on:

- **Context Engineering Research** (4 pillars: Write, Select, Compress, Isolate)
- **Memory Management Philosophy** (Nate's 8 principles, two-tier architecture)
- **Anthropic Guidance** (Just-in-time retrieval, token efficiency, two-tier memory)
- **Agentic Ecosystem Hierarchy** (Skills orchestrate MCPs)

### Core Principles for Phase 1

1. **Token Efficiency First**: Every response includes token estimates; progressive disclosure (metadata → summary → full)
2. **Two-Tier Memory Architecture**: Session state (ephemeral) + persistent files (cross-session learning)
3. **Memory-Aware Design**: Tools understand and track memory implications
4. **Secure OAuth**: Cloudflare Access provides free single-user OAuth without database overhead
5. **Future-Ready**: Decisions today should not block Better Auth migration, RAG layer, or meta-skills

---

## Phase 1 Breakdown by Day

### Day 1: Repository Setup & Architecture Planning

**Task 1.1: Fork & Clone Coda MCP**
```bash
# Steps:
1. Navigate to https://github.com/dustinrgood/coda-mcp
2. Fork to your GitHub
3. Clone locally
4. Explore codebase for security
5. Document provenance
```

**Task 1.2: Design Session State Structure**
```typescript
interface SessionState {
  sessionId: string;
  startTime: Date;
  recentActions: Array<{
    tool: string;
    timestamp: Date;
    summary: string;
    tokenEstimate: number;
  }>;
  scratchpad: Record<string, any>;
}

interface MCPToolResponse<T> {
  success: boolean;
  data?: T;
  metadata: {
    timestamp: string;
    resourceId: string;
    source: "coda";
    tokenEstimate: number;
    summary: string;
  };
  fullContentPath?: string;
}
```

**Deliverables**: Fork complete, codebase understood, architecture designed

---

### Day 2-3: HTTP-Native Server Implementation

**Task 2.1: Create `/src/http-server.ts`**

Core components:
- Express app with JSON/CORS middleware
- Session management (stateful mode with Map)
- StreamableHTTPServerTransport integration
- POST/GET/DELETE /mcp endpoints
- Bearer token authorization
- Health check endpoint
- Error handling with MCP-compliant responses

**Task 2.2: Implement Token-Efficient Responses**

Every tool response includes:
- `success` boolean
- `data` with actual content
- `metadata` with timestamp, resourceId, tokenEstimate, summary
- `fullContentPath` for on-demand retrieval

**Task 2.3: Add Memory Hook Infrastructure**

Placeholder callbacks for future persistent memory layer:
- `onToolCall(sessionId, tool, params)`
- `onResponse(sessionId, tool, response)`
- `onSessionEnd(sessionId)`

**Deliverables**: HTTP server functional, token estimation framework in place

---

### Day 4: Cloudflare Access OAuth Configuration

**Task 3.1: Create Access for SaaS Application**
- Log into Cloudflare Zero Trust
- Create OIDC provider
- Note credentials and endpoints

**Task 3.2: Configure Linked App Token Policy**
- Use Cloudflare API to set up linked_app_token policy
- Enable remote client authentication

**Task 3.3: Configure DNS**
- Add CNAME record: coda → tools-droplet-agents (via tunnel)

**Task 3.4: Local Testing**
```bash
# Test OAuth discovery endpoints
curl http://localhost:8080/.well-known/oauth-authorization-server

# Test MCP with Bearer token
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer [token]" \
  -d '{...}'
```

**Deliverables**: OAuth configured and tested locally

---

### Day 5: Documentation & Project Conventions

**Task 4.1: Create `/CLAUDE.md`**

Agent guidance document covering:
- Architecture overview (HTTP-native, OAuth, session state)
- MCP tool design principles
- Tool response format
- Testing patterns
- Common gotchas
- Future extensions (Better Auth, RAG, meta-skills)

**Task 4.2: Create Examples Folder**

`/integrations/mcp/servers/coda/examples/mcp/`:
- oauth_flow_walkthrough.md
- coda_list_documents.json
- error_handling.md
- token_optimization.md
- oauth_test.sh
- tool_test.sh
- session_test.sh

**Task 4.3: Create Deployment Guide**

`/integrations/mcp/servers/coda/DEPLOYMENT.md`:
- Local development steps
- Droplet deployment procedure
- Monitoring setup
- Rollback strategy

**Deliverables**: Complete documentation suite

---

### Day 6: Deployment & Monitoring

**Task 5.1: Prepare Droplet Deployment**
- Update docker-compose.production.yml
- Test build locally
- Prepare rsync commands

**Task 5.2: Deploy to Droplet**
```bash
rsync code to droplet
rsync docker-compose to droplet
ssh and build/deploy
verify with curl
```

**Task 5.3: Configure Monitoring**
- Add to Uptime Robot (5 min intervals)
- Create health check dashboard in Coda
- Configure email alerts

**Task 5.4: Verification**
- Test health endpoint
- Test OAuth flow
- Verify session persistence
- Check logs for errors

**Deliverables**: Production deployment complete and verified

---

## Phase 1 Success Criteria

- ✅ Coda MCP responds at `https://coda.bestviable.com/mcp`
- ✅ OAuth flow completes successfully
- ✅ Tools return token-efficient responses with metadata
- ✅ Session state tracking working
- ✅ CLAUDE.md and examples created
- ✅ Deployment documentation complete
- ✅ Monitoring active

---

## Phase 1 Deliverables

### Code
- `/integrations/mcp/servers/coda/src/http-server.ts`
- Updated `/infra/docker/docker-compose.production.yml`
- Updated `/Dockerfile`

### Documentation
- `/CLAUDE.md`
- `/integrations/mcp/servers/coda/DEPLOYMENT.md`
- `/integrations/mcp/servers/coda/examples/mcp/` (all examples)

### Infrastructure
- Coda MCP service deployed
- Cloudflare Access OAuth configured
- DNS configured
- Monitoring active

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| HTTP server integration fails | Test locally first, simple integration test |
| OAuth too complex | Pre-tested, examples provided |
| Token estimates inaccurate | Conservative rounding, recalibrate after Phase 1 |
| Session memory leak | Test with 100+ session lifecycle |
| Deployment fails | Rollback to previous image |

---

## Next Steps After Phase 1

1. Read `/planning/phase_1_completion_handoff.md`
2. Review context engineering research to understand larger architecture
3. Begin Phase 2: GitHub, Memory, Firecrawl MCPs

---

**Version**: v01
**Last Updated**: 2025-11-01
**Status**: IN PROGRESS
