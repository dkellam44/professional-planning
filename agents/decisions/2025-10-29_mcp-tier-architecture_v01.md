# ADR: MCP Three-Tier Architecture

- **Date**: 2025-10-29
- **Status**: Accepted
- **Supersedes**: `/agents/decisions/2025-10-26_mcp-deployment-policy_v01.md` (extends, not replaces)

## Context

We have 14 MCP servers configured exclusively for Claude Desktop via local stdio transport. This creates several problems:

1. **Accessibility**: CLI agents (Claude Code, Codex, Gemini), web chat clients (ChatGPT, Perplexity), and IDEs (Cursor, Zed, VS Code) cannot access these tools
2. **Duplication**: Some MCPs (like Coda) have 3 different configurations (basic npm, Docker enhanced, remote gateway)
3. **Inconsistent deployment**: No clear policy on when to deploy remote vs local vs project-specific
4. **Configuration drift**: User-scope configs scattered across multiple locations with no templates
5. **Limited visibility**: No central registry showing which MCPs are available to which clients
6. **Security concerns**: Sensitive tokens (GitHub PAT, API keys) replicated across multiple client configs

The existing ADR `2025-10-26_mcp-deployment-policy_v01.md` established a hybrid approach (self-host critical servers, expose via Cloudflare, keep simple servers local) but didn't specify clear criteria for tier assignment or provide architectural guidance.

## Decision

We will adopt a **three-tier MCP deployment architecture** with clear assignment criteria:

### Tier 1: Remote Transport Servers (Droplet-Hosted)
**Transport**: SSE over HTTPS
**Pattern**: SyncBricks (nginx-proxy + acme-companion + Cloudflare Tunnel)
**Access**: All AI clients
**Subdomain**: `{mcp-name}.bestviable.com/sse`

**Deploy to Tier 1 when:**
- MCP requires custom fork or frequent modifications
- MCP accesses centralized resources (databases, shared state)
- MCP has expensive/rate-limited APIs (better centralized)
- MCP needs resource-intensive operations (browser automation, large datasets)
- MCP contains sensitive credentials (GitHub tokens, production API keys)

**Examples**: Coda, GitHub, Memory, Firecrawl, Puppeteer

### Tier 2: User-Scope Local Servers (Per-Client)
**Transport**: stdio (ephemeral npx/uvx execution)
**Pattern**: Client-specific configuration files
**Access**: Single client instance
**Config location**: `~/.config/{client}/ or ~/Library/Application Support/`

**Deploy to Tier 2 when:**
- MCP is stable official release (rarely needs updates)
- MCP performs lightweight compute (calculator, time utilities)
- MCP has no external API dependencies
- MCP is client-specific (sequential-thinking, some filesystem access)

**Examples**: calculator, time, fetch, sequential-thinking, brave-search, youtube-transcript

### Tier 3: Project-Scope Local Servers (Workspace-Bounded)
**Transport**: stdio (project-relative paths)
**Pattern**: `.mcp/config.json` committed to repository
**Access**: AI agents working in specific project
**Config location**: `{project-root}/.mcp/`

**Deploy to Tier 3 when:**
- MCP access must be limited to specific workspace (security boundary)
- MCP is under development/testing before promoting to Tier 1
- MCP is project-specific tooling (custom builders, repo analyzers)
- MCP configuration is workspace-dependent (filesystem paths, project-specific APIs)

**Examples**: filesystem (scoped to project), context7 (project-specific docs), custom SoT tooling

### Architectural Principles

1. **Progressive Enhancement**: Start Tier 3 (project) → promote to Tier 1 (remote) when stable and multi-project
2. **Security Isolation**: Sensitive credentials centralized in Tier 1 (single `.env` on droplet)
3. **Client Neutrality**: Tier 1 MCPs accessible to any client (CLI, web, desktop, IDE)
4. **Documentation Parity**: Each tier has standardized docs (README, DEPLOYMENT, CHANGELOG, TROUBLESHOOTING)
5. **Living Registry**: Central catalog (`/docs/architecture/integrations/mcp/server_catalog_v01.md`) tracks all MCPs with tier assignments

