---
- entity: catalog
- level: internal
- zone: internal
- version: v01
- tags: [mcp, servers, inventory, catalog]
- source_path: /docs/architecture/integrations/mcp/server_catalog_v01.md
- date: 2025-10-29
- last_updated: 2025-10-29
---

# MCP Server Catalog

**Purpose**: Living inventory of all Model Context Protocol servers with tier assignments, status, endpoints, and documentation links.

**Update Policy**: This document should be updated whenever:
- A new MCP server is deployed
- An existing MCP changes tier assignment
- An MCP is deprecated or retired
- Endpoint URLs or configuration change

**Last Updated**: 2025-10-30

---

## Tier 1: Remote Transport Servers (Droplet-Hosted)

Remote MCPs accessible to all AI clients via SSE over HTTPS. Hosted on DigitalOcean droplet (tools.bestviable.com) using SyncBricks pattern.

| Name | Endpoint | Status | Tools | Source | Docs | Updated |
|------|----------|--------|-------|--------|------|---------|
| **coda** | `https://coda.bestviable.com/sse` | ✅ Production | 34 tools | dustingood/coda-mcp fork | [Docs](../../../../integrations/mcp/servers/coda/) | 2025-10-30 |
| **digitalocean** | `https://digitalocean.bestviable.com/sse` | 🧪 Built — awaiting token | 50+ tools (Droplets, Apps, DBaaS, Networking) | digitalocean-labs/mcp-digitalocean | [Docs](../../../../integrations/mcp/servers/digitalocean/) | 2025-10-29 |
| **cloudflare** | `https://cloudflare.bestviable.com/sse` | 🧪 Built — configure remote | Proxy to selected Cloudflare MCP | cloudflare/mcp-server-cloudflare | [Docs](../../../../integrations/mcp/servers/cloudflare/) | 2025-10-29 |
| **github** | `https://github.bestviable.com/sse` | 🚧 Planned | ~15 tools | @modelcontextprotocol/server-github | [Docs](../../../../integrations/mcp/servers/github/) | - |
| **memory** | `https://memory.bestviable.com/sse` | 🚧 Planned | 5 tools | @modelcontextprotocol/server-memory | [Docs](../../../../integrations/mcp/servers/memory/) | - |
| **firecrawl** | `https://firecrawl.bestviable.com/sse` | 🚧 Planned | 6 tools | firecrawl-mcp | [Docs](../../../../integrations/mcp/servers/firecrawl/) | - |
| **puppeteer** | `https://puppeteer.bestviable.com/sse` | 🔮 Future | 10 tools | @modelcontextprotocol/server-puppeteer | [Docs](../../../../integrations/mcp/servers/puppeteer/) | - |

### Coda MCP Gateway

**Status**: ✅ Production (deployed 2025-10-30)
**Endpoint**: https://coda.bestviable.com/sse
**Transport**: SSE over HTTPS
**Container**: `coda-mcp-gateway` (port 8080)

**Tools Provided** (34 total):
- Documents (5): list, get, create, update, stats
- Pages (10): list, get, create, delete, rename, duplicate, replace, append, peek, search
- Tables (4): list, get, summary, search
- Columns (2): list, get
- Rows (7): list, get, create, update, delete, bulk operations
- Formulas (2): list, get
- Controls (3): list, get, push_button
- Users (1): whoami

**Authentication**: Bearer token via `CODA_API_TOKEN` environment variable

**Source**: dustingood/coda-mcp fork (4x more tools than original)
- Original: https://github.com/orellazri/coda-mcp
- Upstream: https://github.com/dustingood/coda-mcp
- Local source: `/integrations/mcp/servers/coda/src/`
- Deployment: Docker container built from local source
- Documentation: README.md, DEPLOYMENT.md, CHANGELOG.md

**Configuration**:
```yaml
environment:
  CODA_API_TOKEN: ${CODA_API_TOKEN}
  VIRTUAL_HOST: coda.${DOMAIN}
  VIRTUAL_PORT: 8080
  LETSENCRYPT_HOST: coda.${DOMAIN}
command: ["mcp-proxy", "--host", "0.0.0.0", "--port", "8080", "--", "node", "dist/index.js"]
```

