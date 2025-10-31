# Builder Prompt v0.3 — Generate Context Architecture Package

**Role:** You are an architect/implementer. Generate and/or update a portable, vendor-agnostic context system that supports planning in chat and execution via Claude Code.
> REPO_ROOT = "/Users/davidkellam/portfolio"
> All paths below are relative to REPO_ROOT unless stated otherwise.

---

## Inputs
- Use `${REPO_ROOT}/architecture-spec_v0.3.md` as the canonical human spec.
- Use `${REPO_ROOT}/sot/context_schemas_v02.yaml` for the machine-readable SoT.
- Use `${REPO_ROOT}/repo_structure_v01.json` as the authoritative **repo map** describing all required directories and files across Portfolio, Venture, Offer, Engagement, Program, Project, and other layers.
- Use `${REPO_ROOT}/SCHEMA_GUIDE_v0.2.md` for human-readable schema descriptions.
- Place generated outputs according to `repo_structure_v01.json`. Create placeholder files with metadata headers when content is not yet available.

---

## Required Outputs
1. **Validate the SoT YAML**
   - Confirm required entities, zones, and IDs match what is listed in `repo_structure_v01.json`.
   - Add stubs for any missing entities (Offer, Engagement, Program, Project, etc.) if not found.

2. **Build or Refresh Directory Tree**
   - Create the folder structure exactly as defined in `repo_structure_v01.json`.
   - For each required file in the map, create or update with proper metadata headers.
   - Use templates from `${REPO_ROOT}/templates/` when available (e.g., offer, engagement, program, deliverable, etc.).
   - Do **not** duplicate `/sot` or `/prompts`; instead reference them via `.contextrc.yaml` files.
   - Insert `.contextrc.yaml` templates into Venture and Project directories with correct relative paths to Portfolio SoT and Prompts.

### Template Usage Rules
Follow the Template Instantiation ADR (`/decisions/2025-10-17_template-instantiation-approach_v01.md`):

**If a matching template exists:**
- Use the rich template (e.g., `offer_brief_v01.md`, `planning_brief_v01.md`)
- Copy structure including all section headings
- Fill in metadata header with actual values (entity, zone, source_path, date)
- Leave content sections empty or with inline guidance comments
- Log instantiation mode as `template` in `/logs/context_actions.csv`

**If no matching template exists:**
- Generate thin placeholder using pattern from `templates/placeholder_scaffold.md`
- Include required metadata header
- Add generic sections (Key Facts, Open Questions, References, Acceptance Criteria)
- Log instantiation mode as `placeholder` in `/logs/context_actions.csv`

**Special template mappings:**
- Project → Create 3 mode-aware briefs: `planning_brief_v01.md`, `execution_brief_v01.md`, `review_brief_v01.md`
- Project → Instantiate `SHO_template.json` as `context/SHO.json`
- Venture → Use `contextrc.venture.yaml` template as `.contextrc.yaml`
- Project → Use `contextrc.project.yaml` template as `.contextrc.yaml`

3. **Implement Metadata Scaffolds**
   - Every Markdown file must begin with:
     ```
     - entity: <entity_name>
     - level: <level_name>
     - zone: <zone>
     - version: <version>
     - tags: [tag1, tag2]
     - source_path: <relative_path>
     - date: YYYY-MM-DD
     ```

4. **Respect TTL / Decay Rules**
   - Session notes TTL: 14–30 days; promote durable items to venture playbooks.
   - Project briefs TTL: project end + 90 days; promote key learnings upward.
   - Update or create ADR entries if TTL or promotion policies change.

5. **Logging**
   - Append one line to `/logs/context_actions.csv` for each major action:
     `ts, agent, action, entity, path, latency_ms, token_in, token_out, success, notes`
   - The `notes` field must contain `template` or `placeholder` to track instantiation mode.

6. **Return Summary**
   - List all created or modified files and directories.
   - Report any missing context or dependency files as `NEEDS_MORE_CONTEXT`.
   - Suggest next 3 MITs (Most Important Tasks).

---

## Constraints
- Keep system preamble stable for caching; place dynamic context after it.
- Maintain mode-aware briefs (Planning, Execution, Review) for each Project.
- Retrieval: hybrid + rerank (`k_in=30 → k_out=6–8`) with citations.
- Enforce zone-based redaction: `public | internal | private | restricted`.

---

## Acceptance Criteria
- Directory tree matches `repo_structure_v01.json` exactly.
- Every Markdown file includes required metadata header.
- `eval/run_eval_stub.py` passes (≥ 0.80 average).
- No secrets embedded in prompts or config.
- All actions logged in `/logs/context_actions.csv`.
- Return structured summary of actions and MITs.

---

## Example Workflow
1. Read the spec and SoT.
2. Parse `repo_structure_v01.json` to know required folders/files.
3. Build directories and seed placeholder files (if missing).
4. Insert `.contextrc.yaml` templates with relative paths.
5. Update logs.
6. Return report and next-step suggestions.
