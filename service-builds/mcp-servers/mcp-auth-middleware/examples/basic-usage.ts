/**
 * Basic usage example for @bestviable/mcp-auth-middleware
 */

import express from 'express';
import { createAuthMiddleware, createConnectionPool, createHealthCheckHandler, AuthenticatedRequest } from '../src/index';

const app = express();

// Create PostgreSQL connection pool
const pool = createConnectionPool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DATABASE || 'mcp_auth',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  maxConnections: 5
});

// Configure authentication middleware
const authMiddleware = createAuthMiddleware({
  mode: 'both', // Try Cloudflare Access first, fallback to bearer token
  tokenStore: 'postgres',
  serviceName: 'example-service',
  encryptionKey: process.env.MCP_AUTH_ENCRYPTION_KEY || 'default-encryption-key-32-bytes-long',
  cloudflareAccessTeamDomain: process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN,
  cloudflareAccessAud: process.env.CLOUDFLARE_ACCESS_AUD,
  bearerToken: process.env.BEARER_TOKEN,
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DATABASE || 'mcp_auth',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || ''
  },
  skipAuthPaths: ['/health', '/status']
});

// Apply authentication middleware
app.use(authMiddleware);

// Health check endpoint
app.get('/health', createHealthCheckHandler({
  mode: 'both',
  tokenStore: 'postgres',
  serviceName: 'example-service',
  encryptionKey: process.env.MCP_AUTH_ENCRYPTION_KEY || 'default-encryption-key-32-bytes-long',
  cloudflareAccessTeamDomain: process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN,
  cloudflareAccessAud: process.env.CLOUDFLARE_ACCESS_AUD,
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DATABASE || 'mcp_auth',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || ''
  }
}));

// Protected endpoint
app.get('/protected', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    message: 'This is a protected endpoint',
    user: req.user,
    authMode: req.authMode,
    serviceToken: req.serviceToken ? '***' : 'not-set'
  });
});

// MCP endpoint (example)
app.post('/mcp', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Your MCP logic here
  res.json({
    message: 'MCP endpoint',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Authentication middleware configured');
  console.log('Health check: GET /health');
  console.log('Protected endpoint: GET /protected');
  console.log('MCP endpoint: POST /mcp');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  // Close database connections
  await pool.end();
  process.exit(0);
});