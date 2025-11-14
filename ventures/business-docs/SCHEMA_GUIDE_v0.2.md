# Schema Guide (v0.2)

## Purpose
Human-readable overview of the entire schema: entity meanings, relationships, paths, and retrieval rules. Pairs with the machine SoT (`/sot/context_schemas_v02.yaml`) and the repo map (`/repo_structure_v01.json`).

## Core Layers
- **Portfolio (root)**: Single Source of Truth (schemas, prompts, eval), global SOPs, ADRs.
- **Venture**: Positioning, ICP, playbooks, offer library.
- **Offer**: Productized service spec (scope/SLA/tiers).
- **Engagement**: Contract/SoW; may span multiple projects; holds acceptance criteria and changes.
- **Program**: Multi-project initiative; dependencies and milestones.
- **Project**: Mode-aware briefs (planning/execution/review) + SHO; tasks & deliverables.
- **Sprint/Cycle**: Time-boxed execution within a project.
- **Task/Work Item**: Mission-sized unit; links to PR/commits/tests.
- **Deliverable**: Output spec and acceptance tests.
- **Area/Capability**: Ongoing function (Ops, Finance, Marketing, Learning).
- **Campaign**: GTM orchestration linked to Offers/Programs.
- **Experiment**: Hypothesis-driven work; results and decision.
- **Learning Unit**: Personal development plan and outcomes.
- **Environment/Platform**: Runbooks, secrets, MCP scopes.

## Relationships at a Glance
- Venture 1—* Offer
- Venture 1—* Engagement 1—* Project
- Venture 1—* Program 1—* Project
- Project 1—* Sprint 1—* Task
- Project 1—* Deliverable
- Portfolio 1—* Area | Campaign | Experiment | Learning

## Required Fields (minimum viable)
**Engagement**
- id (ULID), client_name, start_date, end_date?, fee?, acceptance_criteria, repo_path

**Project**
- id (ULID), engagement_id OR program_id, name, status, deadline?, repo_path

**Deliverable**
- id (ULID), project_id, name, acceptance_tests, reviewer?, repo_path

**Offer**
- id (ULID), name, tiers[], scope_in[], scope_out[], sla, repo_path

**Program**
- id (ULID), venture_id, name, milestones[], dependencies[], repo_path

## Retrieval Policy
- Chunking: heading + semantic (target 200–400 tokens) with parent/child links.
- Hybrid retrieval (BM25 + embeddings) → cross-encoder reranker; `k_in=30 → k_out=6–8`.
- Every Markdown file includes a metadata header:
  ```
  - entity: <entity_name>
  - level: <level_name>
  - zone: public|internal|private|restricted
  - version: vNN
  - tags: [tag1, tag2]
  - source_path: <repo-relative-path>
  - date: YYYY-MM-DD
  ```
- Always return citations (`path#section|line`).

## Inheritance & Portability
- SoT and prompts live at Portfolio; Ventures/Projects reference via `.contextrc.yaml`.
- Promotions: Project → Venture → Portfolio; document via ADRs.
- Vendor memory is a convenience layer; the file repo is the SoT.

## Lifecycle & TTL (by entity)
- **Session Notes:** TTL 14–30d; promote durable learnings to Venture Playbooks.
- **Project Briefs:** TTL = project_end + 90d; promote key learnings upward.
- **Venture Playbooks / Offers:** no TTL; version with ADRs.
- **Engagement facts:** no TTL during contract; archive after closeout.

## Examples
- **Example citation path:** `../../../../sot/context_schemas_v02.yaml#retrieval.metadata_fields` (used from a Project file to cite global metadata policy).
- **Example containment:** A Project either belongs to an Engagement or a Program (never both). Deliverables belong to Projects and reference Offer acceptance tests when relevant.
