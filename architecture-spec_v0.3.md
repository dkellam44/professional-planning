# AI-Ready Context Architecture — Build Prompt v0.3

## Objective
Design and implement an AI-ready context system for a solo operator: plan in chat; execute with Claude Code; keep memory **portable**, **verifiable**, and **mode-aware**.

## Constraints & Environment
- Primary tools: Claude (chat + **Claude Code CLI**), GPT where helpful, Google Drive, GitHub.
- Claude Code follows an explicit **PLAN → CONFIRM → APPLY → DIFF → TEST → COMMIT → LOG** loop.
- Interfaces now: files + chat; later: Coda/Notion + n8n.
- Zones: `public`, `internal`, `private`, `restricted` (PII/client).

## Source-of-Truth (SoT) Taxonomy
- Entities (+ PKs, fields, examples): Venture, Offer, Engagement, Program, Project, Sprint, Task, Deliverable, Result, Organization, Person, Touchpoint, Service Blueprint, Workflow, Process Template, Resource Template, Decision, Experiment, Daily Thread, Learning Unit, Area/Capability, Campaign, Environment.
- Relationships: list key FKs.
- IDs: **ULID**; stable across merges.

## Repo Map (authoritative)
- The directory tree MUST follow **`repo_structure_v01.json`**. Builders parse that file to scaffold required folders/files at Portfolio/Venture/Engagement/Program/Project layers.
- Do **not** duplicate `/sot` or `/prompts` outside Portfolio; reference via `.contextrc.yaml` at Venture/Project.

> Pathing note: Per Path Resolution Strategy ADR, define `REPO_ROOT` at the top of builder/agent prompts (e.g., `/Users/davidkellam/portfolio`) and reference inputs as `${REPO_ROOT}/…`. `.contextrc.yaml` remains relative for repo portability.

## Mode-Aware Context Streams
- **Planning**: breadth, comparables, trade-offs.
- **Execution**: precise constraints, canonical facts, current status.
- **Review/Debug**: trace history, decisions, attempts.
Implement separate brief templates & retrieval profiles per stream.

## Retrieval & Context Policy
- **Chunking**: heading-aware + semantic boundaries; target **200–400 tokens**; maintain parent/child pointers for expandable context.
- **Hybrid retrieval + rerank**: BM25 + embeddings → cross-encoder reranker; start `k_in=30`, rerank to `k_out=6–8`.
- **Metadata** (required on every Markdown file):
  ```
  - entity: <entity_name>
  - level: <level_name>
  - zone: public|internal|private|restricted
  - version: vNN
  - tags: [tag1, tag2]
  - source_path: <repo-relative-path>
  - date: YYYY-MM-DD
  ```
- **Citations**: always return `source_path + line/section`.
> Retrieval scopes are governed by `/decisions/2025-10-17_retrieval-scope-policy_v01.md`.  
> Planning ≠ Execution ≠ Review. Always verify numeric/date/ID facts against structured SoT (CSV/YAML) before finalizing.

## Structural Layers (beyond Portfolio/Venture/Project)
- **Offer** (venture): reusable product spec (scope/SLA/tiers).
- **Engagement** (venture): SoW/contract; may contain multiple projects.
- **Program** (venture): multi-project roadmap/dependencies.
- **Project**: mode-aware briefs (planning/execution/review) + `SHO.json`.
- **Sprint/Task/Deliverable** (project): time-boxed increments, executable work, output specs.
- **Area/Capability**: ongoing function (Ops, Finance, Marketing, Learning).
- **Campaign / Experiment / Learning / Environment**: GTM, tests, upskilling, and platform runbooks.

## Session Handoff Object (S.H.O.)
Pass this JSON at the start of every planning chat and each Claude Code mission:
```json
{
  "id": "01H... (ULID)",
  "objective": "",
  "context_refs": [{"id": "01H...", "path": "relative/path"}],
  "decisions_since_last": [],
  "open_questions": [],
  "blockers": [],
  "next_3_MITs": [],
  "deadline": "YYYY-MM-DD",
  "ttl_days": 3
}
```
The S.H.O. enables the Claude Code agentic loop without ambiguity.

## Governance
- Naming/versioning: `YYYY-MM-DD_slug_vNN.ext`.
- ADRs in `/decisions/*`.
- Backups: weekly “context pack” zip; retention 12 weeks.
- **Portability:** Vendor/chat memory is a **convenience layer** only; the file repository is the **source of truth**.

### Policy & ADR Index

This architecture is governed by the following accepted decisions:

- **Path Resolution Strategy:** `/decisions/2025-10-17_path-resolution-strategy_v01.md`  
  Declare `REPO_ROOT` in prompts/agents; reference files as `${REPO_ROOT}/…`. `.contextrc.yaml` uses **relative paths** back to Portfolio SoT/Prompts/Eval.

- **Template Instantiation Approach:** `/decisions/2025-10-17_template-instantiation-approach_v01.md`  
  If a matching template exists in `/templates/`, use it; otherwise generate a thin placeholder from `templates/placeholder_scaffold.md`. All Markdown files **must** include the standard metadata header. Builder logs `template|placeholder` in `/logs/context_actions.csv`.

