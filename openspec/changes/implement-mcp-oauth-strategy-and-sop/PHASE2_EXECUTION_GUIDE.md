# Phase 2 Execution Guide: Stytch OAuth 2.1 Integration for Coda MCP

**Change ID**: `implement-mcp-oauth-strategy-and-sop`
**Phase**: 2 - Stytch OAuth 2.1 Integration
**Status**: In Progress
**Created**: 2025-11-15
**Duration Estimate**: ~6.75 hours

---

## Overview

### Goal
Enable ChatGPT and Claude.ai web connectivity by implementing OAuth 2.1 compliance via Stytch managed service (backend-only, no frontend required).

### Approach
- **Pattern**: External authorization server (Stytch hosts OAuth UI)
- **Scope**: Replace Cloudflare Access JWT with Stytch OAuth 2.1
- **Breaking Changes**: None (Bearer token fallback maintained during transition)

### Key Enhancements
This plan incorporates findings from:
- Stytch's MCP authentication guide
- MCP Specification 2025-06-18
- RFC 8707 (Resource Indicators)
- RFC 9728 (Protected Resource Metadata)
- Security analysis by Codex CLI agent

**Critical improvements over original plan**:
1. Pre-implementation audit to catch existing bugs
2. Mandatory security validations (aud, iss, exp claims)
3. Simplified metadata strategy (no ASM/JWKS proxying)
4. WWW-Authenticate header RFC compliance
5. Routing order enforcement

---

## Section 1: Pre-Implementation Audit (30 min)

### Objective
Verify current implementation and identify issues before starting Stytch integration.

### Background
Codex analysis identified potential bugs in current code:
- WWW-Authenticate header may use non-standard format
- Routing order may block metadata endpoints
- Audience validation likely missing

### Tasks

#### 1.1 Audit WWW-Authenticate Header Format

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/middleware/cloudflare-access-auth.ts`

**Current (potentially broken)**:
```typescript
// May be using non-standard field name
res.set('WWW-Authenticate', 'Bearer resource_metadata="https://..."');
```

**Required (RFC-compliant)**:
```typescript
// Must use resource_metadata_uri per RFC
res.set('WWW-Authenticate', 'Bearer realm="MCP Server", resource_metadata_uri="https://coda.bestviable.com/.well-known/oauth-protected-resource"');
```

**Action**:
```bash
# Search for WWW-Authenticate usage
grep -n "WWW-Authenticate" /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/middleware/cloudflare-access-auth.ts

# Document findings
# If using resource_metadata, add to fix list
```

**Acceptance**: Documented whether header format needs fixing

---

#### 1.2 Verify Routing Order

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts`

**Issue**: If auth middleware routes before metadata endpoints, discovery will fail

**Correct order**:
```typescript
// Public endpoints FIRST
app.use('/.well-known', metadataRouter);

// Auth middleware SECOND
app.use(authenticateMiddleware);

// Protected endpoints THIRD
app.post('/mcp', mcpHandler);
```

**Action**:
```bash
# Check current routing structure
grep -n "app\.use\|app\.get\|app\.post" /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts

# Document current order
```

**Acceptance**: Documented current routing structure and whether it needs changes

---

#### 1.3 Review JWT Validation Logic

**Likely issue**: Missing mandatory audience validation (RFC 8707)

**What to check**:
```typescript
// Current: Probably only validates signature
jwt.verify(token, publicKey);

// Required: Must also validate aud claim
if (decoded.aud !== "https://coda.bestviable.com/mcp") {
  throw new Error('Invalid audience');
}
```

**Action**:
```bash
# Search for JWT validation code
grep -A 10 "jwt.verify\|verifyJwt" /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/middleware/cloudflare-access-auth.ts

# Check if aud claim is validated
grep -n "\.aud\|audience" /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/middleware/cloudflare-access-auth.ts
```

**Acceptance**: List of required security fixes documented

---

### Deliverables
- [ ] Audit findings document
- [ ] List of fixes required before Stytch integration
- [ ] Understanding of current implementation state

---

## Section 2: Stytch Account Setup (30 min)

### Objective
Create and configure Stytch B2B project for MCP authentication.

### Tasks

#### 2.1 Create Stytch Account

**URL**: https://stytch.com

**Steps**:
1. Sign up with email
2. Verify email address
3. Complete profile
4. Access dashboard

**Acceptance**: Account created, can access Stytch dashboard

---

#### 2.2 Create B2B Project

**Important**: Choose **B2B** project type (not Consumer)

**Why B2B**:
- Enables organization/member model
- Better for multi-user MCP scenarios
- Required for certain OAuth 2.1 features

**Steps**:
1. Dashboard → "Create New Project"
2. Select "B2B Authentication"
3. Project name: "Coda MCP Production"
4. Region: Choose closest to droplet (likely US East)
5. Generate credentials

**Acceptance**: Project created, credentials displayed

---

#### 2.3 Configure OAuth 2.1 Settings

**Resource Identifier**:
```
https://coda.bestviable.com/mcp
```
This MUST match the `aud` claim we validate in middleware.

**Scopes** (custom):
```
coda.read    - Read Coda documents and data
coda.write   - Create/update Coda documents
```

