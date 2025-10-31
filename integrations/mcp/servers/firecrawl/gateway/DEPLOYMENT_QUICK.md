# Firecrawl MCP Gateway - Quick Deploy

## Overview
- **Service**: `firecrawl-mcp-gateway`
- **Port**: 8083
- **Endpoint**: `https://firecrawl.bestviable.com/mcp`
- **Transport**: Streamable HTTP (POST/GET/DELETE `/mcp`)
- **OAuth Discovery**: `https://firecrawl.bestviable.com/.well-known/oauth-authorization-server`

## Prerequisites
- Firecrawl API Key from https://firecrawl.dev
- Add to `.env`: `FIRECRAWL_API_KEY=<your-api-key>`

## Deploy

```bash
# Build
docker compose build firecrawl-mcp-gateway

# Start
docker compose up -d firecrawl-mcp-gateway

# Verify
curl http://localhost:8083/health
```

## Environment Variables
```env
FIRECRAWL_API_KEY=fc_...  # Required
```

## Token Validation
- Called on startup: validates token with `https://api.firecrawl.dev/health`
- Per-request: validates token before allowing web scraping operations

## Client Config (Claude Desktop)

```json
{
  "mcpServers": {
    "firecrawl": {
      "transport": "http",
      "url": "https://firecrawl.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${FIRECRAWL_API_KEY}"
      }
    }
  }
}
```

## Logs
```bash
docker logs -f firecrawl-mcp-gateway
```

## Rate Limiting
- 10 requests/min per IP on OAuth discovery
- Firecrawl API has its own rate limits (check their docs)
