---
- entity: guide
- level: internal
- zone: internal
- version: v01
- tags: [operations-studio, coda, github, sot]
- source_path: /ventures/ops-studio/CODA_GITHUB_GUIDE.md
- date: 2025-10-28
---

# Coda vs GitHub: What Goes Where?

**Simple Rule:** GitHub = Structure/Specs, Coda = Live State

---

## Quick Decision Tree

### Offer Spec (What you sell)
→ **GitHub:** `/ventures/ops-studio/offers/[name]/offer_brief.md`
→ **Coda:** Reference link in Offers table

### Prospect/Deal Tracking
→ **Coda:** Deal table (stage, likelihood, value, owner)
→ **GitHub:** Only if documenting case study post-sale

### Task/Todo
→ **Coda:** Task table
→ **GitHub:** Only if it needs documentation

### Service Blueprint (How you deliver)
→ **GitHub:** `/ventures/ops-studio/context/playbooks/`
→ **Coda:** Reference link

### Session Notes
→ **GitHub:** `/ventures/ops-studio/archive/[engagement]/sessions/`
→ **Coda:** Brief summary in task notes

### Business Metrics (Revenue, pipeline)
→ **Coda:** MetricSnapshot table
→ **GitHub:** Never (real-time data doesn't version)

---

## Authority Rules

**GitHub Wins (Authoritative):**
- Offer structures
- Service blueprints
- Decision process (ADRs)
- Learning notes

**Coda Wins (Authoritative):**
- Current deal stage
- Prospect list
- Pipeline probability
- Actual dates/deadlines

---

## Don't Overthink It

**If unclear:**
1. Is it a file that needs history? → GitHub
2. Does it change daily? → Coda
3. Still unsure? → Start in GitHub (easier to move later)

