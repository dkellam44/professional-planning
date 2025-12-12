# Service Directory Structure & Database Architecture

**Status**: Draft for Review
**Created**: 2025-12-08
**Purpose**: Document intended directory organization and database allocation patterns for droplet services

---

## Context

### Problem Statement

As of 2025-12-08, the droplet at `/home/david/services/` contains 14+ service directories with inconsistent grouping logic:

```
/home/david/services/
├── apps/              # Mixed: openweb, dozzle, uptime-kuma, litellm (no clear organizing principle)
├── archon/            # All archon services (good grouping ✅)
├── docker/            # Core infra: postgres, qdrant, nginx legacy
├── mcp-servers/       # MCP servers (good grouping ✅)
├── memory-gateway/    # New planner system service
├── n8n/               # Standalone n8n
├── planner-api/       # New planner system service
├── postgres/          # Duplicate or misplaced?
├── traefik/           # Reverse proxy
├── valkey/            # Cache service
└── (12+ other directories)
```

**Issues:**
1. **"apps" is an antipattern**: Catch-all directory mixes unrelated services (chat interface ≠ log viewer ≠ LLM proxy)
2. **Inconsistent grouping**: Some services grouped by project (archon/), others standalone (n8n/), others dumped in "apps"
3. **No clear rules**: Where does a new service go? When to create a new directory vs add to "apps"?
4. **Unclear evolution**: Current planner change adds `memory-gateway/` and `planner-api/` as separate directories, but they're part of same system

### Historical Context

**2025-11-12 Refactor**: Migrated from `/root/` to `/home/david/` for security/FHS compliance
- **Focus**: User hierarchy and permissions (root → david user)
- **Gap**: Did not specify service sub-directory grouping logic
- **Result**: Services moved to `/home/david/services/` but internal organization ad-hoc

**Current OpenSpec Change**: `add-planner-memory-system`
- Adds Memory Gateway + Planner API (consolidated planning/scheduling/observer)
- Design groups these conceptually as "memory orchestration system"
- But physical directories are separate: `memory-gateway/` and `planner-api/`

---

## Organizing Principles

### Core Question
**"When adding a new service, where does it go?"**

### Answer: Capability-Based Grouping

Services should be grouped by **what they do** (capability/domain), not **what they are** (technology stack).

**Examples:**
- ✅ **Good**: `memory-orchestration/` contains memory-gateway, planner-api, archon (all handle memory/planning)
- ❌ **Bad**: `apps/` contains openweb, dozzle, litellm (unrelated capabilities)

**Rationale:**
1. **Mental model**: "Where's the planning service?" → `memory-orchestration/planner-api/` (clear)
2. **Co-location**: Related services share configs, compose files, documentation
3. **Future-proof**: New planner features (Observer Phase 7, RAG Phase 2) have obvious home
4. **Aligns with OpenSpec**: Change proposals naturally map to directories

---

## Recommended Directory Structure

### Capability-Based Layout (Recommended)

```
/home/david/services/
│
├── core-infra/                      # Foundation services
│   ├── traefik/                     # Reverse proxy (HTTP-only, Traefik v3.0)
│   ├── postgres/                    # Shared operational database (multi-DB)
│   ├── valkey/                      # Cache layer (Redis-compatible)
│   └── docker-compose.yml           # Core infrastructure stack
│
├── memory-orchestration/            # Memory, planning, knowledge management
│   ├── memory-gateway/              # Unified memory API (Zep + Postgres + Valkey)
│   ├── planner-api/                 # Planning/scheduling/observer (consolidated)
│   ├── archon-server/               # Knowledge RAG backend (move from archon/)
│   ├── archon-mcp/                  # MCP server for IDE integration (move from archon/)
│   ├── archon-ui/                   # Knowledge browser UI (move from archon/)
│   └── docker-compose.yml           # Memory stack
│
├── automation/                      # Workflow orchestration
│   ├── n8n/                         # n8n automation engine
│   └── docker-compose.yml
│
├── interfaces/                      # User-facing UIs
│   ├── open-webui/                  # Chat interface (rename from openweb)
│   ├── uptime-kuma/                 # Service monitoring (move from apps/)
│   └── docker-compose.yml
│
├── integrations/                    # External API integrations, MCP servers
│   ├── coda-mcp/                    # Coda MCP server (move from mcp-servers/)
│   ├── litellm/                     # LLM proxy (move from apps/)
│   └── docker-compose.yml
│
├── monitoring/                      # Observability & logging
│   ├── dozzle/                      # Docker log viewer (move from apps/)
│   └── docker-compose.yml
│
└── archive/                         # Deprecated services (keep for rollback)
    ├── nginx/                       # Legacy nginx-proxy (replaced by Traefik 2025-11-13)
    └── acme-companion/              # Legacy ACME (Cloudflare handles SSL now)
```

