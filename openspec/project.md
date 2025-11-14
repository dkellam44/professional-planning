# Project Context

## Purpose

**Personal AI Memory & Control Plane** — A self-contained memory orchestration environment for personal LLM workflows, persistent memory, and agent tooling. The system centralizes memory and context across clients while keeping compute lightweight via managed services and API-based inference.

### Key Goals
- Centralize memory & context across all AI interactions (chat, agents, IDE tools)
- Maintain persistent, composable, contextual memory (profile, knowledge, episodic, working)
- Keep infrastructure lean on a 4GB DigitalOcean droplet ($24/mo) via managed services
- Enable agent workflows with tool access via MCP servers
- Provide secure external access via Cloudflare Zero Trust

## Tech Stack

### Infrastructure & Platform
- **Platform**: DigitalOcean Droplet (4GB RAM, 80GB SSD, 2vCPU, Ubuntu, $24/mo)
- **User**: `david` (non-root, sudo access) - upgraded from root on 2025-11-12
- **Container Orchestration**: Docker Compose
- **Reverse Proxy**: Traefik v3.0 (deployed 2025-11-13, replaced nginx-proxy)
  - Auto-discovery via Docker labels
  - HTTP-only routing (port 80, SSL via Cloudflare)
  - No external certificates needed
- **External Access**: Cloudflare Tunnel (token-based, zero IP exposure)
- **Secrets Management**: Environment variables, never committed to git

### Core Services
- **Automation Engine**: n8n 1.117.3 (workflow orchestration, webhooks, memory assembly)
- **Memory Orchestrator**: Archon (knowledge management, RAG, project/task tracking)
  - archon-server (FastAPI, port 8181)
  - archon-mcp (MCP server for IDE integration, port 8051)
  - archon-agents (PydanticAI agents, port 8052)
  - archon-ui (React + TanStack Query, port 3737)
- **Chat Interface**: Open WebUI (LLM chat with pre/post hooks for memory)
- **Agent Framework**: Letta (future - production agents with persistent memory)

### Data Layer
- **Primary Database**: Supabase Cloud (PostgreSQL + pgvector + storage)
  - Free tier: 500 MB database, 1 GB storage
  - Upgrade to Pro ($25/mo) when >450 MB
- **Vector Search**: pgvector extension (1536-dim OpenAI embeddings)
- **Short-term State**: Redis Cloud (free tier, 30 MB - session state, cache)
- **Content Storage**: Git (GitHub) for authoritative specs/architecture

### AI & Embeddings
- **LLM Inference**: OpenRouter / Portkey (API-based, off-droplet)
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **Agent Framework**: PydanticAI (via Archon agents service)

### MCP Servers (Model Context Protocol)
- **Primary**: Coda, GitHub, Firecrawl (HTTP-based, streamed)
- **Secondary**: Memory, Context7 (documentation)
- **Transport**: HTTP streaming (POST /mcp)
- **Auth**: Bearer tokens, Cloudflare Access service tokens

### Frontend
- **Archon UI**: React 18 + TypeScript 5 + Vite
- **State Management**: TanStack Query v5 (server state), React hooks (UI state)
- **Styling**: Tailwind CSS
- **Data Fetching**: REST APIs with ETag caching

## Project Conventions

### Code Style
- **Python**: PEP 8, type hints, FastAPI conventions
- **TypeScript**: ESLint + Prettier, strict mode enabled
- **Naming**:
  - Python: `snake_case` for functions/variables, `PascalCase` for classes
  - TypeScript: `camelCase` for variables/functions, `PascalCase` for components/types
  - Files: Kebab-case for configs, PascalCase for React components
- **Imports**: Absolute imports preferred (`@/features/...` in frontend)

### Architecture Patterns

#### Vertical Slice Architecture (Frontend)
Each feature owns its entire stack:
```
features/{feature}/
├── components/      # UI components
├── hooks/           # Query hooks & keys
├── services/        # API calls
└── types/           # TypeScript types
```

#### Service Layer Pattern (Backend)
```
python/src/server/
├── api_routes/      # HTTP endpoints (thin, delegate to services)
├── services/        # Business logic (fat, database operations)
├── models/          # Data models (Pydantic)
└── config/          # Configuration & database client
```

