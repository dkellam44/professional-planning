import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Create a PostgreSQL connection pool
 */
export function createConnectionPool(config: PostgresConfig): Pool {
  if (pool) {
    return pool;
  }

  const poolConfig: PoolConfig = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: config.maxConnections ?? 10,
    idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
    connectionTimeoutMillis: config.connectionTimeoutMillis ?? 2000,
  };

  if (config.ssl) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  pool = new Pool(poolConfig);

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });

  return pool;
}

/**
 * Get the existing connection pool
 */
export function getConnectionPool(): Pool {
  if (!pool) {
    throw new Error('Connection pool not initialized. Call createConnectionPool first.');
  }
  return pool;
}

/**
 * Close the connection pool
 */
export async function closeConnectionPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Test database connection
 */
export async function testConnection(config: PostgresConfig): Promise<boolean> {
  const testPool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await testPool.connect();
    await client.query('SELECT 1');
    client.release();
    await testPool.end();
    return true;
  } catch (error) {
    await testPool.end();
    return false;
  }
}

/**
 * Create database schema for MCP auth
 */
export async function createSchema(pool: Pool): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create tokens table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        key VARCHAR(255) NOT NULL,
        encrypted_value TEXT NOT NULL,
        iv VARCHAR(32) NOT NULL,
        tag VARCHAR(32) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(service_id, key)
      )
    `);

    // Create audit_log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        user_email VARCHAR(255),
        details JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tokens_service_id ON tokens(service_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tokens_service_key ON tokens(service_id, key)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_service_id ON audit_log(service_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)
    `);

    // Create function to update updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    // Create trigger for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_tokens_updated_at ON tokens;
      CREATE TRIGGER update_tokens_updated_at
        BEFORE UPDATE ON tokens
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column()
    `);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}