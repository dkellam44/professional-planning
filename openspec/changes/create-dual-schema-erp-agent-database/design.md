# Design: Dual-Schema ERP and Agent Database

## Context

This change reorganizes the Postgres database from a flat public schema structure into a dual-schema architecture (`erp` and `agent`) that clearly separates business entities from agent execution state. The current database has grown through three migrations (001-003) without clear organizational principles, resulting in:

- 17 tables in public schema with mixed concerns
- Overlapping/conflicting table definitions (events, facts, execution_runs)
- Missing core business entities (people, organizations, projects, engagements)
- Incomplete agent architecture (sessions, profiles, tools not yet implemented)

The starter schema (`/Coda_to_Postgres/ERP_postgres_starter copy.sql`) provides a comprehensive template with 20 tables (6 ERP + 14 agent), but conflicts with existing tables. This design resolves those conflicts through strategic table merging while adding 14 new ERP tables.

**Stakeholders:**
- Future planner-api (redesign): Will use agent.plans, agent.sessions, erp.tasks
- Future memory-gateway (redesign): Will use agent.events, agent.facts, agent.memory_entries
- Future agent services: Will use agent.sessions, agent.profiles, agent.tools, agent.blocks

**Constraints:**
- No active data to preserve (legacy migrations never used in production)
- No existing services to maintain compatibility with (planner-api and memory-gateway being redesigned)
- Keep migration complexity minimal (2 files, greenfield approach)
- No new Postgres extensions required (pgvector can be added later if needed)

## Goals / Non-Goals

**Goals:**
1. Establish clear schema separation (erp vs agent)
2. Create clean, unified schema from starter template
3. Add 14 ERP tables to support Postgres-first business data
4. Archive legacy migrations and start fresh with greenfield approach
5. Provide comprehensive documentation for future service developers

**Non-Goals:**
- Data preservation (no active data in legacy migrations)
- Service compatibility (existing services being redesigned from scratch)
- Zero-downtime migration (no active services to keep running)
- Compatibility views (no existing services to support)
- Data migration from Coda (schema-only in this change)
- Adding new Postgres extensions (pgvector optional, can add later)

## Decisions

### Decision 1: Greenfield Approach with Clean Schema Build

**Problem:** Legacy migrations (001-003) exist but were never used in production. Conflicting table definitions exist across migrations and starter schema.

**Options Considered:**
1. **Preserve and merge**: Complex ALTER TABLE operations to extend existing tables
2. **Greenfield rebuild**: Archive legacy migrations, create fresh schema from starter template
3. **Hybrid**: Keep some tables, recreate others

**Decision:** Greenfield rebuild - archive legacy and start fresh

**Rationale:**
- No active data to preserve (legacy migrations never used)
- Starter schema is comprehensive and well-designed (6 ERP + 14 agent tables)
- Eliminates all table conflicts and inconsistencies
- Simpler implementation (clean CREATE TABLE statements, no ALTER TABLE merging)
- Faster migration execution (~2 minutes vs ~10 minutes for merge approach)
- Easier to test and validate (no row count comparisons needed)

**Trade-offs:**
- Cannot rollback to legacy schema structure (acceptable since not in use)
- All services must update queries before deployment (acceptable with service downtime)

### Decision 2: Two-File Migration Structure

**Problem:** How to organize the greenfield schema creation?

**Options Considered:**
1. **Single file**: All 35 tables in one migration (001_complete_schema.sql)
2. **Two files**: Separate ERP and agent schemas (001_erp_schema.sql + 002_agent_schema.sql)
3. **Five files**: One per table category (schemas, erp, agent-memory, agent-config, agent-blocks)

**Decision:** Two-file structure separating ERP and agent concerns

**Rationale:**
- Clear separation of business (ERP) vs execution (agent) concerns
- Can test each schema independently during development
- Easier to review (14 tables vs 21 tables in separate files)
- Natural checkpoint (can validate ERP tables before creating agent tables)
- Aligns with dual-schema architectural principle

**Trade-offs:**
- Slightly more complex than single file (but still much simpler than 5-file approach)
- Must ensure cross-schema FK references created in correct order (erp.execution_runs → agent.sessions)

### Decision 3: Cross-Schema Foreign Keys

**Problem:** ERP execution_runs should reference agent sessions, but tables in different schemas.

**Options Considered:**
1. **No FKs across schemas**: Simple but loses referential integrity
2. **Duplicate session_id without FK**: Flexible but no DB-level constraint
3. **Cross-schema FK**: `erp.execution_runs.session_id REFERENCES agent.sessions(id)`

**Decision:** Use cross-schema foreign keys

**Rationale:**
- Postgres supports cross-schema FKs natively (no performance penalty)
- Maintains referential integrity at DB level
- Models real relationship: execution runs are associated with agent sessions
- Prevents orphaned records (execution run without valid session)

**Trade-offs:**
- Slightly more complex DROP SCHEMA operations (must drop in dependency order)
- JOIN queries must specify schema names explicitly
- Need to be careful with schema drop/recreate scripts

