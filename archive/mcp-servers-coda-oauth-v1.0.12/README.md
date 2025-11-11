# Archived: Coda MCP OAuth Routes (v1.0.12)

**Archive Date**: 2025-11-09
**Git Commit**: c51f7fab6807e28d04a5f3bde9aaa60780236d55
**Reason**: OAuth endpoints deprecated in favor of Cloudflare Access authentication

## What Was Removed

This archive contains the OAuth 2.0 implementation that was originally planned for Coda MCP server integration with ChatGPT and Claude.ai.

### Files Archived
- `oauth-routes.ts` - Express router with OAuth 2.0 endpoints

### Endpoints Removed
- `POST /oauth/register` - Dynamic Client Registration (RFC 7591)
- `GET /oauth/authorize` - Authorization endpoint (user consent)
- `POST /oauth/token` - Token endpoint (exchange code for token)
- `GET /oauth/userinfo` - User information endpoint
- `POST /oauth/introspect` - Token introspection endpoint

## Why It Was Removed

After evaluation, we decided to use **Cloudflare Access** for authentication instead of implementing a full OAuth server:

### Reasons for Removal
1. **Simpler Architecture**: Cloudflare Access provides authentication without maintaining OAuth infrastructure
2. **Zero Additional Cost**: Already included with Cloudflare Tunnel
3. **Better Security**: Cloudflare manages JWT validation and user identity
4. **Faster Implementation**: No need to implement OAuth flow, token storage, or session management

### Migration Path
The new authentication strategy:
- **Phase 1**: Cloudflare Access JWT validation + Environment variable token storage
- **Phase 2**: PostgreSQL encrypted token storage
- **Phase 3**: Centralized secrets via Infisical

## Technical Details

### OAuth Flow That Was Planned
```
1. Client → POST /oauth/register → Server (get client_id)
2. User → GET /oauth/authorize?client_id=... → Server (consent screen)
3. Server → Redirect with code → Client
4. Client → POST /oauth/token (exchange code) → Server (get access_token)
5. Client → API calls with Bearer token → Server
```

### Current Flow (Cloudflare Access)
```
1. User → HTTPS request → Cloudflare Access (authentication)
2. Cloudflare → Request + JWT headers → Server
3. Server validates JWT → Retrieves service token → Calls Coda API
```

## Implementation Notes

The OAuth implementation was:
- ✅ Complete and functional
- ✅ RFC-compliant (RFC 6749, RFC 7591)
- ✅ Tested with mock clients
- ❌ Never deployed to production
- ❌ Never imported in http-server.ts

## Related Documentation

See the new OAuth strategy:
- `/docs/infrastructure/mcp/OAUTH_SOP.md` - Authentication strategy
- `/docs/infrastructure/mcp/OAUTH_TROUBLESHOOTING.md` - Troubleshooting guide
- `/openspec/changes/implement-mcp-oauth-strategy-and-sop/` - OpenSpec change proposal

## Recovery Instructions

If you need to restore this OAuth implementation:

1. Copy `oauth-routes.ts` back to `src/auth/`
2. Import it in `http-server.ts`:
   ```typescript
   import oauthRouter from './auth/oauth-routes.js';
   app.use('/oauth', oauthRouter);
   ```
3. Update documentation to reflect OAuth flow
4. Implement production token storage (currently in-memory)

## Questions?

Contact: David Kellam
Change ID: `implement-mcp-oauth-strategy-and-sop`
OpenSpec: `/openspec/changes/implement-mcp-oauth-strategy-and-sop/proposal.md`