#### Memory Orchestration Flow
1. **Pre-prompt** (Open WebUI → n8n `/memory/assemble`):
   - Receive `{client_id, query}`
   - RAG search via Archon knowledge base
   - Retrieve profile data + recent episodes
   - Return structured context JSON
2. **Post-conversation** (Open WebUI → n8n `/memory/writeback`):
   - Extract facts → upsert to Archon
   - Summarize outcomes → create episodes
   - Optionally embed new snippets

#### Data Fetching (Frontend)
- **Query Keys**: Each feature owns factory in `hooks/use{Feature}Queries.ts`
- **Stale Times**: Use `STALE_TIMES` constants (instant/realtime/frequent/normal/rare/static)
- **Disabled Queries**: Use `DISABLED_QUERY_KEY` constant
- **Optimistic Updates**: UUID-based with nanoid, `_optimistic` flag for pending state
- **Smart Polling**: Visibility-aware, pauses when tab hidden

### Testing Strategy
- **Frontend**: Vitest + React Testing Library
  - Mock services and query patterns, not implementation
  - Test query hooks with QueryClientProvider wrapper
- **Backend**: pytest
  - Unit tests for services
  - Integration tests for API routes
- **Validation**: `openspec validate --strict` for all spec changes

### Git Workflow
- **Branching**: Feature branches from `main`
- **Commits**: Conventional commits (feat/fix/docs/refactor/test)
- **Spec Changes**: Always create proposal in `openspec/changes/` before implementation
- **Deployment**: Merge to `main` → deploy to droplet → archive spec change

### Docker Conventions
- **Network**: `app-network` (bridge) for inter-service communication
- **Health Checks**: All services expose `/health` endpoint
- **Restart Policy**: `unless-stopped` for all production services
- **Resource Limits**: Set memory limits to prevent OOM on 2GB droplet

## Domain Context

### Memory Types
| Type | Example Use | Persistence | Backend |
|------|-------------|-------------|---------|
| **Profile/Entity** | Client name, goals, preferences | Long-term | Supabase (Postgres) |
| **Knowledge Chunks** | Docs, summaries, reference data | Long-term (embedded) | Supabase (pgvector) |
| **Episodic** | Key events or decisions | Medium-term | Supabase (Postgres) |
| **Working Memory** | Active conversation/workflow state | Short-term (TTL) | Redis Cloud |

### Key Database Tables (Archon)
- `sources` - Crawled websites/documents metadata
- `documents` - Document chunks with embeddings (1536-dim vectors)
- `code_examples` - Extracted code snippets
- `archon_projects` - Project management
- `archon_tasks` - Task tracking
- `archon_settings` - Configuration + encrypted credentials
- *(Future)* Letta tables - Agent state, conversation history, tool execution logs

### Embedding Calculations
- **Per document chunk**: ~8-9 KB (6 KB embedding + 1-2 KB text + 0.5-1 KB metadata)
- **Capacity estimates**:
  - 10,000 documents ≈ 80-90 MB
  - 100,000 documents ≈ 800-900 MB (approaching free tier limit)
- **Free tier limit**: 500 MB database
- **Upgrade trigger**: Database size > 450 MB (90% capacity)

### Network & Routing
All inbound traffic flows through:
```
User → Cloudflare Zero Trust Access
     → Cloudflare Tunnel (cloudflared container)
     → nginx-proxy (auto-discovery via Docker labels)
     → Target service (n8n, archon-ui, openwebui, mcp servers)
```

Internal service-to-service calls use Docker network `app-network` (localhost-only).

## Important Constraints

### Resource Constraints
- **Droplet RAM**: 2GB total (must fit all services + OS overhead)
- **Database**: Start with Supabase free tier (500 MB)
- **Egress**: Monitor to stay within Supabase free tier (5 GB/month)
- **File Uploads**: Limited to 50 MB per file on free tier

### Security Constraints
- **No public IP exposure**: All traffic via Cloudflare Tunnel
- **Authentication**: Cloudflare Access for all admin/UI routes
- **Secrets**: Environment variables only, never in git
- **MCP Auth**: Bearer tokens, service tokens for inter-service calls
- **Zone isolation**: Restricted content cannot reference public content

### Operational Constraints
- **Inactivity pausing**: Supabase free tier pauses after 7 days inactive
  - Mitigation: n8n cron health check every 6 days
