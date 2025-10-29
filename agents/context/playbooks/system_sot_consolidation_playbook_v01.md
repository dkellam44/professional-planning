- entity: plan
- level: internal
- zone: internal
- version: v01
- tags: [sot, governance, workflow, infrastructure, documentation]
- source_path: /context/playbooks/system_sot_consolidation_playbook_v01.md
- date: 2025-10-28

---

# Playbook — Portfolio SoT Consolidation & Sync Strategy

**Purpose.** Align the working repo, droplet stack, and Coda workspace with the SoT v0.2 architecture so agents (and future you) always know where authoritative truth lives, how it flows, and how to update it.

This playbook synthesizes the original `repo_update_plan_so_t_v0.md`, the Founder HQ context, and today’s infrastructure work. Follow it to move from “prelaunch” ambiguity to a clean two-hemisphere model (GitHub specs ↔ Coda operations) with a documented sync path.

---

## 0. References
- `architecture/architecture-spec_v0.3.md` (human spec)
- `architecture/repo_update_plan_so_t_v0.md` (imported from Downloads)
- `context/sessions/2025-10-28_n8n-coda-production-notes.md`
- `SESSION_HANDOFF_2025-10-28_v1.md`
- `decisions/2025-10-28_cloudflare-proxy-trust-config_v01.md`
- Founder HQ context: `founder-hq-v042-context.txt`
- Current infrastructure configs: `ops/docker-compose.production.yml`, `ops/Dockerfile.coda-mcp-gateway`

Keep these open while you execute; log work in `logs/context_actions.csv`.

---

## 1. Goals & Deliverables
1. **Unified Orientation** — All critical specs (architecture, Founder HQ, SoT plan) live under `portfolio/` with links from a single overview doc.
2. **Documented State** — Fresh droplet-state worksheet + Coda↔GitHub authority map so agents start with clear context.
3. **Sync Policy** — Written policy and ADR covering how local → GitHub → droplet changes propagate (manual today, automation later).
4. **Legacy Hygiene** — Clarify or archive `~/workspace` root folders and any stray docs so SoT boundary is obvious.
5. **Launch-ready Cadence** — Draft cadence options (manual, scripted, automated) and pick an interim approach.

Definition of done in §7.

---

## 2. Phase 0 — Baseline Inventory (≈30 min)
**Owner:** Human (optional agent assist)
1. Review `repo_update_plan_so_t_v0.md`; highlight items already complete vs pending.
2. Create a short note in `/context/sessions/` (e.g., `2025-10-28_sot-alignment-kickoff.md`) capturing current pain points.
3. Inventory current Git remotes:  
   `git remote -v` (local repo)  
   Decide whether droplet repo mirrors GitHub (if not, note it).
4. Snapshot existing droplet compose revision:  
   `docker compose -f docker-compose.production.yml images` (log into `/logs/ops/`).

---

## 3. Phase 1 — Repo Orientation Cleanup (≈45 min)
**Owner:** Agent + Human review
1. Move the architecture spec & Founder HQ context inside repo (if not already). Suggested layout:
   - `architecture/architecture-spec_v0.3.md` (existing)
   - `context/system_overview_v01.md` — new doc linking to architecture spec, Founder HQ, latest session handoff, infrastructure state, and MCP plan.
   - `context/founder_hq_v042.md` — copy/paste the TXT into Markdown with metadata header.
2. Update `README.md` front section:
   - Introduce “System Overview” bullet with link to the new doc.
   - Summarize SoT hemispheres (GitHub specs / Coda operations) and point to the Authority Map.
3. Add README stubs (or archive) for `~/workspace/apps`, `infra`, `libs`, `mcp`. If they’re retired, move them under `portfolio/z_archive/` or delete after copying anything important.

---

## 4. Phase 2 — Authority & Mapping Docs (≈60 min)
**Owner:** Agent (docs) + Human validation
1. Create or update `/integrations/coda/founder_hq_to_sot_v0_2.md`:
   - Table names, primary keys, key fields, zone classification.
   - Note any tables not yet mirrored in GitHub.
2. Add `/docs/infrastructure/droplet_state_2025-10-28.md`:
   - Compose services, exposed domains, `.env` location, backup strategy, manual sync steps.
   - Reference the Cloudflare tunnel token doc and the MCP plan.
3. Review `/sot/authority_map_v0_2.json`; ensure new tables/fields (e.g., MCP config, droplet notes) reflect actual authority. If adjustments needed, edit JSON and run `jq` lint or `npm test` if available.
4. Log these updates in `logs/context_actions.csv` and mention in session handoff.

---

## 5. Phase 3 — Sync Strategy Definition (≈45 min)
**Owner:** Human (decision) with agent drafting ADR
1. Draft `decisions/2025-10-28_repo_sync_policy_v01.md` covering:
   - Current reality (manual `scp` from laptop → droplet; GitHub remote not yet used for droplet).
   - Risks (drift, missing commits).
   - Interim policy (e.g., “Changes originate in Git/Mac; immediately push to GitHub; deploy to droplet via `scp`; droplet never edits directly.”).
   - Future plan (set up Git remote on droplet, or automation via n8n/GitHub Actions).
2. Append the policy to `context/system_overview_v01.md`.
3. If choosing to keep droplet repo independent for now, record manual steps in `/docs/infrastructure/droplet_state_2025-10-28.md`.
4. Optional: create a TODO entry in `inbox/` for “Automate repo sync (Git pull on droplet or rsync pipeline)”.

---

## 6. Phase 4 — Cadences & Automation Hooks (≈60 min)
**Owner:** Human + agent pair
1. Define target cadences in the system overview doc:
   - Repo → GitHub push frequency (per change / daily).
   - GitHub → Coda sync via n8n (currently manual? plan future automation).
   - Infrastructure audits (monthly?).
2. Update `ops/quality_gates/sot_dod_v0_2.md` if cadence impacts Definition of Done.
3. For each cadence, decide whether to automate now or later. Document in a checklist table within the overview.
4. If immediate automation desired, create tickets/notes in `integrations/n8n/README.md` or `integrations/mcp/README.md` once those files exist.

---

## 7. Definition of Done
- `context/system_overview_v01.md` published, linking architecture spec, Founder HQ, droplet state, MCP plan, and latest SHO.
- `integrations/coda/founder_hq_to_sot_v0_2.md` and `docs/infrastructure/droplet_state_2025-10-28.md` created/updated.
- `decisions/2025-10-28_repo_sync_policy_v01.md` (or similar) committed.
- README reflects two-hemisphere SoT and new orientation.
- Legacy directories either documented or archived.
- Session handoff + action log updated.
- Optional stretch: capture a quick diagram (Mermaid or PNG) illustrating flow between Mac → GitHub → droplet → Coda → n8n.

---

## 8. Stretch / Next Iterations
- Implement droplet Git remote and a `deploy.sh` script that `git pull`s then runs `docker compose up`.
- Stand up n8n workflow to write GitHub diff summaries back into Coda or Founder HQ.
- Add CI guardrails (lint authority map, validate YAML headers, ensure droplet state doc updated when compose changes).
- Create a “state refresh” checklist triggered by `SESSION_HANDOFF_*` updates to keep documentation from drifting.

---

**TTL:** Review this playbook after the first full cycle or by **2025-11-15**, whichever comes first. Update version number if major process changes occur.
