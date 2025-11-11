# Current State: Portfolio Platform v1

**Last Updated**: 2025-11-07 (Phase 2C + MCP Workers + LiteLLM BYOK COMPLETE)
**Status**: Phase 2C COMPLETE - All MCP workers deployed, LiteLLM BYOK integrated, Infisical configured

---

## Infrastructure Status

### Droplet Tier
- **Host**: DigitalOcean tools-droplet-agents
- **Tier**: Regular 4GB (2vCPU, 4GB RAM, 80GB SSD, $24/month)
- **OS**: Ubuntu 22.04 LTS
- **Region**: SFO3
- **IP**: 159.65.97.146
- **Tunnel**: Cloudflare (zero IP exposure)

**Upgrade**: Nov 6, 2025 - Resized from 2GB to 4GB to unblock Phase 2A
- Previous tier cost: $6/month
- New tier cost: $24/month
- Cost increase: +$18/month (+$216/year)
- Downtime: ~20 minutes

### Resource Baseline (Post-Upgrade)
**Timestamp**: 2025-11-07 00:01:30 UTC

**Memory**:
- Total: 3.8GB
- Used: 1.4GB (37%)
- Free: 981MB (26%)
- **Previous (2GB)**: 1.3GB used (68%), 83MB free - CRITICAL

**Storage**:
- Total: 77GB SSD
- Used: 33GB (43%)
- Free: 45GB (57%)
- **Headroom**: 45GB for growth (6-8 month runway at moderate expansion)

**Storage Breakdown**:
- Qdrant vectors: 10-20GB
- PostgreSQL n8n: 5-10GB
- Docker system + logs: ~5GB
- Remaining services: <2GB

---

## Phase 1: N8N Foundation (COMPLETE ✅)

### Services
| Service | Status | Port(s) | Purpose |
|---------|--------|---------|---------|
| **n8n** | ✅ Up | 5678 | Workflow orchestration engine |
| **nginx-proxy** | ✅ Up | 80, 443 | Reverse proxy + SSL termination |
| **acme-companion** | ✅ Up | - | Let's Encrypt automation |
| **postgres** | ✅ Up (healthy) | 5432 | N8N database backend |
| **qdrant** | ✅ Up | 6333 | Vector DB (RAG/semantic search) |
| **cloudflared** | ✅ Up | - | Cloudflare Tunnel |