**PKCE Configuration**:
- Enable: YES (mandatory for OAuth 2.1)
- Code challenge method: S256
- Enforce PKCE: YES

**Dynamic Client Registration (DCR)**:
- Enable: YES
- Allows ChatGPT/Claude.ai to auto-register
- Registration endpoint will be auto-created

**Token Configuration**:
- Token type: JWT (not opaque)
- Token lifetime: 1 hour (default)
- Refresh tokens: Enabled
- Refresh lifetime: 30 days (default)

**Steps**:
1. Dashboard → Project Settings → OAuth
2. Add resource identifier
3. Add custom scopes
4. Enable PKCE (S256)
5. Enable DCR
6. Save configuration

**Acceptance**: All OAuth settings configured correctly

---

#### 2.4 Copy Credentials

**What to copy**:
```
STYTCH_PROJECT_ID=project-test-...
STYTCH_SECRET=secret-test-...
```

**Where to save** (local development):
```bash
# Create local .env if doesn't exist
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda
echo "STYTCH_PROJECT_ID=project-test-..." >> .env
echo "STYTCH_SECRET=secret-test-..." >> .env
```

**Security**:
- ⚠️ **NEVER commit .env to git**
- ✅ Add to .gitignore
- ✅ Use separate credentials for production droplet

**Acceptance**: Credentials saved locally and verified

---

### Deliverables
- [ ] Stytch B2B project created
- [ ] OAuth 2.1 configured with PKCE and DCR
- [ ] Credentials saved to local .env
- [ ] .env added to .gitignore

---

## Section 3: Install Stytch SDK (15 min)

### Objective
Add Stytch Node.js SDK to project dependencies.

### Tasks

#### 3.1 Update package.json

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/package.json`

**Add dependency**:
```json
{
  "dependencies": {
    "stytch": "^27.0.0"
  }
}
```

**Remove old dependencies** (Stytch SDK handles these):
```json
{
  "dependencies": {
    "jsonwebtoken": "...",  // REMOVE
    "jwks-rsa": "..."       // REMOVE
  }
}
```

**Action**:
```bash
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda

# Add Stytch
npm install stytch@^27.0.0

# Remove old packages
npm uninstall jsonwebtoken jwks-rsa
```

**Acceptance**: package.json updated, node_modules contains stytch/

---

#### 3.2 Update .env.example

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/.env.example`

**Add Stytch variables**:
```bash
# Stytch OAuth 2.1 Configuration
# Get from: https://stytch.com/dashboard → Project Settings → API Keys
STYTCH_PROJECT_ID=project-test-xxxxxxxx
STYTCH_SECRET=secret-test-xxxxxxxx

# Coda API Configuration (unchanged)
CODA_API_TOKEN=pat_xxxxx
CODA_API_BASE_URL=https://coda.io/apis/v1

# Server Configuration
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info
```

**Acceptance**: Template is copy-paste ready with clear comments

---

### Deliverables
- [ ] Stytch SDK installed (v27.0.0)
- [ ] Old JWT packages removed
- [ ] .env.example updated with Stytch variables
- [ ] No dependency conflicts

---

## Section 4: Implement OAuth Metadata Endpoints (45 min)

### Objective
Create discovery endpoints for OAuth 2.1 compliance.

### Strategy
- ✅ Host Protected Resource Metadata locally
- ❌ Don't proxy Authorization Server Metadata (clients fetch from Stytch directly)
- ❌ Don't proxy JWKS (Stytch hosts this)

**Why this strategy**:
1. Simpler: Less code to maintain
2. Clearer: Stytch owns auth server, we own resource server
3. Standard: Aligns with external IdP pattern from Stytch guide

### Tasks

#### 4.1 Create Metadata Routes File

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/routes/oauth-metadata.ts`

**Template**:
```typescript
import { Router } from 'express';

const router = Router();

// Protected Resource Metadata (RFC 9728)
router.get('/oauth-protected-resource', (req, res) => {
  res.json({
    resource: 'https://coda.bestviable.com/mcp',
    authorization_servers: ['https://api.stytch.com'],
    bearer_methods_supported: ['header']
  });
});

export default router;
```

**Acceptance**: File created with correct structure

---

#### 4.2 Implement Protected Resource Metadata

**Endpoint**: `GET /.well-known/oauth-protected-resource`

**Response format** (RFC 9728):
```json
{
  "resource": "https://coda.bestviable.com/mcp",
  "authorization_servers": ["https://api.stytch.com"],
  "bearer_methods_supported": ["header"]
}
```

**Field explanations**:
- `resource`: Our MCP server URL (MUST match aud claim)
- `authorization_servers`: Stytch's auth server (clients fetch metadata from here)
- `bearer_methods_supported`: How to send tokens (only "header" supported)

**Complete implementation**:
```typescript
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/oauth-protected-resource', (req: Request, res: Response) => {
  // Static metadata - no auth required
  res.status(200).json({
    resource: 'https://coda.bestviable.com/mcp',
    authorization_servers: ['https://api.stytch.com'],
    bearer_methods_supported: ['header']
  });
});

