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

    if (!projectId || !secret) {
      throw new Error(
        'Stytch OAuth 2.1 configuration incomplete. ' +
        'Please set STYTCH_PROJECT_ID and STYTCH_SECRET environment variables.'
      );
    }

    stytchClient = new StytchClient({
      project_id: projectId,
      secret: secret,
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
    if (req.path === '/health' || req.path.startsWith('/.well-known/')) {
      next();
      return;
    }

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer " prefix

    // Validate access token with Stytch
    // This performs JWT signature validation, expiration check, and retrieves user session
    const client = initializeStytchClient();
    const response: any = await client.sessions.authenticate({
      session_token: accessToken,
    });

    // Extract user info from Stytch response
    // Handle both B2B (member) and B2C (user) response formats
    const userId = response.member?.member_id || response.user?.user_id || 'unknown';
    const userEmail = response.member?.email_address || response.user?.emails?.[0]?.email || 'unknown';
    const sessionId = response.session?.session_id || accessToken.substring(0, 20);
    const orgId = response.organization?.organization_id;

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
 * Export Stytch client initialization function for use in other modules (e.g., OAuth endpoints)
 */
export { initializeStytchClient };
