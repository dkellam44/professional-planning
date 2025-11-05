/**
 * Bearer Token Validation Middleware
 *
 * Validates Authorization header format and calls token verification
 */

import { Request, Response, NextFunction } from 'express';
import { AuditLogger } from '../utils/audit-logger.js';

const auditLogger = new AuditLogger('token-validation');

// Bearer token regex: "Bearer <token>"
const BEARER_TOKEN_REGEX = /^Bearer\s+([A-Za-z0-9\-._~+/]+=*)$/;

interface AuthInfo {
  valid: boolean;
  token?: string;
  clientId?: string;
  error?: string;
}

/**
 * Verify token with GitHub API
 *
 * Validates bearer token by calling GitHub's /user endpoint
 */
export async function verifyToken(token: string): Promise<AuthInfo> {
  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `GitHub API error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json() as any;
    const userId = data.id || data.login || 'unknown';

    return {
      valid: true,
      token,
      clientId: userId
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error during token verification'
    };
  }
}

/**
 * Middleware: Validate Bearer token format and signature
 */
export function validateBearerToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // Missing authorization header
  if (!authHeader) {
    auditLogger.log('AUTH_FAILURE', 'MISSING_AUTH_HEADER', {
      path: req.path,
      ip: req.ip
    });

    res.status(401).json({
      error: 'Missing Authorization header',
      code: 'MISSING_AUTH'
    });
    return;
  }

  // Invalid format
  const match = authHeader.match(BEARER_TOKEN_REGEX);
  if (!match) {
    auditLogger.log('AUTH_FAILURE', 'INVALID_TOKEN_FORMAT', {
      path: req.path,
      ip: req.ip
    });

    res.status(401).json({
      error: 'Invalid Authorization header format',
      code: 'INVALID_FORMAT'
    });
    return;
  }

  const token = match[1];

  // Verify token asynchronously
  verifyToken(token)
    .then((authInfo) => {
      if (!authInfo.valid) {
        auditLogger.log('AUTH_FAILURE', 'INVALID_TOKEN', {
          path: req.path,
          ip: req.ip,
          error: authInfo.error
        });

        res.status(401).json({
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
        return;
      }

      // Attach auth info to request
      (req as any).authInfo = authInfo;

      auditLogger.log('AUTH_SUCCESS', 'TOKEN_VALIDATED', {
        path: req.path,
        clientId: authInfo.clientId,
        ip: req.ip
      });

      next();
    })
    .catch((error) => {
      auditLogger.log('AUTH_ERROR', 'TOKEN_VERIFICATION_FAILED', {
        path: req.path,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        error: 'Token verification error',
        code: 'VERIFICATION_ERROR'
      });
    });
}

/**
 * Middleware: Validate token on service startup
 */
export async function validateStartupToken(token: string): Promise<void> {
  if (!token) {
    throw new Error('Token is required');
  }

  if (token.length < 10) {
    throw new Error('Token appears to be too short (minimum 10 characters)');
  }

  // Attempt verification
  const authInfo = await verifyToken(token);

  if (!authInfo.valid) {
    throw new Error(`Token validation failed: ${authInfo.error}`);
  }

  console.log('✓ Token validation successful');
}
