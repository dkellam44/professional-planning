---
- entity: template
- level: internal
- zone: internal
- version: v01
- tags: [mcp, template, onboarding, process]
- source_path: /agents/context/playbooks/mcp_server_onboarding_template_v01.md
- date: 2025-10-29
---

# Template Playbook — MCP Server Onboarding

**Purpose**: Reusable template for adding a new MCP server to the architecture. Copy this template and fill in [PLACEHOLDERS] for each new MCP.

**Usage**: When adding a new MCP server, duplicate this file and rename to `{mcp-name}_onboarding_v01.md`, then follow the checklist.

---

## MCP Server: [MCP_NAME]

**Objective**: Deploy [MCP_NAME] MCP server to Tier [1|2|3] and make it accessible to [list of clients].

**Date Started**: YYYY-MM-DD
**Tier Assignment**: [1-Remote | 2-User | 3-Project]
**Status**: [Planning | In Progress | Deployed | Deprecated]

---

## 0. Pre-Flight Checklist

Before starting, answer these questions:

1. **What tier should this MCP be deployed to?**
   - [ ] **Tier 1 (Remote)** - Custom fork, expensive API, sensitive credentials, or resource-intensive
   - [ ] **Tier 2 (User)** - Stable official, lightweight, no external dependencies
   - [ ] **Tier 3 (Project)** - Workspace-specific, security boundary, or under development

2. **What is the source?**
   - [ ] Official MCP server (npm/uvx package): `[package-name]`
   - [ ] Community server (GitHub repo): `[repo-url]`
   - [ ] Custom fork/build (our repository): `[our-repo-path]`

3. **What tools does it provide?**
   - Tool 1: `[tool-name]` - [description]
   - Tool 2: `[tool-name]` - [description]
   - ...

4. **What authentication does it require?**
   - [ ] None
   - [ ] API Key (env var: `[VAR_NAME]`)
   - [ ] OAuth token
   - [ ] Other: [describe]

5. **What clients will use it?**
   - [ ] Claude Code
   - [ ] Claude Desktop
   - [ ] Cursor
   - [ ] Zed
   - [ ] ChatGPT
   - [ ] Other: [specify]

---

## 1. Decision: Tier Assignment

**Chosen Tier**: [1|2|3]

**Rationale**:
[Explain why this tier was chosen using criteria from ADR 2025-10-29_mcp-tier-architecture_v01.md]

**Endpoint** (if Tier 1): `https://[mcp-name].bestviable.com/sse`

**Config Location** (if Tier 2): `~/.config/[client-name]/mcp.json` or `~/Library/Application Support/[client-name]/`

**Config Location** (if Tier 3): `/Users/davidkellam/workspace/[project-name]/.mcp/config.json`

---

## 2. Phase Breakdown

### Phase 1 — Setup & Source Acquisition (≈30-60 min)

#### Tier 1 (Remote) Setup:

1. **Create directory structure**:
   ```bash
   mkdir -p /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/[mcp-name]/{src,config}
   ```

2. **Acquire source**:
   - [ ] If official package: Document install command in README
   - [ ] If community repo: Fork to personal GitHub, clone to `src/`
   - [ ] If custom: Create source in `src/`

3. **Create Dockerfile**:
   ```dockerfile
   FROM node:20-alpine  # or python:3.11-alpine for Python servers

   # Install mcp-proxy
   RUN apk add --no-cache python3 py3-pip
   RUN pip install --break-system-packages mcp-proxy

   # Install MCP server
   # Option A (npm): RUN npm install -g [package-name]
   # Option B (local): COPY src/ /app/ && cd /app && npm install

   # Expose port
   EXPOSE [808X]

   # Run via mcp-proxy
   CMD ["mcp-proxy", "--host", "0.0.0.0", "--port", "[808X]", "--", "[start-command]"]
   ```
   Save to: `/docs/ops/Dockerfile.[mcp-name]-mcp-gateway`

4. **Test local build**:
   ```bash
   docker build -t [mcp-name]-mcp-gateway:local -f docs/ops/Dockerfile.[mcp-name]-mcp-gateway .
   docker run --rm -p [808X]:[808X] -e [API_KEY_VAR]="test-key" [mcp-name]-mcp-gateway:local
   ```

