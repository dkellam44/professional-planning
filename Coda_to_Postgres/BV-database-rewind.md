

  1. Architecture Positioning

  Current State:
  - Postgres Container: Already running (postgres:15-alpine) on docker_syncbricks network
  - Current Database: n8n (contains n8n workflows, planner-api tables, memory-gateway tables)
  - Coda: Authoritative source of truth (SaaS, human-editable)
  - Dual Storage Strategy: Postgres for fast queries + events; Coda for business data

  Proposed ERP Database Location:
  You have two architectural options:

  Option A: New Database in Existing Postgres Container (Recommended)

  postgres:15-alpine container
  ├── n8n (database) - existing
  │   ├── n8n workflow tables
  │   ├── planner_api tables (plans, events, scheduler_runs)
  │   └── memory_gateway tables (memories, facts)
  └── erp (database) - NEW
      ├── Pattern tables (5)
      ├── Operations tables (ventures, projects, tasks, sprints)
      ├── Client tables (offers, engagements, deliverables)
      ├── Finance tables (expenses, invoices, KPIs)
      └── Knowledge tables (daily_thread, decisions, experiments)

  Pros:
  - Minimal infrastructure change
  - Shared connection pooling
  - Cross-database queries possible (via foreign data wrappers if needed)
  - Fits within current 4GB RAM footprint

  Cons:
  - Mixed concerns (workflow engine data + business data)

  Option B: Separate Postgres Container for ERP

  docker_syncbricks network:
  ├── postgres (existing) - n8n, planner, memory
  └── postgres-erp (new) - dedicated ERP database

  Pros:
  - Clear separation of concerns
  - Independent scaling/backup strategies
  - Can use different Postgres versions/extensions if needed

  Cons:
  - +150MB RAM usage (tighter on 4GB droplet)
  - More complex cross-service queries

  ---
  2. Data Model Considerations

  Coda Schema → Postgres Translation:

  The Coda schema has 36 tables. For Postgres, I'd recommend:

  Phase 1: Core Operational Tables (~15 tables)

  Why these first: Critical for daily operations, high query frequency
  -- Pattern Layer (5 tables - highest value)
  service_blueprints
  workflows
  process_templates
  resource_templates
  execution_runs  -- CRITICAL for pattern learning

  -- Operations Core (4 tables)
  ventures
  projects
  tasks
  sprints

  -- People & Orgs (2 tables)
  people
  organizations

  -- Client Management (4 tables)
  offers
  engagements
  deliverables
  results

  Phase 2: Finance & Knowledge (~10 tables)

  -- Finance
  expenses, invoices, payments, deals

  -- Knowledge
  daily_thread, decision_journal, experiments, notebook, prompt_library, assets

  Phase 3: Strategic & Analytics (~11 tables)

  -- Planning
  okrs, kpis, finance_snapshot, outcome_types, functional_areas, topics

  -- Communication & Scoring
  touchpoints, icp_segments, icp_scoring, ideas_inbox, template_performance

  Key Differences from Coda:
  1. Computed Relationships → Database Views
    - Coda: Sprint computes tasks via formula
    - Postgres: Create view or materialized view for performance
  2. Foreign Keys → Proper Constraints
    - Coda: Soft references via table IDs
    - Postgres: Hard FK constraints with cascade rules
  3. Type Safety
    - Coda: Text-based enums
    - Postgres: ENUMs or CHECK constraints for status fields

  ---
  3. Integration with Existing Services

  How ERP Database Connects:

  ┌─────────────────────────────────────────────────────────┐
  │                  Coda (SaaS - Source of Truth)          │
  │              (Human editing, manual data entry)          │
  └────────────────────┬────────────────────────────────────┘
                       │
                       │ Coda API (via Coda MCP)
                       ↓
          ┌────────────────────────────────┐
          │    n8n Workflows               │
          │  (Sync Orchestration)          │
          └─────┬──────────────────────────┘
                │
                ├─→ Sync to Postgres ERP (read-heavy queries)
                ├─→ Trigger planner-api (when tasks created)
                └─→ Log to memory-gateway (execution runs)
                       │
                       ↓
          ┌────────────────────────────────┐
          │  Postgres ERP Database         │
          │  - Fast queries                │
          │  - Pattern analytics           │
          │  - Execution run telemetry     │
          └────────────────────────────────┘
                       │
                       ↓
          ┌────────────────────────────────┐
          │  Services (Query ERP Data)     │
          │  - planner-api                 │
          │  - memory-gateway              │
          │  - Open WebUI (via MCP)        │
          │  - n8n workflows               │
          └────────────────────────────────┘

  Sync Strategy:
  - Coda → Postgres: Write when data changes (via n8n webhooks)
  - Postgres → Coda: Read-only (Coda is authoritative)
  - Conflict Resolution: Coda always wins

  ---
  4. Service Access Patterns

  Who Needs Access:

  | Service        | Access Type | Use Case                                     | Priority |
  |----------------|-------------|----------------------------------------------|----------|
  | n8n            | Read/Write  | Sync from Coda, orchestrate workflows        | High     |
  | planner-api    | Read        | Query workflows/templates for SOP generation | High     |
  | memory-gateway | Write       | Store execution_runs telemetry               | Medium   |
  | coda-mcp       | Read        | Allow IDE queries of ERP data                | Low      |
  | Open WebUI     | Read        | Context enrichment via MCP                   | Low      |

  Connection Pattern:
  All services already connect to Postgres via connection pooling, so adding an erp database
  is straightforward:

  # Example: planner-api connection
  DATABASE_URL = f"postgresql://{user}:{password}@postgres:5432/erp"

  ---
  5. Deployment Approach

  Migration Path:

  # 1. Create new database in existing Postgres container
  ssh droplet
  docker exec -it postgres psql -U n8n -c "CREATE DATABASE erp;"

  # 2. Apply schema migrations (via Alembic or raw SQL)
  docker exec -i postgres psql -U n8n -d erp < /path/to/schema.sql

  # 3. Update service environment variables
  # In planner-api, memory-gateway .env:
  POSTGRES_ERP_DB=erp  # New connection string

  # 4. Deploy sync workflows in n8n
  # - Coda webhook → n8n → Postgres upsert

  Schema Management:
  - Use Alembic (Python) for migrations
  - Store schema files in /service-builds/erp-database/migrations/
  - Version control all schema changes

  ---
  6. Key Design Decisions Needed

  Before creating an OpenSpec proposal, you need to decide:

  A. Database Location
  - Option A: New database in existing Postgres container
  - Option B: Separate Postgres container for ERP

  B. Sync Strategy
  - Real-time sync (Coda webhook → immediate Postgres write)
  - Batch sync (n8n cron job every 5/15/60 minutes)
  - Hybrid (critical tables real-time, others batch)

  C. Schema Scope
  - Phase 1 only (15 core tables)
  - Full schema (36 tables)
  - Custom subset (which tables?)

  D. Query vs. Operational
  - Read-only mirror of Coda (query optimization)
  - Operational database with Coda sync (bi-directional)

  E. Execution Runs Storage
  - Store in Postgres ERP (fast pattern analytics)
  - Store in memory-gateway Postgres (events model)
  - Both (redundant but decoupled)

  ---
  7. Recommendations

  Based on your current architecture:

  1. Option A (new database in existing container) - simpler, fits your lean infrastructure
  philosophy
  2. Phase 1 scope (15 core tables) - start with high-value pattern tables + operations
  3. Hybrid sync - Real-time for tasks/execution_runs, batch for finance/knowledge tables
  4. Read-mostly pattern - Coda remains authoritative, Postgres for fast queries
  5. Execution Runs in ERP - Closer to pattern tables for analytics

  Next Steps:
  1. Confirm the 5 design decisions above
  2. I'll create an OpenSpec proposal with:
    - Postgres schema DDL (tables, indexes, constraints)
    - n8n sync workflows (Coda → Postgres)
    - Service integration updates (planner-api, memory-gateway)
    - Migration plan and rollback strategy

  Does this align with your vision? Which options would you like me to use for the OpenSpec
  proposal?