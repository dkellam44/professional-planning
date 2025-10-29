# Execution Brief (v01)

**Metadata (for retrieval)**
- entity: project
- level: execution
- zone: internal
- version: v01
- tags: [project, execution, brief]
- source_path: /templates/execution_brief_v01.md
- date: YYYY-MM-DD

---

## Purpose
This brief supports **Execution Mode** — precise, canonical facts for implementing the project. All IDs, dates, constraints, and acceptance criteria must be verified against structured SoT (CSV/YAML).

---

## 1) Project Identity (Canonical)
- **Name**:
- **ID** (ULID): `[Verify in /sot/projects.csv]`
- **Parent Engagement/Program ID**: `[Verify in /sot/]`
- **Type**: `[Client Delivery | Internal | Learning | Operations]`
- **Status**: `[Backlog | Active | Done | Blocked]`
- **Owner/Lead**:
- **Repo Path**:

## 2) Objective (One-Line)
<!-- Precise, actionable objective. What are we building/delivering? -->

## 3) Constraints & Requirements
### Technical Constraints:
-

### Business Constraints:
- **Deadline**: `YYYY-MM-DD` _(verified: /sot/projects.csv)_
- **Budget/Effort Cap**:
- **Quality Gate**:

### Compliance/Security:
- **Zone**: `[public | internal | private | restricted]`
- **PII/Sensitive Data**: `[Yes | No]`
- **Required Approvals**:

## 4) Deliverables & Acceptance Tests
<!-- Link to detailed specs in /deliverables/ -->

| Deliverable ID | Name | Acceptance Test | Reviewer | Status |
|----------------|------|-----------------|----------|--------|
| `DEL-xxxxx`    |      |                 |          |        |

**Detailed Specs**:
- See: `/ventures/{venture}/projects/{project}/deliverables/{deliverable_id}/context/deliverable_spec_v01.md`

## 5) Dependencies (Canonical)
<!-- IDs must be verified in SoT -->

### Upstream Dependencies:
- `[Entity Type: ID]` — Status:

### Downstream Consumers:
- `[Entity Type: ID]` —

### External Dependencies:
-

## 6) Current Status & Progress
- **Last Updated**: `YYYY-MM-DD`
- **% Complete**:
- **Current Sprint**:
- **Blockers**:
  - [ ] Blocker 1
  - [ ] Blocker 2

## 7) Execution Workflow
<!-- Step-by-step process for this project -->
1.
2.
3.

**Entry Criteria**:
**Exit Criteria**:

## 8) Key Facts & Decisions (Canonical)
<!-- Link to ADRs for important decisions -->
- Decision: [Brief description]
  → See: `/ventures/{venture}/decisions/{adr_file}.md`

## 9) Session Handoff Object (SHO)
**Location**: `./context/SHO.json`

**Current MITs** (from SHO):
1.
2.
3.

## 10) Logs & Audit Trail
- **Context Actions Log**: `/logs/context_actions.csv`
- **Project Log**: `./logs/project_actions.csv`

---

## Fact Verification Checklist
Before finalizing any execution action, verify:
- [ ] All IDs (ULIDs) exist in `/sot/{entity}.csv`
- [ ] All dates match canonical source (SoT, not Markdown)
- [ ] All dependencies referenced exist and are active
- [ ] Acceptance criteria match deliverable specs exactly
- [ ] Zone inheritance rules followed (no unauthorized downgrades)

---

**Transition to Review**: After execution completes (or if blocked), update `review_brief_v01.md` with outcomes, decisions, and learnings.
