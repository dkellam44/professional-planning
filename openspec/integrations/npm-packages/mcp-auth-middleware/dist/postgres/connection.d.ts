import { Pool } from 'pg';
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
export declare function createConnectionPool(config: PostgresConfig): Pool;
/**
 * Get the existing connection pool
 */
export declare function getConnectionPool(): Pool;
/**
 * Close the connection pool
 */
export declare function closeConnectionPool(): Promise<void>;
/**
 * Test database connection
 */
export declare function testConnection(config: PostgresConfig): Promise<boolean>;
/**
 * Create database schema for MCP auth
 */
export declare function createSchema(pool: Pool): Promise<void>;
//# sourceMappingURL=connection.d.ts.map