**Health Check**: Process check for `node.*coda` (every 30s)

**Related Documentation**:
- Upgrade playbook: `/agents/context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md`
- ADR: `/agents/decisions/2025-10-26_mcp-deployment-policy_v01.md`
- Droplet state: `/docs/infrastructure/droplet_state_2025-10-28.md`

**Recent Changes**:
- 2025-10-30: Upgraded from 8 to 34 tools (dustingood fork)
- 2025-10-30: Deployed to droplet with full documentation (README, DEPLOYMENT, CHANGELOG)
- 2025-10-30: Verified endpoint operational (HTTP 200 OK)
- 2025-10-28: Migrated from `reaperberri/coda-mcp:latest` base image to local source build
- 2025-10-28: Fixed binding to `0.0.0.0` for nginx-proxy reachability
- 2025-10-28: Added proxy trust config (`TRUST_DOWNSTREAM_PROXY=true`)

---

### DigitalOcean MCP Gateway

**Status**: 🧪 Built — awaiting API token  
**Endpoint**: https://digitalocean.bestviable.com/sse  
**Transport**: SSE (mcp-proxy wrapping stdio server)  
**Container**: `digitalocean-mcp-gateway` (port 8082)

**Tools Provided** (subset):
- Droplets: list/create/delete, snapshots, sizes, images
- Networking: domains, DNS records, certificates, load balancers, VPCs
- App Platform: deployments, logs, components
- Databases: cluster management, users, firewall rules
- Spaces, Marketplace, Insights (uptime), Kubernetes (DOKS), Accounts

**Authentication**: `DIGITALOCEAN_API_TOKEN` (PAT with read/write scopes)  
Optional filters via `DIGITALOCEAN_SERVICES` env var.

**Deployment Docs**: `/integrations/mcp/servers/digitalocean/`  
**Next Step**: Populate PAT in droplet `.env` and `docker compose up -d digitalocean-mcp-gateway`.

---

### Cloudflare MCP Gateway Wrapper

**Status**: 🧪 Built — configure remote URL  
**Endpoint**: https://cloudflare.bestviable.com/sse  
**Transport**: SSE proxy via `mcp-remote`  
**Container**: `cloudflare-mcp-gateway` (port 8083)

**Function**: Wraps any Cloudflare-hosted MCP server (docs, observability, Workers bindings, Logpush, etc.) by setting `CLOUDFLARE_REMOTE_URL`.

**Authentication**: Add `CLOUDFLARE_API_TOKEN` if the remote requires it (e.g., DNS analytics). Additional headers supported via `CLOUDFLARE_HEADERS`.

**Deployment Docs**: `/integrations/mcp/servers/cloudflare/`  
**Next Step**: Choose target remote (e.g., `https://docs.mcp.cloudflare.com/mcp`), update `.env`, run `docker compose up -d cloudflare-mcp-gateway`.

---

## Tier 2: User-Scope Local Servers

Local MCPs running via stdio transport, configured per-client. These are lightweight utilities or stable official releases.

| Name | Install Command | Transport | Tools | Clients | Status |
|------|-----------------|-----------|-------|---------|--------|
| **calculator** | `uvx mcp-server-calculator` | stdio | 1 | Claude Desktop, Claude Code | ✅ Active |
| **time** | `uvx mcp-server-time` | stdio | 2 | Claude Desktop, Claude Code | ✅ Active |
| **fetch** | `uvx mcp-server-fetch` | stdio | 1 | Claude Desktop | ✅ Active |
| **sequential-thinking** | `npx -y @modelcontextprotocol/server-sequential-thinking` | stdio | 1 | Claude Desktop | ✅ Active |
| **brave-search** | `npx -y @modelcontextprotocol/server-brave-search` | stdio | 1 | Claude Desktop | ✅ Active |
| **youtube-transcript** | `npx -y @sinco-lab/mcp-youtube-transcript` | stdio | 1 | Claude Desktop | ✅ Active |
| **context7** | `npx -y @upstash/context7-mcp` | stdio | 2 | Claude Desktop | ✅ Active |

