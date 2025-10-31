# Contributing & Agent Protocol

## Claude Code Mission Protocol
1. PLAN → propose change list, diffs preview, and test plan.
2. CONFIRM → wait for explicit human approval.
3. APPLY → small, atomic changes only.
4. DIFF → show changes; link to files.
5. TEST → run checks; summarize results.
6. COMMIT → conventional message; reference ADR/ticket.
7. LOG → append `/logs/context_actions.csv`.

## Commit Message Format (Conventional)
- feat(scope): summary
- fix(scope): summary
- docs(scope): summary
- chore(scope): summary
- refactor(scope): summary

## PR Checklist
- [ ] Mode‑aware briefs updated (if applicable)
- [ ] Metadata headers present & correct
- [ ] Eval gate ≥ 0.80 or unchanged
- [ ] Logs updated
- [ ] ADRs added/updated when policy changes
