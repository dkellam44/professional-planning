# ADR: Retrieval Scope Policy

- entity: decision
- level: policy
- zone: internal
- version: v01
- tags: [adr, retrieval, context, mode-aware]
- source_path: /decisions/2025-10-17_retrieval-scope-policy_v01.md
- date: 2025-10-17

## Status
**ACCEPTED**

## Context
The context architecture serves three distinct modes with different information needs:

1. **Planning Mode** (chat-based exploration)
   - Needs: breadth, comparables, trade-offs, historical patterns
   - Risk: too much context → confusion, cost

2. **Execution Mode** (Claude Code precise implementation)
   - Needs: precise constraints, canonical facts, current status
   - Risk: stale/incorrect facts → bugs, rework

3. **Review/Debug Mode** (retrospective analysis)
   - Needs: trace history, decisions, past attempts, error logs
   - Risk: missing context → cannot diagnose root cause

Different modes should retrieve different scopes of context.

## Decision

### Mode-Aware Retrieval Scopes

#### 1. Planning Mode
**Scope**: Portfolio + Venture level + Comparables
```yaml
search_paths:
  - /ventures/{current_venture}/context/
  - /ventures/{current_venture}/offers/
  - /context/  # Portfolio playbooks
  - /decisions/  # ADRs for precedents
  - /ventures/*/offers/  # Cross-venture comparables (if zone allows)

retrieval_params:
  k_in: 30  # Cast wide net
  k_out: 8  # Rerank to top insights
  chunk_expansion: true  # Allow parent/child context

strategies:
  - Semantic search for similar offers/approaches
  - BM25 for specific terms (pricing, SLA, acceptance criteria)
  - Cross-encoder reranking for relevance
```

**What to include**:
- Venture positioning and ICP
- All offers and their outcomes
- ADRs showing past decisions and trade-offs
- Comparable engagements/projects (respecting zone boundaries)
- Portfolio-level playbooks and patterns

**What to exclude**:
- Detailed project execution logs (noise)
- Sprint-level task details (too granular)
- Restricted-zone content (unless planning for restricted context)

#### 2. Execution Mode
**Scope**: Current Project + Direct Dependencies (Canonical Facts Only)
```yaml
search_paths:
  - /ventures/{venture}/engagements/{engagement}/  # Contract constraints
  - /ventures/{venture}/projects/{current_project}/context/
  - /ventures/{venture}/projects/{current_project}/deliverables/
  - /sot/  # Structured canonical data (IDs, dates, schemas)

retrieval_params:
  k_in: 20  # Narrower scope
  k_out: 6  # High precision
  chunk_expansion: false  # Exact facts only
  exact_lookups: true  # Validate IDs/dates against CSV/YAML

strategies:
  - Exact match for IDs (ULIDs), dates, acceptance criteria
  - Keyword search for technical constraints
  - Schema validation against SoT YAML
```

**What to include**:
- Execution brief (`execution_brief_v01.md`)
- Deliverable specs with acceptance tests
- SHO.json (Session Handoff Object)
- Parent Engagement/Program constraints
- Dependencies from structured SoT (CSV/YAML)

**What to exclude**:
- Planning comparables (distraction)
- Historical attempts (unless debugging)
- Venture-level strategy docs (too high-level)

**Critical Rule**: **Always verify numeric/date/ID facts against structured SoT** (CSV/YAML) before finalizing. Markdown is for humans; structured data is canonical.

#### 3. Review/Debug Mode
**Scope**: Current Project + Decisions + Logs + Attempts
```yaml
search_paths:
  - /ventures/{venture}/projects/{current_project}/
  - /ventures/{venture}/projects/{current_project}/logs/
  - /ventures/{venture}/projects/{current_project}/sprints/
  - /ventures/{venture}/decisions/  # Project-level ADRs
  - /decisions/  # Portfolio ADRs
  - /logs/context_actions.csv  # Recent actions

retrieval_params:
  k_in: 30  # Need historical breadth
  k_out: 10  # More context for debugging
  time_window: last_N_days  # e.g., last 30 days for logs
  include_deleted: true  # See what was tried and removed

strategies:
  - Temporal search (recent first)
  - Semantic search for error patterns
  - Citation chaining (follow ADR/decision references)
```