### Calculator

**Status**: ✅ Active
**Install**: `uvx mcp-server-calculator`
**Transport**: stdio (Python)
**Source**: Official MCP server (Python)

**Tools Provided** (1 total):
1. `calculate` - Evaluate mathematical expressions

**Authentication**: None required

**Configuration** (Claude Desktop):
```json
{
  "calculator": {
    "command": "uvx",
    "args": ["mcp-server-calculator"]
  }
}
```

**Use Cases**: Quick math calculations, unit conversions, expression evaluation

**Why Tier 2**: Lightweight utility, no external dependencies, stable official release

---

### Time

**Status**: ✅ Active
**Install**: `uvx mcp-server-time`
**Transport**: stdio (Python)
**Source**: Official MCP server (Python)

**Tools Provided** (2 total):
1. `get_current_time` - Get current time in specific timezone
2. `convert_time` - Convert time between timezones

**Authentication**: None required

**Configuration** (Claude Desktop):
```json
{
  "time": {
    "command": "uvx",
    "args": ["mcp-server-time"]
  }
}
```

**Use Cases**: Timezone conversions, scheduling across regions, time-aware operations

**Why Tier 2**: Lightweight utility, no external dependencies, stable official release

---

### Brave Search

**Status**: ✅ Active
**Install**: `npx -y @modelcontextprotocol/server-brave-search`
**Transport**: stdio (Node.js)
**Source**: Official MCP server (Node.js)

**Tools Provided** (1 total):
1. `brave_search` - Web search via Brave Search API

**Authentication**: Brave API Key (`BRAVE_API_KEY` environment variable)

**Configuration** (Claude Desktop):
```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "BSAlOxjIpwBs4FfWn95CWwwKlnDZTZB"
    }
  }
}
```

**Use Cases**: Web search, research, finding current information

**Why Tier 2**: Stable official release, used across many projects, API key not overly sensitive

**Note**: Consider migrating to Tier 1 if API rate limits become issue

---

### Context7

**Status**: ✅ Active
**Install**: `npx -y @upstash/context7-mcp`
**Transport**: stdio (Node.js)
**Source**: Upstash Context7 MCP

**Tools Provided** (2 total):
1. `resolve-library-id` - Resolve library name to Context7 ID
2. `get-library-docs` - Fetch up-to-date library documentation

**Authentication**: Context7 API Key (`CONTEXT7_API_KEY` environment variable)

**Configuration** (Claude Desktop):
```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"],
    "env": {
      "CONTEXT7_API_KEY": "ctx7sk-c0eb278f-ef20-4cd7-9426-6817a93dcf15"
    }
  }
}
```

**Use Cases**: Fetching latest library documentation, API reference lookups

**Why Tier 2**: Used across multiple projects (not portfolio-specific)

**Note**: Could be Tier 3 if scoped to specific project documentation needs

---

## Tier 3: Project-Scope Local Servers

Project-specific MCPs with workspace-bounded access. Configuration committed to repository (secrets gitignored).

| Name | Config Path | Scope | Tools | Status |
|------|-------------|-------|-------|--------|
| **filesystem** | `.mcp/config.json` | `/workspace/portfolio` | 6 | 🚧 Planned |

### Filesystem (Portfolio-Scoped)

**Status**: 🚧 Planned (Phase 4)
**Install**: `npx -y @modelcontextprotocol/server-filesystem`
**Transport**: stdio (Node.js)
**Source**: Official MCP server
**Scope**: `/Users/davidkellam/workspace/portfolio` only

**Tools Provided** (6 total):
1. `read_file` - Read file contents
2. `write_file` - Write to file
3. `list_directory` - List directory contents
4. `create_directory` - Create directory
5. `move_file` - Move/rename file
6. `search_files` - Search for files by pattern

**Authentication**: None (file system access)