### Service Placement Rules

| Service | Current Location | New Location | Rationale |
|---------|------------------|--------------|-----------|
| traefik | `traefik/` | `core-infra/traefik/` | Foundation service, all traffic flows through it |
| postgres | `docker/` or `postgres/` | `core-infra/postgres/` | Shared operational database |
| valkey | `valkey/` | `core-infra/valkey/` | Shared cache layer |
| memory-gateway | `memory-gateway/` | `memory-orchestration/memory-gateway/` | Memory system component |
| planner-api | `planner-api/` | `memory-orchestration/planner-api/` | Planning system component |
| archon-* | `archon/` | `memory-orchestration/archon-*/` | Knowledge/memory management |
| n8n | `n8n/` or `docker/` | `automation/n8n/` | Workflow orchestration |
| openweb | `apps/` | `interfaces/open-webui/` | User-facing chat interface |
| uptime-kuma | `apps/` | `interfaces/uptime-kuma/` | User-facing monitoring UI |
| dozzle | `apps/` | `monitoring/dozzle/` | Observability tool |
| coda-mcp | `mcp-servers/` | `integrations/coda-mcp/` | External API integration |
| litellm | `apps/` | `integrations/litellm/` | LLM API proxy |

### New Service Decision Tree

```
When adding a new service, ask:

1. "What capability does this provide?"
   - Memory/planning/knowledge? → memory-orchestration/
   - User-facing UI? → interfaces/
   - Workflow automation? → automation/
   - External API integration? → integrations/
   - Logging/metrics? → monitoring/
   - Foundation (proxy/db/cache)? → core-infra/

2. "Is this part of an existing system?"
   - Yes (e.g., new planner Observer agent) → Add to that system's directory
   - No (e.g., new email service) → Create new capability directory

3. "When in doubt?"
   - Create a capability-specific directory (e.g., communications/)
   - DO NOT dump in "apps" or "misc"
```

---

## Database Architecture

### Shared vs Isolated Databases

**Fundamental Question**: Should each service have its own database instance, or share one?

### Recommended Pattern: Shared Postgres + Isolated Specialized DBs

#### Shared Operational Database (Postgres)

**One Postgres container, multiple databases:**

```yaml
# core-infra/postgres/docker-compose.yml
postgres:
  image: postgres:16-alpine
  container_name: postgres
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./init-scripts:/docker-entrypoint-initdb.d
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  networks:
    - docker_syncbricks
```

**Databases created via init script:**
```sql
-- core-infra/postgres/init-scripts/01-create-databases.sh
CREATE DATABASE n8n;
CREATE DATABASE bestviable_erp;
CREATE DATABASE openwebui;
CREATE DATABASE tooljet;

-- Role isolation (prevent cross-service access)
CREATE USER n8n_user WITH PASSWORD '${N8N_DB_PASSWORD}';
CREATE USER erp_user WITH PASSWORD '${ERP_DB_PASSWORD}';
CREATE USER openwebui_user WITH PASSWORD '${OPENWEBUI_DB_PASSWORD}';

GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n_user;
GRANT ALL PRIVILEGES ON DATABASE bestviable_erp TO erp_user;
GRANT ALL PRIVILEGES ON DATABASE openwebui TO openwebui_user;
```

**Logical separation:**
```
postgres:5432
├── n8n                 (n8n workflows, executions, credentials)
├── bestviable_erp      (planner, memory, ERP tables)
├── openwebui           (Open WebUI data - Phase 6)
└── tooljet             (ToolJet app configs - Phase 5)
```

**Benefits:**
- **RAM efficiency**: 1 Postgres process (~150MB) vs 4 processes (~600MB)
- **Simplified backups**: `pg_dumpall` captures everything
- **Easier upgrades**: Upgrade Postgres once, all databases benefit
- **Connection pooling**: Can add PgBouncer for optimization
- **Cost**: Fits easily within 4GB droplet budget

**Trade-offs:**
- **Blast radius**: Postgres crash affects all services (mitigated by Postgres stability)
- **Noisy neighbor**: Heavy queries could slow other services (acceptable for current scale)
- **Security**: Mitigated by separate database users (SQL-level isolation)

#### Isolated Specialized Databases

**When to use separate containers:**

| Database Type | Pattern | Rationale |
|---------------|---------|-----------|
| **Postgres** (OLTP) | Shared ✅ | Similar workloads (small queries, high availability) |
| **Qdrant** (Vector) | Isolated ✅ | Different resource profile (large embeddings, cosine similarity) |
| **Neo4j** (Graph) | Isolated ✅ | Different query patterns (multi-hop traversal, graph algorithms) |
| **Valkey** (Cache) | Shared ✅ | Lightweight, key-value only |

