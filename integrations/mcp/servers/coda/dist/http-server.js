"use strict";
/**
 * HTTP-Native Coda MCP Server
 *
 * Direct HTTP server for MCP (no stdio bridge required)
 * - Streamable HTTP transport per MCP spec 2025-03-26
 * - Integrated OAuth 2.0 authentication
 * - Session management for stateful connections
 *
 * Architecture:
 * - Single process (no subprocess required)
 * - Express.js for HTTP handling
 * - Direct connection to Coda API via OAuth Bearer token
 * - SyncBricks compatible (single Docker service)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const crypto_1 = require("crypto");
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const server_js_1 = require("./server.js");
const client_gen_js_1 = require("./client/client.gen.js");
const token_counter_js_1 = require("./utils/token-counter.js");
const memory_hooks_js_1 = require("./types/memory-hooks.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const SERVICE_NAME = 'coda-mcp';
const SERVICE_VERSION = '1.0.0';
// ============================================================================
// Middleware
// ============================================================================
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// CORS headers (required for remote access)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});
// Request logging
app.use((req, _res, next) => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl} auth=${req.headers.authorization ? 'yes' : 'no'}`);
    next();
});
// ============================================================================
// Origin Validation (MCP Security Requirement)
// ============================================================================
app.use((req, res, next) => {
    const origin = req.get('origin');
    // In production behind Cloudflare Tunnel, we trust the tunnel
    // For local development, validate origin
    if (process.env.NODE_ENV !== 'production' && origin) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:8080',
            'https://chatgpt.com',
            'https://claude.ai',
            'https://claude.com',
            'https://coda.bestviable.com'
        ];
        if (!allowedOrigins.includes(origin)) {
            console.warn(`[SECURITY] Rejected request from origin: ${origin}`);
            res.status(403).json({ error: 'Forbidden origin' });
            return;
        }
    }
    next();
});
// ============================================================================
// Health Check Endpoint
// ============================================================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        timestamp: new Date().toISOString()
    });
});
// ============================================================================
// OAuth 2.0 / OIDC Endpoints (Cloudflare Access Integration)
// ============================================================================
/**
 * OAuth Authorization Server metadata endpoint
 * Exposes server capabilities to OAuth clients (e.g., Cloudflare Access)
 * Reference: RFC 8414 - OAuth 2.0 Authorization Server Metadata
 */
app.get('/.well-known/oauth-authorization-server', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        issuer: baseUrl,
        authorization_endpoint: `${baseUrl}/oauth/authorize`,
        token_endpoint: `${baseUrl}/oauth/token`,
        userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
        introspection_endpoint: `${baseUrl}/oauth/introspect`,
        scopes_supported: ['openid', 'profile', 'email', 'mcp:tools'],
        response_types_supported: ['code', 'token'],
        grant_types_supported: ['authorization_code', 'client_credentials', 'implicit'],
        token_endpoint_auth_methods_supported: ['Bearer', 'client_secret_basic'],
        service_documentation: 'https://docs.bestviable.com/mcp/oauth'
    });
    console.log('[OAUTH] Authorization Server metadata requested');
});
/**
 * Protected Resource metadata endpoint
 * Informs clients about how to access protected resources on this server
 * Custom RFC for MCP integration
 */
app.get('/.well-known/oauth-protected-resource', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
        resource_id: 'coda-mcp',
        resource_name: 'Coda MCP Server',
        authorization_server: baseUrl,
        endpoints: [
            {
                path: '/mcp',
                methods: ['POST', 'GET', 'DELETE'],
                description: 'MCP protocol endpoints (JSON-RPC over HTTP)',
                requires_auth: true,
                auth_methods: ['Bearer token', 'Cloudflare Access header']
            },
            {
                path: '/health',
                methods: ['GET'],
                description: 'Health check endpoint',
                requires_auth: false
            }
        ],
        scopes_required: {
            '/mcp': ['mcp:tools']
        }
    });
    console.log('[OAUTH] Protected Resource metadata requested');
});
/**
 * Cloudflare Access Token Validation Endpoint
 * When Cloudflare Access is configured, tokens are passed in X-CF-Access-Token header
 * This endpoint validates tokens without requiring Bearer prefix
 */
