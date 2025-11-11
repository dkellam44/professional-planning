"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
function getRequiredEnvVar(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`);
    }
    return value;
}
function getOptionalEnvVar(name, defaultValue) {
    return process.env[name] || defaultValue;
}
exports.config = {
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
    authMode: getOptionalEnvVar('AUTH_MODE', 'both'),
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
    logLevel: getOptionalEnvVar('LOG_LEVEL', 'info'),
};
// Validate configuration
function validateConfig() {
    // Only require CODA_API_TOKEN if not using PostgreSQL token storage
    if (!exports.config.postgres && !exports.config.codaApiToken) {
        throw new Error('CODA_API_TOKEN is required when not using PostgreSQL token storage');
    }
    if (exports.config.authMode === 'bearer' && !exports.config.bearerToken) {
        throw new Error('BEARER_TOKEN is required when AUTH_MODE is set to "bearer"');
    }
    if (exports.config.postgres) {
        console.log('✅ PostgreSQL token storage configured');
        console.log(`   Database: ${exports.config.postgres.database}@${exports.config.postgres.host}:${exports.config.postgres.port}`);
    }
    else {
        console.log('⚠️  Using environment token storage (consider migrating to PostgreSQL)');
    }
    console.log('✅ Configuration validated successfully');
    console.log(`   Auth mode: ${exports.config.authMode}`);
    console.log(`   Coda API: ${exports.config.codaApiBaseUrl}`);
    console.log(`   Port: ${exports.config.port}`);
}
exports.default = exports.config;
//# sourceMappingURL=config.js.map