---
- entity: integration
- level: internal
- zone: internal
- version: v01
- tags: [mcp, integrations, architecture, documentation]
- source_path: /docs/architecture/integrations/mcp/README.md
- date: 2025-10-29
---

# MCP Integration Documentation Hub

**Purpose**: Technical architecture documentation and navigation for Model Context Protocol (MCP) integration across all deployment tiers.

**Status**: ✅ Active (replaces deprecated v0.2 documentation from 2025-10-17)

---

## Overview

Model Context Protocol (MCP) integration provides AI agents with tool access to:
- **Coda** - Founder HQ operational data (deals, tasks, contacts)
- **GitHub** - Repository operations (PRs, issues, code search)
- **Memory** - Shared knowledge graph across agent sessions
- **Standard Utilities** - Calculator, time, filesystem, web search

**Architecture**: Three-tier deployment model (remote transport, user-scope local, project-scope local)

**Current Deployment**: 14+ MCP servers across all three tiers, 1 production remote gateway

---

## Quick Navigation

### For New Developers
1. Start here: [MCP Server Catalog](server_catalog_v01.md) - Inventory of all MCPs
2. Then read: [Three-Tier Architecture ADR](../../../agents/decisions/2025-10-29_mcp-tier-architecture_v01.md)
3. Implement: [MCP Architecture Playbook](../../../agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md)

### For Operations
- **Troubleshooting**: [MCP Troubleshooting Runbook](../../ops/runbooks/mcp_troubleshooting_v01.md)
- **Health Checks**: See runbook for tier-specific diagnostics
- **Deployment**: [Infrastructure State](../../infrastructure/droplet_state_2025-10-28.md)

### For Adding New MCPs
- Use template: [MCP Server Onboarding Template](../../../agents/context/playbooks/mcp_server_onboarding_template_v01.md)
- See examples: [Coda MCP Upgrade Plan](../../../agents/context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md)

---

## Current Production Endpoints

### Tier 1: Remote Transport (Droplet-Hosted)

All endpoints use HTTPS with automatic SSL certificates from Let's Encrypt via acme-companion.

| Service | Endpoint | Status | Transport | Tools |
|---------|----------|--------|-----------|-------|
| **Coda MCP Gateway** | `https://coda.bestviable.com/sse` | ✅ Production | SSE over HTTPS | 8 tools |
| **GitHub MCP** | `https://github.bestviable.com/sse` | 🚧 Planned Q4 2025 | SSE over HTTPS | ~15 tools |
| **Memory MCP** | `https://memory.bestviable.com/sse` | 🚧 Planned Q4 2025 | SSE over HTTPS | 5 tools |
| **Firecrawl MCP** | `https://firecrawl.bestviable.com/sse` | 🚧 Planned Q1 2026 | SSE over HTTPS | 6 tools |

**Routing**: Cloudflare Tunnel → nginx-proxy → MCP container (mcp-proxy wrapper)

**Infrastructure**: DigitalOcean droplet (tools.bestviable.com, 159.65.97.146) using SyncBricks pattern

**Authentication**: Bearer tokens via `Authorization` header (per-MCP API keys)

**Health Check**:
```bash
curl -I https://coda.bestviable.com/sse
# Expected: HTTP/1.1 200 OK
```

---

## Architecture Documentation

### Core Documents

**Living Inventory**:
- [MCP Server Catalog](server_catalog_v01.md) - **START HERE** - All MCPs with status, endpoints, tools, docs

**Governance** (evergreen):
- [Three-Tier Architecture ADR](../../../agents/decisions/2025-10-29_mcp-tier-architecture_v01.md) - Tier decision criteria
- [MCP Deployment Policy](../../../agents/decisions/2025-10-26_mcp-deployment-policy_v01.md) - Original hybrid policy

**Implementation** (mutable):
- [MCP Architecture Playbook](../../../agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md) - 4-phase execution plan
- [MCP Server Onboarding Template](../../../agents/context/playbooks/mcp_server_onboarding_template_v01.md) - Reusable onboarding checklist
- [Coda MCP Upgrade Plan](../../../agents/context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md) - Coda-specific deployment

