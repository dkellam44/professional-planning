
- entity: offer
- level: definition
- zone: internal
- version: v01
- tags: [offer, productized-service]
- source_path: /ventures/reference-venture-example/offers/example-offer/context/offer_brief_v01.md
- date: YYYY-MM-DD

# Offer Brief — Context Architecture Sprint (Reference)

## 1) Positioning & ICP
Design and deploy a vendor-agnostic, mode-aware context repo for a solo operator or small team.

## 2) Scope (In / Out)
**In:** Portfolio scaffolding, venture/project setup, retrieval config, eval harness.  
**Out:** Proprietary app integrations beyond MCP scope; full data migrations.

## 3) Deliverables & Acceptance Tests
- Repo scaffold matches `repo_structure_v01.json` ✔
- All MD files contain required metadata header ✔
- Eval gate ≥ 0.80 on faithfulness/relevancy/precision ✔
- Logs written to `/logs/context_actions.csv` ✔

## 4) SLA & Response Windows
- Builder iteration: 1–2 business days
- Review cycles: ≤ 24h turnaround

## 5) Pricing & Tiers (example)
- Sprint (fixed): $X
- Run & Improve (monthly): $Y

## 6) Risks & Guardrails
- Path misconfiguration → enforce `REPO_ROOT`
- Scope creep → adhere to template instantiation ADR
