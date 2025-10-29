---
- entity: overview
- level: internal
- zone: internal
- version: v01
- tags: [orientation, sot, infrastructure, agents, ventures]
- source_path: /agents/context/system_overview_v01.md
- date: 2025-10-28
---

# Portfolio System Overview — v0.4

**Purpose**: Fast orientation for AI agents starting fresh sessions.

**Target Audience**: Stateless AI agents (Claude Code, other LLMs) joining mid-project who need to understand the system architecture, current state, and where to find key information.

**Read time**: 10-15 minutes

---

## 1. What This System Is

**Think of this as your business brain with two connected halves.**

This is a **solopreneur operating platform** that manages multiple business ventures through a dual "Source of Truth" (SoT) model:

- **GitHub (this repo)**: Versioned documentation, specs, templates, architecture decisions (structural truth)
- **Coda (Founder HQ workspace)**: Live work tracking, decisions, metrics, daily operations (operational truth)

Both sides stay synchronized through automation (n8n workflows) and are accessible to AI agents like you via MCP (Model Context Protocol) servers.

### The Portfolio → Ventures Model

**Portfolio** (Root Level)
The entire solo business operation. Contains:
- System-wide schemas and templates
- Architecture Decision Records (ADRs)
- Shared infrastructure and tooling
- Cross-venture documentation standards

**Ventures** (Business Lines)
Individual business initiatives or service lines. Each venture has:
- Unique positioning and ideal customer profile (ICP)
- Service offers and playbooks
- Revenue model and pricing
- Marketing and operations strategy

**Current Active Ventures**:

1. **Operations Studio** (Revenue - Primary)
   - Business operations consulting and automation services
   - Target: Small/midsize organizations improving business systems
   - Services: Workflow optimization, automation design, analytics setup, strategy consulting
   - Vision: Evolve from services into AI-powered professional services platform
   - Status: Early client work (pilot engagement with KamalaDevi McClure)

2. **Programming Learning** (Skills - Secondary)
   - Personal skill-building initiative for agentic systems development
   - Focus: Software development and infrastructure experiments
   - Purpose: Build technical capabilities to support Operations Studio evolution
   - Status: Active learning and experimentation

3. **Digital Case-Worker** (Future - Conceptual)
   - Somatic healing marketplace concept
   - Two-sided platform connecting patients and embodied healing providers
   - Status: Conceptual stage, not yet actively developed

### Founder HQ (Internal ERP)

**Coda Doc**: "DK Enterprise OS" (Doc ID: CxcSmXz318)
**Version**: v0.41 (formerly "Enterprise OS")
**Purpose**: Daily execution, sprint planning, deal tracking, decision journaling, learning, financial health

**Key distinction**: Founder HQ is the INTERNAL operational system for running the business. Operations Studio is the EXTERNAL client-facing venture. Don't confuse them—Founder HQ is not a product; it's the back-office system that keeps everything organized.

**Tables in Founder HQ** (Coda):
- **Pass**: Strategic initiatives and major work packages
- **Decision**: Important choices with context and outcomes
- **Task**: Daily/weekly work items with assignees and due dates
- **Lesson**: Captured learning from experience
- **MetricSnapshot**: Business health indicators over time
- **Asset**: Metadata about files, tools, and resources (artifacts stored in GitHub)

---

## 2. The Two-Hemisphere SoT Model

**Beginner Concept — Source of Truth (SoT)**: The "authoritative place" where information lives. When two systems have different data, the SoT is the one you trust as correct.

This system uses a **dual SoT** approach where different types of information have different authoritative sources:

### GitHub Hemisphere (Structural Truth)
**What lives here**: Documentation, specs, templates, schemas, diagrams, code
**Why**: These need version control, peer review, and historical tracking
**Examples**:
- Architecture Decision Records (ADRs)
- Service blueprints and playbooks
- System schemas and data models
- Infrastructure configuration (Docker Compose files)
- This very document!

### Coda Hemisphere (Operational Truth)
**What lives here**: Live work state, decisions in progress, current metrics, active tasks
**Why**: These need rapid updates, rich UI, collaboration, and queries
**Examples**:
- Current sprint tasks and their status
- Latest business metrics (revenue, pipeline, health)
- Active decisions with context
- Ongoing client engagements

### The Authority Map

**Beginner Concept — Authority Map**: A JSON file that defines which system "owns" which fields. When both systems have a "status" field, the authority map says which one wins if they conflict.

