# GitHub MCP Gateway - Quick Deploy

## Overview
- **Service**: `github-mcp-gateway`
- **Port**: 8081
- **Endpoint**: `https://github.bestviable.com/mcp`
- **Transport**: Streamable HTTP (POST/GET/DELETE `/mcp`)
- **OAuth Discovery**: `https://github.bestviable.com/.well-known/oauth-authorization-server`

## Prerequisites
- GitHub Personal Access Token with `repo`, `read:user`, `gist` scopes
- Add to `.env`: `GITHUB_PERSONAL_ACCESS_TOKEN=<your-token>`

## Deploy

```bash
# Build
docker compose build github-mcp-gateway

# Start
docker compose up -d github-mcp-gateway

# Verify
curl http://localhost:8081/health
```

## Environment Variables
```env
GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_...  # Required
```

## Token Validation
- Called on startup: validates token with `https://api.github.com/user`
- Per-request: validates token before allowing access to MCP tools

## Client Config (Claude Desktop)

```json
{
  "mcpServers": {
    "github": {
      "transport": "http",
      "url": "https://github.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

## Logs
```bash
docker logs -f github-mcp-gateway
```
