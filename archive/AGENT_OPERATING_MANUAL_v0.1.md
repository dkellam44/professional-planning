# Agent Operating Manual (v0.1) — Context Architecture

**Purpose.** This manual tells any AI agent (or human) how to build and maintain the context system across Portfolio → Venture → Project layers. Pair this with `agents.md` for role definitions and startup checklist.

---

## 1) Inheritance Model (do not clone SoT)
- **Portfolio root** is the **single Source‑of‑Truth (SoT)** for schemas, prompts, eval harness, global ADRs, and diagrams.
- **Venture** and **Project** layers only add thin overlays (briefs, playbooks, project facts) and **inherit** the SoT.
- Never copy `/sot` or `/prompts` into ventures/projects; **reference them** via `.contextrc.yaml`.

## 2) Required Files at Portfolio Root
- `architecture-spec_v0.2.md` — human spec (canonical instructions)
- `/sot/context_schemas_v01.yaml` — machine schema
- `/prompts/context_patterns.jsonl` — reusable prompt patterns
- `/eval/run_eval_stub.py` & `/eval/eval_set_example.csv` — eval harness
- `/decisions/*.md` — ADRs (global policies)
- `/context/*` — global briefs/SOPs
- `/logs/context_actions.csv` — action trail

## 3) Required Files in Venture
- `/ventures/<venture>/context/venture_brief.md` (positioning, ICP, OKRs)
- `/ventures/<venture>/context/playbooks/*`
- `/ventures/<venture>/.contextrc.yaml` (points up to portfolio SoT/Prompts/Eval)
- `/ventures/<venture>/decisions/*.md` when policy deviates from global

## 4) Required Files in Project
- `/ventures/<venture>/projects/<project>/context/planning_brief_v01.md`
- `/ventures/<venture>/projects/<project>/context/execution_brief_v01.md`
- `/ventures/<venture>/projects/<project>/context/review_brief_v01.md`
- `/ventures/<venture>/projects/<project>/context/SHO.json` (Session Handoff Object)
- `.contextrc.yaml` (short path pointers relative to project)
- `/decisions/*.md` for scope/approval changes
- `/logs/*` (optional, rolled‑up weekly)

## 5) Session Handoff Object (S.H.O.) contract
```json
{
  "objective": "string (single concrete goal)",
  "context_refs": [{"id":"ulid","path":"relative/path"}],
  "decisions_since_last": ["..."],
  "open_questions": ["..."],
  "blockers": ["..."],
  "next_3_MITs": ["..."],
  "deadline": "YYYY-MM-DD",
  "ttl_days": 3
}
```
- Inject S.H.O. at the start of any planning chat and each Claude Code mission.
- **Do not** proceed with code changes until the plan is acknowledged by the human.

## 6) Claude Code Mission Protocol (strict)
1. **PLAN**: Propose changes w/ file list, diffs preview, and test plan.
2. **CONFIRM**: Wait for explicit approval.
3. **APPLY**: Make small, atomic changes.
4. **DIFF**: Show diffs; link to files.
5. **TEST**: Run the test plan; summarize results.
6. **COMMIT**: Commit with conventional message; reference ticket/ADR.
7. **LOG**: Append an entry to `/logs/context_actions.csv`.

## 7) Retrieval Defaults
- Chunking: heading + semantic (~200–400 tokens), parent/child links.
- Strategy: hybrid (BM25 + embeddings) → cross‑encoder reranker; `k_in=30 → k_out=6–8`.
- Metadata on every MD: `entity, level, zone, version, tags[], source_path, date`.
- Answer contract: always provide citations (`path#section|line`).

## 8) Mode‑Aware Briefs
- Planning = breadth & trade‑offs; Execution = precise constraints; Review = trace & decisions.
- Use the provided templates; do **not** mix modes in one file.

## 9) TTL / Promotion
- Session notes TTL 14–30d; promote durable learnings to venture playbooks.
- Project briefs expire E+90d; promote evergreen items to venture → portfolio.
- Record promotions with ADRs.

## 10) Evaluation Gate
- Weekly eval run (RAGAS or DeepEval). Gate blocks deployment if average < 0.80.
- Default optimization framework: **DSPy**. TypeScript alternative: **Ax**.

## 11) Security & Zones
- Zones: `public | internal | private | restricted`. Redact before publishing.
- Secrets never appear in prompts or MD. Use environment/secret store for tokens.

