# ADR: SoT v0.2 Bidirectional Sync Strategy
- entity: portfolio
- level: decision
- zone: internal
- version: v01
- tags: [adr, sot, coda, github, automation]
- source_path: /decisions/2025-10-25_sot-bidirectional-sync_v01.md
- date: 2025-10-25

---

## Status
Accepted — 2025-10-25

## Context
- The portfolio now ships SoT v0.2 assets that clarify GitHub as the canonical documentation Source of Truth while Coda (Founder HQ) reflects live execution state.
- Prior documentation implied a split (GitHub for specs/artifacts, Coda for operations) but did not require that all operational docs/templates be versioned in GitHub or describe how updates flow between surfaces.
- Infrastructure bundle includes MCP Gateway, n8n automation server, GitHub Actions workflow, and Cloudflare Tunnel scaffolding.

## Decision
1. **Authority**  
   - GitHub (and the local repo) remains the authoritative SoT for all documentation: architecture specs, service blueprints, process/workflow templates, automation guides.  
   - Coda stores the live, mutable execution state (task status, current metrics, in-flight workflow instances).
2. **Bidirectional Sync**  
   - GitHub → Coda: GitHub Actions validates structured data and notifies n8n, which publishes updated docs/templates to Coda using stored API credentials.  
   - Coda → GitHub: Coda automation webhooks trigger n8n to render markdown/JSON payloads and create or update PRs (via GitHub CLI/API) so GitHub records every operational change.
3. **Review & Audit**  
   - All Coda-originated changes land in reviewable PRs (`chore/sot-auto-sync/*`) to prevent silent overwrites.  
   - n8n logs both directions to `logs/context_actions.csv`; authority rules in `sot/authority_map_v0_2.json` guard against unauthorized field updates.
4. **Agent Access**  
   - MCP Gateway remains the preferred interface for agents to reconcile GitHub documentation with live Coda data during execution.

## Consequences
- Documentation edits must ship through Git commits/PRs even if authored inside Coda; operators should expect review cycles.  
- n8n becomes a critical dependency; downtime pauses synchronization.  
- Requires secure management of GitHub and Coda tokens in automation infrastructure.  
- Future enhancements (e.g., GitHub Pack for Coda) can supplement telemetry but must respect GitHub-first authority.
