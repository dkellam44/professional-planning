---
- entity: integration
- level: internal
- zone: internal
- version: v01
- tags: [mcp, integrations, code, infrastructure]
- source_path: /integrations/mcp/README.md
- date: 2025-10-29
---

# MCP Integration Code

**Purpose**: Source code, Docker configurations, and deployment scripts for Model Context Protocol (MCP) infrastructure.

---

## Overview

This directory contains the implementation code for all MCP servers across three deployment tiers:
- **Tier 1**: Remote transport servers (droplet-hosted, accessible to all AI clients)
- **Tier 2**: User-scope local servers (per-client stdio configuration)
- **Tier 3**: Project-scope local servers (workspace-bounded)

**Architecture**: See `/agents/decisions/2025-10-29_mcp-tier-architecture_v01.md` for tier decision criteria.

---

## Directory Structure

```
/integrations/mcp/
├── README.md                    # This file
├── gateway/                     # MCP Gateway multiplexer (future)
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── config/
│       └── gateway.yaml
├── servers/                     # Individual MCP server implementations
│   ├── coda/                    # Tier 1: Coda MCP gateway
│   │   ├── src/                 # Forked source code
│   │   ├── README.md
│   │   ├── DEPLOYMENT.md
│   │   ├── CHANGELOG.md
│   │   └── TROUBLESHOOTING.md
│   ├── github/                  # Tier 1: GitHub MCP gateway (planned)
│   ├── memory/                  # Tier 1: Memory MCP gateway (planned)
│   ├── firecrawl/               # Tier 1: Firecrawl MCP gateway (planned)
│   ├── puppeteer/               # Tier 1: Puppeteer MCP (future)
│   └── custom/                  # Custom MCP servers
└── clients/                     # Client configuration templates and guides
    ├── claude-code/
    │   └── README.md            # Setup guide for Claude Code
    ├── claude-desktop/
    │   └── README.md            # Setup guide for Claude Desktop
    ├── cursor/
    │   └── README.md            # Setup guide for Cursor IDE
    ├── zed/
    │   └── README.md            # Setup guide for Zed
    └── chatgpt/
        └── README.md            # Setup guide for ChatGPT web UI
```

---

## Quick Links

**Governance** (evergreen policy):
- [Three-Tier Architecture ADR](/agents/decisions/2025-10-29_mcp-tier-architecture_v01.md)
- [MCP Deployment Policy](/agents/decisions/2025-10-26_mcp-deployment-policy_v01.md)

**Implementation** (mutable playbooks):
- [MCP Architecture Implementation Playbook](/agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md)
- [MCP Server Onboarding Template](/agents/context/playbooks/mcp_server_onboarding_template_v01.md)
- [Coda MCP Upgrade Plan](/agents/context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md)

**Technical Documentation**:
- [MCP Server Catalog](/docs/architecture/integrations/mcp/server_catalog_v01.md) - Living inventory of all MCPs
- [MCP Integration Hub](/docs/architecture/integrations/mcp/README.md) - Technical architecture docs

**Operations**:
- [MCP Troubleshooting Runbook](/docs/runbooks/mcp_troubleshooting_v01.md)
- [Infrastructure State](/docs/infrastructure/droplet_state_2025-10-28.md)

---

## Current Deployment Status

### Tier 1: Remote Transport (Droplet)

| Server | Status | Endpoint | Source |
|--------|--------|----------|--------|
| **coda** | ✅ Production | https://coda.bestviable.com/sse | `/integrations/mcp/servers/coda/` |
| **github** | 🚧 Planned | https://github.bestviable.com/sse | - |
| **memory** | 🚧 Planned | https://memory.bestviable.com/sse | - |
| **firecrawl** | 🚧 Planned | https://firecrawl.bestviable.com/sse | - |

### Tier 2: User-Scope Local

14 servers configured via stdio transport in Claude Desktop. See [MCP Server Catalog](/docs/architecture/integrations/mcp/server_catalog_v01.md) for complete list.

**Configuration Templates**: `/Users/davidkellam/workspace/mcp-configs/user-scope/`

### Tier 3: Project-Scope

**Portfolio workspace**: `/Users/davidkellam/workspace/portfolio/.mcp/config.json` (planned)

---

## For Developers: Adding a New MCP Server

**Quick Steps:**

1. **Choose tier** using criteria from [Three-Tier Architecture ADR](/agents/decisions/2025-10-29_mcp-tier-architecture_v01.md)

2. **Use onboarding template**: Copy [MCP Server Onboarding Template](/agents/context/playbooks/mcp_server_onboarding_template_v01.md) and follow checklist

3. **Create server directory**:
   ```bash
   mkdir -p /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/{mcp-name}
   ```

4. **Add source** (Tier 1 only):
   - Fork upstream repo to personal GitHub
   - Clone to `servers/{mcp-name}/src/`
   - Document provenance in `servers/{mcp-name}/README.md`

5. **Create Dockerfile** (Tier 1 only):
   - Save to `/infra/docker/services/{mcp-name}-mcp.Dockerfile`
   - Follow mcp-proxy wrapper pattern (see existing examples)
   - Test local build before deploying

6. **Update configuration**:
   - **Tier 1**: Add service to `/infra/docker/docker-compose.production.yml`
   - **Tier 2**: Add template to `/workspace/mcp-configs/user-scope/`
   - **Tier 3**: Add to project `.mcp/config.json`

7. **Document**:
   - Create `servers/{mcp-name}/{README,DEPLOYMENT,CHANGELOG,TROUBLESHOOTING}.md`
   - Update [MCP Server Catalog](/docs/architecture/integrations/mcp/server_catalog_v01.md)
   - Add client setup guides (if Tier 1)

8. **Deploy and test** following onboarding template

---

