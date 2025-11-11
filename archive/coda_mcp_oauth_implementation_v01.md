---
- entity: playbook
- level: internal
- zone: internal
- version: v01
- tags: [oauth, mcp, coda, chatgpt, claude, authentication, implementation]
- source_path: /agents/context/playbooks/coda_mcp_oauth_implementation_v01.md
- date: 2025-10-31
---

# Coda MCP OAuth 2.0 Implementation Playbook

**Purpose**: Enable ChatGPT and Claude.ai web connectors to authenticate with the Coda MCP gateway using OAuth 2.0.

**Status**: ✅ ACTIVE (use this playbook for OAuth implementation or troubleshooting)

**Context Source**: Session 2025-10-31, OAuth article: https://apxml.com/posts/how-to-setup-oauth-chatgpt-connector

---

## Prerequisites

### 1. System Requirements
- Portfolio repo cloned and up to date
- SSH access configured: `ssh tools-droplet-agents` (alias to root@159.65.97.146)
- Node.js installed locally for building
- Completed startup checklist: `/agents/system_startup_checklist_v01.md`

### 2. Current State Verification
```bash
# Verify gateway health
curl -I https://coda.bestviable.com/health
# Expected: HTTP/2 200

# Verify OAuth discovery returns HTTPS URLs
curl -s https://coda.bestviable.com/.well-known/oauth-authorization-server | jq '.issuer'
# Expected: "https://coda.bestviable.com"
```

### 3. Knowledge Prerequisites
- Understand OAuth 2.0 authorization code flow
- Familiar with Express.js routing
- Understand MCP gateway architecture (see `/docs/architecture/integrations/mcp/`)

---

## Background

### Problem Statement
ChatGPT requires OAuth 2.0 for MCP server authentication. The current gateway only supports Bearer token authentication directly, which works for Claude API but not ChatGPT web connector.

### Solution Approach
Implement OAuth 2.0 "wrapper" that:
1. Accepts user's Coda API token during OAuth authorize step
2. Generates temporary authorization code
3. Exchanges code for token (returns the same Coda token as access_token)
4. ChatGPT/Claude saves token and uses it for all future MCP requests

This is "Option A" from the article - simple token passthrough without separate user database.

### Key Insight
OAuth is just a secure handshake to obtain the token once. After OAuth completes, all MCP requests use Bearer token authentication (already implemented).

---

## Architecture

### OAuth Flow Sequence
```
User adds connector to ChatGPT
  ↓
ChatGPT → GET /.well-known/oauth-authorization-server (discovery)
  ↓
ChatGPT → POST /oauth/register (Dynamic Client Registration)
  ↓
ChatGPT → Redirects user to /oauth/authorize?...
  ↓
User sees login page → Pastes Coda API token → Submits
  ↓
Gateway generates auth code → Stores (code → token) mapping
  ↓
User redirected back to ChatGPT with code
  ↓
ChatGPT → POST /oauth/token (exchange code for access_token)
  ↓
Gateway returns user's Coda token as access_token
  ↓
ChatGPT saves token permanently → Uses for all future MCP requests
```

### Components

#### 1. Auth Store (In-Memory)
- Stores temporary authorization codes (5-minute TTL)
- Maps: `code → {codaToken, timestamp, codeVerifier}`
- Cleanup expired codes automatically

#### 2. OAuth Router
- Three endpoints: /oauth/register, /oauth/authorize, /oauth/token
- Follows RFC 7591 (Dynamic Client Registration)
- Follows RFC 6749 (OAuth 2.0)

#### 3. Login Page
- Simple HTML form for token input
- Client-side validation
- Redirects to callback with auth code

---

## Implementation Steps

### Step 1: Create Auth Store

**File**: `/integrations/mcp/servers/coda/gateway/src/auth/auth-store.ts`

