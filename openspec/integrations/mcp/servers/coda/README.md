# Coda MCP Server

A Model Context Protocol (MCP) server for Coda with Cloudflare Access JWT authentication and Bearer token fallback for development.

## Features

- ✅ **Cloudflare Access JWT Authentication** - Validates JWT tokens from Cloudflare Access
- ✅ **Bearer Token Fallback** - Supports Bearer token authentication for local development
- ✅ **Coda API Proxy** - Proxies MCP requests to Coda API with proper authentication
- ✅ **Health Checks** - Built-in health and status endpoints
- ✅ **Docker Support** - Containerized deployment with nginx-proxy integration
- ✅ **Environment Configuration** - Flexible configuration via environment variables
- ✅ **Error Handling** - Comprehensive error handling and logging

## Authentication

### Cloudflare Access JWT (Production)
When deployed behind Cloudflare Access, the server validates JWT tokens from the `cf-access-jwt-assertion` header.

### Bearer Token (Development)
For local development, you can use Bearer token authentication:
```bash
curl -H "Authorization: Bearer your_token" http://localhost:8080/mcp
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CODA_API_TOKEN` | ✅ | - | Your Coda API token from https://coda.io/account/settings/api |
| `AUTH_MODE` | ❌ | `both` | Authentication mode: `cloudflare`, `bearer`, or `both` |
| `BEARER_TOKEN` | ❌ | - | Bearer token for development mode |
| `PORT` | ❌ | `8080` | Server port |
| `HOST` | ❌ | `0.0.0.0` | Server host |
| `LOG_LEVEL` | ❌ | `info` | Log level: `debug`, `info`, `warn`, `error` |

## Endpoints

- `GET /health` - Health check with authentication status
- `GET /status` - Lightweight status check
- `POST /mcp` - MCP endpoint (proxies to Coda API)

## Deployment

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your CODA_API_TOKEN

# Run in development mode
npm run dev
```

### Docker Deployment
```bash
# Build and run with docker-compose
docker-compose up -d
```

### Infrastructure Deployment
```bash
# Deploy to infrastructure
cd infra/mcp-servers
cp .env.example .env
# Edit .env with your CODA_API_TOKEN
docker-compose up -d
```

## Testing

### Test Health Endpoint
```bash
# Without authentication (should fail)
curl http://localhost:8080/health

# With Bearer token (development)
curl -H "Authorization: Bearer dev_token" http://localhost:8080/health
```

### Test MCP Endpoint
```bash
# With Bearer token
curl -X POST -H "Authorization: Bearer dev_token" \
  -H "Content-Type: application/json" \
  -d '{"method": "GET", "path": "/docs"}' \
  http://localhost:8080/mcp
```

## Security

- All endpoints except `/health` and `/status` require authentication
- JWT validation uses Cloudflare's public keys
- Bearer tokens are validated in development mode
- No tokens are logged or exposed in responses
- Service runs as non-root user in container

## Architecture

```
User Request → Cloudflare Access → Coda MCP Server → Coda API
     ↓              ↓                    ↓              ↓
  JWT Token    Validate JWT      Validate Auth    API Call
  or Bearer    or Bearer         Proxy Request    with Token
```

## Error Handling

- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Valid auth but insufficient permissions
- **503 Service Unavailable** - Coda API or token storage issues
- **500 Internal Server Error** - Unexpected server errors

## Logs

The server logs authentication events and errors:
```
[INFO] Cloudflare Access JWT validated for: user@example.com
[WARN] Cloudflare Access JWT validation failed: JWT expired
[DEBUG] Bearer token authenticated for: developer@localhost
[ERROR] MCP request failed: Coda API error
```

## Troubleshooting

### Coda API Token Issues
- Ensure your token is valid and has required permissions
- Check token expiration date
- Verify token is correctly set in environment

### Authentication Issues
- Check Cloudflare Access team domain configuration
- Verify JWT token is being sent in `cf-access-jwt-assertion` header
- For Bearer token, ensure `Authorization: Bearer token` header is present

### Network Issues
- Verify container can reach Coda API
- Check firewall rules and network connectivity
- Ensure proper DNS resolution

## Related Documentation

- [MCP OAuth Strategy & SOP](../../../../changes/implement-mcp-oauth-strategy-and-sop/proposal.md)
- [MCP Server Catalog](../../../../docs/architecture/integrations/mcp/MCP_SERVER_CATALOG.md)