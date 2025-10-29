---
- entity: state_snapshot
- level: operational
- zone: internal
- version: v01
- tags: [infrastructure, droplet, syncbricks, deployment, state]
- source_path: /docs/infrastructure/droplet_state_2025-10-28.md
- date: 2025-10-28
---

# Droplet Production State — 2025-10-28

**Purpose**: Point-in-time snapshot of production infrastructure for change tracking and operational reference.

**Status**: ✅ OPERATIONAL (verified 2025-10-28)

---

## Deployment Summary

**Timeline**:
- Initial deployment: 2025-10-26
- Configuration refinements: 2025-10-27 to 2025-10-28
- Status verification: 2025-10-28 (session handoff)

**Deployment Method**:
- Manual `scp` of `docker-compose.production.yml` to droplet
- Environment variables via `.env` file (not in repo)
- Started with: `docker compose -f docker-compose.production.yml up -d`

**Infrastructure Pattern**: SyncBricks
- Auto-discovery reverse proxy (nginx-proxy)
- Automatic SSL certificate management (acme-companion)
- Secure connectivity via Cloudflare Tunnel (token-based)
- Two-network isolation for security (proxy + syncbricks)

**Droplet Details**:
- Provider: DigitalOcean
- IP: 159.65.97.146
- Hostname: tools.bestviable.com (via Cloudflare DNS)
- OS: Ubuntu (Docker host)

---

## Service Inventory

### 1. nginx-proxy
**Image**: `nginxproxy/nginx-proxy:latest`
**Container**: `nginx-proxy`
**Status**: Running
**Purpose**: Reverse proxy with automatic service discovery via Docker socket monitoring.

**What it does for beginners**: Acts as a "traffic director" that automatically routes web requests to the right service based on domain names. When you add a new service with a `VIRTUAL_HOST` label, nginx-proxy automatically configures itself—no manual config files needed.

**Networks**: proxy
**Ports**: 80 (HTTP), 443 (HTTPS)
**Key Config**:
- `TRUST_DOWNSTREAM_PROXY=true` (trusts Cloudflare Tunnel as TLS terminator)
- Monitors `/var/run/docker.sock` for new services

---

### 2. acme-companion
**Image**: `nginxproxy/acme-companion:latest`
**Container**: `acme-companion`
**Status**: Running
**Purpose**: Automatic SSL certificate management for all services.

**What it does for beginners**: Like nginx-proxy, this watches Docker for new services. When it sees one with a `LETSENCRYPT_HOST` label, it automatically requests an SSL certificate from Let's Encrypt (a free certificate authority) and renews it before expiration. This gives you the "🔒 secure" padlock in browsers without manual certificate management.

**Networks**: proxy
**Key Config**:
- Works alongside nginx-proxy
- Certificates stored in `./certs` volume
- Auto-renewal every 60 days

---

### 3. cloudflared
**Image**: `cloudflare/cloudflared:latest`
**Container**: `cloudflared`
**Status**: Running
**Purpose**: Cloudflare Tunnel client for secure external access.

**What it does for beginners**: Creates an outbound-only connection from your droplet to Cloudflare's network. This means your droplet doesn't need any open firewall ports—it "phones home" to Cloudflare, and Cloudflare routes public traffic through that secure tunnel. This eliminates IP exposure and simplifies firewall management.

**Networks**: proxy
**Tunnel Token**: Set via `CF_TUNNEL_TOKEN` environment variable
**DNS**: `*.bestviable.com` → Cloudflare Tunnel → nginx-proxy

---

### 4. postgres
**Image**: `postgres:15-alpine`
**Container**: `postgres`
**Status**: Running (healthy)
**Purpose**: PostgreSQL database for n8n workflow persistence.

**What it does for beginners**: A database that stores all of n8n's configuration, workflows, execution history, and credentials. Using PostgreSQL (instead of SQLite) allows for better performance and reliability in production.

**Networks**: syncbricks (backend only—not accessible from internet-facing services)
**Database**: `n8n` (single database for all n8n data)
**User**: `n8n`
**Volumes**: `./data/postgres` (persistent storage)
**Health Check**: `pg_isready -U n8n` every 10 seconds

---