```typescript
/**
 * In-memory storage for OAuth authorization codes
 *
 * Stores temporary codes that map to Coda API tokens
 * Codes expire after 5 minutes
 */

import { randomBytes } from 'crypto';

interface AuthCodeData {
  codaToken: string;
  codeVerifier?: string; // PKCE support
  timestamp: number;
  used: boolean;
}

class AuthStore {
  private store: Map<string, AuthCodeData> = new Map();
  private readonly CODE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Cleanup expired codes every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Generate and store a new authorization code
   */
  createCode(codaToken: string, codeVerifier?: string): string {
    const code = randomBytes(32).toString('base64url');

    this.store.set(code, {
      codaToken,
      codeVerifier,
      timestamp: Date.now(),
      used: false
    });

    console.log(`[AuthStore] Created code: ${code.substring(0, 8)}...`);
    return code;
  }

  /**
   * Exchange code for token (one-time use)
   */
  exchangeCode(code: string, codeVerifier?: string): string | null {
    const data = this.store.get(code);

    if (!data) {
      console.log(`[AuthStore] Code not found: ${code.substring(0, 8)}...`);
      return null;
    }

    if (data.used) {
      console.log(`[AuthStore] Code already used: ${code.substring(0, 8)}...`);
      this.store.delete(code); // Remove used code
      return null;
    }

    // Check expiration
    if (Date.now() - data.timestamp > this.CODE_TTL) {
      console.log(`[AuthStore] Code expired: ${code.substring(0, 8)}...`);
      this.store.delete(code);
      return null;
    }

    // Verify PKCE code_verifier if provided
    if (data.codeVerifier && data.codeVerifier !== codeVerifier) {
      console.log(`[AuthStore] Code verifier mismatch: ${code.substring(0, 8)}...`);
      return null;
    }

    // Mark as used and return token
    data.used = true;
    console.log(`[AuthStore] Code exchanged: ${code.substring(0, 8)}...`);

    // Delete immediately after use
    this.store.delete(code);

    return data.codaToken;
  }

  /**
   * Cleanup expired codes
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [code, data] of this.store.entries()) {
      if (now - data.timestamp > this.CODE_TTL || data.used) {
        this.store.delete(code);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[AuthStore] Cleaned up ${removed} expired codes`);
    }
  }

  /**
   * Get store stats (for debugging)
   */
  getStats(): { total: number; expired: number } {
    const now = Date.now();
    let expired = 0;

    for (const data of this.store.values()) {
      if (now - data.timestamp > this.CODE_TTL) {
        expired++;
      }
    }

    return { total: this.store.size, expired };
  }
}

// Singleton instance
export const authStore = new AuthStore();
```

---

### Step 2: Create OAuth Routes

**File**: `/integrations/mcp/servers/coda/gateway/src/auth/oauth-routes.ts`

```typescript
/**
 * OAuth 2.0 Endpoints for ChatGPT/Claude.ai Integration
 *
 * Implements RFC 7591 (Dynamic Client Registration) and RFC 6749 (OAuth 2.0)
 */

import { Router, Request, Response } from 'express';
import { authStore } from './auth-store.js';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// Get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// 1. Dynamic Client Registration (DCR) - RFC 7591
// ============================================================================

router.post('/register', (req: Request, res: Response) => {
  /**
   * ChatGPT calls this endpoint to register itself as a client
   *
   * We return a static client_id since we don't need per-client tracking
   */

  console.log('[OAuth] Client registration request received');

  // Scope MUST be exactly "openid email" or "email" for ChatGPT
  // Other scopes like "profile" cause "invalid_scope" error
  const response = {
    client_id: 'chatgpt-mcp-client',
    redirect_uris: [
      'https://chatgpt.com/connector_platform_oauth_redirect',
      'https://claude.ai/api/mcp/auth_callback',
      'https://claude.com/api/mcp/auth_callback' // Future URL
    ],
    token_endpoint_auth_method: 'none', // Public client (no secret)
    grant_types: ['authorization_code'],
    response_types: ['code'],
    application_type: 'web',
    scope: 'openid email' // CRITICAL: Must be exactly this
  };

  console.log('[OAuth] Registered client:', response.client_id);
  res.json(response);
});

// ============================================================================
// 2. Authorization Endpoint (User Login)
// ============================================================================

router.get('/authorize', (req: Request, res: Response) => {
  /**
   * User-facing login page
   *
   * Query params from OAuth client:
   * - response_type: "code"
   * - client_id: (from registration)
   * - redirect_uri: where to send user back
   * - state: CSRF token
   * - code_challenge: PKCE challenge (optional)
   * - code_challenge_method: "S256" or "plain"
   */

  const {
    client_id,
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method
  } = req.query;

  console.log('[OAuth] Authorization request:', { client_id, redirect_uri, state });

  // Validate required params
  if (!redirect_uri || !state) {
    res.status(400).send('Missing required OAuth parameters');
    return;
  }

  // Serve login page HTML
  try {
    const htmlPath = join(__dirname, '../views/authorize.html');
    let html = readFileSync(htmlPath, 'utf-8');

    // Inject OAuth params into HTML form
    html = html.replace('{{REDIRECT_URI}}', redirect_uri as string);
    html = html.replace('{{STATE}}', state as string);
    html = html.replace('{{CODE_CHALLENGE}}', code_challenge as string || '');
    html = html.replace('{{CODE_CHALLENGE_METHOD}}', code_challenge_method as string || '');

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('[OAuth] Failed to load authorize.html:', error);
    res.status(500).send('Internal server error');
  }
});

