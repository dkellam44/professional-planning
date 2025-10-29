This is depricated. Superceded by ....?

# MCP Gateway Integration (Remote)
- entity: portfolio
- level: integration
- zone: internal
- version: v0.2
- tags: [mcp, gateway, integrations, sot]
- source_path: /integrations/mcp/README.md
- date: 2025-10-17

---

## Purpose
Provide a secure, centralized MCP Gateway so agents can read GitHub-hosted documentation while querying live Coda data.

## Endpoints
- `https://mcp.tools.bestviable.com` — MCP Gateway (proxied through Caddy + Cloudflare Tunnel).
- `https://n8n.tools.bestviable.com` — n8n automation surface (webhook targets for GitHub Actions and Coda automations).

All endpoints are protected by Cloudflare Access; credentials are managed outside the repository.

## Operational Notes
- Gateway authenticates agents, enforces zone tags, and broker calls to Coda-MCP.
- Agents should pull the latest repo state locally before executing write operations so GitHub remains the documentation SoT.

## Quick Test
```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  https://mcp.tools.bestviable.com/capabilities
```
Expected response: JSON payload enumerating available MCP tools (including Coda tables for live operational data).

## Related Docs
- `architecture/sot_architecture_v0_2.md` — end-to-end topology.
- `ops/runbooks/sot_troubleshooting_v0_2.md` — health checks and recovery steps.
