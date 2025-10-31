---
- entity: plan
- level: internal
- zone: internal
- version: v01
- tags: [mcp, onboarding, digitalocean, tier1]
- source_path: /agents/context/playbooks/digitalocean_onboarding_v01.md
- date: 2025-10-29
---

# MCP Server Onboarding — DigitalOcean

**Objective**: Deploy the DigitalOcean Labs MCP server to Tier 1 (remote transport) so all AI clients can manage droplets, networking, App Platform, and DBaaS via one endpoint.

**Date Started**: 2025-10-29  
**Tier Assignment**: Tier 1 — Remote Transport (droplet-hosted)  
**Status**: In Progress (build complete; awaiting env + activation)

---

## 0. Pre-Flight Checklist

1. **Tier decision** — ✅ Tier 1 (remote)
2. **Source** — GitHub repo `digitalocean-labs/mcp-digitalocean` (`dd9ed9243cb58df22659725653ff0dfc24d3a246`)
3. **Tool families** — Droplets, Networking, Apps, Databases, Spaces, Marketplace, Insights, DOKS, Accounts
4. **Authentication** — Required `DIGITALOCEAN_API_TOKEN` (PAT with read/write scopes). Optional `DIGITALOCEAN_SERVICES` filter.
5. **Target clients** — Claude Code/Desktop, Cursor, Zed, VS Code, ChatGPT (via remote), n8n workflows

---

## Execution Snapshot

| Phase | Status | Notes |
|-------|--------|-------|
| Source + Dockerfile | ✅ | Repo cloned to `integrations/mcp/servers/digitalocean/src`; Dockerfile + entrypoint added |
| Local build | ✅ | `digitalocean-mcp-gateway:local` built (`docs/ops/Dockerfile.digitalocean-mcp-gateway`) |
| Compose/Droplet build | ✅ | `docker compose build digitalocean-mcp-gateway` on droplet (image ready) |
| Secrets | ⏳ | Add `DIGITALOCEAN_API_TOKEN` (+ optional vars) to droplet `.env` |
| Runtime | ⏳ | `docker compose up -d digitalocean-mcp-gateway` after secrets land |
| Documentation | ✅ | `/integrations/mcp/servers/digitalocean/` suite + catalog update |

---

## Next Actions

1. **Secrets** — Generate PAT with least-privilege scopes, store in droplet `.env` (`DIGITALOCEAN_API_TOKEN=`). Set optional `DIGITALOCEAN_SERVICES` if limiting tool loadout.
2. **Start service** — `docker compose -f docs/ops/docker-compose.production.yml up -d digitalocean-mcp-gateway`
3. **Verify** — `curl -I https://digitalocean.${DOMAIN}/sse`; run `tools/list` with bearer token.
4. **Client templates** — Pull updated SSE config from `integrations/mcp/clients/` (Claude Code/Desktop).
5. **Monitoring** — Add to MCP health workflow (n8n) once endpoint live.

---

## Notes / Risks

- Token scopes should exclude destructive resources not needed for day-to-day operations.
- Rate limits: default 5 000 requests/hour; coordinate with automation flows to avoid bursts.
- Long term: evaluate dedicated gateway that multiplexes DigitalOcean + other cloud providers for parity.

---

