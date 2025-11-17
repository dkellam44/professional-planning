import { Router, Request, Response } from 'express';

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
  const baseUrl = (process.env.BASE_URL || 'https://coda.bestviable.com').replace(/\/$/, '');
  const stytchDomain = (process.env.STYTCH_DOMAIN || 'https://api.stytch.com').replace(/\/$/, '');

  res.json({
    resource: `${baseUrl}/mcp`,
    authorization_servers: [stytchDomain],

    // OAuth scopes this MCP server supports
    // MCP clients will request these scopes when authorizing
    scopes_supported: ['openid', 'email', 'profile', 'coda.read', 'coda.write'],

    // How bearer tokens should be provided
    bearer_methods_supported: ['header'],

    // Token signing algorithm (Stytch uses RS256 for JWTs)
    resource_signing_alg_values_supported: ['RS256'],
  });
});

// JWKS handled by Stytch; MCP clients should fetch from the authorization server directly

export default router;
