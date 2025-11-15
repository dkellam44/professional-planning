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
    authorization_endpoint: 'https://api.stytch.com/v1/public/oauth/authorize',
    token_endpoint: 'https://api.stytch.com/v1/public/oauth/token',
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

export default router;
