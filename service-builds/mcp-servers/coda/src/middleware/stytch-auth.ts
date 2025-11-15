import { Client as StytchClient } from 'stytch';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

// Load environment variables if not already loaded
dotenv.config();

// Initialize Stytch client (lazy initialization with validation)
let stytchClient: any;

function initializeStytchClient(): any {
  if (!stytchClient) {
    const projectId = process.env.STYTCH_PROJECT_ID;
    const secret = process.env.STYTCH_SECRET;
    const domain = process.env.STYTCH_DOMAIN;

    if (!projectId || !secret || !domain) {
      throw new Error(
        'Stytch configuration incomplete. ' +
        'Please set STYTCH_PROJECT_ID, STYTCH_SECRET, and STYTCH_DOMAIN environment variables.'
      );
    }

    stytchClient = new StytchClient({
      project_id: projectId,
      secret: secret,
      custom_base_url: domain,
    });
  }
  return stytchClient;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    session_id: string;
    organization_id?: string;
  };
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
      const baseUrl = process.env.BASE_URL || 'https://coda.bestviable.com';
      const wwwAuthValue = `Bearer error="Unauthorized", error_description="Unauthorized", resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`;

      res.setHeader('WWW-Authenticate', wwwAuthValue);
      res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
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

    // Extract user info from validated token
    const userId = tokenData.sub || 'unknown';
    const userEmail = tokenData.email || 'unknown';
    const sessionId = tokenData.session_id || accessToken.substring(0, 20);
    const orgId = tokenData.organization_id;

    req.user = {
      user_id: userId,
      email: userEmail,
      session_id: sessionId,
      organization_id: orgId,
    };

    // Set Coda service token (from environment variable)
    // This is the API token used to call Coda API on behalf of the authenticated user
    req.serviceToken = process.env.CODA_API_TOKEN;

    // Log successful authentication (debug mode only)
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(
        `[AUTH] Stytch auth successful: ${req.user.email} (session: ${req.user.session_id})`
      );
    }

    next();
  } catch (error: any) {
    // Log authentication failure
    console.error('[AUTH] Stytch token validation failed:', error.error_type || error.message);

    // Return 401 with WWW-Authenticate header
    const baseUrl = process.env.BASE_URL || 'https://coda.bestviable.com';
    const wwwAuthValue = `Bearer error="invalid_token", error_description="The access token is invalid or expired", resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`;

    res.setHeader('WWW-Authenticate', wwwAuthValue);
    res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or expired access token',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Export Stytch client initialization function for use in other modules (e.g., OAuth endpoints)
 */
export { initializeStytchClient };