// Handle form submission from login page
router.post('/authorize', (req: Request, res: Response) => {
  /**
   * User submitted Coda API token
   *
   * 1. Validate token format
   * 2. Generate authorization code
   * 3. Store code → token mapping
   * 4. Redirect user back to OAuth client with code
   */

  const {
    coda_token,
    redirect_uri,
    state,
    code_challenge
  } = req.body;

  console.log('[OAuth] Authorization form submitted');

  // Validate inputs
  if (!coda_token || !redirect_uri || !state) {
    res.status(400).send('Missing required fields');
    return;
  }

  // Basic token format validation (Coda tokens start with specific prefix)
  if (typeof coda_token !== 'string' || coda_token.length < 20) {
    res.status(400).send('Invalid Coda API token format');
    return;
  }

  // Generate authorization code
  const authCode = authStore.createCode(coda_token, code_challenge);

  // Redirect back to OAuth client with code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', authCode);
  redirectUrl.searchParams.set('state', state);

  console.log('[OAuth] Redirecting to:', redirectUrl.toString());
  res.redirect(redirectUrl.toString());
});

// ============================================================================
// 3. Token Endpoint (Exchange Code for Access Token)
// ============================================================================

router.post('/token', (req: Request, res: Response) => {
  /**
   * ChatGPT exchanges authorization code for access_token
   *
   * This is the "secret sauce": we return the user's Coda API token
   * as the access_token, which ChatGPT will use for all future MCP requests
   */

  const {
    grant_type,
    code,
    client_id,
    code_verifier,
    redirect_uri
  } = req.body;

  console.log('[OAuth] Token request:', { grant_type, client_id });

  // Validate grant_type
  if (grant_type !== 'authorization_code') {
    res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Only authorization_code grant type is supported'
    });
    return;
  }

  // Validate code
  if (!code) {
    res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing authorization code'
    });
    return;
  }

  // Exchange code for token
  const codaToken = authStore.exchangeCode(code, code_verifier);

  if (!codaToken) {
    res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Invalid, expired, or already used authorization code'
    });
    return;
  }

  // Return the Coda API token as the access_token
  // This is what ChatGPT will save and use for all future MCP requests
  const tokenResponse = {
    access_token: codaToken,
    token_type: 'Bearer',
    expires_in: 7776000, // 90 days (arbitrary, can be longer)
    scope: 'openid email'
  };

  console.log('[OAuth] Token issued successfully');
  res.json(tokenResponse);
});

// ============================================================================
// Export router
// ============================================================================