#### Tier 2 (User) Setup:

1. **Test install command**:
   ```bash
   # For npm packages:
   npx -y [package-name]

   # For Python packages:
   uvx [package-name]
   ```

2. **Create config template**:
   Create `/Users/davidkellam/workspace/mcp-configs/user-scope/[client-name].json` entry:
   ```json
   {
     "[mcp-name]": {
       "command": "[npx|uvx]",
       "args": ["-y", "[package-name]"],
       "env": {
         "[API_KEY_VAR]": "${[API_KEY_VAR]}"
       }
     }
   }
   ```

#### Tier 3 (Project) Setup:

1. **Add to project `.mcp/config.json`**:
   ```json
   {
     "mcpServers": {
       "[mcp-name]": {
         "command": "[npx|uvx|docker]",
         "args": ["[args]"],
         "env": {
           "[API_KEY_VAR]": "${[API_KEY_VAR]}"
         }
       }
     }
   }
   ```

2. **Add secret to `.mcp/.env`** (gitignored):
   ```bash
   [API_KEY_VAR]="[actual-key-value]"
   ```

3. **Update `.mcp/.env.example`** (committed):
   ```bash
   [API_KEY_VAR]="REPLACE_WITH_YOUR_KEY"
   ```

---

### Phase 2 — Deployment (≈30-60 min)

#### Tier 1 (Remote) Deployment:

1. **Update `docker-compose.production.yml`**:
   ```yaml
   # ==============================================================================
   # MCP: [mcp-name]
   # Tier: 1 (Remote Transport)
   # Endpoint: https://[mcp-name].bestviable.com/sse
   # Source: /integrations/mcp/servers/[mcp-name]/
   # Tools: [list of tools]
   # Last Updated: YYYY-MM-DD
   # ==============================================================================

   [mcp-name]-mcp-gateway:
     build:
       context: .
       dockerfile: docs/ops/Dockerfile.[mcp-name]-mcp-gateway
     container_name: [mcp-name]-mcp-gateway
     restart: always
     environment:
       # Service-specific env vars
       [API_KEY_VAR]: ${[API_KEY_VAR]}

       # Reverse proxy discovery
       VIRTUAL_HOST: [mcp-name].${DOMAIN}
       VIRTUAL_PORT: [808X]
       LETSENCRYPT_HOST: [mcp-name].${DOMAIN}
       LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL}

       # Proxy trust (required for Cloudflare Tunnel)
       HTTPS_METHOD: noredirect
       TRUST_DOWNSTREAM_PROXY: "true"

     command: ["mcp-proxy", "--host", "0.0.0.0", "--port", "[808X]", "--", "[start-command]"]

     ports:
       - "127.0.0.1:[808X]:[808X]"

     networks:
       - proxy
       - syncbricks  # if backend access needed

     depends_on:
       n8n:
         condition: service_healthy

     healthcheck:
       test: ["CMD", "pgrep", "-f", "node.*[mcp-name]"]  # or python for Python servers
       interval: 30s
       timeout: 10s
       retries: 3
       start_period: 120s
   ```

2. **Add environment variable to droplet `.env`**:
   ```bash
   ssh root@tools
   echo '[API_KEY_VAR]="[actual-key]"' >> .env
   ```

3. **Copy files to droplet**:
   ```bash
   scp docs/ops/docker-compose.production.yml root@tools:~/
   scp docs/ops/Dockerfile.[mcp-name]-mcp-gateway root@tools:~/
   # If custom source:
   scp -r integrations/mcp/servers/[mcp-name]/ root@tools:~/integrations/mcp/servers/
   ```

4. **Build and deploy**:
   ```bash
   ssh root@tools
   docker compose -f docker-compose.production.yml build [mcp-name]-mcp-gateway
   docker compose -f docker-compose.production.yml up -d [mcp-name]-mcp-gateway
   ```

5. **Configure Cloudflare DNS** (if not using wildcard):
   - Login to Cloudflare dashboard
   - Add DNS record: `[mcp-name] CNAME @` (proxied)
   - Cloudflare Tunnel handles routing automatically

