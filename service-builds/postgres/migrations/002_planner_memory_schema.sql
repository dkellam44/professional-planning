-- Migration 002: Planner & Memory Architecture Schema
-- Purpose: Add tables for Planner Engine, Memory Gateway, Scheduler, and Observer Agent
-- Created: 2025-12-02
-- Schema Version: 0.1

-- ============================================================================
-- 1. Events Table: Log for all system activities
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    event_source VARCHAR(100) NOT NULL,
    client_id INTEGER,
    payload JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_client_id ON events(client_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_source ON events(event_source);

-- ============================================================================
-- 2. Plans Table: Planner Engine output (intent → SOP → tasks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS plans (
    id BIGSERIAL PRIMARY KEY,
    plan_title VARCHAR(255) NOT NULL,
    intent TEXT NOT NULL,
    sop JSONB,
    client_id INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plans_client_id ON plans(client_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_plans_created_at ON plans(created_at DESC);

-- ============================================================================
-- 3. Scheduler Runs Table: Scheduler execution records
-- ============================================================================
CREATE TABLE IF NOT EXISTS scheduler_runs (
    id BIGSERIAL PRIMARY KEY,
    plan_id BIGINT REFERENCES plans(id) ON DELETE SET NULL,
    schedule_blocks JSONB,
    client_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    calendar_events JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduler_runs_plan_id ON scheduler_runs(plan_id);
CREATE INDEX idx_scheduler_runs_client_id ON scheduler_runs(client_id);
CREATE INDEX idx_scheduler_runs_status ON scheduler_runs(status);

-- ============================================================================
-- 4. Graph Nodes Table: Knowledge graph entities
-- ============================================================================
CREATE TABLE IF NOT EXISTS graph_nodes (
    id BIGSERIAL PRIMARY KEY,
    node_type VARCHAR(100) NOT NULL,
    node_id VARCHAR(255) UNIQUE NOT NULL,
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_nodes_type ON graph_nodes(node_type);
CREATE INDEX idx_graph_nodes_id ON graph_nodes(node_id);

-- ============================================================================
-- 5. Graph Edges Table: Knowledge graph relationships
-- ============================================================================
CREATE TABLE IF NOT EXISTS graph_edges (
    id BIGSERIAL PRIMARY KEY,
    from_node_id BIGINT REFERENCES graph_nodes(id) ON DELETE CASCADE,
    to_node_id BIGINT REFERENCES graph_nodes(id) ON DELETE CASCADE,
    edge_type VARCHAR(100) NOT NULL,
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_graph_edges_from ON graph_edges(from_node_id);
CREATE INDEX idx_graph_edges_to ON graph_edges(to_node_id);
CREATE INDEX idx_graph_edges_type ON graph_edges(edge_type);

-- ============================================================================
-- 6. Prompt Templates Table: LLM prompt templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS prompt_templates (
    id BIGSERIAL PRIMARY KEY,
    template_name VARCHAR(255) UNIQUE NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    variables JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prompt_templates_name ON prompt_templates(template_name);
CREATE INDEX idx_prompt_templates_type ON prompt_templates(template_type);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get all graph neighbors of a node
CREATE OR REPLACE FUNCTION get_graph_neighbors(node_id_param BIGINT)
RETURNS TABLE (
    neighbor_id BIGINT,
    neighbor_type VARCHAR,
    neighbor_properties JSONB,
    edge_type VARCHAR,
    edge_direction VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        gn.id,
        gn.node_type,
        gn.properties,
        ge.edge_type,
        'outbound'::VARCHAR
    FROM graph_nodes gn
    JOIN graph_edges ge ON gn.id = ge.to_node_id
    WHERE ge.from_node_id = node_id_param

    UNION ALL

    SELECT
        gn.id,
        gn.node_type,
        gn.properties,
        ge.edge_type,
        'inbound'::VARCHAR
    FROM graph_nodes gn
    JOIN graph_edges ge ON gn.id = ge.from_node_id
    WHERE ge.to_node_id = node_id_param;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Update Trigger for updated_at columns
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduler_runs_updated_at BEFORE UPDATE ON scheduler_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graph_nodes_updated_at BEFORE UPDATE ON graph_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_graph_edges_updated_at BEFORE UPDATE ON graph_edges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