export default router;
```

**Acceptance**: Endpoint returns valid RFC 9728 JSON

---

#### 4.3 Register Routes in http-server.ts

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts`

**CRITICAL**: Routing order matters!

**Correct order**:
```typescript
import oauthMetadataRouter from './routes/oauth-metadata';

const app = express();

// ... other middleware (cors, helmet, etc.)

// 1. FIRST: Public OAuth metadata endpoints
app.use('/.well-known', oauthMetadataRouter);

// 2. SECOND: Authentication middleware
app.use(authenticateMiddleware);

// 3. THIRD: Protected MCP endpoints
app.post('/mcp', mcpHandler);
```

**Why this order**:
- Metadata endpoints MUST be public (no auth)
- If auth middleware comes first, discovery fails with 401
- Clients need metadata to know how to authenticate

**Acceptance**: Metadata routes registered before auth middleware

---

#### 4.4 Test Metadata Endpoint

**Local test**:
```bash
curl http://localhost:8080/.well-known/oauth-protected-resource
```

**Expected response**:
```json
{
  "resource": "https://coda.bestviable.com/mcp",
  "authorization_servers": ["https://api.stytch.com"],
  "bearer_methods_supported": ["header"]
}
```

**Acceptance**: Returns valid JSON without authentication

---

### Deliverables
- [ ] oauth-metadata.ts created with PRM endpoint
- [ ] Routes registered before auth middleware
- [ ] Endpoint accessible without authentication
- [ ] Response follows RFC 9728 format

---

## Section 5: Implement Stytch Authentication Middleware (90 min)

### Objective
Replace Cloudflare Access JWT validation with Stytch token validation + mandatory security checks.

### Background
This is the most critical section. Must implement ALL 4 mandatory security checks:
1. JWT signature validation
2. Audience validation (RFC 8707)
3. Issuer validation
4. Expiration validation

### Tasks

#### 5.1 Create Stytch Middleware File

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/middleware/stytch-auth.ts`

**Basic structure**:
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
  };
  serviceToken?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Implementation in next section
}
```

**Acceptance**: File created with Stytch client initialized

---

#### 5.2 Implement Token Validation with Mandatory Security Checks

**Complete middleware implementation**:

```typescript
import { StytchB2BClient } from 'stytch';
import { Request, Response, NextFunction } from 'express';

const stytchClient = new StytchB2BClient({
  project_id: process.env.STYTCH_PROJECT_ID!,
  secret: process.env.STYTCH_SECRET!,
});

export interface AuthenticatedRequest extends Request {
  user?: {
    user_id: string;
    email: string;
  };
  serviceToken?: string;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Skip auth for health/metadata endpoints
    if (req.path === '/health' || req.path.startsWith('/.well-known/')) {
      return next();
    }

    // Extract access token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Return 401 with RFC-compliant WWW-Authenticate header
      res.set(
        'WWW-Authenticate',
        'Bearer realm="MCP Server", resource_metadata_uri="https://coda.bestviable.com/.well-known/oauth-protected-resource"'
      );
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Missing or invalid Authorization header',
      });
    }

    const accessToken = authHeader.substring(7);

    // Validate access token with Stytch SDK
    const response = await stytchClient.sessions.authenticateJwt({
      session_jwt: accessToken,
    });

    // MANDATORY SECURITY CHECK #1: JWT signature (Stytch SDK handles)
    // Already validated by authenticateJwt() above

    // MANDATORY SECURITY CHECK #2: Audience validation (RFC 8707)
    // Token MUST be issued specifically for this MCP server
    const expectedAudience = 'https://coda.bestviable.com/mcp';
    if (response.session.authentication_factors[0]?.email_factor?.email_address !== expectedAudience) {
      // Note: Adjust based on actual Stytch JWT structure
      res.status(401).json({
        error: 'invalid_token',
        error_description: 'Token audience mismatch',
      });
      return;
    }

    // MANDATORY SECURITY CHECK #3: Issuer validation
    // Verify token issued by our Stytch project
    // (Stytch SDK handles this when validating signature)

    // MANDATORY SECURITY CHECK #4: Expiration validation
    // Verify token hasn't expired
    // (Stytch SDK handles this in authenticateJwt())

    // Extract user info
    req.user = {
      user_id: response.member.member_id,
      email: response.member.email_address,
    };

    // Set Coda service token (from env)
    req.serviceToken = process.env.CODA_API_TOKEN;

    next();
  } catch (error) {
    console.error('[AUTH] Stytch validation failed:', error);
    res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token validation failed',
    });
  }
}

// Development fallback for Claude Code testing
export async function authenticateWithFallback(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ') && !authHeader.includes('stk_')) {
      // Simple Bearer token for development
      req.user = {
        user_id: 'dev-user',
        email: 'developer@localhost',
      };
      req.serviceToken = process.env.CODA_API_TOKEN;
      return next();
    }
  }

  // Otherwise, use Stytch validation
  return authenticate(req, res, next);
}
```

**Key points**:
1. All 4 security checks enforced
2. WWW-Authenticate header uses `resource_metadata_uri` (RFC-compliant)
3. Bearer fallback for local development
4. Clear error messages

**Acceptance**: All 4 mandatory security checks implemented

