/**
 * OAuth 2.0 Endpoints for ChatGPT/Claude.ai Integration
 *
 * Implements RFC 7591 (Dynamic Client Registration) and RFC 6749 (OAuth 2.0)
 *
 * This enables Claude and ChatGPT to register themselves as OAuth clients
 * and exchange authorization codes for Coda API tokens.
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';

const router = Router();

// In-memory store for OAuth state and codes (in production, use persistent storage)
const authorizationCodes: Record<string, { token: string; expiresAt: number }> = {};
const clientStore: Record<string, { client_id: string; registered_at: Date }> = {};

// ============================================================================
// 1. Dynamic Client Registration (DCR) - RFC 7591
// ============================================================================

/**
 * POST /oauth/register
 *
 * ChatGPT/Claude calls this endpoint to register itself as a client
 *
 * Request body:
 * {
 *   "client_name": "ChatGPT Web Connector",
 *   "application_type": "web",
 *   "redirect_uris": ["https://chatgpt.com/connector_platform_oauth_redirect"],
 *   ...
 * }
 *
 * Response:
 * {
 *   "client_id": "chatgpt-mcp-client",
 *   "redirect_uris": [...],
 *   "token_endpoint_auth_method": "none",
 *   "grant_types": ["authorization_code"],
 *   ...
 * }
 */
router.post('/register', (req: Request, res: Response) => {
  try {
    console.log('[OAuth] Client registration request received', {
      clientName: req.body?.client_name
    });

    // For simplicity, we use a static client_id
    // In a full implementation, you'd generate per-client IDs
    const clientId = 'coda-mcp-client';

    // Store client registration
    clientStore[clientId] = {
      client_id: clientId,
      registered_at: new Date()
    };

    const response = {
      client_id: clientId,
      client_secret: undefined, // Public client (no secret required)
      redirect_uris: [
        'https://chatgpt.com/connector_platform_oauth_redirect',
        'https://claude.ai/api/mcp/auth_callback',
        'https://claude.com/api/mcp/auth_callback'
      ],
      token_endpoint_auth_method: 'none', // Public client
      grant_types: ['authorization_code'],
      response_types: ['code'],
      application_type: 'web',
      scope: 'offline_access email profile',
      scopes_supported: ['offline_access', 'email', 'profile', 'mcp:tools']
    };

    console.log('[OAuth] Registered client:', clientId);
    res.json(response);
  } catch (error) {
    console.error('[OAuth] Registration error:', error);
    res.status(500).json({
      error: 'invalid_request',
      error_description: 'Failed to register client'
    });
  }
});

// ============================================================================
// 2. Authorization Endpoint (User Consent)
// ============================================================================

/**
 * GET /oauth/authorize
 *
 * Presents a user consent screen for the OAuth flow
 *
 * Query parameters:
 * - client_id: The client ID from registration
 * - redirect_uri: Where to send the user after authorization
 * - state: CSRF token (must be returned unchanged)
 * - response_type: "code" (authorization code flow)
 * - scope: Requested scopes
 */
router.get('/authorize', (req: Request, res: Response) => {
  try {
    const { client_id, redirect_uri, state, response_type, scope } = req.query;

    console.log('[OAuth] Authorization request:', {
      client_id,
      redirect_uri,
      state,
      scope
    });

    // Validate required parameters
    if (!client_id || !redirect_uri || !state || response_type !== 'code') {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required OAuth parameters'
      });
      return;
    }

    // For Claude/ChatGPT, we auto-approve since they're first-party clients
    // In a real OAuth server, you'd show a user consent screen here
    const authCode = randomUUID();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store the authorization code
    authorizationCodes[authCode] = {
      token: '', // Will be set by token endpoint
      expiresAt
    };

    console.log('[OAuth] Authorization code generated:', authCode);

    // Redirect back to client with code
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.set('code', authCode);
    redirectUrl.searchParams.set('state', state as string);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[OAuth] Authorization error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Authorization server error'
    });
  }
});

// ============================================================================
// 3. Token Endpoint (Exchange Code for Token)
// ============================================================================

/**
 * POST /oauth/token
 *
 * Exchange authorization code for access token
 *
 * Request body:
 * {
 *   "grant_type": "authorization_code",
 *   "code": "authorization_code_from_authorize_endpoint",
 *   "redirect_uri": "https://...",
 *   "client_id": "coda-mcp-client"
 * }
 *
 * Response:
 * {
 *   "access_token": "Bearer token for Coda API",
 *   "token_type": "Bearer",
 *   "expires_in": 3600
 * }
 */
router.post('/token', (req: Request, res: Response) => {
  try {
    const { grant_type, code, redirect_uri, client_id } = req.body;

    // Validate grant type
    if (grant_type !== 'authorization_code') {
      res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant is supported'
      });
      return;
    }

    // Validate code exists and hasn't expired
    const authRecord = authorizationCodes[code];
    if (!authRecord || authRecord.expiresAt < Date.now()) {
      console.warn('[OAuth] Invalid or expired authorization code:', code);
      res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code is invalid or expired'
      });
      return;
    }

    console.log('[OAuth] Token exchanged for authorization code');

    // In a real implementation, you'd:
    // 1. Validate the code was issued to this client
    // 2. Look up the associated Coda API token
    // 3. Return that token as the access_token

    // For now, we return a mock token
    // Claude/ChatGPT will use this as their Bearer token
    const accessToken = `pat_${randomUUID().replace(/-/g, '')}`;

    // Clean up used authorization code
    delete authorizationCodes[code];

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'offline_access email profile mcp:tools'
    });
  } catch (error) {
    console.error('[OAuth] Token error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Token server error'
    });
  }
});

// ============================================================================
// 4. User Info Endpoint (Get User Info)
// ============================================================================

/**
 * GET /oauth/userinfo
 *
 * Returns information about the authenticated user
 * Requires Bearer token in Authorization header
 */
router.get('/userinfo', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'invalid_token',
        error_description: 'Missing or invalid Bearer token'
      });
      return;
    }

    console.log('[OAuth] User info requested');

    // Return mock user info
    res.json({
      sub: randomUUID(),
      email: 'user@coda.io',
      email_verified: true,
      profile: 'https://coda.io',
      picture: 'https://coda.io/avatar.jpg'
    });
  } catch (error) {
    console.error('[OAuth] User info error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'User info server error'
    });
  }
});

// ============================================================================
// 5. Token Introspection Endpoint (Validate Token)
// ============================================================================

/**
 * POST /oauth/introspect
 *
 * Check if a token is valid and get its metadata
 */
router.post('/introspect', (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        error: 'invalid_request',
        error_description: 'Token parameter required'
      });
      return;
    }

    console.log('[OAuth] Token introspection requested');

    // For now, assume all tokens are valid if they look like pat_*
    const isValid = typeof token === 'string' && token.startsWith('pat_');

    res.json({
      active: isValid,
      token_type: 'Bearer',
      scope: 'offline_access email profile mcp:tools',
      client_id: 'coda-mcp-client',
      exp: Math.floor(Date.now() / 1000) + 3600
    });
  } catch (error) {
    console.error('[OAuth] Introspection error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Introspection server error'
    });
  }
});

export default router;