- **No WebSockets**: HTTP polling with smart intervals (ETag caching reduces bandwidth)
- **Backup strategy**: Manual exports until Pro tier (automated backups)

### Development Constraints
- **Local testing**: MacBook Pro 2012 (Ivy Bridge i7-3615QM, no AVX2)
- **Production deployment**: DigitalOcean droplet only
- **No breaking changes**: Maintain backward compatibility for deployed services

## External Dependencies

### Managed Services
- **Supabase Cloud** (supabase.co)
  - PostgreSQL 16 + pgvector + storage
  - REST API, auth, real-time subscriptions
  - Required env: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- **Redis Cloud** (redis.com)
  - Free tier: 30 MB, 30 concurrent connections
  - Session state, cache, locks
  - Required env: `REDIS_URL`
- **Cloudflare** (cloudflare.com)
  - Zero Trust Access (authentication policies)
  - Tunnel (cloudflared, token-based)
  - DNS management
  - Required env: `CF_TUNNEL_TOKEN`

### API Services
- **OpenAI** (openai.com)
  - Embeddings API: `text-embedding-3-small`
  - Required env: `OPENAI_API_KEY`
- **OpenRouter / Portkey** (optional)
  - LLM inference routing
  - Required env: `OPENROUTER_API_KEY` or `PORTKEY_API_KEY`

### Integration Services
- **Coda** (coda.io)
  - Live task/project tracking (SaaS)
  - MCP server integration
  - Required env: `CODA_API_TOKEN`
- **GitHub** (github.com)
  - Source of truth for specs/architecture
  - MCP server integration
  - Required env: `GITHUB_TOKEN`
- **Firecrawl** (firecrawl.dev)
  - Web scraping for knowledge ingestion
  - MCP server integration
  - Required env: `FIRECRAWL_API_KEY`

### Infrastructure Dependencies
- **DigitalOcean** (digitalocean.com)
  - Droplet hosting (2GB, $6/month)
  - Domain: bestviable.com
  - Required: SSH access to `tools-droplet-agents`
- **Docker Hub / GitHub Container Registry**
  - Container images for all services
  - Public images preferred, private registry for custom builds

### Monitoring & Observability
- **Docker**: `docker stats`, `docker logs` for basic monitoring
- **Health checks**: All services expose `/health` endpoints
- **Uptime**: Manual checks, future n8n scheduled workflows
- **Logs**: Container logs via `docker logs`, no centralized logging yet

## Phase Context

### Current Status
- **Phase 1**: n8n foundation + Infrastructure (COMPLETE ✅)
  - n8n 1.117.3 deployed with PostgreSQL + Qdrant
  - ~~nginx-proxy, acme-companion~~ → **Traefik v3.0** (deployed 2025-11-13)
  - Cloudflared operational
  - Droplet migrated from /root to /home/david (2025-11-12)
  - All services running, external HTTPS working via Cloudflare
  - Legacy MCP gateways deprecated (to be removed Phase 2)

- **Phase 2**: Archon + MCP Integration (IN PROGRESS 📋)
  - **Phase 2A**: Archon deployment - **COMPLETE ✅** (2025-11-12)
    - Docker images built ✅, source code deployed ✅
    - archon-server running and healthy ✅
    - archon-ui (port 3737) running and healthy ✅
    - archon-mcp (port 8051) running and healthy ✅
    - SSH accessible ✅
  - **Phase 2B**: Open WebUI + n8n integration (Week 3-4) - Ready to proceed
    - OpenWebUI deployed (0.5.0), accessible at https://openweb.bestviable.com
    - Uptime Kuma deployed for monitoring
    - Dozzle deployed for log viewing
  - **Phase 2C**: Custom MCP servers (Week 4-5) - Ready to proceed
    - Coda MCP deployed (v1.0.12), operational with Cloudflare Access auth
  - **Phase 2D**: Letta integration (Future)

### Next Actions
1. ✅ **INFRASTRUCTURE COMPLETE**: Traefik migration done, droplet cleaned up
2. ⏳ **DOCUMENTATION**: Update docs to reflect current state (in progress)
3. Document memory orchestration workflows (Phase 2B prep)
4. Begin Phase 2B: n8n → Archon integration for memory assembly/writeback

