# Cloudflare Workers MCP Servers

**Status:** Planning - To be deployed in Phase 2

## Servers to Deploy

### 1. mcp-coda (CRITICAL)
- **Source:** /archive/integrations/mcp/servers/coda/
- **Status:** Currently on old docker_proxy network (502 error)
- **Plan:** Migrate to Cloudflare Workers
- **Timeline:** High priority (Phase 2.1)

**Migration Steps:**
1. Copy source to workers structure
2. Adapt for Workers runtime (replace Node.js with Workers API)
3. Create wrangler.toml configuration
4. Deploy via wrangler CLI
5. Update Cloudflare Tunnel routes
6. Remove Docker container

### 2. mcp-time (SIMPLE)
- **Status:** Not yet created
- **Plan:** Simple date/time service
- **Timeline:** After Coda (Phase 2.2)

### 3. Self-Hosted MCPs (mcp-fs, mcp-sql, mcp-openmemory)
- **Status:** Docker templates ready
- **Timeline:** Phase 2.3
- **Platform:** Docker Compose (keep on droplet)
- **Deployment:** /infra/mcp-servers/docker-compose.yml

## Cloudflare Workers Development

To develop locally:
```bash
npm install -g wrangler
wrangler login
```

To deploy:
```bash
cd integrations/cloudflare-workers/mcp-coda/
wrangler deploy
```

## Notes

- Coda MCP already has HTTP + SSE transport (no code changes needed?)
- Check src/ files before beginning migration
- OAuth setup may need KV namespace for token storage
