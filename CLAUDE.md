# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

This is a **solo AI-ready portfolio & operations platform** for David Kellam, designed to manage ventures, engagements, projects, and infrastructure as a unified system. The architecture separates:

- **Content layer**: Ventures, offers, engagements, projects (Markdown + Git)
- **Operations layer**: Infrastructure, deployment, automation (Docker + N8N + MCP servers)
- **Integration layer**: Coda (live state), GitHub (versioned truth), N8N (sync workflows), MCP servers (agent tools)

**Current Status**: Phase 1 complete (N8N foundation deployed); Phase 2 underway (MCP server redesign)

---

## Before You Start

### Essential Reading Order
1. **CURRENT_STATE_v1.md** — What's actually deployed (droplet + local state)
2. **docs/architecture/architecture-spec_v0.3.md** — Design principles & entity relationships
3. **infra/n8n/README.md** (if touching infrastructure) — Deployment & operations guide

### Key Concepts
- **Source of Truth (SoT)**: GitHub is authoritative for architecture/specs; Coda for live state
- **Zones**: Content is classified as `public | internal | private | restricted`; children cannot downgrade
- **Mode-Aware Retrieval**: Planning (chat) vs. Execution (Claude Code) vs. Review have different scopes
- **TTL & Promotion**: Session notes decay; promotion paths: Project → Engagement → Venture → Portfolio

---

## Directory Structure

```
portfolio/
├── docs/                          # Documentation
│   ├── architecture/              # Architecture specs, integrations, decisions
│   ├── infrastructure/            # Deployment guides, runbooks, analysis
│   └── business/                  # Business logic, pricing, client templates
├── infra/                         # Infrastructure (Phase 1 current)
│   ├── n8n/                       # ✅ Active - N8N workflows & docker-compose
│   ├── docker/                    # ⚠️ Legacy - old docker configs (to be archived)
│   ├── config/                    # ⚠️ Legacy - old configuration files
│   ├── mcp-servers/               # 📋 Phase 2 - new MCP server structure
│   └── scripts/                   # ⚠️ Legacy - old deployment scripts
├── agents/                        # Agent briefs, playbooks, decision logs
├── ventures/                      # Productized service offerings (template structure)
├── sessions/                      # Session logs, mission briefs, builder prompts
├── sot/                           # Source of Truth files (schemas, authority map)
├── archive/                       # Old/deprecated content
├── CURRENT_STATE_v1.md            # ⭐ Actual deployed state (read 1st)
├── README.md                      # Architecture principles & quick start
└── PHASE_1_COMPLETE.md            # Completion report for Phase 1
```

---

## Common Commands & Workflows

### Local Development

**Setup**:
```bash
cd ~/workspace/portfolio
git pull origin main
```

**View current state**:
```bash
cat CURRENT_STATE_v1.md           # Actual deployed services
cat infra/n8n/README.md           # N8N operations guide
```

**Check droplet status**:
```bash
ssh tools-droplet-agents "docker ps"                    # See active services
ssh tools-droplet-agents "docker logs n8n | tail -50"   # N8N logs
ssh tools-droplet-agents "curl -s http://localhost:5678" # N8N health check
```

### Infrastructure Operations

**Deploy N8N stack** (Phase 1):
```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/n8n && docker-compose up -d"
```

**Upload configuration changes**:
```bash
scp -r infra/n8n/* tools-droplet-agents:/root/portfolio/infra/n8n/
```

**Check service health**:
```bash
ssh tools-droplet-agents "docker-compose -f /root/portfolio/infra/n8n/docker-compose.yml ps"
```

**View MCP server status** (Phase 2):
```bash
ssh tools-droplet-agents "curl -s https://coda.bestviable.com/mcp/.well-known/mcp.json"
```

### Content & Project Work

**Create new venture**:
1. Read: `sessions/builder_prompt_v0.3.md`
2. Use builder to scaffold structure
3. Copy templates from `/templates/`
4. Commit to Git

**Add engagement/project**:
1. Create under `ventures/{venture}/engagements/{engagement}/`
2. Populate context brief (from template)
3. Create `projects/{project}/` with subdirs: `context/`, `deliverables/`, `sprints/`, `decisions/`, `logs/`
4. Instantiate `SHO.json` from `/templates/SHO_template.json`

**Update CURRENT_STATE**:
- Before major changes, update CURRENT_STATE_v1.md
- Document what changed, when, and why
- Commit with clear message

---

## Architecture at a Glance

### Entity Hierarchy
```
Portfolio (top-level)
├── Venture (productized service)
│   ├── Offer (service specification)
│   └── Engagement (client contract)
│       └── Project (deliverable unit)
│           ├── Sprints (time blocks)
│           ├── Decisions (ADRs)
│           └── Logs (session notes)
```

### Integration Flows
1. **GitHub** ← → Authoritative architecture, specs, ADRs
2. **Coda** ← → Live state, task tracking, tables
3. **N8N** ← → Sync workflows (GitHub ↔ Coda), webhooks, automations
4. **MCP Servers** → Agent tools (Coda, GitHub, Memory, Firecrawl)
5. **Cloudflare Tunnel** → Secure external access (no IP exposure)

### Metadata Standard
Every Markdown file MUST include:
```markdown
- entity: <entity_name>
- level: <level_name>
- zone: public|internal|private|restricted
- version: vNN
- tags: [tag1, tag2]
- source_path: <repo-relative-path>
- date: YYYY-MM-DD
```

