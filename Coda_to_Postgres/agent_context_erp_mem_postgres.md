Below is a **structured context document** you can hand to a stateless agent.
Assume the SQL schema from the previous turn is attached as: `schema_v0.1.sql`.

---

# Agent Context: Personal ERP + Agentic Memory Schema (v0.1)

## 0. Purpose

This document describes:

1. The **design decisions** behind the current Postgres schema.
2. The **intended responsibilities** of each schema/table.
3. How to **extend and implement** this design without breaking core invariants.

You (the agent) are assumed to have read access to `schema_v0.1.sql` and the ability to generate migrations, queries, and integration code based on it.

---

## 1. High-Level Architecture

### 1.1 Core Goal

Build a **Postgres-first, agent-native personal ERP**, where:

* **Postgres** is the **single source of truth** for:

  * Business data (CRM, Tasks, Projects, Financials, OKRs, etc.)
  * Agent state (sessions, events, runs, reflections, facts, goals, artifacts, blocks)
* **GUIs** (Tooljet, Docmost, etc.) are *thin projections* over the DB, not the main logic layer.
* **Agents** (CLI/IDE LLM tools, automation flows) are primary users of the schema.

### 1.2 Major Components

1. `erp` schema

   * Business/ERP tables (people, orgs, projects, engagements, tasks, OKRs).
2. `agent` schema

   * Agent/memory tables (sessions, events, execution runs, step evaluations, reflections, facts, goals, artifacts, blocks, block_actions).
   * **agent.profiles**
        * Defines the **Profile** (Identity) and **Harness** (Runtime Constraints).
        * Links the Agent to a specific LLM model, system prompt, and set of allowed **Tools**.
    * **agent.context_recipes**
        * Defines the **strategy** for *how* context is built (e.g., what to retrieve from `agent.facts`, `erp.tasks`, etc.).

3. External systems (not SoT, but important):

   * Vector DBs (Zep/Qdrant) for embeddings.
   * Graph DB (later) for graph reasoning.
   * Git + markdown docs (linked as `agent.artifacts`).
   * Orchestrators (n8n, scripts, CLI agents) using this DB.

---

## 2. Key Design Decisions & Invariants

### 2.1 Single Postgres Cluster, Multiple Schemas

* Use **one Postgres instance**.
* Separate concerns via **schemas**, not separate databases:

  * Business: `erp.*`
  * Agent/memory: `agent.*`
* Reason:

  * Enables **simple joins** between business entities and agent state.
  * Avoids premature complexity of cross-db federation.

> Agent invariant:
> **Never** design solutions that depend on separate physical DBs for `erp` vs `agent` at this stage.

---

### 2.2 ID Strategy & Cross-System Handoffs

* Each table has:

  * `id` (BIGSERIAL PK, DB-internal).
  * Optional `global_id` (TEXT, unique) for cross-system referencing.
* Vector/graph systems must always carry:

  * `entity_type` (e.g. `project`, `task`, `block`, `artifact`).
  * `entity_id` or `global_id`.

> Agent invariant:
>
> * When creating embeddings or graph nodes, **always include** enough metadata to map back to a specific Postgres row (`id` and/or `global_id`).
> * Never treat the vector/graph ID as authoritative on its own.

---

### 2.3 ERP vs Agent Responsibility Split

The architectural split is now three-fold:

1.  **`erp.*` tables** model **business reality**: Core entities (People, Tasks, Projects).
2.  **`agent.*` tables** model **execution, state, and memory**: Sessions, Events, Facts, Reflections, Goals, etc..
3.  **`agent.profiles` / `agent.tools` / `agent.context_recipes`** model **capability and environment**:
    * **Tools**: The primitive capabilities (`git_commit`, `run_sql`).
    * **Profile/Harness**: The Agent's identity, system prompt, permitted tools, and runtime environment constraints (sandbox, IDE settings).
    * **Context Recipe**: The dynamic logic that gathers memory and data from ERP/Agent tables for injection.

> Agent invariant:
>
> * **Do not** mix core business entities into `agent.*` tables.
> * **Do not** embed runtime environment configuration (the "harness") directly into `agent.sessions`; instead, link to `agent.profiles` and snapshot the config to `agent.sessions.applied_harness_config` for auditability.
> * Connect them via `subject_type` + `subject_id`, `source_table` + `source_id`, or `global_id`.

---

### 2.4 Subject Linking Pattern

Many agent tables support generic linking to business entities via:

* `subject_type` – a string label like `'project'`, `'engagement'`, `'task'`, `'personal'`, `'okr'`, etc.
* `subject_id` – PK of the corresponding ERP row.

Used in:

* `agent.sessions`
* `agent.events` (optional)
* `agent.execution_runs`
* `agent.goals`
* `agent.reflections` (via `focal_entity_type` / `focal_entity_id`)

