-- Migration 003: Facts with Temporal Validity + Pattern Ontology Tables
-- Created: 2025-12-07
-- Purpose: Add Facts table (bi-temporal), Pattern Ontology tables, and extend events/plans with Zep fields

-- ============================================================================
-- FACTS TABLE: Durable entity statements with bi-temporal validity
-- ============================================================================

CREATE TABLE IF NOT EXISTS facts (
    id BIGSERIAL PRIMARY KEY,
    subject_type VARCHAR(100) NOT NULL,        -- 'user', 'workflow', 'engagement', 'project', 'venture'
    subject_id VARCHAR(255) NOT NULL,          -- Entity identifier
    fact_type VARCHAR(50) NOT NULL,            -- 'preference', 'constraint', 'identity', 'pattern', 'result'
    content TEXT NOT NULL,                     -- The fact statement
    salience_score FLOAT DEFAULT 0.5,          -- 0-1, importance/relevance score
    category VARCHAR(50),                      -- Optional categorization
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,  -- Temporal validity start
    valid_to TIMESTAMP WITH TIME ZONE,         -- Temporal validity end (NULL = still valid)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,        -- Additional context
    zep_fact_id VARCHAR(255)                   -- Links to Zep Cloud fact UUID (if synced)
);

CREATE INDEX idx_facts_subject ON facts(subject_type, subject_id);
CREATE INDEX idx_facts_valid ON facts(valid_from, valid_to);
CREATE INDEX idx_facts_salience ON facts(salience_score DESC) WHERE valid_to IS NULL;
CREATE INDEX idx_facts_type ON facts(fact_type);