export default router;
```

---

### Step 3: Create Login Page HTML

**File**: `/integrations/mcp/servers/coda/gateway/src/views/authorize.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize Coda MCP Access</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
      padding: 40px;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 24px;
      color: #333;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 14px;
      color: #666;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .form-group input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-group small {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #666;
    }

    .form-group small a {
      color: #667eea;
      text-decoration: none;
    }

    .form-group small a:hover {
      text-decoration: underline;
    }

    .submit-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }

    .submit-btn:active {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error {
      background: #fee;
      border: 1px solid #fcc;
      color: #c00;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 14px;
      display: none;
    }

    .info {
      background: #e3f2fd;
      border: 1px solid #90caf9;
      color: #1976d2;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Authorize Coda MCP Access</h1>
      <p>Connect your Coda workspace to ChatGPT or Claude.ai</p>
    </div>

    <div class="info">
      <strong>One-time setup:</strong> This token will be securely stored and used for all future interactions. You won't need to enter it again.
    </div>

    <div class="error" id="error-message"></div>

    <form id="auth-form" method="POST" action="/oauth/authorize">
      <input type="hidden" name="redirect_uri" value="{{REDIRECT_URI}}">
      <input type="hidden" name="state" value="{{STATE}}">
      <input type="hidden" name="code_challenge" value="{{CODE_CHALLENGE}}">

      <div class="form-group">
        <label for="coda_token">Coda API Token</label>
        <input
          type="password"
          id="coda_token"
          name="coda_token"
          placeholder="Paste your Coda API token here"
          required
          autocomplete="off"
        >
        <small>
          Get your token from
          <a href="https://coda.io/account#apiSettings" target="_blank">Coda Account Settings</a>
        </small>
      </div>

      <button type="submit" class="submit-btn" id="submit-btn">
        Authorize Access
      </button>
    </form>
  </div>

  <script>
    const form = document.getElementById('auth-form');
    const tokenInput = document.getElementById('coda_token');
    const submitBtn = document.getElementById('submit-btn');
    const errorDiv = document.getElementById('error-message');

    // Basic client-side validation
    form.addEventListener('submit', function(e) {
      const token = tokenInput.value.trim();

      // Basic validation
      if (token.length < 20) {
        e.preventDefault();
        showError('Token appears to be too short. Please check and try again.');
        return;
      }

      // Disable submit button to prevent double-submission
      submitBtn.disabled = true;
      submitBtn.textContent = 'Authorizing...';
    });

    function showError(message) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Authorize Access';
    }

    // Hide error on input change
    tokenInput.addEventListener('input', function() {
      errorDiv.style.display = 'none';
    });
  </script>
</body>
</html>
```

---

### Step 4: Update Server to Mount OAuth Routes

**File**: `/integrations/mcp/servers/coda/gateway/src/server.ts`

**Changes needed:**

1. Import OAuth router
2. Mount OAuth routes

**Add after line 27 (after other imports):**
```typescript
import oauthRouter from './auth/oauth-routes.js';
```

**Add after line 90 (after rate limiting middleware, before /mcp routes):**
```typescript
// ============================================================================
// OAuth 2.0 Endpoints
// ============================================================================

app.use('/oauth', oauthRouter);
```

---

### Step 5: Create Views Directory

```bash
mkdir -p /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/gateway/src/views
```

---

### Step 6: Build Gateway

```bash
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/gateway
npm install
npm run build
```

---

### Step 7: Sync to Droplet

```bash
rsync -avz --delete \
  /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/gateway/ \
  root@159.65.97.146:/root/portfolio/integrations/mcp/servers/coda/gateway/
```

---

### Step 8: Rebuild and Restart Container

```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/docker && \
  docker compose -f docker-compose.production.yml --env-file ../config/.env build coda-mcp-gateway && \
  docker compose -f docker-compose.production.yml --env-file ../config/.env up -d coda-mcp-gateway"
```

---

### Step 9: Verify Deployment

```bash
# Check container is running
ssh tools-droplet-agents "docker ps | grep coda-mcp-gateway"

# Check logs for errors
ssh tools-droplet-agents "docker logs coda-mcp-gateway --tail 50"

# Test OAuth discovery
curl -s https://coda.bestviable.com/.well-known/oauth-authorization-server | jq '.'

# Test registration endpoint
curl -X POST https://coda.bestviable.com/oauth/register | jq '.'

# Test authorize endpoint (should return HTML)
curl -I https://coda.bestviable.com/oauth/authorize?redirect_uri=https://example.com&state=test123
```

---

## Testing with ChatGPT

### 1. Add Connector in ChatGPT

1. Go to ChatGPT Settings → Beta Features → Custom Connectors
2. Click "Add connector"
3. Enter URL: `https://coda.bestviable.com`
4. Click "Continue"

### 2. Complete OAuth Flow

1. ChatGPT will redirect you to authorization page
2. Paste your Coda API token (get from https://coda.io/account#apiSettings)
3. Click "Authorize Access"
4. You'll be redirected back to ChatGPT
5. Connector should now show as "Connected"

### 3. Test MCP Tools

In ChatGPT, try:
```
List my Coda documents
```

Expected: ChatGPT calls coda_list_documents tool and shows your Coda docs

> ℹ️ **If ChatGPT reports a connection error after OAuth succeeds**, confirm the gateway accepted the `initialize` RPC.  
> Manual smoke test:
> ```bash
> curl -s https://coda.bestviable.com/mcp \
>   -H "Authorization: Bearer $CODA_API_TOKEN" \
>   -H "Content-Type: application/json" \
>   -H "Accept: application/json, text/event-stream" \
>   --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"diag","version":"0.1"}}}'
> ```
> Expected: JSON-RPC `result` with protocolVersion, capabilities, and tools array. A 406 response indicates the client omitted one of the `Accept` types.

---

## Testing with Claude.ai

### 1. Add Custom Connector

1. Go to claude.ai/settings/connectors
2. Click "Add custom connector"
3. Enter URL: `https://coda.bestviable.com`
4. Complete OAuth flow (same as ChatGPT)

### 2. Test Tools

In Claude.ai chat:
```
What Coda documents do I have?
```

---

## Troubleshooting

### OAuth Discovery Returns 404

**Symptom:** `curl https://coda.bestviable.com/.well-known/oauth-authorization-server` returns 404

**Fix:**
1. Check container logs: `docker logs coda-mcp-gateway`
2. Verify server.ts was updated correctly
3. Rebuild container

### Registration Endpoint Returns Error

**Symptom:** `POST /oauth/register` returns error or empty response

**Check:**
1. Verify oauth-routes.ts is built: `ls gateway/dist/auth/oauth-routes.js`
2. Check for TypeScript compilation errors
3. Verify router is mounted in server.ts

### Authorize Page Shows HTML Source

**Symptom:** Browser shows raw HTML instead of rendered page

**Fix:**
1. Check `Content-Type` header is set to `text/html`
2. Verify authorize.html is in correct location: `gateway/src/views/authorize.html`
3. Check file permissions

### Token Exchange Fails

**Symptom:** `/oauth/token` returns "invalid_grant" error

**Debug:**
1. Check auth store logs: `docker logs coda-mcp-gateway | grep AuthStore`
2. Verify code isn't expired (5-minute TTL)
3. Check PKCE code_verifier matches code_challenge

### ChatGPT Shows "Unsafe URL" Error

**Already fixed** - OAuth discovery now returns HTTPS URLs

### ChatGPT Shows "invalid_scope" Error

**Symptom:** OAuth registration fails with scope error

**Fix:**
- Ensure `/oauth/register` returns `scope: "openid email"` (exactly)
- Do NOT include "profile" or other scopes

---

## Rollback Procedure

If OAuth implementation causes issues:

### 1. Revert to Previous Version

```bash
# On local machine
cd /Users/davidkellam/workspace/portfolio
git log --oneline integrations/mcp/servers/coda/gateway/src/

# Find commit before OAuth changes
git checkout <previous-commit-hash> -- integrations/mcp/servers/coda/gateway/

# Rebuild and deploy
cd integrations/mcp/servers/coda/gateway
npm run build

rsync -avz --delete gateway/ root@159.65.97.146:/root/portfolio/integrations/mcp/servers/coda/gateway/

ssh tools-droplet-agents "cd /root/portfolio/infra/docker && \
  docker compose build coda-mcp-gateway && \
  docker compose up -d coda-mcp-gateway"
```

### 2. Verify Rollback

```bash
# Check health endpoint
curl -I https://coda.bestviable.com/health

# Verify Bearer token auth still works
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

---

## Success Criteria

✅ OAuth discovery returns valid JSON with HTTPS URLs
✅ `/oauth/register` returns client_id and correct scope
✅ `/oauth/authorize` shows HTML login page
✅ Form submission generates auth code and redirects
✅ `/oauth/token` exchanges code for access_token
✅ ChatGPT connector successfully connects
✅ ChatGPT can call Coda MCP tools
✅ Claude.ai connector works with OAuth
✅ Existing Bearer token authentication still works

---

## Maintenance

### Monitoring

```bash
# Check auth store stats
ssh tools-droplet-agents "docker logs coda-mcp-gateway | grep AuthStore"

# Monitor OAuth requests
ssh tools-droplet-agents "docker logs coda-mcp-gateway | grep OAuth"
```

### Future Enhancements

1. **Persistent Storage**: Replace in-memory store with Redis for multi-instance deployments
2. **Token Refresh**: Implement refresh_token flow for long-lived access
3. **User Management**: Add proper user accounts instead of token passthrough
4. **Rate Limiting**: Add per-client rate limits on OAuth endpoints
5. **Audit Logging**: Enhanced logging for security analysis

---

## Related Documentation

- OAuth implementation article: https://apxml.com/posts/how-to-setup-oauth-chatgpt-connector
- Claude MCP connector docs: https://docs.claude.com/en/docs/agents-and-tools/mcp-connector
- OpenAI MCP overview: https://platform.openai.com/docs/mcp
- MCP Authorization spec (RFC 8707 / dynamic registration): https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization#2-4-dynamic-client-registration
- MCP HTTP transport authentication requirements: https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#authentication-and-authorization
- MCP troubleshooting runbook: `/docs/runbooks/mcp_troubleshooting_v01.md`
- Gateway architecture: `/docs/architecture/integrations/mcp/`
- Infrastructure state: `/docs/infrastructure/droplet_state_2025-10-30.md`

---

**Last Updated**: 2025-10-31
**Status**: ✅ ACTIVE
**Next Review**: After first production use or 2025-11-15
