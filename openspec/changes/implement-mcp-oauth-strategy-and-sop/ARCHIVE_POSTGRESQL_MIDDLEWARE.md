# ARCHIVE: PostgreSQL Middleware Approach (Deprecated)

**Date Archived**: 2025-11-14
**Reason**: Replaced with Stytch OAuth 2.1 strategy in Phase 2
**Status**: SUPERSEDED - Not currently planned for implementation

---

## Overview

This document archives the original PostgreSQL middleware approach that was planned for Phase 2 of the MCP OAuth Strategy implementation. It has been superseded by a simpler, more maintainable Stytch OAuth 2.1 integration strategy.

## Why It Was Deferred

### Complexity vs Value Trade-off

**Original Approach**:
- Create custom NPM package `@bestviable/mcp-auth-middleware`
- Implement PostgreSQL schema for token storage
- Build encryption layer with AES-256-GCM
- Develop CRUD operations and token rotation
- Create migration scripts
- **Timeline**: 2-3 weeks
- **Complexity**: High (database schema, encryption, migration management)
- **Maintenance burden**: Custom middleware package requires ongoing updates

**Selected Approach (Stytch OAuth 2.1)**:
- Use Stytch managed OAuth provider
- Stytch SDK handles all token validation
- Standard RFC 8414/RFC 9728 metadata endpoints
- **Timeline**: 4-6 hours
- **Complexity**: Low (configuration and middleware integration)
- **Maintenance burden**: None (Stytch maintains OAuth compliance)

### Key Advantages of Stytch Strategy

1. **Faster Time to Market**: 4-6 hours vs 2-3 weeks
2. **OAuth 2.1 Compliance**: Automatic compliance with all RFCs (8414, 9728, 7636, 8707)
3. **PKCE Support**: Built-in PKCE for ChatGPT/Claude.ai web integration
4. **Reduced Maintenance**: Stytch handles OAuth provider responsibilities
5. **Better UX**: Single sign-on with email/social auth options
6. **Cost Effective**: Free tier supports 10,000 MAUs

## Original PostgreSQL Middleware Plan (Context)

### Phase 2 Tasks (Superseded)

**Section 2.1-2.9: Custom PostgreSQL Middleware Package**
- 30+ tasks spanning multiple weeks
- Involved creating `@bestviable/mcp-auth-middleware` NPM package
- Implemented JWT validation with `jsonwebtoken` and `jwks-rsa` libraries
- Built PostgreSQL `tokens` table with encryption support
- Developed AES-256-GCM encryption layer
- Created token CRUD operations and rotation
- Implemented migration scripts

### Why PostgreSQL Was Considered

1. **Token Persistence**: Service tokens (Coda API token) needed storage across container restarts
2. **Security**: Encryption at rest using AES-256-GCM
3. **Multi-Service Support**: Single database for multiple MCP servers
4. **Audit Trail**: Logging all token access and modifications

### What Happened to These Requirements

**Token Persistence**:
- Phase 1: Env var storage (current)
- Phase 3: PostgreSQL or Infisical (deferred to future phase after OAuth 2.1 working)

**Service Token Security**:
- Stytch OAuth 2.1 separates concerns:
  - **User Auth**: Stytch manages (OAuth tokens)
  - **Service Token**: Separate concern (Coda API token)
  - Phase 3 will handle service token storage with encryption

**Encryption Support**:
- Still planned for Phase 3 when PostgreSQL storage is needed
- Can be implemented at that time with clearer requirements

## Database Schema (Archived Reference)

Had the PostgreSQL approach been implemented, the schema would have been:

```sql
-- User sessions table
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW()
);

-- Service tokens table
CREATE TABLE tokens (
  id UUID PRIMARY KEY,
  service_id VARCHAR(100) NOT NULL,
  token_key VARCHAR(255) NOT NULL,
  encrypted_value BYTEA NOT NULL,
  iv BYTEA NOT NULL,
  auth_tag BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service_id, token_key)
);

-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  service_id VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  user_email VARCHAR(255),
  token_key VARCHAR(255),
  result VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Migration Path to Stytch

1. **Phase 2 (Current)**: Stytch OAuth 2.1 for user authentication
   - Handles ChatGPT/Claude.ai web connections
   - Bearer token fallback for Claude Code development
   - Service token still stored in env vars

2. **Phase 3 (Future)**: PostgreSQL storage for service tokens
   - When needed for multi-service token management
   - Can implement encryption at that time
   - PostgreSQL adoption will be straightforward

3. **Phase 4 (Future)**: Infisical secrets manager
   - If PostgreSQL encryption becomes insufficient
   - Centralized secrets management across infrastructure

## Decision Record

**Decision**: Use Stytch OAuth 2.1 instead of custom PostgreSQL middleware for Phase 2

**Decision Date**: 2025-11-14

**Stakeholders**:
- Architecture: David Kellam
- Implementation: Pending

**Rationale**:
1. Stytch dramatically reduces implementation time (4-6h vs 2-3w)
2. OAuth 2.1 compliance is a strategic requirement for ChatGPT/Claude.ai integration
3. Stytch free tier supports project needs (10,000 MAUs)
4. Custom middleware doesn't add value over managed solution
5. PostgreSQL storage can be added in Phase 3 when clearer requirements exist

**Alternatives Considered**:
1. **Keycloak**: Self-hosted OAuth provider
   - Rejected: Requires 2GB RAM (droplet already at 87% utilization)

2. **Auth0**: Managed OAuth provider
   - Rejected: Less generous free tier than Stytch

3. **Better-Auth**: Open-source authentication library
   - Rejected: OAuth 2.1 implementation incomplete

4. **Custom PostgreSQL Middleware**: Proposed in original design
   - Rejected: High complexity for low additional value

## How to Implement Phase 3 (If Needed)

When PostgreSQL storage becomes necessary:

1. **Create database schema** (using archived schema above)
2. **Implement encryption layer** with AES-256-GCM
3. **Create service token manager** class
4. **Add configuration option** to switch between:
   - `tokenStore: 'env'` (Phase 1)
   - `tokenStore: 'postgres'` (Phase 3)
   - `tokenStore: 'infisical'` (Phase 4)
5. **Ensure backward compatibility** with existing deployments

This deferred approach allows:
- Rapid Phase 2 completion with Stytch
- Clear database requirements from operational experience
- Time to evaluate if PostgreSQL storage is truly needed

## Related Documentation

- **Current Implementation**: `tasks.md` (Phase 2: Stytch OAuth 2.1)
- **Specification**: `specs/mcp-server-deployment/spec.md`
- **Design Document**: `design.md`
- **Proposal**: `proposal.md`

---

**Archive Status**: COMPLETE
**Review Date**: 2025-11-14
**Next Review**: After Phase 2 completion (if Phase 3 planning needed)