-- ============================================================================
-- PATTERN ONTOLOGY TABLES: Service offerings, workflows, process templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_blueprints (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    offer_id INTEGER,                          -- Links to BestViable offers table
    workflow_sequence JSONB,                   -- Array of workflow IDs in execution order
    estimated_duration_hrs INTEGER,            -- Total estimated hours
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_service_blueprints_offer ON service_blueprints(offer_id);
CREATE INDEX idx_service_blueprints_name ON service_blueprints(name);

-- Workflows: Reusable workflow definitions
CREATE TABLE IF NOT EXISTS workflows (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capability VARCHAR(100),                   -- 'discovery', 'delivery', 'ops', 'growth'
    steps JSONB NOT NULL,                      -- Array of step objects: {order, title, description, estimated_hrs}
    version VARCHAR(20) DEFAULT '1.0',
    parent_workflow_id BIGINT REFERENCES workflows(id),  -- For workflow decomposition
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflows_capability ON workflows(capability);
CREATE INDEX idx_workflows_parent ON workflows(parent_workflow_id);
CREATE INDEX idx_workflows_name ON workflows(name);

-- Process Templates: Instantiated workflows for specific engagements
CREATE TABLE IF NOT EXISTS process_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    workflow_id BIGINT REFERENCES workflows(id),
    engagement_id INTEGER,                     -- Links to BestViable engagement
    project_id INTEGER,                        -- Links to BestViable project
    checklist JSONB NOT NULL,                  -- Specific tasks for this engagement
    status VARCHAR(50) DEFAULT 'draft',        -- 'draft', 'active', 'paused', 'completed'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_process_templates_workflow ON process_templates(workflow_id);
CREATE INDEX idx_process_templates_engagement ON process_templates(engagement_id);
CREATE INDEX idx_process_templates_status ON process_templates(status);

-- Execution Runs: Actual execution telemetry with variance tracking
CREATE TABLE IF NOT EXISTS execution_runs (
    id BIGSERIAL PRIMARY KEY,
    process_template_id BIGINT REFERENCES process_templates(id),
    run_identifier VARCHAR(255) UNIQUE,        -- e.g., 'engagement-123-onboarding-2025-12-07'
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    actual_hours FLOAT,
    estimated_hours FLOAT,
    variance_pct FLOAT GENERATED ALWAYS AS (
        CASE
            WHEN estimated_hours > 0 THEN ((actual_hours - estimated_hours) / estimated_hours) * 100
            ELSE NULL
        END
    ) STORED,                                  -- Auto-calculated variance percentage
    status VARCHAR(50) DEFAULT 'in_progress',  -- 'in_progress', 'completed', 'failed', 'cancelled'
    telemetry JSONB,                           -- Detailed execution logs
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_execution_runs_template ON execution_runs(process_template_id);
CREATE INDEX idx_execution_runs_status ON execution_runs(status);
CREATE INDEX idx_execution_runs_variance ON execution_runs(variance_pct) WHERE status = 'completed';

-- ============================================================================
-- EXTEND EXISTING TABLES FOR ZEP INTEGRATION
-- ============================================================================

-- Extend events table with Zep Cloud fields
ALTER TABLE events
    ADD COLUMN IF NOT EXISTS zep_session_id VARCHAR(255),               -- Links to Zep Cloud session
    ADD COLUMN IF NOT EXISTS memory_scope VARCHAR(50) DEFAULT 'session', -- 'run', 'session', 'user', 'project', 'global'
    ADD COLUMN IF NOT EXISTS salience_score FLOAT DEFAULT 0.5,          -- 0-1, determines fact extraction
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP,                      -- For run/session memories
    ADD COLUMN IF NOT EXISTS promoted_to_fact_id BIGINT REFERENCES facts(id);  -- Links to facts.id if promoted

CREATE INDEX IF NOT EXISTS idx_events_zep_session ON events(zep_session_id);
CREATE INDEX IF NOT EXISTS idx_events_memory_scope ON events(memory_scope);
CREATE INDEX IF NOT EXISTS idx_events_salience ON events(salience_score DESC);

-- Extend plans table with context fields
ALTER TABLE plans
    ADD COLUMN IF NOT EXISTS zep_session_id VARCHAR(255),               -- Links to Zep Cloud session
    ADD COLUMN IF NOT EXISTS engagement_id INTEGER,                     -- Links to BestViable engagement
    ADD COLUMN IF NOT EXISTS workflow_id BIGINT REFERENCES workflows(id),
    ADD COLUMN IF NOT EXISTS process_template_id BIGINT REFERENCES process_templates(id);

CREATE INDEX IF NOT EXISTS idx_plans_engagement ON plans(engagement_id);
CREATE INDEX IF NOT EXISTS idx_plans_workflow ON plans(workflow_id);

-- ============================================================================
-- TEMPORAL FACT UPDATE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_fact_temporal(
    p_subject_type VARCHAR,
    p_subject_id VARCHAR,
    p_fact_type VARCHAR,
    p_new_content TEXT,
    p_salience_score FLOAT DEFAULT 0.7
) RETURNS BIGINT AS $$
DECLARE
    new_fact_id BIGINT;
BEGIN
    -- Close old fact (set valid_to to now)
    UPDATE facts
    SET valid_to = CURRENT_TIMESTAMP
    WHERE subject_type = p_subject_type
      AND subject_id = p_subject_id
      AND fact_type = p_fact_type
      AND valid_to IS NULL;

    -- Insert new fact
    INSERT INTO facts (subject_type, subject_id, fact_type, content, salience_score, valid_from, valid_to)
    VALUES (p_subject_type, p_subject_id, p_fact_type, p_new_content, p_salience_score, CURRENT_TIMESTAMP, NULL)
    RETURNING id INTO new_fact_id;

    RETURN new_fact_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VALIDATION QUERIES (for testing post-migration)
-- ============================================================================

-- Test 1: Verify all tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
--   'facts', 'service_blueprints', 'workflows', 'process_templates', 'execution_runs'
-- );

-- Test 2: Verify events table extensions
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name IN (
--   'zep_session_id', 'memory_scope', 'salience_score', 'expires_at', 'promoted_to_fact_id'
-- );

-- Test 3: Verify temporal function exists
-- SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_fact_temporal';

-- Test 4: Sample fact creation and update
-- INSERT INTO facts (subject_type, subject_id, fact_type, content, salience_score)
-- VALUES ('user', '1', 'preference', 'Prefers deep work 9-11 AM', 0.8);
--
-- SELECT update_fact_temporal('user', '1', 'preference', 'Prefers deep work 8-10 AM (updated)', 0.85);
--
-- SELECT * FROM facts WHERE subject_id = '1' ORDER BY created_at DESC;
