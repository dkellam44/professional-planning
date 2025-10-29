# SoT Architecture Spec v0.2
- entity: portfolio
- level: architecture
- zone: internal
- version: v0.2
- tags: [sot, architecture, coda, github]
- source_path: /architecture/sot_architecture_v0_2.md
- date: 2025-10-17

---

## Purpose
Define how the portfolio maintains a single, versioned Source of Truth for documentation (GitHub) while exposing a live operational surface (Coda) that stays tightly synchronized through automations.

## Dual Source of Truth Model
- **GitHub (and the local clone)** stores every architecture spec, service blueprint, workflow template, checklist, and automation document. Commits and PRs are the authoritative history.
- **Coda (Founder HQ)** hosts the live execution layer—dashboards, task boards, doc templates in use, current state of projects, metrics, and automations.
- Both surfaces must reflect the same canonical information. If Coda is updated first, the change is captured and committed back to GitHub. If GitHub is updated first, the change is pushed into Coda and surfaced to operators.

## Integration Fabric
1. **MCP Gateway + Coda-MCP**  
   - Gives agents real-time access to Coda tables while referencing GitHub docs.  
   - Reduces token usage by brokering tool calls and enforcing zone permissions.
2. **n8n Automations**  
   - Hosts bidirectional flows that listen for GitHub Actions webhook events and Coda doc automations.  
   - Responsible for transforming payloads, enriching with metadata, and calling GitHub CLI/API for commits or PRs.
3. **GitHub Actions**  
   - Validates structural data (JSON/JSONL) and then pings n8n to broadcast changes into Coda.  
   - Can invoke the GitHub CLI (`gh`) with repository secrets when automation requires creating branches or PRs.
4. **Cloudflare Tunnel + Caddy**  
   - Publishes the MCP Gateway and n8n endpoints securely with Cloudflare Access enforcing user identity.

## Data Flows
| Flow | Trigger | Path | Outcome |
|------|---------|------|---------|
| GitHub → Coda | Merge or doc update in `main`; GitHub Action completes validation | Actions → n8n → Coda API | Coda receives the latest template/spec content, updates execution docs, and logs provenance. |
| Coda → GitHub | Coda doc/template updated or automation run completes | Coda automation webhook → n8n → GitHub CLI/API | n8n renders markdown/json payloads, opens or updates a PR so GitHub retains canonical history. |
| Agent Session Sync | Agent requests context | MCP Gateway → Coda-MCP + filesystem | Agent retrieves live operational state alongside GitHub versioned docs for grounded actions. |

## Authority Rules Alignment
- `/sot/authority_map_v0_2.json` defines field-level ownership so n8n knows whether to accept Coda-originated changes or require GitHub review.
- GitHub never accepts silent overwrites: every Coda-initiated change lands in a PR for review (auto-merge optional per repo policy).
- n8n maintains audit logs of both directions for traceability, stored under `logs/context_actions.csv`.

## Security Considerations
- Cloudflare Access protects public endpoints; service tokens for GitHub CLI and Coda API live in secret stores (not the repo).
- n8n flows sanitize payloads before committing to prevent leaking private Coda data into public branches.
- MCP Gateway enforces zone tags; restricted documents are never served to agents without matching clearance.

## Future Enhancements
- Evaluate native GitHub <-> Coda Packs for supplemental telemetry once two-way sync is battle-tested.  
- Add automated diff visualizations in PRs to highlight Coda-originated doc updates.  
- Layer scheduled DeepEval runs that compare GitHub templates to Coda instances to detect drift.
