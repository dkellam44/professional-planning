import { Request, Response, NextFunction } from 'express';
import { AuthConfig } from '../types/auth';
import { AuthenticatedRequest } from '../types/express';
import { validateCloudflareAccessJWT } from '../validators/cloudflare-access';
import { validateBearerToken } from '../validators/bearer-token';
import { TokenStore } from '../postgres/token-store';
import { getConnectionPool } from '../postgres/connection';

export interface AuthMiddlewareOptions {
  onSuccess?: (req: AuthenticatedRequest, user: { email: string; user_uuid: string }) => void;
  onError?: (req: Request, error: Error) => void;
  getServiceToken?: (req: AuthenticatedRequest) => Promise<string> | string;
}

/**
 * Create Express authentication middleware
 */
export function createAuthMiddleware(
  config: AuthConfig,
  options: AuthMiddlewareOptions = {}
) {
  const {
    onSuccess,
    onError,
    getServiceToken
  } = options;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Skip authentication for configured paths
      if (config.skipAuthPaths?.includes(req.path)) {
        if (req.path === '/health' || req.path === '/status') {
          req.serviceToken = 'health-check';
        }
        return next();
      }

      let authenticated = false;
      let userEmail: string | undefined;
      let userUuid: string | undefined;
      let authMode: 'cloudflare' | 'bearer' | undefined;

      // Check for Cloudflare Access JWT
      const cfAccessJWT = req.headers['cf-access-jwt-assertion'] as string;
      if (cfAccessJWT && (config.mode === 'cloudflare' || config.mode === 'both')) {
        try {
          if (!config.cloudflareAccessTeamDomain || !config.cloudflareAccessAud) {
            throw new Error('Cloudflare Access configuration missing');
          }

          const userInfo = await validateCloudflareAccessJWT(
            cfAccessJWT,
            config.cloudflareAccessTeamDomain,
            config.cloudflareAccessAud
          );

          authenticated = true;
          userEmail = userInfo.email;
          userUuid = userInfo.user_uuid;
          authMode = 'cloudflare';

          if (config.logLevel === 'debug') {
            console.log(`[DEBUG] Cloudflare Access JWT validated for: ${userEmail}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`[WARN] Cloudflare Access JWT validation failed: ${errorMessage}`);
        }
      }

      // Check for Bearer token (fallback for development)
      const authHeader = req.headers.authorization;
      if (!authenticated && authHeader && (config.mode === 'bearer' || config.mode === 'both')) {
        const bearerConfig = {
          token: config.bearerToken || undefined,
          allowAnyToken: !config.bearerToken, // Allow any token if no specific token configured
          maxTokenLength: 1000
        };

        const validation = validateBearerToken(authHeader, bearerConfig);
        
        if (validation.valid) {
          authenticated = true;
          userEmail = validation.userEmail;
          userUuid = 'bearer-user-uuid';
          authMode = 'bearer';

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
        req.authMode = authMode || 'bearer';
      }

      // Get service token
      if (getServiceToken) {
        try {
          req.serviceToken = await Promise.resolve(getServiceToken(req));
        } catch (error) {
          console.error('[ERROR] Failed to get service token:', error);
          res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve service token',
            timestamp: new Date().toISOString()
          });
          return;
        }
      } else if (config.tokenStore === 'postgres') {
        // Try to get service token from PostgreSQL
        try {
          const pool = getConnectionPool();
          const tokenStore = new TokenStore(pool, config.encryptionKey || '');
          const serviceToken = await tokenStore.getToken(config.serviceName, 'api_token');
          
          if (serviceToken) {
            req.serviceToken = serviceToken;
          } else {
            console.warn(`[WARN] No service token found for ${config.serviceName}`);
          }
        } catch (error) {
          console.error('[ERROR] Failed to get service token from PostgreSQL:', error);
        }
      } else if (config.tokenStore === 'env') {
        // For environment variable storage, the service should set req.serviceToken
        // This is handled by the calling application
      }

      // Call success callback if provided
      if (onSuccess && req.user) {
        try {
          onSuccess(req, req.user);
        } catch (error) {
          console.error('[ERROR] Success callback failed:', error);
        }
      }

      next();
    } catch (error) {
      console.error('[ERROR] Authentication middleware error:', error);
      
      // Call error callback if provided
      if (onError) {
        try {
          onError(req, error instanceof Error ? error : new Error('Unknown error'));
        } catch (callbackError) {
          console.error('[ERROR] Error callback failed:', callbackError);
        }
      }

      res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication system error',
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Create a simple auth middleware with default options
 */
export function createSimpleAuthMiddleware(config: AuthConfig) {
  return createAuthMiddleware(config, {
    getServiceToken: async (_req: AuthenticatedRequest) => {
      if (config.tokenStore === 'postgres') {
        try {
          const pool = getConnectionPool();
          const tokenStore = new TokenStore(pool, config.encryptionKey || '');
          return await tokenStore.getToken(config.serviceName, 'api_token') || '';
        } catch (error) {
          console.error('Failed to get service token:', error);
          return '';
        }
      }
      return '';
    }
  });
}