---
- entity: plan
- level: internal
- zone: internal
- version: v01
- tags: [mcp, architecture, infrastructure, integration, deployment]
- source_path: /agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md
- date: 2025-10-29
---

# Project Plan — MCP Architecture & Management Implementation

**Objective.** Consolidate scattered MCP servers into a three-tier architecture (remote transport, user-scope local, project-scope local) with clear documentation standards, making all MCP tools accessible to all AI clients (CLI agents, web chats, desktop apps, IDEs).

---

## 0. References & Context

**Related ADRs:**
- `/agents/decisions/2025-10-26_mcp-deployment-policy_v01.md` - Original hybrid deployment policy
- `/agents/decisions/2025-10-29_mcp-tier-architecture_v01.md` - Three-tier architecture decision (NEW)

**Infrastructure:**
- Droplet state: `/docs/infrastructure/droplet_state_2025-10-28.md`
- Docker compose: `/infra/docker/docker-compose.production.yml`
- SyncBricks pattern: `/docs/infrastructure/syncbricks_solution_breakdown_v1.md`
- Cloudflare Tunnel: `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md`

**Existing MCP Documentation:**
- Coda upgrade playbook: `/agents/context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md`
- Codex CLI setup: `/agents/context/mcp_setup_codex_cli_v01.md`
- Technical docs: `/docs/architecture/integrations/mcp/` (to be updated)

**Current MCP Configuration:**
- Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json` (14 servers)
- Claude Code: Not yet configured
- Other clients: Not yet configured

---

## 1. Roles & Checkpoints

| Step | Default owner | Human-in-loop checkpoints |
|------|---------------|---------------------------|
| Phase 1 (Foundation) | Agent | Review directory structure + main docs |
| Phase 2 (Coda Upgrade) | Agent | Inspect Dockerfile changes before deploy |
| Phase 3 (Remote Migration) | Agent | Approve each new service in docker-compose |
| Phase 4 (Client Config) | Human + Agent | Test each client connection |

---

## 2. Current State Analysis

### Deployed MCPs (by transport type)

**Local stdio servers** (Claude Desktop only):
- brave-search, calculator, coda (basic), coda-enhanced (Docker), context7, fetch, filesystem, firecrawl, github, memory, puppeteer, sequential-thinking, time, youtube-transcript

**Remote transport servers** (accessible to all clients):
- coda-mcp-gateway: `https://coda.bestviable.com/sse` (deployed on droplet)

**Key Problems:**
1. **Fragmentation**: 14 MCPs configured only for Claude Desktop, unavailable to CLI agents (Claude Code, Codex, Gemini)
2. **No project-level MCPs**: All configured at user scope
3. **Duplicate Coda servers**: Basic npm + Docker enhanced + remote gateway (3 different configs)
4. **Limited visibility**: No central registry showing which MCPs are available to which clients
5. **Scattered documentation**: MCP docs in multiple locations, some marked "deprecated"

---

## 3. Proposed Architecture: Three-Tier MCP Deployment

### Tier 1: Remote Transport Servers (RECOMMENDED DEFAULT)
**Location**: DigitalOcean droplet (tools.bestviable.com)
**Pattern**: SyncBricks (nginx-proxy + acme-companion + Cloudflare Tunnel)
**Access**: All AI clients (CLI agents, web chats, desktop apps, IDEs)
**Subdomain pattern**: `{mcp-name}.bestviable.com/sse`

**When to use:**
- Custom/forked MCP servers you control
- MCPs requiring centralized configuration (API keys, database access)
- Critical infrastructure MCPs (Coda, GitHub, n8n automation)
- MCPs with frequent updates/customization needs
- Expensive API-backed services (centralized rate limiting)

**Current deployed:**
- `coda.bestviable.com/sse` ✅

**Candidates for migration:**
- github (consolidate access patterns, sensitive token)
- memory (shared knowledge graph across sessions)
- firecrawl (expensive API key, better centralized)
- puppeteer (browser automation, resource-intensive)

