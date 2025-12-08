-- Planner API Database Schema
-- Additional tables required beyond the existing 'plans' table

-- ============================================================
-- SCHEDULER RUNS TABLE
-- ============================================================
-- Tracks each execution of the scheduler
CREATE TABLE IF NOT EXISTS scheduler_runs (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL,
    events_created INTEGER DEFAULT 0,
    schedule_data JSONB,
    status VARCHAR(50) DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scheduler_runs_plan_id ON scheduler_runs(plan_id);
CREATE INDEX idx_scheduler_runs_client_id ON scheduler_runs(client_id);
CREATE INDEX idx_scheduler_runs_created_at ON scheduler_runs(created_at);

-- ============================================================
-- REFLECTIONS TABLE
-- ============================================================
-- Stores daily and weekly reflections
CREATE TABLE IF NOT EXISTS reflections (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('daily', 'weekly')),
    reflection_text TEXT NOT NULL,
    reflection_data JSONB,
    facts_extracted INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reflections_client_id ON reflections(client_id);
CREATE INDEX idx_reflections_mode ON reflections(mode);
CREATE INDEX idx_reflections_created_at ON reflections(created_at);

-- ============================================================
-- FACTS TABLE
-- ============================================================
-- Stores extracted facts from reflections and events
CREATE TABLE IF NOT EXISTS facts (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    fact_text TEXT NOT NULL,
    category VARCHAR(50) CHECK (category IN ('preference', 'behavior', 'constraint', 'outcome', 'unknown')),
    salience FLOAT CHECK (salience >= 0 AND salience <= 1),
    tags TEXT[] DEFAULT '{}',
    source_type VARCHAR(50), -- e.g., 'reflection', 'event', 'plan'
    source_id INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_facts_client_id ON facts(client_id);
CREATE INDEX idx_facts_category ON facts(category);
CREATE INDEX idx_facts_salience ON facts(salience DESC);
CREATE INDEX idx_facts_source_type ON facts(source_type);
CREATE INDEX idx_facts_created_at ON facts(created_at);

-- GIN index for full-text search on fact_text
CREATE INDEX idx_facts_text_search ON facts USING gin(to_tsvector('english', fact_text));

-- ============================================================
-- EVENTS TABLE (optional - for future implementation)
-- ============================================================
-- Tracks user activity events for reflection generation
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    event_data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at);

-- ============================================================
-- EXECUTION RUNS TABLE (optional - for future implementation)
-- ============================================================
-- Tracks actual execution vs planned time
CREATE TABLE IF NOT EXISTS execution_runs (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER REFERENCES plans(id) ON DELETE CASCADE,
    task_id VARCHAR(100),
    client_id INTEGER NOT NULL,
    estimated_hours FLOAT,
    actual_hours FLOAT,
    variance FLOAT,
    status VARCHAR(50) DEFAULT 'in_progress',
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_execution_runs_plan_id ON execution_runs(plan_id);
CREATE INDEX idx_execution_runs_client_id ON execution_runs(client_id);
CREATE INDEX idx_execution_runs_status ON execution_runs(status);
CREATE INDEX idx_execution_runs_completed_at ON execution_runs(completed_at);

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_scheduler_runs_updated_at BEFORE UPDATE ON scheduler_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reflections_updated_at BEFORE UPDATE ON reflections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facts_updated_at BEFORE UPDATE ON facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_execution_runs_updated_at BEFORE UPDATE ON execution_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SAMPLE QUERIES
-- ============================================================

-- Get recent reflections for a client
-- SELECT * FROM reflections WHERE client_id = 1 ORDER BY created_at DESC LIMIT 10;

-- Get high-salience facts
-- SELECT * FROM facts WHERE client_id = 1 AND salience >= 0.7 ORDER BY salience DESC;

-- Get scheduler runs for a plan
-- SELECT * FROM scheduler_runs WHERE plan_id = 123 ORDER BY created_at DESC;

-- Get execution variance analysis
-- SELECT
--   plan_id,
--   AVG(variance) as avg_variance,
--   SUM(actual_hours) as total_actual_hours,
--   SUM(estimated_hours) as total_estimated_hours
-- FROM execution_runs
-- WHERE client_id = 1 AND status = 'completed'
-- GROUP BY plan_id;
