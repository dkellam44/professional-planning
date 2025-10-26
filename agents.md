# Agents Overview (SoT v0.2)
- entity: agents
- level: documentation
- zone: internal
- version: v0.2
- tags: [agents, operations, context]
- source_path: /agents.md
- date: 2025-10-25

---

## Purpose
Describe the agent ecosystem supporting the portfolio: planning/execution tutors, automation hosts, and their context agreements. Complements `AGENT_OPERATING_MANUAL_v0.1.md` (protocols), `SESSION_HANDOFF_YYYY-MM-DD.md` (current mission state), and `docs/LEARNING_SOT_SYNC_PRIMER_v0_1.md` (education).

## Active Agent Roles
| Role | Location | Description | Primary Context Intake | Output Obligations |
|------|----------|-------------|------------------------|--------------------|
| **Strategist (Planning Tutor)** | Claude / Chat | Guides high-level decisions, drafts briefs, curates open questions. | `ventures/*/context/planning_brief_v01.md`, ADRs, SHO. | Updated SHO, proposed MITs, decision rationale. |
| **Implementer (Execution Agent)** | Codex CLI | Applies code/config changes under mission protocol. | Project briefs, `.github/workflows/`, integrations docs. | Diffs, test results, updates to `logs/context_actions.csv`. |
| **Reviewer** | Claude / Chat | Performs QA/code review before merge or promotion. | Execution outputs, eval results, ADRs. | Review findings, sign-off or change request. |
| **Automation Orchestrator** | n8n | Runs GitHub↔Coda sync flows. | Payloads from GitHub Action, Coda automations. | Updates to Coda tables, PRs in repo, audit logs. |
| **MCP Gateway** | `https://coda.bestviable.com` (deployed 2025-10-26) | HTTP wrapper for Coda MCP server; broker for agents to access Coda during execution. | `.contextrc.yaml`, zone policies. | Tool responses with zone enforcement. |
| **Learning Tutor (planned)** | TBD | Teaches APIs/integration fundamentals using learning docs. | `docs/LEARNING_SOT_SYNC_PRIMER_v0_1.md`, session SHOs. | Lesson plans, practice tasks. |

## Startup Checklist for New Agents
1. Read `AGENT_OPERATING_MANUAL_v0.1.md` for mission protocol and inheritance rules.
2. Review latest `SESSION_HANDOFF_YYYY-MM-DD.md` and the relevant project/venture briefs.
3. Scan `decisions/*.md` for current authority rules:
   - `2025-10-26_infrastructure-syncbricks-adoption_v01.md` (SyncBricks pattern for Docker infrastructure)
   - `2025-10-26_mcp-deployment-policy_v01.md` (MCP deployment strategy)
   - `2025-10-25_sot-bidirectional-sync_v01.md` (GitHub ↔ Coda synchronization)
4. Understand automation touchpoints:
   - `.github/workflows/validate_data.yml` (payload contract)
   - `integrations/n8n/README.md` (secrets & configuration)
   - `integrations/coda/founder_hq_to_sot_v0_2.md` (table/field mapping)
5. Reference `docs/LEARNING_SOT_SYNC_PRIMER_v0_1.md` for conceptual context and tutoring hooks.
6. **For Infrastructure Work** (NEW):
   - Read `AGENT_OPERATING_MANUAL_v0.1.md` sections 13-14 (SyncBricks pattern + standards)
   - Review `docs/infrastructure/` directory for complete documentation package
   - Follow `ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md` for deployment procedures
   - All infrastructure uses SyncBricks pattern: nginx-proxy (auto-discovery), acme-companion (auto SSL), token-based Cloudflare Tunnel, two-network design
7. Check `logs/context_actions.csv` for recent actions and audit trail.

## Mission Flow (Planning → Execution → Review)
1. **Planning Tutor** reviews SHO + briefs, updates MITs, flags decisions.
2. **Implementer** receives approved plan, executes via Codex CLI mission protocol.
3. **Automation Orchestrator** syncs documentation between GitHub and Coda post-merge.
4. **Reviewer** validates outputs, triggers eval run if needed.
5. **Learning Tutor** (optional) creates lessons for the human operator to build skill depth.

## Coordination & Logging
- All agents append actions to `logs/context_actions.csv` (timestamp, actor, summary, source_path).
- When automation flows run, n8n should log webhook invocation details and PR URLs in the same log or Coda audit columns.
- SHO TTL is 3 days; promote durable learnings to venture/portfolio contexts per TTL policy.

## Completed (2025-10-26)
- ✅ Infrastructure deployment documentation package (5 files, 18,000+ words)
- ✅ Production docker-compose.yml with SyncBricks pattern (7-service stack)
- ✅ Security fix: Moved Cloudflare tunnel from laptop to droplet (zero personal IP exposure)
- ✅ Architecture decision: Adopted SyncBricks pattern (nginx-proxy auto-discovery + acme-companion SSL)
- ✅ Network isolation: Two-network design (proxy + syncbricks networks)
- ✅ MCP Gateway: Deployed at https://coda.bestviable.com (ready for Claude Code integration)

## Pending Enhancements
- Stand up MCP time server for consistent timestamp access (`mcp-server-time/`).
- Deploy services to DigitalOcean droplet (token acquisition + follow QUICKSTART).
- Finalize n8n credential bindings and webhook security (Cloudflare Access vs. HMAC).
- Add monitoring hooks (Slack or PagerDuty) for n8n flow failures.
- Populate Coda column mapping in GitHub→Coda flow before enabling automation.
- Set up infrastructure monitoring dashboard (certificate expiry alerts, tunnel health)
