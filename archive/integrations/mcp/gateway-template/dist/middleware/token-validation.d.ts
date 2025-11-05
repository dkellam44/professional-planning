/**
 * Bearer Token Validation Middleware
 *
 * Validates Authorization header format and calls token verification
 */
import { Request, Response, NextFunction } from 'express';
interface AuthInfo {
    valid: boolean;
    token?: string;
    clientId?: string;
    error?: string;
}
/**
 * Verify token with external service (override in child gateways)
 *
 * This is a stub that child implementations should override with actual verification
 */
export declare function verifyToken(token: string): Promise<AuthInfo>;
/**
 * Middleware: Validate Bearer token format and signature
 */
export declare function validateBearerToken(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware: Validate token on service startup
 */
export declare function validateStartupToken(token: string): Promise<void>;
export {};
//# sourceMappingURL=token-validation.d.ts.map