> Agent invariant:
>
> * When creating a session, reflection, or execution run tied to a business entity, **always set `subject_type` and `subject_id`**.
> * Use consistent naming (`'project'`, `'engagement'`, `'task'`, `'okr'`), not arbitrary strings.

---

### 2.5 Blocks as the Semantic Unit

`agent.blocks` is the **unifying abstraction** for semantic content:

* `block_type`: `'sop_step'`, `'task'`, `'goal'`, `'doc_section'`, `'prompt_snippet'`, etc.
* `body_md`: markdown content (optional for non-text blocks).
* `source_table` + `source_id`: which ERP/agent table this block is derived from.
* `artifact_id`: link to `agent.artifacts` if this block is part of a larger doc.
* `vector_key` / `graph_key`: IDs in vector/graph stores.

`agent.block_actions` specifies **what actions an agent can take given a block**, mapping to tools/endpoints.

> Agent invariants:
>
> * When creating new semantic content that needs RAG/graph, **create a block** for it.
> * When making a block “do something” (e.g. start a workflow), use `block_actions` rather than embedding logic in the block content.

---

## 3. Table Roles (for Agents)

### 3.1 ERP Tables (Business)

You can assume more ERP tables will be added, but current exemplars:

* `erp.people` – individuals, including the primary user and clients/collaborators.
* `erp.organizations` – companies/orgs (e.g. client orgs).
* `erp.projects` – internal or client-facing projects.
* `erp.engagements` – concrete client engagements (often linked to a project).
* `erp.tasks` – actionable units of work.
* `erp.okrs` – higher-level objectives and key results.

**Agent usage**:

* Read these to understand “what exists” in the business domain.
* Use them as the **subjects** for sessions, runs, reflections, goals, facts.

---

### 3.2 Agent Tables (Execution + Memory)

**`agent.sessions`**

* Represents one **run** of something:

  * daily planning, weekly planning, reflection, engagement planning, execution burst, etc.
* Key fields:

  * `session_type` (planning/scheduling/reflection/execution…)
  * `client_person_id` (who this is for)
  * `subject_type` / `subject_id` (what it’s about)
  * `status` (`running/completed/failed`)
  * `trace_id` (Langfuse or similar)
  * `context_recipe` (which context-builder recipe was used)

**`agent.events`**

* Fine-grained log entries inside a session:

  * tool calls, tool results, notes, errors, decisions.
* Supports:

  * `memory_scope` (`run/session/user/project/global`) for salience.
  * Optional `subject_type` / `subject_id` for more precise linking.
  * Optional `promoted_fact_id` if turned into a Fact.

**`agent.tools`**

* Defines an agent's executable capabilities.
* Includes `schema_definition` (e.g., OpenAPI JSON) for the model to use for tool calling.
* Acts as the inventory of all system capabilities.

**`agent.context_recipes`**

* Defines the parameterized strategy for gathering context.
* `retrieval_spec` contains the queries/filters used to pull data from other tables (`erp.*`, `agent.facts`, etc.) before the LLM is called.

**`agent.profiles`**

* Defines the agent's identity (`system_prompt_template`), default model, and the runtime environment ("harness").
* The `harness_config` JSONB field allows tracking specific settings like IDE configurations (e.g., Antigravity), code linter rules, or sandbox environment paths.

**`agent.profile_tools`**

* A simple linking table that enforces **which tools** a specific `profile` is permitted to use. This is crucial for safety and scoping.

**`agent.execution_runs`**

* Tracks a **process/workflow run**:

  * Start/end times, status.
  * Estimates vs actuals.
  * Variance, cost, human minutes.

**`agent.step_evaluations`**

* Validation per step within a run:

  * `status` (pass/fail/needs_review)
  * `score`
  * `feedback`
  * `needs_human`

**`agent.reflections`**

* Structured retros:

  * `mode` (daily/weekly/monthly)
  * `goals`, `accomplishments`, `blockers`, `decisions`, `next_actions`
  * `raw_text` for embedding.

**`agent.facts`**

* Long-lived knowledge:

  * `fact_type` (`preference/constraint/pattern/anti_pattern/heuristic/result`)
  * `category` (e.g. `planning_strategy`, `energy`, `scheduling`…)
  * `subject_type` / `subject_id`.

**`agent.goals`**

* Machine-readable goals:

  * `subject_type` / `subject_id` (what it refers to)
  * `success_criteria` JSON
  * `status`, `priority`, time horizon.
  * Can mirror or refine `erp.okrs`.

**`agent.artifacts`**

* Handles to external things:

  * `artifact_type` (`doc/repo/spreadsheet/recording/etc`)
  * `external_id` (URL, git path, Docmost ID, etc.)
  * `summary`, `source_system`.

**`agent.blocks` & `agent.block_actions`**

