# Implementation Plan (SoT v0.2)
- entity: portfolio
- level: implementation-plan
- zone: internal
- version: v0.2
- tags: [sot, implementation, coda, github, n8n]
- source_path: /architecture/sot_impl_plan_v0_2.md
- date: 2025-10-17

---

1. **Bootstrap Infrastructure**
   - Use `integrations/mcp/docker-compose.example.yml` as the base to launch MCP Gateway, Coda-MCP, n8n, and Caddy.
   - Confirm services reach required secrets via `.env` (GitHub PAT/CLI token, Coda API token, Cloudflare credentials).
2. **Expose Secure Endpoints**
   - Apply `integrations/mcp/cloudflare_tunnel.example.yaml` and configure Cloudflare Access groups for operators and automations.
   - Register endpoint URLs in Coda (for automations) and GitHub (for workflow webhooks).
3. **Configure Bidirectional Sync**
   - GitHub → Coda: extend `.github/workflows/validate_data.yml` so the post-validation step calls n8n with repo metadata; n8n fetches updated docs/templates and PATCHes corresponding Coda tables/docs.
   - Coda → GitHub: build n8n flow listening to Coda automation webhooks, render markdown/json assets, and use `gh pr create` (or REST API) to open/update PRs targeting `chore/sot-auto-sync/*`.
4. **Agent Integration**
   - Register MCP Gateway in Claude Code CLI (or other agents) so they can read GitHub docs locally and call Coda tools for current-state checks.
   - Verify zone-aware retrieval by requesting restricted docs (should be blocked) vs. internal docs (allowed).
5. **Quality Gates & Monitoring**
   - Ensure `sot/authority_map_v0_2.json` fields align with n8n logic—changes from disallowed systems should be rejected with audit entries.
   - Add health monitors in n8n for failed sync attempts; route alerts to the operations channel.
6. **Verification & Handoff**
   - Run end-to-end test: edit a workflow template in GitHub (expect push into Coda) and update a Coda template (expect PR back to GitHub).
   - Document runbook steps for common failures in `ops/runbooks/sot_troubleshooting_v0_2.md`.