### 5. qdrant
**Image**: `qdrant/qdrant:latest`
**Container**: `qdrant`
**Status**: Running (healthy)
**Purpose**: Vector database for semantic search and AI embeddings.

**What it does for beginners**: A specialized database that stores "vectors" (mathematical representations of text/data). This enables semantic search—finding similar content based on meaning rather than exact keyword matches. Useful for AI applications like RAG (Retrieval Augmented Generation) where you want to find relevant context for LLM queries.

**Networks**: syncbricks (backend only)
**Volumes**: `./data/qdrant` (storage), `./data/qdrant/snapshots` (backups)
**API Key**: Set via `QDRANT_API_KEY` environment variable
**Health Check**: Verifies raft_state.json exists every 30 seconds

---

### 6. n8n
**Image**: `n8nio/n8n:latest`
**Container**: `n8n`
**Status**: Running (healthy)
**Purpose**: Low-code workflow automation platform (the "integration fabric").

**What it does for beginners**: n8n is like Zapier or IFTTT but self-hosted. It connects different services together with visual workflows. For this system, n8n will eventually handle bidirectional sync between GitHub (specs/docs) and Coda (operational data), plus other automations like triggering updates when PRs merge.

**Networks**: proxy (for web UI), syncbricks (for database access)
**Ports**: 127.0.0.1:5678:5678 (localhost only), plus HTTPS via nginx-proxy
**External URL**: https://n8n.bestviable.com ✅ Verified accessible
**Database**: postgres (via `DB_POSTGRESDB_HOST=postgres`)

