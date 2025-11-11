import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        email: string;
        user_uuid: string;
    };
    serviceToken?: string;
}
export declare class CloudflareAccessAuth {
    private jwksClient;
    constructor();
    /**
     * Get signing key for JWT verification
     */
    private getKey;
    /**
     * Validate Cloudflare Access JWT
     */
    validateJWT(token: string): Promise<{
        email: string;
        user_uuid: string;
    }>;
    /**
     * Validate Bearer token (for development/local testing)
     */
    validateBearerToken(authHeader: string): boolean;
    /**
     * Express middleware for authentication
     */
    middleware(): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}
export declare const cloudflareAccessAuth: CloudflareAccessAuth;
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=cloudflare-access-auth.d.ts.map