## 12) Acceptance for "Good Build"
- All required files present at each layer.
- Briefs include metadata headers and correct mode content.
- Eval gate passes (≥ 0.80). Logs updated. No vendor‑locked memory used as SoT.

---

## 13) SyncBricks Infrastructure Pattern (ADOPTED 2025-10-26)

For infrastructure projects (Docker-based multi-service deployments), adopt the SyncBricks pattern:

### Core Components
1. **nginx-proxy** - Auto-discovery reverse proxy
   - Monitors `/var/run/docker.sock` for service changes
   - Reads `VIRTUAL_HOST` environment variable from service labels
   - Dynamically generates nginx config (no manual Caddyfile)
   - Scales trivially to 10+ services

2. **acme-companion** - Automatic SSL certificate management
   - Watches for `LETSENCRYPT_HOST` labels
   - Requests Let's Encrypt certificates automatically
   - Renews 30 days before expiry (no manual intervention)
   - Updates nginx config on renewal

3. **Token-Based Cloudflare Tunnel** - Secure external connectivity
   - Tunnel token passed in docker-compose environment (not config files)
   - Simpler token rotation
   - Better for containerized environments
   - Hides all internal IPs from internet

4. **Two-Network Design** - Security isolation
   - `proxy` network: public-facing services only
   - `syncbricks` network: backend services (databases, internal APIs)
   - Database NOT accessible from proxy layer
   - Network-level security boundary

### Adding a New Service
```yaml
# 1. Add service to docker-compose.yml
services:
  new-service:
    image: new-service:latest
    networks:
      - proxy              # IMPORTANT: attach to proxy network
      - syncbricks         # Optional: if needs backend access
    environment:
      - VIRTUAL_HOST=new-service.bestviable.com
      - LETSENCRYPT_HOST=new-service.bestviable.com
    labels:
      - "com.github.jrcs.letsencrypt_nginx_proxy_companion.main=new-service.bestviable.com"

# 2. Deploy
docker-compose -f docker-compose.production.yml up -d

# 3. Done! nginx-proxy auto-discovers via docker.sock
#    acme-companion auto-generates SSL certificate
#    Service available at https://new-service.bestviable.com immediately
```

### When to Use
✅ **Use SyncBricks if:**
- Multiple services needing external HTTPS access
- Services may scale or change frequently
- Want automatic SSL management
- Need to hide internal IPs (security isolation)
- No manual reverse proxy config desired

❌ **Don't use if:**
- Single monolithic service only
- Internal-only services (no external access)
- Kubernetes already adopted
- IP/port-based routing required

### Reference Implementation
See `/portfolio/docs/infrastructure/syncbricks_solution_breakdown_v1.md` for complete pattern explanation.

See `/portfolio/ops/docker-compose.production.yml` for production configuration.

---

## 14) Infrastructure Documentation Standards

For infrastructure projects, maintain these documentation artifacts:

### Required Files
1. **State Analysis** - Current vs Target comparison
   - Location: `/docs/infrastructure/infrastructure_state_comparison_v1.md`
   - Shows before/after metrics, security improvements, risks

2. **Solution Design** - Pattern explanations
   - Location: `/docs/infrastructure/<pattern>_solution_breakdown_v1.md`
   - Explains each component, data flows, configuration

3. **Deployment Procedure** - Step-by-step guide
   - Location: `/docs/infrastructure/droplet_migration_procedure_v1.md`
   - Phases, health checks, troubleshooting, rollback

4. **Operations Guide** - Token setup, monitoring, maintenance
   - Location: `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md`
   - How to obtain, configure, rotate, monitor

5. **Full Analysis** - Decision process documentation
   - Location: `/docs/infrastructure/<system>_full_analysis_v1.md`
   - Problem statement, alternative evaluation, decision rationale
   - Include conversation transcripts for future learning

6. **Quick Reference** - One-page deployment guide
   - Location: `/ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md`
   - Pre-deployment checklist, configuration, validation
   - Estimated time, troubleshooting quick links

### Documentation Standard
All files include metadata headers:
```markdown
- entity: infrastructure
- level: documentation
- zone: internal
- version: vNN
- tags: [infrastructure, ...]
- source_path: /docs/infrastructure/...
- date: YYYY-MM-DD
```

---

## 15) Session Shutdown Protocol

**Purpose:** Canonical procedure for ending any agent session and ensuring continuity for the next agent.

**Time estimate:** 5–10 minutes