**What to include**:
- Review brief (`review_brief_v01.md`)
- All sprint retrospectives
- Task logs and status history
- Decisions and changes (ADRs)
- Context action logs (who did what when)
- Previous attempts and their outcomes

**What to exclude**:
- Cross-venture comparables (unless explicitly needed)
- Future planning docs (not relevant to past work)

### Hybrid Retrieval + Reranking
All modes use the same retrieval stack:
1. **BM25** (keyword/exact match) → top `k_in` candidates
2. **Embeddings** (semantic similarity) → top `k_in` candidates
3. **Merge + deduplicate** → combined candidate pool
4. **Cross-encoder reranker** → final top `k_out` chunks
5. **Citation extraction** → return `source_path#line|section`

### Citation Requirements
**All retrieved context MUST include citations:**
```
Answer: The project deadline is 2025-11-15.
Citation: /ventures/acme/engagements/eng-001/context/engagement_brief_v01.md#14 (Milestones & Timeline)
```

### Fact Verification (Execution Mode Only)
Before finalizing any answer in Execution mode:
1. Check if answer contains: dates, IDs (ULIDs), numbers, deadlines
2. If yes: look up fact in **structured SoT** (CSV/YAML)
3. If mismatch: use SoT value, not Markdown value
4. Log verification result

Example:
```
Question: What is the engagement fee?
Markdown says: "$50,000" (internal memo)
CSV says: "$52,500" (engagement.csv, canonical)
Answer: $52,500 (verified against /sot/engagements.csv)
```

## Consequences

### Positive
- Each mode gets precisely the context it needs
- Planning benefits from breadth and comparables
- Execution stays focused on current, canonical facts
- Review/Debug has full historical trace
- Fact verification prevents propagation of stale data
- Citations enable trust and traceability

### Negative
- Requires mode detection/configuration
- More complex retrieval logic (3 different scopes)
- Potential confusion if mode is misidentified
- Structured SoT becomes critical dependency (must stay updated)

### Mitigations
- Make mode explicit in every prompt (Planning/Execution/Review)
- Include mode in SHO.json (Session Handoff Object)
- Log retrieval scope in context_actions.csv
- Automated alerts when SoT files become stale (last_modified > 30 days)

## Examples

### Planning Mode Query
```
Query: "What pricing tiers should we offer for the new audit service?"
Retrieval:
  - /ventures/security-co/offers/*/context/offer_brief_v01.md (comparables)
  - /decisions/*pricing*.md (past pricing decisions)
  - /context/playbooks/pricing_strategy_v01.md (portfolio playbook)
k_in: 30 → k_out: 8
Result: 8 chunks showing pricing patterns, ADRs, and comparable offers
```

### Execution Mode Query
```
Query: "What are the acceptance criteria for deliverable DEL-12345?"
Retrieval:
  - /ventures/acme/projects/proj-001/deliverables/del-12345/context/deliverable_spec_v01.md
  - /sot/deliverables.csv (verify ULID: DEL-12345)
k_in: 20 → k_out: 6
Fact verification: ULID exists in CSV ✓
Result: Exact acceptance tests from spec, validated against SoT
```

### Review Mode Query
```
Query: "Why did sprint 3 fail to meet the deadline?"
Retrieval:
  - /ventures/acme/projects/proj-001/sprints/sprint-003/retro_notes.md
  - /ventures/acme/projects/proj-001/logs/*.csv (sprint 3 period)
  - /ventures/acme/decisions/*sprint-003*.md (related decisions)
  - /logs/context_actions.csv (actions during sprint 3)
k_in: 30 → k_out: 10
Result: Retrospective, task logs, blockers, and decisions made during sprint
```

## References
- Architecture spec: `/architecture-spec_v0.3.md` lines 23-27, 43-44, 91-92
- SoT schema: `/sot/context_schemas_v02.yaml` lines 165-174 (retrieval config)
- Mode-aware briefs: `/templates/*_brief_v01.md`