### Tier 2: User-Scope Local stdio (LIGHTWEIGHT UTILITIES)
**Location**: `~/.config/{client-name}/mcp.json` or `~/Library/Application Support/Claude/`
**Pattern**: npx/uvx ephemeral execution
**Access**: Single client (e.g., Claude Desktop)
**Replication**: Manual copy to each AI client config

**When to use:**
- Stable official MCPs rarely needing updates
- Lightweight compute (calculator, time)
- Client-specific filesystem access
- MCPs without API key requirements

**Keep here:**
- calculator (math utilities)
- time (timezone conversions)
- fetch (simple web requests)
- sequential-thinking (reasoning framework)
- brave-search (if used across projects)
- youtube-transcript (stable official)

**Configuration management:**
- Create `/Users/davidkellam/workspace/mcp-configs/user-scope/` with JSON templates
- Document per-client setup (Claude Desktop, future IDEs)

### Tier 3: Project-Scope Local stdio (WORKSPACE-SPECIFIC)
**Location**: `/Users/davidkellam/workspace/portfolio/.mcp/config.json`
**Pattern**: Project-relative paths, workspace-specific tools
**Access**: AI agents working in this repository
**Version control**: Committed to repo (minus secrets)

**When to use:**
- Project-specific tooling (repo analysis, custom builders)
- Workspace-bounded filesystem access
- Development/testing of new MCP servers before promoting to Tier 1

**Examples for portfolio project:**
- filesystem server scoped to `/Users/davidkellam/workspace/portfolio` only
- context7 with project-specific library docs
- Custom MCP for SoT operations (if built)

**Setup:**
```bash
mkdir -p /Users/davidkellam/workspace/portfolio/.mcp
# Config file: .mcp/config.json (template TBD)
# Add .mcp/.env to .gitignore for secrets
```

---

## 4. MCP Scope Decision Matrix

| MCP Server | Current | Proposed Tier | Rationale |
|------------|---------|---------------|-----------|
| **coda** | Desktop stdio | **Tier 1 (remote)** | Custom fork, needs all-client access |
| **github** | Desktop stdio | **Tier 1 (remote)** | Sensitive token, centralized management |
| **memory** | Desktop stdio | **Tier 1 (remote)** | Shared knowledge graph across sessions |
| **firecrawl** | Desktop stdio | **Tier 1 (remote)** | Expensive API, rate-limited |
| **puppeteer** | Desktop stdio | **Tier 1 (remote)** | Resource-intensive, better on droplet |
| **brave-search** | Desktop stdio | **Tier 2 (user)** | Stable official, used across projects |
| **context7** | Desktop stdio | **Tier 2 (user)** OR **Tier 3 (project)** | General use (Tier 2) or portfolio-specific (Tier 3) |
| **calculator** | Desktop stdio | **Tier 2 (user)** | Lightweight utility |
| **time** | Desktop stdio | **Tier 2 (user)** | Lightweight utility |
| **fetch** | Desktop stdio | **Tier 2 (user)** | Simple, no auth |
| **sequential-thinking** | Desktop stdio | **Tier 2 (user)** | Reasoning tool, per-client |
| **youtube-transcript** | Desktop stdio | **Tier 2 (user)** | Stable official |
| **filesystem** | Desktop stdio | **Tier 3 (project)** | Scope to `/workspace/portfolio` |
| **coda-enhanced** | Desktop Docker | **DEPRECATE** | Replace with Tier 1 gateway |

---

## 5. Remote MCP Gateway Architecture

### Multi-Service Gateway Design

**Current**: Single `coda-mcp-gateway` container
**Proposed**: Shared gateway framework for multiple MCP servers

