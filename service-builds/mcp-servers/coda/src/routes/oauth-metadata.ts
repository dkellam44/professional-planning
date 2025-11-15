import { Router, Request, Response } from 'express';
import crypto from 'crypto';

const router = Router();

// Simple in-memory store for registered OAuth clients (RFC 7591)
// In production, this should be persisted in a database
const registeredClients = new Map<string, {
  client_id: string;
  client_secret: string;
  client_name: string;
  redirect_uris: string[];
  registered_at: string;
}>();

// Pre-register known clients (ChatGPT, Claude.ai)
// These would normally be registered via the RFC 7591 endpoint
function initializeDefaultClients() {
  // ChatGPT
  registeredClients.set('chatgpt-client', {
    client_id: process.env.CHATGPT_CLIENT_ID || 'chatgpt-' + crypto.randomBytes(16).toString('hex'),
    client_secret: process.env.CHATGPT_CLIENT_SECRET || crypto.randomBytes(32).toString('hex'),
    client_name: 'ChatGPT',
    redirect_uris: ['https://chat.openai.com/oauth/callback', 'http://localhost/oauth/callback'],
    registered_at: new Date().toISOString(),
  });

  // Claude.ai
  registeredClients.set('claude-client', {
    client_id: process.env.CLAUDE_CLIENT_ID || 'claude-' + crypto.randomBytes(16).toString('hex'),
    client_secret: process.env.CLAUDE_CLIENT_SECRET || crypto.randomBytes(32).toString('hex'),
    client_name: 'Claude.ai',
    redirect_uris: ['https://claude.ai/oauth/callback', 'http://localhost/oauth/callback'],
    registered_at: new Date().toISOString(),
  });
}

initializeDefaultClients();

/**
 * OAuth Authorization Server Metadata (RFC 8414)
 *
 * Required by MCP Specification 2025-06-18
 *
 * This endpoint provides metadata about the OAuth authorization server (Stytch)
 * that clients (ChatGPT, Claude.ai) use to discover OAuth endpoints and capabilities.
 *
 * Implements:
 * - RFC 8414: OAuth 2.0 Authorization Server Metadata Discovery
 * - RFC 7591: OAuth 2.0 Dynamic Client Registration Protocol
 * - RFC 7636: Proof Key for Public Clients (PKCE)
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8414
 * @see https://datatracker.ietf.org/doc/html/rfc7591
 */
router.get('/.well-known/oauth-authorization-server', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://coda.bestviable.com';

  res.json({
    issuer: 'https://api.stytch.com',
    // Authorization and token endpoints are routed through the project's custom domain
    // Stytch routes /v1/public/oauth/authorize and /v1/public/oauth/token through coda.bestviable.com
    authorization_endpoint: `${baseUrl}/v1/public/oauth/authorize`,
    token_endpoint: `${baseUrl}/v1/public/oauth/token`,
    jwks_uri: 'https://api.stytch.com/v1/public/keys',

    // RFC 7591: Dynamic Client Registration endpoint
    // Clients (ChatGPT, Claude.ai) can register themselves here to obtain client_id and client_secret
    registration_endpoint: `${baseUrl}/oauth/register`,

    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],

    // Scopes authorized in Stytch project: login, signup, invite, reset_password
    scopes_supported: ['openid', 'email', 'profile', 'login', 'signup', 'invite', 'reset_password'],
  });
});

/**
 * OAuth Protected Resource Metadata (RFC 9728)
 *
 * Required by MCP Specification 2025-06-18 (added June 2025 revision)
 *
 * This endpoint provides metadata about this protected resource (Coda MCP server)
 * including which authorization servers can issue tokens for it.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc9728
 */
router.get('/.well-known/oauth-protected-resource', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://coda.bestviable.com';

  res.json({
    resource: baseUrl,
    authorization_servers: ['https://api.stytch.com'],
    scopes_supported: ['mcp.read', 'mcp.write', 'mcp.tools'],
    bearer_methods_supported: ['header'],
    resource_signing_alg_values_supported: ['RS256'],
  });
});

/**
 * JWKS Endpoint (JSON Web Key Set)
 *
 * Provides public keys for validating JWT access tokens
 * Proxies to Stytch's JWKS endpoint
 *
 * MCP clients may use this to validate tokens locally if desired,
 * though the Stytch SDK handles validation automatically.
 */
router.get('/.well-known/jwks.json', async (req, res) => {
  try {
    // Proxy to Stytch JWKS endpoint
    const response = await fetch('https://api.stytch.com/v1/public/keys');

    if (!response.ok) {
      throw new Error(`Stytch JWKS fetch failed: ${response.statusText}`);
    }

    const keys = await response.json();
    res.json(keys);
  } catch (error) {
    console.error('[OAUTH] Failed to fetch JWKS:', error);
    res.status(500).json({
      error: 'internal_server_error',
      message: 'Failed to fetch JWKS from authorization server',
    });
  }
});

