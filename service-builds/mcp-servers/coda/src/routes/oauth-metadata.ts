import { Router } from 'express';

const router = Router();

/**
 * OAuth Authorization Server Metadata (RFC 8414)
 *
 * Required by MCP Specification 2025-06-18
 *
 * This endpoint provides metadata about the OAuth authorization server (Stytch)
 * that clients (ChatGPT, Claude.ai) use to discover OAuth endpoints and capabilities.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc8414
 */
router.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: 'https://api.stytch.com',
    authorization_endpoint: 'https://api.stytch.com/v1/public/oauth/authorize',
    token_endpoint: 'https://api.stytch.com/v1/public/oauth/token',
    jwks_uri: 'https://api.stytch.com/v1/public/keys',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    scopes_supported: ['openid', 'email', 'profile'],
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

export default router;
