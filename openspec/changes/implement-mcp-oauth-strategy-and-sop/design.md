# Technical Design: MCP OAuth Strategy & Middleware

**Change ID**: `implement-mcp-oauth-strategy-and-sop`
**Date**: 2025-11-08
**Author**: David Kellam

---

## Context

### Current State
- **Coda MCP**: Running on droplet but returns 401 (no real authentication)
- **GitHub/Memory/Context7**: Deployed on Workers with Cloudflare Access but no per-user token management
- **Token Storage**: Ad-hoc (env vars, in-memory, unencrypted)
- **Documentation**: Scattered and outdated

### Requirements
1. **Secure**: Tokens encrypted at rest, JWT validation on requests
2. **Scalable**: Pattern works for all future MCPs
3. **Simple**: Minimal code changes per new MCP
4. **Maintainable**: Reusable middleware, clear SOP
5. **Flexible**: Support migration (env → postgres → infisical)

### Stakeholders
- **New MCP Authors**: Need clear template and SOP
- **Security**: Require encryption and audit logging
- **Operations**: Need troubleshooting guide and monitoring
- **Users**: Expect secure, seamless authentication

---

## Goals

### Primary Goals
1. ✅ Coda MCP secured and operational (Phase 1)
2. ✅ **MCP Protocol Implementation** (Phase 1.5 - COMPLETE) - Proper JSON-RPC 2.0 MCP protocol handlers with notification support
3. ⏳ Reusable auth middleware package (Phase 2)
4. ⏳ Comprehensive SOP for future MCPs (Phase 3)
5. ⏳ Updated architecture documentation (Phase 4)

### Non-Goals
- ⚠️ Multi-user per MCP (Phase 1-2 supports single service account)
- ⚠️ Infisical integration (Phase 3, depends on fixing broken deployment)
- ⚠️ Database migration tooling (manual process acceptable)

---

## Critical Discovery: MCP Protocol Implementation Required (✅ PHASE 1.5 COMPLETE)

### What We Found
During Phase 1 testing with Claude Code MCP client, the server was receiving JSON-RPC 2.0 messages (e.g., `initialize`, `tools/call`) but the HTTP endpoint was treating them as simple Coda API proxy requests. This mismatch prevented Claude Code from connecting.

### Root Cause Discovery
The initial design assumed the `/mcp` endpoint could work as a simple HTTP proxy. However, the **Model Context Protocol specification (2025-06-18)** explicitly requires:
- JSON-RPC 2.0 message format
- Server capability negotiation via `initialize` method
- Proper tool/resource discovery and invocation

During Phase 1.5 implementation, a critical discovery was made: **MCP notifications (messages without `id` field) must receive empty `{}` responses, not error responses**. The protocol distinguishes between:
- **Requests** (with `id`): Expect `{"jsonrpc": "2.0", "id": X, "result": ...}`
- **Notifications** (without `id`): Expect `{}` or no response

### Solution Implemented (Phase 1.5)
✅ **COMPLETE** - Proper MCP protocol handler implementation:
1. Parse incoming JSON-RPC 2.0 messages
2. Detect notifications by checking for missing `id` field
3. Implement core MCP methods: `initialize`, `tools/list`, `tools/call`
4. Handle MCP notifications: `notifications/initialized`, `notifications/progress`, `notifications/resources/list_changed`
5. Wrap existing Coda API proxy logic in MCP protocol layer
6. Maintain backward compatibility with Bearer token authentication

**Key Implementation Details**:
- Detection: `const isNotification = id === undefined`
- Notification handler returns empty response: `{ jsonrpc: '2.0' }`
- Request handler returns result: `{ jsonrpc: '2.0', id, result: ... }`
- Error responses use appropriate HTTP status codes (400 for errors, 200 for success)

This ensures the server fully complies with MCP spec and works seamlessly with Claude Code and other MCP clients.

---

## Architecture

### Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│ User Client (Claude Code, Manual Request, etc.)          │
└────────────────────┬─────────────────────────────────────┘
                     │ HTTPS Request
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Cloudflare Tunnel + Access Control                       │
│ (User already authenticated by CF Access)                │
└────────────────────┬─────────────────────────────────────┘
                     │ Forwards Headers:
                     │ - cf-access-jwt-assertion
                     │ - cf-access-authenticated-user-email
                     ▼
