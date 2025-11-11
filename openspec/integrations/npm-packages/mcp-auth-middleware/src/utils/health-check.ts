import { Request, Response } from 'express';
import { AuthConfig } from '../types/auth';
import { getConnectionPool } from '../postgres/connection';
import { TokenStore } from '../postgres/token-store';

export interface HealthCheckResult {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  auth: {
    mode: string;
    status: 'configured' | 'error';
    details?: Record<string, unknown>;
  };
  tokenStorage: {
    type: string;
    status: 'connected' | 'error' | 'not_configured';
    details?: Record<string, unknown>;
  };
  database?: {
    status: 'connected' | 'error';
    details?: Record<string, unknown>;
  };
}

/**
 * Create a health check handler
 */
export function createHealthCheckHandler(config: AuthConfig) {
  return async (_req: Request, res: Response): Promise<void> => {
    const result: HealthCheckResult = {
      status: 'ok',
      service: config.serviceName,
      timestamp: new Date().toISOString(),
      auth: {
        mode: config.mode,
        status: 'configured'
      },
      tokenStorage: {
        type: config.tokenStore,
        status: 'not_configured'
      }
    };

    try {
      // Test token storage
      if (config.tokenStore === 'postgres') {
        try {
          const pool = getConnectionPool();
          const client = await pool.connect();
          
          // Test basic connectivity
          await client.query('SELECT 1');
          
          // Test token store
          const tokenStore = new TokenStore(pool, config.encryptionKey || 'test-key');
          await tokenStore.auditLog(config.serviceName, 'HEALTH_CHECK');
          
          result.tokenStorage.status = 'connected';
          result.tokenStorage.details = {
            poolSize: pool.totalCount,
            availableConnections: pool.idleCount
          };

          client.release();
        } catch (error) {
          result.tokenStorage.status = 'error';
          result.tokenStorage.details = {
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          result.status = 'error';
        }
      } else if (config.tokenStore === 'env') {
        result.tokenStorage.status = 'connected';
        result.tokenStorage.details = {
          message: 'Using environment variable storage'
        };
      }

      // Test authentication configuration
      if (config.mode === 'cloudflare' || config.mode === 'both') {
        if (!config.cloudflareAccessTeamDomain || !config.cloudflareAccessAud) {
          result.auth.status = 'error';
          result.auth.details = {
            error: 'Cloudflare Access configuration incomplete'
          };
          result.status = 'error';
        }
      }

      res.status(result.status === 'error' ? 503 : 200).json(result);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'error',
        service: config.serviceName,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}