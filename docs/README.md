# Portfolio Documentation Index

**Purpose**: Source of Truth map for all portfolio documentation

**Last Updated**: 2025-12-02

---

## Quick Links

### 🏗️ Architecture & Infrastructure
- **Service Inventory**: `system/architecture/SERVICE_INVENTORY.md` - All deployed services
- **Coda Schema**: `system/architecture/CODA_SCHEMA.md` - BestViable ERP reference
- **MCP Servers**: `system/architecture/MCP_SERVER_CATALOG.md` - Model Context Protocol servers
- **Traefik Routing**: `system/architecture/REVERSE_PROXY.md` - Reverse proxy configuration
- **Architecture Diagrams**: `system/architecture/ARCHITECTURE_DIAGRAMS.md` - System diagrams

### 📊 Planner & Memory Architecture
- **OpenSpec Change**: `../openspec/changes/add-planner-memory-system/` (ACTIVE)
  - Proposal: Why, what, impact
  - Design: Technical decisions, risks, trade-offs
  - Specs: Memory Gateway, Planner Engine, Scheduler Engine, Observer Agent, Infrastructure
  - Tasks: Implementation checklist
  - Dependencies: 4-week sequencing plan

### 📝 Coda Integration
- **BestViable ERP**: `../ventures/best-viable-erp/` (primary reference)
  - Schema: `../ventures/best-viable-erp/coda-schema.md` (authoritative)
  - Pattern Ontology: `../ventures/best-viable-erp/pattern-ontology.md` (design philosophy)
  - Table IDs: `../ventures/best-viable-erp/coda_table_ids.txt` (API reference)
  - README: `../ventures/best-viable-erp/README.md` (overview & entry point)
- **Lightweight Scripts**: `system/scripts/coda-scripts/` (token-efficient API access)
  - README: Usage patterns and examples
  - USAGE.md: Complete documentation with scenarios
  - Scripts: 7 core Python scripts (get_document, list_documents, list_rows, create_row, update_row, delete_row, get_table)
- **Coda Config**: `../config/coda-config.md` (central SoT for Coda doc references)

### 🔗 MCP & API Integration
- **MCP Specifications**: `system/library/mcp-specifications/`
  - MCP 2025-11-25 Spec: `mcp-spec-2025-11-25.md`
  - Update Summary: `mcp-2025-update-summary-workos.md` (new features: Tasks API, CIMD OAuth, Extensions)
  - Stytch MCP Guide: `stytch-mcp-guide.md` (authentication pattern)
- **MCP Server Catalog**: `system/architecture/MCP_SERVER_CATALOG.md` (all MCP servers)
- **MCP Implementation Guide**: `system/architecture/MCP_IMPLEMENTATION_GUIDE.md`

### 🤖 Agents & Automation
- **N8N Workflows**: `system/workflows/n8n/WORKFLOW_README.md` - Workflow documentation
- **Lightweight Coda Scripts**: `../openspec/changes/add-lightweight-coda-scripts/` (ACTIVE)
  - Proposal: 95-99% token savings vs. MCP
  - Design: Caching, local processing, progressive disclosure
  - Usage: Token efficiency examples and scenarios

### 💡 Prompts & Intelligence
- **Manifold Navigator v1.3**: `system/prompts/manifold_navigator_v1_3_macro_aware.md` (multi-scale analysis)
- **Claude Code Capabilities**: `system/prompts/claude-code-capabilities.md`
- **Change Exploration Prompt**: `system/prompts/change-explore-code-execution.md` (code execution as MCP alternative)

---

## OpenSpec - Source of Truth

### 📋 Project Structure
- **Specs**: `../openspec/specs/` (authoritative current truth)
  - coda-schema/spec.md - Coda schema requirements
  - memory-gateway/spec.md - Memory API spec
  - planner-engine/spec.md - Planner API spec
  - scheduler-engine/spec.md - Scheduler API spec
  - observer-agent/spec.md - Observer Agent spec
  - infrastructure/spec.md - Infrastructure (Valkey, Postgres, Qdrant, n8n)

- **Active Changes**: `../openspec/changes/`
  - add-planner-memory-system/ - Planner & Memory Architecture (PRIMARY)
  - add-lightweight-coda-scripts/ - Code execution alternative to MCP
  - implement-mcp-oauth-strategy-and-sop/ - OAuth 2.1 implementation

- **Archived Changes**: `../openspec/changes/archive/`
  - 2025-12-02-investigate-archon-memory-architecture/ - Investigation archived (superseded)
  - 2025-12-02-coda-pattern-tables-implementation/ - Tables exist (archived)
  - 2025-12-02-coda-mcp-pattern-integration/ - Pattern tools deferred (archived)
  - See COMPLETION.md in each for rationale

---

## Legacy & Reference Documentation

### ⚠️ Superseded (Keep for Reference Only)
- **Draft Specs**: `system/architecture/planner_memory_architecture_specs_v_0_1.md` (SUPERSEDED by OpenSpec)
  - Original draft specifications (2025-11-30)
  - Superseded by `add-planner-memory-system` OpenSpec change (2025-12-02)
  - Use OpenSpec for current truth, this doc for historical context

