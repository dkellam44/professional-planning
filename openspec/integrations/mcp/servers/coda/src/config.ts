import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  // Server configuration
  port: number;
  host: string;
  
  // Coda API configuration
  codaApiToken: string;
  codaApiBaseUrl: string;
  
  // Cloudflare Access configuration
  cloudflareAccessTeamDomain: string;
  cloudflareAccessAud: string;
  
  // Authentication configuration
  authMode: 'cloudflare' | 'bearer' | 'both';
  bearerToken?: string;
  
  // PostgreSQL configuration (for token storage)
  postgres?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    maxConnections?: number;
  };
  
  // Encryption key for token storage
  encryptionKey?: string;
  
  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config: Config = {
  // Server configuration
  port: parseInt(getOptionalEnvVar('PORT', '8080'), 10),
  host: getOptionalEnvVar('HOST', '0.0.0.0'),
  
  // Coda API configuration
  codaApiToken: getRequiredEnvVar('CODA_API_TOKEN'),
  codaApiBaseUrl: getOptionalEnvVar('CODA_API_BASE_URL', 'https://coda.io/apis/v1'),
  
  // Cloudflare Access configuration
  cloudflareAccessTeamDomain: getOptionalEnvVar('CLOUDFLARE_ACCESS_TEAM_DOMAIN', 'bestviable.cloudflareaccess.com'),
  cloudflareAccessAud: getOptionalEnvVar('CLOUDFLARE_ACCESS_AUD', 'bestviable'),
  
  // Authentication configuration
  authMode: (getOptionalEnvVar('AUTH_MODE', 'both') as 'cloudflare' | 'bearer' | 'both'),
  bearerToken: process.env.BEARER_TOKEN,
  
  // PostgreSQL configuration (optional, defaults to environment tokens)
  postgres: process.env.POSTGRES_HOST ? {
    host: getOptionalEnvVar('POSTGRES_HOST', 'localhost'),
    port: parseInt(getOptionalEnvVar('POSTGRES_PORT', '5432'), 10),
    database: getOptionalEnvVar('POSTGRES_DATABASE', 'mcp_auth'),
    user: getRequiredEnvVar('POSTGRES_USER'),
    password: getRequiredEnvVar('POSTGRES_PASSWORD'),
    maxConnections: parseInt(getOptionalEnvVar('POSTGRES_MAX_CONNECTIONS', '5'), 10)
  } : undefined,
  
  // Encryption key for token storage
  encryptionKey: getOptionalEnvVar('MCP_AUTH_ENCRYPTION_KEY', 'default-encryption-key-32-bytes-long'),
  
  // Logging
  logLevel: (getOptionalEnvVar('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error'),
};

// Validate configuration
export function validateConfig(): void {
  // Only require CODA_API_TOKEN if not using PostgreSQL token storage
  if (!config.postgres && !config.codaApiToken) {
    throw new Error('CODA_API_TOKEN is required when not using PostgreSQL token storage');
  }
  
  if (config.authMode === 'bearer' && !config.bearerToken) {
    throw new Error('BEARER_TOKEN is required when AUTH_MODE is set to "bearer"');
  }
  
  if (config.postgres) {
    console.log('✅ PostgreSQL token storage configured');
    console.log(`   Database: ${config.postgres.database}@${config.postgres.host}:${config.postgres.port}`);
  } else {
    console.log('⚠️  Using environment token storage (consider migrating to PostgreSQL)');
  }
  
  console.log('✅ Configuration validated successfully');
  console.log(`   Auth mode: ${config.authMode}`);
  console.log(`   Coda API: ${config.codaApiBaseUrl}`);
  console.log(`   Port: ${config.port}`);
}

export default config;