# Venture Layer — README_THIS_LEVEL

**This folder overlays the Portfolio SoT.** Do not copy `/sot` or `/prompts` here.

## Required at this level
- `/context/venture_brief.md` (positioning, ICP, OKRs)
- `/context/playbooks/*` (SOPs specific to this venture)
- `.contextrc.yaml` → use `templates/contextrc.venture.yaml` as a base
- `/decisions/*.md` for policy deviations

## Inheritance
- Schemas, prompts, eval harness are referenced from the Portfolio root via `.contextrc.yaml`.

## Promotion
- When a playbook becomes global, promote to `/portfolio/context/` and document via ADR.
