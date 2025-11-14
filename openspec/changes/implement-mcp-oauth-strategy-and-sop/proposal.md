# Change: Implement MCP OAuth 2.1 Strategy with Stytch

**Change ID**: `implement-mcp-oauth-strategy-and-sop`
**Status**: IN PROGRESS
**Created**: 2025-11-08
**Updated**: 2025-11-14 (Updated with Stytch decision)

## Why

Current MCP deployments have critical OAuth 2.1 compliance gap preventing ChatGPT and Claude.ai web connections:

1. **Coda MCP** (droplet): Cloudflare Access JWT authentication (NOT OAuth 2.1 compliant)
2. **MCP Spec Compliance**: Current implementation missing required OAuth 2.1 components per MCP Specification 2025-06-18
3. **ChatGPT/Claude.ai Rejection**: Web applications reject connections due to missing OAuth metadata endpoints
4. **Future MCPs**: No documented OAuth 2.1 pattern for new MCP servers
5. **Scalability**: No clear path from personal use → client services

### Current Pain Points

**OAuth 2.1 Compliance Gaps**:
- ❌ Missing Authorization Server Metadata (RFC 8414)
- ❌ Missing Protected Resource Metadata (RFC 9728, added June 2025)
- ❌ Missing Resource Indicators (RFC 8707)
- ❌ Missing PKCE flow (mandatory for MCP clients)
- ❌ Missing Dynamic Client Registration (RFC 7591)

**Operational Issues**:
- Cloudflare Access JWT ≠ OAuth 2.1 (different authentication models)
- No clear migration path for scaling to client services
- Manual OAuth implementation would take weeks to build correctly
- Droplet at 87% memory utilization (3.3GB/3.8GB) - can't add 2GB Keycloak

### Desired Outcome

- **Phase 1 & 1.5 (Complete)**: MCP protocol working with Claude Code ✅
- **Phase 2 (This Week)**: OAuth 2.1 compliance via Stytch managed service
- **Phase 3 (Future)**: SOP + template for all future MCP deployments
- **Long-term**: Scale to WorkOS when serving client businesses (>10K users)

---

## What Changes

### Part A: OAuth Strategy (Decision)

**Selected Pattern**: **Stytch OAuth 2.1 Managed Service**

```
ChatGPT/Claude.ai Web
      ↓ (OAuth 2.1 + PKCE flow)
Stytch Authorization Server
      ├─ User authenticates (email/social/SSO)
      ├─ Issues authorization code
      └─ Returns access token
            ↓
Client sends MCP request + token
      ↓
Cloudflare Tunnel → Traefik → Coda MCP
      ↓
Stytch Middleware validates token
      ↓
MCP Handler → Coda API
```

**Why Stytch**:
1. ✅ **Full OAuth 2.1 compliance** (all required RFCs implemented)
2. ✅ **MCP-specific documentation** (proven pattern for AI agents)
3. ✅ **Free tier: 10,000 MAUs** (personal use covered indefinitely)
4. ✅ **Zero droplet memory** (fully managed, no local resources)
5. ✅ **All features free**: MFA, RBAC, SSO included (no paywalls)
6. ✅ **Beginner-friendly**: Dashboard, SDK, examples, support
7. ✅ **Production-ready**: Used by enterprise SaaS companies
8. ✅ **Migration path**: Can scale to WorkOS (1M free MAUs) when needed

**Alternatives Rejected**:
- ❌ **Auth0**: Less generous free tier (25K MAUs but fewer features)
- ❌ **Keycloak**: Requires 2GB RAM (blocks droplet at 87% utilization)
- ❌ **Better-Auth**: OAuth 2.1 compliance incomplete (too immature)
- ⏳ **WorkOS**: Better for scaling (migrate at 10K+ users)

---

### Part B: Implementation (Phased)

#### Phase 1 & 1.5: Foundation (✅ COMPLETE)
- **Phase 1**: Cloudflare Access JWT + Bearer token auth
- **Phase 1.5**: MCP JSON-RPC 2.0 protocol implementation
- **Status**: ✅ Working with Claude Code MCP client
- **Limitation**: Not OAuth 2.1 compliant (ChatGPT/Claude.ai reject)