**Example (Phase 2 - RAG Pipeline):**
```yaml
# memory-orchestration/docker-compose.yml
qdrant:
  image: qdrant/qdrant:latest
  container_name: qdrant
  volumes:
    - qdrant_storage:/qdrant/storage
  # Specialized vector search, ~300-500MB RAM
```

**Example (Phase 3 - Graph Migration):**
```yaml
# memory-orchestration/docker-compose.yml
neo4j:
  image: neo4j:5-community
  container_name: neo4j
  volumes:
    - neo4j_data:/data
  # Specialized graph queries, ~2-4GB RAM
```

### Database Allocation Table

| Service | Database | Type | Container | Notes |
|---------|----------|------|-----------|-------|
| n8n | `n8n` | Postgres | `postgres:5432` | Workflows, executions |
| Planner API | `bestviable_erp` | Postgres | `postgres:5432` | Plans, scheduler_runs, execution_runs |
| Memory Gateway | `bestviable_erp` | Postgres | `postgres:5432` | Events, facts (shared with planner) |
| Memory Gateway | Zep Cloud | Managed API | External | Long-term memory, semantic search (Phase 1-4) |
| Memory Gateway | Valkey | Cache | `valkey:6379` | <24h TTL cache |
| Archon | Supabase | Managed Postgres | External | Knowledge chunks, projects, tasks |
| Open WebUI | `openwebui` | Postgres | `postgres:5432` | User data, chat history (Phase 6) |
| ToolJet | `tooljet` | Postgres | `postgres:5432` | App configs (Phase 5, optional) |
| RAG Pipeline | Qdrant | Vector DB | `qdrant:6333` | Document embeddings (Phase 2, deferred) |
| Graph System | Neo4j | Graph DB | `neo4j:7687` | Knowledge graph (Phase 3, deferred) |

### Industry Patterns Context

**Microservices (Database-per-Service)**
- Pattern: Each service owns its database container
- Used by: Netflix, Uber, Amazon (100s-1000s of services)
- Your fit: ❌ Overkill for 14 services on 4GB droplet

**Modular Monolith (Logical Separation)**
- Pattern: One database server, multiple schemas/databases
- Used by: GitHub (early days), Basecamp, SaaS startups (1-50 services)
- Your fit: ✅ Perfect for current phase

**Hybrid (Pragmatic)**
- Pattern: Shared operational DB, isolated specialized stores
- Used by: Medium SaaS like Notion (Postgres + S3 + custom storage)
- Your fit: ✅ Recommended for Phase 2+ (Qdrant, Neo4j)

### When to Switch to Isolated Databases

**Future triggers for separate Postgres containers:**
- **Multi-tenant SaaS** (Phase 5): Customer data isolation requirements
- **RAM abundance**: Upgrade to 8GB+ droplet ($48/mo) makes 600MB overhead acceptable
- **Service independence**: Need to deploy planner updates without touching n8n
- **Compliance**: Regulatory requirement for physical data separation

---

## Migration Plan

### Timing
**DO NOT migrate during active OpenSpec change implementation.**

Wait until `add-planner-memory-system` is complete, stable, and archived.

### Approach: Gradual Migration with Symlinks

**Phase 1: Create New Structure (Zero Downtime)**
```bash
ssh droplet

# Create new directories
mkdir -p ~/services/core-infra/{traefik,postgres,valkey}
mkdir -p ~/services/memory-orchestration/{memory-gateway,planner-api,archon-server,archon-mcp,archon-ui}
mkdir -p ~/services/automation/n8n
mkdir -p ~/services/interfaces/{open-webui,uptime-kuma}
mkdir -p ~/services/integrations/{coda-mcp,litellm}
mkdir -p ~/services/monitoring/dozzle
mkdir -p ~/services/archive/{nginx,acme-companion}

# Create symlinks (allows rollback)
ln -s ~/services/traefik ~/services/core-infra/traefik
ln -s ~/services/memory-gateway ~/services/memory-orchestration/memory-gateway
# ... (repeat for all services)
```

**Phase 2: Update Docker Compose Paths**
```yaml
# Example: memory-orchestration/docker-compose.yml
version: '3.8'

services:
  memory-gateway:
    build: ./memory-gateway  # Relative path within new structure
    # ...

  planner-api:
    build: ./planner-api
    # ...
```

**Phase 3: Test All Services**
```bash
# Verify all services reachable
curl -I https://planner.bestviable.com/health
curl -I https://memory.bestviable.com/health
curl -I https://openwebui.bestviable.com
# ... (test all 14 services)

# Check Traefik discovered all routers
ssh droplet "docker logs traefik 2>&1 | grep 'Router.*enabled'"
```

