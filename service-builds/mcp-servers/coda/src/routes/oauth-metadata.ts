import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

/**
 * OAuth Protected Resource Metadata (RFC 9728)
 *
 * Required by MCP Specification 2025-06-18
 *
 * This endpoint tells MCP clients:
 * 1. What resource this is (our MCP server URL)
 * 2. Which authorization server can issue tokens (Stytch)
 * 3. What scopes are supported
 *
 * According to the Stytch MCP guide, this is the ONLY OAuth metadata endpoint
 * we need to host. Stytch hosts all other OAuth endpoints:
 * - Authorization Server Metadata (/.well-known/oauth-authorization-server)
 * - Dynamic Client Registration (/v1/oauth2/register)
 * - Authorization endpoint (the <IdentityProvider /> component page)
 * - Token endpoint (/v1/oauth2/token)
 *
 * @see https://stytch.com/docs/guides/connected-apps/mcp-server-overview
 * @see https://datatracker.ietf.org/doc/html/rfc9728
 */
router.get('/.well-known/oauth-protected-resource', (req: Request, res: Response) => {
  res.json({
    // The resource identifier - this MCP server
    resource: config.baseUrl,

    // Authorization server that issues tokens for this resource
    // This should be your Stytch project domain
    authorization_servers: [config.stytch.domain],

    // OAuth scopes this MCP server supports
    // MCP clients will request these scopes when authorizing
    scopes_supported: [
      'openid',
      'email',
      'profile',
      'mcp.read',
      'mcp.write',
      'mcp.tools'
    ],

    // How bearer tokens should be provided
    bearer_methods_supported: ['header'],

    // Token signing algorithm (Stytch uses RS256 for JWTs)
    resource_signing_alg_values_supported: ['RS256'],
  });
});

/**
 * JWKS Endpoint (JSON Web Key Set)
 *
 * Provides public keys for validating JWT access tokens
 * Proxies to Stytch's JWKS endpoint
 *
 * MCP clients may use this to validate tokens locally,
 * though we validate tokens server-side via Stytch API.
 */
router.get('/.well-known/jwks.json', async (req: Request, res: Response) => {
  try {
    // Proxy to Stytch JWKS endpoint
    const response = await fetch(`${config.stytch.domain}/.well-known/jwks.json`);

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