📍 **Location**: `/z_archive/sot/authority_map_v0_2.json` (needs to be moved to `/sot/` per consolidation playbook)

**Current state**: Minimal (only 3 entities defined: Pass, Decision, Asset)
**Goal**: Expand to cover all entities and field-level authority

**Authority Rules**:
- **Coda writes**: Operational state fields (status, assignee, live values, current metrics)
- **GitHub writes**: Structure-defining artifacts (templates, ADRs, specs, schemas)
- **Conflicts**: GitHub authority wins; Coda changes held for manual review

### Bidirectional Sync

**Beginner Concept — Bidirectional sync**: Keeping two systems updated when either one changes. Like having two notebooks where writing in one automatically updates the other.

**How it works** (planned, not yet implemented):
1. **GitHub → Coda**: When a PR merges (new docs, updated templates), GitHub Actions triggers n8n workflow → updates Coda tables
2. **Coda → GitHub**: When Coda operational data changes significantly, n8n detects change → opens GitHub PR for review
3. **n8n enforces** the authority map so the right system writes to the right fields

**Current status**: Infrastructure deployed, automation workflows not yet built.

---

## 3. Directory Structure

```
portfolio/
├── agents/                    # AI agent operating context
│   ├── context/               # MCP setup, playbooks, session handoffs
│   │   ├── playbooks/         # Multi-phase initiative plans
│   │   ├── sessions/          # Session handoff documents
│   │   └── system_overview_v01.md  # ← You are here
│   ├── decisions/             # Architecture Decision Records (ADRs)
│   ├── skills/                # Claude Code skills (if using skills feature)
│   ├── templates/             # Reusable document templates
│   └── logs/                  # Action logs and context tracking
│
├── business_model/            # Venture architecture
│   ├── context/               # Venture-specific specs
│   │   ├── ops-studio_v0.1/   # Operations Studio venture
│   │   ├── founder-hq_v0.41/  # Internal ERP documentation
│   │   └── digital-case-worker_v0.3/  # Future venture concept
│   └── SCHEMA_GUIDE_v0.2.md   # Human-readable schema overview
│
├── docs/                      # System documentation hub
│   ├── architecture/          # System architecture specs
│   │   ├── integrations/      # MCP, n8n, Coda integration docs
│   │   └── sot_architecture_v0_2.md
│   ├── infrastructure/        # SyncBricks deployment docs (~22k words)
│   │   ├── INDEX.md           # Navigation guide
│   │   ├── droplet_state_2025-10-28.md  # Current production state
│   │   └── [6 other comprehensive docs]
│   ├── eval/                  # Evaluation harness for agents/prompts
│   └── ops/                   # Operational runbooks and configs
│       ├── docker-compose.production.yml
│       └── [deployment guides]
│
├── integrations/              # External system connections
│   ├── coda/                  # Coda integration and mapping docs
│   ├── mcp/                   # MCP Gateway configuration (planned)
│   └── n8n/                   # n8n workflow documentation (planned)
│
├── sot/                       # Source of Truth canonical files
│   ├── authority_map_v0_2.json  # Field-level authority rules
│   └── schemas/               # JSON schemas for data validation
│
├── prompts/                   # Prompt templates and bundles
│
├── inbox/                     # Unsorted/processing files
│   └── [9 files awaiting triage]
│
├── y_collection_box/          # Temporary holding for active work
│
└── z_archive/                 # Historical/deprecated content
    └── [previous iterations, superseded approaches]
```

**Key Directories Explained**:

