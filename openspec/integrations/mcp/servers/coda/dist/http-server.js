"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const axios_1 = __importDefault(require("axios"));
const cloudflare_access_auth_1 = require("./middleware/cloudflare-access-auth");
const config_1 = require("./config");
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true, // Allow all origins (Cloudflare Access will handle auth)
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Apply authentication middleware
app.use(cloudflare_access_auth_1.authenticate);
// Health check endpoint (skips auth via middleware)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'coda-mcp',
        version: '1.0.0',
        auth: {
            mode: config_1.config.authMode,
            tokenStorage: config_1.config.postgres ? 'postgres' : 'env'
        },
        timestamp: new Date().toISOString()
    });
});
// Status endpoint (lighter health check)
app.get('/status', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'coda-mcp',
        timestamp: new Date().toISOString()
    });
});
// MCP endpoint - proxy requests to Coda API
app.post('/mcp', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User not authenticated',
                timestamp: new Date().toISOString()
            });
        }
        // Get service token from request (injected by middleware)
        const serviceToken = req.serviceToken;
        if (!serviceToken) {
            return res.status(500).json({
                error: 'Service token not available',
                message: 'Service token not found in PostgreSQL storage',
                timestamp: new Date().toISOString()
            });
        }
        // Log the request for debugging
        if (config_1.config.logLevel === 'debug') {
            console.log(`[DEBUG] MCP request from ${req.user?.email}:`, {
                method: req.method,
                path: req.path,
                headers: Object.keys(req.headers),
                body: req.body
            });
        }
        // Forward request to Coda API
        const codaResponse = await (0, axios_1.default)({
            method: req.body.method || 'GET',
            url: `${config_1.config.codaApiBaseUrl}${req.body.path || ''}`,
            headers: {
                'Authorization': `Bearer ${req.serviceToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'BestViable-Coda-MCP/1.0.0'
            },
            data: req.body.data || {},
            params: req.body.params || {},
            timeout: 30000 // 30 second timeout
        });
        // Return Coda API response
        res.status(codaResponse.status).json({
            success: true,
            data: codaResponse.data,
            timestamp: new Date().toISOString(),
            user: req.user?.email
        });
    }
    catch (error) {
        console.error('[ERROR] MCP request failed:', error);
        if (axios_1.default.isAxiosError(error)) {
            // Handle Coda API errors
            const status = error.response?.status || 500;
            const data = error.response?.data || { message: 'Unknown error' };
            res.status(status).json({
                error: 'Coda API error',
                message: data.message || data.error || 'Request failed',
                timestamp: new Date().toISOString(),
                user: req.user?.email
            });
        }
        else {
            // Handle other errors
            res.status(500).json({
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                user: req.user?.email
            });
        }
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('[ERROR] Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
});
// Start server
function startServer() {
    try {
        // Validate configuration before starting
        (0, config_1.validateConfig)();
        const server = app.listen(config_1.config.port, config_1.config.host, () => {
            console.log(`🚀 Coda MCP server started`);
            console.log(`   URL: http://${config_1.config.host}:${config_1.config.port}`);
            console.log(`   Auth mode: ${config_1.config.authMode}`);
            console.log(`   Coda API: ${config_1.config.codaApiBaseUrl}`);
            console.log(`   Health: http://${config_1.config.host}:${config_1.config.port}/health`);
            console.log(`   MCP: http://${config_1.config.host}:${config_1.config.port}/mcp`);
        });
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM received, shutting down gracefully');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
        process.on('SIGINT', () => {
            console.log('🛑 SIGINT received, shutting down gracefully');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        console.error('[FATAL] Failed to start server:', error);
        process.exit(1);
    }
}
// Start server if this file is run directly
if (require.main === module) {
    startServer();
}
//# sourceMappingURL=http-server.js.map