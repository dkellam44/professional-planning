#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = migrate;
const connection_1 = require("../postgres/connection");
const token_store_1 = require("../postgres/token-store");
const key_generation_1 = require("../utils/key-generation");
const fs = __importStar(require("fs"));
/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        serviceName: 'coda',
        envVarName: 'CODA_API_TOKEN',
        postgresHost: 'localhost',
        postgresPort: 5432,
        postgresDatabase: 'mcp_auth',
        postgresUser: 'postgres',
        dryRun: false
    };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];
        if (!nextArg) {
            console.error(`Missing value for argument: ${arg}`);
            process.exit(1);
        }
        switch (arg) {
            case '--service':
                config.serviceName = nextArg;
                i++;
                break;
            case '--env-var':
                config.envVarName = nextArg;
                i++;
                break;
            case '--host':
                config.postgresHost = nextArg;
                i++;
                break;
            case '--port':
                config.postgresPort = parseInt(nextArg, 10);
                i++;
                break;
            case '--database':
                config.postgresDatabase = nextArg;
                i++;
                break;
            case '--user':
                config.postgresUser = nextArg;
                i++;
                break;
            case '--password':
                config.postgresPassword = nextArg;
                i++;
                break;
            case '--encryption-key':
                config.encryptionKey = nextArg;
                i++;
                break;
            case '--docker-compose':
                config.dockerComposePath = nextArg;
                i++;
                break;
            case '--dry-run':
                config.dryRun = true;
                break;
            case '--help':
                printHelp();
                process.exit(0);
            // No break needed after process.exit()
            default:
                console.error(`Unknown argument: ${arg}`);
                printHelp();
                process.exit(1);
            // No break needed after process.exit()
        }
    }
    if (!config.postgresPassword) {
        config.postgresPassword = process.env['POSTGRES_PASSWORD'] || '';
    }
    if (!config.encryptionKey) {
        const envKey = process.env['MCP_AUTH_ENCRYPTION_KEY'];
        if (envKey) {
            config.encryptionKey = envKey;
        }
    }
    return config;
}
/**
 * Print help message
 */
function printHelp() {
    console.log(`
MCP Auth Migration Script - Environment to PostgreSQL

This script migrates API tokens from environment variables to PostgreSQL with encryption.

Usage: node migrate-env-to-postgres.js [options]

Options:
  --service <name>          Service name (default: coda)
  --env-var <name>          Environment variable name (default: CODA_API_TOKEN)
  --host <host>             PostgreSQL host (default: localhost)
  --port <port>             PostgreSQL port (default: 5432)
  --database <name>         PostgreSQL database (default: mcp_auth)
  --user <user>             PostgreSQL user (default: postgres)
  --password <password>     PostgreSQL password (can also use POSTGRES_PASSWORD env var)
  --encryption-key <key>    Encryption key (can also use MCP_AUTH_ENCRYPTION_KEY env var)
  --docker-compose <path>   Path to docker-compose.yml to read env vars from
  --dry-run                 Show what would be migrated without making changes
  --help                    Show this help message

Examples:
  # Basic migration
  node migrate-env-to-postgres.js --service coda --env-var CODA_API_TOKEN

  # With custom PostgreSQL connection
  node migrate-env-to-postgres.js --host db.example.com --user mcp_user --password secret

  # Dry run to see what would be migrated
  node migrate-env-to-postgres.js --service coda --dry-run

  # Read from docker-compose.yml
  node migrate-env-to-postgres.js --docker-compose ../../docker-compose.yml --service coda
`);
}
/**
 * Read environment variable from docker-compose.yml
 */
function readFromDockerCompose(filePath, serviceName, envVarName) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        let inService = false;
        let inEnvironment = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith(`${serviceName}:`)) {
                inService = true;
                continue;
            }
            if (inService && trimmed.startsWith('environment:')) {
                inEnvironment = true;
                continue;
            }
            if (inService && inEnvironment) {
                if (trimmed.startsWith('- ') && trimmed.includes(`${envVarName}=`)) {
                    const match = trimmed.match(new RegExp(`${envVarName}=(.+)`));
                    return match ? (match[1] || null) : null;
                }
                // Stop if we hit a non-environment line
                if (trimmed && !trimmed.startsWith('- ') && !trimmed.startsWith('#')) {
                    break;
                }
            }
        }
    }
    catch (error) {
        console.error(`Error reading docker-compose.yml: ${error}`);
    }
    return null;
}
/**
 * Get token value from environment or docker-compose
 */
