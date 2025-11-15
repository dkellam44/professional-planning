# Spec: MCP Server Deployment Capability

**Capability ID**: `mcp-server-deployment`
**Status**: MODIFIED
**Change ID**: `implement-mcp-oauth-strategy-and-sop`

## MODIFIED Requirements

### Requirement: OAuth 2.1 Authentication
The MCP server deployment SHALL enforce OAuth 2.1 authentication on all endpoints except health/status checks and OAuth metadata endpoints, with full RFC compliance.

#### Scenario: User authenticates via Stytch OAuth 2.1 with PKCE
- **WHEN** user initiates OAuth flow from ChatGPT or Claude.ai web
- **THEN** server redirects to Stytch authorization endpoint
- **AND** PKCE code challenge is verified (RFC 7636)
- **AND** server validates authorization code and issues access token
- **AND** request proceeds to MCP tool handler

#### Scenario: User provides valid Stytch access token
- **WHEN** user makes request with `Authorization: Bearer <stytch-access-token>` header
- **THEN** server validates token using Stytch SDK
- **AND** token signature verified using JWKS from Stytch
- **AND** request proceeds with user email in request context

#### Scenario: Bearer token fallback for Claude Code development
- **WHEN** user makes request with `Authorization: Bearer <custom-token>` header during development
- **THEN** server accepts token without Stytch validation
- **AND** useful for local testing without OAuth flow
- **AND** NOT used in production

#### Scenario: Unauthenticated request is rejected
- **WHEN** user makes request without Authorization header
- **THEN** server returns 401 Unauthorized with WWW-Authenticate header
- **AND** includes OAuth 2.1 error codes (invalid_token, expired_token, insufficient_scope)
- **AND** error response follows RFC 6750 format

#### Scenario: Invalid or expired token is rejected
- **WHEN** user provides invalid/expired Stytch token
- **THEN** server validates token signature fails
- **AND** request returns 401 with "invalid_token" error code
- **AND** client can initiate new OAuth flow

---

### Requirement: OAuth 2.1 Metadata Endpoints
The MCP server SHALL implement required OAuth 2.1 metadata endpoints for client discovery and resource protection.

#### Scenario: Authorization Server Metadata (RFC 8414)
- **WHEN** client requests `/.well-known/oauth-authorization-server`
- **THEN** server returns JSON with:
  - `issuer`: Stytch project identifier
  - `authorization_endpoint`: Stytch OAuth endpoint
  - `token_endpoint`: Stytch token endpoint
  - `jwks_uri`: Stytch JWKS endpoint
  - `scopes_supported`: ["openid", "profile", "email"]
  - `response_types_supported`: ["code"]
  - `grant_types_supported`: ["authorization_code"]
  - `code_challenge_methods_supported`: ["S256"] (PKCE required)
- **AND** response follows RFC 8414 specification
- **AND** endpoint accessible without authentication

#### Scenario: Protected Resource Metadata (RFC 9728)
- **WHEN** client requests `/.well-known/oauth-protected-resource`
- **THEN** server returns JSON with:
  - `resource`: Coda MCP resource identifier
  - `authorization_servers`: [Stytch project URL]
  - `scope_name`: scope required for resource access
  - `access_token_type`: "Bearer"
- **AND** response follows RFC 9728 specification
- **AND** endpoint accessible without authentication

#### Scenario: JWKS Endpoint for Token Validation
- **WHEN** server needs to validate Stytch tokens
- **THEN** server proxies requests to `/.well-known/jwks.json`
- **AND** caches JWKS for 1 hour to reduce external calls
- **AND** fails gracefully if Stytch JWKS unavailable

#### Scenario: Service Token Storage for API Access
The MCP server SHALL store Coda API tokens securely using one of three approaches: environment variables, PostgreSQL with encryption, or external secrets manager.

#### Scenario: Phase 1 - Service token in environment variable
- **WHEN** MCP starts with `CODA_API_TOKEN` environment variable
- **THEN** server reads token from process.env
- **AND** uses token for all Coda API calls
- **AND** token is NOT logged or exposed in responses

#### Scenario: Phase 2 - Service token in PostgreSQL with encryption
- **WHEN** MCP configured for PostgreSQL token storage
- **THEN** server connects to PostgreSQL with connection pool
- **AND** queries encrypted `tokens` table
- **AND** decrypts token using AES-256-GCM with `MCP_AUTH_ENCRYPTION_KEY`
- **AND** token persists across container restarts

#### Scenario: Phase 3 - Service token in Infisical secrets manager
- **WHEN** MCP configured for Infisical token storage
- **THEN** server connects to Infisical using `INFISICAL_API_KEY`
- **AND** fetches secret using workspace ID and secret name
- **AND** caches token for 5 minutes to reduce API calls
- **AND** rotates cache on 401 response from API