app.post('/oauth/validate-token', (req, res) => {
    const token = req.body?.token || req.headers['x-cf-access-token'];
    if (!token) {
        res.status(400).json({
            valid: false,
            error: 'Missing token'
        });
        return;
    }
    // In a full implementation, this would validate against Cloudflare's token service
    // For now, we accept any non-empty token and log it
    console.log(`[OAUTH] Token validation requested: ${String(token).substring(0, 16)}...`);
    res.json({
        valid: true,
        token_type: 'Bearer',
        scope: 'mcp:tools',
        expires_in: 3600
    });
});
// ============================================================================
// Session Management
// ============================================================================
const sessions = {};
// ============================================================================
// Cloudflare Access Token Validation Middleware
// ============================================================================
/**
 * Validates Cloudflare Access JWT tokens
 * In production, verify against Cloudflare's JWKS endpoint
 * For now, we extract the identity from the Cf-Access-Authenticated-User-Email header
 */
const cloudflareAccessMiddleware = (req, res, next) => {
    const cfAccessJwt = req.headers['cf-access-jwt-assertion'];
    const cfAccessEmail = req.headers['cf-access-authenticated-user-email'];
    if (cfAccessJwt || cfAccessEmail) {
        // Valid Cloudflare Access request
        console.log(`[CLOUDFLARE] Access request from: ${cfAccessEmail || 'unknown'}`, {
            hasJwt: !!cfAccessJwt,
            jwtLen: cfAccessJwt?.length || 0
        });
        // Store user identity for logging
        res.locals.userId = cfAccessEmail || 'anonymous';
        res.locals.authMethod = 'cloudflare-access';
    }
    next();
};
// Apply Cloudflare Access validation globally
app.use(cloudflareAccessMiddleware);
// ============================================================================
// Bearer Token Validation and Coda Client Setup
// ============================================================================
// Middleware to validate Bearer token and configure Coda client
const bearerTokenMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Missing or invalid authorization header',
            message: 'Bearer token required'
        });
        return;
    }
    const token = authHeader.substring(7).trim();
    if (!token) {
        res.status(401).json({
            error: 'Invalid Bearer token',
            message: 'Token cannot be empty'
        });
        return;
    }
    // Configure Coda API client with the provided Bearer token
    client_gen_js_1.client.setConfig({
        baseURL: 'https://coda.io/apis/v1',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    console.log(`[Auth] Configured Coda client with token: ${token.substring(0, 8)}...`);
    res.locals.authMethod = 'bearer-token';
    next();
};
// Apply Bearer token validation to /mcp endpoints
app.use('/mcp', bearerTokenMiddleware);
const sessionMetrics = new Map();
// ============================================================================
// Memory Hooks Configuration
// ============================================================================
// Use logging hooks in development, can be swapped with persistent layer
const memoryHooks = process.env.NODE_ENV === 'production'
    ? { /* production hooks would go here */}
    : memory_hooks_js_1.loggingMemoryHooks;
/**
 * Track response metadata for context budgeting
 */
app.use('/mcp', (req, res, next) => {
    const sessionId = req.headers['mcp-session-id'] || 'unknown';
    // Initialize metrics if needed
    if (!sessionMetrics.has(sessionId)) {
        sessionMetrics.set(sessionId, {
            sessionId,
            totalTokens: 0,
            requestCount: 0,
            startTime: new Date()
        });
    }
    const metrics = sessionMetrics.get(sessionId);
    metrics.requestCount++;
    // Add metrics to response locals for use in handlers
    res.locals.sessionId = sessionId;
    res.locals.metrics = metrics;
    console.log(`[METRICS] Session ${sessionId.substring(0, 8)}... - Request #${metrics.requestCount}`);
    next();
});
// ============================================================================
// MCP POST Endpoint (Client Requests)
// ============================================================================
app.post('/mcp', async (req, res) => {
    try {
        const sessionId = req.headers['mcp-session-id'];
        let transport;
        console.log('[MCP] Incoming POST /mcp', {
            sessionId,
            hasBody: !!req.body,
            hasAuth: !!req.headers.authorization
        });
        if (sessionId && sessions[sessionId]) {
            // Reuse existing session
            transport = sessions[sessionId];
            console.log(`[MCP] Reusing session: ${sessionId}`);
        }
        else if (!sessionId) {
            // Create new session
            const newSessionId = (0, crypto_1.randomUUID)();
            transport = new streamableHttp_js_1.StreamableHTTPServerTransport({
                sessionIdGenerator: () => newSessionId,
                enableJsonResponse: true
            });
            // Store the transport for reuse
            sessions[newSessionId] = transport;
            console.log(`[MCP] Session initialized: ${newSessionId}`);
            // Connect MCP server to transport
            await server_js_1.server.connect(transport);
            console.log('[MCP] Connected server to new transport');
        }
        else {
            // sessionId provided but not found
            res.status(400).json({
                jsonrpc: '2.0',
                error: { code: -32000, message: 'Invalid session ID' },
                id: null
            });
            return;
        }
        // Prepare tool call info for memory hooks
        const toolCall = {
            sessionId: transport.sessionId || 'unknown',
            timestamp: new Date(),
            toolName: req.body?.method || 'unknown',
            toolMethod: req.body?.method,
            params: req.body?.params || req.body
        };
        // Call onToolCall hook BEFORE execution
        try {
            if (memoryHooks.onToolCall) {
                await memoryHooks.onToolCall(toolCall);
            }
        }
        catch (hookError) {
            console.warn('[MEMORY-HOOK] onToolCall error:', hookError);
        }
        // Handle the request
        const startTime = Date.now();
        await transport.handleRequest(req, res, req.body);
        const duration = Date.now() - startTime;
        // Update session metrics with estimated token usage
        const metrics = res.locals.metrics;
        if (req.body) {
            const estimatedTokens = (0, token_counter_js_1.estimateToolResponseTokens)(req.body.method || 'unknown', req.body);
            metrics.totalTokens += estimatedTokens;
        }
        // Call onResponse hook AFTER execution
        const toolResponse = {
            sessionId: transport.sessionId || 'unknown',
            timestamp: new Date(),
            toolName: toolCall.toolName,
            success: !res.statusCode || res.statusCode < 400,
            metadata: {
                duration,
                tokenEstimate: metrics.totalTokens
            }
        };
        try {
            if (memoryHooks.onResponse) {
                await memoryHooks.onResponse(toolResponse);
            }
        }
        catch (hookError) {
            console.warn('[MEMORY-HOOK] onResponse error:', hookError);
        }
        console.log('[MCP] POST /mcp handled', {
            sessionId: transport.sessionId,
            duration: `${duration}ms`,
            requestCount: metrics.requestCount,
            totalTokens: metrics.totalTokens,
            headersSent: res.headersSent
        });
    }
    catch (error) {
        console.error('[MCP] Request error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                jsonrpc: '2.0',
                error: {
                    code: -32603,
                    message: 'Internal server error'
                },
                id: null
            });
        }
    }
});
// ============================================================================
// MCP GET Endpoint (Server-Sent Events / SSE Stream)
// ============================================================================
app.get('/mcp', async (req, res) => {
    try {
        const sessionId = req.headers['mcp-session-id'];
        console.log('[MCP] Incoming GET /mcp', {
            sessionId,
            hasAuth: !!req.headers.authorization
        });
        if (!sessionId || !sessions[sessionId]) {
            res.status(400).send('Invalid or missing session ID');
            return;
        }
        const transport = sessions[sessionId];
        // Let transport handle GET (SSE streaming)
        await transport.handleRequest(req, res);
        console.log('[MCP] GET /mcp handled', {
            sessionId,
            headersSent: res.headersSent
        });
    }
    catch (error) {
        console.error('[MCP] SSE stream error:', error);
        if (!res.headersSent) {
            res.status(500).send('Stream error');
        }
    }
});
// ============================================================================
// MCP DELETE Endpoint (Session Termination)
// ============================================================================
app.delete('/mcp', async (req, res) => {
    try {
        const sessionId = req.headers['mcp-session-id'];
        console.log('[MCP] Incoming DELETE /mcp', {
            sessionId,
            hasAuth: !!req.headers.authorization
        });
        if (!sessionId || !sessions[sessionId]) {
            res.status(400).json({ error: 'Missing or invalid session ID' });
            return;
        }
        const transport = sessions[sessionId];
        // Capture metrics before cleanup
        const metrics = sessionMetrics.get(sessionId);
        const duration = metrics ? Date.now() - metrics.startTime.getTime() : 0;
        // Let transport handle DELETE (close session)
        await transport.handleRequest(req, res);
        delete sessions[sessionId];
        // Call onSessionEnd hook BEFORE cleanup
        const sessionContext = {
            sessionId: sessionId || 'unknown',
            startTime: metrics?.startTime || new Date(),
            endTime: new Date(),
            totalRequests: metrics?.requestCount || 0,
            totalTokens: metrics?.totalTokens || 0,
            tools: [], // Would need to track this separately
            errors: 0 // Would need to track this separately
        };
        try {
            if (memoryHooks.onSessionEnd) {
                await memoryHooks.onSessionEnd(sessionContext);
            }
        }
        catch (hookError) {
            console.warn('[MEMORY-HOOK] onSessionEnd error:', hookError);
        }
        // Log session summary and cleanup metrics
        console.log('[MCP] DELETE /mcp handled - session terminated', {
            sessionId,
            duration: `${(duration / 1000).toFixed(1)}s`,
            totalRequests: metrics?.requestCount || 0,
            totalTokens: metrics?.totalTokens || 0
        });
        // Clean up metrics for this session
        if (metrics) {
            sessionMetrics.delete(sessionId);
        }
    }
    catch (error) {
        console.error('[MCP] Session termination error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to terminate session' });
        }
    }
});
// ============================================================================
// Error Handling
// ============================================================================
app.use((err, req, res, next) => {
    console.error('[ERROR] Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        requestId: (0, crypto_1.randomUUID)()
    });
});
// ============================================================================
// Server Startup
// ============================================================================
const server = app.listen(PORT, () => {
    console.log(`\n[${'='.repeat(60)}]`);
    console.log(`[${SERVICE_NAME}] HTTP Native MCP Server`);
    console.log(`[${SERVICE_NAME}] Version: ${SERVICE_VERSION}`);
    console.log(`[${SERVICE_NAME}] Listening on port ${PORT}`);
    console.log(`[${SERVICE_NAME}]`);
    console.log(`[${SERVICE_NAME}] MCP Endpoints (requires Bearer token):`);
    console.log(`[${SERVICE_NAME}]   POST   /mcp       (client requests)`);
    console.log(`[${SERVICE_NAME}]   GET    /mcp       (SSE stream)`);
    console.log(`[${SERVICE_NAME}]   DELETE /mcp       (terminate session)`);
    console.log(`[${SERVICE_NAME}]`);
    console.log(`[${SERVICE_NAME}] OAuth / Discovery Endpoints:`);
    console.log(`[${SERVICE_NAME}]   GET    /.well-known/oauth-authorization-server`);
    console.log(`[${SERVICE_NAME}]   GET    /.well-known/oauth-protected-resource`);
    console.log(`[${SERVICE_NAME}]   POST   /oauth/validate-token`);
    console.log(`[${SERVICE_NAME}]`);
    console.log(`[${SERVICE_NAME}] Health & Status:`);
    console.log(`[${SERVICE_NAME}]   GET    /health    (health check)`);
    console.log(`[${'='.repeat(60)}]\n`);
});
// Graceful shutdown
process.on('SIGINT', () => {
    console.log(`\n[${SERVICE_NAME}] Shutting down gracefully...`);
    server.close(() => {
        console.log(`[${SERVICE_NAME}] Server closed`);
        process.exit(0);
    });
});
process.on('SIGTERM', () => {
    console.log(`\n[${SERVICE_NAME}] Received SIGTERM, shutting down...`);
    server.close(() => process.exit(0));
});
exports.default = app;
