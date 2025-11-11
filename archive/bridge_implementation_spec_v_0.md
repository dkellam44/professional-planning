# Bridge Implementation Spec v0.1

**Stack:** ChatGPT (custom GPTs) · Notion (Context Mesh) · GitHub (versioned knowledge) · n8n (automation)

**Architecture Names**

- **Meta-Layer:** Mission Control (HQ)
- **Observer Loop:** Manifold Navigator (strategy, reflection)
- **Bridge:** Strategy–Execution Bridge (translation + feedback)
- **Actor Loop:** Momentum Engine (execution, delivery)
- **Shared Memory:** Knowledge Log / Context Mesh (Notion)

---

## 1) Purpose & Scope

Implement a persistent, bi-directional **Bridge** that (a) translates strategic insights from **Manifold Navigator** into executable units for **Momentum Engine**, and (b) returns execution results to inform the next reflection cycle. The Bridge maintains **context** and **memory** via shared IDs, Notion relations, and versioned archives in GitHub.

---

## 2) High-Level Diagram (flow)

**Observer (Navigator)** → *Action Vectors* → **Strategy–Execution Bridge** → *Tasks* → **Actor (Engine)** → *Outcomes/Metrics* → **Bridge** → *Reflections* → **Observer (Navigator)**

**Shared:** Notion Context Mesh (Projects, Ventures, Roles, Goals/Values).\
**Archive:** GitHub repo (prompts, schemas, serialized runs, automation configs).

---

## 3) Notion Context Mesh — Databases & Relations

### 3.1 Manifold Runs (Observer Loop Log)

- **run\_id** (Title, unique; ULID/UUID)
- **timestamp** (Date)
- **essence** (Text, 1–2 sentence distilled insight)
- **latent\_map** (Rich text or file; optional table excerpt)
- **action\_vectors** (Rich text; human-readable list)
- **confidence\_avg** (Number, 0–1)
- **reflection\_next\_move** (Select: Expand | Refine | Collapse)
- **linked\_project** (Relation → Projects)
- **linked\_tasks** (Relation → Tasks; Rollup counts)
- **signals\_to\_watch** (Multi-select or relation → Metrics)
- **decision\_record** (Rich text: why this, why not that?)
- **privacy\_mode** (Select: standard | anonymize)

**Views**: All Runs; By Project; This Week; High Confidence; To Review.

### 3.2 Tasks / Actions (Actor Loop)

- **task\_id** (Title, unique)
- **origin\_run\_id** (Relation → Manifold Runs)
- **project** (Relation → Projects)
- **horizon** (Select: today | week | month)
- **energy** (Select: low | medium | high)
- **status** (Select: backlog | in progress | blocked | done)
- **metric / signal** (Relation → Metrics)
- **outcome\_notes** (Rich text)
- **completed\_at** (Date)

**Views**: Inbox (new from Bridge), Today, Week, Done (with origin\_run\_id), By Project.

### 3.3 Projects

- **project\_id** (Title)
- **venture** (Relation → Ventures)
- **objective** (Text)
- **status** (Select)
- **linked\_runs** (Relation → Manifold Runs)
- **linked\_tasks** (Relation → Tasks)
- **values\_alignment** (Multi-select: e.g., authenticity, learning, service)

### 3.4 Reflections (optional standalone DB; or embed in Manifold Runs)

- **reflection\_id** (Title)
- **task** (Relation → Tasks)
- **run\_id** (Relation → Manifold Runs)
- **summary** (Rich text)
- **insight\_tag** (Multi-select)

### 3.5 Metrics (Signals)

- **metric\_id** (Title)
- **definition** (Text)
- **collection\_method** (Select: manual | automated)
- **target** (Number/Text)
- **current\_value** (Number/Text)
- **linked\_tasks** (Relation → Tasks)

### 3.6 Ventures / Roles (optional)

- **venture\_id** (Title) · **role\_id** (Title)\
  Use for filtering Runs/Tasks by business line or hat you’re wearing.

---

## 4) ID & Versioning Conventions

- **run\_id**: ULID (timestamp sortable). Example: `01JBS6ABCDXYZ…`
- **task\_id**: `projslug_YYYY-MM-DD_short-title`
- **schema\_version** in Navigator outputs: `1.2`
- **Git commits**: `runs/2025-10-05_01JBS6…_navigator.json` with message `Navigator run: Essence — "{short phrase}"`

---

## 5) Custom GPTs — Configuration Notes

### 5.1 Manifold Navigator (Observer Loop)