#### Phase 2: Stytch OAuth 2.1 Integration (This Week)
- **Goal**: Enable ChatGPT and Claude.ai web connectivity
- **Implementation**:
  - Replace Cloudflare Access JWT middleware with Stytch SDK
  - Add OAuth metadata endpoints (RFC 8414, RFC 9728)
  - Configure PKCE flow
  - Test with ChatGPT and Claude.ai
- **Time**: 4-6 hours
- **Deliverables**:
  - ✅ Stytch authentication middleware (`src/middleware/stytch-auth.ts`)
  - ✅ OAuth metadata endpoints (`src/routes/oauth-metadata.ts`)
  - ✅ Updated docker-compose with Stytch env vars
  - ✅ Setup guide (`STYTCH_SETUP_GUIDE.md`)
  - ✅ Testing checklist

#### Phase 3: Documentation & SOP (Week 2-3)
- **Goal**: Establish reusable pattern for all future MCPs
- **Deliverables**:
  - MCP OAuth 2.1 SOP document
  - Template for new MCP servers
  - Updated architecture documentation
  - Migration guide (Stytch → WorkOS)

#### Phase 4 (Future): Scale to WorkOS (When Needed)
- **Trigger**: Approaching 10,000 MAUs OR clients demand enterprise SSO
- **Goal**: Support enterprise client services
- **Migration**: Stytch → WorkOS (OAuth 2.1 standard makes this straightforward)
- **Cost**: Free up to 1M MAUs

---

### Part C: Documentation

**New Documents**:
- ✅ `/docs/system/architecture/STYTCH_SETUP_GUIDE.md` - Complete implementation guide
- ⏳ `/docs/system/architecture/MCP_OAUTH_SOP.md` - OAuth 2.1 strategy & patterns
- ⏳ `/docs/system/architecture/STYTCH_TESTING_CHECKLIST.md` - Testing procedures
- ⏳ `/templates/mcp-server-stytch/` - Template for new MCPs with Stytch

**Updated Documents**:
- ✅ `/openspec/changes/implement-mcp-oauth-strategy-and-sop/design.md` - Technical architecture with Stytch
- ⏳ `/docs/system/architecture/MCP_IMPLEMENTATION_GUIDE.md` - Phase 2 (Stytch) added
- ⏳ `/docs/system/architecture/SERVICE_INVENTORY.md` - Coda MCP auth updated

---

## Impact

### Capabilities Affected
- ✅ `mcp-server-deployment` - OAuth 2.1 pattern established
- ✅ `authentication-strategy` - Stytch replaces Cloudflare Access
- ✅ `chatgpt-integration` - New: ChatGPT web connectivity enabled
- ✅ `claude-ai-integration` - New: Claude.ai web connectivity enabled

### Breaking Changes
- ❌ **None** - Fully backward compatible
  - Claude Code MCP client continues to work (Bearer token fallback during transition)
  - Can rollback to Cloudflare Access JWT if needed
  - Gradual migration: test Stytch → deploy → deprecate old auth

### Benefits
- ✅ **ChatGPT/Claude.ai connectivity** - Primary goal achieved
- ✅ **OAuth 2.1 spec compliant** - Future-proof for AI agent ecosystem
- ✅ **Zero memory overhead** - Droplet remains at 87% utilization
- ✅ **Free for personal use** - 10K MAUs covers personal needs indefinitely
- ✅ **Production-ready pattern** - Can scale to client services
- ✅ **Clear migration path** - Stytch → WorkOS → optional Keycloak at scale

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stytch outage | Medium | Keep Bearer token fallback during transition |
| ChatGPT still rejects | High | Test OAuth metadata endpoints first, validate with Stytch sandbox |
| Free tier exceeded | Low | Monitor MAUs in Stytch dashboard, WorkOS migration ready |
| Implementation bugs | Medium | Comprehensive testing checklist, rollback plan documented |
| Vendor lock-in | Low | OAuth 2.1 is standard, can migrate to WorkOS/Keycloak if needed |

