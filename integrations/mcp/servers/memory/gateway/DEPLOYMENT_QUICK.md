# Memory MCP Gateway - Quick Deploy

## Overview
- **Service**: `memory-mcp-gateway`
- **Port**: 8082
- **Endpoint**: `https://memory.bestviable.com/mcp`
- **Transport**: Streamable HTTP (POST/GET/DELETE `/mcp`)
- **OAuth Discovery**: `https://memory.bestviable.com/.well-known/oauth-authorization-server`
- **Storage**: Persistent volume at `/data` for knowledge graph

## Prerequisites
- Persistent volume configured: `./data/memory-mcp:/data`
- No API token required (local filesystem storage)

## Deploy

```bash
# Build
docker compose build memory-mcp-gateway

# Start
docker compose up -d memory-mcp-gateway

# Verify
curl http://localhost:8082/health
```

## Environment Variables
None required for API authentication.

## Token Validation
- Any Bearer token >= 3 characters is accepted
- Used as session identifier for shared knowledge graph access
- Memory persists across sessions via `/data` volume

## Client Config (Claude Desktop)

```json
{
  "mcpServers": {
    "memory": {
      "transport": "http",
      "url": "https://memory.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer any-session-token"
      }
    }
  }
}
```

## Logs
```bash
docker logs -f memory-mcp-gateway
```

## Data Persistence
Knowledge graph data stored in: `/root/portfolio/infra/docker/data/memory-mcp/`

To backup:
```bash
docker cp memory-mcp-gateway:/data /backup/memory-$(date +%s)
```
