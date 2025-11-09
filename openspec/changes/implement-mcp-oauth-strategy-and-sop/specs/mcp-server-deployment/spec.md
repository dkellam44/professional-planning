# Spec: MCP Server Deployment Capability

**Capability ID**: `mcp-server-deployment`
**Status**: MODIFIED
**Change ID**: `implement-mcp-oauth-strategy-and-sop`

## MODIFIED Requirements

### Requirement: MCP Server Authentication
The MCP server deployment SHALL enforce authentication on all endpoints except health/status checks using one of: Cloudflare Access JWT, Bearer token, or database-backed credentials.

#### Scenario: User authenticates via Cloudflare Access JWT
- **WHEN** user makes request through Cloudflare tunnel with JWT header
- **THEN** server validates JWT signature and extracts user email
- **AND** request proceeds to tool handler

#### Scenario: User authenticates via Bearer token (development mode)
- **WHEN** user makes request with `Authorization: Bearer token` header
- **THEN** server validates token format and allows request
- **AND** useful for local development without Cloudflare Access

#### Scenario: Unauthenticated request is rejected
- **WHEN** user makes request without JWT or Bearer token
- **THEN** server returns 401 Unauthorized
- **AND** includes clear error message

#### Scenario: Invalid JWT is rejected
- **WHEN** user provides invalid or expired JWT
- **THEN** server validates signature fails
- **AND** request returns 401 with "Invalid JWT" message

---

### Requirement: MCP Token Storage
The MCP deployment SHALL store service API tokens securely using one of three approaches (progressively adding features): environment variables, PostgreSQL with encryption, or external secrets manager.

#### Scenario: Phase 1 - Token stored in environment variable
- **WHEN** MCP starts with `tokenStore: 'env'` configuration
- **THEN** server reads `CODA_API_TOKEN` from `process.env`
- **AND** uses token for all API calls
- **AND** token is NOT logged or exposed in responses

#### Scenario: Phase 2 - Token stored in PostgreSQL with encryption
- **WHEN** MCP starts with `tokenStore: 'postgres'` configuration
- **THEN** server connects to PostgreSQL with pool (min=2, max=10)
- **AND** queries `tokens` table with service_id
- **AND** decrypts token using AES-256-GCM with `MCP_AUTH_ENCRYPTION_KEY`
- **AND** token persists across container restarts

#### Scenario: Phase 3 - Token stored in external secrets manager
- **WHEN** MCP starts with `tokenStore: 'infisical'` configuration
- **THEN** server connects to Infisical API using `INFISICAL_API_KEY`
- **AND** fetches secret using workspace ID and secret name
- **AND** caches token for 5 minutes to avoid excessive API calls

#### Scenario: Token retrieval failure is handled gracefully
- **WHEN** token storage is unavailable (DB down, Infisical unreachable, env var missing)
- **THEN** server returns 503 Service Unavailable
- **AND** includes diagnostic message ("PostgreSQL connection failed", etc.)
- **AND** does NOT return 500 or expose internal error details

---

### Requirement: MCP Deployment Template
The MCP server deployment SHALL include reusable template and middleware package (`@bestviable/mcp-auth-middleware`) for new MCP implementations.

#### Scenario: New MCP author uses template
- **WHEN** developer creates `/templates/mcp-server-template/`
- **THEN** new MCP can be scaffolded in <5 minutes
- **AND** includes Dockerfile, docker-compose.yml, auth middleware, example handlers
- **AND** template follows standard patterns from existing Coda, GitHub MCPs

#### Scenario: New MCP author integrates auth middleware
- **WHEN** developer imports `@bestviable/mcp-auth-middleware`
- **THEN** middleware handles JWT validation, Bearer token fallback, token retrieval
- **AND** developer only needs to implement business logic (tools/handlers)
- **AND** middleware configurable via simple config object

#### Scenario: Middleware supports multiple auth methods
- **WHEN** middleware created with `mode: 'cloudflare'` or `mode: 'bearer'` or `mode: 'both'`
- **THEN** validates appropriately (Cloudflare JWT only, Bearer token only, or either)
- **AND** can switch between auth methods by changing config

---

### Requirement: MCP Token Encryption
The MCP deployment SHALL encrypt stored tokens at rest using AES-256-GCM with NIST-approved encryption.

#### Scenario: Token is encrypted before storage
- **WHEN** token set via `setToken(serviceName, key, value)`
- **THEN** server encrypts plaintext token using AES-256-GCM
- **AND** stores encrypted value (+ IV + auth tag) in database
- **AND** plaintext token is NOT stored anywhere

#### Scenario: Token is decrypted on retrieval
- **WHEN** token fetched via `getToken(serviceName, key)`
- **THEN** server retrieves encrypted value from database
- **AND** decrypts using AES-256-GCM with stored IV and auth tag
- **AND** returns plaintext token to caller
- **AND** fails with clear error if decryption fails ("Invalid encryption key", etc.)

#### Scenario: Encryption key can be rotated
- **WHEN** `rotateKey(oldKey, newKey)` called
- **THEN** all tokens in service are re-encrypted with new key
- **AND** operation is atomic (all succeed or all fail)
- **AND** completes in <5 seconds for typical token counts

---

### Requirement: MCP Audit Logging
The MCP deployment SHALL maintain audit log of all token access and configuration changes.

#### Scenario: Token access is logged
- **WHEN** token retrieved via `getToken()`
- **THEN** entry inserted into `audit_log` table:
  - service_id
  - action: 'get_token'
  - user_email (from JWT or env var)
  - timestamp
  - result: 'success' or 'failure'
- **AND** log entry created <10ms after action

#### Scenario: Token configuration changes are logged
- **WHEN** token set/deleted/rotated
- **THEN** audit entry includes:
  - action: 'set_token' | 'delete_token' | 'rotate_key'
  - operator email
  - affected token key (not value)
  - timestamp

#### Scenario: Audit log contains no sensitive data
- **WHEN** audit entries written
- **THEN** log contains NO plaintext tokens
- **AND** contains NO encryption keys
- **AND** contains NO API credentials
- **AND** safe to expose in logs/dashboards

---

## Related Capabilities

- `cloudflare-access-integration` - JWT validation
- `token-management` - CRUD operations
- `docker-deployment` - Container orchestration
- `postgresql-infrastructure` - Database backend

## Impact Summary

**Breaking Changes**: None - fully backward compatible
**New Capabilities**:
- Encrypted token storage
- Audit logging
- Reusable middleware package
- Token rotation

**Migration Path**: Env var → PostgreSQL → Infisical (transparent code changes)

---

**Spec Version**: 1.0
**Last Updated**: 2025-11-08