- **Zone Inheritance Policy:** `/decisions/2025-10-17_zone-inheritance-policy_v01.md`  
  Default zone = `internal`. Children may **not** downgrade sensitivity; effective zone is the max across ancestors (`public < internal < private < restricted`). Derived artifacts inherit the **highest** input zone. Only files marked `public` may be published externally.

- **Retrieval Scope Policy:** `/decisions/2025-10-17_retrieval-scope-policy_v01.md`  
  Mode-aware scopes: Planning (portfolio/venture + comparables), Execution (current project canonical facts; exact lookups), Review (current project + decisions + last N attempts). Hybrid→rerank (`k_in=30 → k_out=6–8`), citations required, verify IDs/dates against structured SoT.

- **Context TTL & Promotion Policy (expanded):** `/decisions/2025-10-17_context-ttl-policy_v01.md`
  Session notes 14–30d (default 21); planning scratch 30d; project briefs = project_end + 90d; logs 180d; playbooks/offers/ADRs = no TTL (versioned). Promotions: Project → Venture → Portfolio with ADR + PR. Weekly automation proposes promotions/archives.

- **Infrastructure SyncBricks Adoption:** `/decisions/2025-10-26_infrastructure-syncbricks-adoption_v01.md`
  Adopt SyncBricks pattern for Docker-based multi-service deployments: nginx-proxy auto-discovery reverse proxy, acme-companion automatic SSL, token-based Cloudflare Tunnel, two-network design (proxy + backend isolation). Scales trivially from 2 to 10+ services without manual config files. Production-ready configuration in `/ops/docker-compose.production.yml` with comprehensive documentation in `/docs/infrastructure/`.

## Evaluation & Optimization
- **Default optimization framework:** **DSPy** (programmatic optimization).
- **TypeScript alternative:** **Ax** (DSPy-style for TS).
- **Eval harness:** Run **RAGAS** or **DeepEval** weekly. Track faithfulness, answer relevancy, and contextual precision.
- **Acceptance Gate (blocking):** average score **≥ 0.80** required; otherwise changes are blocked until corrected.

## Acceptance Criteria
- Paths resolve per **Path Resolution Strategy** ADR (`REPO_ROOT` + relative `.contextrc.yaml`).
- New/updated Markdown files include the **required metadata header** and follow the **Template Instantiation** ADR.
- Retrieval behavior matches the **Retrieval Scope** ADR; answers include citations and verify IDs/dates against structured SoT (CSV/YAML).
- Zone checks enforce the **Zone Inheritance** ADR (no unauthorized downgrades; redaction before publishing).
- TTLs enforced per the **Context TTL & Promotion** ADR; weekly automation proposes promotions/archives or logs a “no-op.”
- Eval gate passes (≥ **0.80** average on RAGAS/DeepEval) or changes are blocked until fixed.
- Actions are logged to `/logs/context_actions.csv` with `template|placeholder` instantiation mode.

## Caching & Cost Control
Keep a stable preamble (system goals, tools, output schemas) at the **top**, and rotate variable context **after** it to maximize prompt-caching hit rates and cut latency/cost.

## Security & Zones
- Zones: `public | internal | private | restricted`.
- Enforce redaction; store secrets outside prompts; prefer scoped, ephemeral credentials for tool access.
> Zone inheritance: effective zone for any file or generated artifact is the **highest** sensitivity among its parents/inputs. Downgrades require explicit redaction + reviewer approval (see Zone Inheritance ADR).

## MCP Tooling (Planning layer)
Use **Model Context Protocol** servers to expose files, calendars, GitHub, and browser automation with auditable scopes. Treat these as “context adapters,” not your SoT.

## Execution with Claude Code (Execution layer)
- Restrict directories via config; agent must propose plan, await approval, apply changes, show diffs/tests, and commit in small batches—per protocol above.
> Template rule: when generating files, prefer rich templates in `/templates/`; otherwise use `templates/placeholder_scaffold.md`. All outputs must include the standard metadata header and be logged to `/logs/context_actions.csv` with mode = `template` or `placeholder`.

## File Structure (summary)
- `/context/` (MD for humans)
- `/sot/` (JSON/YAML schemas)
- `/diagrams/` (.mmd / React Flow JSON)
- `/datasets/` (CSV)
- `/prompts/` (JSONL)
- `/decisions/` (ADRs)
- `/logs/` (CSV)
- `/eval/` (eval sets & run notes)

## TTL / Decay (operationalizing “forgetting”)
- Session notes default TTL: 14–30 days; auto-archive unless promoted to briefs or library.
- Project briefs: TTL = project end + 90 days; promote key learnings to evergreen playbooks.
> TTL enforcement follows `/decisions/2025-10-17_context-ttl-policy_v01.md`.  
> Weekly automation (`scripts/promote_notes_stub.py`) flags items to promote/archive; promotions require ADR + PR with reviewer sign-off.

## 5-Day Roadmap
1) SoT schemas + repo tree; S.H.O. template (follow `repo_structure_v01.json`).
2) Chunker + metadata; ADR for chunking choices.
3) Hybrid retriever + reranker; wire Q&A endpoint.
4) Eval harness (DSPy + RAGAS/DeepEval) and weekly job (gate ≥ 0.80).
5) MCP adapters + Claude Code mission protocol; caching notes in README.