### Decision 4: Global ID Strategy for All Major Tables

**Problem:** Starter schema includes `global_id TEXT UNIQUE` on all tables, but existing tables only have BIGSERIAL `id`.

**Options Considered:**
1. **Skip global_id**: Simpler migration, but limits future cross-system integration
2. **Add global_id to all tables**: Future-proof but adds storage overhead
3. **Add global_id only to new tables**: Inconsistent but pragmatic

**Decision:** Add global_id to all major tables (ERP + agent core tables)

**Rationale:**
- Enables future cross-system references (Zep Cloud, Neo4j graph, external APIs)
- Human-readable identifiers for debugging (`project_2024q4_eng` vs `id: 47`)
- Aligns with starter schema design philosophy
- Nullable + unique constraint allows backfilling over time
- ~30 bytes/row overhead acceptable for major entity tables

**Trade-offs:**
- Storage overhead (~30 bytes per row for TEXT + index)
- Need to generate global_id values (can use UUID or custom format)
- Additional index per table (but UNIQUE constraint provides query optimization)

### Decision 5: Use Computed Columns for Derived Values

**Problem:** `execution_runs.variance_pct` should auto-calculate from estimated vs actual hours.

**Options Considered:**
1. **Regular column**: Application calculates and stores value (data sync issues)
2. **Computed column**: Database auto-calculates using GENERATED ALWAYS AS STORED
3. **View or function**: Calculate on-demand (no storage, recalculated each query)

**Decision:** Use GENERATED ALWAYS AS STORED computed column

**Rationale:**
- Automatic calculation ensures data consistency (always accurate)
- No application logic needed (database handles it)
- Stored (not virtual) so can be indexed and filtered efficiently
- Follows existing 003 migration pattern
- Formula: `((actual_hours - estimated_hours) / estimated_hours) * 100` with NULL handling

**Trade-offs:**
- Cannot manually override variance_pct value
- Slightly more storage than view approach (but enables indexing)

### Decision 6: Separate Postgres Container with Cloudflare Exposure

**Problem:** Should ERP/agent database share existing `postgres` container (used by n8n) or use dedicated infrastructure?

**Options Considered:**
1. **Same container, new database**: Create `erp_agent` database in existing postgres container
   - Pros: Simple, no new infrastructure
   - Cons: Coupled to n8n, can't expose separately, naming confusion

2. **Same container, rename**: Repurpose existing postgres for ERP, deprecate n8n
   - Pros: No new infrastructure
   - Cons: Breaking change for n8n, confusing migration

3. **Separate container**: New `postgres-erp` container with dedicated database
   - Pros: Clear separation, independent scaling, selective exposure, better naming
   - Cons: Additional memory (~300MB), slightly more complex

**Decision:** Separate `postgres-erp` container with PostgREST for external access

**Rationale:**
- **Clear ownership**: `postgres-erp` container owns ERP/agent data, `postgres` container owns n8n data
- **Independent lifecycle**: Can restart, upgrade, scale postgres-erp without affecting n8n
- **External access capability**: PostgREST provides HTTP API layer for external tools (Tooljet, Retool)
- **Security**: PostgREST enforces row-level security, safer than exposing raw Postgres port
- **Resource acceptable**: ~350MB total (300MB postgres + 50MB postgrest) fits within 2GB free memory
- **Future-proof**: Dedicated infrastructure supports growth without coupling concerns

**Infrastructure Configuration:**

```yaml
# postgres-erp: Main database
- Container: postgres-erp
- Database: portfolio
- Image: postgres:15-alpine
- Network: portfolio-network (internal)
- Memory limit: 300MB
- CPU limit: 0.5 cores
- Port: 5432 (internal only, not exposed externally)

# postgrest: HTTP API wrapper (optional but recommended)
- Container: postgrest-erp
- Image: postgrest/postgrest:latest
- Network: portfolio-network + docker_proxy (internal + external via Traefik)
- Memory limit: 100MB
- CPU limit: 0.25 cores
- Exposed via: https://erp-db.bestviable.com (Traefik → Cloudflare)
```

**External Access Pattern:**
```
External Tool (Tooljet)
  → https://erp-db.bestviable.com (Cloudflare)
  → Traefik reverse proxy
  → postgrest-erp container (HTTP API)
  → postgres-erp container (direct SQL)

Internal Service (planner-api)
  → postgres-erp:5432 (direct connection on portfolio-network)
```

**Trade-offs:**
- Additional memory usage (~350MB total)
- Slightly more complex deployment (2 containers vs 1 database)
- PostgREST learning curve for external tools (but well-documented, REST API standard)
- Benefit: Clean separation, secure external access, independent scaling

## Risks / Trade-offs

### Risk 1: Foreign Key Constraint Violations

**Risk Level:** LOW
**Impact:** MEDIUM (migration fails if FK order incorrect)