---

## Phase Context

### Phase 1: N8N Foundation (COMPLETE ✅)
- ✅ Docker infrastructure (nginx-proxy, acme-companion, Cloudflare tunnel)
- ✅ N8N deployment with PostgreSQL + Qdrant
- ✅ Workflow restoration from backups
- ✅ Documentation complete

**Status**: All Phase 1 services running. Legacy MCP gateways deprecated (to be removed Phase 2).

### Phase 2: MCP Server Redesign (IN PROGRESS)
- 📋 Refactor MCP servers to HTTP-native streaming
- 📋 Deploy Coda, GitHub, Memory, Firecrawl under new structure
- 📋 Update client configurations & bearer tokens
- 📋 Archive legacy gateway services

**Next Actions**: See `/infra/mcp-servers/` and `docs/architecture/integrations/mcp/DEPLOYMENT_FLOWS.md`

---

## Key Files & Purposes

| File/Directory | Purpose |
|---|---|
| `CURRENT_STATE_v1.md` | Source of truth for actual deployed state |
| `docs/architecture/architecture-spec_v0.3.md` | Design principles, entity relationships, zone rules |
| `docs/architecture/sot_architecture_v0_2.md` | How GitHub, Coda, N8N sync |
| `sot/context_schemas_v02.yaml` | Machine-readable entity schemas |
| `sessions/builder_prompt_v0.3.md` | Instructions for scaffolding ventures/projects |
| `infra/n8n/README.md` | N8N deployment, health checks, troubleshooting |
| `infra/n8n/docker-compose.yml` | Active Phase 1 configuration (source of truth) |
| `docs/infrastructure/` | Runbooks, deployment guides, analysis |
| `agents/` | Agent playbooks, decision logs, retrospectives |
| `README.md` | High-level overview & architecture principles |

---

## Workflow Tips

### When Making Changes to Infrastructure
1. Read `CURRENT_STATE_v1.md` to understand what's deployed
2. Check `infra/n8n/docker-compose.yml` (Phase 1) or `infra/mcp-servers/` (Phase 2)
3. Test locally if possible (Docker Desktop running)
4. Upload changes to droplet with `scp`
5. Verify with `docker ps` or health checks
6. Update `CURRENT_STATE_v1.md` with what changed

### When Creating Project Content
1. Use templates from `/templates/` as starting point
2. Include metadata header (entity, zone, version, etc.)
3. Link to parent Engagement/Venture/Portfolio
4. Update parent's index or promotion status
5. Commit to Git with clear message

### When Working on Decisions (ADRs)
1. Create in `{project}/decisions/` or `agents/decisions/`
2. Use template: `date_slug_vNN.md`
3. Include: Context, Options, Decision, Consequences, Precedents
4. Link to affected services/documents
5. Update in Coda for visibility

---

## Technology Stack

| Layer | Technology | Status | Notes |
|---|---|---|---|
| **Reverse Proxy** | nginx-proxy (jwilder) | ✅ Active | Auto-discovery, no manual config |
| **SSL/TLS** | acme-companion + Let's Encrypt | ✅ Active | Automatic certificate renewal |
| **External Access** | Cloudflare Tunnel (token-based) | ✅ Active | Zero IP exposure |
| **Automation Engine** | N8N 1.117.3 | ✅ Active (Phase 1) | Workflow orchestration & webhooks |
| **Workflow Database** | PostgreSQL 16 | ✅ Active | N8N backend storage |
| **Vector DB** | Qdrant | ✅ Active | RAG/semantic search (initializing) |
| **MCP Servers** | HTTP streaming (Phase 2) | 📋 In Progress | Coda, GitHub, Memory, Firecrawl |
| **Content Storage** | Git (GitHub) | ✅ Active | Authoritative SoT |
| **Operations CMS** | Coda | ✅ Active | Live task/project tracking |

---

## Common Troubleshooting

**N8N not responding**:
```bash
ssh tools-droplet-agents "docker-compose -f /root/portfolio/infra/n8n/docker-compose.yml logs n8n | tail -100"
docker-compose -f infra/n8n/docker-compose.yml restart n8n  # Local restart if testing
```

**Database connection issues**:
```bash
ssh tools-droplet-agents "docker-compose -f /root/portfolio/infra/n8n/docker-compose.yml logs postgres"
```

**MCP server not responding** (Phase 2):
Check `infra/mcp-servers/{server}/logs/` or curl endpoint with bearer token.

**Tunnel disconnected**:
```bash
ssh tools-droplet-agents "docker-compose -f /root/portfolio/infra/n8n/docker-compose.yml logs cloudflared"
```

---

## Important Notes for Agents

1. **Always check CURRENT_STATE_v1.md first** — Don't assume what's deployed; verify.
2. **Phase 1 vs. Phase 2** — Infrastructure has two active phases; understand which applies to your task.
3. **Zone inheritance** — Documents with `restricted` content cannot reference `public` documents; check zones.
4. **SoT sync** — Changes to architecture specs should go to GitHub first; Coda updates via N8N workflows.
5. **Droplet path** — Local: `/Users/davidkellam/workspace/portfolio/`; Droplet: `/root/portfolio/`
6. **Bearer tokens** — MCP server authentication required; check `.env` files (not committed).

---

**Version**: 1.0
**Last Updated**: 2025-11-04
**Status**: Foundation documented; Phases 1 & 2 tracked; ready for agent operations
