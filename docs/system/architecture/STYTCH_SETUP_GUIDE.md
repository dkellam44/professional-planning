# Stytch OAuth 2.1 Setup Guide for Coda MCP Server

**Purpose**: Complete step-by-step guide to integrate Stytch OAuth 2.1 authentication with the Coda MCP server, replacing Cloudflare Access JWT to achieve MCP spec compliance (2025-06-18).

**Audience**: Developers deploying MCP servers with OAuth 2.1 compliance
**Time**: 4-6 hours (account setup + implementation + testing)
**Difficulty**: Beginner-Intermediate

---

## Prerequisites

- [ ] Coda MCP server currently running (Phase 1 & 1.5 complete)
- [ ] Docker and docker-compose installed
- [ ] Node.js 18+ installed locally (for development)
- [ ] Access to droplet via SSH (`ssh droplet`)
- [ ] Email account for Stytch signup
- [ ] Understanding of OAuth 2.1 basics (recommended but not required)

---

## Table of Contents

1. [Stytch Account Setup](#1-stytch-account-setup) (30 min)
2. [Stytch Project Configuration](#2-stytch-project-configuration) (30 min)
3. [Local Development Setup](#3-local-development-setup) (1 hour)
4. [Code Implementation](#4-code-implementation) (2 hours)
5. [Deployment to Droplet](#5-deployment-to-droplet) (30 min)
6. [Testing with ChatGPT/Claude.ai](#6-testing-with-chatgptclaudeai) (1 hour)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Stytch Account Setup

### Step 1.1: Create Stytch Account

1. Go to [https://stytch.com/](https://stytch.com/)
2. Click **"Start building for free"**
3. Sign up with email or GitHub
4. Verify your email address

**Expected Result**: You're logged into the Stytch Dashboard

---

### Step 1.2: Create New Project

1. In Stytch Dashboard, click **"Create Project"**
2. **Project Details**:
   - Name: `Professional Planning MCPs`
   - Type: **B2B** (for better MCP support)
   - Region: **US** (or closest to your droplet)
3. Click **"Create Project"**

**Expected Result**: New project appears in dashboard

---

### Step 1.3: Get API Credentials

1. In left sidebar, click **"API Keys"**
2. Note down your credentials:
   ```
   Project ID: project-test-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Secret (Test): secret-test-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Secret (Live): secret-live-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
3. **IMPORTANT**: Keep these secret! Never commit to git.

**Store Credentials**: Add to `.env` file (create if doesn't exist):
```bash
# Stytch Configuration
STYTCH_PROJECT_ID=project-test-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
STYTCH_SECRET=secret-test-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Coda API (existing)
CODA_API_TOKEN=pat_xxxxx
```

---

## 2. Stytch Project Configuration

### Step 2.1: Configure OAuth Settings

1. In Stytch Dashboard, go to **"OAuth"** (left sidebar)
2. Click **"Enable OAuth"**
3. **OAuth Configuration**:
   - **Redirect URLs**: Add these URLs (for testing):
     ```
     http://localhost:3000/callback
     https://coda.bestviable.com/callback
     https://chatgpt.com/callback
     https://claude.ai/callback
     ```
   - **Grant Types**:
     - ✅ Authorization Code
     - ✅ Refresh Token
   - **PKCE**: ✅ **Required** (mandatory for MCP spec)
4. Click **"Save Changes"**

**Expected Result**: OAuth is enabled with PKCE required

---

### Step 2.2: Configure Authentication Methods

1. Go to **"Authentication"** → **"Email"**
2. Enable **Email Magic Links** (passwordless):
   - ✅ Enable email magic links
   - Set expiration: **10 minutes**
3. (Optional) Enable **OAuth Providers**:
   - ✅ Google
   - ✅ GitHub
   - Configure OAuth apps (follow Stytch docs)
4. Click **"Save"**

**Why Email Magic Links?**: Simple, secure, no password management needed for personal use.

---

### Step 2.3: Configure Sessions

1. Go to **"Sessions"**
2. **Session Settings**:
   - **Max session duration**: `30 days`
   - **Idle session timeout**: `7 days`
   - **Session token type**: `JWT` (required for MCP)
3. Click **"Save"**

**Expected Result**: Sessions configured with JWT tokens

---

## 3. Local Development Setup

### Step 3.1: Clone/Navigate to Coda MCP Directory

```bash
cd /home/user/professional-planning/service-builds/mcp-servers/coda
```

---

### Step 3.2: Install Stytch SDK

```bash
npm install stytch@latest
```

**Expected Version**: `stytch@27.0.0` or later

**Remove Old Dependencies** (optional cleanup):
```bash
npm uninstall jsonwebtoken jwks-rsa
```

---

### Step 3.3: Update package.json

Verify `package.json` now includes:
```json
{
  "dependencies": {
    "stytch": "^27.0.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  }
}
```

---

### Step 3.4: Create .env File

Create `/home/user/professional-planning/service-builds/mcp-servers/coda/.env`:

```bash
# Stytch Configuration
STYTCH_PROJECT_ID=project-test-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
STYTCH_SECRET=secret-test-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Coda API
CODA_API_TOKEN=pat_xxxxx
CODA_API_BASE_URL=https://coda.io/apis/v1

# Server Configuration
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=debug
```

**Security**: Add `.env` to `.gitignore` (already done)

---

## 4. Code Implementation

### Step 4.1: Create Stytch Auth Middleware

Create `src/middleware/stytch-auth.ts`:

```typescript
import { StytchB2BClient } from 'stytch';
import { Request, Response, NextFunction } from 'express';

// Initialize Stytch client
const stytchClient = new StytchB2BClient({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET!,
});

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
    session_id: string;
    organization_id?: string;
  };
  serviceToken?: string;
}

/**
 * Stytch OAuth 2.1 authentication middleware
 * Validates access tokens and extracts user identity
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Skip authentication for health check and OAuth metadata endpoints
    if (req.path === '/health' || req.path.startsWith('/.well-known/')) {
      return next();
    }

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
        timestamp: new Date().toISOString(),
      });
    }

    const accessToken = authHeader.substring(7); // Remove "Bearer "

    // Validate access token with Stytch
    const response = await stytchClient.sessions.authenticate({
      session_token: accessToken,
    });

    // Extract user info from Stytch response
    req.user = {
      user_id: response.member.member_id,
      email: response.member.email_address,
      session_id: response.session.session_id,
      organization_id: response.organization.organization_id,
    };

    // Set Coda service token (from environment variable)
    req.serviceToken = process.env.CODA_API_TOKEN;

    // Log successful authentication (debug mode only)
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`[AUTH] Stytch auth successful: ${req.user.email} (session: ${req.user.session_id})`);
    }

    next();
  } catch (error: any) {
    // Log authentication failure
    console.error('[AUTH] Stytch validation failed:', error.error_type || error.message);

    // Return 401 Unauthorized
    res.status(401).json({
      error: 'unauthorized',
      message: error.error_message || 'Invalid or expired access token',
      timestamp: new Date().toISOString(),
    });
  }
}

export { stytchClient };
```

---

### Step 4.2: Create OAuth Metadata Endpoints

Create `src/routes/oauth-metadata.ts`:

```typescript
import { Router } from 'express';

const router = Router();

/**
 * Authorization Server Metadata (RFC 8414)
 * Required by MCP Spec 2025-06-18
 */
router.get('/.well-known/oauth-authorization-server', (req, res) => {
  res.json({
    issuer: 'https://api.stytch.com',
    authorization_endpoint: 'https://api.stytch.com/v1/public/oauth/authorize',
    token_endpoint: 'https://api.stytch.com/v1/public/oauth/token',
    jwks_uri: 'https://api.stytch.com/v1/public/keys',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    scopes_supported: ['openid', 'email', 'profile'],
  });
});

/**
 * Protected Resource Metadata (RFC 9728)
 * Required by MCP Spec 2025-06-18 (added June 2025)
 */
router.get('/.well-known/oauth-protected-resource', (req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://coda.bestviable.com';

  res.json({
    resource: baseUrl,
    authorization_servers: ['https://api.stytch.com'],
    scopes_supported: ['mcp.read', 'mcp.write', 'mcp.tools'],
    bearer_methods_supported: ['header'],
    resource_signing_alg_values_supported: ['RS256'],
  });
});

/**
 * JWKS Endpoint (JSON Web Key Set)
 * Proxies to Stytch's public keys for token validation
 */
router.get('/.well-known/jwks.json', async (req, res) => {
  try {
    // Proxy to Stytch JWKS endpoint
    const response = await fetch('https://api.stytch.com/v1/public/keys');
    const keys = await response.json();
    res.json(keys);
  } catch (error) {
    console.error('[OAUTH] Failed to fetch JWKS:', error);
    res.status(500).json({
      error: 'internal_server_error',
      message: 'Failed to fetch JWKS from authorization server',
    });
  }
});

export default router;
```

---

### Step 4.3: Update config.ts

Update `src/config.ts` to include Stytch configuration:

```typescript
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  // Server configuration
  port: number;
  host: string;
  baseUrl: string;

  // Coda API configuration
  codaApiToken: string;
  codaApiBaseUrl: string;

  // Stytch OAuth configuration
  stytch: {
    projectId: string;
    secret: string;
  };

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

function getOptionalEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
}

export const config: Config = {
  // Server configuration
  port: parseInt(getOptionalEnvVar('PORT', '8080'), 10),
  host: getOptionalEnvVar('HOST', '0.0.0.0'),
  baseUrl: getOptionalEnvVar('BASE_URL', 'https://coda.bestviable.com'),

  // Coda API configuration
  codaApiToken: getRequiredEnvVar('CODA_API_TOKEN'),
  codaApiBaseUrl: getOptionalEnvVar('CODA_API_BASE_URL', 'https://coda.io/apis/v1'),

  // Stytch OAuth configuration
  stytch: {
    projectId: getRequiredEnvVar('STYTCH_PROJECT_ID'),
    secret: getRequiredEnvVar('STYTCH_SECRET'),
  },

  // Logging
  logLevel: (getOptionalEnvVar('LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error'),
};

// Validate configuration
export function validateConfig(): void {
  console.log('✅ Configuration validated successfully');
  console.log(`   Auth provider: Stytch OAuth 2.1`);
  console.log(`   Stytch Project ID: ${config.stytch.projectId}`);
  console.log(`   Coda API: ${config.codaApiBaseUrl}`);
  console.log(`   Base URL: ${config.baseUrl}`);
  console.log(`   Port: ${config.port}`);
}

export default config;
```

---

### Step 4.4: Update http-server.ts

Update `src/http-server.ts` to use Stytch middleware and OAuth endpoints:

```typescript
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authenticate, AuthenticatedRequest } from './middleware/stytch-auth';
import oauthMetadataRouter from './routes/oauth-metadata';
import { config, validateConfig } from './config';

// Validate configuration on startup
validateConfig();

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow all origins (Stytch + Cloudflare will handle auth)
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// OAuth metadata endpoints (no auth required)
app.use(oauthMetadataRouter);

// Authentication middleware (applies to all routes except OAuth metadata & health)
app.use(authenticate);

// Health check endpoint
app.get('/health', (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'coda-mcp',
    version: '2.0.0',
    auth: {
      provider: 'stytch',
      oauth_compliant: true,
      oauth_version: '2.1',
    },
    timestamp: new Date().toISOString()
  });
});

// MCP endpoint - existing implementation
app.post('/mcp', async (req: AuthenticatedRequest, res: Response) => {
  // ... existing MCP handler code ...
  // (Keep all existing JSON-RPC 2.0 logic from Phase 1.5)
});

// Start server
export function startServer(): void {
  app.listen(config.port, config.host, () => {
    console.log(`🚀 Coda MCP Server started`);
    console.log(`   URL: http://${config.host}:${config.port}`);
    console.log(`   Auth: Stytch OAuth 2.1 (PKCE required)`);
    console.log(`   MCP endpoint: POST /mcp`);
    console.log(`   Health check: GET /health`);
    console.log(`   OAuth metadata: GET /.well-known/oauth-authorization-server`);
  });
}
```

---

### Step 4.5: Update docker-compose.yml

Update `docker-compose.yml` with Stytch env vars and Traefik labels:

```yaml
version: '3.8'

services:
  coda-mcp:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: coda-mcp
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      # Stytch OAuth Configuration
      - STYTCH_PROJECT_ID=${STYTCH_PROJECT_ID}
      - STYTCH_SECRET=${STYTCH_SECRET}

      # Coda API Configuration
      - CODA_API_TOKEN=${CODA_API_TOKEN}
      - CODA_API_BASE_URL=https://coda.io/apis/v1

      # Server Configuration
      - PORT=8080
      - HOST=0.0.0.0
      - BASE_URL=https://coda.bestviable.com
      - LOG_LEVEL=info

    networks:
      - docker_proxy       # Traefik auto-discovery
      - docker_syncbricks  # Internal communication

    labels:
      # Traefik v3.0 auto-discovery
      - "traefik.enable=true"
      - "traefik.http.routers.coda-mcp.rule=Host(`coda.bestviable.com`)"
      - "traefik.http.routers.coda-mcp.entrypoints=web"
      - "traefik.http.services.coda-mcp.loadbalancer.server.port=8080"

    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  docker_proxy:
    external: true
  docker_syncbricks:
    external: true
```

---

## 5. Deployment to Droplet

### Step 5.1: Build and Test Locally

```bash
# Build TypeScript
npm run build

# Start locally (test mode)
npm run dev

# In another terminal, test health endpoint
curl http://localhost:8080/health

# Expected response:
# {
#   "status": "ok",
#   "auth": { "provider": "stytch", "oauth_compliant": true }
# }
```

---

### Step 5.2: Test OAuth Metadata Endpoints

```bash
# Test authorization server metadata
curl http://localhost:8080/.well-known/oauth-authorization-server

# Expected: Stytch OAuth endpoints

# Test protected resource metadata
curl http://localhost:8080/.well-known/oauth-protected-resource

# Expected: Resource information with Stytch as authorization server
```

---

### Step 5.3: Deploy to Droplet

```bash
# SSH into droplet
ssh droplet

# Navigate to Coda MCP directory
cd /home/david/services/mcp-servers/coda

# Pull latest code (or use scp to copy)
# If using git:
git pull origin main

# Update .env file with Stytch credentials
nano .env
# Add:
# STYTCH_PROJECT_ID=project-test-...
# STYTCH_SECRET=secret-test-...

# Rebuild Docker image (with --no-cache to ensure fresh build)
docker-compose down
docker-compose build --no-cache

# Start service
docker-compose up -d

# Check logs
docker logs coda-mcp -f

# Expected log:
# 🚀 Coda MCP Server started
# Auth: Stytch OAuth 2.1 (PKCE required)
```

---

### Step 5.4: Verify Deployment

```bash
# Test health check
curl https://coda.bestviable.com/health

# Test OAuth metadata (should be publicly accessible)
curl https://coda.bestviable.com/.well-known/oauth-authorization-server
```

**Expected**: All endpoints respond with 200 OK

---

## 6. Testing with ChatGPT/Claude.ai

### Step 6.1: Configure MCP Client in ChatGPT

1. Open ChatGPT web (https://chatgpt.com)
2. Go to **Settings** → **Extensions** → **Model Context Protocol**
3. Click **"Add MCP Server"**
4. **MCP Server Configuration**:
   ```
   Name: Coda
   URL: https://coda.bestviable.com/mcp
   OAuth Authorization URL: https://api.stytch.com/v1/public/oauth/authorize
   OAuth Token URL: https://api.stytch.com/v1/public/oauth/token
   Client ID: <get from Stytch Dashboard>
   Client Secret: <optional, use PKCE instead>
   Scopes: openid email profile mcp.read mcp.write
   ```
5. Click **"Connect"**

---

### Step 6.2: Complete OAuth Flow

1. ChatGPT redirects to Stytch login page
2. Enter your email address
3. Check email for magic link
4. Click magic link → Redirected back to ChatGPT
5. ChatGPT exchanges authorization code for access token
6. **Success!** ChatGPT is now connected to Coda MCP

---

### Step 6.3: Test MCP Tools

In ChatGPT, try:

```
Use the Coda MCP to list my documents
```

**Expected**: ChatGPT calls `tools/list` → `tools/call(list_docs)` → Returns your Coda documents

---

### Step 6.4: Repeat for Claude.ai

1. Open Claude.ai (https://claude.ai)
2. Go to **Settings** → **Integrations** → **MCP Servers**
3. Add Coda MCP with same OAuth configuration
4. Complete OAuth flow
5. Test with: `Show me my Coda documents`

---

## 7. Troubleshooting

### Issue: "unauthorized" error during OAuth flow

**Cause**: Invalid or expired Stytch credentials

**Solution**:
1. Verify `STYTCH_PROJECT_ID` and `STYTCH_SECRET` in `.env`
2. Check Stytch Dashboard → API Keys (ensure using correct environment)
3. Restart Docker container: `docker-compose restart`

---

### Issue: ChatGPT can't find OAuth endpoints

**Cause**: OAuth metadata endpoints not accessible

**Solution**:
1. Test metadata endpoint: `curl https://coda.bestviable.com/.well-known/oauth-authorization-server`
2. Check Traefik routing: `docker logs traefik`
3. Verify Cloudflare Tunnel is forwarding requests

---

### Issue: "Invalid redirect URI" error

**Cause**: Redirect URI not whitelisted in Stytch

**Solution**:
1. Go to Stytch Dashboard → OAuth → Redirect URLs
2. Add ChatGPT/Claude.ai callback URLs:
   ```
   https://chatgpt.com/callback
   https://claude.ai/callback
   ```
3. Save and retry

---

### Issue: "PKCE required" error

**Cause**: Client not sending PKCE parameters

**Solution**:
1. Verify Stytch OAuth settings require PKCE
2. Ensure MCP client (ChatGPT/Claude.ai) is configured for PKCE
3. Check Stytch logs for detailed error

---

### Issue: Docker container crashes on startup

**Cause**: Missing environment variables

**Solution**:
```bash
# Check container logs
docker logs coda-mcp

# Verify .env file exists and has all required vars
cat .env

# Rebuild with --no-cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Success Criteria Checklist

- [ ] Stytch account created and project configured
- [ ] Stytch SDK installed and middleware implemented
- [ ] OAuth metadata endpoints responding (`.well-known/*`)
- [ ] Local testing successful (health check, metadata)
- [ ] Deployed to droplet and container healthy
- [ ] ChatGPT OAuth flow completes successfully
- [ ] ChatGPT can list Coda documents via MCP
- [ ] Claude.ai OAuth flow completes successfully
- [ ] Claude.ai can list Coda documents via MCP
- [ ] All existing MCP tools still function
- [ ] Logs show "Auth: Stytch OAuth 2.1"

---

## Next Steps

1. **Monitor Usage**: Check Stytch Dashboard → Analytics for MAU count
2. **Upgrade to Live**: When ready for production, switch from `secret-test-...` to `secret-live-...`
3. **Add More MCPs**: Apply this same pattern to GitHub MCP, Firecrawl MCP, etc.
4. **Scale Plan**: When approaching 10K MAUs, migrate to WorkOS (1M free MAUs)

---

## Additional Resources

- [Stytch Documentation](https://stytch.com/docs)
- [Stytch B2B OAuth Guide](https://stytch.com/docs/b2b/guides/oauth)
- [MCP Specification 2025-06-18](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [OAuth 2.1 Specification](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1)
- [PKCE RFC 7636](https://datatracker.ietf.org/doc/html/rfc7636)

---

**Setup Guide Version**: 1.0
**Last Updated**: 2025-11-14
**Author**: David Kellam