```
┌─────────────────────────────────────────────────┐
│ Cloudflare Tunnel (*.bestviable.com)            │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│ nginx-proxy (auto-discovery reverse proxy)      │
└─────┬──────┬──────┬──────┬──────┬──────────────┘
      │      │      │      │      │
      ▼      ▼      ▼      ▼      ▼
   coda.  github. memory. firecrawl. puppeteer.
    :8080  :8081  :8082   :8083      :8084
      │      │      │      │      │
      ▼      ▼      ▼      ▼      ▼
   [mcp-proxy wrapper for each stdio MCP server]
```

**Implementation:**
- Each MCP gets dedicated container + port + subdomain
- Shared docker-compose.production.yml service definitions
- Standardized mcp-proxy wrapper pattern
- Common environment variable conventions

**Docker Compose Service Template:**
```yaml
  {mcp-name}-mcp-gateway:
    build:
      context: ./integrations/mcp/servers/{mcp-name}
      dockerfile: Dockerfile
    container_name: {mcp-name}-mcp-gateway
    restart: always
    environment:
      # Service-specific env vars
      {MCP}_API_KEY: ${<MCP>_API_KEY}

      # Reverse proxy discovery
      VIRTUAL_HOST: {mcp-name}.${DOMAIN}
      VIRTUAL_PORT: 808X
      LETSENCRYPT_HOST: {mcp-name}.${DOMAIN}
      LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL}

      # Proxy trust
      HTTPS_METHOD: noredirect
      TRUST_DOWNSTREAM_PROXY: "true"

    command: ["mcp-proxy", "--host", "0.0.0.0", "--port", "808X", "--", "node", "dist/index.js"]

    ports:
      - "127.0.0.1:808X:808X"

    networks:
      - proxy
      - syncbricks

    depends_on:
      n8n:
        condition: service_healthy

    healthcheck:
      test: ["CMD", "pgrep", "-f", "node.*{mcp-name}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
```

---

## 6. Documentation Standards

### Per-MCP Documentation Requirements

**Location**: `/integrations/mcp/servers/{mcp-name}/`

**Required files:**
1. **README.md** - Overview, capabilities, usage examples
2. **DEPLOYMENT.md** - Tier assignment, config snippets, endpoint URLs
3. **CHANGELOG.md** - Version history, breaking changes
4. **TROUBLESHOOTING.md** - Common errors, health checks, logs

**Metadata header** (all docs):
```yaml
---
- entity: mcp-server
- name: {mcp-name}
- tier: [1-remote|2-user|3-project]
- version: vX.Y.Z
- transport: [stdio|sse]
- status: [deployed|testing|deprecated]
- endpoint: https://{mcp-name}.bestviable.com/sse (if Tier 1)
- source_repo: {upstream-github-url}
- last_updated: YYYY-MM-DD
---
```

### Droplet Service Documentation

**Template for docker-compose.production.yml:**
```yaml
# ==============================================================================
# MCP: {service-name}
# Tier: 1 (Remote Transport)
# Endpoint: https://{service-name}.bestviable.com/sse
# Source: /integrations/mcp/servers/{service-name}/
# Tools: [list of tool names]
# Last Updated: YYYY-MM-DD
# ==============================================================================
```

**Inline comments required:**
- Purpose (1 sentence)
- Key environment variables (meaning + format)
- Network assignments (why proxy vs syncbricks)
- Health check logic
- Dependencies (why this service depends_on X)

### Central MCP Registry

**Location**: `/docs/architecture/integrations/mcp/server_catalog_v01.md`

**Format:**
```markdown
# MCP Server Catalog

Last updated: YYYY-MM-DD

## Tier 1: Remote Transport (Droplet)
| Name | Endpoint | Status | Tools | Docs | Updated |
|------|----------|--------|-------|------|---------|
| coda | https://coda.bestviable.com/sse | ✅ | 8 | [Docs](../../../integrations/mcp/servers/coda/) | 2025-10-28 |

## Tier 2: User-Scope Local
| Name | Install Command | Clients | Docs |
|------|-----------------|---------|------|
| calculator | uvx mcp-server-calculator | Claude Desktop, Claude Code | [Docs](../../../integrations/mcp/servers/calculator/) |

## Tier 3: Project-Scope
| Name | Config Path | Scope | Docs |
|------|-------------|-------|------|
| filesystem | .mcp/config.json | /workspace/portfolio | [Docs](../../../integrations/mcp/servers/filesystem/) |
```

