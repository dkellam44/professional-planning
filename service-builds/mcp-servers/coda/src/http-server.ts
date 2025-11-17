import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthenticatedRequest } from './middleware/stytch-auth';
import oauthMetadataRouter from './routes/oauth-metadata';
import { config, validateConfig } from './config';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins (OAuth 2.1 with PKCE handles auth)
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Register OAuth 2.1 metadata endpoints (must be before auth middleware)
app.use(oauthMetadataRouter);

// Serve authorization UI (Vite bundle)
const authorizationUiCandidates = [
  path.join(__dirname, 'authorization-ui'),
  path.join(__dirname, '../dist/authorization-ui'),
  path.join(process.cwd(), 'dist/authorization-ui'),
  path.join(process.cwd(), 'authorization-ui'),
];
const authorizationUiDir = authorizationUiCandidates.find((candidate) => fs.existsSync(candidate));
if (!authorizationUiDir) {
  console.warn('[Auth UI] No static bundle directory found. Checked:', authorizationUiCandidates);
}

if (authorizationUiDir) {
  console.log(`[Auth UI] Serving static assets from: ${authorizationUiDir}`);
  app.use('/oauth', express.static(authorizationUiDir));
  app.get('/oauth/authorize', (_req: Request, res: Response) => {
    const indexPath = path.join(authorizationUiDir, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');
    const publicToken = process.env.STYTCH_PUBLIC_TOKEN || '';
    const redirectUrl = process.env.STYTCH_OAUTH_REDIRECT_URI || `${config.baseUrl}/oauth/authorize`;
    html = html
      .replace(/__STYTCH_PUBLIC_TOKEN__/g, publicToken)
      .replace(/__OAUTH_REDIRECT_URL__/g, redirectUrl);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(html);
  });
}

// Apply Stytch OAuth 2.1 authentication middleware
app.use(authenticate);

// Health check endpoint (skips auth via middleware)
app.get('/health', (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'coda-mcp',
    version: '2.0.0',
    auth: {
      provider: 'stytch',
      oauth_compliant: true,
      stytch_domain: config.stytch.domain,
      authorization_server: `${config.stytch.domain}/.well-known/oauth-authorization-server`,
      protected_resource: `${config.baseUrl}/.well-known/oauth-protected-resource`
    },
    timestamp: new Date().toISOString()
  });
});

// Status endpoint (lighter health check)
app.get('/status', (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'coda-mcp',
    timestamp: new Date().toISOString()
  });
});

// MCP endpoint - proxy requests to Coda API
app.post('/mcp', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
        timestamp: new Date().toISOString()
      });
    }

    // Get service token from request (injected by middleware)
    const serviceToken = req.serviceToken;
    if (!serviceToken) {
      return res.status(500).json({
        error: 'Service token not available',
        message: 'Service token not found in PostgreSQL storage',
        timestamp: new Date().toISOString()
      });
    }

    // Log the request for debugging
    if (config.logLevel === 'debug') {
      console.log(`[DEBUG] MCP request from ${req.user?.email}:`, {
        method: req.method,
        path: req.path,
        headers: Object.keys(req.headers),
        body: req.body
      });
    }

    // Forward request to Coda API
    const method = req.body.method || 'GET';
    const axiosConfig: any ={
      method: method,
      url: `${config.codaApiBaseUrl}${req.body.path || ''}`,
      headers: {
        'Authorization': `Bearer ${req.serviceToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'BestViable-Coda-MCP/1.0.0'
      },
      timeout: 30000 // 30 second timeout
     
    };

    // Only add data for non-GET requests
    if (method !== 'GET' && method !== 'HEAD') {
      axiosConfig.data = req.body.data || {};
    }

    // Add query params if provided
    if (req.body.params && Object.keys(req.body.params).length > 0) {
      axiosConfig.params = req.body.params;
    }

    const codaResponse = await axios(axiosConfig);

    // Return Coda API response
    res.status(codaResponse.status).json({
      success: true,
      data: codaResponse.data,
      timestamp: new Date().toISOString(),
      user: req.user?.email
    });

  } catch (error) {
    console.error('[ERROR] MCP request failed:', error);
    
    if (axios.isAxiosError(error)) {
      // Handle Coda API errors
      const status = error.response?.status || 500;
      const data = error.response?.data || { message: 'Unknown error' };
      
      res.status(status).json({
        error: 'Coda API error',
        message: data.message || data.error || 'Request failed',
        timestamp: new Date().toISOString(),
        user: req.user?.email
      });
    } else {
      // Handle other errors
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        user: req.user?.email
      });
    }
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: any) => {
  console.error('[ERROR] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
export function startServer(): void {
  try {
    // Validate configuration before starting
    validateConfig();

    const server = app.listen(config.port, config.host, () => {
      console.log(`🚀 Coda MCP server started (Phase 2: Stytch OAuth 2.1)`);
      console.log(`   URL: http://${config.host}:${config.port}`);
      console.log(`   Auth: Stytch OAuth 2.1 with PKCE`);
      console.log(`   Stytch Domain: ${config.stytch.domain}`);
      console.log(`   Coda API: ${config.codaApiBaseUrl}`);
      console.log(`   Endpoints:`);
      console.log(`     - MCP: http://${config.host}:${config.port}/mcp`);
      console.log(`     - Health: http://${config.host}:${config.port}/health`);
      console.log(`     - Protected Resource Metadata (RFC 9728): http://${config.host}:${config.port}/.well-known/oauth-protected-resource`);
      console.log(`   Auth Server (hosted by Stytch):`);
      console.log(`     - ${config.stytch.domain}/.well-known/oauth-authorization-server`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('[FATAL] Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
export { app };

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}
