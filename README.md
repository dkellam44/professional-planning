# Portfolio Context Architecture

- entity: portfolio
- level: documentation
- zone: internal
- version: v01
- tags: [portfolio, documentation, readme]
- source_path: /README.md
- date: 2025-10-17

---

## Overview

This is an **AI-ready context architecture** for a solo operator, designed for portability, verifiability, and mode-aware retrieval across planning (chat) and execution (Claude Code CLI).

**Current Status**: ✅ Foundation complete; ✅ Infrastructure documentation & production configuration deployed (2025-10-26); ✅ Docker deployment operational (2025-10-27)

---

## Architecture Principles

1. **Portable by Design** — File-based Source of Truth; vendor memory is convenience layer only
2. **Mode-Aware** — Separate retrieval scopes for Planning/Execution/Review
3. **Zone-Based Security** — `public | internal | private | restricted` with inheritance
4. **Eval-Driven** — Weekly RAGAS/DeepEval with ≥0.80 acceptance gate
5. **TTL & Promotion** — Context decay with explicit promotion paths (Project → Venture → Portfolio)

---

## Directory Structure

```
portfolio/
├── architecture-spec_v0.3.md       # Canonical human spec
├── SCHEMA_GUIDE_v0.2.md            # Human-readable schema docs
├── builder_prompt_v0.3.md          # Builder/agent instructions
├── sot/                            # Source of Truth (schemas, structured data)
│   └── context_schemas_v02.yaml
├── prompts/                        # Prompt templates (JSONL)
├── eval/                           # Eval harness (DSPy, RAGAS, DeepEval)
├── decisions/                      # ADRs (Architecture Decision Records)
│   ├── 2025-10-17_path-resolution-strategy_v01.md
│   ├── 2025-10-17_template-instantiation-approach_v01.md
│   ├── 2025-10-17_zone-inheritance-policy_v01.md
│   ├── 2025-10-17_retrieval-scope-policy_v01.md
│   └── 2025-10-17_context-ttl-policy_v01.md
├── templates/                      # File templates for all entity types
│   ├── offer_brief_v01.md
│   ├── engagement_brief_v01.md
│   ├── planning_brief_v01.md       # Mode-aware project briefs
│   ├── execution_brief_v01.md
│   ├── review_brief_v01.md
│   ├── SHO_template.json           # Session Handoff Object
│   └── placeholder_scaffold.md     # Fallback for missing templates
├── context/                        # Portfolio-level context docs
│   └── playbooks/                  # Reusable patterns promoted from projects
├── logs/                           # Action logs (CSV)
│   └── context_actions.csv
├── diagrams/                       # Visual architecture (.mmd, React Flow JSON)
├── integrations/                   # Tool integrations (MCP servers, etc.)
├── ops/                            # Operational infrastructure & deployment configs
│   ├── docker-compose.production.yml     # Production-ready 7-service stack (SyncBricks pattern)
│   ├── PRODUCTION_DEPLOYMENT_QUICKSTART.md # One-page rapid deployment reference
│   ├── docker-compose.example.yml        # Legacy example (reference only)
│   ├── cloudflare_tunnel.example.yaml    # Legacy example (reference only)
│   ├── Dockerfile.coda-mcp-gateway       # Custom HTTP wrapper for Coda MCP
│   └── coda-mcp-gateway/                 # Coda MCP Gateway build context
└── ventures/                       # Business ventures (one per venture)
    └── reference-venture-example/  # Example venture structure
        ├── .contextrc.yaml
        ├── context/
        │   ├── venture_brief.md
        │   └── playbooks/
        ├── offers/
        │   └── {offer-slug}/
        │       └── context/
        │           └── offer_brief_v01.md
        ├── engagements/
        │   └── {engagement-slug}/
        │       ├── context/
        │       │   └── engagement_brief_v01.md
        │       ├── decisions/
        │       └── projects/
        │           └── {project-slug}/
        │               ├── .contextrc.yaml
        │               ├── context/
        │               │   ├── planning_brief_v01.md
        │               │   ├── execution_brief_v01.md
        │               │   ├── review_brief_v01.md
        │               │   └── SHO.json
        │               ├── deliverables/
        │               ├── sprints/
        │               ├── decisions/
        │               └── logs/
        ├── programs/
        └── decisions/
```