---

## 7. Phase Breakdown

### Phase 1 — Foundation & Coda Upgrade (≈4 hours)

**Goal**: Establish structure + upgrade Coda MCP Gateway from local source

1. **Create directory structure** (5 min)
   ```bash
   mkdir -p /integrations/mcp/{gateway,servers,clients}
   mkdir -p /integrations/mcp/servers/{coda,github,memory,firecrawl,puppeteer,custom}
   mkdir -p /integrations/mcp/clients/{claude-code,claude-desktop,cursor,zed,chatgpt,codex-cli}
   mkdir -p /docs/architecture/integrations/mcp/tool_schemas
   ```

2. **Fork/clone Coda MCP source** (30 min)
   - Fork `https://github.com/dustinrgood/coda-mcp` to personal GitHub
   - Clone to `/integrations/mcp/servers/coda/src/`
   - Document provenance in `/integrations/mcp/servers/coda/README.md`

3. **Update Dockerfile** (30 min)
   - Modify `/infra/docker/services/coda-mcp-gateway` to build from `/integrations/mcp/servers/coda/src`
   - Replace `FROM reaperberri/coda-mcp:latest` with local COPY
   - Keep mcp-proxy wrapper pattern
   - Test local build: `docker build -t coda-mcp-gateway:local -f docs/ops/Dockerfile.coda-mcp-gateway .`

4. **Deploy to droplet** (30 min)
   - `scp` updated Dockerfile + compose to droplet
   - SSH to droplet: `docker compose -f docker-compose.production.yml build coda-mcp-gateway`
   - Restart: `docker compose -f docker-compose.production.yml up -d coda-mcp-gateway`
   - Verify: `curl -I https://coda.bestviable.com/sse` → `200`

5. **Create core documentation** (2 hours)
   - `/integrations/mcp/README.md` - Code repository overview
   - `/integrations/mcp/servers/coda/README.md` - Coda MCP overview
   - `/integrations/mcp/servers/coda/DEPLOYMENT.md` - Deployment guide
   - `/docs/architecture/integrations/mcp/server_catalog_v01.md` - Initial catalog (14 servers)
   - `/docs/architecture/integrations/mcp/README.md` - Update navigation hub
   - `/docs/runbooks/mcp_troubleshooting_v01.md` - Troubleshooting guide
   - `/agents/context/playbooks/mcp_server_onboarding_template_v01.md` - Generic template

6. **Update docker-compose with inline docs** (30 min)
   - Add MCP section header to `coda-mcp-gateway` service in `docker-compose.production.yml`
   - Document purpose, env vars, networks, health checks

7. **Log deployment** (5 min)
   - Append to `/logs/context_actions.csv`
   - Update `SESSION_HANDOFF_current.md` with Coda upgrade status

**Definition of Done:**
- ✅ Coda MCP Gateway deployed from local source at `/integrations/mcp/servers/coda/src`
- ✅ `https://coda.bestviable.com/sse` verified accessible
- ✅ All Phase 1 documentation created
- ✅ MCP_REGISTRY documents current 14 servers with tier assignments

### Phase 2 — Remote Migration (≈6 hours)

**Goal**: Move priority MCPs to Tier 1 (GitHub, Memory, Firecrawl)

**Per-MCP pattern** (repeat for each):

