import { Client as StytchClient } from 'stytch';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

// Initialize Stytch client (lazy initialization with validation)
let stytchClient: any;

function initializeStytchClient(): any {
  if (!stytchClient) {
    stytchClient = new StytchClient({
      project_id: config.stytch.projectId,
      secret: config.stytch.secret,
      custom_base_url: config.stytch.domain,
    });
  }
  return stytchClient;
}

export interface AuthenticatedRequest extends Request {
  user?: any; // Stytch token introspection response
  serviceToken?: string;
}

/**
 * Stytch OAuth 2.1 authentication middleware
 * Validates access tokens and extracts user identity
 *
 * This middleware implements OAuth 2.1 compliance per MCP Specification 2025-06-18
 * - Validates JWT access tokens using Stytch SDK
 * - Extracts user identity from validated session
 * - Injects Coda API service token for downstream handlers
 *
 * @param req - Express request (extended with user and serviceToken)
 * @param res - Express response
 * @param next - Express next function
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Skip authentication for health check and OAuth metadata endpoints
    // These endpoints must be accessible without authentication
    if (req.path === '/health' || req.path.startsWith('/.well-known/')) {
      next();
      return;
    }

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return 401 with WWW-Authenticate header pointing to Protected Resource Metadata
      // This is required by RFC 9728 and the MCP specification
      const wwwAuthValue = `Bearer error="Unauthorized", ` +
        `error_description="Unauthorized", ` +
        `resource_metadata="${req.get('host')}/.well-known/oauth-protected-resource"`;

      res.setHeader('WWW-Authenticate', wwwAuthValue);
      res.status(401).json({
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate access token using Stytch's token introspection
    // This validates the JWT signature, expiration, and audience
    const client = initializeStytchClient();

    // Use Stytch's introspectTokenLocal method to validate the JWT
    // This method validates the token locally using JWKS without making an API call
    const tokenData: any = await client.idp.introspectTokenLocal(accessToken);

    // Set the token data on the request for later use
    req.user = tokenData;

    // Set Coda service token (from environment variable)
    // This is the API token used to call Coda API on behalf of the authenticated user
    req.serviceToken = config.codaApiToken;

    // Log successful authentication (debug mode only)
    if (config.logLevel === 'debug') {
      console.log(
        `[AUTH] Stytch auth successful for token: ${accessToken.substring(0, 20)}...`
      );
    }

    next();
  } catch (error: any) {
    // Log authentication failure
    console.error('[AUTH] Stytch token validation failed:', error.error_type || error.message);

    // Return 401 with WWW-Authenticate header
    const wwwAuthValue = `Bearer error="Unauthorized", ` +
      `error_description="Unauthorized", ` +
      `resource_metadata="${req.get('host')}/.well-known/oauth-protected-resource"`;

    res.setHeader('WWW-Authenticate', wwwAuthValue);
    res.status(401).json({
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Export Stytch client initialization function for use in other modules (e.g., OAuth endpoints)
 */
export { initializeStytchClient };