## Cost Summary

### Year 1 (Current) - Updated 2025-11-13
- DigitalOcean Droplet (4GB): $288/yr ($24/mo) - upgraded from 2GB ($6/mo) on 2025-11-06
- Domain (bestviable.com): $12/yr
- Supabase: Free tier
- Redis Cloud: Free tier
- Cloudflare: Free tier
- **Total Year 1**: $300/yr (~$25/mo)

### Year 2+ (Scaled)
- DigitalOcean Droplet (4GB): $288/yr ($24/mo)
- Domain: $12/yr
- Supabase Pro: $300/yr ($25/mo) - when database >450 MB
- Redis Cloud: Free or $60/yr ($5/mo) if needed
- Cloudflare: Free
- **Total Year 2+**: $600-660/yr (~$50-55/mo)

## Key Decisions & Trade-offs

### Managed vs Self-hosted
- **Decision**: Use managed Supabase + Redis Cloud
- **Rationale**: Self-hosting on 2GB droplet would require upgrade to 4GB ($24/mo) or 8GB ($48/mo), negating cost savings
- **Trade-off**: Vendor dependency vs operational simplicity + cost efficiency

### Archon vs Build from Scratch
- **Decision**: Integrate Archon as memory orchestration hub
- **Rationale**: Provides 80% of desired functionality out-of-box (knowledge management, RAG, MCP server, task tracking)
- **Trade-off**: Less control over internals vs faster time-to-value

### HTTP Polling vs WebSockets
- **Decision**: HTTP polling with smart intervals (visibility-aware)
- **Rationale**: Simpler infrastructure, ETag caching reduces bandwidth ~70%, fewer connection issues
- **Trade-off**: Slight latency vs simplicity + reliability

### Free Tier Limits
- **Decision**: Start with free tiers, monitor usage, upgrade when approaching limits
- **Monitoring**: Database size alerts at 400 MB (80%), egress alerts at 4 GB (80%)
- **Upgrade path**: Clear triggers (database >450 MB, egress >4 GB/month, need production stability)

## Reference Documentation

For additional context and detailed planning, see:

- **Service Specifications**: [SERVICE_INVENTORY.md](/Users/davidkellam/workspace/portfolio/docs/system/architecture/SERVICE_INVENTORY.md)

- **Deploying Services to Droplet**: [SERVICE_DEPLOYMENT_GUIDE.md](/Users/davidkellam/workspace/portfolio/docs/system/sops/SERVICE_DEPLOYMENT_GUIDE.md)
  - How to install new services to droplet
  - Architecutre Overview
  - How to Configure services between Cloudflare Zero Trust Tunnel, Nginx proxy, acme certs, and docker containers
  - Troubleshooting tips
 
- **Updating Services to Droplet**: [SERVICE_UPDATE_WORKFLOW.md](/Users/davidkellam/workspace/portfolio/docs/system/sops/SERVICE_UPDATE_WORKFLOW.md)
  - How to safely updateservices to droplet
  - How to Configure services between Cloudflare Zero Trust Tunnel, Nginx proxy, acme certs, and docker containers
  - How to test services

- **Integration Plan**: [ARCHON_INTEGRATION_PLAN_v01.md](/Users/davidkellam/workspace/portfolio/docs/architecture/integrations/archon/ARCHON_INTEGRATION_PLAN_v01.md)
  - Complete phased deployment plan (Phases 2A-2D)
  - Docker compose configurations
  - n8n workflow templates
  - Monitoring strategies and success criteria

- **Capacity Planning**: [CAPACITY_PLANNING.md](/Users/davidkellam/workspace/portfolio/docs/system/architecture/CAPACITY_PLANNING.md)
  - Database size projections and growth scenarios
  - Cost analysis and upgrade triggers
  - SQL monitoring queries

- **MCP Catalog**: [MCP_SERVER_CATALOG.md](/Users/davidkellam/workspace/portfolio/docs/system/architecture/MCP_SERVER_CATALOG.md)
  - Inventory of Model Context Protocol servers and details

- **System Architecture Spec**: [architecture-spec_v0.3.md](/Users/davidkellam/workspace/portfolio/docs/architecture/architecture-spec_v0.3.md)
  - Overview of Design and Implementation