**Configuration** (`.mcp/config.json`):
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/davidkellam/workspace/portfolio"],
      "env": {}
    }
  }
}
```

**Use Cases**: Repository operations, file management, workspace-specific tasks

**Why Tier 3**: Security boundary - limit filesystem access to specific workspace

**Security Note**: Other projects should have their own `.mcp/config.json` with different scope paths

---

## Deprecated / Retired Servers

| Name | Reason | Deprecated Date | Replacement |
|------|--------|-----------------|-------------|
| **coda-enhanced** (Docker) | Duplicate of remote Coda gateway | 2025-10-29 | coda (Tier 1) |
| **coda** (basic npm) | Duplicate of remote Coda gateway | 2025-10-29 | coda (Tier 1) |

### Coda Enhanced (Docker)

**Former Configuration** (Claude Desktop):
```json
{
  "coda-enhanced": {
    "command": "docker",
    "args": ["run", "-i", "--rm", "-e", "API_KEY", "dustingood/coda-mcp:latest"],
    "env": {
      "API_KEY": "14460eab-8367-40a5-b430-33c40671f6f4"
    }
  }
}
```

**Deprecated**: 2025-10-29
**Reason**: Replaced by Tier 1 remote gateway at `https://coda.bestviable.com/sse`
**Action Required**: Remove from Claude Desktop config, use remote transport instead

---

## Planning: Future MCP Servers

These are candidates for future deployment based on operational needs:

| Name | Proposed Tier | Priority | Use Case |
|------|---------------|----------|----------|
| **n8n** | Tier 1 | Medium | Trigger workflows, query execution logs |
| **postgres** | Tier 1 | Low | Database queries, schema inspection |
| **qdrant** | Tier 1 | Low | Vector search, semantic queries |
| **custom-sot** | Tier 1 or 3 | Low | Authority map queries, sync triggers |
| **slack** | Tier 2 | Low | Send messages, read channels |
| **gmail** | Tier 2 | Low | Email operations |

---

## Configuration Templates

**User-Scope Templates**: `/Users/davidkellam/workspace/mcp-configs/user-scope/`
- `claude-desktop.json` - Template for Claude Desktop config
- `claude-code.json` - Template for Claude Code config
- `cursor.json`, `zed.json`, etc. - IDE templates (TBD)

**Project-Scope Templates**: Each project has `.mcp/config.json`
- Portfolio: `/Users/davidkellam/workspace/portfolio/.mcp/config.json`
- Other projects: Create as needed

**Remote Transport Client Config** (example for Claude Code):
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

---

## Health & Monitoring

**Tier 1 Health Checks**:
- n8n workflow: "MCP Health Monitor" (planned Phase 4)
- Checks all Tier 1 endpoints every 5 minutes
- Alerts on failures (email/Slack)

**Manual Health Verification**:
```bash
# Test Tier 1 endpoints
curl -I https://coda.bestviable.com/sse
curl -I https://github.bestviable.com/sse
curl -I https://memory.bestviable.com/sse

# Check droplet services
ssh root@tools
docker compose -f docker-compose.production.yml ps | grep mcp-gateway

# View logs
docker logs coda-mcp-gateway --tail 50
```

---

## Related Documentation

**Governance**:
- ADR: Three-Tier Architecture - `/agents/decisions/2025-10-29_mcp-tier-architecture_v01.md`
- ADR: Deployment Policy - `/agents/decisions/2025-10-26_mcp-deployment-policy_v01.md`

**Implementation**:
- Main Playbook: `/agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md`
- Coda Upgrade: `/agents/context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md`
- Onboarding Template: `/agents/context/playbooks/mcp_server_onboarding_template_v01.md`

**Technical**:
- MCP Integration Hub: `/docs/architecture/integrations/mcp/README.md`
- Client Setup Guides: `/integrations/mcp/clients/`

**Operational**:
- Troubleshooting: `/docs/ops/runbooks/mcp_troubleshooting_v01.md`
- Infrastructure: `/docs/infrastructure/droplet_state_2025-10-28.md`

---

**Maintenance**: This catalog should be updated whenever MCPs are added, removed, or modified. Include `last_updated` date in metadata header.