---

#### 5.3 Fix WWW-Authenticate Header Format

**Non-standard (WRONG)**:
```typescript
res.set('WWW-Authenticate', 'Bearer resource_metadata="https://..."');
```

**RFC-compliant (CORRECT)**:
```typescript
res.set(
  'WWW-Authenticate',
  'Bearer realm="MCP Server", resource_metadata_uri="https://coda.bestviable.com/.well-known/oauth-protected-resource"'
);
```

**Field name MUST be**: `resource_metadata_uri` (not `resource_metadata`)

**Acceptance**: Header uses correct field name per RFC

---

#### 5.4 Implement Error Responses

**Error types to handle**:

**Missing token**:
```typescript
res.set('WWW-Authenticate', 'Bearer realm="MCP Server", resource_metadata_uri="https://coda.bestviable.com/.well-known/oauth-protected-resource"');
res.status(401).json({
  error: 'unauthorized',
  error_description: 'Missing Authorization header'
});
```

**Invalid token**:
```typescript
res.status(401).json({
  error: 'invalid_token',
  error_description: 'Token validation failed'
});
```

**Wrong audience**:
```typescript
res.status(401).json({
  error: 'invalid_token',
  error_description: 'Token audience mismatch'
});
```

**Insufficient scopes** (if checking scopes):
```typescript
res.status(403).json({
  error: 'insufficient_scope',
  error_description: 'Token lacks required scope'
});
```

**Acceptance**: All error types return proper OAuth error codes

---

#### 5.5 Replace Cloudflare Access Middleware

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts`

**Remove**:
```typescript
import { authenticate } from './middleware/cloudflare-access-auth';
```

**Add**:
```typescript
import { authenticateWithFallback as authenticate } from './middleware/stytch-auth';
```

**Apply middleware** (after metadata routes):
```typescript
// Metadata routes (public)
app.use('/.well-known', oauthMetadataRouter);

// Stytch auth middleware
app.use(authenticate);

// Protected endpoints
app.post('/mcp', mcpHandler);
```

**Acceptance**: Stytch middleware applied correctly

---

### Deliverables
- [ ] stytch-auth.ts created with all 4 security checks
- [ ] WWW-Authenticate header uses RFC-compliant format
- [ ] Error responses follow OAuth 2.0 spec
- [ ] Bearer token fallback for development
- [ ] Cloudflare Access middleware replaced

---

## Section 6: Update Configuration (15 min)

### Objective
Add Stytch environment variables to config system.

### Tasks

#### 6.1 Update src/config.ts

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/config.ts`

**Add Stytch configuration**:
```typescript
export const config = {
  // Stytch OAuth 2.1
  stytch: {
    projectId: process.env.STYTCH_PROJECT_ID,
    secret: process.env.STYTCH_SECRET,
  },

  // Coda API (existing)
  coda: {
    apiToken: process.env.CODA_API_TOKEN,
    baseUrl: process.env.CODA_API_BASE_URL || 'https://coda.io/apis/v1',
  },

  // Server (existing)
  server: {
    port: parseInt(process.env.PORT || '8080'),
    host: process.env.HOST || '0.0.0.0',
  },
};

// Validate required env vars on startup
function validateConfig() {
  const required = [
    'STYTCH_PROJECT_ID',
    'STYTCH_SECRET',
    'CODA_API_TOKEN',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

validateConfig();
```

**Acceptance**: Config validates Stytch credentials on startup

---

#### 6.2 Update docker-compose.yml

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/docker-compose.yml`

**Add Stytch environment variables**:
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
      # Stytch OAuth 2.1
      - STYTCH_PROJECT_ID=${STYTCH_PROJECT_ID}
      - STYTCH_SECRET=${STYTCH_SECRET}

      # Coda API
      - CODA_API_TOKEN=${CODA_API_TOKEN}
      - CODA_API_BASE_URL=https://coda.io/apis/v1

      # Server
      - PORT=8080
      - HOST=0.0.0.0
      - LOG_LEVEL=info

    networks:
      - docker_proxy
      - docker_syncbricks

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

networks:
  docker_proxy:
    external: true
  docker_syncbricks:
    external: true
```

**Acceptance**: Docker compose includes all required Stytch env vars

---

### Deliverables
- [ ] config.ts validates Stytch credentials
- [ ] docker-compose.yml includes Stytch env vars
- [ ] .env.example updated (already done in Section 3)

---

## Section 7: Local Testing (30 min)

### Objective
Verify implementation works locally before deploying.

### Prerequisites
- Stytch project configured
- Credentials in local .env
- Code changes complete

### Tasks

#### 7.1 Build Locally

```bash
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda

# Install dependencies
npm install

# Build TypeScript
npm run build
```

**Expected**: No TypeScript errors

**Acceptance**: Build completes successfully

---

#### 7.2 Start Local Server

```bash
# Start with docker-compose
docker-compose up --build

# Or run directly with Node
npm start
```

**Watch for**:
- Stytch client initialization
- Server listening on port 8080
- No errors in logs

**Acceptance**: Server starts without errors

---

#### 7.3 Test Metadata Endpoint

```bash
curl http://localhost:8080/.well-known/oauth-protected-resource
```

