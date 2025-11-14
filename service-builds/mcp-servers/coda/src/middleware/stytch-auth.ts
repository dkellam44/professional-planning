import { StytchB2BClient } from 'stytch';
import { Request, Response, NextFunction } from 'express';

// Initialize Stytch client
const stytchClient = new StytchB2BClient({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET!,
});

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
    if (req.path === '/health' || req.path.startsWith('/.well-known/')) {
      return next();
    }

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
        timestamp: new Date().toISOString(),
      });
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate access token with Stytch
    // This performs JWT signature validation, expiration check, and retrieves user session
    const response = await stytchClient.sessions.authenticate({
      session_token: accessToken,
    });

    // Extract user info from Stytch response
    req.user = {
      user_id: response.member.member_id,
      email: response.member.email_address,
      session_id: response.session.session_id,
      organization_id: response.organization.organization_id,
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
    console.error('[AUTH] Stytch validation failed:', error.error_type || error.message);

    // Determine error message based on error type
    let errorMessage = 'Invalid or expired access token';
    if (error.error_type === 'session_not_found') {
      errorMessage = 'Session not found or expired';
    } else if (error.error_type === 'invalid_token') {
      errorMessage = 'Invalid access token format';
    }

    // Return 401 Unauthorized
    res.status(401).json({
      error: 'unauthorized',
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Export Stytch client for use in other modules (e.g., OAuth endpoints)
 */
export { stytchClient };
