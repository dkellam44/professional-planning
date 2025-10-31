# Coda MCP Gateway Deployment Checklist

## Pre-Deployment Validation

### Local (Current Machine)

- [ ] All gateway source files copied and modified
  ```bash
  ls -la integrations/mcp/servers/coda/gateway/src/
  # Should show: server.ts, auth/, middleware/, utils/
  ```

- [ ] Token validation implemented
  ```bash
  grep -n "verifyToken" integrations/mcp/servers/coda/gateway/src/middleware/token-validation.ts
  # Should show Coda API call to https://api.coda.io/v1/whoami
  ```

- [ ] Dockerfile updated with multi-stage build
  ```bash
  grep -A 5 "BUILD CODA STDIO MCP SERVER" integrations/mcp/servers/coda/gateway/Dockerfile
  # Should show Coda MCP build stage
  ```

- [ ] docker-compose.production.yml updated
  ```bash
  grep -A 20 "coda-mcp-gateway:" infra/docker/docker-compose.production.yml
  # Should show new Dockerfile path and streamable HTTP health check
  ```

## Droplet Deployment

### 1. Sync Changes to Droplet

```bash
# SSH to droplet
ssh tools-droplet-agents

# Navigate to portfolio directory
cd /root/portfolio

# Verify changes were synced (if using git)
git status | grep -E "gateway|docker-compose"
```

### 2. Build Docker Image

```bash
# From droplet, in /root/portfolio
docker compose -f infra/docker/docker-compose.production.yml \
  --env-file infra/config/.env \
  build --no-cache coda-mcp-gateway

# Monitor build (15-20 minutes)
# Watch for:
# - pnpm install succeeding for gateway
# - pnpm install succeeding for Coda MCP
# - tsc compilation succeeding
# - Multi-stage build completing
```

**Expected Output:**
```
Successfully tagged coda-mcp-gateway:latest
```

### 3. Verify Image Built

```bash
docker images | grep coda-mcp
# Should show: coda-mcp-gateway    latest    <id>    <time>
```

### 4. Test Image (Optional)

```bash
# Check build artifacts are present
docker run --rm coda-mcp-gateway:test ls -la /app/dist/
# Should show: server.js, ...

docker run --rm coda-mcp-gateway:test ls -la /app/mcp/dist/
# Should show: index.js, ...
```

### 5. Start Container

```bash
# Stop old container if running
docker compose stop coda-mcp-gateway

# Start new container
docker compose up -d coda-mcp-gateway

# Monitor startup logs
docker logs -f coda-mcp-gateway

# Wait for these messages:
# ✓ Validating Coda API token...
# ✓ Token validation successful
# ✓ Connecting to Coda stdio MCP server...
# ✓ Connected to Coda stdio MCP server
# [coda-mcp] HTTP Gateway listening on port 8080
```

### 6. Health Checks

```bash
# Check container is running
docker ps | grep coda-mcp-gateway
# Should show container with status "Up"

# Check health endpoint
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","service":"coda-mcp","version":"1.4.2","timestamp":"..."}

# Check OAuth discovery endpoint
curl http://localhost:8080/.well-known/oauth-authorization-server | jq '.issuer'

# Expected: https://coda.bestviable.com (from nginx-proxy)
```

## Client Verification

### Claude Desktop

1. Update config file:
```bash
# On your laptop
vim ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

   Old config:
   ```json
   "coda": {
     "transport": "stdio",
     "command": "..."
   }
   ```

   New config:
   ```json
   "coda": {
     "transport": "http",
     "url": "https://coda.bestviable.com/mcp",
     "headers": {
       "Authorization": "Bearer $CODA_API_TOKEN"
     }
   }
   ```

2. Restart Claude Desktop
3. Check MCP indicator shows "coda"
4. Verify you can use Coda tools

### Claude Code

1. Check config file:
```bash
cat ~/.config/claude-code/mcp.json
```

2. Add/update Coda MCP entry (same as Claude Desktop above)

3. Reconnect MCP: `claude-code reconnect-mcp`

4. Verify MCP endpoint works:
```bash
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }' | jq '.result.tools | length'

# Should return number > 10 (was 10 before, should be 34 now)
```

## Rollback Plan

If deployment fails:

```bash
# On droplet
cd /root/portfolio

# Stop new container
docker compose stop coda-mcp-gateway

# Revert docker-compose if needed
git checkout infra/docker/docker-compose.production.yml

# Pull old image (if still available)
docker pull coda-mcp-gateway:old  # (if you tagged it)

# Or rebuild old version
docker compose build coda-mcp-gateway

# Restart
docker compose up -d coda-mcp-gateway

# On client
# Revert claude_desktop_config.json to use stdio transport
```

## Post-Deployment

### 1. Monitor Logs (24 hours)

```bash
# Check for errors in first day of operation
docker logs --since 24h coda-mcp-gateway | grep -E "ERROR|FAILED"

# Check auth events
docker logs --since 24h coda-mcp-gateway | grep AUTH | head -20
```

### 2. Update Documentation

- [ ] Update `/docs/architecture/integrations/mcp/server_catalog_v01.md`
  - Change Coda status from "In Progress (SSE)" to "Production (HTTP)"
  - Add endpoint: `https://coda.bestviable.com/mcp`
  - Add OAuth discovery: `https://coda.bestviable.com/.well-known/oauth-authorization-server`

### 3. Verify Coda API Token Rotation Schedule

- [ ] Add calendar reminder: "Rotate Coda API token" (every 90 days)
- [ ] Document in `/docs/ops/SECURITY_TOKENS.md`:
  ```
  Coda API Token (CODA_API_TOKEN)
  - Rotation: Every 90 days
  - Last rotated: 2025-10-31
  - Next rotation due: 2026-01-29
  ```

## Success Criteria

✅ **All of the following must be true:**

1. Container running and healthy
   ```bash
   docker ps | grep coda-mcp | grep healthy
   ```

2. Health endpoint returning 200
   ```bash
   curl -I http://localhost:8080/health | grep "200 OK"
   ```

3. OAuth discovery endpoint working
   ```bash
   curl -s http://localhost:8080/.well-known/oauth-authorization-server | jq '.issuer'
   ```

4. MCP endpoint accepting requests (with auth)
   ```bash
   curl -I -H "Authorization: Bearer $CODA_API_TOKEN" http://localhost:8080/mcp | grep "200\|400"
   # 400 is ok (no request body), 200 is also ok, 401 means auth failed
   ```

5. Tools accessible from Claude clients
   - Claude Desktop shows Coda MCP connected
   - Claude Code can list Coda tools
   - Tools return data successfully

6. Logs show no errors
   ```bash
   docker logs coda-mcp-gateway | tail -20 | grep -v -E "ERROR|FAILED|timeout"
   # Should show only normal operation logs
   ```

## Timeline

- **15-20 min**: Docker build
- **5 min**: Container startup
- **5 min**: Client configuration
- **5 min**: Verification
- **Total: ~30-35 minutes**

---

**Last Updated**: 2025-10-31
**Next Step**: Chunk 3 - Deploy GitHub/Memory/Firecrawl MCPs