6. **Verify deployment**:
   ```bash
   # Check container running
   docker compose -f docker-compose.production.yml ps | grep [mcp-name]

   # Check logs
   docker logs [mcp-name]-mcp-gateway --tail 50

   # Test endpoint
   curl -I https://[mcp-name].bestviable.com/sse
   # Expected: HTTP/1.1 200 OK

   # Check nginx routing
   docker logs nginx-proxy --tail 40 | grep [mcp-name]
   ```

#### Tier 2 (User) Deployment:

1. **Install to each client**:
   ```bash
   # Claude Desktop
   cp ~/workspace/mcp-configs/user-scope/claude-desktop.json \
      ~/Library/Application\ Support/Claude/claude_desktop_config.json

   # Claude Code
   cp ~/workspace/mcp-configs/user-scope/claude-code.json \
      ~/.config/claude-code/mcp.json

   # Restart clients
   ```

2. **Test in client**:
   - Open client (e.g., Claude Desktop)
   - Check MCP tools available
   - Test tool invocation

#### Tier 3 (Project) Deployment:

1. **Commit `.mcp/config.json`** (without secrets):
   ```bash
   git add .mcp/config.json .mcp/.env.example .mcp/README.md
   git commit -m "Add [mcp-name] MCP to project scope"
   ```

2. **Document setup for other developers**:
   Update `.mcp/README.md` with setup instructions

3. **Test in workspace**:
   - Open AI agent in project directory
   - Verify MCP server starts
   - Test tool invocation

---

### Phase 3 — Documentation (≈45-60 min)

1. **Create server documentation** (`/integrations/mcp/servers/[mcp-name]/README.md`):
   ```markdown
   ---
   - entity: mcp-server
   - name: [mcp-name]
   - tier: [1|2|3]
   - version: v[X.Y.Z]
   - transport: [stdio|sse]
   - status: [deployed|testing|deprecated]
   - endpoint: [https://[mcp-name].bestviable.com/sse] (if Tier 1)
   - source_repo: [upstream-github-url]
   - last_updated: YYYY-MM-DD
   ---

   # [MCP_NAME] MCP Server

   ## Overview
   [Brief description of what this MCP does]

   ## Tools Provided
   1. `[tool-name]` - [description]
   2. `[tool-name]` - [description]

   ## Authentication
   [How to configure auth]

   ## Usage Examples
   [Show example tool invocations]

   ## Related Documentation
   - Deployment Guide: [DEPLOYMENT.md](DEPLOYMENT.md)
   - Troubleshooting: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
   - Changelog: [CHANGELOG.md](CHANGELOG.md)
   ```

2. **Create deployment guide** (`/integrations/mcp/servers/[mcp-name]/DEPLOYMENT.md`):
   ```markdown
   # [MCP_NAME] Deployment Guide

   ## Tier Assignment
   **Tier**: [1|2|3]
   **Rationale**: [why this tier]

   ## Configuration
   [Tier-specific config snippets]

   ## Deployment Steps
   [Step-by-step instructions]

   ## Verification
   [How to test it's working]
   ```

3. **Create changelog** (`/integrations/mcp/servers/[mcp-name]/CHANGELOG.md`):
   ```markdown
   # Changelog — [MCP_NAME]

   ## v1.0.0 — YYYY-MM-DD
   - Initial deployment to Tier [1|2|3]
   - Tools: [list]
   - Source: [package/repo]
   ```

4. **Create troubleshooting guide** (`/integrations/mcp/servers/[mcp-name]/TROUBLESHOOTING.md`):
   ```markdown
   # [MCP_NAME] Troubleshooting

   ## Common Issues

   ### Issue: [description]
   **Symptoms**: [what you see]
   **Cause**: [why it happens]
   **Solution**: [how to fix]

   ## Health Checks
   [Tier-specific diagnostics]

   ## Logs
   [Where to find logs]
   ```

5. **Update MCP Server Catalog**:
   Add entry to `/docs/architecture/integrations/mcp/server_catalog_v01.md`:
   - Add to appropriate tier table
   - Include all metadata (endpoint, tools, status, docs link)
   - Update `last_updated` date