- **agents/**: Everything an AI agent needs to operate—context, decisions, templates. Start here.
- **business_model/**: Business architecture for each venture (positioning, offers, ICPs, playbooks).
- **docs/**: Technical system documentation (architecture, infrastructure, operations).
- **z_archive/**: Ignore this—it's old versions preserved for reference but not actively used.

---

## 4. Infrastructure Stack (SyncBricks Pattern)

**Production Droplet**: 159.65.97.146 (tools.bestviable.com)
**Status**: ✅ OPERATIONAL (deployed 2025-10-26, verified 2025-10-28)

### What is SyncBricks?

**Beginner Concept — SyncBricks**: A specific architectural pattern combining nginx-proxy (auto-discovery reverse proxy) + acme-companion (automatic SSL certificates) + Cloudflare Tunnel (secure connectivity) + two-network design (security isolation). It's called "SyncBricks" because these components snap together like LEGO bricks without manual configuration files.

### The 7 Services

1. **nginx-proxy**: Reverse proxy that auto-discovers new services
2. **acme-companion**: Automatic SSL certificate management (Let's Encrypt)
3. **cloudflared**: Cloudflare Tunnel client for secure external access
4. **postgres**: PostgreSQL database (backend only)
5. **qdrant**: Vector database for semantic search (backend only)
6. **n8n**: Low-code workflow automation platform
7. **coda-mcp-gateway**: HTTP/SSE wrapper for Coda MCP server

### Key Beginner Concepts

**Docker containers**: Like shipping boxes that package software with everything it needs to run. Each service runs in its own isolated container.

**Reverse proxy**: A "traffic director" that routes web requests to the right service based on domain names. You go to https://n8n.bestviable.com, and the reverse proxy sends you to the n8n container.

**Cloudflare Tunnel**: A secure way to expose services without opening firewall ports. The droplet makes an outbound-only connection to Cloudflare, and Cloudflare routes public traffic through that tunnel. This means your droplet's IP address is never exposed publicly.

**SSL certificates**: The "🔒 secure" padlock in browsers. Let's Encrypt provides free certificates, and acme-companion automatically requests and renews them for all services.

**Two-network isolation**: Services are split between two Docker networks:
- **proxy network** (172.20.0.0/16): Internet-facing services (nginx-proxy, n8n UI, MCP gateway)
- **syncbricks network** (172.21.0.0/16): Backend services (postgres, qdrant) not directly accessible from internet

This means even if a public service is compromised, the databases are isolated and protected.

### External Endpoints

**n8n**: https://n8n.bestviable.com (workflow automation UI)
**Coda MCP Gateway**: https://coda.bestviable.com/sse (SSE endpoint for AI clients)

Both verified accessible as of 2025-10-28.

### Full Infrastructure Documentation

📍 **Start here**: `/docs/infrastructure/INDEX.md`

The infrastructure directory contains ~22,000 words of comprehensive documentation including:
- Complete SyncBricks pattern explanation
- 7-phase deployment guide with troubleshooting
- Cloudflare Tunnel setup and token management
- Security analysis (before/after comparison)
- Quick start guide for rapid deployment

---

## 5. MCP (Model Context Protocol) Integration

**Beginner Concept — MCP**: A standard protocol that allows AI agents (like Claude Code) to access external tools and data sources. Think of it as a universal adapter that lets AI systems interact with databases, APIs, and services in a consistent way.

### Current MCP Setup

**Coda MCP Server**: Provides tools to read/write Coda tables (Founder HQ)
**Gateway**: HTTP/SSE wrapper at https://coda.bestviable.com/sse
**Purpose**: Allows AI agents to access Founder HQ data remotely over HTTPS (instead of requiring local installation)

**Status**: Deployed and accessible, but needs:
- Consolidation with other MCP servers
- Client configuration documentation
- Testing with Claude Code and other AI UIs

### Future MCP Plans

**Goal**: Unified MCP Gateway exposing multiple tools:
- Coda MCP (current)
- GitHub MCP (for repo operations)
- Calculator, time, memory, etc. (standard MCP servers)
- Custom MCP servers for venture-specific tools

**Access Pattern**: AI agents configure their MCP client to point at https://coda.bestviable.com/sse, and the gateway multiplexes access to all underlying MCP servers.

### How You (AI Agent) Use MCP

Currently, if MCP tools are configured in this session, you should be able to:
1. List Coda tables and their schemas
2. Query rows from Founder HQ tables (Pass, Decision, Task, Lesson, etc.)
3. Create or update rows (respecting authority map)
4. Search across tables

**Note**: MCP access requires proper authentication tokens configured in your client settings.

---

## 6. Current State & What's Working

### ✅ Working (Verified 2025-10-28)

**Infrastructure**:
- All 7 services deployed and running
- External HTTPS endpoints accessible
- SSL certificates active and auto-renewing
- Cloudflare Tunnel connected and stable
- Two-network security design implemented

**Documentation**:
- Infrastructure docs complete and comprehensive
- Architecture Decision Records (ADRs) documenting key choices
- Session handoffs tracking progress and blockers
- Venture specs for Operations Studio and Founder HQ

### ⏳ In Progress

**n8n Automations**:
- Platform deployed and accessible
- Zero workflows created yet
- Planned: GitHub PR → Coda update flow
- Planned: Coda metrics → GitHub snapshot export

**GitHub SoT Organization**:
- Major repo reorganization underway (67 files deleted/moved)
- Authority map minimal (only 3 entities defined)
- 11 commits ahead of origin/main (needs push)
- Schemas and sync policies being defined

**MCP Consolidation**:
- Coda MCP Gateway deployed
- Other MCP servers not yet integrated
- Client configuration needs documentation
- Testing required with AI UIs

### 🔮 Future (Blocked or Planned)

**Manifold Navigator**:
- Vision: AI agent modes (Tutor, Builder, Mentor) for different tasks
- Blocked on: Memory management flow and policy
- Purpose: State-aware agents that learn from each session and improve over time

**Automated Repo Sync**:
- Currently: Manual `scp` to deploy changes to droplet
- Goal: Git-based sync (droplet pulls from GitHub automatically)
- Status: Needs design and implementation

---

## 7. Active Initiatives (Link to Playbooks)

### SoT Consolidation

📍 **Playbook**: `/agents/context/playbooks/system_sot_consolidation_playbook_v01.md`

**Purpose**: Align working repo, droplet stack, and Coda workspace with SoT v0.2 architecture

**5 Goals**:
1. Unified Orientation - All specs accessible from single overview doc
2. Documented State - Fresh droplet state worksheet + Coda↔GitHub authority map
3. Sync Policy - Written ADR for local → GitHub → droplet propagation
4. Legacy Hygiene - Clarify or archive old folders
5. Launch-ready Cadence - Draft and adopt interim update rhythm

**Current Phase**: Phase 0 (Baseline Inventory) - 30 min
**Status**: Ready to proceed
**TTL**: Review after first full cycle or by 2025-11-15

### Coda MCP Gateway Upgrade

📍 **Playbook**: `/agents/context/playbooks/coda_mcp_gateway_upgrade_plan_v01.md`

**Purpose**: Replace current Coda MCP build with fork matching/exceeding dustinrgood/coda-mcp feature set

**5 Phases**:
- Phase 0: Preparation & Environment (30 min) - CURRENT
- Phase 1: Acquire & Stage Target Source (45 min)
- Phase 2: Integrate with Docker Build (60 min)
- Phase 3: Deploy on Droplet (30 min)
- Phase 4: Functional & Parity Validation (1 hr)
- Phase 5: Customization & Learning Loop (ongoing)

**Status**: Ready to begin, pending human approval
**TTL**: Review after first successful fork deployment or by 2025-11-15

---

## 8. Quick Links for Agents

### Latest Context

**Session Handoffs**: `/agents/context/sessions/`
Find the most recent `SESSION_HANDOFF_YYYY-MM-DD_v*.md` for:
- Next 3 Most Important Tasks (MITs)
- Open questions and blockers
- Recent wins and changes
- Status summary (GREEN/YELLOW/RED)

**Latest**: `SESSION_HANDOFF_2025-10-28_v1.md`

### Architecture Decisions

📍 **ADRs**: `/agents/decisions/`

Recent important decisions:
- `2025-10-28_cloudflare-proxy-trust-config_v01.md` - Fixed redirect loops and SSL trust
- `2025-10-26_infrastructure-syncbricks-adoption_v01.md` - Adopted SyncBricks pattern
- `2025-10-26_mcp_deployment_strategy_v01.md` - MCP Gateway deployment approach
- `2025-10-26_repo_sync_via_sot_not_convention_v01.md` - Sync policy direction

### Infrastructure

📍 **Navigation**: `/docs/infrastructure/INDEX.md`
📍 **Current State**: `/docs/infrastructure/droplet_state_2025-10-28.md`
📍 **Docker Compose**: `/docs/ops/docker-compose.production.yml`

### Ventures

**Operations Studio**: `/business_model/context/ops-studio_v0.1/`
**Founder HQ**: `/business_model/context/founder-hq_v0.41/`
**Digital Case-Worker**: `/business_model/context/digital-case-worker_v0.3/`

### Source of Truth

**Authority Map**: `/z_archive/sot/authority_map_v0_2.json` (to be moved to `/sot/`)
**SoT Architecture**: `/docs/architecture/sot_architecture_v0_2.md`
**Coda Mapping**: `/docs/architecture/integrations/coda/founder_hq_to_sot_v0_2.md`

### Agent Resources

**Startup Checklist**: `/agents/system_startup_checklist_v01.md`
**Agent Operating Manual**: Look in `/agents/` for updated version (recently moved)
**Templates**: `/agents/templates/`

---

## 9. Common AI Agent Tasks

### When You Start a New Session

1. **Read** this overview document (you're doing it now!)
2. **Check** the latest session handoff for current MITs and blockers
3. **Review** any relevant playbooks if working on specific initiatives
4. **Verify** git status to understand pending changes

### When Creating/Editing Documentation

1. **Add metadata headers** (entity, level, zone, version, tags, source_path, date)
2. **Follow naming conventions** (kebab-case, version suffixes like `_v01`)
3. **Link to related docs** (ADRs, playbooks, architecture specs)
4. **Update relevant indexes** (like infrastructure INDEX.md)

### When Making Architecture Decisions

1. **Create an ADR** in `/agents/decisions/YYYY-MM-DD_topic_v01.md`
2. **Use ADR template** (Context, Decision, Alternatives Considered, Consequences, Status)
3. **Reference related ADRs** and link in both directions
4. **Update architecture docs** that the decision affects

### When Working on Infrastructure

1. **Read droplet state** to understand current deployment
2. **Check docker-compose.production.yml** for service configuration
3. **Document changes** in session handoff and relevant guides
4. **Test externally** via https endpoints before marking complete

### When Syncing with Coda

1. **Check authority map** (`/sot/authority_map_v0_2.json`) to see who owns which fields
2. **Respect authority** - only write to fields your system owns
3. **Log sync actions** if making operational changes
4. **Update mapping docs** if discovering new fields or tables

---

## 10. System Principles & Guidelines

### Documentation Standards

**Headers**: All markdown files should have YAML metadata headers:
```yaml
---
- entity: [type of entity]
- level: [beginner|intermediate|advanced|internal]
- zone: [public|internal|private|restricted]
- version: [v01, v02, etc.]
- tags: [relevant, tags, here]
- source_path: [/path/to/this/file.md]
- date: [YYYY-MM-DD]
---
```

**Naming**: Use kebab-case with version suffixes (`system_overview_v01.md`)

**Links**: Use relative paths from repo root (`/docs/architecture/...`)

**Beginner-Friendly**: When introducing technical concepts, provide brief explanations in plain language

### Git Workflow

**Protocol**: PLAN → CONFIRM → APPLY → DIFF → TEST → COMMIT → LOG

**Commits**: Clear, descriptive messages following format:
```
Action: Brief summary

Details:
- Specific change 1
- Specific change 2
- Reference to related ADR/playbook

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Branches**: Currently working on `main` (may change for larger features)

### Security Principles

**Secrets**: Never commit to repo. Use `.env` files on droplet (gitignored)

**Two-network design**: Backend services (databases) isolated from internet-facing services

**HTTPS everywhere**: All external endpoints behind Cloudflare Tunnel with SSL

**Zone-based access**: Different zones (public/internal/private/restricted) have different access controls

---

## 11. Getting Help

### Where to Look

**For agents**:
- This document (system_overview_v01.md) - high-level orientation
- Session handoffs (`/agents/context/sessions/`) - current state and priorities
- Playbooks (`/agents/context/playbooks/`) - multi-phase initiative plans
- ADRs (`/agents/decisions/`) - architecture decisions with rationale

**For infrastructure**:
- INDEX (`/docs/infrastructure/INDEX.md`) - navigation to all infrastructure docs
- Droplet state (`/docs/infrastructure/droplet_state_2025-10-28.md`) - current production state
- Docker Compose (`/docs/ops/docker-compose.production.yml`) - service definitions

**For business context**:
- Venture specs (`/business_model/context/[venture]/`) - positioning, offers, strategy
- Schema guide (`/business_model/SCHEMA_GUIDE_v0.2.md`) - data model overview

### When Stuck

1. **Check session handoff** for known blockers and open questions
2. **Review related ADRs** for historical context on decisions
3. **Ask clarifying questions** to the human operator
4. **Document new discoveries** in session notes or playbooks

---

## 12. Changelog

**2025-10-28** - Document created (v01)
- Initial system overview for AI agent orientation
- Covers Portfolio → Ventures model, dual SoT architecture, infrastructure stack
- Documents current state (operational infra, in-progress automation, future Manifold Navigator)
- Provides beginner-friendly explanations of key technical concepts
- Links to comprehensive documentation and active playbooks

---

**Document Status**: Current as of 2025-10-28
**Next Review**: After major system changes or by 2025-11-15
**Maintained By**: David Kellam + AI agents (Claude Code, others)
**Feedback**: Iterate based on agent usability; add sections as system evolves
