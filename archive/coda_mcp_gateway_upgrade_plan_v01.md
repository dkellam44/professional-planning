- entity: plan
- level: internal
- zone: internal
- version: v01
- tags: [infrastructure, mcp, coda, docker, cloudflare, learning]
- source_path: /context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md
- date: 2025-10-28

---

# Project Plan — Coda MCP Gateway Upgrade & Customization

> **Status Update (2025-11-02):** Gateway layer decommissioned. The Coda MCP server now ships as an HTTP-native service (`coda-mcp`) and is deployed directly via `infra/docker/docker-compose.production.yml`. Keep this playbook for historical context; new implementation work should reference `agents/context/playbooks/http_native_mcp_server_v01.md` and related docs.

**Objective.** Replace the current community Coda MCP build with a fork that matches (and eventually exceeds) the `dustinrgood/coda-mcp` feature set, deploy it inside the existing SyncBricks-style droplet stack, and create space for ongoing learning/customization.

---

## 0. References & Context
- Infrastructure stack & tunnel notes: `SESSION_HANDOFF_2025-10-28_v1.md`, `context/sessions/2025-10-28_n8n-coda-production-notes.md`
- Current compose & Docker template: `ops/docker-compose.production.yml` (service `coda-mcp`)
- HTTPS/Tunnel ADR: `decisions/2025-10-28_cloudflare-proxy-trust-config_v01.md`
- Cloudflare/SyncBricks documentation: `docs/infrastructure/` package (quickstart + token guide)
- Target MCP repos:  
  • `https://github.com/orellazri/coda-mcp` (baseline capabilities)  
  • `https://github.com/dustinrgood/coda-mcp` (desired toolset)  

Keep this plan open during execution; note deviations or upgrades in `logs/context_actions.csv` and update relevant ADRs.

---

## 1. Roles & Checkpoints

| Step | Default owner | Human-in-loop checkpoints |
|------|---------------|---------------------------|
| Phase 1 (repo acquisition) | Human or agent | Verify fork location + license |
| Phase 2 (compose/docker updates) | Agent | Inspect diff before deploy |
| Phase 3 (deployment/tests) | Agent | Review curl outputs + service behaviour |
| Phase 4 (feature parity validation) | Human | Run desired Coda workflows via MCP |
| Phase 5 (customization) | Human learning loop | Pair with agent for code changes |

---

## 2. Phase Breakdown

### Phase 0 — Preparation & Environment (≈30 min)
1. Confirm droplet access (`ssh tools-droplet-agents`) and that `docker compose` stack is healthy:
   `docker compose -f docker-compose.production.yml ps`
2. Snapshot current state (optional):  
   - `docker compose -f docker-compose.production.yml logs coda-mcp-gateway > logs/ops/coda-mcp-gateway_pre-upgrade.log`
   - `docker inspect coda-mcp-gateway > logs/ops/coda-mcp-gateway_container.json`
3. Ensure local repo up to date; run `git status` to confirm clean workspace before major edits.

### Phase 1 — Acquire & Stage Target Source (≈45 min)
1. Fork both upstream repos into personal GitHub account or mirror locally (keeps history).
2. Create working tree under portfolio repo:  
   ```
   mkdir -p integrations/coda-mcp/src
   git subtree add --prefix=integrations/coda-mcp/src <fork-url> main --squash   # or simple clone
   ```
   *Alternative:* Use `git submodule` if you prefer direct linkage.
3. Capture README + usage notes in `integrations/coda-mcp/README.md`.
4. Record provenance & chosen branch in `integrations/coda-mcp/METADATA.md`.
5. Add a TODO list mapping required capabilities from `dustinrgood` fork (export, search, etc.).

### Phase 2 — Integrate with Docker Build (≈60 min)
1. Replace `ops/Dockerfile.coda-mcp-gateway` build base:  
   - `COPY integrations/coda-mcp/src /app` (or similar)  
   - Install dependencies per repo instructions (Node version, pnpm/yarn, etc.).  
   - Keep `mcp-proxy` wrapper; ensure final command still `mcp-proxy --host 0.0.0.0 --port 8080 -- node dist/index.js`.
