import { Client as StytchClient } from 'stytch';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import config from '../config';

// Load environment variables if not already loaded
dotenv.config();

// Initialize Stytch client (lazy initialization with validation)
let stytchClient: StytchClient | null = null;

function initializeStytchClient(): StytchClient {
  if (!stytchClient) {
    const projectId = process.env.STYTCH_PROJECT_ID;
    const secret = process.env.STYTCH_SECRET;
    const domain = config.stytch.domain;

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

const normalizeBaseUrl = (url: string): string => url.replace(/\/$/, '');
const normalizedBaseUrl = normalizeBaseUrl(config.baseUrl);
const metadataUri = `${normalizedBaseUrl}/.well-known/oauth-protected-resource`;
const expectedAudience = process.env.MCP_RESOURCE_AUDIENCE || `${normalizedBaseUrl}/mcp`;
const expectedIssuer = config.stytch.domain || 'https://api.stytch.com';
const isDevMode = process.env.NODE_ENV !== 'production';
const devBearerToken = process.env.BEARER_TOKEN;

const buildWwwAuthenticateHeader = (error: string, description: string): string =>
  `Bearer realm="MCP Server", error="${error}", error_description="${description}", resource_metadata_uri="${metadataUri}"`;

const decodeJwtClaims = (token: string): Record<string, any> => {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('invalid_token_format');
  }
  const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
  return JSON.parse(payload);
};

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
      const header = buildWwwAuthenticateHeader('invalid_token', 'Unauthorized');
      res.setHeader('WWW-Authenticate', header);
      res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer " prefix

    // Dev fallback
    if (isDevMode && devBearerToken && accessToken === devBearerToken) {
      req.user = {
        user_id: 'dev-user',
        email: 'dev@localhost',
        session_id: 'dev-session',
      };
      req.serviceToken = process.env.CODA_API_TOKEN;
      next();
      return;
    }

    const client = initializeStytchClient();
    const authResult = await client.sessions.authenticateJwt({ session_jwt: accessToken });
    const claims = decodeJwtClaims(accessToken);

    const audienceClaim = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;
    if (audienceClaim !== expectedAudience) {
      const header = buildWwwAuthenticateHeader('invalid_token', 'Token audience mismatch');
      res.setHeader('WWW-Authenticate', header);
      res.status(401).json({
        error: 'unauthorized',
        message: 'Token audience mismatch',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (claims.iss !== expectedIssuer) {
      const header = buildWwwAuthenticateHeader('invalid_token', 'Invalid token issuer');
      res.setHeader('WWW-Authenticate', header);
      res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid token issuer',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (typeof claims.exp !== 'number' || Date.now() >= claims.exp * 1000) {
      const header = buildWwwAuthenticateHeader('invalid_token', 'Token expired');
      res.setHeader('WWW-Authenticate', header);
      res.status(401).json({
        error: 'unauthorized',
        message: 'Token expired',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const session = authResult.session;
    const sessionEmail = (session?.custom_claims?.email as string | undefined) || (session?.custom_claims?.email_address as string | undefined);
    req.user = {
      user_id: session?.user_id || claims.sub || 'unknown',
      email: claims.email || claims.email_address || sessionEmail || 'unknown',
      session_id: session?.session_id || accessToken.substring(0, 20),
      organization_id: claims.organization_id,
    };

    req.serviceToken = process.env.CODA_API_TOKEN;

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
    const wwwAuthValue = buildWwwAuthenticateHeader('invalid_token', 'The access token is invalid or expired');

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

// Test hook to override client in unit tests
export function __setStytchClient(client: StytchClient | null): void {
  stytchClient = client;
}
