import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: {
    email: string;
    user_uuid: string;
  };
  serviceToken?: string;
}

// Cloudflare Access JWT validation
export class CloudflareAccessAuth {
  private jwksClient: jwksClient.JwksClient;

  constructor() {
    this.jwksClient = jwksClient({
      jwksUri: `https://${config.cloudflareAccessTeamDomain}/cdn-cgi/access/certs`,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 60 * 60 * 1000, // 1 hour
    });
  }

  /**
   * Get signing key for JWT verification
   */
  private getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
    this.jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
      } else if (key) {
        const signingKey = key.getPublicKey();
        callback(null, signingKey);
      } else {
        callback(new Error('No signing key found'));
      }
    });
  }

  /**
   * Validate Cloudflare Access JWT
   */
  public async validateJWT(token: string): Promise<{ email: string; user_uuid: string }> {
    return new Promise((resolve, reject) => {
      jwt.verify(
        token,
        this.getKey.bind(this),
        {
          audience: config.cloudflareAccessAud,
          issuer: `https://${config.cloudflareAccessTeamDomain}`,
          algorithms: ['RS256'],
        },
        (err, decoded) => {
          if (err) {
            reject(new Error(`JWT validation failed: ${err.message}`));
          } else if (decoded && typeof decoded === 'object') {
            const email = decoded.email as string;
            const user_uuid = decoded.user_uuid as string;
            
            if (!email) {
              reject(new Error('JWT missing email claim'));
            } else {
              resolve({ email, user_uuid });
            }
          } else {
            reject(new Error('Invalid JWT payload'));
          }
        }
      );
    });
  }

  /**
   * Validate Bearer token (for development/local testing)
   */
  public validateBearerToken(authHeader: string): boolean {
    if (!authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.substring(7);
    
    // In development mode, accept any non-empty token
    // In production, this should validate against a known token
    if (config.authMode === 'bearer' && config.bearerToken) {
      return token === config.bearerToken;
    }
    
    // For 'both' mode, accept any valid-looking token in development
    return token.length > 0 && token.length < 1000;
  }

  /**
   * Express middleware for authentication
   */
  public middleware(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Skip authentication for health and status endpoints
        if (req.path === '/health' || req.path === '/status') {
          // Add auth status to health check
          if (req.path === '/health') {
            req.serviceToken = 'health-check';
          }
          return next();
        }

        let authenticated = false;
        let userEmail: string | undefined;
        let userUuid: string | undefined;

        // Check for Cloudflare Access JWT
        const cfAccessJWT = req.headers['cf-access-jwt-assertion'] as string;
        if (cfAccessJWT && (config.authMode === 'cloudflare' || config.authMode === 'both')) {
          try {
            const userInfo = await this.validateJWT(cfAccessJWT);
            authenticated = true;
            userEmail = userInfo.email;
            userUuid = userInfo.user_uuid;
            
            if (config.logLevel === 'debug') {
              console.log(`[DEBUG] Cloudflare Access JWT validated for: ${userEmail}`);
            }
          } catch (error) {
            console.log(`[WARN] Cloudflare Access JWT validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        // Check for Bearer token (fallback for development)
        const authHeader = req.headers.authorization;
        if (!authenticated && authHeader && (config.authMode === 'bearer' || config.authMode === 'both')) {
          if (this.validateBearerToken(authHeader)) {
            authenticated = true;
            userEmail = 'developer@localhost';
            userUuid = 'dev-user-uuid';
            
            if (config.logLevel === 'debug') {
              console.log(`[DEBUG] Bearer token authenticated for: ${userEmail}`);
            }
          }
        }

        if (!authenticated) {
          res.status(401).json({
            error: 'Authentication required',
            message: 'Valid Cloudflare Access JWT or Bearer token required',
            timestamp: new Date().toISOString()
          });
          return;
        }

        // Set user info on request
        if (userEmail && userUuid) {
          req.user = { email: userEmail, user_uuid: userUuid };
        }

        // Set service token for Coda API calls
        req.serviceToken = config.codaApiToken;

        next();
      } catch (error) {
        console.error('[ERROR] Authentication middleware error:', error);
        res.status(500).json({
          error: 'Internal server error',
          message: 'Authentication system error',
          timestamp: new Date().toISOString()
        });
      }
    };
  }
}

// Export singleton instance
export const cloudflareAccessAuth = new CloudflareAccessAuth();

// Export middleware function
export const authenticate = cloudflareAccessAuth.middleware();