8. **GitHub MCP Gateway** (2 hours)
   - Create `/integrations/mcp/servers/github/` structure
   - Write Dockerfile wrapping `@modelcontextprotocol/server-github`
   ```dockerfile
   FROM node:20-alpine
   RUN apk add --no-cache python3 py3-pip
   RUN pip install --break-system-packages mcp-proxy
   RUN npm install -g @modelcontextprotocol/server-github
   CMD ["mcp-proxy", "--host", "0.0.0.0", "--port", "8081", "--", "npx", "@modelcontextprotocol/server-github"]
   ```
   - Add docker-compose service at `github.bestviable.com:8081`
   - Configure Cloudflare DNS: `github CNAME @` (tunnel handles routing)
   - Test: `curl -I https://github.bestviable.com/sse` → `200`
   - Document in `/integrations/mcp/servers/github/{README,DEPLOYMENT}.md`
   - Update MCP_REGISTRY

9. **Memory MCP Gateway** (2 hours)
   - Similar pattern for `@modelcontextprotocol/server-memory`
   - Add persistent volume for knowledge graph: `./data/mcp-memory:/data`
   - Endpoint: `memory.bestviable.com:8082`
   - Document shared knowledge graph usage

10. **Firecrawl MCP Gateway** (2 hours)
    - Wrap `firecrawl-mcp` npm package
    - Centralize `FIRECRAWL_API_KEY` in droplet `.env`
    - Endpoint: `firecrawl.bestviable.com:8083`

**Definition of Done:**
- ✅ 3+ MCPs deployed to Tier 1 (Coda, GitHub, Memory, Firecrawl)
- ✅ All have `https://{name}.bestviable.com/sse` endpoints verified
- ✅ Each has complete documentation in `/integrations/mcp/servers/{name}/`
- ✅ MCP_REGISTRY updated with all new servers

### Phase 3 — Client Configuration (≈4 hours)

**Goal**: Make remote MCPs accessible to all clients

11. **Create user-scope config directory** (15 min)
    ```bash
    mkdir -p /Users/davidkellam/workspace/mcp-configs/user-scope
    mkdir -p /Users/davidkellam/workspace/mcp-configs/client-templates
    ```

12. **Claude Code configuration** (30 min)
    - Create `~/.config/claude-code/mcp.json`:
    ```json
    {
      "mcpServers": {
        "coda-remote": {
          "transport": "sse",
          "url": "https://coda.bestviable.com/sse",
          "headers": {
            "Authorization": "Bearer ${CODA_API_TOKEN}"
          }
        },
        "github-remote": {
          "transport": "sse",
          "url": "https://github.bestviable.com/sse"
        },
        "memory-remote": {
          "transport": "sse",
          "url": "https://memory.bestviable.com/sse"
        },
        "calculator": {
          "command": "uvx",
          "args": ["mcp-server-calculator"]
        },
        "time": {
          "command": "uvx",
          "args": ["mcp-server-time"]
        }
      }
    }
    ```
    - Save template to `/workspace/mcp-configs/client-templates/claude-code.json`
    - Test: Open Claude Code, verify tools available

13. **Update Claude Desktop config** (30 min)
    - Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
    - Replace stdio Coda/GitHub with remote transport configs
    - Keep lightweight Tier 2 MCPs (calculator, time, fetch, sequential-thinking, youtube-transcript)
    - Remove duplicate `coda-enhanced` (Docker)
    - Save template to `/workspace/mcp-configs/client-templates/claude-desktop.json`
    - Restart Claude Desktop, test connections

14. **Document other client setup** (2 hours)
    - Create setup guides in `/integrations/mcp/clients/`:
      - `claude-code/README.md` - Configuration instructions
      - `claude-desktop/README.md` - Configuration instructions
      - `cursor/README.md` - How to configure (research needed)
      - `zed/README.md` - How to configure (research needed)
      - `chatgpt/README.md` - Web UI MCP plugin instructions
      - `codex-cli/README.md` - Update existing guide from `/agents/context/mcp_setup_codex_cli_v01.md`

