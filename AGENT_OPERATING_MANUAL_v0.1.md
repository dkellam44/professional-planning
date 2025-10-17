# Agent Operating Manual (v0.1) — Context Architecture

**Purpose.** This manual tells any AI agent (or human) how to build and maintain the context system across Portfolio → Venture → Project layers.

---

## 1) Inheritance Model (do not clone SoT)
- **Portfolio root** is the **single Source‑of‑Truth (SoT)** for schemas, prompts, eval harness, global ADRs, and diagrams.
- **Venture** and **Project** layers only add thin overlays (briefs, playbooks, project facts) and **inherit** the SoT.
- Never copy `/sot` or `/prompts` into ventures/projects; **reference them** via `.contextrc.yaml`.

## 2) Required Files at Portfolio Root
- `architecture-spec_v0.2.md` — human spec (canonical instructions)
- `/sot/context_schemas_v01.yaml` — machine schema
- `/prompts/context_patterns.jsonl` — reusable prompt patterns
- `/eval/run_eval_stub.py` & `/eval/eval_set_example.csv` — eval harness
- `/decisions/*.md` — ADRs (global policies)
- `/context/*` — global briefs/SOPs
- `/logs/context_actions.csv` — action trail

## 3) Required Files in Venture
- `/ventures/<venture>/context/venture_brief.md` (positioning, ICP, OKRs)
- `/ventures/<venture>/context/playbooks/*`
- `/ventures/<venture>/.contextrc.yaml` (points up to portfolio SoT/Prompts/Eval)
- `/ventures/<venture>/decisions/*.md` when policy deviates from global

## 4) Required Files in Project
- `/ventures/<venture>/projects/<project>/context/planning_brief_v01.md`
- `/ventures/<venture>/projects/<project>/context/execution_brief_v01.md`
- `/ventures/<venture>/projects/<project>/context/review_brief_v01.md`
- `/ventures/<venture>/projects/<project>/context/SHO.json` (Session Handoff Object)
- `.contextrc.yaml` (short path pointers relative to project)
- `/decisions/*.md` for scope/approval changes
- `/logs/*` (optional, rolled‑up weekly)

## 5) Session Handoff Object (S.H.O.) contract
```json
{
  "objective": "string (single concrete goal)",
  "context_refs": [{"id":"ulid","path":"relative/path"}],
  "decisions_since_last": ["..."],
  "open_questions": ["..."],
  "blockers": ["..."],
  "next_3_MITs": ["..."],
  "deadline": "YYYY-MM-DD",
  "ttl_days": 3
}
```
- Inject S.H.O. at the start of any planning chat and each Claude Code mission.
- **Do not** proceed with code changes until the plan is acknowledged by the human.

## 6) Claude Code Mission Protocol (strict)
1. **PLAN**: Propose changes w/ file list, diffs preview, and test plan.
2. **CONFIRM**: Wait for explicit approval.
3. **APPLY**: Make small, atomic changes.
4. **DIFF**: Show diffs; link to files.
5. **TEST**: Run the test plan; summarize results.
6. **COMMIT**: Commit with conventional message; reference ticket/ADR.
7. **LOG**: Append an entry to `/logs/context_actions.csv`.

## 7) Retrieval Defaults
- Chunking: heading + semantic (~200–400 tokens), parent/child links.
- Strategy: hybrid (BM25 + embeddings) → cross‑encoder reranker; `k_in=30 → k_out=6–8`.
- Metadata on every MD: `entity, level, zone, version, tags[], source_path, date`.
- Answer contract: always provide citations (`path#section|line`).

## 8) Mode‑Aware Briefs
- Planning = breadth & trade‑offs; Execution = precise constraints; Review = trace & decisions.
- Use the provided templates; do **not** mix modes in one file.

## 9) TTL / Promotion
- Session notes TTL 14–30d; promote durable learnings to venture playbooks.
- Project briefs expire E+90d; promote evergreen items to venture → portfolio.
- Record promotions with ADRs.

## 10) Evaluation Gate
- Weekly eval run (RAGAS or DeepEval). Gate blocks deployment if average < 0.80.
- Default optimization framework: **DSPy**. TypeScript alternative: **Ax**.

## 11) Security & Zones
- Zones: `public | internal | private | restricted`. Redact before publishing.
- Secrets never appear in prompts or MD. Use environment/secret store for tokens.

## 12) Acceptance for “Good Build”
- All required files present at each layer.
- Briefs include metadata headers and correct mode content.
- Eval gate passes (≥ 0.80). Logs updated. No vendor‑locked memory used as SoT.

---

**Quick Start for Agents**  
1) Read `.contextrc.yaml` to find the portfolio SoT/Prompts/Eval.  
2) Ensure mode (PLANNING/EXECUTION/REVIEW) and select the brief template.  
3) Apply Claude Code Mission Protocol for any code change.  
4) Update logs and, if durable, promote notes per TTL rules.