* Blocks:

  * Semantic unit for docs, SOP steps, tasks, prompt snippets, etc.
  * Connect to vector/graph systems via `vector_key`, `graph_key`.

* Block actions:

  * Map blocks → tools (e.g. “start workflow run from this block”).

---

## 4. Implementation Guidelines for a Stateless Agent

### 4.1 Migrations & Schema Evolution

You may be asked to:

* Generate new migrations that:

  * Add tables/columns.
  * Add indexes.
  * Add foreign keys or constraints.

Guidelines:

1. **Never break existing constraints** without explicit instructions.
2. Prefer **additive changes** (adding columns/tables) over destructive ones.
3. Use:

   * `BIGSERIAL` for new PKs (or `UUID` if the user explicitly chooses that).
   * `TIMESTAMPTZ DEFAULT NOW()` for timestamps.
4. Keep new tables clearly namespaced in either `erp` or `agent` schema.

---

### 4.2 Creating New Business Tables

When extending ERP:

* Follow patterns of existing `erp.*` tables:

  * `id`, `global_id`, `created_at`, `updated_at`.
* Use FK relationships where obvious (e.g. `person_id`, `organization_id`, `project_id`).
* Keep **business semantics** in `erp`, not in `agent`.

Example:
If creating `erp.invoices`, **do not** mix in session/event IDs there. Instead:

* Add `subject_type='invoice'` and `subject_id=erp.invoices.id` to relevant agent tables as needed.

---

### 4.3 Creating New Agent Tables or Fields

When adding agent tables/columns:

* Ask: “Does this belong in **agent** (behavior) or **erp** (business)?”
* Use generic linking:

  * `subject_type` + `subject_id` when data can apply to multiple entity types.
  * `source_table` + `source_id` for blocks that derive from any table.
* For new evaluative/learning info:

  * Prefer storing in `facts` or `goals`, or add new `fact_type` / `category` values.

---

### 4.4 Using Blocks & Vector/Graph Layers

When implementing RAG or graph operations:

* For **any content chunk** used in RAG or graph reasoning:

  1. Ensure there is a corresponding `agent.blocks` row with:

     * `block_type`
     * `source_table`, `source_id` (if applicable)
     * `artifact_id` (if part of a doc)
  2. Store embeddings with metadata including `block_id` or `global_id`.
  3. When retrieving via vector search:

     * Map results back to `agent.blocks` and then to ERP/agent entities.

---

### 4.5 Logging & Sessions

When designing a new agent workflow, you should:

1. Create a `agent.sessions` row at the start:

   * Set `session_type`, `client_person_id`, `subject_type`/`subject_id`, **`profile_id`**, and **`context_recipe_id`**.
* **Snapshot** the full runtime configuration into `agent.sessions.applied_harness_config` for auditability.
2. Log key steps into `agent.events`:

   * Tool calls and results (or references to artifacts).
   * Decisions made.
   * Errors.
3. If using a multi-step workflow:

   * Create a `agent.execution_runs` row.
   * Optionally log `step_evaluations`.
4. On completion:

   * Update `agent.sessions.status` and `ended_at`.

---

### 4.6 Reflections & Learning

For daily/weekly reflection workflows:

1. Gather relevant ERP + agent context:

   * Recent `agent.sessions`, `agent.events`, `agent.execution_runs`.
   * Relevant `erp.tasks`, `erp.projects`, `erp.engagements`, `erp.okrs`.
2. Generate a reflection and store in `agent.reflections`:

   * Fill `goals`, `accomplishments`, `blockers`, `decisions`, `next_actions`, `metrics`, `raw_text`.
3. Optionally:

   * Create/update `agent.facts` that capture patterns/heuristics.
   * Embed `raw_text` into a vector DB, carrying `reflection_id` and `global_id` in metadata.

---

## 5. Non-Goals and Guardrails

* **Do not** introduce new sources of truth outside Postgres without explicit instruction.
* **Do not** rely on Coda as a primary data source; it is being deprecated and replaced by Postgres.
* **Do not** tie logic to specific GUI behavior; all workflows must be runnable and inspectable via DB + agents alone.
* **Do not** change primary key types or drop columns/tables in ways that break existing data.

---

## 6. Summary for the Stateless Agent

You are working inside a system where:

* **Postgres** is the brain.
* `erp.*` stores **what the business is**.
* `agent.*` stores **how work happens and how it is remembered**.
* **Blocks** are the main unit for semantic content and cross-system integration.
* All workflows should be:

  * **Agent-executable**
  * **Resumable**
  * **Observable**
  * **Auditable**
  * **Evaluated** (via step and run-level evaluation).

Your job is to:

* Propose & implement changes that **respect this split**,
* Keep IDs and cross-system metadata clean,
* And support long-term evolution toward:

  * richer evaluations,
  * self-learning strategies,
  * and robust, agent-driven workflows.