15. **Create secrets management guide** (30 min)
    - Document in `/workspace/mcp-configs/SECRETS_MANAGEMENT.md`:
      - Never commit API keys to templates
      - Use placeholder: `"API_KEY": "${API_KEY_NAME}"`
      - Maintain `.env` file (gitignored) with real values
      - Script to merge template + .env → client config (future)

**Definition of Done:**
- ✅ Claude Code can access all Tier 1 MCPs
- ✅ Claude Desktop config updated with remote transports
- ✅ Templates exist for 5+ clients (Claude Code, Claude Desktop, Cursor, Zed, ChatGPT, Codex)
- ✅ Client setup guides in `/integrations/mcp/clients/`
- ✅ Secrets management documented

### Phase 4 — Project Scope & Monitoring (≈3 hours)

**Goal**: Workspace-specific tooling + health checks

16. **Portfolio .mcp configuration** (1 hour)
    - Create `.mcp/config.json`:
    ```json
    {
      "mcpServers": {
        "filesystem": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/davidkellam/workspace/portfolio"],
          "env": {}
        },
        "context7": {
          "command": "npx",
          "args": ["-y", "@upstash/context7-mcp"],
          "env": {
            "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}"
          }
        }
      }
    }
    ```
    - Create `.mcp/.env.example` with placeholders
    - Add to `.gitignore`: `.mcp/.env`, `.mcp/data/`
    - Document in `.mcp/README.md` with setup instructions
    - Update project README with MCP section

17. **Add health checks** (1 hour)
    - Create n8n workflow: "MCP Health Monitor"
      - HTTP requests to all Tier 1 endpoints every 5 minutes
      - Check for 200 status codes
      - Alert on failures (email/Slack)
    - Document workflow in `/docs/infrastructure/monitoring_v01.md`

18. **Create monitoring dashboard** (1 hour)
    - Optional: Coda table "MCP Service Status"
      - Columns: Service, Tier, Endpoint, Status, Last Check, Uptime %
      - Sync with n8n health check workflow
    - Or simple: Use Uptime Robot free tier

**Definition of Done:**
- ✅ `.mcp/` configured in portfolio workspace
- ✅ Filesystem MCP scoped to project only
- ✅ Project-level setup guide in `.mcp/README.md`
- ✅ Health checks monitoring all Tier 1 MCPs
- ✅ Alerting configured (email or Slack)

---

## 8. Configuration Management Strategy

### User-Scope Configs (Tier 2)
**Location**: `/Users/davidkellam/workspace/mcp-configs/user-scope/`

**Files:**
- `claude-desktop.json` - Template for `~/Library/Application Support/Claude/claude_desktop_config.json`
- `claude-code.json` - Template for `~/.config/claude-code/mcp.json`
- `cursor.json`, `zed.json`, etc. - Future IDE templates
- `.env.example` - Placeholder for secrets
- `README.md` - Usage instructions