## Consequences

### Pros
- **Universal Access**: Remote MCPs available to all 10+ AI clients without per-client configuration
- **Security Centralization**: Sensitive tokens in single location (droplet `.env`) instead of replicated across clients
- **Clear Decision Criteria**: Tier assignment matrix eliminates ambiguity about where to deploy
- **Reduced Duplication**: Single Coda MCP (Tier 1) replaces 3 conflicting configs
- **Workspace Security**: Project-scope MCPs enforce access boundaries (e.g., filesystem limited to specific directories)
- **Configuration Templates**: User-scope MCPs have reusable templates for each client type
- **Operational Visibility**: Central registry shows all MCPs, their status, endpoints, and documentation

### Cons
- **Initial Setup Cost**: ~15-20 hours to migrate all MCPs and create documentation
- **Operational Complexity**: Remote MCPs require droplet management, monitoring, and health checks
- **Network Dependency**: Tier 1 MCPs unavailable if Cloudflare Tunnel or droplet offline (mitigated by Tier 2 fallback)
- **Client Configuration Variance**: Each client (Cursor, Zed, VS Code) may require different config format (one-time research cost)
- **Version Skew Risk**: Tier 2 MCPs may drift if not kept synchronized across clients

### Mitigations
- **Phased Rollout**: Implement over 4 phases (~17 hours total), starting with Coda upgrade
- **Health Monitoring**: n8n workflow checks Tier 1 endpoints every 5 minutes, alerts on failure
- **Hybrid Approach**: Keep critical Tier 2 MCPs (calculator, time) as offline fallback
- **Template System**: Maintain config templates in `/workspace/mcp-configs/` for easy client setup
- **Automated Testing**: CI/CD pipeline validates Tier 1 MCPs on every deploy (stretch goal)

## Implementation Plan

See `/agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md` for detailed 4-phase execution plan:

**Phase 1**: Foundation & Coda Upgrade (4 hours)
- Create directory structure
- Upgrade Coda MCP from local source
- Establish documentation standards

**Phase 2**: Remote Migration (6 hours)
- Deploy GitHub, Memory, Firecrawl to Tier 1
- Create multi-service gateway pattern

**Phase 3**: Client Configuration (4 hours)
- Configure Claude Code, Claude Desktop
- Create templates for Cursor, Zed, VS Code, ChatGPT

**Phase 4**: Project Scope & Monitoring (3 hours)
- Set up `.mcp/` in portfolio workspace
- Add health checks and alerting

**Total Estimated Effort**: 17 hours

## Related Decisions

- **Extends** (not replaces): `/agents/decisions/2025-10-26_mcp-deployment-policy_v01.md` - Original hybrid deployment policy
- **Builds on**: `/agents/decisions/2025-10-28_cloudflare-proxy-trust-config_v01.md` - Cloudflare Tunnel + nginx-proxy trust configuration
- **Leverages**: `/agents/decisions/2025-10-26_infrastructure-syncbricks-adoption_v01.md` - SyncBricks pattern for auto-discovery reverse proxy

## Success Metrics

- **Accessibility**: 5+ AI clients can access Tier 1 MCPs (Claude Code, Claude Desktop, Cursor, Zed, ChatGPT)
- **Consolidation**: Single Coda MCP replaces 3 conflicting configurations
- **Coverage**: 14+ MCPs documented in central registry with tier assignments
- **Uptime**: Tier 1 MCPs maintain 99%+ availability (monitored via n8n health checks)
- **Onboarding Speed**: New AI client can be configured for Tier 1 access in <30 minutes using templates

## Review Schedule

- **Immediate**: After Phase 1 completion (Coda upgrade + docs)
- **Short-term**: After Phase 2 completion (3 MCPs migrated to Tier 1)
- **Long-term**: Quarterly review of tier assignments as usage patterns emerge

**Next Review**: 2025-12-01 or after Phase 2 completion, whichever comes first
