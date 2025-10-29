# Review Brief (v01)

**Metadata (for retrieval)**
- entity: project
- level: review
- zone: internal
- version: v01
- tags: [project, review, retrospective]
- source_path: /templates/review_brief_v01.md
- date: YYYY-MM-DD

---

## Purpose
This brief supports **Review/Debug Mode** — retrospective analysis of what happened, decisions made, problems encountered, and learnings extracted. Enables diagnosis, learning extraction, and promotion to venture/portfolio playbooks.

---

## 1) Project Identity
- **Name**:
- **ID** (ULID):
- **Parent Engagement/Program**:
- **Final Status**: `[Done | Blocked | Cancelled]`
- **Duration**: `YYYY-MM-DD` → `YYYY-MM-DD`
- **Owner/Lead**:

## 2) Objective (Restated)
<!-- What we set out to do (from planning/execution briefs) -->

## 3) Outcomes & Results
### Delivered:
- [ ] Deliverable 1 — Status: `[Accepted | Rejected | Partial]`
- [ ] Deliverable 2 — Status: `[Accepted | Rejected | Partial]`

### Acceptance Test Results:
| Deliverable | Test | Result | Notes |
|-------------|------|--------|-------|
|             |      |        |       |

### Metrics & Impact:
- **Planned Effort**:
- **Actual Effort**:
- **Variance**:
- **Client/Stakeholder Feedback**:

## 4) Timeline & Milestones
| Sprint/Phase | Planned End | Actual End | Delta | Notes |
|--------------|-------------|------------|-------|-------|
|              |             |            |       |       |

**Key Delays/Blockers**:
-

## 5) Decisions Made During Execution
<!-- Link to ADRs created during project -->
- **Decision**: [Brief description]
  → See: `/ventures/{venture}/decisions/{adr_file}.md`
  → Impact:

## 6) Problems Encountered & Solutions
### Problem 1:
- **Description**:
- **Root Cause**:
- **Attempted Solutions**:
- **Final Resolution**:
- **Time Lost**:

### Problem 2:
- **Description**:
- **Root Cause**:
- **Attempted Solutions**:
- **Final Resolution**:
- **Time Lost**:

## 7) What Went Well
<!-- Practices, tools, approaches that worked -->
-
-

## 8) What Didn't Go Well
<!-- Practices, tools, approaches that failed or slowed us down -->
-
-

## 9) Surprises & Learnings
<!-- Unexpected discoveries, insights, new knowledge -->
-
-

## 10) Recommendations & Action Items
### For Future Similar Projects:
-

### To Promote to Venture Playbook:
- Pattern/Practice:
  → Promote to: `/ventures/{venture}/context/playbooks/{playbook_name}.md`
  → Requires: ADR + PR

### To Promote to Portfolio Level:
- Pattern/Practice:
  → Promote to: `/context/playbooks/{playbook_name}.md`
  → Requires: ADR + PR + reviewer sign-off

### Process Improvements:
-

## 11) Technical Debt & Follow-Up Work
| Item | Severity | Effort | Owner | Due Date |
|------|----------|--------|-------|----------|
|      |          |        |       |          |

## 12) Archive & Retention
- **Project TTL**: `project_end + 90 days` = `YYYY-MM-DD`
- **Promotion Deadline**: `YYYY-MM-DD`
- **Archive Location**: `/z_archive/projects/{project_id}/`

### Items to Archive:
- [ ] Sprint logs
- [ ] Session notes
- [ ] Scratch/planning docs
- [ ] Logs older than 180 days

### Items to Promote/Preserve:
- [ ] Key decisions (ADRs)
- [ ] Reusable patterns (to playbooks)
- [ ] Deliverable templates
- [ ] Client artifacts (if contractually required)

## 13) Retrospective (Team/Solo)
### What Should We:
- **Start Doing**:
- **Stop Doing**:
- **Keep Doing**:

### Shout-Outs & Thanks:
<!-- Recognize contributors, helpful stakeholders, etc. -->

---

## Review Checklist
- [ ] All deliverables documented with final status
- [ ] All decisions captured as ADRs (or linked)
- [ ] Key learnings extracted and tagged for promotion
- [ ] Technical debt logged with owner/timeline
- [ ] Retrospective completed
- [ ] Archive plan documented with dates
- [ ] Next 3 MITs identified (if follow-up work exists)

---

**Post-Review Actions**:
1. Create ADRs for any undocumented decisions
2. Submit PRs to promote reusable patterns to playbooks
3. Update SoT (CSV/YAML) with final project status
4. Log review completion to `/logs/context_actions.csv`
5. Schedule archive date in calendar
