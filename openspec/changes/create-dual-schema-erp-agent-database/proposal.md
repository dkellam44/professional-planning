# Change: Create Dual-Schema ERP and Agent Database

## Why

The current Postgres database has grown organically with three separate migrations (001-003) that lack clear organizational structure. Tables exist in the public schema without logical grouping, making it difficult to understand which tables serve business logic (ERP) versus agent execution state. Additionally, Coda is being deprecated as the business data source of truth, requiring a comprehensive Postgres-first ERP schema.

**Problems with current state:**
1. **No schema separation**: All tables in public schema, no clear boundary between ERP and agent concerns
2. **Coda dependency**: Business data (ventures, projects, tasks, offers, workflows) still primarily in Coda
3. **Table conflicts**: Multiple migrations have created overlapping table definitions (events, facts, execution_runs) with inconsistent columns
4. **Missing ERP tables**: Core business entities (people, organizations, projects, engagements) don't exist in Postgres
5. **Agent architecture incomplete**: Starter schema defines critical agent tables (sessions, profiles, tools, blocks) that aren't yet implemented

This change establishes Postgres as the single source of truth for both business data (ERP) and agent execution state, enabling agent-native workflows that can query business context and execution history from a unified database.

## What Changes

Create a clean, greenfield dual-schema database structure in a dedicated Postgres container:

**Infrastructure:**
- New `postgres-erp` container (separate from existing `n8n` postgres instance)
- Database name: `portfolio` (clear ownership, not tied to n8n)
- Network: `portfolio-network` (isolated from n8n concerns)
- External access: PostgREST HTTP API exposed via Cloudflare (for Tooljet, external tools)
- Internal access: Direct Postgres connection for services on portfolio-network

**Greenfield Approach:**
- Archive legacy migrations (001-003) to `migrations/deprecated/` (never used in production)
- Build fresh schema from `/Coda_to_Postgres/ERP_postgres_starter copy.sql` template
- Fix syntax error on line 123 (missing comma after profile_id)

**Schema Organization:**
- `erp` schema: 14 tables for business entities and patterns
  - Core 6: people, organizations, projects, engagements, tasks, okrs
  - Pattern 8: service_blueprints, workflows, process_templates, execution_runs, ventures, sprints, offers, deliverables
- `agent` schema: 21 tables for agent execution, memory, and configuration
  - Memory 6: client_profiles, memory_entries, memory_facts, working_state, episodes, webhook_executions
  - Operations 7: sessions, events, facts, goals, reflections, step_evaluations, artifacts
  - Config 4: profiles, tools, context_recipes, profile_tools
  - Graph/Blocks 4: graph_nodes, graph_edges, blocks, block_actions
  - Planning 3: plans, scheduler_runs, prompt_templates (moved from legacy public schema)

**Migration Files (2 new files):**
1. `001_erp_schema.sql` - Create erp schema + 14 tables with all indexes and FKs
2. `002_agent_schema.sql` - Create agent schema + 21 tables with all indexes and FKs

**New Infrastructure Components:**
1. `postgres-erp` container - Dedicated Postgres 15 instance for ERP/agent database
2. `postgrest` container - HTTP API wrapper for external database access (optional, recommended)
3. Docker Compose file: `/service-builds/postgres-erp/docker-compose.yml`
4. Cloudflare endpoint: `https://erp-db.bestviable.com` (PostgREST API)

**Future Service Development:**
- Redesigned planner-api will connect to `postgres-erp` container on portfolio-network
- Redesigned memory-gateway will connect to `postgres-erp` container on portfolio-network
- External tools (Tooljet, Retool) can use PostgREST HTTP API via Cloudflare
- All services use schema-qualified table names (erp.*, agent.*) from the start

## Impact

**Affected specs:**
- `infrastructure/postgres` - Database schema reorganization

**Affected code:**
- `/service-builds/postgres-erp/` - New directory for dedicated Postgres container
- `/service-builds/postgres-erp/migrations/` - New migrations (001-002)
- `/service-builds/postgres/migrations/` - Archive legacy 001-003 to deprecated/
- `/docs/system/architecture/SERVICE_INVENTORY.md` - Update with new postgres-erp service
- Cloudflare Tunnel config - Add erp-db.bestviable.com ingress route

**Breaking changes:**
- **BREAKING**: New separate Postgres instance (old postgres container unchanged, used only by n8n)
- **BREAKING**: Any hypothetical services using old schema will break (none exist)
- **Acceptable**: No active data, no active services, clean greenfield rebuild

**Data preservation:**
- No active data to preserve (legacy migrations never used in production)
- Optional backup recommended for safety (pg_dump before migration)
- Clean rebuild: No ALTER TABLE complexity, straightforward CREATE TABLE statements

**Resource impact:**
- **Disk**: +100MB estimated (new Postgres instance, 35 tables + indexes, PostgREST)
- **Memory**: +300MB for postgres-erp (limited to 300MB) + ~50MB for PostgREST = ~350MB total
- **Network**: New portfolio-network created, postgres-erp and postgrest join
- **Available headroom**: 2GB free memory on droplet, well within capacity
- **Performance**: Optimal (dedicated instance, all indexes designed for new schema)

**Dependencies:**
- **Postgres**: postgres:15-alpine image (same as existing, proven stable)
- **PostgREST**: postgrest/postgrest:latest (~10MB image, lightweight HTTP API)
- **Traefik**: Existing Traefik instance for routing erp-db.bestviable.com → postgrest
- **Cloudflare**: Existing tunnel, just add new ingress route
- **No new extensions needed**: pgvector optional, can add later if needed

**Deployment strategy:**
1. **Phase 0**: Create postgres-erp infrastructure (docker-compose, network), test locally
2. **Phase 1**: Deploy postgres-erp container to production, run migrations
3. **Phase 2**: Deploy PostgREST container, configure Traefik routing
4. **Phase 3**: Add Cloudflare tunnel ingress route (erp-db.bestviable.com)
5. **Phase 4**: Document schema for future service developers
6. **Timeline**: ~30-45 minutes total (15 min containers + 15 min testing + 15 min documentation)

**Future service development:**
- Redesigned services will be built against this schema from scratch
- No migration or compatibility concerns for new services
- Schema-qualified names (e.g., `agent.plans`, `erp.tasks`) required from the start

This is a foundational change that enables future agent-native workflows while establishing Postgres as the authoritative business data store.
