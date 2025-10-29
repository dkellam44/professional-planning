---
- entity: checklist
- level: internal
- zone: internal
- version: v01
- tags: [repository, triage, organization, phase-0.5]
- source_path: /REPO_TRIAGE_CHECKLIST.md
- date: 2025-10-28
---

# Repository Triage Checklist — Phase 0.5

**Purpose:** Track decisions for each untracked directory during repository stabilization

---

## Decisions Made

### ✅ KEEP & TRACK (Add to Git)

- [x] `.github/workflows/` — GitHub Actions validation workflows
- [x] `agents/` — Agent operating context (decisions, templates, playbooks, sessions)
- [x] `business_model/context/` — Venture specifications
- [x] `docs/` — Infrastructure, architecture, operational documentation
- [x] `prompts/` — Prompt templates and bundles
- [x] `sot/` — Source of Truth governance (moved from z_archive/)

### ⚠️ KEEP but DON'T TRACK (Review Regularly)

- [x] `inbox/` — Unsorted content awaiting triage (review weekly)
- [x] `y_collection_box/` — Temporary working files (review per session)
- [x] `z_archive/` — Historical reference (don't track changes)

### 🚫 IGNORE (Added to .gitignore)

- [x] `**/.DS_Store` — macOS system files
- [x] `**/*.swp` — Vim temp files
- [x] `**/*.tmp` — Temporary files

---

## Special Cases

### z_archive/Ops-Studio/kd-collaboration/
**Status:** KD engagement closed
**Decision:** Archive for learning reference
**Action:** Create /z_archive/engagements/kd-2024-closed/ structure in Phase 1

---

## Status

✅ Complete — Ready for Phase 0.5 Task 3