**Operations**:
- [MCP Troubleshooting Runbook](../../ops/runbooks/mcp_troubleshooting_v01.md) - Diagnostics and recovery procedures

### Implementation Code

**Location**: `/integrations/mcp/`
- Source code for all MCP servers
- Docker configurations and compose files
- Client configuration templates
- Deployment scripts

**README**: [MCP Integration Code](../../../integrations/mcp/README.md)

---

## Three-Tier Architecture

### Tier 1: Remote Transport Servers (Droplet-Hosted)
**When to use**: Custom forks, expensive APIs, sensitive credentials, resource-intensive operations

**Subdomain pattern**: `{mcp-name}.bestviable.com/sse`

**Current**: 1 deployed (Coda), 3 planned (GitHub, Memory, Firecrawl)

**Deployment**: Docker containers on droplet, exposed via SyncBricks (nginx-proxy + acme-companion + Cloudflare Tunnel)

**Access**: All AI clients (CLI agents, web chats, desktop apps, IDEs)

### Tier 2: User-Scope Local Servers
**When to use**: Stable official releases, lightweight utilities, no external dependencies

**Config location**: `~/.config/{client-name}/` or `~/Library/Application Support/Claude/`

**Current**: 13 servers (calculator, time, fetch, sequential-thinking, brave-search, youtube-transcript, context7, etc.)

**Deployment**: npx/uvx ephemeral execution per AI client

**Access**: Single client instance

### Tier 3: Project-Scope Local Servers
**When to use**: Workspace-bounded security, project-specific tooling, development/testing

**Config location**: `{project-root}/.mcp/config.json`

**Current**: 0 deployed (filesystem planned for portfolio workspace)

**Deployment**: stdio with project-relative paths

**Access**: AI agents working in specific project

**Full details**: See [Three-Tier Architecture ADR](../../../agents/decisions/2025-10-29_mcp-tier-architecture_v01.md)

---

## Client Setup Guides

### Supported AI Clients

**Production Ready**:
- Claude Desktop (Tier 1 + Tier 2 configured)
- Claude Code CLI (Tier 1 configuration pending)

**Planned**:
- Cursor IDE
- Zed
- VS Code
- ChatGPT web UI
- Codex CLI (existing guide to be updated)

**Client-specific guides**: `/integrations/mcp/clients/{client-name}/README.md`

### Remote Transport Configuration (Tier 1)

**Example (Claude Code):**
```json
{
  "mcpServers": {
    "coda-remote": {
      "transport": "sse",
      "url": "https://coda.bestviable.com/sse",
      "headers": {
        "Authorization": "Bearer ${CODA_API_TOKEN}"
      }
    }
  }
}
```

**Configuration templates**: `/Users/davidkellam/workspace/mcp-configs/user-scope/`

---

## Tool Schemas

**Location**: `/docs/architecture/integrations/mcp/tool_schemas/` (to be populated)

**Purpose**: JSON schemas for each MCP tool (parameters, return types, examples)

**Example**: `coda_tools_schema_v01.json` will document:
- `list_tables` - Parameters, response format
- `query_rows` - Filter syntax, pagination
- `create_row` - Required fields, validation rules

---

## Security & Authentication

### API Key Management

**Tier 1 (Remote)**:
- Secrets stored in droplet `.env` file (not committed)
- Loaded by docker-compose environment variables
- Clients authenticate with Bearer tokens in `Authorization` header

**Tier 2 (User)**:
- API keys in client config files (user-scope only, not committed)
- Or environment variables in shell/client runtime

**Tier 3 (Project)**:
- Secrets in `.mcp/.env` (gitignored)
- Placeholders in `.mcp/.env.example` (committed)

### Security Guidelines

**DO**:
- ✅ Use least-privilege API scopes
- ✅ Rotate tokens quarterly
- ✅ Scope filesystem access to specific directories (Tier 3)
- ✅ Commit `.env.example` with placeholders

**DON'T**:
- ❌ Commit API keys or tokens to git
- ❌ Share tokens across services
- ❌ Use overly permissive scopes

---

## Monitoring & Health

### Health Checks (Tier 1)

