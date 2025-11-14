-- Memory Control Plane Schema - Phase 3
-- Created: 2025-11-05
-- Purpose: Core tables for memory assembly, fact storage, and episode tracking

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table 1: Client Profiles (user metadata)
CREATE TABLE IF NOT EXISTS client_profiles (
  client_id SERIAL PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX idx_client_profiles_created ON client_profiles(created_at DESC);

-- Table 2: Memory Entries (RAG vector storage with TTL)
CREATE TABLE IF NOT EXISTS memory_entries (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536),  -- OpenRouter embeddings (1536-dim)
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('episode', 'fact', 'working_state')),
  metadata JSONB DEFAULT '{}'::jsonb,
  ttl_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_memory_entries_client_created ON memory_entries(client_id, created_at DESC);
CREATE INDEX idx_memory_entries_embedding ON memory_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_memory_entries_expires ON memory_entries(expires_at);
CREATE INDEX idx_memory_entries_source_type ON memory_entries(source_type);

-- Table 3: Memory Facts (Upserted from LLM extraction)
CREATE TABLE IF NOT EXISTS memory_facts (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id) ON DELETE CASCADE,
  fact_key VARCHAR(255) NOT NULL,
  fact_value TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  source_episode_id INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, fact_key)
);

CREATE INDEX idx_memory_facts_client ON memory_facts(client_id);
CREATE INDEX idx_memory_facts_updated ON memory_facts(updated_at DESC);
CREATE INDEX idx_memory_facts_confidence ON memory_facts(confidence DESC);

-- Table 4: Working State (Temporary conversation state with TTL)
CREATE TABLE IF NOT EXISTS working_state (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  state_key VARCHAR(100) NOT NULL,
  state_value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours',
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, session_id, state_key)
);

CREATE INDEX idx_working_state_client_session ON working_state(client_id, session_id);
CREATE INDEX idx_working_state_expires ON working_state(expires_at);

-- Table 5: Episodes (Conversation summaries with embeddings)
CREATE TABLE IF NOT EXISTS episodes (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id) ON DELETE CASCADE,
  conversation_hash VARCHAR(64) UNIQUE,
  summary TEXT NOT NULL,
  embedding VECTOR(1536),  -- Summary embedding for similarity search
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  tags JSONB DEFAULT '[]'::jsonb,
  message_count INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_episodes_client_created ON episodes(client_id, created_at DESC);
CREATE INDEX idx_episodes_rating ON episodes(rating DESC) WHERE rating > 0;
CREATE INDEX idx_episodes_embedding ON episodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Table 6: Webhook Execution Log (for monitoring)
CREATE TABLE IF NOT EXISTS webhook_executions (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES client_profiles(client_id) ON DELETE CASCADE,
  webhook_type VARCHAR(50) NOT NULL CHECK (webhook_type IN ('assemble', 'writeback')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  execution_time_ms INTEGER,
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_executions_client ON webhook_executions(client_id);
CREATE INDEX idx_webhook_executions_type_status ON webhook_executions(webhook_type, status);
CREATE INDEX idx_webhook_executions_created ON webhook_executions(created_at DESC);

-- View: Memory Statistics by Client
CREATE OR REPLACE VIEW client_memory_stats AS
SELECT
  cp.client_id,
  cp.user_id,
  cp.full_name,
  COUNT(DISTINCT me.id) as total_memory_entries,
  COUNT(DISTINCT mf.id) as total_facts,
  COUNT(DISTINCT ep.id) as total_episodes,
  COUNT(DISTINCT ws.id) as active_sessions,
  MAX(me.created_at) as last_memory_update,
  MAX(ep.created_at) as last_episode
FROM
  client_profiles cp
LEFT JOIN memory_entries me ON cp.client_id = me.client_id
LEFT JOIN memory_facts mf ON cp.client_id = mf.client_id
LEFT JOIN episodes ep ON cp.client_id = ep.client_id
LEFT JOIN working_state ws ON cp.client_id = ws.client_id AND ws.expires_at > NOW()
GROUP BY
  cp.client_id, cp.user_id, cp.full_name;

-- Function: Cleanup expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_memory()
RETURNS TABLE(deleted_entries INTEGER, deleted_state INTEGER) AS $$
DECLARE
  v_deleted_entries INTEGER;
  v_deleted_state INTEGER;
BEGIN
  DELETE FROM memory_entries WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted_entries = ROW_COUNT;

  DELETE FROM working_state WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted_state = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_entries, v_deleted_state;
END;
$$ LANGUAGE plpgsql;

-- Function: Upsert memory fact (idempotent)
CREATE OR REPLACE FUNCTION upsert_memory_fact(
  p_client_id INTEGER,
  p_fact_key VARCHAR(255),
  p_fact_value TEXT,
  p_confidence NUMERIC DEFAULT 1.0,
  p_source_episode_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_fact_id INTEGER;
BEGIN
  INSERT INTO memory_facts (client_id, fact_key, fact_value, confidence, source_episode_id)
  VALUES (p_client_id, p_fact_key, p_fact_value, p_confidence, p_source_episode_id)
  ON CONFLICT (client_id, fact_key)
  DO UPDATE SET
    fact_value = EXCLUDED.fact_value,
    confidence = EXCLUDED.confidence,
    source_episode_id = EXCLUDED.source_episode_id,
    updated_at = NOW()
  RETURNING id INTO v_fact_id;

  RETURN v_fact_id;
END;
$$ LANGUAGE plpgsql;

-- Sample Data (for testing)
INSERT INTO client_profiles (user_id, full_name, tags, metadata)
VALUES
  ('test-client-001', 'Test Client 001', '["memory-test", "phase3-eval"]', '{"tier": "test", "region": "us-west"}'),
  ('test-client-002', 'Test Client 002', '["memory-test"]', '{"tier": "test", "region": "us-east"}')
ON CONFLICT DO NOTHING;

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE ON memory_entries TO n8n_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON memory_facts TO n8n_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON working_state TO n8n_user;
-- GRANT SELECT, INSERT ON episodes TO n8n_user;
-- GRANT EXECUTE ON FUNCTION cleanup_expired_memory TO n8n_user;
