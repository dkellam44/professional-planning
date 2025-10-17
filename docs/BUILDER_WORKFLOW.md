# Builder Workflow — Context Architecture Instantiation (v0.1)

> Purpose: A step-by-step guide for running the **builder prompt** to scaffold ventures/projects, populate templates, and validate the output. This doc is for both humans and agents.

---

## 0) Prereqs & Conventions

- **REPO_ROOT**: the portfolio root on your machine (e.g., `/Users/davidkellam/portfolio`).
- Files the builder reads:
  - `${REPO_ROOT}/prompts/builder_prompt_v0.3.md`
  - `${REPO_ROOT}/architecture-spec_v0.3.md`
  - `${REPO_ROOT}/SCHEMA_GUIDE_v0.2.md`
  - `${REPO_ROOT}/repo_structure_v01.json` (authoritative repo map)
  - `${REPO_ROOT}/sot/context_schemas_v02.yaml` (SoT — entities/fields)
  - `${REPO_ROOT}/templates/` (entity & config templates)
- **Do not** duplicate `/sot` or `/prompts` into ventures/projects. Those are inherited through `.contextrc.yaml` in each venture/project.

---

## 1) How to Run the Builder Prompt

### A) Claude (or GPT) in a chat IDE (recommended)
1. Open the model where you can upload files or point to a local repo.
2. Upload or reference the entire `${REPO_ROOT}` folder.
3. Open `${REPO_ROOT}/prompts/builder_prompt_v0.3.md` and copy the **entire** prompt.
4. Paste into the model; confirm the model can read the files listed under **Inputs**.

### B) Claude Code CLI / local agent
1. Ensure the agent's working directory == `REPO_ROOT` **or** explicitly set `REPO_ROOT` at the top of the prompt.
2. Start a session and paste the prompt text.
3. If your agent supports a "run mission" command, pass the prompt and grant file access to the repo.

> Tip: If your agent starts at your user home (`/Users/davidkellam`), either **cd** into `portfolio/` first or set `REPO_ROOT` in the prompt so all paths resolve.

---

## 2) What Inputs the Builder Requires

At minimum, the builder will ask for:
- **venture_slug** (e.g., `ops_studio`)
- **project_slug** (e.g., `audience-research-flywheel`)

Optional (if present, the builder will use them):
- **engagement** (client-facing) or **program** (internal) parent container
- **offer_slug** (to attach a productized service)
- **deadlines** / **owners** for initial tasks/sprints
- **zone** (default `internal`) for created files
- Any **ULIDs** you already have (otherwise the builder leaves placeholders or generates IDs if allowed)

**Where these appear:**
- Folder names under `ventures/<venture_slug>/projects/<project_slug>/`
- Metadata headers in Markdown files
- The initial `context/SHO.json` within the project

---

## 3) How Templates Get Populated

The builder uses templates from `${REPO_ROOT}/templates/` to create required files specified by `repo_structure_v01.json`.

- **Configuration templates**:
  - `.contextrc.venture.yaml` → copied into `ventures/<venture>/.contextrc.yaml`, paths adjusted to point back to Portfolio SoT/Prompts/Eval.
  - `.contextrc.project.yaml` → copied into `ventures/<venture>/projects/<project>/.contextrc.yaml`.

- **Context templates** (examples):
  - `planning_brief_v01.md`, `execution_brief_v01.md`, `review_brief_v01.md` (if present in templates; otherwise the builder writes thin placeholders using `templates/placeholder_scaffold.md`).
  - `SHO_template.json` → copied to `context/SHO.json` and filled with your objective/deadlines.

- **Entity templates**:
  - Offer/Engagement/Program/Deliverable/Sprint/Task/Area/Campaign/Experiment/Learning/Environment skeletons are available; the builder only instantiates those you request in this run (or those required by `repo_structure_v01.json`).

> Every Markdown file created includes the standard **metadata header** (entity, level, zone, version, tags, source_path, date).

---

## 4) Manual Steps After the Builder Runs

- **Fill the Project briefs**: Add canonical facts, constraints, MITs, deadlines.
- **Complete `context/SHO.json`**: Ensure `objective`, `deadline`, and `next_3_MITs` are accurate.
- **Add Venture specifics** (if this was a new venture):
  - `ventures/<venture>/context/venture_brief.md` (positioning, ICP, venture-level OKRs).
- **ULIDs**: Replace any placeholder ULIDs in files with real ULIDs if your policy is to pre-assign them.
- **ADR**: If you changed policies (chunking, TTL, naming), add/update an ADR in `/decisions/`.
- **Notion** (if in scope now): Update `/integrations/NOTION_INTEGRATION_CONTRACT_v01.md` with db_ids; backfill `ulid` into Notion databases and `notion_id_map.csv` if needed.

---

## 5) How to Validate the Output

### A) Quick checks
- The builder should log each major action to `${REPO_ROOT}/logs/context_actions.csv`.
- Confirm new directories exist per `repo_structure_v01.json`.
- Verify `.contextrc.yaml` files point back to Portfolio SoT/Prompts/Eval with correct **relative paths**.

### B) Eval harness
From `REPO_ROOT`:
```bash
make eval
# or
python eval/run_eval_stub.py
```
**Passing criteria**: average score ≥ **0.80** (otherwise fix and re-run).

### C) Metadata lint
Open a few of the created Markdown files and verify the metadata block is present and accurate:
```
- entity: project
- level: brief
- zone: internal
- version: v01
- tags: [planning]
- source_path: /ventures/<venture>/projects/<project>/context/planning_brief_v01.md
- date: YYYY-MM-DD
```

### D) S.H.O. readiness
Check `context/SHO.json` exists and the objective/deadline/MITs are set. This is required before kicking off any Claude Code mission.

---

## 6) Common Issues & Fixes

- **Wrong working directory**: Set `REPO_ROOT` at the top of the prompt or `cd` into the repo before running.
- **Missing templates**: The builder falls back to `templates/placeholder_scaffold.md` if a specific template is absent.
- **Broken relative paths in `.contextrc.yaml`**: Regenerate from the templates; ensure correct `../../..` hops to Portfolio root.
- **Eval gate failing**: Review retrieval metadata coverage and citations; fix stubs that lack metadata or canonical facts.

---

## 7) Next Run Ideas

- Instantiate **Offer** + **Engagement** for a client-facing project.
- Add a **Program** container if multiple projects need shared milestones.
- Wire **Notion** sync (ULIDs, id map) once folder structure stabilizes.
