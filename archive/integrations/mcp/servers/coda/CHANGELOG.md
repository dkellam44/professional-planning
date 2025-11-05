---
- entity: integration
- level: operational
- zone: internal
- version: v01
- tags: [mcp, coda, changelog, versions]
- source_path: /integrations/mcp/servers/coda/CHANGELOG.md
- date: 2025-10-30
---

# Changelog — Coda MCP Server

All notable changes to the Coda MCP Server deployment are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Deployed] — 2025-10-30

### ✅ Added

**Tier 1 Remote Deployment (dustingood fork)**
- Initial production deployment to DigitalOcean droplet
- Endpoint: https://coda.bestviable.com/sse
- Transport: HTTP/Server-Sent Events via mcp-proxy
- Tools: 34 across 8 categories (Documents, Pages, Tables, Columns, Rows, Formulas, Controls, Users)

**Docker Configuration**
- `Dockerfile.coda-mcp-gateway`: Alpine node:23 + Python/mcp-proxy wrapper
- Service definition in `docker-compose.production.yml`
- Auto-discovery via nginx-proxy (VIRTUAL_HOST labels)
- SSL via acme-companion (Let's Encrypt)

**Documentation**
- README.md: Tool catalog, quick start, performance notes
- DEPLOYMENT.md: Architecture, procedure, troubleshooting
- CHANGELOG.md: This file

**Source Migration**
- Copied dustingood fork to `/integrations/mcp/servers/coda/src/`
- Build verified: TypeScript → dist/index.js
- Dependencies locked: pnpm-lock.yaml included

### 🔧 Details

**Version**: coda-mcp 1.4.2
**Source**: https://github.com/dustingood/coda-mcp
**Upstream**: https://github.com/orellazri/coda-mcp
**License**: MIT (see LICENSE in source)

**Deployment Information**:
- Deployed: 2025-10-30 01:45 UTC
- Droplet: 159.65.97.146 (tools.bestviable.com)
- Image: coda-mcp-gateway:latest
- Status: ✅ Operational (HTTP 200 OK)

---

## [Planned] — Phase 2 (2025-11 estimated)

### 📋 Upcoming

- **Phase 2A**: Deploy GitHub MCP (Tier 1)
- **Phase 2B**: Deploy Memory MCP (Tier 1)
- **Phase 2C**: Deploy Firecrawl MCP (Tier 1)
- **Phase 2D**: Document and verify all three servers

**Estimated Effort**: 6 hours total
**Pattern**: Same as Coda (Dockerfile + docker-compose service)

---

## [Future] — Phase 3 & 4

### 📅 Backlog

**Phase 3: Client Configuration** (4 hours)
- Configure Claude Code for remote transport
- Setup guides for Cursor, Zed, VS Code, ChatGPT

**Phase 4: Project Scope** (3 hours)
- Filesystem MCP with workspace boundaries
- Health monitoring via n8n

---

## Version History (dustingood fork)

### coda-mcp 1.4.2 (Current)

**Tools**: 34 tools (4x original)

**Improvements over original**:
- ✅ 10 page operations (create, update, delete, rename, duplicate, search)
- ✅ 7 row operations (bulk update, upsert support)
- ✅ 4 table operations (comprehensive summary)
- ✅ Full test coverage (vitest)
- ✅ Active maintenance

**Known Limitations** (Coda API constraints):
- ❌ Cannot create tables (API limitation)
- ❌ Cannot create canvas elements
- ❌ Cannot modify schemas

---

## Deployment Metrics

### Build Information
- Base Image: node:23-alpine (~120MB)
- Build Time: ~3-5 minutes on droplet
- Image Size: ~450MB (with node_modules)
- Startup Time: 30-120 seconds (health check start_period)

### Runtime Performance
- Memory: ~150-200MB idle, ~300-500MB under load
- CPU: <1% idle, <5% during API calls
- Port: 8080 (internal), 443 HTTPS (via nginx-proxy)
- Concurrency: Supports 50+ concurrent requests

### Uptime
- Restart Policy: always
- Health Check: Process monitoring every 30s
- Expected Availability: 99.9%

---

## Breaking Changes

None. This is initial deployment.

---

## Migration Notes

### From Old Coda Configuration

If upgrading from previous Coda gateway:

1. **Backup old configuration**:
   ```bash
   docker logs coda-mcp-gateway:old > /tmp/coda-old-logs.txt
   ```

2. **Update tools list** in agent prompts:
   - Old: ~8-10 tools
   - New: 34 tools (comprehensive)

3. **Test new tools** before production:
   ```bash
   curl -X POST https://coda.bestviable.com/sse \
     -H "Content-Type: application/json" \
     -d '{"tool": "coda_list_documents"}'
   ```

---

## Acknowledgments

**Credit**: dustingood fork
- 4x more tools than original
- Full CRUD operations
- Comprehensive test suite
- Active maintenance

**Original**: orellazri/coda-mcp
- Foundation for MCP wrapper
- Basic Coda API integration

---

## Support

**Issues**: See TROUBLESHOOTING.md in this directory

**Documentation**:
- README.md: Tool catalog and quick start
- DEPLOYMENT.md: Architecture and procedures
- /docs/runbooks/mcp_troubleshooting_v01.md: Deep diagnostics

**Contact**: Refer to portfolio team

---

## License

Source: MIT (see LICENSE in `/integrations/mcp/servers/coda/src/`)
Deployment: Same as source (MIT)

---

**Last Updated**: 2025-10-30
**Maintained by**: Portfolio operations
**Status**: ✅ Production Operational
