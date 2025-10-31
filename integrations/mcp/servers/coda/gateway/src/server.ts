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

import express, { Express, Request, Response, NextFunction } from 'express';
import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuditLogger } from './utils/audit-logger.js';
import { validateBearerToken } from './middleware/token-validation.js';
import { getOAuthDiscovery } from './auth/oauth-discovery.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';

const app: Express = express();
const PORT = process.env.PORT || 8080;
const SERVICE_NAME = process.env.SERVICE_NAME || 'mcp-gateway';
const SERVICE_VERSION = process.env.SERVICE_VERSION || '1.0.0';

// Initialize audit logger
const auditLogger = new AuditLogger(SERVICE_NAME);

// Middleware
app.use(express.json({ limit: '10mb' }));

// CORS for remote access
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// ============================================================================
// OAuth 2.0 Discovery Endpoints (RFC 8414)
// ============================================================================

app.get('/.well-known/oauth-authorization-server', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const discovery = getOAuthDiscovery(baseUrl, SERVICE_NAME);
  res.json(discovery);
  auditLogger.log('DISCOVERY', 'RFC8414_ENDPOINT_ACCESSED', { ip: req.ip });
});

// ============================================================================
// Health Check Endpoint
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// Streamable HTTP MCP Endpoints
// ============================================================================

// Store for active sessions
const sessions: Record<string, StreamableHTTPServerTransport> = {};

// Rate limiting for auth endpoints
app.use(rateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyGenerator: (req) => req.ip || 'unknown'
}));

// Bearer token validation middleware
app.use('/mcp', validateBearerToken);

// POST /mcp - Handle MCP requests
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && sessions[sessionId]) {
      // Reuse existing session
      transport = sessions[sessionId];
      auditLogger.log('SESSION', 'SESSION_REUSED', { sessionId, ip: req.ip });
    } else if (!sessionId) {
      // New session initialization
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions[id] = transport;
          auditLogger.log('SESSION', 'SESSION_INITIALIZED', { sessionId: id, ip: req.ip });
        },
        onsessionclosed: (id) => {
          delete sessions[id];
          auditLogger.log('SESSION', 'SESSION_CLOSED', { sessionId: id });
        }
      });

      // Clean up when transport closes
      transport.onclose = () => {
        if (transport.sessionId) {
          delete sessions[transport.sessionId];
        }
      };
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid session' },
        id: null
      });
      return;
    }

    // Handle the request - pass Express req, res, and body
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    auditLogger.log('ERROR', 'MCP_REQUEST_FAILED', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    // Only send error response if headers not already sent
    if (!res.headersSent) {
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        }
      });
    }
  }
});

// GET /mcp - Handle SSE stream or session requests
app.get('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !sessions[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = sessions[sessionId];

  try {
    // Let the transport handle the GET request (handles SSE streaming)
    await transport.handleRequest(req, res);
  } catch (error) {
    auditLogger.log('ERROR', 'SSE_STREAM_ERROR', {
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    if (!res.headersSent) {
      res.status(500).send('Stream error');
    }
  }
});

// DELETE /mcp - Terminate session
app.delete('/mcp', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (!sessionId || !sessions[sessionId]) {
    res.status(400).json({ error: 'Missing or invalid session ID' });
    return;
  }

  const transport = sessions[sessionId];

  try {
    // Let the transport handle the DELETE request (closes the session)
    await transport.handleRequest(req, res);
    delete sessions[sessionId];
    auditLogger.log('SESSION', 'SESSION_TERMINATED', { sessionId, ip: req.ip });
  } catch (error) {
    auditLogger.log('ERROR', 'SESSION_TERMINATION_FAILED', {
      sessionId,
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });

    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to terminate session' });
    }
  }
});

// ============================================================================
// Error handling middleware
// ============================================================================

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  auditLogger.log('ERROR', 'UNHANDLED_ERROR', {
    error: err.message,
    path: req.path,
    ip: req.ip
  });

  res.status(500).json({
    error: 'Internal server error',
    requestId: randomUUID()
  });
});

// ============================================================================
// Start server
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`[${SERVICE_NAME}] HTTP Gateway listening on port ${PORT}`);
  console.log(`[${SERVICE_NAME}] Streamable HTTP transport: POST/GET/DELETE /mcp`);
  console.log(`[${SERVICE_NAME}] OAuth discovery: GET /.well-known/oauth-authorization-server`);
  console.log(`[${SERVICE_NAME}] Health check: GET /health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n[${SERVICE_NAME}] Shutting down gracefully...`);
  server.close(() => {
    console.log(`[${SERVICE_NAME}] Server closed`);
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log(`\n[${SERVICE_NAME}] Received SIGTERM, shutting down...`);
  server.close(() => {
    process.exit(0);
  });
});

export default app;
