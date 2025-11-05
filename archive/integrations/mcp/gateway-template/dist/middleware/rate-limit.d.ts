/**
 * Rate Limiting Middleware
 *
 * Protects OAuth and auth endpoints from brute force attacks
 */
import { Request, Response, NextFunction } from 'express';
interface RateLimitOptions {
    windowMs: number;
    maxRequests: number;
    keyGenerator: (req: Request) => string;
}
/**
 * Simple in-memory rate limiter
 *
 * Note: For production with multiple instances, use Redis or similar
 */
export declare function rateLimitMiddleware(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=rate-limit.d.ts.map