## Source of Truth (SoT) v0.2
- **GitHub (and the local clone)** is the canonical, versioned Source of Truth for every architecture spec, service blueprint, process/workflow template, and automation document.
- **Coda (Founder HQ)** is the operational Source of Truth that reflects the live state of work, projects, and automations built from those versioned docs.
- Changes flow both ways: GitHub Actions dispatch updates to Coda via n8n, while Coda automation webhooks send updates back through n8n (using GitHub CLI/API) to open PRs so GitHub remains authoritative.
- Learn more in `architecture/sot_architecture_v0_2.md`, review the authority map in `sot/authority_map_v0_2.json`, and see integration details under `integrations/mcp/`, `integrations/n8n/`, and `integrations/coda/`. Example operational configurations for running the synchronization services can be found in the `/ops` directory.

---

## Infrastructure (SyncBricks Pattern)

**Status**: ✅ Production-ready configuration deployed (2025-10-26)

The portfolio uses the **SyncBricks pattern** for Docker-based infrastructure:
- **nginx-proxy** — Auto-discovery reverse proxy (no manual config files)
- **acme-companion** — Automatic SSL certificate management via Let's Encrypt
- **Token-based Cloudflare Tunnel** — Secure external connectivity (zero personal IP exposure)
- **Two-network design** — Proxy network (public) + syncbricks network (private database isolation)

### Infrastructure Documentation
All documentation in `/portfolio/docs/infrastructure/`:
1. **syncbricks_n8n_full_analysis_v1.md** — Complete analysis with decision process
2. **syncbricks_solution_breakdown_v1.md** — Technical pattern explanations
3. **droplet_migration_procedure_v1.md** — 7-phase deployment guide
4. **infrastructure_state_comparison_v1.md** — Before/after security metrics
5. **cloudflare_tunnel_token_guide_v1.md** — Token setup & operations

### Deployment Quick Start
See `ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md` for rapid deployment (15-30 min).

Key steps:
1. Obtain Cloudflare Tunnel token (Zero Trust dashboard)
2. Create `.env` file with credentials
3. Run: `docker-compose -f docker-compose.production.yml up -d`
4. Verify: Tunnel shows HEALTHY, services accessible via HTTPS

### Architecture Decision
See ADR: `decisions/2025-10-26_infrastructure-syncbricks-adoption_v01.md`

---

## Quick Start

### 1. Create a New Venture
```bash
# Use the builder prompt to scaffold a new venture
# The builder will create proper directory structure and populate templates
```

### 2. Add an Offer (Productized Service)
```bash
# Navigate to ventures/{venture-slug}/offers/
# Copy template from /templates/offer_brief_v01.md
# Fill in: positioning, ICP, scope (in/out), SLA, pricing tiers
```

### 3. Create an Engagement (Client Contract)
```bash
# Navigate to ventures/{venture-slug}/engagements/
# Create {engagement-slug}/context/
# Copy template from /templates/engagement_brief_v01.md
# Fill in: client, dates, fees, acceptance criteria
```

### 4. Start a Project
```bash
# Navigate to engagements/{engagement-slug}/projects/
# Create {project-slug}/ with context/, deliverables/, sprints/, decisions/, logs/
# Use templates for 3 mode-aware briefs (planning, execution, review)
# Instantiate SHO.json from /templates/SHO_template.json
```

---

## Governance & ADRs

All architectural decisions are documented as ADRs in `/decisions/`:

- **Path Resolution Strategy** — REPO_ROOT in prompts, relative paths in .contextrc
- **Template Instantiation** — Rich templates when available, placeholders otherwise
- **Zone Inheritance** — Children cannot downgrade sensitivity (public < internal < private < restricted)
- **Retrieval Scope Policy** — Mode-aware scopes (Planning/Execution/Review)
- **Context TTL & Promotion** — Session notes 14-30d, project briefs +90d, playbooks no TTL

---

## Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `architecture-spec_v0.3.md` | High-level architecture design and principles |
| `SCHEMA_GUIDE_v0.2.md` | Human-readable schema documentation |
| `sot/context_schemas_v02.yaml` | Machine-readable entity schemas (authoritative) |
| `repo_structure_v01.json` | Canonical directory structure requirements |
| `builder_prompt_v0.3.md` | Instructions for builder/agent to scaffold structures |
| `.contextrc.yaml` | Configuration file (venture/project level) for inheritance |
| `SHO.json` | Session Handoff Object for Claude Code missions |

---

## Metadata Standards

**Every Markdown file MUST include:**
```markdown
- entity: <entity_name>
- level: <level_name>
- zone: public|internal|private|restricted
- version: vNN
- tags: [tag1, tag2]
- source_path: <repo-relative-path>
- date: YYYY-MM-DD
```

This enables:
- Hybrid retrieval (BM25 + embeddings) with reranking
- Zone-based security enforcement
- TTL/promotion automation
- Citation generation

---

## Retrieval & Context

### Mode-Aware Retrieval Scopes

**Planning Mode** (chat-based exploration):
- Scope: Portfolio + Venture + Comparables
- k_in=30 → k_out=8 (breadth)
- Strategy: Semantic search for patterns, ADRs, comparable offers

**Execution Mode** (Claude Code precise implementation):
- Scope: Current Project + Parent Engagement/Program + SoT
- k_in=20 → k_out=6 (precision)
- Strategy: Exact lookups, fact verification against CSV/YAML

**Review Mode** (retrospective):
- Scope: Current Project + Logs + Decisions + Attempts
- k_in=30 → k_out=10 (historical context)
- Strategy: Temporal search, error patterns, citation chaining

### Hybrid Retrieval Stack
1. BM25 (keyword/exact) → top k_in candidates
2. Embeddings (semantic) → top k_in candidates
3. Merge + deduplicate
4. Cross-encoder reranker → final top k_out chunks
5. Citation extraction → `source_path#line|section`

---

## Evaluation & Quality Gates

- **Framework**: DSPy (Python) or Ax (TypeScript)
- **Harness**: RAGAS or DeepEval (weekly runs)
- **Metrics**: faithfulness, answer_relevancy, contextual_precision
- **Gate**: ≥0.80 average required; changes blocked until fixed

---

## Security & Zones

**Zone Hierarchy**: `public < internal < private < restricted`

**Rules**:
- Default zone: `internal`
- Children cannot downgrade sensitivity
- Derived artifacts inherit highest input zone
- Only `public` files may be published externally
- Downgrades require ADR + reviewer approval

---

## Next Steps

1. ✅ Foundation complete (schemas, templates, ADRs, reference venture)
2. **Create your first real venture**: Use builder prompt to scaffold
3. **Add offers**: Define your productized services
4. **Create engagements**: Document client contracts
5. **Launch projects**: Use mode-aware briefs (planning/execution/review)
6. **Implement eval harness**: Set up DSPy + RAGAS/DeepEval
7. **Enable automation**: Weekly TTL checks, promotion proposals

---

## Support & Documentation

- **Architecture Spec**: `architecture-spec_v0.3.md`
- **Schema Guide**: `SCHEMA_GUIDE_v0.2.md`
- **Builder Instructions**: `builder_prompt_v0.3.md`
- **ADRs**: `/agents/decisions/`
- **Templates**: `/templates/`
- 

---

**Version**: 0.4
**Last Updated**: 2025-10-28
**Status**: Foundation complete, production-ready
