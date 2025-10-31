---
- entity: plan
- level: internal
- zone: internal
- version: v01
- tags: [mcp, onboarding, cloudflare, tier1]
- source_path: /agents/context/playbooks/cloudflare_onboarding_v01.md
- date: 2025-10-29
---

# MCP Server Onboarding — Cloudflare Wrapper

**Objective**: Expose Cloudflare MCP services through our Tier 1 gateway using `mcp-remote`, giving every client uniform access to docs, observability, Workers bindings, etc.

**Date Started**: 2025-10-29  
**Tier Assignment**: Tier 1 — Remote Transport (droplet-hosted wrapper)  
**Status**: In Progress (build complete; awaiting remote selection)

---

## 0. Pre-Flight Checklist

- Chosen remote? (e.g., `https://docs.mcp.cloudflare.com/mcp` or observability) — ⏳
- Auth needed? (API token scopes vary by service: DNS, Workers, Logpush, etc.) — ⏳
- Client coverage — Claude Code/Desktop, future IDEs, web agents, n8n — ✅

---

## Execution Snapshot

| Phase | Status | Notes |
|-------|--------|-------|
| Wrapper assets | ✅ | `docs/ops/Dockerfile.cloudflare-mcp-gateway`, entrypoint script created |
| Local build | ✅ | `cloudflare-mcp-gateway:local` built using Node + mcp-remote |
| Compose/Droplet build | ✅ | Image built on droplet (awaiting runtime vars) |
| Runtime config | ⏳ | Need `CLOUDFLARE_REMOTE_URL` (+ optional `CLOUDFLARE_API_TOKEN`, headers) |
| Client templates | ✅ | Added SSE stanzas to Claude Code/Desktop guides |
| Monitoring | ⏳ | Add to MCP health check once endpoint active |

---

## Next Actions

1. Pick initial remote (recommend start with docs or observability). Set `CLOUDFLARE_REMOTE_URL` in droplet `.env`.
2. Add auth token if required (`CLOUDFLARE_API_TOKEN`) or custom headers via `CLOUDFLARE_HEADERS` (semicolon-separated `Header: Value`).
3. `docker compose -f docs/ops/docker-compose.production.yml up -d cloudflare-mcp-gateway`
4. Validate with `curl -X POST https://cloudflare.${DOMAIN}/sse -d '{"method":"tools/list"}'` (add auth header if needed).
5. Update catalog entry with status and remote once live.

---

## Notes / Open Questions

- Running multiple Cloudflare remotes may require duplicate services or future unified gateway.
- OAuth flows need stable `CLOUDFLARE_CALLBACK_PORT` if remote prompts sign-in (set env and open firewall if needed).
- Consider rate limits per remote service; document in `DEPLOYMENT.md` when known.