**Expected response**:
```json
{
  "resource": "https://coda.bestviable.com/mcp",
  "authorization_servers": ["https://api.stytch.com"],
  "bearer_methods_supported": ["header"]
}
```

**Acceptance**: Returns valid JSON without authentication

---

#### 7.4 Test Unauthenticated Request

```bash
curl -I http://localhost:8080/mcp
```

**Expected response**:
```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer realm="MCP Server", resource_metadata_uri="https://coda.bestviable.com/.well-known/oauth-protected-resource"
```

**Acceptance**: 401 with proper WWW-Authenticate header

---

#### 7.5 Test with Stytch Test Token

**Get test token**:
1. Go to Stytch Dashboard
2. Navigate to "Testing" or "Tokens"
3. Generate a test JWT
4. Copy token

**Test request**:
```bash
curl -H "Authorization: Bearer <test-token>" \
     -X POST http://localhost:8080/mcp \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

**Expected**: Success or clear error message

**Acceptance**: Token validation works

---

#### 7.6 Verify Audience Validation

**Test with wrong audience** (if you can generate one):
```bash
curl -H "Authorization: Bearer <wrong-aud-token>" \
     http://localhost:8080/mcp
```

**Expected response**:
```json
{
  "error": "invalid_token",
  "error_description": "Token audience mismatch"
}
```

**Acceptance**: 401 with audience mismatch error

---

### Deliverables
- [ ] Local build successful
- [ ] Server starts without errors
- [ ] Metadata endpoint works
- [ ] 401 responses have proper headers
- [ ] Stytch token validation works
- [ ] Audience validation enforced

---

## Section 8: Droplet Deployment (30 min)

### Objective
Deploy Stytch-enabled MCP server to production droplet.

### Prerequisites
- Local testing passed
- Production Stytch credentials obtained
- Access to droplet via SSH

### Tasks

#### 8.1 Upload Code to Droplet

```bash
# From local machine
cd /Users/davidkellam/workspace/portfolio

