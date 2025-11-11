# Auth Middleware Refactor Notes

## Problem Identified

The current http-server.ts implementation conflates **two different tokens**:

### Current (Incorrect) Flow:
```
User Request
├── Bearer token in Authorization header
└── Treated as CODA_API_TOKEN directly
    └── Coda client configured with user's token ❌
```

This assumes the user's authentication token IS the Coda API token, which is wrong.

### Design (Correct) Flow:
```
User Request
├── User Auth Token (Bearer or Cloudflare JWT)
│   └── Middleware validates: "Who is this user?"
├── Service Token Resolution
│   ├── Phase 1: CODA_API_TOKEN from process.env
│   ├── Phase 2: Query PostgreSQL (decrypt if needed)
│   └── Phase 3: Fetch from Infisical API
└── Handlers use req.serviceToken to call Coda API ✅
```

## Key Separation

**User Auth Token** (Authentication):
- Proves who the user is
- Can be: Cloudflare Access JWT, Bearer token, etc.
- Stored in request headers
- Validated by middleware

**Service Token** (Authorization):
- What we use to access Coda API
- Single token (or per-service in future)
- Resolved from env/DB/Infisical
- Injected into req.serviceToken by middleware

## Current Implementation Issues

### File: src/http-server.ts (lines 299-334)

```typescript
// ❌ WRONG: Treating user's Bearer token as Coda API token
const bearerTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader.substring(7).trim();

  // ❌ Using user's token directly
  client.setConfig({
    baseURL: 'https://coda.io/apis/v1',
    headers: {
      Authorization: `Bearer ${token}`  // Wrong token!
    }
  });
};
```

## New Implementation (src/middleware/auth-middleware.ts)

```typescript
// ✅ CORRECT: Separate concerns
export function createAuthMiddleware(config: AuthConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Validate user (who are they?)
    const cfResult = validateCloudflareAccess(req);
    if (cfResult.valid) {
      req.user = { email: cfResult.email };
      req.authMethod = 'cloudflare-access';
    }

    // 2. Resolve service token (what token do we use for Coda API?)
    const serviceToken = await resolveServiceToken(config);
    req.serviceToken = serviceToken;  // ✅ Resolved from env/DB/Infisical

    next();
  };
}
```

## Usage in http-server.ts

### Before (Incorrect):
```typescript
app.use('/mcp', bearerTokenMiddleware);

app.post('/mcp', (req, res) => {
  // Using user's token as Coda API token
  // client already configured with wrong token
});
```

### After (Correct):
```typescript
app.use(createAuthMiddleware({
  mode: 'cloudflare',      // Accept Cloudflare JWT
  tokenStore: 'env',       // Phase 1: env var
  serviceName: 'coda-mcp'
}));

app.post('/mcp', (req, res) => {
  const userEmail = req.user.email;        // Who is this?
  const serviceToken = req.serviceToken;   // What token to use?

  // Configure client with CORRECT token
  client.setConfig({
    headers: {
      Authorization: `Bearer ${serviceToken}`
    }
  });

  // Now use client to call Coda API
  const tools = await client.get('/resources');
});
```

## Migration Path

### Phase 1 (Now):
- Implement `createAuthMiddleware()` with `tokenStore: 'env'`
- Validate Cloudflare JWT headers + Bearer token fallback
- Resolve CODA_API_TOKEN from `process.env`
- Update http-server.ts to use new middleware

### Phase 2 (Future):
- Add PostgreSQL schema (tokens table)
- Implement `getTokenFromPostgres()`
- Support token encryption/decryption
- Change config: `tokenStore: 'postgres'`
- No http-server.ts changes needed! ✅

### Phase 3 (Future):
- Add Infisical API client
- Implement `getTokenFromInfisical()`
- Add caching layer
- Change config: `tokenStore: 'infisical'`
- No http-server.ts changes needed! ✅

## Benefits

✅ **Separation of Concerns**: Auth logic isolated from business logic
✅ **Single Responsibility**: Middleware handles token resolution
✅ **Phase Agnostic**: Handlers don't know or care about token source
✅ **Testable**: Mock different token stores without changing handlers
✅ **Secure**: Token resolution happens once per request, validated consistently
✅ **Auditable**: All token access logged in one place

## Files to Update

- [ ] Create `src/middleware/auth-middleware.ts` ✅ (Done)
- [ ] Update `src/http-server.ts` to use `createAuthMiddleware()`
- [ ] Remove old `cloudflareAccessMiddleware` and `bearerTokenMiddleware`
- [ ] Update client configuration in handlers to use `req.serviceToken`
- [ ] Add TypeScript extend for `req.user`, `req.serviceToken`, `req.authMethod`
- [ ] Update tests to mock middleware correctly

## References

- **OpenSpec Design**: `/openspec/changes/implement-mcp-oauth-strategy-and-sop/design.md` (lines 99-120)
- **New Middleware**: `/archive/integrations/mcp/servers/coda/src/middleware/auth-middleware.ts`
- **Current Issue**: config.ts reads correct env var, but middleware uses wrong token source