6. **Update client setup guides** (if Tier 1):
   Add remote transport config to:
   - `/integrations/mcp/clients/claude-code/README.md`
   - `/integrations/mcp/clients/claude-desktop/README.md`
   - Other client guides as needed

---

### Phase 4 — Testing & Validation (≈30 min)

1. **Test tool invocation**:
   ```bash
   # For Tier 1 (remote):
   curl -X POST https://[mcp-name].bestviable.com/sse \
     -H "Authorization: Bearer $[API_KEY]" \
     -d '{"method": "tools/list"}'

   # For Tier 2/3 (local):
   # Open client, invoke tool via UI
   ```

2. **Verify in multiple clients** (if Tier 1):
   - [ ] Claude Code
   - [ ] Claude Desktop
   - [ ] Cursor (if configured)
   - [ ] Other clients as applicable

3. **Load test** (if Tier 1, optional):
   ```bash
   # Simple load test with 10 concurrent requests
   for i in {1..10}; do
     curl -X POST https://[mcp-name].bestviable.com/sse \
       -H "Authorization: Bearer $[API_KEY]" \
       -d '{"method": "tools/list"}' &
   done
   wait
   ```

4. **Monitoring setup** (if Tier 1):
   - Add to n8n "MCP Health Monitor" workflow
   - Configure alerts (email/Slack)
   - Set up uptime tracking (optional: Uptime Robot)

---

## 3. Known Snags & Mitigations

| Snag | Mitigation |
|------|------------|
| Port conflict with existing service | Use next available port (8080, 8081, 8082, etc.). Update VIRTUAL_PORT. |
| API rate limits | Consider Tier 1 deployment for centralized rate limiting. Document limits in README. |
| Large Docker image | Use Alpine base images. Clean up build artifacts. |
| Missing dependencies | Check upstream requirements. Add to Dockerfile. |
| Authentication failures | Verify env var names match exactly. Check token validity. |
| Slow cold starts | Increase `start_period` in healthcheck. Document expected startup time. |

---

## 4. Documentation & Logging

**Files to create/update**:
- [x] `/integrations/mcp/servers/[mcp-name]/README.md`
- [x] `/integrations/mcp/servers/[mcp-name]/DEPLOYMENT.md`
- [x] `/integrations/mcp/servers/[mcp-name]/CHANGELOG.md`
- [x] `/integrations/mcp/servers/[mcp-name]/TROUBLESHOOTING.md`
- [x] `/docs/architecture/integrations/mcp/server_catalog_v01.md` (update)
- [x] `/docs/ops/docker-compose.production.yml` (if Tier 1)
- [x] `/docs/ops/Dockerfile.[mcp-name]-mcp-gateway` (if Tier 1)
- [x] Client setup guides (if Tier 1)

**Log entry**:
Add to `/logs/context_actions.csv`:
```csv
YYYY-MM-DD HH:MM,[mcp-name] MCP deployed to Tier [1|2|3],/integrations/mcp/servers/[mcp-name]/,[your-name]
```

**Session handoff**:
Update `SESSION_HANDOFF_current.md` with:
- New MCP added to catalog
- Tier assignment and rationale
- Testing status
- Any blockers or open questions

---

## 5. Definition of Done

- [x] Tier assignment decided with documented rationale
- [x] Source acquired (fork/clone/install)
- [x] Dockerfile created (if Tier 1) or config template created (if Tier 2/3)
- [x] Deployed to target environment
- [x] Endpoint verified accessible (if Tier 1) or client config tested (if Tier 2/3)
- [x] All documentation created (README, DEPLOYMENT, CHANGELOG, TROUBLESHOOTING)
- [x] MCP Server Catalog updated
- [x] Tools tested in at least one client
- [x] Health checks configured (if Tier 1)
- [x] Logged in context_actions.csv

---

## 6. Stretch Goals / Future Work

- Add automated tests for tool invocations
- Create client SDKs/wrappers for common operations
- Implement caching layer for expensive API calls
- Add metrics/observability (request counts, latency, errors)
- Document integration patterns with other services (n8n, Coda)

---

**TTL**: Review this template after 3-5 MCP onboardings or by **2025-12-31**.