#### Scenario: Service token retrieval failure is handled gracefully
- **WHEN** token storage unavailable (DB down, Infisical unreachable, env var missing)
- **THEN** server returns 503 Service Unavailable
- **AND** includes diagnostic message
- **AND** does NOT expose internal error details

---

### Requirement: MCP Deployment Template
The MCP server deployment SHALL include reusable template for new MCP implementations with built-in OAuth 2.1 support.

#### Scenario: New MCP author uses template
- **WHEN** developer creates new MCP from `/templates/mcp-server-template/`
- **THEN** new MCP can be scaffolded in <5 minutes
- **AND** includes Dockerfile, docker-compose.yml, OAuth middleware, example handlers
- **AND** template includes Stytch SDK configuration
- **AND** template follows standard patterns from existing Coda, GitHub MCPs

#### Scenario: New MCP author integrates OAuth middleware
- **WHEN** developer imports auth middleware in new MCP
- **THEN** middleware handles:
  - Stytch token validation
  - Bearer token fallback for development
  - Service token retrieval
  - Error responses following RFC 6750
- **AND** developer only implements business logic (tools/handlers)
- **AND** middleware configurable via config object

#### Scenario: Service token storage is configurable
- **WHEN** middleware configured with `tokenStore: 'env' | 'postgres' | 'infisical'`
- **THEN** middleware uses appropriate retrieval strategy
- **AND** can switch between strategies by changing config
- **AND** no code changes required to switch strategies

---

### Requirement: PKCE Support for OAuth 2.1
The MCP server SHALL implement PKCE (RFC 7636) as mandatory for all OAuth flows.

#### Scenario: Authorization request includes PKCE challenge
- **WHEN** client initiates OAuth flow
- **THEN** client generates code verifier and code challenge (S256)
- **AND** code challenge included in authorization request
- **AND** server receives challenge with `code_challenge_methods_supported: ["S256"]`

#### Scenario: Token request includes PKCE verifier
- **WHEN** client exchanges authorization code for token
- **THEN** client includes code verifier in token request
- **AND** server validates verifier matches stored challenge
- **AND** token issued only if verification succeeds

#### Scenario: PKCE validation failures are rejected
- **WHEN** PKCE challenge/verifier mismatch detected
- **THEN** server returns 400 Bad Request
- **AND** error code: `invalid_request`
- **AND** user redirected to re-authenticate

---

### Requirement: Service Token Encryption
The MCP deployment SHALL encrypt stored service tokens at rest using AES-256-GCM when using PostgreSQL storage.

#### Scenario: Service token is encrypted before storage
- **WHEN** service token stored in PostgreSQL
- **THEN** token encrypted using AES-256-GCM
- **AND** encrypted value stored with IV and auth tag
- **AND** plaintext token never stored

#### Scenario: Service token is decrypted on retrieval
- **WHEN** service token retrieved from PostgreSQL
- **THEN** server decrypts using AES-256-GCM
- **AND** returns plaintext token to caller
- **AND** fails with clear error if decryption fails

#### Scenario: Encryption key can be rotated
- **WHEN** `rotateKey(oldKey, newKey)` called
- **THEN** all tokens in service re-encrypted with new key
- **AND** operation is atomic
- **AND** completes in <5 seconds

---

## Related Capabilities

- `oauth-2.1-compliance` - RFC 8414, RFC 9728, RFC 7636 implementation
- `stytch-integration` - OAuth provider and token validation
- `service-token-management` - Coda API token CRUD operations
- `docker-deployment` - Container orchestration
- `postgresql-infrastructure` - Optional database backend for service token storage

## Impact Summary

**Breaking Changes**: Replaces Cloudflare Access authentication with Stytch OAuth 2.1
**New Capabilities**:
- Full OAuth 2.1 compliance with PKCE
- OAuth metadata endpoints (RFC 8414, RFC 9728)
- Stytch-managed user authentication
- Service token storage flexibility (env/postgres/infisical)
- Reusable OAuth middleware for new MCPs

**Migration Path**:
1. Phase 1 (Current): Cloudflare Access JWT + Bearer token (env var service token)
2. Phase 2 (Planned): Stytch OAuth 2.1 + Bearer token fallback (env var service token)
3. Phase 2F (Optional): Remove Cloudflare Access support after 30-day transition
4. Phase 3 (Future): Service token storage in PostgreSQL with encryption
5. Phase 4 (Future): Service token storage in Infisical secrets manager

---

**Spec Version**: 2.0 (OAuth 2.1 Compliance)
**Last Updated**: 2025-11-14
**Status**: UPDATED for Stytch OAuth 2.1 strategy