**Key Configuration**:
- `N8N_PROTOCOL=https` (tells n8n it's behind HTTPS proxy)
- `HTTPS_METHOD=noredirect` (prevents redirect loops)
- `TRUST_DOWNSTREAM_PROXY=true` (trusts Cloudflare-terminated TLS)
- `N8N_SECURE_COOKIE=true` (sets secure cookie flags)

**Dependencies**: postgres, qdrant (waits for health checks)

---

### 7. coda-mcp-gateway
**Image**: `coda-mcp-gateway:latest` (custom build)
**Container**: `coda-mcp-gateway`
**Status**: Running (healthy)
**Purpose**: HTTP/SSE wrapper for Coda MCP server, enabling remote access from AI clients.

**What it does for beginners**: MCP (Model Context Protocol) allows AI agents like Claude to access external tools and data. The Coda MCP server provides tools to read/write Coda tables. This gateway wraps that stdio-based MCP server with an HTTP/SSE interface so AI clients can access it remotely over HTTPS (instead of requiring local installation).

**Networks**: proxy (for external access), syncbricks (for potential future integrations)
**Ports**: 127.0.0.1:8080:8080 (localhost only), plus HTTPS via nginx-proxy
**External URL**: https://coda.bestviable.com/sse ✅ Verified accessible
**Coda API**: Connects via `CODA_API_TOKEN` environment variable

**Key Configuration**:
- `--host 0.0.0.0` (binds to all interfaces so nginx-proxy can reach it)
- `--port 8080` (gateway listens on this port)
- Wrapped command: `node dist/index.js` (the actual Coda MCP server)

**Dependencies**: n8n (arbitrary ordering for startup sequence)

---

### 8. n8n-import (Helper Service)
**Image**: `n8nio/n8n:latest`
**Container**: `n8n-import`
**Status**: Not running (profile: donotstart)
**Purpose**: One-time helper for importing credentials into n8n.

**What it does**: This is a utility container that shares n8n's image but runs a different command (`n8n import:credentials`). It's used occasionally to import credentials from a JSON file rather than configuring them manually in the UI. The `donotstart` profile means it doesn't run unless explicitly invoked.

**Networks**: syncbricks
**Usage**: `docker compose --profile donotstart run n8n-import`

---

## Network Architecture

### Two-Network Design

**Purpose**: Security through isolation. Public-facing services can't directly access backend databases.

### proxy Network
**Subnet**: 172.20.0.0/16
**Purpose**: Internet-facing services and routing
**Services**:
- nginx-proxy (reverse proxy)
- acme-companion (SSL manager)
- cloudflared (tunnel client)
- n8n (needs both public UI and database access)
- coda-mcp-gateway (needs public HTTP/SSE endpoint)

### syncbricks Network
**Subnet**: 172.21.0.0/16
**Purpose**: Backend services isolated from direct internet access
**Services**:
- postgres (database)
- qdrant (vector store)
- n8n (needs database access)
- coda-mcp-gateway (may need future backend integrations)
- n8n-import (helper)

**Key Security Benefit**: postgres and qdrant are NOT on the proxy network, so even if a public-facing service is compromised, the databases aren't directly accessible from the internet.

---

## External Endpoints

All endpoints use HTTPS with automatic SSL certificates from Let's Encrypt.

### n8n Workflow Automation
**URL**: https://n8n.bestviable.com
**Status**: ✅ HTTP 200 (verified 2025-10-28)
**Purpose**: Web UI for building and managing workflows
**Auth**: Login required (admin credentials)
**Routing**: Cloudflare Tunnel → nginx-proxy → n8n:5678

### Coda MCP Gateway
**URL**: https://coda.bestviable.com/sse
**Status**: ✅ HTTP 200 (verified 2025-10-28)
**Purpose**: SSE endpoint for AI clients to access Coda MCP tools
**Auth**: Token-based (via MCP client configuration)
**Routing**: Cloudflare Tunnel → nginx-proxy → coda-mcp-gateway:8080

---

## Key Configuration Details

### SSL/TLS Handling
- **Edge termination**: Cloudflare handles TLS at the edge
- **Tunnel**: Encrypted connection from Cloudflare to droplet
- **nginx-proxy**: Handles internal HTTPS (with acme-companion certificates)
- **Services**: Configured to trust downstream proxy (`TRUST_DOWNSTREAM_PROXY=true`)

### Environment Variables
All sensitive values stored in `.env` file on droplet (not in repo):
- `CF_TUNNEL_TOKEN` - Cloudflare Tunnel authentication
- `POSTGRES_PASSWORD` - Database password
- `N8N_ADMIN_EMAIL` - n8n admin email
- `N8N_ADMIN_PASSWORD` - n8n admin password
- `N8N_ENCRYPTION_KEY` - n8n data encryption key
- `CODA_API_TOKEN` - Coda API authentication
- `QDRANT_API_KEY` - Qdrant database authentication
- `DOMAIN=bestviable.com` - Base domain for all services
- `LETSENCRYPT_EMAIL` - Email for SSL certificate notifications

### Recent Configuration Fixes (2025-10-28)
Based on ADR `2025-10-28_cloudflare-proxy-trust-config_v01.md`:

1. **Replaced virtual labels with environment variables**:
   - Old: `com.github.jrcs.letsencrypt_nginx_proxy_companion.virtual_host`
   - New: `VIRTUAL_HOST` environment variable (nginx-proxy compatible)

2. **Added proxy trust configuration**:
   - `HTTPS_METHOD=noredirect` (prevents redirect loops)
   - `TRUST_DOWNSTREAM_PROXY=true` (trusts Cloudflare TLS termination)

3. **Fixed Coda MCP Gateway binding**:
   - Old: `127.0.0.1:8080` (unreachable by nginx-proxy)
   - New: `0.0.0.0:8080` (reachable on proxy network)

These changes resolved `ERR_TOO_MANY_REDIRECTS` and 502 errors.

---

## Health & Monitoring

### Health Checks Configured
- **postgres**: `pg_isready -U n8n` (every 10s)
- **qdrant**: File existence check for raft_state.json (every 30s)
- **n8n**: Process check for node n8n (every 30s, 120s start period)
- **coda-mcp-gateway**: Process check for node coda (every 30s, 120s start period)
- **acme-companion**: Directory check for ACME state (every 300s)
- **nginx-proxy**: Disabled (proxy doesn't need health checks)
- **cloudflared**: Disabled (managed by Cloudflare)

### Manual Health Verification
```bash
# SSH to droplet
ssh root@159.65.97.146

# Check all services
docker compose -f docker-compose.production.yml ps

# Check specific container logs
docker logs n8n --tail 50
docker logs coda-mcp-gateway --tail 50
docker logs cloudflared --tail 50

# Verify external access
curl -I https://n8n.bestviable.com
curl -I https://coda.bestviable.com/sse
```

### Current Status (as of 2025-10-28)
- All services running and healthy ✅
- External endpoints verified accessible ✅
- No errors in recent logs ✅
- SSL certificates issued and valid ✅
- Cloudflare Tunnel connected ✅

---

## Storage & Data

### Persistent Volumes
All data stored in subdirectories on droplet filesystem:

- `./certs` - SSL certificates (nginx-proxy + acme-companion)
- `./vhost.d` - Virtual host configurations (nginx-proxy)
- `./html` - Web root for ACME challenges (nginx-proxy)
- `./acme` - ACME account data (acme-companion)
- `./data/postgres` - PostgreSQL database files
- `./data/qdrant` - Qdrant vector storage
- `./data/qdrant/snapshots` - Qdrant backups
- `./data/n8n` - n8n workflows, credentials, settings
- `./data/coda-mcp` - Coda MCP Gateway data
- `./custom` - n8n custom extensions

### Backup Considerations
**Not yet implemented** - Future work:
- Database snapshots (postgres pg_dump)
- Qdrant snapshots (built-in snapshot feature)
- n8n workflow exports (via CLI or API)
- `.env` file backup (encrypted)

---

## Links to Comprehensive Documentation

This is a brief operational snapshot. For detailed explanations:

### Full Infrastructure Docs (~22,000 words)
📍 **Navigation**: `/docs/infrastructure/INDEX.md`

**Key Documents**:
1. **SyncBricks Pattern Deep Dive** (3,500 words)
   `/docs/infrastructure/syncbricks_solution_breakdown_v1.md`
   Technical explanation of nginx-proxy + acme-companion + Cloudflare Tunnel architecture

2. **Deployment Procedure** (4,000 words)
   `/docs/infrastructure/droplet_migration_procedure_v1.md`
   7-phase step-by-step deployment guide with troubleshooting

3. **Cloudflare Tunnel Setup** (3,500 words)
   `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md`
   Token creation, DNS configuration, monitoring, and maintenance

4. **Security Comparison** (3,500 words)
   `/docs/infrastructure/infrastructure_state_comparison_v1.md`
   Before/after security analysis showing improvements

5. **Decision Process** (4,500 words)
   `/docs/infrastructure/syncbricks_n8n_full_analysis_v1.md`
   Complete analysis of why SyncBricks pattern was chosen

6. **Quick Start** (1-page)
   `/docs/ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md`
   Rapid deployment reference for experienced operators

### Architecture Decisions
📍 **ADRs**: `/agents/decisions/`

**Related Decisions**:
- `2025-10-28_cloudflare-proxy-trust-config_v01.md` - Proxy trust and SSL configuration
- `2025-10-26_infrastructure-syncbricks-adoption_v01.md` - SyncBricks pattern adoption
- `2025-10-26_mcp_deployment_strategy_v01.md` - MCP Gateway deployment approach

### Deployment Configuration
📍 **Docker Compose**: `/docs/ops/docker-compose.production.yml`
Complete service definitions, networks, volumes, and environment variables

---

## Next Steps

### Immediate (Operational)
1. ✅ Infrastructure deployed and verified
2. ✅ External endpoints accessible
3. ⏳ Configure backup strategy (postgres, qdrant, n8n, .env)
4. ⏳ Set up monitoring/alerts (optional: Uptime Robot, Healthchecks.io)

### Short-Term (Integration)
1. ⏳ Build first n8n workflow (GitHub PR → Coda update)
2. ⏳ Test Coda MCP Gateway with Claude Code client
3. ⏳ Consolidate MCP servers into gateway (currently only Coda)
4. ⏳ Document MCP client configuration for AI UIs

### Medium-Term (Automation)
1. ⏳ Automate repo sync (GitHub → droplet via git pull)
2. ⏳ Implement bidirectional Coda ↔ GitHub sync via n8n
3. ⏳ Add GitHub Actions for validation and deployment triggers

---

## Changelog

**2025-10-28** - Document created
- Initial production state snapshot after successful deployment
- All 7 services operational with verified external access
- Two-network security design implemented
- Cloudflare Tunnel with token-based authentication active

---

**Document Status**: Current as of 2025-10-28
**Next Review**: After next infrastructure change or by 2025-11-15
**Maintained By**: Infrastructure team (currently: David Kellam + AI agents)
