import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  // Server configuration
  port: number;
  host: string;
  baseUrl: string;

  // Coda API configuration
  codaApiToken: string;
  codaApiBaseUrl: string;

  // Stytch OAuth 2.1 configuration
  stytch: {
    projectId: string;
    secret: string;
    domain: string;
  };

  // Legacy: Cloudflare Access configuration (deprecated, kept for backward compatibility)
  cloudflareAccessTeamDomain?: string;
  cloudflareAccessAud?: string;

  // Legacy: Authentication configuration (deprecated, kept for backward compatibility)
  authMode?: 'cloudflare' | 'bearer' | 'both' | 'stytch';
  bearerToken?: string;

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

function getStytchDomain(): string {
  return process.env.STYTCH_DOMAIN
    || process.env.STYTCH_PROJECT_DOMAIN
    || 'https://api.stytch.com';
}

export const config: Config = {
  // Server configuration
  port: parseInt(getOptionalEnvVar('PORT', '8080'), 10),
  host: getOptionalEnvVar('HOST', '0.0.0.0'),
  baseUrl: getOptionalEnvVar('BASE_URL', 'https://coda.bestviable.com'),

  // Coda API configuration
  codaApiToken: getRequiredEnvVar('CODA_API_TOKEN'),
  codaApiBaseUrl: getOptionalEnvVar('CODA_API_BASE_URL', 'https://coda.io/apis/v1'),

  // Stytch OAuth 2.1 configuration
  stytch: {
    projectId: getRequiredEnvVar('STYTCH_PROJECT_ID'),
    secret: getRequiredEnvVar('STYTCH_SECRET'),
    domain: getRequiredEnvVar('STYTCH_DOMAIN'),
    domain: getStytchDomain(),
  },

  // Legacy: Cloudflare Access configuration (deprecated)
  cloudflareAccessTeamDomain: process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN,
  cloudflareAccessAud: process.env.CLOUDFLARE_ACCESS_AUD,

  // Legacy: Authentication configuration (deprecated)
  authMode: process.env.AUTH_MODE as 'cloudflare' | 'bearer' | 'both' | 'stytch' | undefined,
  bearerToken: process.env.BEARER_TOKEN,

  // Logging
  logLevel: (getOptionalEnvVar('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error'),
};

// Validate configuration
export function validateConfig(): void {
  console.log('✅ Configuration validated successfully');
  console.log(`   Auth provider: Stytch OAuth 2.1`);
  console.log(`   Stytch Project ID: ${config.stytch.projectId}`);
  console.log(`   Stytch Domain: ${config.stytch.domain}`);
  console.log(`   Base URL: ${config.baseUrl}`);
  console.log(`   Coda API: ${config.codaApiBaseUrl}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Log Level: ${config.logLevel}`);
}

export default config;
