  Builder Prompt v0.3 — Architecture Evaluation

  Executive Summary

  Your architecture is well-conceived and structurally sound. You've designed a sophisticated, vendor-agnostic context system that balances human
  readability with machine-processable structure. The design shows clear thinking about AI-assisted workflows, portability, and governance.

  However, there are critical gaps between your design vision and current implementation, plus some architectural decisions that need clarification
   before execution.

  ---
  ✅ What Works Well

  1. Strong Conceptual Foundation

  - Portable by design: File-based SoT with vendor memory as "convenience layer" is the right approach
  - Mode-aware context streams: Planning/Execution/Review separation is excellent for AI workflows
  - Zone-based security: public|internal|private|restricted provides clear access control
  - ULID for IDs: Excellent choice for distributed, time-sortable identifiers
  - Metadata-first: Requiring structured metadata headers on all markdown enables powerful retrieval

  2. Solid Structural Hierarchy

  The layered architecture (Portfolio → Venture → Engagement/Program → Project → Sprint/Task/Deliverable) maps well to real-world professional
  work:
  - Clear separation of concerns
  - Proper inheritance via .contextrc.yaml
  - Avoids duplication of SoT/prompts across layers

  3. Good Retrieval Strategy

  - Hybrid BM25 + embeddings with reranking is state-of-the-art
  - Reasonable chunk sizes (200-400 tokens)
  - k_in=30 → k_out=6-8 provides good precision/recall balance

  4. Evaluation-Driven

  - DSPy for programmatic optimization shows technical sophistication
  - Weekly eval harness (RAGAS/DeepEval) with ≥0.80 gate is rigorous
  - Eval stub exists at /eval/run_eval_stub.py

  5. Clear Governance

  - ADRs in /decisions/
  - TTL policies for session notes and project briefs
  - Logging actions to CSV for auditability

  ---
  🚨 Critical Gaps & Missing Pieces

  1. Missing Core Reference Files

  Your builder prompt references files that don't exist:

  ❌ /mnt/data/architecture-spec_v0.2.md — NOT FOUND
  - You have architecture-spec_v0.3.md at Portfolio root
  - Builder prompt references v0.2 which doesn't exist
  - Fix: Update builder prompt to reference v0.3

  ❌ /mnt/data/sot/context_schemas_v01.yaml — NOT FOUND
  - You have context_schemas_v02.yaml (not v01)
  - Path assumes /mnt/data but actual path is /Users/davidkellam/Portfolio
  - Fix: Update to sot/context_schemas_v02.yaml with correct relative paths

  ❌ /mnt/data/SCHEMA_GUIDE_v0.1.md — NOT FOUND
  - You have SCHEMA_GUIDE_v0.2.md at Portfolio root
  - Fix: Update builder prompt to reference v0.2

  ❌ /mnt/data/repo_structure_v01.json — EXISTS ✅
  - This file exists at Portfolio root (correct)

  Impact: The builder prompt will fail immediately when trying to read input files.

  2. Path Inconsistencies

  Your builder prompt uses absolute paths like /mnt/data/... but your actual structure is at /Users/davidkellam/Portfolio/. This suggests:
  - Either the prompt was written for a different environment (containerized? cloud?)
  - Or you need path resolution logic to handle both environments

  Recommendation: Use relative paths from Portfolio root in all references, not absolute paths.

  3. Empty Ventures Directory

  /ventures/ exists but is completely empty. Your architecture expects:
  ventures/
    └── <venture-name>/
        ├── .contextrc.yaml
        ├── context/
        │   └── venture_brief.md
        ├── offers/
        ├── engagements/
        ├── programs/
        └── decisions/

  Impact: No actual ventures exist to populate. You need either:
  - Sample venture scaffolding as part of the builder
  - Clear instructions on how to create first venture

  4. Templates vs. Implementation Gap

  You have excellent templates in /templates/:
  - ✅ offer_brief_v01.md
  - ✅ engagement_brief_v01.md
  - ✅ program_roadmap_v01.md
  - ✅ contextrc templates (venture, project, portfolio)
  - ✅ Various other entity templates

  BUT: Your builder prompt doesn't clearly specify:
  - How to instantiate a template (variable substitution? manual edit?)
  - What placeholders need filling (<venture_slug>, <project_slug>, etc.)
  - Whether to create empty placeholder files or only create on demand

  5. Session Handoff Object (SHO.json) — No Template

  Your architecture spec calls for SHO.json in every project (repo_structure_v01.json:65), and architecture-spec_v0.3.md defines its schema (lines
  52-66), but:
  - ❌ No template file exists in /templates/
  - ❌ No example SHO.json in any existing project

  Impact: Projects can't be properly initialized without this critical coordination file.

  6. Logging Infrastructure Incomplete

  Builder prompt requires (line 46-47):
  Append one line to `/logs/context_actions.csv`

  Current state:
  - /logs/ directory exists ✅
  - But no context_actions.csv file exists ❌
  - No header row defined for the CSV

  Required CSV schema (from prompt):
  ts, agent, action, entity, path, latency_ms, token_in, token_out, success, notes

  7. Eval Harness Not Fully Configured

  You have:
  - ✅ /eval/run_eval_stub.py (exists)
  - ✅ /eval/eval_set_example.csv (exists)

  Missing:
  - ❌ DSPy configuration/setup
  - ❌ RAGAS or DeepEval integration
  - ❌ Actual evaluation metrics implementation
  - ❌ Weekly run automation (cron/GitHub Actions?)

  Impact: Can't enforce the ≥0.80 acceptance gate mentioned in acceptance criteria.

  ---
  ⚠️ Design Questions & Ambiguities

  1. Multi-Environment Path Resolution

  Your builder prompt uses /mnt/data/... paths but your actual files are at /Users/davidkellam/Portfolio/. How should the system handle:
  - Local development (macOS)
  - Containerized execution (Docker with /mnt/data mounts)
  - Cloud environments (Claude Code in browser with different mount points)

  Recommendation:
  - Use environment variable $PORTFOLIO_ROOT with fallback logic
  - Or: rewrite builder to always use relative paths from current working directory

  2. Template Instantiation Strategy

  When the builder creates a new Engagement/Project/etc., should it:
  - Option A: Copy template → Fill in metadata → Leave content empty with TODOs?
  - Option B: Copy template → Prompt user for values → Fully populate?
  - Option C: Create stub with just metadata → Populate content later on-demand?

  Impact on UX: Option A requires manual editing. Option B blocks automation. Option C defers work but risks incomplete files.

  3. Zone Inheritance & Override

  Your design has zone-based security (public|internal|private|restricted), but:
  - Does a Project inherit its parent Engagement's zone by default?
  - Can a Task have a more restrictive zone than its parent Project?
  - How are zone conflicts resolved in retrieval?

  Example: If an Engagement is internal but contains private Project notes, what gets retrieved for a query?

  4. Retrieval Scope Boundaries

  When working in a Project context:
  - Does retrieval search only that project's files?
  - Or also parent Venture playbooks?
  - Or also Portfolio-level SoT/prompts?
  - How is scope configured in .contextrc.yaml?

  The .contextrc.yaml templates show decisions_chain with multiple paths, but no retrieval_scope or search_paths configuration.

  5. TTL Enforcement Mechanism

  Your design specifies TTL policies:
  - Session notes: 14–30 days
  - Project briefs: project_end + 90 days

  But how is this enforced?
  - Manual review?
  - Automated archiving script?
  - Warning system in retrieval?
  - Hard deletion vs. soft archive?

  No implementation exists for this critical "forgetting" feature.

  6. Vendor Memory Integration

  Architecture spec says "vendor memory is convenience layer" but:
  - How do you sync file changes TO vendor memory (Claude Projects, ChatGPT memory)?
  - How do you ensure vendor memory doesn't become stale?
  - What's the sync strategy (push on commit? periodic batch? manual?)?

  This "last mile" integration is undefined.

  ---
  🔧 Implementation Recommendations

  Priority 1: Fix Broken References (Required for Execution)

  1. Update builder_prompt_v0.3.md line 8: Change architecture-spec_v0.2.md → architecture-spec_v0.3.md
  2. Update line 9: Change context_schemas_v01.yaml → context_schemas_v02.yaml
  3. Update line 11: Change SCHEMA_GUIDE_v0.1.md → SCHEMA_GUIDE_v0.2.md
  4. Replace all /mnt/data/ paths with relative paths from Portfolio root or add path resolution logic

  Priority 2: Create Missing Foundation Files

  1. Create /templates/SHO_template.json with schema from architecture spec
  2. Create /logs/context_actions.csv with header row:
  ts,agent,action,entity,path,latency_ms,token_in,token_out,success,notes
  3. Create /templates/placeholder_scaffold.md showing how to structure empty files with metadata

  Priority 3: Document Instantiation Workflow

  Create /docs/BUILDER_WORKFLOW.md explaining:
  1. How to run the builder prompt
  2. What inputs it requires (venture name, project name, etc.)
  3. How templates get populated
  4. What manual steps remain after builder runs
  5. How to validate the output

  Priority 4: Clarify Ambiguous Policies

  Create ADRs in /decisions/ for:
  1. Multi-environment path resolution strategy (2025-10-17_path-resolution-strategy_v01.md)
  2. Template instantiation approach (2025-10-17_template-instantiation-approach_v01.md)
  3. Zone inheritance rules (2025-10-17_zone-inheritance-policy_v01.md)
  4. Retrieval scope boundaries (2025-10-17_retrieval-scope-policy_v01.md)
  5. TTL enforcement mechanism (expand existing 2025-10-17_context-ttl-policy_v01.md)

  Priority 5: Bootstrap First Venture

  Create a reference implementation:
  ventures/
    └── reference-venture-example/
        ├── .contextrc.yaml (fully configured)
        ├── context/
        │   └── venture_brief.md (fully populated)
        ├── offers/
        │   └── example-offer/
        │       └── context/
        │           └── offer_brief_v01.md
        └── engagements/
            └── example-engagement/
                └── context/
                    └── engagement_brief_v01.md

  This serves as:
  - Documentation by example
  - Test case for the builder
  - Template for new ventures

  Priority 6: Implement Eval Integration

  1. Add DSPy configuration to /eval/dspy_config.yaml
  2. Implement /eval/run_ragas_eval.py or /eval/run_deepeval.py
  3. Create /eval/README.md with setup instructions
  4. Add eval acceptance gate to Makefile or GitHub Actions

  ---
  📊 Architecture Maturity Assessment

  | Aspect                      | Status     | Score |
  |-----------------------------|------------|-------|
  | Conceptual Design           | Excellent  | 9/10  |
  | Schema Definition           | Very Good  | 8/10  |
  | Template Coverage           | Good       | 7/10  |
  | Implementation Completeness | Incomplete | 4/10  |
  | Documentation               | Good       | 7/10  |
  | Operational Readiness       | Not Ready  | 3/10  |

  Overall Readiness: 60% — Needs work before production use

  The architecture is very well designed but not yet executable due to missing files, broken references, and undefined operational procedures.

  ---
  🎯 Suggested Next Steps (MITs)

  If I were to execute the builder prompt as-is, I would:

  1. Fail immediately due to missing input files (architecture-spec_v0.2.md, context_schemas_v01.yaml, etc.)
  2. Create incomplete structures due to missing SHO template and logging CSV
  3. Leave ambiguities unresolved (path resolution, template instantiation, zone inheritance)

  Instead, I recommend this execution plan:

  Phase 1: Foundation Fixes (2-3 hours)

  - Update builder_prompt_v0.3.md with correct file references
  - Create missing templates (SHO, logs CSV)
  - Write path resolution logic or standardize on relative paths
  - Create ADRs for ambiguous policies

  Phase 2: Reference Implementation (3-4 hours)

  - Build first complete venture as reference
  - Test builder prompt against reference
  - Document any gaps found
  - Refine templates based on learnings

  Phase 3: Operational Setup (2-3 hours)

  - Implement eval harness integration
  - Create Makefile targets for common operations
  - Write setup/teardown scripts
  - Test end-to-end workflow

  Total estimated effort: 7-10 hours to reach production-ready state.

  ---
  Final Assessment

  Your architecture demonstrates strong systems thinking and awareness of AI workflow best practices. The design is portable, maintainable, and
  well-structured.

  However: The gap between design and implementation is significant. The builder prompt would fail if executed today.

  Recommendation: Invest 1-2 days to close the gaps before deploying this system. Once the foundation is solid, it will be a powerful context
  management framework for AI-assisted professional work.