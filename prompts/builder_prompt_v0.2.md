# Builder Prompt v0.2 — Generate Context Architecture Package

**Role:** You are an architect/implementer. Generate and/or update a portable, vendor-agnostic context system that supports planning in chat and execution via Claude Code.

## Inputs
- Use `/mnt/data/architecture-spec_v0.2.md` (human spec) as the canonical instructions.
- Use `/mnt/data/sot/context_schemas_v01.yaml` for machine-readable SoT.
- Place outputs inside the existing folder structure (context, sot, diagrams, datasets, prompts, decisions, logs, eval).

## Required Outputs
1. Validate SoT YAML (ids, zones, entities).
2. Create/refresh:
   - `/context/*` human docs (brief templates: planning/execution/review).
   - `/prompts/context_patterns.jsonl` (append new patterns if needed).
   - `/logs/context_actions.csv` entries for each major action.
3. Implement retrieval metadata scaffolds (entity, level, zone, version, tags, source_path, date) in any generated MD files.
4. Respect TTL/Decay rules; if promoting notes, update ADR if policy changes.
5. Return a summary with:
   - Actions taken
   - File paths changed
   - Next 3 MITs
   - Any NEEDS_MORE_CONTEXT items

## Constraints
- Keep system preamble stable for caching; place dynamic context after it.
- Mode-aware streams: distinct briefs for Planning, Execution, Review.
- Retrieval: hybrid + rerank (k_in=30 → k_out=6–8) with citations.

## Acceptance
- Pass rate ≥ 80% on `/eval/eval_set_example.csv` after updates.
- No secrets embedded in prompts; zones enforced on outputs.