### DNS Records (bestviable.com)
- `n8n.bestviable.com` → nginx-proxy (Let's Encrypt auto-provisioned)
- `coda.bestviable.com` → Coda workspace (external)
- `logs.bestviable.com` → Loki logs (optional, not deployed)
- `openweb.bestviable.com` → Open WebUI (optional, disabled post-upgrade)

### Volumes
- N8N data: `/root/portfolio/infra/n8n/data/`
- Qdrant data: Persistent volume (docker)
- PostgreSQL: Persistent volume (docker)

---

## Phase 2A: Archon Services (COMPLETE ✅)

### Deployment Status
- **Status**: LIVE as of 2025-11-07 00:01 UTC
- **Trigger**: 4GB droplet upgrade completed
- **Configuration**: nginx-proxy integrated (VIRTUAL_HOST labels active)
- **Health**: All services healthy

### Services
| Service | Status | Port(s) | Purpose |
|---------|--------|---------|---------|
| **archon-server** | ✅ Healthy | 8181 | FastAPI backend (Supabase integration) |
| **archon-mcp** | ✅ Healthy | 8051 | MCP server (IDE integration) |
| **archon-ui** | ✅ Healthy | 3737 (internal) | React frontend + Tailwind UI |

### DNS
- `archon.bestviable.com` → nginx-proxy auto-discovered
- VIRTUAL_HOST labels configured for HTTPS via Let's Encrypt
- Status: nginx-proxy upstream created

### Health Checks
```json
{
  "status": "healthy",
  "service": "knowledge-api",
  "timestamp": "2025-11-07T00:01:30.955827"
}
```

### Database
- Supabase PostgreSQL + pgvector
- Tables: sources, documents, projects, tasks, versions, code_examples
- Vector embeddings: 1536-dim (OpenAI)

### Configuration
- Docker Compose: `/root/portfolio/infra/archon/docker-compose.yml`
- Network: Dual-network setup (app-network internal, n8n_proxy for nginx-proxy)
- Restart policy: `unless-stopped`
- Health checks: Configured for all services

---

## Phase 2B: Open WebUI Integration (PAUSED)

**Status**: Optional service, disabled post-upgrade
- Container: `openweb` (image: `ghcr.io/open-webui/open-webui:latest`)
- Previous memory: 734MB / 1000MB limit (73% consumed)
- DNS: `openweb.bestviable.com`
- **Decision**: Kept disabled to preserve memory headroom. Re-enable if needed.

---

## Phase 2C: MCP Workers (COMPLETE ✅)

### Deployment Status
- **Status**: ALL DEPLOYED as of 2025-11-07 08:39 UTC
- **Platform**: Cloudflare Workers
- **Transport**: Streamable HTTP
- **Security**: Infisical-managed secrets

### Services
| Service | Status | URL | Purpose |
|---------|--------|-----|---------|
| **GitHub MCP Worker** | ✅ Deployed | https://github.bestviable.com/mcp | GitHub API integration |
| **Memory MCP Worker** | ✅ Deployed | https://memory.bestviable.com/mcp | Persistent memory via Durable Objects |
| **Context7 MCP Worker** | ✅ Deployed | https://context7.bestviable.com/mcp | Library docs & code examples |

### Features Implemented
- **GitHub MCP**: OAuth 2.0, repository management, issues/PRs, file operations
- **Memory MCP**: Knowledge graph storage, persistent memory management
- **Context7 MCP**: Library documentation retrieval, code examples, search

### Configuration
- **Deployment Script**: `./deploy-mcp-workers.sh`
- **Secrets**: Managed via Infisical CLI
- **Domains**: Custom domains configured via Cloudflare

---

## Phase 2D: LiteLLM BYOK Integration (COMPLETE ✅)

### Deployment Status
- **Status**: DEPLOYED and CONFIGURED
- **Platform**: Docker container
- **Configuration**: BYOK (Bring Your Own Key)

### Service
| Service | Status | URL | Purpose |
|---------|--------|-----|---------|
| **LiteLLM** | ✅ Deployed | https://litellm.bestviable.com | Multi-provider LLM proxy |

### Features
- **Providers**: OpenAI, Anthropic, Google, Cohere, Mistral
- **Configuration**: Environment variable management
- **Security**: Infisical-managed API keys
- **Health**: Health check endpoints active

---

## Phase 2E: Infisical Integration (COMPLETE ✅)

### Deployment Status
- **Status**: FULLY CONFIGURED
- **CLI**: Installed and operational
- **Projects**: 4 created

### Projects Created
- `github-mcp-worker`
- `memory-mcp-worker`
- `context7-mcp-worker`
- `litellm`

### Features
- **Secrets Management**: Secure storage for all services
- **Environment Sync**: Automated .env file synchronization
- **Security**: Production-ready configuration

---

## Ollama Local Inference Strategy (APPROVED)

**Status**: Three-phase evaluation approach adopted
**Rationale**: Balance cost (OpenAI API) vs. performance (local models) without over-investing

### Phase A: CPU Embeddings (Post-upgrade, Week 1-2)
- **Model**: `nomic-embed-text` (274MB, high-quality open-source)
- **Cost**: $0 (CPU inference included)
- **Target**: Replace OpenAI embeddings API
- **Status**: PENDING - Scheduled after Phase 2A stabilization

### Phase B: LLM Backbone for Letta (Phase 2D launch)
- **Models**: `neural-chat-7b` or `orca-mini-3b` (7GB)
- **Cost**: $0 (CPU inference, slower but acceptable)
- **Target**: Letta agent backbone
- **Performance Goal**: <3s response time
- **Decision Gate**: If <3s → continue CPU; if >3s → escalate to GPU

### Phase C: GPU Acceleration (Performance-driven, if needed)
- **Cost**: +$25-48/month (separate GPU droplet)
- **Justification**: Only if Phase B inference unacceptably slow
- **Threshold**: >1000 inferences/day sustained

---

## Cost Summary (Monthly)

| Component | Cost | Notes |
|-----------|------|-------|
| **DigitalOcean Droplet** | $24 | Regular 4GB (was $6) |
| **Cloudflare Tunnel** | Free | Zero IP exposure |
| **Let's Encrypt SSL** | Free | Auto-renewal via acme-companion |
| **Supabase (optional)** | TBD | Knowledge base data only |
| **GPU (optional, future)** | +$25/mo | Only if Phase 2D needs acceleration |
| **Volume Storage (optional)** | +$20/mo | Only if Phase 2D storage exceeds 60GB |
| **TOTAL** | **$24** | **Base cost post-Phase 2C** |

**Annual Cost**: $288 (was $72 on 2GB tier)

---

## Key Files & Locations

### Local Workspace
- `/Users/davidkellam/workspace/portfolio/`

### Droplet Paths
- N8N config: `/root/portfolio/infra/n8n/`
- Archon code: `/root/portfolio/infra/archon/`
- Shared config: `/root/portfolio/` (synced from Git)

### Cloudflare Workers
- **GitHub MCP**: `workers/github-mcp-worker/`
- **Memory MCP**: `workers/memory-mcp-worker/`
- **Context7 MCP**: `workers/context7-mcp-worker/`
- **Deployment Script**: `./deploy-mcp-workers.sh`

### GitHub (Source of Truth)
- Architecture specs: `/docs/architecture/`
- Infrastructure runbooks: `/docs/infrastructure/`
- Change proposals: `/openspec/changes/`

---

## Known Issues & Next Steps

### Current Issues
- None critical. All phases fully operational.

### Next Steps
1. **Monitor Stability**: 24-48 hours observation for all services
2. **Phase A Ollama**: Deploy CPU embeddings (optional inference cost reduction)
3. **Testing**: Validate all MCP workers with MCP Inspector
4. **Documentation**: Update user guides for new services

### Storage Monitoring
- Check monthly: `ssh tools-droplet-agents "df -h && du -sh /root/portfolio/*"`
- Upgrade decision point: When storage hits 56GB (70% of 80GB)
- Timeline: Expected ~6-8 months depending on usage

---

## Deployment Runbook

### Emergency: Restart All Services
```bash
# Main services
ssh tools-droplet-agents "cd /root/portfolio/infra/n8n && docker compose down && docker compose up -d"
ssh tools-droplet-agents "cd /root/portfolio/infra/archon && docker compose restart"

# MCP Workers (Cloudflare - no restart needed)
# LiteLLM (if deployed via Docker)
ssh tools-droplet-agents "cd /root/portfolio/infra/apps && docker compose restart litellm"
```

### View Logs
```bash
ssh tools-droplet-agents "docker logs -f n8n"           # N8N
ssh tools-droplet-agents "docker logs -f nginx-proxy"   # Reverse proxy
ssh tools-droplet-agents "docker logs -f archon-server" # Archon API
```

### Health Checks
```bash
# Main services
curl -s http://localhost:5678/                          # N8N UI
curl -s http://localhost:8181/api/health                # Archon API
curl -s https://n8n.bestviable.com/                     # External N8N
curl -s https://archon.bestviable.com/                  # External Archon UI

# MCP Workers
curl -s https://github.bestviable.com/health            # GitHub MCP
curl -s https://memory.bestviable.com/health            # Memory MCP
curl -s https://context7.bestviable.com/health          # Context7 MCP
curl -s https://litellm.bestviable.com/health           # LiteLLM
```

---

## Archive Location
- **MCP & LiteLLM Work**: `/openspec/changes/archive/2025-11-07-mcp-litellm-completion/`
- **Completion Checklist**: Available in archive
- **Final State**: Documented in archive

---

**Maintenance Owner**: David Kellam
**Last Verified**: 2025-11-07 08:39 UTC
**Next Review**: 2025-11-14 (one week post-completion)
**Status**: ALL PHASES COMPLETE ✅