### 📦 Archived Context (Legacy)
- **BestViable ERP Archive**: `../ventures/best-viable-erp/archive/` (legacy "Founder HQ" era docs)
- **Stytch Setup**: `system/architecture/STYTCH_SETUP_GUIDE.md` (authentication setup, may be outdated)
- **Capacity Planning**: `system/architecture/CAPACITY_PLANNING.md` (pre-Planner planning, legacy)

---

## Navigation by Use Case

### 🚀 Deploying New Service
1. Read: `system/architecture/SERVICE_INVENTORY.md` (current services)
2. Reference: `system/architecture/ARCHITECTURE_DIAGRAMS.md` (system layout)
3. Follow: Related OpenSpec change in `../openspec/changes/`
4. Config: `system/architecture/REVERSE_PROXY.md` (Traefik labels)

### 🔌 Integrating with Coda
1. Start: `../config/coda-config.md` (Coda doc reference)
2. Schema: `../ventures/best-viable-erp/coda-schema.md` (what tables exist)
3. Pattern: `../ventures/best-viable-erp/pattern-ontology.md` (how data relates)
4. Scripts: `system/scripts/coda-scripts/USAGE.md` (API access patterns)
5. Specs: `../openspec/specs/coda-schema/spec.md` (formal requirements)

### 🤖 Building MCP Servers
1. Reference: `system/architecture/MCP_SERVER_CATALOG.md` (existing servers)
2. Spec: `system/library/mcp-specifications/mcp-spec-2025-11-25.md` (latest spec)
3. Guide: `system/architecture/MCP_IMPLEMENTATION_GUIDE.md` (patterns)
4. Example: `../openspec/changes/implement-mcp-oauth-strategy-and-sop/` (OAuth pattern)

### 🧠 Understanding Memory Architecture
1. Overview: `../openspec/changes/add-planner-memory-system/proposal.md`
2. Design: `../openspec/changes/add-planner-memory-system/design.md` (decisions & trade-offs)
3. Specs: `../openspec/specs/memory-gateway/spec.md` (API details)
4. Integration: `../ventures/best-viable-erp/README.md` (how it uses Coda)

### ⚡ Token-Efficient Coda Access
1. Why: `../openspec/changes/add-lightweight-coda-scripts/proposal.md` (95-99% savings)
2. How: `system/scripts/coda-scripts/USAGE.md` (examples & scenarios)
3. Code: `system/scripts/coda-scripts/` (7 core scripts)

---

## Documentation Maintenance

### Adding New Documentation
1. Create in appropriate subdirectory (`system/architecture/`, `system/scripts/`, etc.)
2. Add entry to this index under relevant section
3. If creating new capability: Add entry to `../openspec/specs/`
4. If creating architectural doc: Cross-reference in SERVICE_INVENTORY.md

### Updating Coda References
- **Central SoT**: `/config/coda-config.md` - Update here first
- **Schema**: `/ventures/best-viable-erp/coda-schema.md` - Update for table changes
- **Specs**: `../openspec/specs/coda-schema/spec.md` - Update for requirement changes
- **Table IDs**: `/ventures/best-viable-erp/coda_table_ids.txt` - Regenerate after schema changes

### Archiving Documentation
1. Move to appropriate `archive/` subdirectory
2. Create `archive/README.md` explaining why archived
3. Update this index (move to "Legacy & Reference" section)
4. Keep for historical context (don't delete)

---

## Frequently Accessed Files

| Need | File | Purpose |
|------|------|---------|
| What services are running? | `system/architecture/SERVICE_INVENTORY.md` | Deployed services, ports, domains |
| How do I access Coda? | `../config/coda-config.md` | Doc ID, references, API access |
| What tables exist in Coda? | `../ventures/best-viable-erp/coda-schema.md` | Complete schema reference |
| How do Patterns work? | `../ventures/best-viable-erp/pattern-ontology.md` | Design philosophy |
| What's being built? | `../openspec/changes/add-planner-memory-system/` | Current initiative specs |
| How to query Coda efficiently? | `system/scripts/coda-scripts/USAGE.md` | Token-efficient examples |
| What's the current state? | `system/architecture/ARCHITECTURE_DIAGRAMS.md` | System overview |

---

## Documentation Standards

### For SoT (Source of Truth) Docs
- **Status**: Mark as "ACTIVE (Source of Truth)" or "SUPERSEDED"
- **Last Updated**: Include date
- **Maintainer**: Who's responsible
- **Cross-References**: Link to related docs

### For OpenSpec Changes
- **proposal.md**: Why, what, impact
- **design.md**: Technical decisions, alternatives, risks
- **tasks.md**: Implementation checklist
- **specs/**: Delta requirements (ADDED, MODIFIED, REMOVED)

### For Legacy Docs
- **Archive header**: Explain why archived, when
- **Current version**: Link to active replacement
- **Don't delete**: Keep for historical context

---

**Navigation**:
- Looking for [Architecture & Infrastructure](#-architecture--infrastructure)?
- Looking for [Coda Integration](#-coda-integration)?
- Looking for [OpenSpec](#openspec---source-of-truth)?
- Looking for [Quick Links by Use Case](#navigation-by-use-case)?

**Last Updated**: 2025-12-02
**Maintainer**: David Kellam