2. Update `ops/docker-compose.production.yml` if new env vars/config files required (e.g., table IDs, scopes).
3. Document build prerequisites (Node version, env vars) alongside Dockerfile comments.
4. Run `docker compose -f docker-compose.production.yml build coda-mcp-gateway` locally to catch missing deps.

### Phase 3 — Deploy on Droplet (≈30 min)
1. `scp` updated Dockerfile + compose to droplet (`/root/portfolio/ops`).
2. SSH to droplet, then:  
   ```
   docker compose -f docker-compose.production.yml build coda-mcp-gateway
   docker compose -f docker-compose.production.yml up -d
   ```
3. Validate routing:  
   - `docker compose -f docker-compose.production.yml exec coda-mcp-gateway netstat -tlnp | grep 8080` (should be `0.0.0.0`).  
   - `curl -I --resolve coda.bestviable.com:443:127.0.0.1 https://coda.bestviable.com/sse` → `200`.  
   - `docker logs nginx-proxy --tail 40 | grep coda` for final routing status.
4. Log deployment in `logs/context_actions.csv` (time, action, path).

### Phase 4 — Functional & Parity Validation (≈1 hr)
1. Smoke-test dustinrgood feature set:  
   - Connect ChatGPT web UI (or CLI) to tunnel endpoint.  
   - Exercise key commands (table list, doc search, create row).  
   - Capture results in `context/sessions/YYYY-MM-DD_coda-mcp-validation.md`.
2. If functionality missing, note gaps → create issues in local fork.
3. Update ADR or create new one if policy changes (e.g., new scopes, auth model).

### Phase 5 — Customization & Learning Loop (ongoing)
1. Prioritise enhancements (e.g., new tools, richer queries, n8n triggers).  
   - Track tasks in `planning/` or `integrations/coda-mcp/TODO.md`.
2. Pair with agent for guided coding sessions:  
   - Start with failing tests or TODO comment.  
   - Use GenAI to generate scaffolding, manually review, then run tests.
3. Add automated checks:  
   - Unit tests (npm test).  
   - Optional integration harness hitting a test Coda doc.  
   - Hook into CI or local script before build.
4. Promote reusable learnings into `context/playbooks/`.

---

## 3. Known Snags & Mitigations

| Snag | Mitigation |
|------|------------|
| Redirect loops via Cloudflare tunnel | Ensure `TRUST_DOWNSTREAM_PROXY=true` and `HTTPS_METHOD=noredirect` remain set (see ADR). |
| Service only bound to 127.0.0.1 | Keep compose `command` override (binding to 0.0.0.0); re-check after rebuilds. |
| Missing tools after upgrade | Compare upstream branches; enable/disable modules in configuration files. |
| npm/pnpm install failures | Mirror upstream Node version; add `apk add build-base` if packages need compilation. |
| Certificates slow to issue | `acme-companion` may need 1–5 min; rerun `docker logs acme-companion` to confirm. |
| Safari/Brave secure-cookie warning | Document for users; optionally toggle `N8N_SECURE_COOKIE=false` if accepted. |

---

## 4. Documentation & Logging

Update the following as you progress:
- Session record: `context/sessions/<date>_coda-mcp-upgrade.md`
- ADRs: create/extend if architecture choices change.
- Action log: `logs/context_actions.csv` for each major step.
- Repo README: Note MCP version & build instructions.
- Session handoff: refresh `SESSION_HANDOFF_current.md` with status/next MITs.

---

## 5. Definition of Done
1. `https://coda.bestviable.com/sse` serves the desired fork with all dustinrgood tool parity.
2. MCP clients (ChatGPT, CLI) can execute target workflows end to end.
3. Source lives in `integrations/coda-mcp/` with docs/tests; Dockerfile builds from it.
4. Plan updates logged; new ADR(s) created if necessary.
5. Optional: regression checklist captured for future upgrades.

---

## 6. Stretch Goals / Future Work
- Add `/health` endpoint (or route) for monitoring + use in uptime checks.
- Create n8n workflows to queue or sync MCP actions with Coda tables.
- Introduce CI job that lints/tests MCP code before building the droplet image.
- Explore multi-service gateway (additional MCP servers) sharing same Cloudflare tunnel.

---

**TTL:** Review and update this plan after first successful fork deployment or by **2025-11-15**.