function getTokenValue(config) {
    // First try environment variable
    let token = process.env[config.envVarName];
    if (token) {
        console.log(`✓ Found ${config.envVarName} in environment variables`);
        return token;
    }
    // Then try docker-compose.yml if provided
    if (config.dockerComposePath) {
        token = readFromDockerCompose(config.dockerComposePath, config.serviceName, config.envVarName);
        if (token) {
            console.log(`✓ Found ${config.envVarName} in docker-compose.yml`);
            return token;
        }
    }
    console.log(`✗ ${config.envVarName} not found in environment or docker-compose.yml`);
    return null;
}
/**
 * Main migration function
 */
async function migrate(config) {
    console.log(`Starting migration for service: ${config.serviceName}`);
    console.log(`Environment variable: ${config.envVarName}`);
    console.log(`Dry run: ${config.dryRun ? 'Yes' : 'No'}`);
    console.log('');
    // Get the token value
    const tokenValue = getTokenValue(config);
    if (!tokenValue) {
        console.error('No token found to migrate. Exiting.');
        process.exit(1);
    }
    // Generate encryption key if not provided
    if (!config.encryptionKey) {
        config.encryptionKey = (0, key_generation_1.generateEncryptionKey)();
        console.log(`Generated encryption key: ${config.encryptionKey}`);
        console.log('⚠️  Save this key securely! You will need it to decrypt the token.');
        console.log('');
    }
    if (config.dryRun) {
        console.log('🔍 DRY RUN - No changes will be made');
        console.log(`Would migrate token from ${config.envVarName} to PostgreSQL`);
        console.log(`Service: ${config.serviceName}`);
        console.log(`Token length: ${tokenValue.length} characters`);
        // Show hash for verification
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        const hash = crypto.createHash('sha256').update(tokenValue).digest('hex');
        console.log(`Token hash (SHA256): ${hash.substring(0, 16)}...`);
        console.log('');
        console.log('To perform the actual migration, run without --dry-run flag');
        return;
    }
    try {
        // Create database connection
        console.log('Connecting to PostgreSQL...');
        const pool = (0, connection_1.createConnectionPool)({
            host: config.postgresHost,
            port: config.postgresPort,
            database: config.postgresDatabase,
            user: config.postgresUser,
            password: config.postgresPassword,
            maxConnections: 2
        });
        // Test connection
        await pool.query('SELECT 1');
        console.log('✓ Connected to PostgreSQL');
        // Create schema if needed
        console.log('Ensuring database schema exists...');
        await (0, connection_1.createSchema)(pool);
        console.log('✓ Database schema ready');
        // Create token store
        const tokenStore = new token_store_1.TokenStore(pool, config.encryptionKey);
        // Check if token already exists
        const existingToken = await tokenStore.getToken(config.serviceName, 'api_token');
        if (existingToken) {
            console.log('⚠️  Token already exists in database');
            // Verify it's the same token
            if (existingToken === tokenValue) {
                console.log('✓ Existing token matches environment variable');
                console.log('Migration not needed - token is already up to date');
            }
            else {
                console.log('✗ Existing token differs from environment variable');
                console.log('Would you like to update it? Use --force flag to overwrite.');
            }
        }
        else {
            // Store the token
            console.log('Storing token in database...');
            await tokenStore.setToken(config.serviceName, 'api_token', tokenValue);
            console.log('✓ Token stored successfully');
            // Verify the token
            console.log('Verifying stored token...');
            const verifiedToken = await tokenStore.getToken(config.serviceName, 'api_token');
            if (verifiedToken === tokenValue) {
                console.log('✓ Token verification successful');
                // Show hash for verification
                const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
                const hash = crypto.createHash('sha256').update(verifiedToken).digest('hex');
                console.log(`Token hash (SHA256): ${hash.substring(0, 16)}...`);
                console.log('');
                console.log('🎉 Migration completed successfully!');
                console.log('');
                console.log('Next steps:');
                console.log('1. Update your application to use PostgreSQL token storage');
                console.log('2. Remove the environment variable from your configuration');
                console.log('3. Securely store the encryption key');
                console.log(`4. Restart your ${config.serviceName} service`);
            }
            else {
                console.log('✗ Token verification failed');
                throw new Error('Token verification failed');
            }
        }
        // Close connection
        await pool.end();
        console.log('✓ Database connection closed');
    }
    catch (error) {
        console.error('❌ Migration failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
// Main execution
if (require.main === module) {
    const config = parseArgs();
    migrate(config).catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate-env-to-postgres.js.map