# -------- Makefile (eval gate) --------

.PHONY: help eval eval-strict lint

help:
	@echo "Targets:"
	@echo "  make eval         - run eval (prints averages; pass/fail by gate)"
	@echo "  make eval-strict  - run eval and exit non-zero if gate not met"

eval:
	@echo "Running evaluation (gate from eval/dspy_config.yaml)..."
	@python3 eval/run_ragas_eval.py || true

eval-strict:
	@echo "Running evaluation (strict gate)..."
	@python3 eval/run_ragas_eval.py || (echo 'Eval gate failed. Block changes until fixed.' && exit 1)
