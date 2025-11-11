---
- entity: plan
- level: internal
- zone: internal
- version: v01
- tags: [mcp, deployment, digitalocean, cloudflare, tier1]
- source_path: /agents/context/playbooks/mcp_digitalocean_cloudflare_deploy_v01.md
- date: 2025-10-29
---

# Playbook — Deploy DigitalOcean & Cloudflare MCP Servers (Tier 1)

**Objective.** Promote the DigitalOcean and Cloudflare MCP servers to Tier 1 (remote transport) so every AI client—CLI agents, IDEs, desktop apps, web chat, automations—can reach them via the SyncBricks-hosted droplet.

This playbook extends the three-tier ADR (`agents/decisions/2025-10-29_mcp-tier-architecture_v01.md`) and follows the onboarding template (`agents/context/playbooks/mcp_server_onboarding_template_v01.md`).

---

## Phase 0 — Intake & Tier Confirmation (≤30 min)

- Duplicate the onboarding template twice:  
  `agents/context/playbooks/digitalocean_onboarding_v01.md` and `agents/context/playbooks/cloudflare_onboarding_v01.md`.  
  Capture API scopes, tool inventory, target clients, and rationale for Tier 1.
- Log intent in `logs/context_actions.csv` with provisional endpoints `https://digitalocean.bestviable.com/sse` and `https://cloudflare.bestviable.com/sse`.
- Resolve open questions around API limits or required Cloudflare/DigitalOcean roles before proceeding.

---

## Phase 1 — Source Acquisition & Local Build (≈2–3 h)

1. **Clone upstream servers**  
   - `git clone https://github.com/digitalocean-labs/mcp-digitalocean.git integrations/mcp/servers/digitalocean/src`  
   - `git clone https://github.com/cloudflare/mcp-server-cloudflare.git integrations/mcp/servers/cloudflare/src`  
   Record upstream commit hash, license, and dependency notes in each server README.

2. **Author Dockerfiles**  
   - `docs/ops/Dockerfile.digitalocean-mcp-gateway`  
   - `docs/ops/Dockerfile.cloudflare-mcp-gateway`  
   Pattern: install `mcp-proxy`, copy source, install deps, expose unique port (e.g., 8082/8083), launch with `mcp-proxy --host 0.0.0.0`.

3. **Local smoke tests**  
   - `docker build -t digitalocean-mcp-gateway:local -f docs/ops/Dockerfile.digitalocean-mcp-gateway .`  
   - `docker run … -e DIGITALOCEAN_API_TOKEN=dummy …`  
   - Invoke `tools/list` using `curl` to confirm server responds (use sandbox tokens or mocked env vars).  
   Document test commands in each server’s `DEPLOYMENT.md`.

4. **Document baseline**  
   Create `README.md`, `DEPLOYMENT.md`, `CHANGELOG.md`, `TROUBLESHOOTING.md` inside each server directory with stubs referencing this playbook and the troubleshooting runbook.

---

## Phase 2 — Compose Integration & Droplet Deployment (≈3 h)

1. **Extend docker-compose** (`docs/ops/docker-compose.production.yml`)  
   - Add services `digitalocean-mcp-gateway` and `cloudflare-mcp-gateway` with:  
     - Unique internal ports (8082/8083)  
     - `VIRTUAL_HOST`, `LETSENCRYPT_HOST`, `VIRTUAL_PORT`  
     - Health checks similar to Coda (process check or HTTP if available)  
     - Environment references (`${DIGITALOCEAN_API_TOKEN}`, `${CLOUDFLARE_API_TOKEN}`, `${DOMAIN}`)

2. **Secrets management**  
   - Add new tokens to droplet `.env` (least-privilege scopes); document acquisition in the server DEPLOYMENT guides.  
   - Ensure local development uses placeholder env vars or `.env.example`.

3. **Deploy**
   - `scp` updated compose + Dockerfiles to droplet.
   - `ssh tools-droplet-agents` → `docker compose -f docker-compose.production.yml build digitalocean-mcp-gateway cloudflare-mcp-gateway`
   - `docker compose -f docker-compose.production.yml up -d digitalocean-mcp-gateway cloudflare-mcp-gateway`

4. **Verification**  
   - `curl -I https://digitalocean.bestviable.com/sse` and `https://cloudflare.bestviable.com/sse` (expect 200).  
   - `docker logs nginx-proxy --tail 40 | grep -E '(digitalocean|cloudflare)'` for successful routing.  
   - Record results in onboarding docs and `logs/context_actions.csv`.

---

## Phase 3 — Documentation & Registry Updates (≈1.5 h)

- Populate server documentation with commands, environment variable descriptions, tool lists, rate-limit notes, and troubleshooting tips.
- Update `docs/architecture/integrations/mcp/server_catalog_v01.md`: insert both servers into the Tier 1 table, adjust `last_updated`.
- Add quick links (if needed) in `integrations/mcp/README.md` pointing to new server directories.
- Append summary of new Tier 1 services to `docs/infrastructure/droplet_state_2025-10-28.md` during the next state refresh.

---

## Phase 4 — Client Configuration & Testing (≈2 h)

1. **Templates**  
   - Update SSE entries in client guides (`integrations/mcp/clients/claude-code/README.md`, `claude-desktop`, future IDE templates) using `${DIGITALOCEAN_API_TOKEN}` and `${CLOUDFLARE_API_TOKEN}` placeholders.

2. **End-to-end tests**  
   - Verify `tools/list` and representative tool calls from Claude Code and Claude Desktop; optionally exercise ChatGPT/Cursor once templates exist.  
   - Log successful invocations in onboarding docs (include command transcripts if useful).

3. **Automation hooks**  
   - Queue addition to MCP health monitor workflow (n8n) or document manual checks until automation ships.  
   - Note any rate-limit guardrails for future monitoring.

---

## Phase 5 — Handoff & Governance (≤30 min)

- Update current session handoff with deployment status and remaining follow-ups (monitoring, Docker Desktop evaluation, etc.).  
- Confirm `logs/context_actions.csv` entries exist for clone, docker updates, deployment, documentation.  
- Schedule token rotation reminders in DEPLOYMENT docs (align with security guidance in `integrations/mcp/README.md`).  
- File stretch tasks (CI automation, unified gateway integration) in `planning/` or backlog as appropriate.

---

## Definition of Done

- Both servers reachable at `https://digitalocean.bestviable.com/sse` and `https://cloudflare.bestviable.com/sse`.  
- Documentation set (README/DEPLOYMENT/CHANGELOG/TROUBLESHOOTING) complete under each server directory.  
- Catalog, runbook references, and client templates updated.  
- Successful test invocations recorded from at least one CLI agent and one desktop/web client.  
- Follow-up items captured in handoff or backlog.

---

## Checklist

- [ ] Intake onboarding docs created  
- [ ] Source cloned, Dockerfiles authored  
- [ ] Local builds & smoke tests completed  
- [ ] Compose + droplet deployment verified  
- [ ] Documentation + catalog updated  
- [ ] Client templates extended & tests passed  
- [ ] Handoff/logs updated, follow-ups noted
