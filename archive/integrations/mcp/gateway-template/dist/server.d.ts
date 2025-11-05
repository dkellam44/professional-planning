/**
 * HTTP Gateway Server for stdio MCP servers
 *
 * Wraps stdio-based MCP servers and exposes them via:
 * - Streamable HTTP transport (POST/GET/DELETE /mcp)
 * - OAuth 2.0 discovery endpoints (RFC 8414)
 * - Bearer token authentication
 *
 * Security features:
 * - Token validation on startup
 * - Bearer token format validation
 * - Sanitized error responses (no internal details)
 * - Audit logging for all authentication attempts
 * - Rate limiting on auth endpoints
 */
import { Express } from 'express';
declare const app: Express;
export default app;
//# sourceMappingURL=server.d.ts.map