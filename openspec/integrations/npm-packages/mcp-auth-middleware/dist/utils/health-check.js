"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHealthCheckHandler = createHealthCheckHandler;
const connection_1 = require("../postgres/connection");
const token_store_1 = require("../postgres/token-store");
/**
 * Create a health check handler
 */
function createHealthCheckHandler(config) {
    return async (_req, res) => {
        const result = {
            status: 'ok',
            service: config.serviceName,
            timestamp: new Date().toISOString(),
            auth: {
                mode: config.mode,
                status: 'configured'
            },
            tokenStorage: {
                type: config.tokenStore,
                status: 'not_configured'
            }
        };
        try {
            // Test token storage
            if (config.tokenStore === 'postgres') {
                try {
                    const pool = (0, connection_1.getConnectionPool)();
                    const client = await pool.connect();
                    // Test basic connectivity
                    await client.query('SELECT 1');
                    // Test token store
                    const tokenStore = new token_store_1.TokenStore(pool, config.encryptionKey || 'test-key');
                    await tokenStore.auditLog(config.serviceName, 'HEALTH_CHECK');
                    result.tokenStorage.status = 'connected';
                    result.tokenStorage.details = {
                        poolSize: pool.totalCount,
                        availableConnections: pool.idleCount
                    };
                    client.release();
                }
                catch (error) {
                    result.tokenStorage.status = 'error';
                    result.tokenStorage.details = {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                    result.status = 'error';
                }
            }
            else if (config.tokenStore === 'env') {
                result.tokenStorage.status = 'connected';
                result.tokenStorage.details = {
                    message: 'Using environment variable storage'
                };
            }
            // Test authentication configuration
            if (config.mode === 'cloudflare' || config.mode === 'both') {
                if (!config.cloudflareAccessTeamDomain || !config.cloudflareAccessAud) {
                    result.auth.status = 'error';
                    result.auth.details = {
                        error: 'Cloudflare Access configuration incomplete'
                    };
                    result.status = 'error';
                }
            }
            res.status(result.status === 'error' ? 503 : 200).json(result);
        }
        catch (error) {
            console.error('Health check failed:', error);
            res.status(503).json({
                status: 'error',
                service: config.serviceName,
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
}
//# sourceMappingURL=health-check.js.map