- **Instructions**: use *Manifold Navigator v1.2* prompt
- **Capabilities**: Web browsing (optional), Code Interpreter (optional), **Notion** connector (create/read Manifold Runs), **GitHub** connector (commit prompt/schema changes; optional commit serialized runs)
- **Output**: Use structured Markdown/JSON with fields matching Manifold Runs
- **Controls**: presets (Discovery Burst, Weekly Compass, Bold Move Audit)

### 5.2 Momentum Engine (Actor Loop)

- **Instructions**: execution-focused; convert Action Vectors → Tasks; prompt for metric/signal; update status
- **Capabilities**: **Notion** connector (create/update Tasks; read Projects)
- **Bridge micro-prompt**: When task done, summarize outcome + metric → append to origin run (reflection field)

---

## 6) Bridge Workflows

### 6.1 Manual MVP (no-code)

1. **Observer**: Run Navigator preset; review **Action Vectors**.
2. **Bridge—Create Tasks**: Say: *“Create tasks in Notion → Tasks DB; link to run\_id {…} and project {…}.”*
3. **Actor**: Execute; update status and outcome notes.
4. **Bridge—Feedback**: Say: *“Summarize outcomes for tasks linked to run\_id {…} and write reflection back to Manifold Runs.”*

### 6.2 n8n Automation (low-code)

**Flow A — Runs → Tasks**

- **Trigger**: Notion “Manifold Runs” new row (poll)
- **Transform**: Parse `action_vectors` into discrete items
- **Create**: Notion “Tasks” rows (set `origin_run_id`, `project`, `horizon`, `energy`)
- **Notify**: Optional Slack/Email summary of created tasks

**Flow B — Tasks → Reflections**

- **Trigger**: Notion “Tasks” status = `done`
- **Gather**: Task `outcome_notes`, `metric` values
- **Summarize**: Call OpenAI with **Bridge Feedback Prompt**
- **Write-back**: Update linked `run_id` → `decision_record` (append), `signals_to_watch`, `reflection_next_move`
- **Archive**: Serialize summary JSON → GitHub `/runs/` (optional)

**Flow C — Weekly Compass**

- **Schedule**: Weekly cron
- **Synthesize**: Pull last week’s Runs/Tasks → create context block
- **Prompt**: Call Navigator to generate new Weekly Compass run
- **Create**: Log new Run and seed fresh Tasks

---

## 7) Bridge Feedback Prompt (stub)

> **Goal:** Convert execution outcomes into reflection that updates the originating run.
>
> **Input:**
>
> - origin\_run\_id: {id}
> - tasks: [ {task\_id, outcome\_notes, metric\_value, blocked?, insights} ]
> - project context (optional)
>
> **Output:**
>
> - reflection\_summary (100–150 words)
> - decision\_record (why this worked / didn’t)
> - signals\_to\_watch (list)
> - next\_move (Expand | Refine | Collapse)

---

## 8) Security & Privacy

- Prefer **anonymize-sensitive** in runs that contain personal data.
- Store secrets (API tokens) in n8n vault/credentials, not in GPT “Knowledge”.
- For GitHub, private repo with least-privilege access; avoid committing raw personal data.

---

## 9) Rollout Checklist

-

---

## 10) Next Versions (Roadmap)

- v0.2: Add embeddings to find recurring essences; dashboard of latent themes
- v0.3: Action recommendation based on past success patterns
- v0.4: Multi-venture scaling and client templates; permissioned Notion workspaces

---

### Appendix A — Example Notion Property Definitions

**Selects**: horizon, energy, status, reflection\_next\_move\
**Relations**: Tasks.project → Projects; Tasks.origin\_run\_id → Manifold Runs\
**Rollups**: Projects.linked\_tasks → count; Manifold Runs.linked\_tasks → done/% done

### Appendix B — Example JSON (serialized run)

```json
{
  "schema_version": "1.2",
  "run_id": "01JBS6JKF1A2B3C4D5",
  "timestamp": "2025-10-05T18:02:00-07:00",
  "project_id": "opsstudio_website",
  "essence": "Build trust through radical clarity and predictable outcomes.",
  "action_vectors": [
    {"description":"Draft homepage essence line","horizon":"today","energy":"low","metric":"approved_copy_v1"},
    {"description":"Create 3-client proof points","horizon":"week","energy":"medium","metric":"case_snippets_v1"}
  ],
  "signals_to_watch": ["lead_quality_notes", "time_to_first_reply"],
  "reflection_next_move": "Refine"
}
```