/**
 * OAuth Client Registration Endpoint (RFC 7591)
 *
 * Allows OAuth clients (ChatGPT, Claude.ai) to register themselves
 * and receive client credentials (client_id, client_secret).
 *
 * Required by some MCP clients for dynamic client registration.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7591
 *
 * POST /oauth/register
 * Content-Type: application/json
 *
 * Request:
 * {
 *   "client_name": "ChatGPT",
 *   "redirect_uris": ["https://chat.openai.com/oauth/callback"],
 *   "response_types": ["code"],
 *   "grant_types": ["authorization_code", "refresh_token"],
 *   "contacts": ["contact@example.com"],
 *   "token_endpoint_auth_method": "client_secret_post"
 * }
 *
 * Response:
 * {
 *   "client_id": "...",
 *   "client_secret": "...",
 *   "client_name": "ChatGPT",
 *   "redirect_uris": [...],
 *   "grant_types": ["authorization_code", "refresh_token"],
 *   "response_types": ["code"],
 *   "client_id_issued_at": 1234567890,
 *   "client_secret_expires_at": 0
 * }
 */
router.post('/oauth/register', (req: Request, res: Response) => {
  try {
    const { client_name, redirect_uris, response_types, grant_types, contacts } = req.body;

    // Validate request
    if (!client_name || !redirect_uris || !Array.isArray(redirect_uris)) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing or invalid required fields: client_name, redirect_uris',
      });
    }

    // Generate credentials
    const client_id = `${client_name.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomBytes(12).toString('hex')}`;
    const client_secret = crypto.randomBytes(32).toString('hex');

    // Store registration
    registeredClients.set(client_id, {
      client_id,
      client_secret,
      client_name,
      redirect_uris,
      registered_at: new Date().toISOString(),
    });

    // Log registration
    console.log(`[OAUTH] New client registered: ${client_name} (${client_id})`);

    // Return RFC 7591 response
    res.status(201).json({
      client_id,
      client_secret,
      client_name,
      redirect_uris,
      response_types: response_types || ['code'],
      grant_types: grant_types || ['authorization_code', 'refresh_token'],
      token_endpoint_auth_method: 'client_secret_post',
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0, // No expiration
    });
  } catch (error) {
    console.error('[OAUTH] Client registration failed:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An unexpected error occurred during client registration',
    });
  }
});

// OAuth authorization state storage (authorization code flow)
// In production, use Redis or a database
const authorizationRequests = new Map<string, {
  client_id: string;
  redirect_uri: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
  scope: string;
  timestamp: number;
}>();

const authorizationCodes = new Map<string, {
  client_id: string;
  redirect_uri: string;
  code_challenge?: string;
  user_id: string;
  user_email: string;
  scope: string;
  timestamp: number;
}>();

/**
 * OAuth Authorization Endpoint (RFC 6749)
 *
 * Initiates OAuth flow by redirecting to Stytch Google OAuth.
 *
 * GET /v1/public/oauth/authorize?client_id=...&response_type=code&scope=...&redirect_uri=...&state=...
 */
router.get('/v1/public/oauth/authorize', (req: Request, res: Response) => {
  try {
    const { client_id, response_type, scope, redirect_uri, state, code_challenge, code_challenge_method } = req.query;

    // Validate request
    if (!client_id || !redirect_uri || !state || response_type !== 'code') {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing or invalid required parameters',
      });
    }

    // Store authorization request for callback
    const requestId = crypto.randomBytes(32).toString('hex');
    authorizationRequests.set(requestId, {
      client_id: client_id as string,
      redirect_uri: redirect_uri as string,
      state: state as string,
      code_challenge: code_challenge as string,
      code_challenge_method: code_challenge_method as string,
      scope: scope as string || 'openid email profile',
      timestamp: Date.now(),
    });

    // Log authorization request
    console.log(`[OAUTH] Authorization request from client: ${client_id} (request_id: ${requestId})`);

    // Get Stytch public token from environment
    const publicToken = process.env.STYTCH_PUBLIC_TOKEN;
    if (!publicToken) {
      console.error('[OAUTH] STYTCH_PUBLIC_TOKEN not configured');
      return res.status(500).json({
        error: 'server_error',
        error_description: 'OAuth not properly configured',
      });
    }

    // Build Stytch Google OAuth start URL
    const baseUrl = process.env.BASE_URL || 'https://coda.bestviable.com';
    const callbackUrl = `${baseUrl}/v1/oauth/callback`;

    const stytchParams = new URLSearchParams({
      public_token: publicToken,
      login_redirect_url: callbackUrl,
      signup_redirect_url: callbackUrl,
    });

    // Add custom state to track the request
    stytchParams.append('custom_scopes', requestId);

    // Redirect to Stytch Google OAuth
    const stytchAuthUrl = `https://api.stytch.com/v1/public/oauth/google/start?${stytchParams.toString()}`;

    console.log(`[OAUTH] Redirecting to Stytch Google OAuth (request_id: ${requestId})`);
    res.redirect(stytchAuthUrl);
  } catch (error) {
    console.error('[OAUTH] Authorization endpoint error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred during authorization',
    });
  }
});

