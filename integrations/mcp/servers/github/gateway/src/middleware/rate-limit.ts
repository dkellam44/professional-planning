/**
 * Rate Limiting Middleware
 *
 * Protects OAuth and auth endpoints from brute force attacks
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator: (req: Request) => string; // Key to rate limit by (IP, token, etc.)
}

interface RateLimitStore {
  requests: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 *
 * Note: For production with multiple instances, use Redis or similar
 */
export function rateLimitMiddleware(options: RateLimitOptions) {
  const store = new Map<string, RateLimitStore>();

  // Cleanup expired entries every minute
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of store.entries()) {
      if (now > data.resetTime) {
        store.delete(key);
      }
    }
  }, 60 * 1000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = options.keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);

    // Initialize or reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        requests: 1,
        resetTime: now + options.windowMs
      };
      store.set(key, entry);
      next();
      return;
    }

    entry.requests++;

    // Exceed limit
    if (entry.requests > options.maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', options.maxRequests - entry.requests);
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    next();
  };
}
