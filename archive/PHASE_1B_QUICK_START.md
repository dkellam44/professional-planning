# Phase 1B: Coda MCP Droplet Deployment — Quick Start

**Duration**: ~1 hour  
**Status**: Ready to execute  
**Source**: /integrations/mcp/servers/coda/src/ (already prepared)

## Step 1: Create Dockerfile.coda-mcp-gateway (5 min)

**File location**: `/Users/davidkellam/workspace/portfolio/infra/docker/services/coda-mcp-gateway`

```dockerfile
FROM node:23-alpine

# Install Python + mcp-proxy
RUN apk add --no-cache python3 py3-pip
RUN pip install --break-system-packages mcp-proxy

WORKDIR /app

# Copy package files
COPY integrations/mcp/servers/coda/src/package.json \
     integrations/mcp/servers/coda/src/pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source and build
COPY integrations/mcp/servers/coda/src .
RUN pnpm build

# Run via mcp-proxy
CMD ["mcp-proxy", "--host", "0.0.0.0", "--port", "8080", "--", "node", "dist/index.js"]
```

## Step 2: Update docker-compose.production.yml (5 min)

**Add this service** (after n8n service, before closing services):

```yaml
# ==============================================================================
# MCP: coda
# Tier: 1 (Remote Transport)
# Endpoint: https://coda.bestviable.com/sse
# Source: /integrations/mcp/servers/coda/src/
# Tools: 34 tools (documents, pages, tables, columns, rows, formulas, controls)
# Last Updated: 2025-10-29
# ==============================================================================

  coda-mcp-gateway:
    build:
      context: .
      dockerfile: docs/ops/Dockerfile.coda-mcp-gateway
    container_name: coda-mcp-gateway
    restart: always
    environment:
      CODA_API_TOKEN: ${CODA_API_TOKEN}
      VIRTUAL_HOST: coda.${DOMAIN}
      VIRTUAL_PORT: 8080
      LETSENCRYPT_HOST: coda.${DOMAIN}
      LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL}
      HTTPS_METHOD: noredirect
      TRUST_DOWNSTREAM_PROXY: "true"

    command: ["mcp-proxy", "--host", "0.0.0.0", "--port", "8080", "--", "node", "dist/index.js"]
    
    ports:
      - "127.0.0.1:8080:8080"
    
    networks:
      - proxy
      - syncbricks
    
    depends_on:
      n8n:
        condition: service_healthy
    
    healthcheck:
      test: ["CMD", "pgrep", "-f", "node.*coda"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
```

## Step 3: Deploy to Droplet (50 min)

### 3A: Copy Files (5 min)
```bash
scp docs/ops/Dockerfile.coda-mcp-gateway tools-droplet-agents:~/
scp docs/ops/docker-compose.production.yml tools-droplet-agents:~/
```

### 3B: Build on Droplet (30 min)
```bash
ssh tools-droplet-agents

# Verify files arrived
ls -la docker-compose.production.yml Dockerfile.coda-mcp-gateway

# Build
docker compose -f docker-compose.production.yml build coda-mcp-gateway

# Watch output (should complete without errors)
```

### 3C: Deploy & Verify (15 min)
```bash
# Start container
docker compose -f docker-compose.production.yml up -d coda-mcp-gateway

# Wait 120 seconds for health check (start_period)
sleep 120

# Check status
docker compose -f docker-compose.production.yml ps coda-mcp-gateway
# Should show: Up X seconds (healthy)

# Check logs
docker logs coda-mcp-gateway --tail 50

# Verify endpoint from local machine
curl -I https://coda.bestviable.com/sse
# Expected: HTTP/1.1 200 OK

# Test routing
docker logs nginx-proxy --tail 40 | grep coda
```

## Verification Checklist

- [ ] Docker build completes without errors
- [ ] Container shows "healthy" status
- [ ] `curl -I https://coda.bestviable.com/sse` returns 200
- [ ] `docker logs coda-mcp-gateway` shows no errors
- [ ] `docker logs nginx-proxy` shows coda routing

## If Something Goes Wrong

**Container fails to start**:
```bash
docker logs coda-mcp-gateway --tail 100
# Check for: missing env vars, port conflicts, build errors
```

**Health check failing**:
- Wait 120 seconds (start_period)
- Check: `pgrep -f "node.*coda"`
- Verify port: `netstat -tlnp | grep 8080`

**Endpoint returns 502**:
- Check: `docker logs nginx-proxy | grep coda`
- Verify: service bound to 0.0.0.0:8080
- Check: VIRTUAL_HOST environment variable

## Full Documentation

- **Playbook**: /agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md
- **Troubleshooting**: /docs/runbooks/mcp_troubleshooting_v01.md
- **Architecture**: /agents/decisions/2025-10-29_mcp-tier-architecture_v01.md

## Next After Phase 1B Success

1. Create server documentation in /integrations/mcp/servers/coda/
2. Update /docs/architecture/integrations/mcp/server_catalog_v01.md
3. Consider Phase 2: Deploy GitHub, Memory, Firecrawl MCPs
