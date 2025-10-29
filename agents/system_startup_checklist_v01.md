- entity: checklist
- level: internal
- zone: internal
- version: v01
- tags: [startup, onboarding, agents, sot, infrastructure, coda]
- source_path: /context/startup/system_startup_checklist_v01.md
- date: 2025-10-28

---

# Stateless Agent Startup Checklist (Portfolio v0.4)

Use this checklist at the start of any new agent session (human or AI) so work begins with the correct context, SoT alignment, and operating rhythm. Follow the sections in order; log actions in `logs/context_actions.csv` where relevant.

---

## 1. Quick Orientation (5 min)
1. **START HERE: Read CURRENT_FOCUS.md**
   - `agents/CURRENT_FOCUS.md` (5-minute read for all new sessions).
   - Gets you oriented immediately: current priorities, business stage, infrastructure status, links to everything.
2. **Scan the latest Session Handoff**
   - `SESSION_HANDOFF_2025-10-28_v1.md` (or newest).
   - Confirm `next_3_MITs`, open questions, blockers, TTL.
3. **Check the Work Queue**
   - `inbox/` and relevant `context/playbooks/*.md` (e.g., `system_sot_consolidation_playbook_v01.md`, `coda_mcp_gateway_upgrade_plan_v01.md`).
   - Note current phase and human checkpoints.

---

## 2. Source of Truth Health (5 min)
1. **Verify repo cleanliness**
   - `git status` (expect clean or planned diffs).
   - Confirm branch (default `main` unless otherwise specified).
2. **Confirm SoT layers**
   - `architecture/repo_update_plan_so_t_v0.md` for authoritative plan.
   - `sot/authority_map_v0_2.json` matches current scope (no unexpected deltas).
3. **Review latest ADRs**
   - Especially recent entries (e.g., `2025-10-28_cloudflare-proxy-trust-config_v01.md`, pending `repo_sync_policy`).

---

## 3. Infrastructure Snapshot (5 min)
1. **Read droplet state sheet**
   - `docs/infrastructure/droplet_state_2025-10-28.md` (or newest).
   - Note service versions, sync method (manual `scp`, etc.).
2. **Verify remote status (if needed)**
   - Optional quick check: `ssh root@tools` → `docker compose -f docker-compose.production.yml ps`.
   - Ensure `https://n8n.bestviable.com` and `https://coda.bestviable.com/sse` responded recently (see Session Notes).

---

## 4. Initiative Alignment (10 min)
1. **Coda MCP Upgrade**
   - Review `context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md`.
   - Confirm phase and outstanding tasks (e.g., repo fork, Docker rebuild).
2. **SoT Consolidation**
   - Review `context/playbooks/system_sot_consolidation_playbook_v01.md`.
   - Identify which phase is next (repo orientation, authority docs, sync policy, cadences).
3. **Coda Interface Builds**
   - Check `integrations/coda/founder_hq_to_sot_v0_2.md` (current mapping).
   - Note gaps/opportunities for new dashboards or automation hooks.

---

## 5. Decide Today’s Focus (with human approval)
1. Draft a short plan referencing playbooks and session handoff.
2. Request approval if editing code/config (Claude Code protocol).
3. Update the Session Handoff (if objectives/MITs change) before executing.

---

## 6. Execution Guardrails
- **Claude Code Protocol:** PLAN → CONFIRM → APPLY → DIFF → TEST → COMMIT → LOG.
- **Logging:** Append entries to `logs/context_actions.csv` for meaningful actions (doc updates, deployments, ADRs).
- **Documentation:** Update playbooks/handbooks immediately after progress; promote key learnings to SoT docs.
- **Zones:** Respect metadata headers and `zone` inheritance policy when editing/creating files.

---

## 7. Wrap-Up / Handoff
1. Update relevant playbooks with phase progress.
2. Refresh `SESSION_HANDOFF_*` with new MITs, decisions, blockers.
3. Note open questions or next steps for the human operator.

---

**TTL:** Review and update this startup checklist after major process changes or by **2025-11-15**. Update `version` when materially revised.
