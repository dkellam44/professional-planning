# Founder HQ → SoT v0.2 Mapping
- entity: portfolio
- level: integration
- zone: internal
- version: v0.2
- tags: [coda, mapping, authority, sot]
- source_path: /integrations/coda/founder_hq_to_sot_v0_2.md
- date: 2025-10-17

---

## Overview
Coda (Founder HQ) captures live execution state, while GitHub stores the authoritative, versioned documentation. The tables below outline field-level ownership so automations know which system may write each value.

**Doc ID**: `CxcSmXz318` (DK Enterprise OS). See `coda_table_ids.txt` for full table identifiers referenced below.

| Entity | Coda Table | Key Fields (Coda-owned) | GitHub-owned Fields | Notes |
|--------|------------|--------------------------|---------------------|-------|
| Pass | `Passes` | `pass_id`, `title`, `status`, `owner`, `next_action`, `due_date` | `documentation_path`, `acceptance_criteria` | Coda tracks progress; GitHub holds the detailed spec and acceptance tests. |
| Decision | `Decisions` | `decision_id`, `title`, `status`, `decision_date`, `owner`, `context_snapshot` | `adr_path`, `review_log` | ADR markdown remains in GitHub; Coda logs current state and reminders. |
| Task | `Tasks` | `task_id`, `summary`, `status`, `assignee`, `effort`, `due_date` | `template_path`, `standard_operating_steps` | GitHub templates define SOPs; Coda tracks execution state. |
| Lesson | `Lessons` | `lesson_id`, `title`, `status`, `captured_on`, `owner`, `linked_pass_id` | `playbook_path`, `long_form_writeup` | Lessons promoted to playbooks are versioned in GitHub, with Coda holding the lightweight capture. |
| MetricSnapshot | `Metrics` | `metric_id`, `title`, `period`, `value`, `source`, `owner` | `definition_path`, `calculation_spec` | GitHub maintains metric definitions and calculation specs; Coda records current values. |
| Asset (metadata) | `Assets` | `asset_id`, `title`, `status`, `location`, `steward`, `last_reviewed` | `artifact_path`, `build_instructions` | Assets reference GitHub artifacts; Coda monitors stewardship status. |

## Authority Summary
- **Coda writes** operational state fields (status, assignee, live values) and triggers automation webhooks when they change.
- **GitHub writes** structure-defining artifacts (templates, ADRs, specs) that agents and automations consume.
- n8n enforces these rules using `sot/authority_map_v0_2.json` before applying updates in either direction.

## Sync Expectations
- Updates to GitHub docs/templates run through GitHub Actions → n8n to refresh the corresponding Coda rows.
- Updates performed directly in Coda trigger n8n to open or update PRs so GitHub remains canonical.
- Any conflicts (both systems changing same field) fall back to GitHub authority; Coda change is held for manual review.