**Automated** (planned Phase 4):
- n8n workflow: "MCP Health Monitor"
- Checks all Tier 1 endpoints every 5 minutes
- Alerts on failures (email/Slack)

**Manual**:
```bash
# Test all Tier 1 endpoints
curl -I https://coda.bestviable.com/sse
curl -I https://github.bestviable.com/sse
curl -I https://memory.bestviable.com/sse

# Check droplet services
ssh root@tools
docker compose -f docker-compose.production.yml ps | grep mcp-gateway

# View logs
docker logs coda-mcp-gateway --tail 50
```

### Performance Metrics

**Current**: Manual observation via logs and `docker stats`

**Planned**:
- Request count per MCP
- Latency percentiles (p50, p95, p99)
- Error rates
- API rate limit consumption

---

## Related Infrastructure

### Droplet Configuration

**Provider**: DigitalOcean
**Hostname**: tools.bestviable.com
**IP**: 159.65.97.146
**OS**: Ubuntu (Docker host)

**Infrastructure Pattern**: SyncBricks
- Auto-discovery reverse proxy (nginx-proxy)
- Automatic SSL certificate management (acme-companion)
- Secure connectivity via Cloudflare Tunnel (token-based)
- Two-network isolation (proxy + syncbricks)

**Documentation**:
- [Droplet State Snapshot](../../infrastructure/droplet_state_2025-10-28.md)
- [SyncBricks Pattern](../../infrastructure/syncbricks_solution_breakdown_v1.md)
- [Cloudflare Tunnel Guide](../../infrastructure/cloudflare_tunnel_token_guide_v01.md)
- [Production Deployment Quickstart](../../ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md)

### Docker Compose

**Location**: `/docs/ops/docker-compose.production.yml`

**MCP Services**:
- `coda-mcp-gateway` (port 8080)
- `github-mcp-gateway` (port 8081, planned)
- `memory-mcp-gateway` (port 8082, planned)

**Each service includes**:
- Dockerfile: `/docs/ops/Dockerfile.{mcp-name}-mcp-gateway`
- mcp-proxy wrapper for stdio → SSE conversion
- Environment variables for API keys
- Virtual host for nginx-proxy auto-discovery
- Health checks (process or HTTP)

---

## Future Work

### Short-Term (Q4 2025)
- [ ] Deploy GitHub MCP to Tier 1
- [ ] Deploy Memory MCP to Tier 1
- [ ] Configure Claude Code for remote transport
- [ ] Create client setup guides for Cursor, Zed
- [ ] Implement n8n health monitoring workflow

### Medium-Term (Q1 2026)
- [ ] Deploy Firecrawl and Puppeteer to Tier 1
- [ ] Unified MCP Gateway (single container multiplexing)
- [ ] CI/CD pipeline for automatic droplet deployment
- [ ] Metrics/observability dashboard
- [ ] Project-scope MCPs for portfolio workspace

### Long-Term (Q2+ 2026)
- [ ] MCP discovery service (automatic client configuration)
- [ ] Caching layer for expensive API calls
- [ ] Custom MCPs: n8n, postgres, qdrant, SoT operations
- [ ] MCP server marketplace/registry

---

## Changelog

**2025-10-29**: v01 - Complete rewrite
- Established three-tier architecture
- Documented 14+ MCP servers in catalog
- Created comprehensive playbooks and runbooks
- Deprecated old v0.2 single-gateway documentation
- Supersedes old `https://mcp.tools.bestviable.com` endpoint

**2025-10-17**: v0.2 - Original single-gateway approach (now deprecated)
- Single MCP Gateway endpoint
- Cloudflare Access authentication
- Limited to Coda integration only

---

## Deprecation Notice

**Old Endpoint**: `https://mcp.tools.bestviable.com` (v0.2, deprecated 2025-10-29)

**Replacement**: Per-service endpoints at `https://{mcp-name}.bestviable.com/sse`

**Migration**: See [MCP Architecture Playbook](../../../agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md) Phase 3 for client configuration updates.

---

**Maintenance**: Update this README when:
- New MCP servers are deployed
- Architecture patterns change
- New client types are supported
- Documentation structure evolves

**Last Updated**: 2025-10-29