/**
 * OAuth Callback Endpoint
 *
 * Receives the callback from Stytch after user authentication.
 * Exchanges Stytch token for user info and generates authorization code.
 *
 * GET /v1/oauth/callback?token=...&stytch_token_type=oauth
 */
router.get('/v1/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { token, stytch_token_type } = req.query;

    if (!token || stytch_token_type !== 'oauth') {
      return res.status(400).send('Invalid callback parameters');
    }

    console.log('[OAUTH] Received callback from Stytch');

    // Import Stytch client
    const { initializeStytchClient } = await import('../middleware/stytch-auth');
    const stytchClient = initializeStytchClient();

    // Authenticate with Stytch to get user info
    const authResponse = await stytchClient.oauth.authenticate({
      token: token as string,
      session_duration_minutes: 60,
    });

    const userId = authResponse.user.user_id;
    const userEmail = authResponse.user.emails?.[0]?.email || 'unknown';

    console.log(`[OAUTH] User authenticated via Stytch: ${userEmail}`);

    // Find the original authorization request
    // For now, we'll use the first pending request (in production, use proper state tracking)
    const [requestId, authRequest] = Array.from(authorizationRequests.entries())[0] || [];

    if (!authRequest) {
      return res.status(400).send('No pending authorization request found');
    }

    // Remove the request from pending
    authorizationRequests.delete(requestId);

    // Generate authorization code
    const authCode = crypto.randomBytes(32).toString('hex');
    authorizationCodes.set(authCode, {
      client_id: authRequest.client_id,
      redirect_uri: authRequest.redirect_uri,
      code_challenge: authRequest.code_challenge,
      user_id: userId,
      user_email: userEmail,
      scope: authRequest.scope,
      timestamp: Date.now(),
    });

    console.log(`[OAUTH] Generated authorization code for client: ${authRequest.client_id}`);

    // Redirect back to client with authorization code
    const redirectUrl = new URL(authRequest.redirect_uri);
    redirectUrl.searchParams.append('code', authCode);
    redirectUrl.searchParams.append('state', authRequest.state);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('[OAUTH] Callback error:', error);
    res.status(500).send('Authentication failed');
  }
});

/**
 * OAuth Token Endpoint (RFC 6749)
 *
 * Exchanges authorization code for access token.
 * Generates JWT access token for authenticated user.
 *
 * POST /v1/public/oauth/token
 * Content-Type: application/x-www-form-urlencoded or application/json
 *
 * Request:
 * {
 *   "grant_type": "authorization_code",
 *   "code": "...",
 *   "client_id": "...",
 *   "client_secret": "...",
 *   "redirect_uri": "..."
 * }
 */
router.post('/v1/public/oauth/token', async (req: Request, res: Response) => {
  try {
    const { grant_type, code, client_id, redirect_uri, code_verifier } = req.body;

    // Validate required fields
    if (grant_type !== 'authorization_code' || !code || !client_id || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required fields for authorization_code grant',
      });
    }

    console.log(`[OAUTH] Token exchange request from client: ${client_id}`);

    // Retrieve authorization code
    const authData = authorizationCodes.get(code);
    if (!authData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Authorization code is invalid or expired',
      });
    }

    // Validate client_id and redirect_uri match
    if (authData.client_id !== client_id || authData.redirect_uri !== redirect_uri) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Client credentials do not match authorization request',
      });
    }

    // Verify PKCE if code_challenge was used
    if (authData.code_challenge && !code_verifier) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'code_verifier required for PKCE',
      });
    }

    if (authData.code_challenge && code_verifier) {
      // Verify PKCE challenge (S256)
      const hash = crypto.createHash('sha256').update(code_verifier).digest('base64url');
      if (hash !== authData.code_challenge) {
        return res.status(400).json({
          error: 'invalid_grant',
          error_description: 'PKCE verification failed',
        });
      }
    }

    // Remove used authorization code
    authorizationCodes.delete(code);

    // Generate JWT access token
    const jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
    const payload = {
      sub: authData.user_id,
      email: authData.user_email,
      scope: authData.scope,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      iss: process.env.BASE_URL || 'https://coda.bestviable.com',
      aud: client_id,
    };

    // Simple JWT creation (in production, use jsonwebtoken library)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', jwtSecret).update(`${header}.${payloadStr}`).digest('base64url');
    const accessToken = `${header}.${payloadStr}.${signature}`;

    console.log(`[OAUTH] Issued access token for user: ${authData.user_email}`);

    // Return token response
    res.status(200).json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: authData.scope,
    });
  } catch (error) {
    console.error('[OAUTH] Token endpoint error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'An error occurred while processing the token request',
    });
  }
});

export default router;
