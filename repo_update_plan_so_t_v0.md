- entity: architecture
- level: plan
- zone: internal
- version: v0
- tags: [sot, repo, update, planning]
- source_path: /architecture/repo_update_plan_so_t_v0.md
- date: 2025-10-28

---

# Repo Update Plan — SoT v0.2 Alignment (human + agent)

This plan maps your current repo & context system to the new SoT v0.2 specs, identifies gaps, and provides file placements + concrete tasks for both human and AI builders.

---

## A) What stays the same
- **Portfolio-first architecture** with mode-aware retrieval and ADR governance.
- **Builder workflow** remains the way to instantiate ventures/projects and enforce metadata.
- **Founder HQ (Coda)** continues as your operational ERP; GitHub holds specs/artifacts.

---

## B) What changes (SoT v0.2 adjustments)
1) **Two-hemisphere SoT split** (Coda ops / GitHub specs) becomes explicit and documented in-repo.
2) **Authority Map** becomes canonical and lives under `/sot/` with CI validation.
3) **MCP Gateway exposure** (remote) is now an official integration under `/integrations/mcp/`.
4) **n8n PR→Coda loop** is formalized as an integration with sample flow JSON and webhook contract.
5) **Cloudflare Tunnel + Caddy** routes are codified as example config under `/ops/` (not secrets).

---

## C) Place the new bundle files in your repo
> After unzipping `sot_architecture_v0_2_bundle.zip`:

**Architecture & Specs**
- `spec.md` → `/architecture/sot_architecture_v0_2.md`
- `implementation_plan.md` → `/architecture/sot_impl_plan_v0_2.md`
- `dod.md` → `/ops/quality_gates/sot_dod_v0_2.md`
- `troubleshooting.md` → `/ops/runbooks/sot_troubleshooting_v0_2.md`

**Schemas**
- `schema/authority_map.json` → `/sot/authority_map_v0_2.json`
- `schema/sot_v01.json` → `/sot/schemas/sot_v01.json`

**Ops / Integrations**
- `ops/docker-compose.example.yml` → `/integrations/mcp/docker-compose.example.yml`
- `ops/cloudflare_tunnel.example.yaml` → `/integrations/mcp/cloudflare_tunnel.example.yaml`
- `ops/github-actions-validate-data.yml` → `/.github/workflows/validate_data.yml`

**Diagram**
- `diagram/architecture.png` → `/diagrams/sot/architecture_v0_2.png`

---

## D) Clarify & extend existing docs
**1) Portfolio README** — add a short SoT section & pointers
- Link to `/architecture/sot_architecture_v0_2.md`
- Declare the **two-hemisphere split** and where the Authority Map lives
- Add `/integrations/mcp/` + `/integrations/n8n/` to the tree

**2) Founder HQ context** — align tables ↔ entities
- Add a mapping table `founder_hq_to_sot_v0_2.md` under `/integrations/coda/` listing: Pass, Decision, Task, Lesson, MetricSnapshot, Asset (metadata) → exact Coda table names and key fields.

**3) Builder Workflow** — note SoT artifacts
- Add a step that the builder should verify the Authority Map and `/data/*.jsonl` snapshots when scaffolding projects that emit data.

**4) Claude Code capabilities** — wire MCP usage
- Add a short appendix showing how Claude Code should connect to **MCP Gateway** and which Coda tables/columns are writable.

---

## E) New docs to create (thin, high-value)
1) `/integrations/mcp/README.md`
   - What: purpose, endpoints, auth (Cloudflare Access), how clients connect (Claude Code, Gemini CLI).
   - Include: quick test commands and expected responses.

2) `/integrations/n8n/README.md`
   - What: webhook URL contract, env naming, export/import of flows, rollback notes.
   - Include: a diagram of PR→n8n→Coda loop.

3) `/sot/READ_ME_FIRST.md`
   - What: SoT philosophy, Authority Map rules, schema change policy, data snapshots policy.

4) ADRs in `/decisions/`
   - `YYYY-MM-DD_mcp_transport_strategy_v01.md`
   - `YYYY-MM-DD_mcp_security_cloudflare_access_v01.md`
   - `YYYY-MM-DD_ci_channel_for_coda_updates_v01.md`
   - `YYYY-MM-DD_field_authority_policy_v01.md`

---

## F) Checks & troubleshooting (short list)
- `docker compose ps` → all green (coda-mcp, gateway, n8n, caddy)
- `cloudflared tunnel info` → HEALTHY
- `curl https://mcp.tools.../capabilities` → lists tools
- `POST /n8n-webhook` (PR merged payload) → Coda updates Decision/Metric row
- `/data/*.jsonl` committed → GH Action `validate_data` green

---

## G) Task plan (pick now)
- **Now**: Move bundle files per section C.
- **Next**: Create the four ADRs; copy minimal templates from this plan.
- **Then**: Add the Founder HQ ↔ SoT mapping table and wire the first n8n PR→Coda flow.

---

## H) Hand-off for agents
- Input: paths above + MCP endpoint URL.
- Allowed writes: only columns declared in `/sot/authority_map_v0_2.json`.
- On success: update `/ops/runbooks/sot_troubleshooting_v0_2.md` with any deltas discovered during execution.
