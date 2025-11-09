# Change: Implement MCP OAuth Strategy & SOP with Reusable Middleware

**Change ID**: `implement-mcp-oauth-strategy-and-sop`
**Status**: PROPOSAL
**Created**: 2025-11-08

## Why

Current MCP deployments lack cohesive authentication strategy:

1. **Coda MCP** (droplet): Mock OAuth implementation, no token persistence, unauthenticated endpoints
2. **GitHub/Memory/Context7** (Workers): No per-user authentication, rely on Cloudflare Access
3. **Future MCPs**: No documented pattern or reusable components for authentication
4. **Security**: Token management ad-hoc (env vars, in-memory, unencrypted)
5. **Documentation**: Orphaned reference docs, deprecated setup instructions, incomplete SOP

### Current Pain Points

- New MCP authors must re-implement OAuth from scratch
- No standardized token storage approach
- Authentication scattered across multiple patterns (Bearer tokens, Cloudflare Access, in-memory)
- Difficult to audit or rotate tokens
- Cannot easily migrate auth strategies (env → database → Infisical)
- Coda MCP returns 401 because no real token authentication implemented

### Desired Outcome

- **Phase 1 (Now)**: Coda MCP working with Cloudflare Access + env var token storage
- **Phase 2 (Week 2)**: Reusable `@bestviable/mcp-auth-middleware` npm package with PostgreSQL backend
- **Phase 3 (Future)**: Centralized secrets via Infisical
- **Long-term**: SOP + template for all future MCP deployments

## What Changes

### Part A: OAuth Strategy (Decision)

**Selected Pattern**: Cloudflare Access + Phased Token Storage

```
┌─────────────────────┐
│  User Request       │
│   (HTTPS)           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Cloudflare Tunnel   │ ◄──── User already authenticated
│ & Access           │       by Cloudflare Access
└──────────┬──────────┘
           │
           ▼ JWT Header
┌─────────────────────┐
│ MCP Endpoint        │
│ Validates JWT ✅    │
│ Retrieves Token:    │
│  ├─ Phase 1: Env    │
│  ├─ Phase 2: PG     │
│  └─ Phase 3: Secret │
└──────────┬──────────┘
           │
           ▼ Coda Token
┌─────────────────────┐
│ Coda API            │
└─────────────────────┘
```

**Rationale**:
- Cloudflare Access already deployed and working
- No additional infrastructure needed
- Zero cost (included with tunnel)
- Simple JWT validation in application code
- Per-request authentication (stateless)

### Part B: Implementation (Phased)

#### Phase 1: Environment Variable (Week 1)
- **Goal**: Get Coda MCP working ASAP
- **Storage**: `CODA_API_TOKEN` in `docker-compose.yml`
- **Time**: 10 minutes
- **Scope**: Single-user
- **Deliverable**: Authenticated Coda MCP endpoint

#### Phase 2: PostgreSQL + Middleware (Week 2-3)
- **Goal**: Establish reusable pattern for all MCPs
- **Storage**: Local `mcp_auth` database with encryption
- **Time**: 6 hours total
- **Scope**: Multiple MCPs, single service account per MCP
- **Deliverable**: `@bestviable/mcp-auth-middleware` npm package + migration script

#### Phase 3: Infisical (Post-launch)
- **Goal**: Centralized secrets management
- **Prerequisite**: Fix broken Infisical deployment first
- **Time**: 4-6 hours after Phase 2
- **Scope**: All services (MCPs, n8n, Archon)
- **Migration**: Postgres → Infisical (1 function call)

### Part C: Documentation & Template

**New Documents**:
- `/docs/infrastructure/mcp/OAUTH_SOP.md` - Complete strategy & decision framework
- `/docs/infrastructure/mcp/OAUTH_TROUBLESHOOTING.md` - Runbook
- `/templates/mcp-server-template/` - Ready-to-use template for new MCPs
- `/docs/DEPRECATION_NOTICES.md` - Index of deprecated docs

**Updated Documents**:
- `/docs/architecture/integrations/mcp/MCP_SERVER_CATALOG.md` - Auth details per MCP
- `/docs/architecture/ARCHITECTURE.md` - MCP auth section
- `/CURRENT_STATE_v1.md` - Phase 2F status
- Identify & fix all orphaned reference docs

## Impact

### Capabilities Affected
- `mcp-server-deployment` - Deployment pattern changes
- `cloudflare-access-integration` - JWT validation added
- `token-management` - New encrypted storage pattern

### Breaking Changes
- ❌ **None** - Fully backward compatible
  - Phase 1 uses env var (current approach)
  - Phase 2 migration is transparent
  - Phase 3 optional

### Benefits
- ✅ Coda MCP secured and operational
- ✅ Clear decision framework for future MCPs
- ✅ Reusable middleware reduces new MCP dev time by ~40%
- ✅ Encryption at rest by default
- ✅ Token rotation capability
- ✅ Audit logging built-in

### Risks
- **Infisical broken**: Phase 3 blocked until fixed. Mitigation: Defer Phase 3
- **PostgreSQL failure**: Phase 2 blocked. Mitigation: Already healthy, monitor closely
- **Cloudflare Access changes**: Phase 1 could break. Mitigation: JWT validation in code, can fall back to Bearer token

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Env Var + Auth | 1 day | This week |
| Phase 1: Testing | 1 day | This week |
| Phase 2: Middleware + PG | 3-4 days | Week 2 |
| Phase 2: Testing & Migration | 1 day | Week 2 |
| Phase 3: Documentation | 3-4 days | Week 2-3 |
| Phase 4: Orphaned Doc Audit | 2 days | Week 3 |

**Total Effort**: ~13 hours engineering + 4 hours doc audit

## Success Criteria

- ✅ Coda MCP accessible via HTTPS and authenticated
- ✅ Token validation working (Cloudflare JWT)
- ✅ PostgreSQL backend tested and migrated
- ✅ `@bestviable/mcp-auth-middleware` package published
- ✅ All unit & integration tests passing
- ✅ SOP document complete with examples
- ✅ MCP_SERVER_CATALOG updated
- ✅ Orphaned docs identified and fixed

## Related Work

**Replaces (archive)**:
- `/archive/phase_1_mcp_http_native_coda.md`
- `/archive/phase_2_mcp_workers_plan.md`
- `/archive/mcp_digitalocean_cloudflare_deploy_v01.md`

**Depends on**:
- Cloudflare tunnel (already deployed)
- PostgreSQL local (already running)

**Blocked by**:
- None

**Blocks**:
- Future MCP deployments should reference this SOP

## Notes

- **Coda MCP current issue**: Returns 401 because no real authentication. Phase 1 fixes this.
- **Infisical**: Self-hosted container is unhealthy. Phase 3 deferred until fixed.
- **PostgreSQL**: Already running locally, no additional cost.
- **Reusability**: Middleware designed as npm package to be used across all droplet MCPs.
- **Migration path**: All phases support rollback. Can return to env var or migrate to Infisical without rewrite.
- **Token storage decision**: User selected "other" (to be determined during Phase 2).

---

**Proposal Approver**: [To be filled during approval]
**Implementation Lead**: David Kellam