---

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| **Phase 1**: Cloudflare Access + env var | 1 day | ✅ Complete (2025-11-10) |
| **Phase 1.5**: MCP protocol implementation | 2 days | ✅ Complete (2025-11-12) |
| **Phase 2**: Stytch OAuth 2.1 integration | 4-6 hours | ⏳ In Progress (design complete) |
| **Phase 2**: Testing & validation | 2 hours | ⏳ Pending |
| **Phase 3**: Documentation & SOP | 1-2 days | ⏳ Pending |

**Total Effort**: ~8 hours engineering + 1-2 days documentation

---

## Success Criteria

### Phase 2 Success Criteria
- ✅ Stytch SDK integrated into Coda MCP
- ✅ OAuth metadata endpoints responding (`.well-known/*`)
- ✅ ChatGPT web connects successfully via OAuth flow
- ✅ Claude.ai web connects successfully via OAuth flow
- ✅ All existing MCP tools function correctly
- ✅ Health check shows `"oauth_compliant": true`
- ✅ Stytch session tokens validate correctly
- ✅ Bearer token fallback still works (for Claude Code)

### Phase 3 Success Criteria
- ✅ OAuth 2.1 SOP document published
- ✅ MCP server template with Stytch created
- ✅ Architecture documentation updated
- ✅ Migration guide (Stytch → WorkOS) documented

---

## Cost Analysis

### Current State (Personal Use)
- **Droplet**: $24/mo (4GB RAM)
- **Stytch**: **$0/mo** (free tier: 10,000 MAUs)
- **Total**: $24/mo

### Future: First Clients (< 10K users)
- **Droplet**: $24/mo
- **Stytch**: **$0-50/mo** (usage-based pricing)
- **Total**: $24-74/mo

### Future: Scaling (10K-100K users)
- **Droplet**: $48/mo (8GB upgrade) or migrate to managed Kubernetes
- **WorkOS**: **$0/mo** (free up to 1M MAUs)
- **Total**: $48/mo

### Future: Enterprise (100K+ users)
- **Infrastructure**: $100-500/mo
- **WorkOS**: **$2,500/mo** (per 1M MAUs)
- **Alternative**: Keycloak self-hosted (~$1,096/mo with DevOps)
- **Total**: $2,600/mo (WorkOS) or $1,200/mo (Keycloak)

**Break-even**: Keycloak becomes cost-effective at ~150K users

---

## Related Work

**Depends on**:
- ✅ Cloudflare tunnel (already deployed)
- ✅ Traefik v3.0 (deployed 2025-11-13)
- ✅ MCP Protocol Phase 1.5 (JSON-RPC 2.0 implementation)

**Blocks**:
- Future MCP deployments (GitHub, Firecrawl, Memory, etc.)
- Client service offerings (need OAuth 2.1 for trust)

**Replaces**:
- Cloudflare Access JWT validation (deprecated for MCP servers)
- Custom OAuth middleware plans (Stytch SDK handles this)
- PostgreSQL token storage plans (deferred, Stytch manages tokens)

---

## Notes

### Technical Decisions
- **M2M Tokens**: NOT used in MCP (uses user OAuth tokens via Authorization Code flow)
- **Cloudflare Workers**: Deployment deferred until system further developed
- **Reverse Proxy**: Keeping Traefik for MCPs (centralized routing/monitoring)
- **Token Storage**: Stytch SDK manages tokens (no local PostgreSQL needed)
- **Infisical**: Deferred until Infisical deployment fixed

### Key Findings
1. **OAuth 2.1 Required**: MCP Spec 2025-06-18 mandates full OAuth 2.1 compliance
2. **ChatGPT/Claude.ai Rejection**: Due to missing Authorization Server Metadata endpoints
3. **Keycloak Blocked**: Requires 2GB RAM minimum, droplet at 87% capacity
4. **Stytch Advantage**: Only solution with all features free + beginner-friendly + zero memory
5. **Migration Path**: Stytch (personal) → WorkOS (clients) → Keycloak (cost optimization at scale)

---

**Proposal Status**: ✅ Approved (design complete, implementation in progress)
**Implementation Lead**: David Kellam
**Target Completion**: Phase 2 by end of week
