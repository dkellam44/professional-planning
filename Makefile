plan:
	python eval/run_eval_stub.py
	@echo "Route mode and refresh planning brief manually or via chat mission."

eval:
	python eval/run_eval_stub.py

promote:
	python scripts/promote_notes_stub.py || true
	@echo "Promote durable notes per ADR rules (stub)."