## Common Tasks

### Building a Tier 1 MCP Gateway

```bash
# Navigate to portfolio root
cd /Users/davidkellam/workspace/portfolio

# Build Docker image
docker build -t {mcp-name}-mcp-gateway:local -f infra/docker/services/{mcp-name}-mcp.Dockerfile .

# Test locally
docker run --rm -p 8080:8080 -e API_KEY="test-key" {mcp-name}-mcp-gateway:local

# In another terminal, test endpoint
curl -I http://localhost:8080/sse
# Expected: 200 OK

# Deploy to droplet (see deployment playbooks for full procedure)
```

### Testing an MCP Server Locally

```bash
# For npm packages
npx -y @modelcontextprotocol/server-{mcp-name}

# For Python packages
uvx mcp-server-{mcp-name}

# For Docker-based
docker run -i --rm -e API_KEY="test-key" dustingood/coda-mcp:latest
```

### Updating an Existing Tier 1 MCP

```bash
# Update source code in servers/{mcp-name}/src/
cd integrations/mcp/servers/{mcp-name}/src
git pull origin main  # or make local changes

# Rebuild Docker image
cd /Users/davidkellam/workspace/portfolio
docker build -t {mcp-name}-mcp-gateway:local -f docs/ops/Dockerfile.{mcp-name}-mcp-gateway .

# Test locally
docker run --rm -p 808X:808X -e API_KEY="test-key" {mcp-name}-mcp-gateway:local

# Deploy to droplet
scp docs/ops/Dockerfile.{mcp-name}-mcp-gateway root@tools:~/
ssh root@tools "docker compose -f docker-compose.production.yml build {mcp-name}-mcp-gateway"
ssh root@tools "docker compose -f docker-compose.production.yml up -d {mcp-name}-mcp-gateway"

# Verify
curl -I https://{mcp-name}.bestviable.com/sse

# Update CHANGELOG.md
```

---

## Configuration Management

### Environment Variables (Tier 1)

**Secrets stored in droplet `.env`** (not committed to git):
```bash
# On droplet: /root/.env
CODA_API_TOKEN="14460eab-8367-40a5-b430-33c40671f6f4"
GITHUB_PERSONAL_ACCESS_TOKEN="github_pat_..."
FIRECRAWL_API_KEY="fc-..."
```

**Loaded by docker-compose**:
```yaml
environment:
  API_KEY: ${API_KEY_VAR}
```

### Configuration Templates (Tier 2)

**Location**: `/Users/davidkellam/workspace/mcp-configs/user-scope/`

**Files**:
- `claude-desktop.json` - Template for Claude Desktop
- `claude-code.json` - Template for Claude Code
- `.env.example` - Placeholder for secrets
- `README.md` - Usage instructions

**Usage**:
```bash
# Copy template to client config location
cp ~/workspace/mcp-configs/user-scope/claude-desktop.json \
   ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Replace ${API_KEY} placeholders with real values
# Restart client
```

### Project Configuration (Tier 3)

**Location**: `{project-root}/.mcp/`

**Files**:
- `config.json` - MCP server definitions (committed)
- `.env` - Secrets (gitignored)
- `.env.example` - Placeholders (committed)
- `README.md` - Setup instructions

**Ensure `.mcp/.env` is in `.gitignore`!**

---

## Security Guidelines

**DO**:
- ✅ Store production API keys in droplet `.env` only
- ✅ Use placeholder `${VAR_NAME}` in committed configs
- ✅ Commit `.env.example` with documentation
- ✅ Use least-privilege scopes for API tokens
- ✅ Rotate tokens quarterly or when exposed
- ✅ Scope Tier 3 filesystem access to specific directories

**DON'T**:
- ❌ Commit API keys or tokens to git
- ❌ Store production secrets in user-scope configs
- ❌ Use overly permissive API scopes
- ❌ Share API tokens across multiple services
- ❌ Allow Tier 3 filesystem MCPs to access parent directories

---

## Troubleshooting

**Quick diagnostics**:

```bash
# Test Tier 1 endpoints
curl -I https://coda.bestviable.com/sse
curl -I https://github.bestviable.com/sse

# Check droplet services
ssh root@tools
docker compose -f docker-compose.production.yml ps | grep mcp-gateway

# View logs
docker logs coda-mcp-gateway --tail 50

# Test local MCP
npx -y @modelcontextprotocol/server-calculator
```

**Full troubleshooting guide**: [MCP Troubleshooting Runbook](/docs/runbooks/mcp_troubleshooting_v01.md)

---

## Related Infrastructure

**Droplet**: DigitalOcean (tools.bestviable.com, 159.65.97.146)
**Pattern**: SyncBricks (nginx-proxy + acme-companion + Cloudflare Tunnel)
**DNS**: `*.bestviable.com` → Cloudflare Tunnel → nginx-proxy → MCP containers

**Infrastructure Docs**:
- [Droplet State Snapshot](/docs/infrastructure/droplet_state_2025-10-28.md)
- [SyncBricks Pattern](/docs/infrastructure/syncbricks_solution_breakdown_v1.md)
- [Cloudflare Tunnel Guide](/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md)

---

## Future Work

- [ ] Unified MCP Gateway (single container multiplexing multiple servers)
- [ ] CI/CD pipeline for automatic droplet deployment on git push
- [ ] MCP discovery service (automatic client configuration)
- [ ] Metrics/observability (request counts, latency, errors)
- [ ] Caching layer for expensive API calls
- [ ] MCP server for n8n (trigger workflows, query logs)
- [ ] Custom MCP for SoT operations

---

**Maintenance**: This README should be updated when:
- New MCP servers are added to `/servers/`
- Directory structure changes
- New client types are supported
- Deployment procedures change

**Last Updated**: 2025-10-29
