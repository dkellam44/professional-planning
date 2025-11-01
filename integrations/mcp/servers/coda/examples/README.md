# Coda MCP Examples

Example scripts and demonstrations for using the Coda MCP HTTP-Native Server.

## Quick Start

### 1. Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "service": "coda-mcp",
  "version": "1.0.0",
  "timestamp": "2025-11-01T21:00:00.000Z"
}
```

### 2. Discover OAuth Server Metadata

```bash
curl http://localhost:8080/.well-known/oauth-authorization-server | jq .
```

### 3. Make an MCP Request

See `curl-mcp-request.sh` for a complete example.

## Examples

### `curl-mcp-request.sh`

Makes a complete HTTP MCP request to the server, demonstrating:
- Health check endpoint
- OAuth metadata discovery
- Session-based MCP request
- Session persistence

**Usage**:
```bash
# Set your Coda API token
export CODA_API_TOKEN=your-actual-token

# Run the example
./curl-mcp-request.sh

# Or specify a custom server
./curl-mcp-request.sh http://coda.bestviable.com
```

**What it does**:
1. Checks server health
2. Queries OAuth server metadata
3. Makes a `resources/list` MCP request with session ID
4. Parses and displays the response

### `token-estimation-demo.ts`

Demonstrates token estimation and context budgeting.

**Topics covered**:
- Estimating tokens for plain text
- Estimating tokens for JSON objects
- Session-level token budgeting
- Multi-tool request sequences
- Preventing token overflow
- Progressive disclosure strategy

**Usage**:
```bash
# Build first
pnpm build

# Run the demo
node dist/examples/token-estimation-demo.js
```

**Output example**:
```
=== Example 1: Plain Text Estimation ===

Short text: "Hello world"
  Length: 11 characters
  Estimated tokens: 50

Long text: "The quick brown fox jumps over the lazy dog..."
  Length: 200 characters
  Estimated tokens: 50
```

## Manual Testing

### Test Bearer Token Authentication

```bash
# Request without token (should fail)
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 401 Unauthorized

# Request with token (should work)
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer your-coda-token" \
  -H "Mcp-Session-Id: session-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "resources/list",
    "params": {}
  }'
```

### Test Cloudflare Access Headers

```bash
curl http://localhost:8080/health \
  -H "Cf-Access-Jwt-Assertion: test-jwt-token" \
  -H "Cf-Access-Authenticated-User-Email: user@example.com"

# Check logs for: [CLOUDFLARE] Access request from: user@example.com
```

### Test Session Persistence

```bash
# Session ID (or use $(uuidgen))
SESSION_ID="12345678-1234-1234-1234-123456789012"

# Create session and make first request
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer token1" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"resources/list","params":{}}'

# Reuse session with second request (same session ID)
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer token1" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"docs/list","params":{}}'

# Stream responses (SSE)
curl -X GET http://localhost:8080/mcp \
  -H "Mcp-Session-Id: $SESSION_ID"

# Terminate session
curl -X DELETE http://localhost:8080/mcp \
  -H "Mcp-Session-Id: $SESSION_ID"
```

### Monitoring Logs

```bash
# In local development
node dist/http-server.js

# In Docker
docker logs coda-mcp
docker logs -f coda-mcp
```

Look for these log patterns:
- `[HTTP]` - Request logging
- `[OAUTH]` - OAuth endpoint access
- `[CLOUDFLARE]` - Cloudflare Access requests
- `[Auth]` - Bearer token configuration
- `[MCP]` - MCP protocol events
- `[MEMORY]` - Memory hook invocations
- `[METRICS]` - Session metrics
- `[ERROR]` - Error conditions

## API Reference

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | None | Health check |
| GET | `/.well-known/oauth-authorization-server` | None | OAuth metadata (RFC 8414) |
| GET | `/.well-known/oauth-protected-resource` | None | Protected resource metadata |
| POST | `/oauth/validate-token` | None | Validate Bearer token |
| POST | `/mcp` | Bearer | MCP request (JSON-RPC) |
| GET | `/mcp` | Bearer | SSE stream for session |
| DELETE | `/mcp` | Bearer | Terminate session |

### Headers

**Session Management**:
- `Mcp-Session-Id` (required for GET/DELETE, optional for new POST)

**Authentication**:
- `Authorization: Bearer {token}` (for /mcp endpoints)
- `Cf-Access-Jwt-Assertion` (from Cloudflare Access)
- `Cf-Access-Authenticated-User-Email` (from Cloudflare Access)

**Content**:
- `Content-Type: application/json`

**CORS**:
- `Origin` (validated in development)

### JSON-RPC Format

MCP uses JSON-RPC 2.0 protocol:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "limit": 10
  }
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resources": [...]
  }
}
```

Or error:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

## Troubleshooting

### "Bearer token required"
- Solution: Add `Authorization: Bearer your-token` header

### "Invalid session ID"
- Solution: Use a valid UUID or create new session by omitting `Mcp-Session-Id`

### "Connection refused"
- Solution: Ensure server is running on correct port (default 8080)

### Logs not showing token details
- This is intentional: tokens are truncated (only first 8 chars shown)
- Example: `token: abc12345...`

## Next Steps

- Read [CLAUDE.md](../CLAUDE.md) for architecture details
- Read [DOCKERFILE_MIGRATION_NOTES.md](../DOCKERFILE_MIGRATION_NOTES.md) for deployment
- See [test-oauth.sh](../test-oauth.sh) for comprehensive OAuth tests
- Check source code in [src/](../src/) for implementation details

## Support

For issues or questions:
1. Check [CLAUDE.md](../CLAUDE.md) troubleshooting section
2. Review server logs: `docker logs coda-mcp`
3. Verify token validity with `/oauth/validate-token` endpoint
4. Test health endpoint: `curl /health`