**Usage:**
```bash
# Install/update Claude Desktop config
cp ~/workspace/mcp-configs/user-scope/claude-desktop.json \
   ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Secrets management:**
- Never commit API keys to templates
- Use placeholder: `"API_KEY": "${API_KEY_NAME}"`
- Maintain separate `.env` file (gitignored) with real values
- Future: Script to merge template + .env → client config

### Project-Scope Configs (Tier 3)
**Location**: `/Users/davidkellam/workspace/portfolio/.mcp/`

**Files:**
- `config.json` - MCP server definitions
- `.env` - Secrets (gitignored)
- `.env.example` - Committed placeholder
- `README.md` - Setup instructions for new developers
- `data/` - Runtime data (gitignored)

**Example config.json:**
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

### Remote Server Configs (Tier 1)
**Source of Truth**: `/infra/docker/docker-compose.production.yml`

**Config workflow:**
1. Edit `docker-compose.production.yml` locally
2. Test with `docker compose config` (validates syntax)
3. Commit to git with descriptive message
4. Deploy to droplet via manual `scp` (current) or automated sync (future)
5. Update `/docs/architecture/integrations/mcp/server_catalog_v01.md`

---

## 9. Known Snags & Mitigations

| Snag | Mitigation |
|------|------------|
| Redirect loops via Cloudflare tunnel | Ensure `TRUST_DOWNSTREAM_PROXY=true` and `HTTPS_METHOD=noredirect` remain set (per ADR 2025-10-28). |
| Service only bound to 127.0.0.1 | Keep compose `command` override binding to `0.0.0.0:808X`; re-check after rebuilds. |
| Missing tools after MCP upgrade | Compare upstream branches; check MCP server logs for initialization errors. |
| npm/pnpm install failures | Mirror upstream Node version; add `apk add build-base` if packages need compilation. |
| Certificates slow to issue | `acme-companion` may need 1–5 min; rerun `docker logs acme-companion` to confirm. |
| Client can't connect to remote MCP | Verify endpoint accessible: `curl -I https://{mcp}.bestviable.com/sse`. Check auth headers. |
| Port conflicts | Each MCP needs unique port (8080, 8081, 8082, etc.). Update VIRTUAL_PORT accordingly. |
| Memory MCP data loss | Ensure persistent volume mounted: `./data/mcp-memory:/data` in compose. |
| Secrets in git | Always use placeholders in templates. Real secrets only in `.env` files (gitignored). |

---

## 10. Maintenance & Operations

### Update Procedures

**Tier 1 (Remote) updates:**
1. Edit source in `/integrations/mcp/servers/{mcp-name}/src`
2. Update Dockerfile if dependencies changed
3. Rebuild: `docker compose -f docker-compose.production.yml build {mcp-name}-mcp-gateway`
4. Test locally: `docker compose up {mcp-name}-mcp-gateway` + health checks
5. Deploy to droplet: `scp` + rebuild + restart
6. Update `CHANGELOG.md` in server directory
7. Update `/docs/architecture/integrations/mcp/server_catalog_v01.md`
8. Log in `/logs/context_actions.csv`

**Tier 2 (User) updates:**
- Edit template in `/mcp-configs/user-scope/{client}.json`
- Copy to client config location(s)
- Restart client application
- Test MCP availability

**Tier 3 (Project) updates:**
- Edit `.mcp/config.json` in workspace
- Commit to git (if not secrets)
- Restart AI agent session
- Verify with tool listing

### Troubleshooting Checklist

**Tier 1 (Remote):**
```bash
# Check service status
ssh tools-droplet-agents
docker compose -f docker-compose.production.yml ps

# Check logs
docker logs {mcp-name}-mcp-gateway --tail 50

# Test endpoint
curl -I https://{mcp-name}.bestviable.com/sse

# Verify nginx routing
docker logs nginx-proxy --tail 40 | grep {mcp-name}

# Check Cloudflare tunnel
docker logs cloudflared --tail 40

# Test tool invocation
curl -X POST https://{mcp-name}.bestviable.com/sse \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"method": "tools/list"}'
```

**Tier 2 (User):**
```bash
# Verify config syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .

# Test command manually
npx -y @modelcontextprotocol/server-calculator

# Check client logs
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Tier 3 (Project):**
```bash
# Verify config
cat /Users/davidkellam/workspace/portfolio/.mcp/config.json | jq .

