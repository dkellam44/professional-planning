# Definition of Done — SoT v0.2
- entity: portfolio
- level: quality-gate
- zone: internal
- version: v0.2
- tags: [sot, dod, quality, sync]
- source_path: /ops/quality_gates/sot_dod_v0_2.md
- date: 2025-10-17

---

- Docker stack (MCP Gateway, Coda-MCP, n8n, Caddy) starts cleanly via example compose file.
- Cloudflare Tunnel is healthy and Access policies enforce authenticated usage.
- GitHub Actions pipeline validates `/data/*.jsonl` against `sot/schemas/sot_v01.json` **and** successfully notifies n8n.
- n8n GitHub → Coda flow updates the relevant Coda doc/template with latest GitHub content.
- n8n Coda → GitHub flow accepts a Coda automation webhook, opens/updates a PR using GitHub CLI/API, and attaches provenance metadata.
- Authority rules from `sot/authority_map_v0_2.json` are respected—unauthorized system edits are rejected with audit log entries.
- MCP clients can list tools, read operational state, and observe that GitHub docs remain canonical (PR diff matches Coda change).
