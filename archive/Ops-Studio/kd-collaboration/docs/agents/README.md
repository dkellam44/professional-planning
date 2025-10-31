# Agents

This folder gives human collaborators and GenAI executors a shared, repeatable way to do work in this repo.

## Why this exists
- Make the end goals and human context explicit (so agents don't guess).
- Provide task cards with clear inputs/outputs and acceptance criteria.
- Tie every change to a context note in `docs/context/`.

## Structure
- `prompts/` — reusable prompts/guardrails for agents.
- `tasks/` — one file per task (YAML). This is the handoff your agent runs.
- `runbooks/` — optional step-by-step “how we do X” instructions for recurring ops.

## Workflow
1. Write a task card in `docs/agents/tasks/` (copy the template).
2. Reference relevant context notes (e.g., `docs/context/2025-10-12-refresh-and-blurbs.md`).
3. Agent executes and commits using the task’s commit template.
4. Add/Update a context note documenting decisions and outcomes.
5. Update `docs/context/README.md` (Active vs. Archived) if needed.
