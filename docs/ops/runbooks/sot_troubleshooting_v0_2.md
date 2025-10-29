# SoT v0.2 Troubleshooting Runbook
- entity: portfolio
- level: runbook
- zone: internal
- version: v0.2
- tags: [runbook, troubleshooting, sot, sync]
- source_path: /ops/runbooks/sot_troubleshooting_v0_2.md
- date: 2025-10-17

---

## 1. Infrastructure Health
- `docker ps` → all containers (`mcp-gateway`, `coda-mcp`, `n8n`, `caddy`) up.
- `cloudflared tunnel info` → status `HEALTHY`; if not, restart tunnel and validate Access token.
- `curl https://mcp.tools.bestviable.com/capabilities` → expect JSON describing MCP tools.

## 2. GitHub → Coda Sync Fails
- Review latest run of `.github/workflows/validate_data.yml`; ensure schema validation passed and webhook step succeeded.
- In n8n, open the GitHub→Coda flow execution. Confirm payload includes branch, commit SHA, and document path.
- Verify Coda API credentials (stored in n8n) have write access to the target doc/table.
- If Coda refuses the update, check `sot/authority_map_v0_2.json`—field flagged as GitHub-owned should only be updated from GitHub.

## 3. Coda → GitHub Sync Fails
- Check Coda automation logs for the webhook invocation status; re-run if necessary.
- In n8n, inspect the Coda→GitHub flow to confirm it rendered markdown and invoked `gh pr create` (or REST API).
- Ensure the GitHub token/CLI in n8n has `repo` scope and can push to `chore/sot-auto-sync/*` branches.
- If PR creation succeeds but content is stale, confirm Coda sent the latest version (automation must run after doc edits are saved).

## 4. Agent Issues
- Agent cannot see updated docs: pull latest Git changes locally (`git pull`) and re-run the MCP capability check.
- Agent write attempt blocked: verify zone tag of target document; restricted content requires elevated credentials.

## 5. Recovery Actions
- For stuck flows, manually trigger re-sync by re-running the GitHub workflow or replaying the n8n execution.
- Capture diagnostics in `logs/context_actions.csv` to retain audit trails.
- Escalate to infrastructure owner if Cloudflare Access or credential rotation is required.