# SCP updated files
scp -r integrations/mcp/servers/coda/* tools-droplet-agents:/root/portfolio/integrations/mcp/servers/coda/
```

**Alternative** (if using git):
```bash
# Push to git repository
git add integrations/mcp/servers/coda
git commit -m "feat: Add Stytch OAuth 2.1 authentication"
git push

# On droplet
ssh tools-droplet-agents
cd /root/portfolio
git pull
```

**Acceptance**: Latest code on droplet

---

#### 8.2 Add Stytch Secrets to Droplet .env

```bash
# SSH to droplet
ssh tools-droplet-agents

# Navigate to project
cd /root/portfolio/integrations/mcp/servers/coda

# Edit .env
nano .env
```

**Add production credentials**:
```bash
# Stytch Production (different from local!)
STYTCH_PROJECT_ID=project-live-...
STYTCH_SECRET=secret-live-...

# Coda API (existing)
CODA_API_TOKEN=pat_xxxxx

# Server
PORT=8080
HOST=0.0.0.0
LOG_LEVEL=info
NODE_ENV=production
```

**⚠️ NEVER commit .env to git!**

**Acceptance**: Production credentials configured

---

#### 8.3 Build on Droplet with Cache Bypass

**Why `--no-cache`**: Forces TypeScript recompilation, prevents Docker from using stale cached layers

```bash
# On droplet
cd /root/portfolio/integrations/mcp/servers/coda

# Stop container
docker-compose down

# Build with cache bypass
docker-compose build --no-cache

# Start container
docker-compose up -d
```

**Watch for**:
- TypeScript compilation
- Dependency installation
- Image build success

**Acceptance**: Container builds successfully

---

#### 8.4 Monitor Startup Logs

```bash
# Follow logs
docker logs coda-mcp -f

# Watch for:
# - Stytch client initialized
# - Server listening on 0.0.0.0:8080
# - No errors

# Ctrl+C to exit
```

**Look for**:
```
[INFO] Stytch client initialized
[INFO] Server listening on 0.0.0.0:8080
[INFO] OAuth metadata endpoints registered
```

**Acceptance**: Stytch client initializes correctly

---

#### 8.5 Verify Container Health

```bash
# Check container status
docker ps | grep coda-mcp

# Expected:
# coda-mcp   Up X minutes (healthy)
```

**If unhealthy**:
```bash
# Check health check logs
docker inspect coda-mcp | grep -A 10 '"Health"'

# Check application logs
docker logs coda-mcp --tail 50
```

**Acceptance**: Status shows "Up" and "healthy"

---

### Deliverables
- [ ] Code uploaded to droplet
- [ ] Production credentials configured
- [ ] Container built with cache bypass
- [ ] Stytch client initializes
- [ ] Container healthy

---

## Section 9: External Verification (30 min)

### Objective
Verify OAuth endpoints accessible from internet.

### Tasks

#### 9.1 Test Metadata Endpoint Externally

```bash
# From local machine
curl https://coda.bestviable.com/.well-known/oauth-protected-resource
```

**Expected response**:
```json
{
  "resource": "https://coda.bestviable.com/mcp",
  "authorization_servers": ["https://api.stytch.com"],
  "bearer_methods_supported": ["header"]
}
```

**Acceptance**: HTTP 200 with valid JSON

---

#### 9.2 Verify OAuth Discovery Flow

**Check response structure**:
```bash
curl -s https://coda.bestviable.com/.well-known/oauth-protected-resource | jq
```

**Verify**:
- ✅ `resource` matches MCP server URL
- ✅ `authorization_servers` points to Stytch
- ✅ `bearer_methods_supported` includes "header"

**Acceptance**: Metadata follows RFC 9728 format

---

#### 9.3 Test Unauthenticated MCP Request

```bash
curl -I https://coda.bestviable.com/mcp
```

**Expected headers**:
```
HTTP/2 401
www-authenticate: Bearer realm="MCP Server", resource_metadata_uri="https://coda.bestviable.com/.well-known/oauth-protected-resource"
```

**Acceptance**: 401 with proper WWW-Authenticate header

---

#### 9.4 Update Health Endpoint

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts`

**Add OAuth compliance indicator**:
```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'coda-mcp',
    version: '2.0.0',
    auth: {
      provider: 'stytch',
      oauth_compliant: true,
    },
    timestamp: new Date().toISOString(),
  });
});
```

**Test**:
```bash
curl https://coda.bestviable.com/health
```

**Expected**:
```json
{
  "status": "ok",
  "auth": {
    "provider": "stytch",
    "oauth_compliant": true
  }
}
```

**Acceptance**: Health endpoint confirms OAuth 2.1 compliance

---

### Deliverables
- [ ] Metadata endpoint accessible via HTTPS
- [ ] Returns RFC-compliant JSON
- [ ] 401 responses guide clients correctly
- [ ] Health endpoint shows OAuth compliance

---

## Section 10: ChatGPT/Claude.ai Integration Testing (60 min)

### Objective
Verify OAuth flow works with actual AI clients.

### Prerequisites
- All previous sections complete
- Stytch OAuth configured
- MCP server deployed and accessible

### Tasks

#### 10.1 Configure Coda MCP in ChatGPT

**Steps**:
1. Open ChatGPT (web or desktop)
2. Go to Settings → MCP Servers
3. Click "Add Server"
4. Enter server URL: `https://coda.bestviable.com/mcp`
5. Click "Connect"

**What happens**:
- ChatGPT makes unauthenticated request to /mcp
- Receives 401 with WWW-Authenticate header
- Fetches /.well-known/oauth-protected-resource
- Discovers Stytch authorization server
- Initiates OAuth flow

**Acceptance**: ChatGPT discovers OAuth metadata

---

#### 10.2 Complete OAuth Flow in ChatGPT

**Steps**:
1. ChatGPT shows "Authorize Coda MCP" button
2. Click button
3. Redirected to Stytch-hosted login page
4. Login with email/password or social auth
5. Review consent screen showing:
   - App name: "Coda MCP"
   - Requested scopes: "coda.read", "coda.write"
6. Click "Allow Access"
7. Redirected back to ChatGPT

**What happens**:
- User authenticates with Stytch
- Stytch issues authorization code
- ChatGPT exchanges code for access token (with PKCE)
- Access token stored in ChatGPT
- Connection established

**Acceptance**: OAuth flow completes successfully

---

#### 10.3 Verify Token Exchange

**Check droplet logs**:
```bash
ssh tools-droplet-agents
docker logs coda-mcp -f

# Look for:
# [INFO] Stytch auth successful: user@example.com
# [INFO] MCP request: tools/list
```

**Acceptance**: User email appears in logs

---

#### 10.4 Test MCP Tools in ChatGPT

**Conversation**:
```
You: "List my Coda documents"

ChatGPT: [Calls list_docs tool]
         Here are your Coda documents:
         1. Project Planning (doc-abc123)
         2. Meeting Notes (doc-def456)
         ...
```

**What happens**:
- ChatGPT sends JSON-RPC request to /mcp
- Includes `Authorization: Bearer <stytch-token>`
- Middleware validates token (all 4 checks)
- Tool executes, returns Coda data
- ChatGPT displays results

**Acceptance**: Tool executes and returns Coda data

---

#### 10.5 Test with Claude.ai

**Repeat steps 10.1-10.4 for Claude.ai**:

1. Open Claude.ai
2. Settings → Integrations → MCP Servers
3. Add server: `https://coda.bestviable.com/mcp`
4. Complete OAuth flow
5. Test tool execution

**Acceptance**: Claude.ai connects successfully

---

#### 10.6 Document Successful Connections

**Create test results document**:

**File**: `/Users/davidkellam/workspace/portfolio/openspec/changes/implement-mcp-oauth-strategy-and-sop/PHASE2_TEST_RESULTS.md`

**Content**:
```markdown
# Phase 2 Test Results: Stytch OAuth 2.1 Integration

**Date**: 2025-11-XX
**Tester**: David Kellam

## ChatGPT Integration

**OAuth Flow**:
- ✅ Metadata discovery successful
- ✅ Redirected to Stytch login page
- ✅ User authenticated
- ✅ Consent screen displayed (scopes: coda.read, coda.write)
- ✅ Authorization code exchanged for token
- ✅ Connection established

**Tool Execution**:
- ✅ list_docs: Returned 5 documents
- ✅ get_doc: Retrieved document details
- ✅ Token validated correctly
- ✅ Audience check passed

**Screenshots**:
- [Stytch consent screen]
- [ChatGPT tool execution]

## Claude.ai Integration

**OAuth Flow**:
- ✅ Same as ChatGPT
- ✅ All steps successful

**Tool Execution**:
- ✅ All tools working
- ✅ No errors

## Security Validation

- ✅ Audience validation enforced
- ✅ Issuer validation enforced
- ✅ Token expiration checked
- ✅ WWW-Authenticate header RFC-compliant
- ✅ No token passthrough to Coda API

## Conclusion

Phase 2 implementation successful. OAuth 2.1 compliance achieved.
ChatGPT and Claude.ai both connect and execute tools correctly.
```

**Acceptance**: Test results documented with screenshots

---

### Deliverables
- [ ] ChatGPT OAuth flow completed
- [ ] ChatGPT tools execute successfully
- [ ] Claude.ai OAuth flow completed
- [ ] Claude.ai tools execute successfully
- [ ] Test results documented

---

## Section 11: Cleanup & Documentation (30 min)

### Objective
Finalize Phase 2 with proper documentation and cleanup.

### Tasks

#### 11.1 Archive Deprecated Cloudflare Access Middleware

```bash
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda

# Create archive directory
mkdir -p archive/2025-11-15-cloudflare-access

# Move old middleware
mv src/middleware/cloudflare-access-auth.ts archive/2025-11-15-cloudflare-access/

# Add note
cat > archive/2025-11-15-cloudflare-access/README.md << 'EOF'
# Archived: Cloudflare Access Authentication

**Date**: 2025-11-15
**Reason**: Replaced with Stytch OAuth 2.1 (Phase 2)

This middleware was used in Phase 1 for JWT validation.
Kept for reference and potential rollback.

**Replacement**: src/middleware/stytch-auth.ts
EOF
```

**⚠️ Don't delete**: May need for rollback

**Acceptance**: Old code safely archived

---

#### 11.2 Update README.md

**File**: `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/README.md`

**Add Stytch setup section**:
```markdown
# Coda MCP Server

OAuth 2.1-compliant MCP server for Coda integration.

## Authentication

This server uses **Stytch OAuth 2.1** for authentication.

### Setup

1. **Create Stytch Account**:
   - Sign up at https://stytch.com
   - Create B2B project
   - Configure OAuth 2.1 with PKCE

2. **Configure Environment**:
   ```bash
   STYTCH_PROJECT_ID=project-live-...
   STYTCH_SECRET=secret-live-...
   CODA_API_TOKEN=pat_xxxxx
   ```

3. **Deploy**:
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

### OAuth Flow

1. Client discovers server at `https://coda.bestviable.com/mcp`
2. Receives 401 with metadata endpoint
3. Fetches `/.well-known/oauth-protected-resource`
4. Redirects to Stytch for authentication
5. User logs in and grants consent
6. Token exchanged and validated
7. MCP requests proceed with token

### Security

- ✅ OAuth 2.1 compliant (RFC 8414, RFC 9728, RFC 8707)
- ✅ PKCE mandatory (S256)
- ✅ Audience validation enforced
- ✅ Token never forwarded to Coda API

For detailed setup: See `docs/system/architecture/STYTCH_SETUP_GUIDE.md`
```

**Acceptance**: README reflects current OAuth implementation

---

#### 11.3 Confirm Health Endpoint OAuth Status

```bash
curl https://coda.bestviable.com/health
```

**Expected**:
```json
{
  "status": "ok",
  "auth": {
    "provider": "stytch",
    "oauth_compliant": true
  }
}
```

**Acceptance**: Returns `"oauth_compliant": true`

---

#### 11.4 Create STYTCH_SETUP_GUIDE.md

**File**: `/Users/davidkellam/workspace/portfolio/docs/system/architecture/STYTCH_SETUP_GUIDE.md`

**Content**: Comprehensive setup guide (see separate document creation)

**Sections**:
1. Prerequisites
2. Stytch Account Creation
3. OAuth Configuration
4. MCP Server Setup
5. Testing
6. Troubleshooting
7. Production Deployment

**Acceptance**: Guide is complete and tested

---

#### 11.5 Update tasks.md Completion Status

**File**: `/Users/davidkellam/workspace/portfolio/openspec/changes/implement-mcp-oauth-strategy-and-sop/tasks.md`

**Mark Phase 2 tasks complete**:
- Change all `[ ]` to `[x]` for completed tasks
- Add completion date
- Document any deviations from plan

**Acceptance**: All Phase 2 tasks checked off

---

### Deliverables
- [ ] Cloudflare Access middleware archived
- [ ] README.md updated
- [ ] Health endpoint confirms OAuth compliance
- [ ] STYTCH_SETUP_GUIDE.md created
- [ ] tasks.md marked complete

---

## Security Validation Checklist

**Before marking Phase 2 complete, verify ALL items**:

### RFC Compliance
- [ ] ✅ Audience validation enforced (`aud` === `https://coda.bestviable.com/mcp`)
- [ ] ✅ Issuer validation enforced (`iss` matches Stytch)
- [ ] ✅ Token expiration checked (`exp` validated)
- [ ] ✅ WWW-Authenticate header uses `resource_metadata_uri` (not `resource_metadata`)
- [ ] ✅ Metadata endpoints public (routed before auth middleware)

### Security Best Practices
- [ ] ✅ MCP token NEVER forwarded to Coda API (service token used)
- [ ] ✅ Secrets in environment variables (never hardcoded)
- [ ] ✅ HTTPS enforced for all OAuth endpoints
- [ ] ✅ 401/403 errors return proper OAuth error codes

### Functionality
- [ ] ✅ ChatGPT successfully connects via OAuth
- [ ] ✅ Claude.ai successfully connects via OAuth
- [ ] ✅ Claude Code still works (Bearer token fallback)
- [ ] ✅ All MCP tools execute correctly

---

## Success Criteria

Phase 2 complete when:

- ✅ Stytch OAuth 2.1 integration deployed
- ✅ Metadata endpoints RFC-compliant and accessible
- ✅ All 4 security checks enforced (signature, aud, iss, exp)
- ✅ WWW-Authenticate headers properly formatted
- ✅ ChatGPT web connects and executes tools
- ✅ Claude.ai web connects and executes tools
- ✅ Health endpoint shows `"oauth_compliant": true`
- ✅ Documentation complete and accurate
- ✅ Claude Code still works (Bearer token fallback)

---

## Rollback Plan

If OAuth integration fails:

### Step 1: Immediate Rollback
```bash
# SSH to droplet
ssh tools-droplet-agents
cd /root/portfolio/integrations/mcp/servers/coda

# Restore old middleware
cp archive/2025-11-15-cloudflare-access/cloudflare-access-auth.ts src/middleware/

# Revert http-server.ts imports
# ... (manual edit)

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Step 2: Verify Rollback
```bash
# Test with Bearer token
curl -H "Authorization: Bearer test-token" https://coda.bestviable.com/mcp
```

### Step 3: Debug
- Review Stytch logs in dashboard
- Check MCP client error messages
- Verify OAuth configuration
- Test with Stytch test tokens

### Step 4: Iterate
- Fix identified issues
- Redeploy with fixes
- Retest

**Acceptance**: System restored to working state

---

## Timeline Breakdown

| Section | Duration | Cumulative | Dependencies |
|---------|----------|------------|--------------|
| 1. Pre-Implementation Audit | 30 min | 0:30 | None |
| 2. Stytch Setup | 30 min | 1:00 | Section 1 |
| 3. Install SDK | 15 min | 1:15 | Section 2 |
| 4. Metadata Endpoints | 45 min | 2:00 | Section 3 |
| 5. Stytch Middleware | 90 min | 3:30 | Section 4 |
| 6. Configuration | 15 min | 3:45 | Section 5 |
| 7. Local Testing | 30 min | 4:15 | Section 6 |
| 8. Droplet Deployment | 30 min | 4:45 | Section 7 |
| 9. External Verification | 30 min | 5:15 | Section 8 |
| 10. ChatGPT/Claude.ai Testing | 60 min | 6:15 | Section 9 |
| 11. Cleanup & Docs | 30 min | 6:45 | Section 10 |

**Total**: ~6.75 hours (within 4-6 hour estimate with buffer)

---

## Key Implementation Notes

### No Frontend Required
Stytch hosts all OAuth UI (confirmed from Stytch MCP guide). No React component, no authorization page to deploy. Backend-only implementation.

### Routing Order Critical
Metadata endpoints MUST route before auth middleware. Otherwise, discovery fails with 401.

### Audience Validation Mandatory
RFC 8707 requirement. Token MUST be issued for this specific MCP server (`aud` claim validation).

### Header Format
Use `resource_metadata_uri` not `resource_metadata` per RFC. Codex identified this as potential bug.

### Token Separation
AI client token validates user. Service token (from env) calls Coda API. Never forward client token upstream.

### Backward Compatible
Bearer token fallback maintained during transition. Claude Code continues to work.

---

## Additional Resources

### Official Documentation
- MCP Specification 2025-06-18: https://modelcontextprotocol.io/specification/2025-06-18
- MCP Authorization: https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization
- Stytch MCP Guide: https://stytch.com/docs/guides/connected-apps/mcp-server-overview
- Stytch Blog: https://stytch.com/blog/MCP-authentication-and-authorization-guide/

### RFCs
- RFC 8414: Authorization Server Metadata
- RFC 9728: Protected Resource Metadata
- RFC 8707: Resource Indicators
- RFC 7636: PKCE

### Internal Documentation
- `/Users/davidkellam/workspace/portfolio/openspec/changes/implement-mcp-oauth-strategy-and-sop/design.md`
- `/Users/davidkellam/workspace/portfolio/openspec/changes/implement-mcp-oauth-strategy-and-sop/proposal.md`
- `/Users/davidkellam/workspace/portfolio/docs/system/architecture/ARCHITECTURE_DIAGRAMS.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Status**: Ready for Execution