┌──────────────────────────────────────────────────────────┐
│ MCP Endpoint (Coda, GitHub, etc.)                        │
│                                                          │
│ ┌─ Express Middleware ─────────────────────────────────┐ │
│ │ 1. Validate JWT signature                           │ │
│ │    (Use Cloudflare public keys, cache locally)      │ │
│ │ 2. Extract user email from JWT payload              │ │
│ │ 3. Fallback to Bearer token (dev mode)              │ │
│ │ 4. Pass user context to handlers                    │ │
│ └─────────────────────────────────────────────────────┘ │
│                     │                                     │
│                     ▼                                     │
│ ┌─ Token Resolution ───────────────────────────────────┐ │
│ │ mode: 'env' | 'postgres' | 'infisical'              │ │
│ │ Phase 1: Get CODA_API_TOKEN from process.env        │ │
│ │ Phase 2: Query postgres.tokens table                │ │
│ │ Phase 3: Fetch from Infisical API                   │ │
│ │ Return: Decrypted token (AES-256-GCM)               │ │
│ └─────────────────────────────────────────────────────┘ │
│                     │                                     │
│                     ▼                                     │
│ ┌─ JSON-RPC 2.0 Handler ────────────────────────────┐ │
│ │ Parse incoming JSON-RPC message                    │ │
│ │ Detect notifications (no id field)                 │ │
│ │ Route to handler:                                  │ │
│ │  • initialize → advertise capabilities             │ │
│ │  • tools/list → list available Coda functions     │ │
│ │  • tools/call → execute Coda API call             │ │
│ │  • notifications/* → accept, return empty {}      │ │
│ └─────────────────────────────────────────────────────┘ │
│                     │                                     │
│                     ▼                                     │
│ ┌─ Coda API Proxy ──────────────────────────────────┐ │
│ │ 1. Resolve service token from env/postgres        │ │
│ │ 2. Call Coda API with request parameters          │ │
│ │ 3. Return Coda response in JSON-RPC format        │ │
│ │ 4. Log operation to audit_log table                │ │
│ └─────────────────────────────────────────────────────┘ │
└────────────────────┬─────────────────────────────────────┘
                     │ Response
                     ▼
┌──────────────────────────────────────────────────────────┐
│ User Client Receives Result                              │
└──────────────────────────────────────────────────────────┘
```

### Middleware Stack

```typescript
// Express middleware stack (in order)
app.use(express.json());
app.use(createAuthMiddleware({
  mode: 'cloudflare', // Validates JWT OR Bearer token
  tokenStore: 'env',  // Phase 1: env, Phase 2: postgres
  serviceName: 'coda-mcp',
  encryptionKey: process.env.MCP_AUTH_ENCRYPTION_KEY
}));

// After middleware:
// req.user = { email: 'user@example.com' }
// req.serviceToken = 'pat_xxxxx' (decrypted if encrypted)

app.post('/mcp', (req, res) => {
  const token = req.serviceToken;
  const email = req.user.email;
  // Use token to call Coda API
});
```

### Token Storage Evolution

#### Phase 1: Environment Variable (Simplest)
```yaml
# docker-compose.yml
environment:
  - CODA_API_TOKEN=pat_xxxxx
```

**Pros**: No code, works immediately, same as other MCPs
**Cons**: Visible in docker inspect, no encryption, single user

**Migration**: Transparent to application code. `createAuthMiddleware({ tokenStore: 'env' })`

#### Phase 2: PostgreSQL with Encryption
```sql
-- Database schema
CREATE TABLE tokens (
  id SERIAL PRIMARY KEY,
  service_id INT REFERENCES services(id),
  key VARCHAR(255) NOT NULL,
  encrypted_value TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service_id, key)
);

-- Example data (encrypted)
INSERT INTO tokens (service_id, key, encrypted_value)
VALUES (1, 'CODA_API_TOKEN', 'U2FsdGVkX1...');
```

**Pros**: Encrypted at rest, persists across restarts, supports rotation, audit logging
**Cons**: Requires PostgreSQL connection, more code

**Migration**: `migrate-env-to-postgres.sh` reads env, encrypts, inserts into DB

**Encryption**: AES-256-GCM
```typescript
function encrypt(plaintext: string, key: Buffer): { iv: string, ciphertext: string, authTag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encrypted: { iv, ciphertext, authTag }, key: Buffer): string {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(encrypted.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(encrypted.ciphertext, 'hex'),
    decipher.final()
  ]);
  return plaintext.toString('utf8');
}
```

**Encryption Key**: `MCP_AUTH_ENCRYPTION_KEY` env var
- Generated once, stored securely
- Used for all token encryption in that MCP
- Can be rotated via `rotateKey()` function

#### Phase 3: Infisical (Centralized Secrets)
```typescript
const infisical = new InfisicalClient({
  apiKey: process.env.INFISICAL_API_KEY,
  workspaceId: process.env.INFISICAL_WORKSPACE_ID,
  environment: 'production'
});

const token = await infisical.getSecret('CODA_API_TOKEN');
```

**Pros**: Centralized, versioned, audit trail, no local key management
**Cons**: External dependency, API calls per request (slower)

**Migration**: Export postgres → Import to Infisical via API

---

## Key Design Decisions

### 1. Cloudflare Access (Not GitHub OAuth or Direct OAuth)

**Decision**: Use Cloudflare Access JWT validation instead of custom OAuth server

**Rationale**:
- ✅ Already deployed and working (zero setup)
- ✅ JWT validation simple (~50 lines of code)
- ✅ No database or session state needed (stateless)
- ✅ Free (included with tunnel)
- ✅ Per-request validation (no cookie/session overhead)

**Alternative Rejected: GitHub OAuth**
- ❌ Requires GitHub app registration
- ❌ More complex implementation
- ❌ Overkill for personal/team use
- ✅ Better for public, multi-organization MCPs

**Alternative Rejected: Better-Auth**
- ❌ Full auth framework (overkill for simple needs)
- ❌ Requires database (but we have PostgreSQL)
- ❌ More code to maintain
- ✅ Better for multi-provider, multi-user scenarios

### 2. PostgreSQL for Phase 2 (Not Infisical, Not Env Var)

**Decision**: Use local PostgreSQL for token encryption/storage in Phase 2

**Rationale**:
- ✅ Already running (no new infrastructure)
- ✅ Free (no additional cost)
- ✅ Production-grade encryption
- ✅ Easy to understand (standard SQL)
- ✅ Audit logging built-in
- ✅ Can migrate to Infisical later without refactor

**Trade-off vs. Env Var** (Phase 1):
- ✅ More features (encryption, audit, rotation)
- ❌ More complexity (DB connection, schema)

**Trade-off vs. Infisical** (Phase 3):
- ✅ No external dependency
- ❌ Local maintenance responsibility
- But: Can migrate later with 1-line code change

### 3. Reusable NPM Package (Not Inline Middleware)

**Decision**: Extract auth logic into `@bestviable/mcp-auth-middleware` npm package

**Rationale**:
- ✅ Every new MCP copies same auth code (DRY principle)
- ✅ Security fixes apply to all MCPs automatically
- ✅ Versioning and changelog clear
- ✅ Can be tested independently

**Trade-off**: More complex monorepo setup
- But: Worth it for 3+ MCPs (you have 1 droplet MCP now, more planned)

### 4. Per-Request Authentication (Not Session-Based)

**Decision**: Validate JWT on every request, no session cookies

**Rationale**:
- ✅ Stateless (easier to scale)
- ✅ Each request independently verified
- ✅ No session fixation/hijacking risk
- ✅ Works well with API/CLI clients

**Trade-off**: Slight overhead per request (JWT validation ~1ms)
- Acceptable for MCP use case

### 5. Audit Logging (Not Optional)

**Decision**: Log all token access and operations to database

**Rationale**:
- ✅ Security compliance (know who accessed what)
- ✅ Troubleshooting (debug failed operations)
- ✅ Usage monitoring (identify issues early)

**Storage**: PostgreSQL `audit_log` table
```sql
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  service_id INT,
  action VARCHAR(50), -- 'get_token', 'set_token', 'rotate_key', 'api_call'
  user_email VARCHAR(255),
  details JSONB, -- Additional context
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Strategy

### Phase 1: Minimal Change (1 day)

1. Add `CODA_API_TOKEN` to docker-compose.yml
2. Add Cloudflare Access JWT validation middleware
3. Test with curl + Cloudflare tunnel
4. Update health check

**Risk**: Low
**Rollback**: Simple (revert docker-compose.yml)

### Phase 2: Build Reusable Middleware (3-4 days)

1. Create npm package structure
2. Implement encryption utilities
3. Create PostgreSQL schema
4. Implement token CRUD + audit logging
5. Write comprehensive tests (90%+ coverage)
6. Publish to npm registry
7. Integrate into Coda MCP (minimal changes)
8. Run migration script

**Risk**: Medium (database migration)
**Rollback**: Keep env var as fallback, revert to Phase 1 if needed

### Phase 3: Documentation & SOP (3-4 days)

1. Write OAUTH_SOP.md (comprehensive)
2. Create troubleshooting runbook
3. Build MCP template directory
4. Audit & fix orphaned docs
5. Update architecture documentation

**Risk**: Low (documentation only)
**Parallel**: Can overlap with Phase 2

---

## Security Considerations

### Token Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Size**: 256-bit (32 bytes)
- **IV**: Random 128-bit per encryption
- **Auth Tag**: Provided by GCM mode
- **Key Storage**: Environment variable (no hardcoding)

### Key Rotation
- **Frequency**: Manual (triggered by operator)
- **Process**: `rotateKey(oldKey, newKey)` decrypts all tokens with old key, re-encrypts with new key
- **Downtime**: ~1 second (atomic database operation)

### Audit Trail
- **What's Logged**: Action, user email, service, timestamp
- **What's NOT Logged**: Token values (never)
- **Retention**: Indefinite (database growth ~1KB per operation)

### Cloudflare Access JWT Validation
- **Public Keys**: Cached locally (refreshed every 24h)
- **JWT Signature**: Verified before accepting
- **Expiration**: Standard JWT `exp` claim checked
- **Fallback**: Bearer token for local development (disabled in production)

---

## Testing Strategy

### Unit Tests (90%+ coverage)
- Encryption/decryption (round-trip, edge cases)
- JWT validation (valid, invalid, expired)
- Token CRUD (get, set, delete, rotate)
- Audit logging (correct fields, timestamps)

### Integration Tests
- Full auth flow (JWT → token retrieval → API call)
- Phase 1 → Phase 2 migration
- Failure scenarios (DB down, invalid token, etc.)

### Manual Tests
- Curl against Coda MCP via Cloudflare tunnel
- Test with/without Cloudflare Access
- Verify docker logs show auth validation
- Health check endpoint behavior

---

## Monitoring & Observability

### Logs
- All auth validation events logged to stdout
- Format: `[timestamp] [level] [service] message`
- Example: `2025-11-08T10:30:45Z INFO coda-mcp JWT validated for user@example.com`

### Metrics (Future)
- Token fetch latency (should be <10ms)
- Failed auth attempts (should be 0 in normal operation)
- Token retrieval failures (indicates DB or Infisical down)

### Health Checks
- `/health` endpoint includes auth validation status
- Response: `{ status: 'ok', auth: 'cloudflare-access', token_store: 'postgres' }`

---

## Migration Path & Rollback

### If Phase 2 Fails
1. Revert code changes to Coda MCP
2. Keep running on Phase 1 (env var)
3. Diagnosis: Check PostgreSQL connection, encryption key

### If PostgreSQL Goes Down
1. Fallback to env var (code supports both)
2. Update middleware config: `tokenStore: 'env'`
3. Restart Coda MCP

### If Cloudflare Access JWT Changes
1. Update JWT validation code
2. Bearer token fallback still works
3. Time to update: <1 hour

---

## Future Considerations

### Phase 3: Infisical Integration
- Requires fixing broken Infisical deployment first
- Code change: `tokenStore: 'infisical'` in config
- Migration: Export postgres, import to Infisical
- Benefit: Centralized secrets, version control

### Multi-User Support (Later Phase)
- Current: Single service account per MCP
- Future: Multiple tokens per service (one per user)
- Migration: Add `user_id` column to tokens table

### API Rate Limiting
- Currently: No rate limiting per user
- Future: Add `rate_limit` column to audit_log, check before allowing request

### Performance Optimization
- JWT public keys: Cache locally (already done)
- Token decryption: ~1ms per call (acceptable)
- PostgreSQL: Connection pooling (already configured)
- Future: Redis cache for frequently-accessed tokens

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| PostgreSQL goes down | High | Keep env var fallback, monitoring |
| Encryption key lost | Critical | Store in Infisical Phase 3 |
| JWT validation breaks | Medium | Bearer token fallback always available |
| Infisical broken | Medium | Phase 3 deferred, use PostgreSQL |
| Audit log fills disk | Low | Implement log retention policy |
| Token rotation fails | Medium | Atomic DB transaction, rollback on error |

---

## Code Organization

```
integrations/
├── mcp/
│   └── servers/
│       └── coda/
│           ├── src/
│           │   ├── http-server.ts (updated)
│           │   ├── config.ts (updated)
│           │   ├── middleware/
│           │   │   └── auth.ts (uses @bestviable/mcp-auth-middleware)
│           │   └── routes/
│           │       └── tools.ts
│           ├── Dockerfile
│           └── docker-compose.yml (updated)
└── npm-packages/
    └── mcp-auth-middleware/
        ├── src/
        │   ├── index.ts (main export)
        │   ├── validators/
        │   │   ├── cloudflare-access.ts
        │   │   └── bearer-token.ts
        │   ├── encryption/
        │   │   ├── index.ts
        │   │   └── key-generation.ts
        │   ├── postgres/
        │   │   ├── connection.ts
        │   │   └── token-store.ts
        │   └── middleware/
        │       └── create-auth-middleware.ts
        ├── src/__tests__/
        │   ├── encryption.test.ts
        │   ├── validators.test.ts
        │   └── token-store.test.ts
        ├── package.json
        ├── tsconfig.json
        └── README.md
```

---

**Design Review**: [To be filled during approval]
**Architecture Approved**: [To be filled]
