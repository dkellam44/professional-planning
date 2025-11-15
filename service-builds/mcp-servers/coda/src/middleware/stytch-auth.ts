import { Client as StytchClient } from 'stytch';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';

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
    // Skip authentication for health check, OAuth metadata endpoints, and OAuth flow endpoints
    // These endpoints must be accessible without authentication
    if (req.path === '/health' ||
        req.path.startsWith('/.well-known/') ||
        req.path === '/v1/public/oauth/authorize' ||
        req.path === '/v1/public/oauth/token' ||
        req.path === '/v1/oauth/callback' ||
        req.path === '/oauth/register') {
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

    // Validate JWT access token (issued by our OAuth flow)
    const jwtSecret = process.env.JWT_SECRET || '';

    // Parse JWT
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const [header, payload, signature] = parts;

    // Verify signature
    const expectedSignature = crypto.createHmac('sha256', jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid JWT signature');
    }

    // Decode payload
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());

    // Check expiration
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('JWT expired');
    }

    // Extract user info from JWT
    const userId = decodedPayload.sub || 'unknown';
    const userEmail = decodedPayload.email || 'unknown';
    const sessionId = accessToken.substring(0, 20);
    const orgId = decodedPayload.org_id;

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
