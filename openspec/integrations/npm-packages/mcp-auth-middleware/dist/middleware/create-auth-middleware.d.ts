import { Request, Response, NextFunction } from 'express';
import { AuthConfig } from '../types/auth';
import { AuthenticatedRequest } from '../types/express';
export interface AuthMiddlewareOptions {
    onSuccess?: (req: AuthenticatedRequest, user: {
        email: string;
        user_uuid: string;
    }) => void;
    onError?: (req: Request, error: Error) => void;
    getServiceToken?: (req: AuthenticatedRequest) => Promise<string> | string;
}
/**
 * Create Express authentication middleware
 */
export declare function createAuthMiddleware(config: AuthConfig, options?: AuthMiddlewareOptions): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Create a simple auth middleware with default options
 */
export declare function createSimpleAuthMiddleware(config: AuthConfig): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=create-auth-middleware.d.ts.map