**When to use:** At the end of every session (human-initiated or token-limit reached)

---

### Shutdown Checklist (Required)

Complete these steps in order before ending the session:

#### 1. Update Active Playbooks
- If working from a playbook (e.g., `/agents/context/playbooks/*.md`):
  - Update phase progress (mark completed steps, note blockers)
  - Add learnings or adjustments to approach
  - Update estimated time remaining

#### 2. Update or Create Session Handoff
- File: `/agents/context/sessions/SESSION_HANDOFF_YYYY-MM-DD_v#.md`
- Required fields:
  - **What We Did Today:** Summary of accomplishments
  - **Next 3 MITs:** Most Important Tasks for next session
  - **Decisions Made:** Any choices that affect future work
  - **Open Questions:** Blockers or uncertainties
  - **Status:** GREEN/YELLOW/RED based on progress
  - **TTL:** When this handoff expires (typically 3–14 days)

#### 3. Update CURRENT_FOCUS.md (If Priorities Shifted)
- File: `/agents/CURRENT_FOCUS.md`
- Update if:
  - Business priorities changed (e.g., client signed, blocker removed)
  - Infrastructure status changed (services down/restored)
  - New high-priority work emerged
  - Deferred items should now be active
- Update date in metadata header

#### 4. Log Context Actions (If Significant Work)
- File: `/logs/context_actions.csv`
- Log if you:
  - Created or updated documentation (ADRs, playbooks, specs)
  - Made infrastructure changes (deployed services, config changes)
  - Made architecture decisions
  - Promoted session notes to durable docs
- Format: `date,actor,action,entity,notes`

#### 5. Communicate Next Steps to Human
- Summarize:
  - What was completed
  - What's ready for next session (with links)
  - Any blockers or questions requiring human input
  - Recommended next actions
- Be explicit about git state (commits ready to push, uncommitted changes, etc.)

---

### Conditional Updates (As Needed)

#### Update Venture Documents
- If working in `/ventures/[venture-name]/`:
  - Update offer specs if definitions changed
  - Update pipeline tracker if prospects changed
  - Update engagement logs if client work occurred

#### Promote Session Notes (Per TTL Policy)
- If session notes contain durable learnings:
  - Promote to relevant playbook
  - Promote to venture context docs
  - Promote to architecture specs
- See Section 9 (TTL/Promotion) for criteria

#### Create or Update ADRs
- If architecture decisions were made:
  - Create new ADR in `/agents/decisions/YYYY-MM-DD_topic_v01.md`
  - Update related ADRs with cross-references
  - Update architecture docs that the decision affects

---

### Quick Shutdown (Minimal Path)

If time is limited or work was exploratory:

1. **Create brief session handoff** (3 sentences: did X, next do Y, blocker Z)
2. **Tell human next steps** (1–2 sentences)
3. **Commit work if any files changed** (with clear message)

Defer detailed playbook updates to next session if needed.

---

### Relationship to Other Documents

**This section (Operating Manual) = Authoritative reference**
- Complete checklist of what to update
- Defines required vs. conditional steps
- Technical contracts (S.H.O. format, log format)

**CURRENT_FOCUS.md = Quick reference**
- 3-step shutdown: "Update playbooks, update CURRENT_FOCUS if needed, tell human"
- Points to this section for details

**system_startup_checklist_v01.md Section 7 = Procedural guide**
- Operationalizes this checklist as "Wrap-Up / Handoff"
- Should reference this section as canonical source

---

### Common Mistakes to Avoid

❌ **Don't skip the Session Handoff** – Next agent will be blind to recent work
❌ **Don't leave uncommitted changes** – Work can be lost between sessions
❌ **Don't update CURRENT_FOCUS for minor priority changes** – Reserve for significant shifts only
❌ **Don't create handoffs without TTL** – They'll accumulate and create confusion
❌ **Don't forget to tell the human** – They need to know what state you're leaving things in

---

**Quick Start for Agents**
1) Read `.contextrc.yaml` to find the portfolio SoT/Prompts/Eval.
2) Ensure mode (PLANNING/EXECUTION/REVIEW) and select the brief template.
3) Apply Claude Code Mission Protocol for any code change.
4) Update logs and, if durable, promote notes per TTL rules.
5) **At session end, follow Section 15 (Session Shutdown Protocol)** for complete checklist.
6) **For infrastructure work**: Follow SyncBricks pattern (Section 13) + maintain documentation standards (Section 14).