# Test in isolation
cd /Users/davidkellam/workspace/portfolio
npx -y @modelcontextprotocol/server-filesystem $PWD
```

### Version Control Policy

**What to commit:**
- ✅ `/integrations/mcp/` (source code, docs, Dockerfiles)
- ✅ `/infra/docker/docker-compose.production.yml`
- ✅ `/infra/docker/services/*.Dockerfile`
- ✅ `/mcp-configs/` (templates without secrets)
- ✅ `.mcp/config.json` (project scope, without secrets)
- ✅ `.mcp/.env.example` (placeholder)
- ✅ `/docs/architecture/integrations/mcp/` (all docs)

**What NOT to commit:**
- ❌ API keys, tokens, passwords
- ❌ `.env` files with real secrets
- ❌ User-scope config files (those live in `~/.config/` or `~/Library/`)
- ❌ `.mcp/.env` (project secrets)
- ❌ `.mcp/data/` (runtime data)
- ❌ `/workspace/mcp-configs/user-scope/.env` (real secrets)

---

## 11. Documentation & Logging

**Update the following as you progress:**
- Session record: Create `/agents/context/sessions/2025-10-29_mcp-architecture-implementation.md` if session spans multiple days
- ADRs: Created `/agents/decisions/2025-10-29_mcp-tier-architecture_v01.md`
- Action log: `/logs/context_actions.csv` for each major step
- MCP Registry: `/docs/architecture/integrations/mcp/server_catalog_v01.md` (update after each server addition)
- Session handoff: Refresh `SESSION_HANDOFF_current.md` with status/next MITs

**Per-MCP documentation:**
- Create full suite in `/integrations/mcp/servers/{mcp-name}/`:
  - README.md, DEPLOYMENT.md, CHANGELOG.md, TROUBLESHOOTING.md
- Update inline docs in `docker-compose.production.yml`

---

## 12. Definition of Done

### Phase 1 Complete When:
- ✅ `/integrations/mcp/` structure exists with proper subdirectories
- ✅ Coda MCP Gateway upgraded and deployed from local source
- ✅ `https://coda.bestviable.com/sse` verified accessible
- ✅ All foundation documentation created (playbooks, ADRs, catalogs, runbooks)
- ✅ MCP_REGISTRY documents all 14 current MCPs with tier assignments

### Phase 2 Complete When:
- ✅ 3+ MCPs deployed to Tier 1 (Coda, GitHub, Memory minimum)
- ✅ All have `https://{name}.bestviable.com/sse` endpoints
- ✅ Each has complete documentation in `/integrations/mcp/servers/{name}/`
- ✅ Health checks configured for all Tier 1 services

### Phase 3 Complete When:
- ✅ Claude Code can access all Tier 1 MCPs
- ✅ Claude Desktop config updated with remote transports
- ✅ Templates exist for 5+ clients
- ✅ Client setup guides in `/integrations/mcp/clients/`
- ✅ Secrets management documented and working

### Phase 4 Complete When:
- ✅ `.mcp/` configured in portfolio workspace
- ✅ Filesystem MCP scoped to project only
- ✅ Health checks monitoring all Tier 1 MCPs
- ✅ Documentation includes project-level setup guide
- ✅ Alerting configured (email or Slack)

---

## 13. Stretch Goals / Future Work

- Create CI/CD pipeline for automatic droplet deployment on git push
- Build unified MCP gateway (single container multiplexing multiple servers)
- Add `/health` endpoints to all remote MCPs for better monitoring
- Create n8n workflows to queue or sync MCP actions with Coda tables
- Explore Docker Desktop MCP Gateway (beta) as alternative to custom deployment
- Build MCP server for n8n (trigger workflows, query execution logs)
- Create custom MCP for SoT operations (authority map queries, sync triggers)
- Develop MCP discovery service (automatic client configuration)

---

## 14. Docker Desktop MCP Gateway (Beta) - Evaluation

**Status**: Monitor but don't prioritize

**Pros:**
- Native Docker integration
- Could simplify local MCP management

**Cons:**
- Beta software (unstable)
- Docker Desktop dependency (not needed for droplet)
- Unclear if compatible with SyncBricks pattern
- May lock into Docker ecosystem

**Recommendation**: Wait for stable release, evaluate if it can replace Tier 2/3 local stdio configs. For now, our SyncBricks pattern for Tier 1 is proven and scalable.

---

**TTL:** Review and update this playbook after Phase 2 completion or by **2025-12-01**.