**Mitigation:**
1. **Migration file order** ensures dependencies created before references:
   - 001_erp_schema.sql creates parent tables (service_blueprints, workflows, process_templates)
   - 002_agent_schema.sql creates child tables with FKs to erp schema
2. **Test migrations locally** catches FK dependency issues before production
3. **Validation script checks all FK relationships** after migration

**Residual Risk:** VERY LOW (FK order validated in local testing)

### Risk 2: Schema Syntax Errors

**Risk Level:** LOW
**Impact:** MEDIUM (migration fails mid-execution)

**Mitigation:**
1. **Fix known syntax error** in starter schema (line 123: missing comma)
2. **Validate SQL syntax** with psql --dry-run before production
3. **Test migrations on local Postgres 15** (same version as production)
4. **Rollback procedure tested** (DROP SCHEMA + recreate if needed)

**Residual Risk:** VERY LOW (syntax validation in multiple test passes)

## Migration Plan

### Phase 0: Preparation

1. **Create postgres-erp infrastructure:**
   ```bash
   mkdir -p /service-builds/postgres-erp/migrations
   mkdir -p /service-builds/postgres-erp/data
   ```

2. **Create docker-compose.yml for postgres-erp:**
   - postgres-erp service (main database)
   - postgrest-erp service (HTTP API, optional)
   - portfolio-network creation
   - Traefik labels for postgrest exposure

3. **Archive legacy migrations:**
   ```bash
   mkdir -p /service-builds/postgres/migrations/deprecated
   mv /service-builds/postgres/migrations/00{1,2,3}_*.sql /service-builds/postgres/migrations/deprecated/
   ```

4. **Create greenfield migrations:**
   - /service-builds/postgres-erp/migrations/001_erp_schema.sql (erp schema + 14 tables)
   - /service-builds/postgres-erp/migrations/002_agent_schema.sql (agent schema + 21 tables)

5. **Fix starter schema syntax error:**
   - Line 123: Add missing comma after `profile_id` field in agent.sessions table

6. **Test locally:**
   - Start postgres-erp container locally
   - Run migrations 001-002
   - Run validation script (table counts, FK checks, sample queries)
   - Test PostgREST API endpoints (if deploying PostgREST)

### Phase 1: Deploy postgres-erp Infrastructure (Production)

1. **Copy files to droplet:**
   ```bash
   scp -r /service-builds/postgres-erp droplet:/home/david/services/
   ```

2. **Deploy postgres-erp container:**
   ```bash
   ssh droplet
   cd /home/david/services/postgres-erp
   docker-compose up -d postgres-erp
   ```

3. **Verify postgres-erp started:**
   ```bash
   docker ps | grep postgres-erp
   docker logs postgres-erp | tail -20
   ```

4. **Run greenfield migrations:**
   ```bash
   docker exec -i postgres-erp psql -U erp_admin -d portfolio < migrations/001_erp_schema.sql
   docker exec -i postgres-erp psql -U erp_admin -d portfolio < migrations/002_agent_schema.sql
   ```

5. **Run validation script:**
   ```bash
   docker exec -i postgres-erp psql -U erp_admin -d portfolio < migrations/validate_schema.sql
   ```

### Phase 2: Deploy PostgREST (Optional but Recommended)

1. **Start postgrest-erp container:**
   ```bash
   docker-compose up -d postgrest-erp
   ```

2. **Verify PostgREST started:**
   ```bash
   docker ps | grep postgrest-erp
   docker logs postgrest-erp | tail -20
   ```

3. **Test PostgREST API locally:**
   ```bash
   curl http://localhost:3000/erp/people
   curl http://localhost:3000/agent/sessions
   ```

4. **Configure Traefik routing:**
   - Add labels to postgrest-erp service for erp-db.bestviable.com
   - Verify Traefik picks up route: `docker logs traefik | grep postgrest`

5. **Add Cloudflare tunnel ingress:**
   - Update Cloudflare tunnel config to route erp-db.bestviable.com → traefik
   - Test external access: `curl https://erp-db.bestviable.com/erp/people`

### Phase 3: Validation and Documentation

1. **Verify database health:**
   ```bash
   docker exec postgres-erp psql -U erp_admin -d portfolio -c "\dt erp.*"
   docker exec postgres-erp psql -U erp_admin -d portfolio -c "\dt agent.*"
   docker exec postgres-erp psql -U erp_admin -d portfolio -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema IN ('erp', 'agent');"
   # Expected: 35 tables
   ```

2. **Document schema for service developers:**
   - Update SERVICE_INVENTORY.md with postgres-erp service
   - Create DATABASE_SCHEMA.md (table purposes, relationships, examples)
   - Create SERVICE_DATABASE_INTEGRATION.md (connection patterns, code examples)

3. **Mark migration complete:**
   - postgres-erp container healthy
   - postgrest-erp accessible via Cloudflare
   - Schema validated, ready for service development

## Open Questions

None - all decisions finalized based on user input and exploration.
