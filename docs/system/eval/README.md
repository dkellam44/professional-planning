
# Eval Harness

This folder contains configs and runners for evaluation of retrieval and generation quality.

## Files
- `dspy_config.yaml` — DSPy configuration (default framework) + parity targets for RAGAS/DeepEval.
- `run_ragas_eval.py` — evaluation runner. Uses RAGAS if installed; otherwise falls back to a lightweight heuristic so the CI still runs.
- `eval_set_example.csv` — sample dataset. Expected columns: `id?,question,answer,expected,context`.

## Setup

### Option A — Heuristic only (no dependencies)
Works out of the box. The runner computes simple proxy scores (Jaccard overlap).

### Option B — RAGAS
```bash
pip install ragas datasets evaluate  # and a sentence-transformers backend if needed
python eval/run_ragas_eval.py
```

### Option C — DeepEval
If you prefer DeepEval, create `run_deepeval.py` using their API and wire the Makefile to call it.

## Gate
- The acceptance gate is read from `dspy_config.yaml` (`gate.min_average`, default 0.80).
- The runner exits **0** on pass, **1** on fail — suitable for Make/CI.

## Outputs
- `eval_results_YYYYMMDDTHHMMSSZ.json` — metrics by example and averages printed to stdout.
