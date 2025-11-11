import { Request, Response } from 'express';
import { AuthConfig } from '../types/auth';
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
export declare function createHealthCheckHandler(config: AuthConfig): (_req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=health-check.d.ts.map