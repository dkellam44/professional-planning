-- =========================================================
-- SCHEMAS
-- =========================================================

CREATE SCHEMA IF NOT EXISTS erp;
CREATE SCHEMA IF NOT EXISTS agent;

-- Note: I'm using BIGSERIAL for PKs + TEXT global_id.
-- If you prefer UUIDs, swap to UUID + gen_random_uuid().

-- =========================================================
-- ERP CORE TABLES (EXEMPLARS)
-- =========================================================

-- PEOPLE & ORGS -------------------------------------------

CREATE TABLE erp.people (
    id           BIGSERIAL PRIMARY KEY,
    global_id    TEXT UNIQUE,                  -- stable cross-system ID
    full_name    TEXT NOT NULL,
    email        TEXT,
    handle       TEXT,                         -- e.g. @twitter, @ig
    role_label   TEXT,                         -- "client", "collaborator", etc.
    notes        TEXT,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.organizations (
    id           BIGSERIAL PRIMARY KEY,
    global_id    TEXT UNIQUE,
    name         TEXT NOT NULL,
    website      TEXT,
    org_type     TEXT,                         -- "client", "prospect", "partner", etc.
    notes        TEXT,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS & ENGAGEMENTS ---------------------------------

CREATE TABLE erp.projects (
    id              BIGSERIAL PRIMARY KEY,
    global_id       TEXT UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT,
    owner_person_id BIGINT REFERENCES erp.people(id),
    organization_id BIGINT REFERENCES erp.organizations(id),
    status          TEXT DEFAULT 'planned',    -- 'planned','active','paused','done','cancelled'
    start_date      DATE,
    end_date        DATE,
    tags            TEXT[],                    -- optional quick tagging
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE erp.engagements (
    id                BIGSERIAL PRIMARY KEY,
    global_id         TEXT UNIQUE,
    name              TEXT NOT NULL,
    client_org_id     BIGINT REFERENCES erp.organizations(id),
    primary_contact_id BIGINT REFERENCES erp.people(id),
    project_id        BIGINT REFERENCES erp.projects(id),
    offer_name        TEXT,                    -- or FK to an offers table later
    status            TEXT DEFAULT 'prospect', -- 'prospect','active','completed','lost'
    start_date        DATE,
    end_date          DATE,
    value_estimate    NUMERIC(12,2),
    notes             TEXT,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS ---------------------------------------------------

CREATE TABLE erp.tasks (
    id              BIGSERIAL PRIMARY KEY,
    global_id       TEXT UNIQUE,
    title           TEXT NOT NULL,
    description     TEXT,
    project_id      BIGINT REFERENCES erp.projects(id),
    engagement_id   BIGINT REFERENCES erp.engagements(id),
    assignee_id     BIGINT REFERENCES erp.people(id),
    status          TEXT DEFAULT 'todo',       -- 'todo','in_progress','blocked','done'
    priority        TEXT,                      -- 'low','medium','high' (or numeric later)
    due_date        DATE,
    estimated_hours NUMERIC(6,2),
    actual_hours    NUMERIC(6,2),
    tags            TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- OKRs / GOALS (ERP VIEW) -------------------------------

CREATE TABLE erp.okrs (
    id              BIGSERIAL PRIMARY KEY,
    global_id       TEXT UNIQUE,
    owner_person_id BIGINT REFERENCES erp.people(id),
    venture_name    TEXT,                      -- or FK to a ventures table later
    objective       TEXT NOT NULL,
    key_results     JSONB,                     -- array of {description, metric, target, current}
    time_horizon_start DATE,
    time_horizon_end   DATE,
    status          TEXT DEFAULT 'active',     -- 'planned','active','completed','dropped'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- AGENT / MEMORY / RUN TABLES
-- =========================================================

-- SESSIONS -----------------------------------------------
-- A "run" of some operation (daily planning, weekly review,
-- engagement planning, execution burst, etc.)

CREATE TABLE agent.sessions (
    id                 BIGSERIAL PRIMARY KEY,
    global_id          TEXT UNIQUE,
    profile_id         BIGINT REFERENCES agent.profiles(id)
    session_type       TEXT NOT NULL,            -- 'planning','scheduling','reflection','execution','maintenance', etc.
    client_person_id   BIGINT REFERENCES erp.people(id),
    subject_type       TEXT,                     -- 'project','engagement','task','personal','okr', etc.
    subject_id         BIGINT,                   -- PK from the corresponding erp table
    status             TEXT DEFAULT 'running',   -- 'running','completed','failed','cancelled'
    started_at         TIMESTAMPTZ DEFAULT NOW(),
    ended_at           TIMESTAMPTZ,
    trace_id           TEXT,                     -- e.g. Langfuse trace
    context_recipe_id  BIGINT REFERENCES agent.context_recipes(id), -- New FK to the recipe table
    applied_harness_config JSONB DEFAULT '{}'::jsonb;              -- Snapshot of harness_config used at runtime
    metadata           JSONB DEFAULT '{}'::jsonb
);

-- EVENTS --------------------------------------------------
-- Fine-grained log of what happened inside a session.
-- This is your event-sourcing spine.

CREATE TABLE agent.events (
    id               BIGSERIAL PRIMARY KEY,
    session_id       BIGINT REFERENCES agent.sessions(id) ON DELETE CASCADE,
    occurred_at      TIMESTAMPTZ DEFAULT NOW(),
    event_type       TEXT NOT NULL,             -- 'planning','tool_call','tool_result','note','error', etc.
    event_source     TEXT,                      -- 'planner','scheduler','observer','n8n','user', etc.
    subject_type     TEXT,                      -- optional: the entity this event is about
    subject_id       BIGINT,
    message          TEXT,                      -- short human-readable description
    payload          JSONB DEFAULT '{}'::jsonb, -- raw details (tool input/output, etc.)
    salience_score   NUMERIC(3,2),              -- 0.00–1.00
    memory_scope     TEXT,                      -- 'run','session','user','project','engagement','global'
    promoted_fact_id BIGINT REFERENCES agent.facts(id),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- EXECUTION RUNS -----------------------------------------
-- One run of a process template / workflow.

CREATE TABLE agent.execution_runs (
    id                 BIGSERIAL PRIMARY KEY,
    global_id          TEXT UNIQUE,
    session_id         BIGINT REFERENCES agent.sessions(id) ON DELETE SET NULL,
    process_name       TEXT NOT NULL,           -- logical name if you don't have a separate process_templates table yet
    subject_type       TEXT,                    -- 'project','engagement','task', etc.
    subject_id         BIGINT,
    status             TEXT DEFAULT 'running',  -- 'running','completed','failed','cancelled'
    started_at         TIMESTAMPTZ DEFAULT NOW(),
    ended_at           TIMESTAMPTZ,
    estimated_hours    NUMERIC(6,2),
    actual_hours       NUMERIC(6,2),
    variance_pct       NUMERIC(6,2),
    outcome_status     TEXT,                    -- 'success','partial','failure'
    outcome_score      NUMERIC(4,2),            -- 0–10 or 0–1
    human_minutes      NUMERIC(6,2),            -- how much human time this run used
    llm_cost           NUMERIC(10,4),           -- dollars or credits
    telemetry          JSONB DEFAULT '{}'::jsonb
);

-- STEP-LEVEL EVALUATION ----------------------------------

CREATE TABLE agent.step_evaluations (
    id                BIGSERIAL PRIMARY KEY,
    execution_run_id  BIGINT REFERENCES agent.execution_runs(id) ON DELETE CASCADE,
    step_name         TEXT,
    step_index        INTEGER,
    validator_type    TEXT,                     -- 'llm','human','hybrid'
    status            TEXT NOT NULL,           -- 'pass','fail','needs_review'
    score             NUMERIC(4,2),            -- 0–10 or 0–1
    feedback          TEXT,
    needs_human       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- REFLECTIONS --------------------------------------------
-- Daily/weekly retros, schema-driven.

CREATE TABLE agent.reflections (
    id                  BIGSERIAL PRIMARY KEY,
    session_id          BIGINT REFERENCES agent.sessions(id) ON DELETE SET NULL,
    reflection_date     DATE NOT NULL,
    mode                TEXT NOT NULL,          -- 'daily','weekly','monthly','ad_hoc'
    client_person_id    BIGINT REFERENCES erp.people(id),
    scope               TEXT,                   -- 'personal','project','engagement','venture', etc.
    focal_entity_type   TEXT,
    focal_entity_id     BIGINT,
    goals               TEXT,
    accomplishments     TEXT,
    blockers            TEXT,
    decisions           TEXT,
    metrics             JSONB DEFAULT '{}'::jsonb,  -- {"deep_work_hours": 3.5, ...}
    next_actions        TEXT,
    raw_text            TEXT,                   -- full reflection text for embeddings
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- FACTS ---------------------------------------------------
-- Long-lived, queryable pieces of knowledge and patterns.

CREATE TABLE agent.facts (
    id              BIGSERIAL PRIMARY KEY,
    global_id       TEXT UNIQUE,
    subject_type    TEXT,                       -- 'person','project','engagement','system','workflow','okr', etc.
    subject_id      BIGINT,
    fact_type       TEXT,                       -- 'preference','constraint','pattern','anti_pattern','heuristic','result'
    category        TEXT,                       -- 'planning_strategy','energy','scheduling','finance', etc.
    content         TEXT NOT NULL,
    salience_score  NUMERIC(3,2),
    valid_from      TIMESTAMPTZ,
    valid_to        TIMESTAMPTZ,
    source_event_id BIGINT REFERENCES agent.events(id),
    source_ref      TEXT,                       -- optional external reference
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- GOALS ---------------------------------------------------
-- Agent-friendly goals; can mirror or wrap erp.okrs.

CREATE TABLE agent.goals (
    id                 BIGSERIAL PRIMARY KEY,
    global_id          TEXT UNIQUE,
    subject_type       TEXT,                     -- 'personal','project','engagement','okr','venture'
    subject_id         BIGINT,
    title              TEXT NOT NULL,
    description        TEXT,
    success_criteria   JSONB,                    -- structured: metrics, thresholds, conditions
    status             TEXT DEFAULT 'active',    -- 'planned','active','satisfied','failed','paused'
    priority           INTEGER,                  -- 1 = highest, etc.
    time_horizon_start DATE,
    time_horizon_end   DATE,
    parent_goal_id     BIGINT REFERENCES agent.goals(id),
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ARTIFACTS ----------------------------------------------
-- External docs/repos/spreadsheets/etc. with stable handles.

CREATE TABLE agent.artifacts (
    id             BIGSERIAL PRIMARY KEY,
    global_id      TEXT UNIQUE,
    artifact_type  TEXT NOT NULL,                -- 'doc','repo','spreadsheet','recording','dashboard', etc.
    external_id    TEXT NOT NULL,                -- e.g. 'git://repo/path', 'docmost:xyz', 'coda:...', etc.
    title          TEXT,
    summary        TEXT,
    source_system  TEXT,                         -- 'git','docmost','coda','google_drive', etc.
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    metadata       JSONB DEFAULT '{}'::jsonb
);

-- AGENT CONFIGURATION -----------------------------------

-- 1. Tools (The capability definition)
CREATE TABLE agent.tools (
    id BIGSERIAL PRIMARY KEY,
    global_id TEXT UNIQUE,
    name TEXT UNIQUE NOT NULL,             -- e.g., 'git_commit', 'postgres_query', 'file_editor'
    description TEXT NOT NULL,
    schema_definition JSONB DEFAULT '{}'::jsonb, -- OpenAPI/Pydantic schema for inputs
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Context Recipes (The strategy for context injection)
CREATE TABLE agent.context_recipes (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,             -- e.g., 'daily_planning_recipe', 'project_kickoff_context'
    description TEXT,
    retrieval_spec JSONB NOT NULL,         -- Defines the layers/filters for data retrieval (e.g., from agent.facts, erp.tasks, vector search)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profiles (The Agent Identity + Harness)
CREATE TABLE agent.profiles (
    id BIGSERIAL PRIMARY KEY,
    global_id TEXT UNIQUE,
    name TEXT UNIQUE NOT NULL,             -- e.g., 'planner_v1', 'coder_senior_python'
    description TEXT,
    system_prompt_template TEXT,           -- The core personality and instruction set (e.g., "You are a senior python dev...")
    harness_config JSONB DEFAULT '{}'::jsonb, -- Environment settings (IDE/sandbox/linter/runtime config)
    default_model TEXT,                    -- The specific LLM version to use
    default_context_recipe_id BIGINT REFERENCES agent.context_recipes(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Profile Tools (Which tools a Profile has access to)
CREATE TABLE agent.profile_tools (
    profile_id BIGINT REFERENCES agent.profiles(id) ON DELETE CASCADE,
    tool_id BIGINT REFERENCES agent.tools(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (profile_id, tool_id)
);




-- =========================================================
-- BLOCKS (SEMANTIC BLOCK MODEL)
-- =========================================================

-- BLOCKS --------------------------------------------------
-- Cross-cutting unit: can represent a SOP step, task block,
-- doc section, prompt snippet, etc. Used for graph + RAG.

CREATE TABLE agent.blocks (
    id             BIGSERIAL PRIMARY KEY,
    global_id      TEXT UNIQUE NOT NULL,
    block_type     TEXT NOT NULL,                -- 'sop_step','task','goal','doc_section','prompt_snippet', etc.
    title          TEXT,
    body_md        TEXT,                         -- markdown content (optional for non-textual blocks)
    source_table   TEXT,                         -- e.g. 'erp.tasks','erp.projects','erp.okrs'
    source_id      BIGINT,                       -- PK from source_table
    artifact_id    BIGINT REFERENCES agent.artifacts(id),
    vector_key     TEXT,                         -- ID/key in vector DB (for chunks/embeddings)
    graph_key      TEXT,                         -- ID/key in graph DB if used
    metadata       JSONB DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- BLOCK ACTIONS -------------------------------------------
-- Makes some blocks "actionable" by mapping them to tools.

CREATE TABLE agent.block_actions (
    id                  BIGSERIAL PRIMARY KEY,
    block_id            BIGINT NOT NULL REFERENCES agent.blocks(id) ON DELETE CASCADE,
    action_type         TEXT NOT NULL,           -- 'create_calendar_event','start_workflow_run','send_email', etc.
    tool_name           TEXT NOT NULL,           -- logical name of the tool/endpoint
    tool_params_template JSONB,                 -- template for args with placeholders
    is_default          BOOLEAN DEFAULT FALSE,
    metadata            JSONB DEFAULT '{}'::jsonb
);

-- Optionally: unique default action per block
CREATE UNIQUE INDEX IF NOT EXISTS idx_block_actions_default
ON agent.block_actions (block_id)
WHERE is_default = TRUE;
