# Implementation Tasks: MCP OAuth Strategy & SOP

**Change ID**: `implement-mcp-oauth-strategy-and-sop`
**Total Tasks**: 45
**Phases**: 4 (Sequential with parallel subtasks possible)

---

## Path Reference Guide

**IMPORTANT**: Paths are relative to portfolio root. Expand based on environment:
- **LOCAL**: `/Users/davidkellam/workspace/portfolio/` (where you're editing)
- **DROPLET**: `/root/portfolio/` (where container runs)

Examples:
- `LOCAL: /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts`
- `DROPLET: /root/portfolio/integrations/mcp/servers/coda/src/http-server.ts`

All tasks reference relative paths; prefix with appropriate base path above.

---

## Progress Status

**Last Updated**: 2025-11-08 (Session with Agent)

**Phase 1 Status**:
- ✅ **1.1.1-1.1.3**: Partially implemented (Bearer token works, Cloudflare JWT NOT validated yet)
- ⚠️ **1.1.4-1.1.5**: Incomplete (middleware applied but JWT validation missing)
- ⚠️ **1.2.1-1.2.4**: Wrong env var name (`API_KEY` instead of `CODA_API_TOKEN`)
- ❌ **1.3.1-1.3.2**: Legacy OAuth endpoints still present
- ⚠️ **1.4.1-1.4.2**: Health check exists but incomplete auth status
- ⚠️ **1.5.1-1.5.5**: Partial testing (Bearer token works, Cloudflare JWT testing needed)

**Issues Found**:
1. `src/config.ts` reads `process.env.API_KEY` but docker-compose likely sets `CODA_API_TOKEN`
2. `/oauth/*` endpoints still exist (should be removed per proposal)
3. Cloudflare Access JWT validation not implemented (only Bearer token works)
4. Documentation bloat: 24 markdown files in root (should be archived)

---

---

## Phase 1: Coda MCP with Cloudflare Access + Env Var (Week 1)

### Section 1.1: Update Coda MCP Auth Middleware

- [x] ⚠️ **1.1.1 Read Cloudflare Access JWT header** (`cf-access-jwt-assertion`)
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/middleware/cloudflare-access-auth.ts`
  - **File** (DROPLET): `/root/portfolio/integrations/mcp/servers/coda/src/middleware/cloudflare-access-auth.ts`
  - **Status**: Partially done - Bearer token extraction works, JWT header extraction incomplete
  - **Remaining**: Implement middleware to extract and validate JWT
  - **Acceptance**: Middleware exports `validateCloudflareAccess()` function

- [ ] 1.1.2 Validate JWT signature using Cloudflare public keys
  - **Task**: Use `@cloudflare/access` npm package (or similar) to validate signature
  - **Status**: NOT STARTED
  - **Acceptance**: JWT validation returns user email from `cf-access-authenticated-user-email`

- [x] 1.1.3 Implement fallback for local development
  - **Task**: Allow Bearer token authentication when JWT not present
  - **Status**: ✅ DONE - Bearer token fallback implemented (line 200 in http-server.ts)
  - **Acceptance**: Health check passes with Bearer token in dev mode ✅

- [x] ⚠️ **1.1.4 Add middleware to HTTP server**
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts`
  - **File** (DROPLET): `/root/portfolio/integrations/mcp/servers/coda/src/http-server.ts`
  - **Status**: Partially done - Bearer token middleware applied, JWT validation incomplete
  - **Remaining**: Complete Cloudflare JWT validation
  - **Acceptance**: Unauthenticated requests return 401 (partial - Bearer token only)

- [ ] **1.1.4a CRITICAL: Refactor middleware to separate user auth from service token**
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/middleware/auth-middleware.ts` (NEW)
  - **File** (DROPLET): `/root/portfolio/integrations/mcp/servers/coda/src/middleware/auth-middleware.ts` (NEW)
  - **Problem**: Current implementation conflates user's Bearer token with CODA_API_TOKEN
    - User provides Bearer/JWT for authentication (proves who they are)
    - Service needs CODA_API_TOKEN for Coda API access (what to use)
    - These are TWO DIFFERENT tokens, not the same!
  - **Solution**: Create unified `createAuthMiddleware()` that:
    1. Validates user auth (JWT or Bearer) → `req.user.email`
    2. Resolves service token (env/postgres/infisical) → `req.serviceToken`
    3. Passes both to handlers
  - **Status**: ✅ ARCHITECTURE DESIGNED - Code created at `/archive/integrations/mcp/servers/coda/src/middleware/auth-middleware.ts`
  - **Remaining**:
    - Integrate new middleware into http-server.ts
    - Remove old `bearerTokenMiddleware` and `cloudflareAccessMiddleware`
    - Update handlers to use `req.serviceToken` instead of user's Bearer token
    - Test with both Bearer token and Cloudflare JWT
  - **Why It Matters**:
    - Phase 1 → Phase 2 migration: Change `tokenStore: 'env'` to `tokenStore: 'postgres'` (handlers unchanged)
    - Enables encryption/decryption without handler knowledge
    - Single point of token resolution (easier to audit, test, secure)
  - **Reference**: `/archive/integrations/mcp/servers/coda/MIDDLEWARE_REFACTOR_NOTES.md`
  - **Acceptance**:
    - `req.user.email` populated from JWT/Bearer validation
    - `req.serviceToken` resolved from env (Phase 1)
    - Handlers use `req.serviceToken` for Coda API calls
    - All tests pass with both auth methods

- [x] ⚠️ **1.1.5 Update error handling for auth failures**
  - **Status**: Partially done - Generic 401 returned, need specific error messages
  - **Remaining**: Add clear error messages for each auth failure type
  - **Acceptance**: Error messages logged to stdout

### Section 1.2: Environment Variable Configuration

- [x] ⚠️ **1.2.1 Add `CODA_API_TOKEN` to docker-compose.yml**
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/infra/mcp-servers/docker-compose.yml`
  - **File** (DROPLET): `/root/portfolio/infra/mcp-servers/docker-compose.yml`
  - **Status**: ⚠️ PARTIAL - env var added as `API_KEY` but should be `CODA_API_TOKEN`
  - **Remaining**: Rename `API_KEY` → `CODA_API_TOKEN` in docker-compose
  - **Acceptance**: Env var accessible in container via `process.env.CODA_API_TOKEN`

- [ ] 1.2.2 Create .env.example template
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/infra/mcp-servers/.env.example`
  - **File** (DROPLET): `/root/portfolio/infra/mcp-servers/.env.example`
  - **Task**: Add placeholder for `CODA_API_TOKEN`
  - **Status**: NOT STARTED
  - **Acceptance**: File includes comment: `# Get from: https://coda.io/account/settings/api`

- [x] ⚠️ **1.2.3 Load token in config**
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/config.ts`
  - **File** (DROPLET): `/root/portfolio/integrations/mcp/servers/coda/src/config.ts`
  - **Status**: ⚠️ WRONG - Reads `process.env.API_KEY` instead of `CODA_API_TOKEN`
  - **Remaining**: Change `API_KEY!` → `CODA_API_TOKEN!` in config.ts
  - **Acceptance**: Config module exports token or throws error if missing

- [ ] 1.2.4 Update docker-compose comments
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/infra/mcp-servers/docker-compose.yml`
  - **File** (DROPLET): `/root/portfolio/infra/mcp-servers/docker-compose.yml`
  - **Task**: Document authentication approach in compose file
  - **Status**: NOT STARTED
  - **Acceptance**: Comments explain JWT validation flow

### Section 1.3: Remove Mock OAuth Endpoints

- [ ] ❌ **1.3.1 Remove `/oauth/*` endpoints from Coda MCP**
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts`
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/auth/oauth-routes.ts`
  - **File** (DROPLET): `/root/portfolio/integrations/mcp/servers/coda/src/http-server.ts`
  - **File** (DROPLET): `/root/portfolio/integrations/mcp/servers/coda/src/auth/oauth-routes.ts`
  - **Status**: ❌ NOT DONE - All OAuth endpoints still present (lines 110-165, 342-353 in http-server.ts)
  - **Task**: Delete obsolete OAuth endpoints (register, authorize, token, userinfo, introspect)
  - **Acceptance**: Only `/mcp`, `/health`, `/status` endpoints remain

- [ ] 1.3.2 Archive OAuth code
  - **Location** (LOCAL): `/Users/davidkellam/workspace/portfolio/archive/mcp-servers-coda-oauth-v1.0.12/`
  - **Location** (DROPLET): `/root/portfolio/archive/mcp-servers-coda-oauth-v1.0.12/`
  - **Task**: Move removed code to archive
  - **Status**: NOT STARTED
  - **Acceptance**: Archive includes commit hash reference

### Section 1.4: Update Health Check

- [x] ⚠️ **1.4.1 Update health endpoint to validate auth**
  - **File** (LOCAL): `/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda/src/http-server.ts`
  - **File** (DROPLET): `/root/portfolio/integrations/mcp/servers/coda/src/http-server.ts`
  - **Task**: Add JWT validation test to health check
  - **Status**: ⚠️ PARTIAL - Health endpoint exists but incomplete auth info
  - **Remaining**: Add auth method and token storage status to response
  - **Acceptance**: Health check endpoint returns:
    ```json
    {
      "status": "ok",
      "service": "coda-mcp",
      "auth": "cloudflare-access",
      "token_storage": "environment"
    }
    ```

- [x] ⚠️ **1.4.2 Test health endpoint without JWT**
  - **Task**: Verify returns 401 when JWT missing
  - **Status**: ⚠️ PARTIAL - Works with Bearer token, needs JWT testing
  - **Remaining**: Test with invalid/missing Cloudflare JWT
  - **Acceptance**: `curl -s https://coda.bestviable.com/health` returns 401 (Cloudflare JWT required)

### Section 1.5: Phase 1 Testing

- [x] ⚠️ **1.5.1 Test unauthenticated requests (should fail)**
  - **Command**: `curl -s https://coda.bestviable.com/mcp`
  - **Status**: ⚠️ PARTIAL - Returns 401 but only tested with Bearer token absence
  - **Remaining**: Test with missing Cloudflare JWT
  - **Acceptance**: Returns 401 Unauthorized

- [ ] 1.5.2 Test authenticated requests (should succeed)
  - **Task**: Request with valid Cloudflare Access JWT
  - **Status**: NOT STARTED
  - **Acceptance**: Request proxied through coda.io API successfully

- [x] ✅ **1.5.3 Test Bearer token fallback (dev mode)**
  - **Command**: `curl -H "Authorization: Bearer pat_xxx" http://localhost:8085/mcp`
  - **Status**: ✅ VERIFIED - Works with Bearer token in dev/local mode
  - **Acceptance**: Works without Cloudflare Access ✅

- [x] ⚠️ **1.5.4 Test health endpoint**
  - **Command**: `curl https://coda.bestviable.com/health`
  - **Status**: ⚠️ PARTIAL - Returns 200 but incomplete auth status
  - **Remaining**: Verify auth method field populated
  - **Acceptance**: Returns 200 with auth status (needs verification)

- [x] ⚠️ **1.5.5 Verify Docker container logs**
  - **Task**: Check for auth validation messages
  - **Status**: ⚠️ PARTIAL - Generic auth logging exists, needs detail
  - **Remaining**: Add specific "JWT validated" or "Bearer token authenticated" messages
  - **Acceptance**: Logs show auth validation details

- [ ] 1.5.6 Verify `/mcp` command recognizes Coda server
  - **Command**: `claude /mcp`
  - **Status**: NOT STARTED (blocked on token management fix)
  - **Acceptance**: Output shows `coda: https://coda.bestviable.com/mcp - Operational ✅`

---

## Phase 2: Reusable Auth Middleware & PostgreSQL (Week 2-3)

### Section 2.1: Create NPM Package Structure

- [ ] 2.1.1 Scaffold `@bestviable/mcp-auth-middleware` package
  - **Location**: `/integrations/npm-packages/mcp-auth-middleware/`
  - **Task**: Create directory structure with package.json
  - **Acceptance**: `npm install --save-dev typescript` works

- [ ] 2.1.2 Configure TypeScript
  - **File**: `tsconfig.json`
  - **Task**: Set up compilation to `dist/` folder
  - **Acceptance**: `npm run build` produces compiled JavaScript

- [ ] 2.1.3 Set up build pipeline
  - **File**: `package.json` scripts
  - **Task**: Add `build`, `test`, `lint` scripts
  - **Acceptance**: All scripts execute without errors

- [ ] 2.1.4 Initialize git and npm
  - **Task**: Create .gitignore, README.md, LICENSE
  - **Acceptance**: Package ready for `npm install` in other projects

### Section 2.2: Cloudflare Access Validator

- [ ] 2.2.1 Create JWT validation module
  - **File**: `src/validators/cloudflare-access.ts`
  - **Task**: Implement `validateCloudflareAccessJWT()` function
  - **Task**: Cache public keys locally to avoid repeated fetches
  - **Acceptance**: Function validates and returns user email

- [ ] 2.2.2 Implement Bearer token fallback
  - **File**: `src/validators/bearer-token.ts`
  - **Task**: Implement `validateBearerToken()` for dev/test mode
  - **Acceptance**: Extracts token from `Authorization: Bearer` header

- [ ] 2.2.3 Create unified auth validator
  - **File**: `src/validators/index.ts`
  - **Task**: Export both validators with clear error messages
  - **Acceptance**: Single entry point for validation logic

### Section 2.3: Token Encryption

- [ ] 2.3.1 Implement encryption utilities
  - **File**: `src/encryption/index.ts`
  - **Task**: Implement AES-256-GCM encrypt/decrypt
  - **Task**: Use environment variable for encryption key
  - **Acceptance**: Round-trip encryption/decryption works

- [ ] 2.3.2 Add encryption key generation
  - **File**: `src/encryption/key-generation.ts`
  - **Task**: Auto-generate key if `MCP_AUTH_ENCRYPTION_KEY` not set
  - **Task**: Persist key for reproducibility
  - **Acceptance**: Same plaintext always produces same ciphertext after restart

- [ ] 2.3.3 Write encryption unit tests
  - **File**: `src/encryption/__tests__/encrypt.test.ts`
  - **Task**: Test various key sizes, inputs, edge cases
  - **Acceptance**: 100% coverage for encryption module

### Section 2.4: PostgreSQL Schema & Connection

- [ ] 2.4.1 Design database schema
  - **File**: `docs/schema.sql`
  - **Task**: Create tables:
    - `services` (id, name, created_at)
    - `tokens` (id, service_id, key, encrypted_value, created_at, updated_at)
    - `audit_log` (id, service_id, action, user_email, timestamp)
  - **Acceptance**: Schema includes indexes and constraints

- [ ] 2.4.2 Create migration script
  - **File**: `scripts/init-mcp-auth-db.sh`
  - **Task**: Connect to local postgres and create schema
  - **Acceptance**: Script runs without errors on fresh database

- [ ] 2.4.3 Implement PostgreSQL connection pool
  - **File**: `src/postgres/connection.ts`
  - **Task**: Use `pg` npm package with connection pooling
  - **Task**: Support env vars: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
  - **Acceptance**: Pool created with min=2, max=10 connections

- [ ] 2.4.4 Write connection tests
  - **File**: `src/postgres/__tests__/connection.test.ts`
  - **Task**: Test connection, query execution, error handling
  - **Acceptance**: Tests pass against local postgres

### Section 2.5: Token CRUD Operations

- [ ] 2.5.1 Implement getToken()
  - **File**: `src/postgres/token-store.ts`
  - **Task**: Query `tokens` table, decrypt value, return plaintext
  - **Signature**: `async getToken(serviceName: string, key: string): Promise<string | null>`
  - **Acceptance**: Returns original plaintext, null if not found

- [ ] 2.5.2 Implement setToken()
  - **Task**: Encrypt value, insert/update in `tokens` table
  - **Signature**: `async setToken(serviceName: string, key: string, value: string): Promise<void>`
  - **Acceptance**: Token persists and can be retrieved

- [ ] 2.5.3 Implement deleteToken()
  - **Task**: Delete from `tokens` table
  - **Signature**: `async deleteToken(serviceName: string, key: string): Promise<void>`
  - **Acceptance**: Subsequent getToken() returns null

- [ ] 2.5.4 Implement rotateKey()
  - **Task**: Update key for all tokens in service (decrypt → re-encrypt with new key)
  - **Signature**: `async rotateKey(oldKey: string, newKey: string): Promise<number>`
  - **Acceptance**: Returns count of rotated tokens

- [ ] 2.5.5 Implement audit logging
  - **Task**: Insert into `audit_log` for all token operations
  - **Acceptance**: Audit table has entries: `service_id`, `action`, `user_email`, `timestamp`

- [ ] 2.5.6 Write token store unit tests
  - **File**: `src/postgres/__tests__/token-store.test.ts`
  - **Task**: Test all CRUD operations, encryption round-trip, audit log
  - **Acceptance**: 95%+ coverage

### Section 2.6: Express Middleware Factory

- [ ] 2.6.1 Create middleware factory
  - **File**: `src/middleware/create-auth-middleware.ts`
  - **Task**: Export `createAuthMiddleware(config)` function
  - **Task**: Support configuration:
    ```typescript
    {
      mode: 'cloudflare' | 'bearer' | 'both',
      tokenStore: 'env' | 'postgres',
      serviceName: string,
      encryptionKey?: string
    }
    ```
  - **Acceptance**: Middleware validates JWT or Bearer token

- [ ] 2.6.2 Update Coda MCP to use middleware
  - **File**: `/integrations/mcp/servers/coda/src/http-server.ts`
  - **Task**: Replace local auth code with middleware import
  - **Acceptance**: Coda MCP still works with same behavior

### Section 2.7: Migration Script

- [ ] 2.7.1 Create env-to-postgres migration
  - **File**: `scripts/migrate-env-to-postgres.sh`
  - **Task**: Read `CODA_API_TOKEN` from env or docker-compose.yml
  - **Task**: Insert into postgres with encryption
  - **Task**: Support dry-run mode
  - **Acceptance**: Script outputs "X tokens migrated" and verification hash

- [ ] 2.7.2 Test migration script
  - **Task**: Run against test database
  - **Task**: Verify round-trip (original token = decrypted token)
  - **Acceptance**: Dry-run completes successfully

### Section 2.8: Package Publishing

- [ ] 2.8.1 Build TypeScript to JavaScript
  - **Command**: `npm run build`
  - **Acceptance**: `dist/` folder contains .js files

- [ ] 2.8.2 Configure npm registry
  - **Task**: Set up private npm registry or monorepo setup
  - **Acceptance**: Can `npm install @bestviable/mcp-auth-middleware` in other projects

- [ ] 2.8.3 Create CHANGELOG
  - **File**: `CHANGELOG.md`
  - **Task**: Document version 1.0.0 release notes
  - **Acceptance**: Includes feature list and known limitations

### Section 2.9: Integration Testing

- [ ] 2.9.1 Test Coda MCP with postgres backend
  - **Task**: Migrate token to postgres using script
  - **Task**: Restart Coda MCP container
  - **Acceptance**: Coda MCP still works with token from postgres

- [ ] 2.9.2 Test token rotation
  - **Task**: Rotate encryption key in middleware
  - **Task**: Verify all tokens still decrypt correctly
  - **Acceptance**: No downtime during rotation

- [ ] 2.9.3 Test audit logging
  - **Task**: Check `audit_log` table for all operations
  - **Acceptance**: Entries show action, service_id, timestamp

---

## Phase 3: SOP Documentation & Template (Week 2-3)

### Section 3.1: OAuth SOP Document

- [ ] 3.1.1 Create OAUTH_SOP.md
  - **File**: `/docs/infrastructure/mcp/OAUTH_SOP.md`
  - **Sections**:
    1. Authentication Strategy (Cloudflare Access)
    2. Token Storage Options (decision matrix)
    3. Deployment Checklist for new MCPs
    4. Troubleshooting Guide
    5. Migration Guide (env → postgres → infisical)
    6. Security Best Practices
    7. Example: Complete Coda MCP implementation
  - **Acceptance**: Document is >2000 words, all sections complete

- [ ] 3.1.2 Add decision matrix
  - **Task**: Include pros/cons for each token storage option
  - **Task**: Include complexity/cost/security ratings
  - **Acceptance**: Matrix helps new MCP authors choose approach

- [ ] 3.1.3 Add deployment checklist
  - **Task**: Copy-paste checklist for new MCP deployments
  - **Acceptance**: Checklist has 15+ items, covers auth setup

### Section 3.2: Troubleshooting Runbook

- [ ] 3.2.1 Create OAUTH_TROUBLESHOOTING.md
  - **File**: `/docs/infrastructure/mcp/OAUTH_TROUBLESHOOTING.md`
  - **Issues**:
    1. JWT validation fails
    2. Token not found in postgres
    3. Encryption key mismatch
    4. Cloudflare Access misconfigured
    5. Docker network issues
  - **Acceptance**: Each issue has diagnostic commands and fixes

- [ ] 3.2.2 Add common error messages
  - **Task**: Collect actual error messages from implementation
  - **Acceptance**: Runbook includes real error output

### Section 3.3: MCP Deployment Template

- [ ] 3.3.1 Create template directory
  - **Location**: `/templates/mcp-server-template/`
  - **Structure**:
    ```
    ├── Dockerfile
    ├── docker-compose.yml
    ├── .env.example
    ├── src/
    │   ├── index.ts
    │   ├── config.ts
    │   ├── handlers/
    │   │   └── tools.ts
    │   └── middleware/
    │       └── auth.ts
    ├── scripts/
    │   ├── local-dev.sh
    │   ├── deploy-to-droplet.sh
    │   └── test.sh
    ├── README.md
    ├── package.json
    └── tsconfig.json
    ```
  - **Acceptance**: Template is fully functional and commented

- [ ] 3.3.2 Create Dockerfile template
  - **Task**: Multi-stage build, Node.js, includes auth middleware
  - **Acceptance**: Dockerfile builds without errors

- [ ] 3.3.3 Create docker-compose.yml template
  - **Task**: Includes networking, health checks, Cloudflare labels
  - **Acceptance**: Compose file uses standard patterns from Coda MCP

- [ ] 3.3.4 Create deployment scripts
  - **File**: `scripts/deploy-to-droplet.sh`
  - **Task**: SCP files, build, restart container
  - **Acceptance**: Script is idempotent and includes error handling

- [ ] 3.3.5 Create README.md for template
  - **Task**: Instructions for using template as starting point
  - **Acceptance**: New MCP authors can follow guide in <30 minutes

---

## Phase 4: Documentation Updates & Audit (Week 3)

### Section 4.1: Update MCP_SERVER_CATALOG.md

- [ ] 4.1.1 Add authentication columns
  - **File**: `/docs/architecture/integrations/mcp/MCP_SERVER_CATALOG.md`
  - **Columns**:
    - Service Name
    - Status (Deployed/Planned)
    - Location (Workers/Droplet)
    - Auth Method (Cloudflare Access/OAuth/None)
    - Token Storage (Env/PostgreSQL/KV)
    - SOP Link
  - **Acceptance**: Table includes all current MCPs

- [ ] 4.1.2 Update each MCP entry
  - **Task**: Add auth details for:
    - Coda (Cloudflare Access + Postgres)
    - GitHub Worker (OAuth + KV)
    - Memory Worker (No auth + Durable Objects)
    - Context7 Worker (No auth + KV)
  - **Acceptance**: Each entry has complete auth info

- [ ] 4.1.3 Add "New MCP Template" row
  - **Task**: Link to `/templates/mcp-server-template/`
  - **Acceptance**: New authors know where to start

- [ ] 4.1.4 Add "Last Updated" timestamp
  - **Acceptance**: Document shows update date

### Section 4.2: Find & Fix Orphaned Docs

- [ ] 4.2.1 Search for deprecated references
  - **Command**: `grep -r "phase_1_mcp\|deprecated\|old_setup" /docs /archive --include="*.md" | head -20`
  - **Task**: Identify docs referencing old MCP architecture
  - **Acceptance**: List of 5-10 files identified

- [ ] 4.2.2 Review each orphaned doc
  - **Task**: For each file, determine:
    1. Is content still relevant? (Update or archive)
    2. Does it break links? (Fix or remove)
    3. Does it conflict with SOP? (Update to reference SOP)
  - **Acceptance**: Decision made for each file

- [ ] 4.2.3 Update relevant docs
  - **Task**: Add header to docs that are outdated:
    ```markdown
    > ⚠️ **UPDATED** (2025-11-08)
    > This document describes legacy setup.
    > See [MCP OAuth SOP](/docs/infrastructure/mcp/OAUTH_SOP.md) for current approach.
    ```
  - **Acceptance**: Updated docs link to new SOP

- [ ] 4.2.4 Archive obsolete docs
  - **Task**: Move obsolete docs to `/archive/[date]-[filename].md`
  - **Acceptance**: Original location has deprecation notice + link to archive

- [ ] 4.2.5 Create DEPRECATION_NOTICES.md
  - **File**: `/docs/DEPRECATION_NOTICES.md`
  - **Task**: Index of all deprecated docs with links
  - **Task**: Explain why each was deprecated
  - **Acceptance**: Single source of truth for orphaned docs

### Section 4.3: Update Architecture Docs

- [ ] 4.3.1 Update ARCHITECTURE.md
  - **File**: `/docs/architecture/ARCHITECTURE.md`
  - **Task**: Add "MCP Authentication" section
  - **Task**: Include decision diagram
  - **Task**: Link to SOP for details
  - **Acceptance**: Diagram shows Cloudflare Access → Token Storage flow

- [ ] 4.3.2 Update CURRENT_STATE_v1.md
  - **File**: `/CURRENT_STATE_v1.md`
  - **Task**: Add section "Phase 2F: MCP OAuth Implementation"
  - **Task**: Document:
    - Current OAuth strategy
    - Token storage approach
    - Coda MCP status (working)
    - Middleware package info
    - Links to SOP and template
  - **Acceptance**: Phase 2F section complete

### Section 4.4: Create Documentation Index

- [ ] 4.4.1 Create MCP docs index
  - **File**: `/docs/infrastructure/mcp/README.md`
  - **Task**: Index all MCP-related docs:
    - OAUTH_SOP.md
    - OAUTH_TROUBLESHOOTING.md
    - MCP_SERVER_CATALOG.md
    - Template guide
    - Infisical integration (Phase 3)
  - **Acceptance**: Single entry point for MCP authors

---

## Validation Checklist

### Code Quality
- [ ] All Phase 1 code passes linting (`npm run lint`)
- [ ] All Phase 2 code has >90% test coverage
- [ ] No hardcoded tokens or secrets in code
- [ ] Encryption key properly managed (env var)

### Testing
- [ ] [ ] Unit tests: 95%+ coverage
- [ ] [ ] Integration tests: All happy paths + error cases
- [ ] [ ] Manual testing: All acceptance criteria met
- [ ] [ ] Security testing: No plaintext tokens in logs/memory

### Documentation
- [ ] [ ] SOP document complete and accurate
- [ ] [ ] Examples are copy-paste ready
- [ ] [ ] All links functional
- [ ] [ ] Orphaned docs processed

### Deployment
- [ ] [ ] Coda MCP accessible via HTTPS
- [ ] [ ] Authentication working end-to-end
- [ ] [ ] Health checks passing
- [ ] [ ] No errors in docker logs

---

**Total Estimated Time**: 13 hours engineering + 4 hours documentation
**Parallel Work**: Sections 4.2 & 4.3 can run while Phase 2 ongoing
