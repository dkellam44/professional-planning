---
entity: index
level: internal
zone: internal
version: "0.1"
tags: [playbooks, index, navigation, agents]
source_path: agents/context/playbooks/INDEX.md
date: 2025-10-31
status: active
---

# Playbooks Index

Quick reference to all available playbooks for stateless agents.

## Current Active Playbooks

### Infrastructure & Deployment

**HTTP-Native MCP Server Implementation** (`http_native_mcp_server_v01.md`)
- **Purpose:** Transform stdio MCP server to HTTP-native with integrated OAuth
- **Use When:** Implementing or troubleshooting MCP HTTP servers
- **Status:** Ready for implementation
- **Created:** 2025-10-31
- **Key Sections:** MCP spec, implementation phases, OAuth integration, testing

**Coda MCP OAuth Implementation** (`coda_mcp_oauth_implementation_v01.md`)
- **Purpose:** Implement OAuth 2.0 for MCP gateway (previous approach)
- **Use When:** Understanding OAuth flow, troubleshooting authentication
- **Status:** Deprecated by HTTP-native approach, but OAuth patterns reused
- **Created:** 2025-10-31
- **Key Sections:** OAuth flow, PKCE, ChatGPT connector setup

**Coda MCP Gateway Upgrade Plan** (`coda_mcp_gateway_upgrade_plan_v01.md`)
- **Purpose:** Upgrade Coda MCP to gateway wrapper architecture
- **Use When:** Historical context only (superseded by HTTP-native)
- **Status:** Deprecated
- **Created:** 2025-10-30

**Droplet Cleanup and Archive Plan** (`droplet_cleanup_archive_plan_v01.md`)
- **Purpose:** Archive old code, clean up droplet after HTTP-native deployment
- **Use When:** Post-deployment cleanup and maintenance
- **Status:** Ready for execution after deployment
- **Created:** 2025-10-31
- **Key Sections:** Archive strategy, cleanup procedures, backup/restore

**MCP Architecture Implementation** (`mcp_architecture_implementation_playbook_v01.md`)
- **Purpose:** General MCP architecture patterns and best practices
- **Use When:** Planning new MCP integrations
- **Status:** Active reference
- **Created:** 2025-10-30

**MCP DigitalOcean Cloudflare Deploy** (`mcp_digitalocean_cloudflare_deploy_v01.md`)
- **Purpose:** Deploy MCP servers to DigitalOcean with Cloudflare Tunnel
- **Use When:** Setting up new droplets or MCP services
- **Status:** Active (SyncBricks pattern)
- **Created:** 2025-10-30

**MCP Server Onboarding Template** (`mcp_server_onboarding_template_v01.md`)
- **Purpose:** Template for adding new MCP servers to infrastructure
- **Use When:** Onboarding new MCP integrations
- **Status:** Active template
- **Created:** 2025-10-30

### System & Operations

**System SoT Consolidation** (`system_sot_consolidation_playbook_v01.md`)
- **Purpose:** Consolidate Source of Truth across portfolio
- **Use When:** Working on documentation structure and authority mapping
- **Status:** In progress
- **Created:** 2025-10-29

**Cloudflare Onboarding** (`cloudflare_onboarding_v01.md`)
- **Purpose:** Set up Cloudflare Tunnel and DNS
- **Use When:** Adding new services or troubleshooting tunnels
- **Status:** Active reference
- **Created:** 2025-10-29

**DigitalOcean Onboarding** (`digitalocean_onboarding_v01.md`)
- **Purpose:** Provision and configure DigitalOcean droplets
- **Use When:** Creating new droplets
- **Status:** Active reference
- **Created:** 2025-10-29

### Quick Starts

**Phase 1B Quick Start** (`PHASE_1B_QUICK_START.md`)
- **Purpose:** Fast-track deployment guide
- **Use When:** Need rapid deployment without deep context
- **Status:** Active
- **Created:** 2025-10-30

## Playbook Selection Guide

### I need to...

**Deploy a new MCP server:**
1. Start with: `http_native_mcp_server_v01.md` (recommended)
2. Or legacy: `mcp_architecture_implementation_playbook_v01.md`
3. Infrastructure: `mcp_digitalocean_cloudflare_deploy_v01.md`

**Implement OAuth for MCP:**
1. Start with: `http_native_mcp_server_v01.md` (Phase 2)
2. Reference: `coda_mcp_oauth_implementation_v01.md` (OAuth patterns)

**Troubleshoot MCP authentication:**
1. Check: `coda_mcp_oauth_implementation_v01.md` (OAuth flow debugging)
2. Reference: `http_native_mcp_server_v01.md` (Bearer token setup)

**Clean up after deployment:**
1. Use: `droplet_cleanup_archive_plan_v01.md`

**Set up infrastructure:**
1. Droplet: `digitalocean_onboarding_v01.md`
2. Tunnel: `cloudflare_onboarding_v01.md`
3. MCP Deploy: `mcp_digitalocean_cloudflare_deploy_v01.md`

**Understand current work:**
1. Check: `SESSION_HANDOFF_*` (latest in sessions/)
2. Then: Relevant playbook from above

## Playbook Lifecycle

### Status Definitions

- **Draft:** Work in progress, not ready for execution
- **Active:** Ready to use, actively maintained
- **Deprecated:** Superseded by newer approach, kept for reference
- **Archived:** Moved to z_archive/, historical only

### Update Protocol

When creating or updating playbooks:
1. Add frontmatter metadata (entity, level, zone, version, tags, date)
2. Update this INDEX.md
3. Update `system_startup_checklist_v01.md` if startup-critical
4. Link related playbooks in `related:` field
5. Update status when deprecating or archiving

### Version Control

- Use semantic versioning: v01, v02, etc.
- Don't delete old versions immediately
- When creating v02, update INDEX to reference new version
- Archive old versions after 90 days if no longer referenced

## External References

See: `agents/context/external_references/mcp_official_docs_v01.md` for:
- Official MCP specification
- TypeScript SDK documentation
- Community resources
- OAuth RFCs

## Maintenance

**Last Updated:** 2025-10-31
**Maintained By:** Stateless agents (update on playbook create/modify)
**Review Cadence:** Monthly or when major changes occur