**Phase 4: Remove Symlinks, Move Permanently**
```bash
# Once confirmed stable for 1 week:
rm ~/services/core-infra/traefik  # Remove symlink
mv ~/services/traefik ~/services/core-infra/  # Move actual directory
# ... (repeat for all services)
```

**Phase 5: Update Documentation**
- `SERVICE_INVENTORY.md`: Update all "Location" fields
- `SERVICE_DEPLOYMENT_GUIDE.md`: Update directory paths
- All docker-compose.yml: Reflect new paths
- OpenSpec project.md: Update directory structure reference

### Rollback Plan
If issues arise:
```bash
# Symlinks allow instant rollback
rm ~/services/memory-orchestration/memory-gateway  # Remove symlink
ln -s ~/services/memory-gateway ~/services/memory-orchestration/memory-gateway  # Recreate

# Or revert all changes
rm -rf ~/services/{core-infra,memory-orchestration,automation,interfaces,integrations,monitoring}
# Original directories untouched, services continue running
```

---

## OpenSpec Integration

### When This Becomes Official

**After review and approval, this spec will:**
1. Be referenced in `/openspec/project.md` as canonical directory structure
2. Be included in future change proposals (e.g., "Service Location: `memory-orchestration/observer-agent/`")
3. Guide all future service deployments

### Change Archive Pattern

When `add-planner-memory-system` completes and archives, include:

```markdown
## Infrastructure Changes (2025-12-XX)

Directory Structure:
- memory-gateway/ → /home/david/services/memory-orchestration/memory-gateway/
- planner-api/ → /home/david/services/memory-orchestration/planner-api/
- Grouped with archon services per SERVICE_DIRECTORY_STRUCTURE.md
- Rationale: Unified memory/planning system, co-located for operational clarity

Database Allocation:
- Postgres database: bestviable_erp (shared with planner, memory, ERP tables)
- Zep Cloud: Long-term memory (managed, 0MB droplet footprint)
- Valkey: Cache layer (<24h TTL, shared instance)
```

### Future Changes Reference This Doc

**Example (Phase 2 - RAG Pipeline):**
```markdown
# OpenSpec Change: add-rag-document-pipeline

## Infrastructure
Service Location: memory-orchestration/qdrant/
Rationale: Vector search is memory system component (per SERVICE_DIRECTORY_STRUCTURE.md)

Database Allocation: Isolated Qdrant container
Rationale: Different resource profile than Postgres OLTP (per SERVICE_DIRECTORY_STRUCTURE.md)
```

---

## Open Questions for Review

1. **Archon grouping**: Move all archon services to `memory-orchestration/`? Or keep separate `archon/` directory?
   - **Argument for move**: Archon is knowledge/memory system, aligns with memory-orchestration
   - **Argument against**: Archon is distinct project with own compose files, easier to deprecate if separate

2. **n8n placement**: Keep in `automation/` or move to `memory-orchestration/`?
   - **Argument for automation/**: n8n serves multiple systems (not just planner)
   - **Argument for memory-orchestration/**: n8n currently only orchestrates memory/planner workflows

3. **Valkey vs Redis naming**: Keep `valkey/` name or rename to `cache/` for clarity?
   - **Argument for valkey/**: Accurate technology name
   - **Argument for cache/**: Implementation detail, could swap to Dragonfly later

4. **Directory depth**: Capability grouping adds one level (`core-infra/postgres/` vs `postgres/`). Acceptable trade-off?
   - **Argument for**: Clearer organization, worth extra `cd`
   - **Argument against**: More typing, longer paths in docker-compose

5. **Migration timing**: Wait until Phase 1-4 complete? Or migrate incrementally per phase?
   - **Recommended**: Wait for stability, migrate all at once (less churn)

---

## Success Criteria

This structure is successful if:
- ✅ New services have obvious placement (no "where should this go?" debates)
- ✅ Related services co-located (planner + memory + archon together)
- ✅ Documentation references consistent (all docs point to same paths)
- ✅ Zero downtime during migration (symlinks enable gradual rollout)
- ✅ Future OpenSpec changes reference directory structure as source of truth

---

## References

- **2025-11-12 Refactor Proposal**: `/openspec/archive/2025-11-12-refactor-personal-droplet-user-hierarchy/proposal.md`
- **Current Service Inventory**: `/docs/system/architecture/SERVICE_INVENTORY.md`
- **Planner Change Design**: `/openspec/changes/add-planner-memory-system/design.md`
- **OpenSpec Project Context**: `/openspec/project.md`

---

**Next Steps:**
1. Review this document and decide on open questions (1-5 above)
2. After approval, create OpenSpec proposal: `/openspec/changes/refactor-service-directory-structure/`
3. Implement migration after `add-planner-memory-system` archived and stable
4. Update all documentation to reference new structure
