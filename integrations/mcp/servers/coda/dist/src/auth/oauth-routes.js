"use strict";
/**
 * OAuth 2.0 Endpoints for ChatGPT/Claude.ai Integration
 *
 * Implements RFC 7591 (Dynamic Client Registration) and RFC 6749 (OAuth 2.0)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_store_js_1 = require("./auth-store.js");
const fs_1 = require("fs");
const path_1 = require("path");
const url_1 = require("url");
const router = (0, express_1.Router)();
// Get __dirname in ESM
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = (0, path_1.dirname)(__filename);
// ============================================================================
// 1. Dynamic Client Registration (DCR) - RFC 7591
// ============================================================================
router.post('/register', (req, res) => {
    /**
     * ChatGPT calls this endpoint to register itself as a client
     *
     * We return a static client_id since we don't need per-client tracking
     */
    console.log('[OAuth] Client registration request received');
    // Scope: Using "email" instead of "openid email" to avoid OIDC id_token requirement
    // ChatGPT accepts "email" without requiring id_token
    const response = {
        client_id: 'chatgpt-mcp-client',
        redirect_uris: [
            'https://chatgpt.com/connector_platform_oauth_redirect',
            'https://claude.ai/api/mcp/auth_callback',
            'https://claude.com/api/mcp/auth_callback' // Future URL
        ],
        token_endpoint_auth_method: 'none', // Public client (no secret)
        grant_types: ['authorization_code'],
        response_types: ['code'],
        application_type: 'web',
        scope: 'email'
    };
    console.log('[OAuth] Registered client:', response.client_id);
    res.json(response);
});
// ============================================================================
// 2. Authorization Endpoint (User Login)
// ============================================================================
router.get('/authorize', (req, res) => {
    /**
     * User-facing login page
     *
     * Query params from OAuth client:
     * - response_type: "code"
     * - client_id: (from registration)
     * - redirect_uri: where to send user back
     * - state: CSRF token
     * - code_challenge: PKCE challenge (optional)
     * - code_challenge_method: "S256" or "plain"
     */
    const { client_id, redirect_uri, state, code_challenge, code_challenge_method } = req.query;
    console.log('[OAuth] Authorization request:', { client_id, redirect_uri, state });
    // Validate required params
    if (!redirect_uri || !state) {
        res.status(400).send('Missing required OAuth parameters');
        return;
    }
    // Serve login page HTML
    try {
        // In production, __dirname points to /app/dist/auth
        // HTML file is at /app/src/views/authorize.html
        const htmlPath = (0, path_1.join)(__dirname, '../../src/views/authorize.html');
        let html = (0, fs_1.readFileSync)(htmlPath, 'utf-8');
        // Inject OAuth params into HTML form
        html = html.replace('{{REDIRECT_URI}}', redirect_uri);
        html = html.replace('{{STATE}}', state);
        html = html.replace('{{CODE_CHALLENGE}}', code_challenge || '');
        html = html.replace('{{CODE_CHALLENGE_METHOD}}', code_challenge_method || '');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
    catch (error) {
        console.error('[OAuth] Failed to load authorize.html:', error);
        res.status(500).send('Internal server error');
    }
});
// Handle form submission from login page
router.post('/authorize', (req, res) => {
    /**
     * User submitted Coda API token
     *
     * 1. Validate token format
     * 2. Generate authorization code
     * 3. Store code → token mapping
     * 4. Redirect user back to OAuth client with code
     */
    const { coda_token, redirect_uri, state, code_challenge, code_challenge_method } = req.body;
    console.log('[OAuth] Authorization form submitted');
    // Validate inputs
    if (!coda_token || !redirect_uri || !state) {
        res.status(400).send('Missing required fields');
        return;
    }
    // Basic token format validation (Coda tokens start with specific prefix)
    if (typeof coda_token !== 'string' || coda_token.length < 20) {
        res.status(400).send('Invalid Coda API token format');
        return;
    }
    // Generate authorization code
    const authCode = auth_store_js_1.authStore.createCode(coda_token, code_challenge, code_challenge_method);
    // Redirect back to OAuth client with code
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', authCode);
    redirectUrl.searchParams.set('state', state);
    console.log('[OAuth] Redirecting to:', redirectUrl.toString());
    res.redirect(redirectUrl.toString());
});
// ============================================================================
// 3. Token Endpoint (Exchange Code for Access Token)
// ============================================================================
router.post('/token', (req, res) => {
    /**
     * ChatGPT exchanges authorization code for access_token
     *
     * This is the "secret sauce": we return the user's Coda API token
     * as the access_token, which ChatGPT will use for all future MCP requests
     */
    const { grant_type, code, client_id, code_verifier, redirect_uri } = req.body;
    console.log('[OAuth] Token request received');
    console.log('[OAuth] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[OAuth] Request headers:', JSON.stringify(req.headers, null, 2));
    // Validate grant_type
    if (grant_type !== 'authorization_code') {
        res.status(400).json({
            error: 'unsupported_grant_type',
            error_description: 'Only authorization_code grant type is supported'
        });
        return;
    }
    // Validate code
    if (!code) {
        res.status(400).json({
            error: 'invalid_request',
            error_description: 'Missing authorization code'
        });
        return;
    }
    // Exchange code for token
    const codaToken = auth_store_js_1.authStore.exchangeCode(code, code_verifier);
    if (!codaToken) {
        res.status(400).json({
            error: 'invalid_grant',
            error_description: 'Invalid, expired, or already used authorization code'
        });
        return;
    }
    // Return the Coda API token as the access_token
    // This is what ChatGPT will save and use for all future MCP requests
    const tokenResponse = {
        access_token: codaToken,
        token_type: 'Bearer',
        expires_in: 7776000, // 90 days (arbitrary, can be longer)
        scope: 'email'
    };
    console.log('[OAuth] Token issued successfully');
    console.log('[OAuth] Response:', JSON.stringify({
        ...tokenResponse,
        access_token: codaToken.substring(0, 10) + '...' // Redact token in logs
    }, null, 2));
    // RFC 6749 requires these headers for security
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.json(tokenResponse);
});
// ============================================================================
// Export router
// ============================================================================
exports.default = router;
