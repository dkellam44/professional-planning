---
entity: guide
level: comprehensive
zone: infrastructure
version: v01
tags: [mcp, http-streaming, setup, gateway, cloudflare]
source_path: /docs/infrastructure/MCP_HTTP_STREAMING_SETUP.md
date: 2025-10-31
---

# MCP HTTP Streaming Setup Guide

Complete guide for deploying MCP (Model Context Protocol) services via HTTP streaming with Cloudflare Tunnel, nginx-proxy, and Docker Compose.

## Architecture Overview

```
Claude Desktop (MCP client)
    ↓ HTTPS
Cloudflare Tunnel (TLS termination)
    ↓ HTTP
nginx-proxy (reverse proxy + auto-discovery)
    ↓ HTTP
MCP Gateway Containers (SSE streaming)
    ↓ stdio
MCP Server Implementations
```

### Key Components

1. **MCP Gateway Containers**: Node.js/Python servers that expose stdio MCP servers via HTTP SSE
2. **nginx-proxy**: Automated reverse proxy using docker-gen (SyncBricks pattern)
3. **Cloudflare Tunnel**: Zero-trust network access with TLS termination
4. **Let's Encrypt**: Automatic SSL certificate management (acme-companion)

### Network Design

Two Docker networks provide isolation:
- **proxy**: nginx-proxy + acme-companion
- **syncbricks**: All backend services (MCP gateways, n8n, postgres, etc.)

nginx-proxy bridges both networks to route traffic.

## Prerequisites

### Required Accounts & Credentials
- Cloudflare account with domain configured
- Cloudflare API token with permissions:
  - Account > Cloudflare Tunnel > Edit
  - Zone > DNS > Edit
- DigitalOcean droplet (or any Ubuntu server)

### Required Tools
- Docker & Docker Compose
- SSH access to server
- `jq` for JSON parsing
- `curl` for API testing

## Step 1: MCP Gateway Container Setup

Each MCP service needs a gateway container that bridges stdio ↔ HTTP SSE.

### Example: Coda MCP Gateway

**Dockerfile** (`services/gateways/coda-mcp-gateway/Dockerfile`):
```dockerfile
FROM node:22-slim
WORKDIR /app

# Install MCP server and dependencies
RUN npm install -g @modelcontextprotocol/server-coda

# Copy gateway server
COPY gateway-server.js .
COPY package*.json .
RUN npm install

EXPOSE 8080
CMD ["node", "gateway-server.js"]
```

**Gateway Server** (`gateway-server.js`):
```javascript
const express = require('express');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/mcp', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const mcp = spawn('npx', ['-y', '@modelcontextprotocol/server-coda'], {
    env: {
      ...process.env,
      CODA_API_TOKEN: process.env.CODA_API_TOKEN
    }
  });

  mcp.stdout.on('data', (data) => {
    res.write(`data: ${data}\n\n`);
  });

  mcp.stderr.on('data', (data) => {
    console.error('MCP Error:', data.toString());
  });

  req.on('close', () => {
    mcp.kill();
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Coda MCP Gateway listening on port ${PORT}`);
});
```

### Docker Compose Configuration

**File**: `docker-compose.production.yml`

```yaml
services:
  coda-mcp-gateway:
    build:
      context: ./services/gateways/coda-mcp-gateway
      dockerfile: Dockerfile
    container_name: coda-mcp-gateway
    environment:
      - PORT=8080
      - CODA_API_TOKEN=${CODA_API_TOKEN}
      - VIRTUAL_HOST=coda.${DOMAIN}
      - VIRTUAL_PORT=8080
      - LETSENCRYPT_HOST=coda.${DOMAIN}
      - LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}
      - HTTPS_METHOD=noredirect
    networks:
      - syncbricks
    restart: unless-stopped
```

**Key Environment Variables**:
- `VIRTUAL_HOST`: nginx-proxy uses this for routing
- `VIRTUAL_PORT`: Backend container port
- `LETSENCRYPT_HOST`: Domains for SSL certificates
- `HTTPS_METHOD=noredirect`: Prevents HTTP→HTTPS redirects (Cloudflare handles SSL)

## Step 2: nginx-proxy Setup (SyncBricks Pattern)

### nginx-proxy Container

```yaml
services:
  nginx-proxy:
    image: nginxproxy/nginx-proxy:latest
    container_name: nginx-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/tmp/docker.sock:ro
      - nginx-certs:/etc/nginx/certs:ro
      - nginx-vhost:/etc/nginx/vhost.d
      - nginx-html:/usr/share/nginx/html
    networks:
      - proxy
      - syncbricks
    restart: unless-stopped
```

### acme-companion Container

```yaml
services:
  acme-companion:
    image: nginxproxy/acme-companion:latest
    container_name: acme-companion
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - nginx-certs:/etc/nginx/certs
      - nginx-vhost:/etc/nginx/vhost.d
      - nginx-html:/usr/share/nginx/html
      - acme-state:/etc/acme.sh
    environment:
      - DEFAULT_EMAIL=${LETSENCRYPT_EMAIL}
      - NGINX_PROXY_CONTAINER=nginx-proxy
    networks:
      - proxy
    restart: unless-stopped
```

## Step 3: Cloudflare Tunnel Configuration

### Extract Tunnel ID from Token

```bash
TUNNEL_ID=$(echo "$CF_TUNNEL_TOKEN" | base64 -d | jq -r '.t')
echo "Tunnel ID: $TUNNEL_ID"
```

### Update Tunnel Configuration via API

```bash
TUNNEL_ID="your-tunnel-id"
ACCOUNT_ID="your-account-id"
API_TOKEN="your-api-token"

# Create configuration JSON
cat > /tmp/tunnel_config.json << 'EOF'
{
  "config": {
    "ingress": [
      {
        "service": "http://nginx-proxy",
        "hostname": "coda.bestviable.com",
        "originRequest": {}
      },
      {
        "service": "http://nginx-proxy",
        "hostname": "github.bestviable.com",
        "originRequest": {}
      },
      {
        "service": "http://nginx-proxy",
        "hostname": "memory.bestviable.com",
        "originRequest": {}
      },
      {
        "service": "http://nginx-proxy",
        "hostname": "firecrawl.bestviable.com",
        "originRequest": {}
      },
      {
        "service": "http_status:404"
      }
    ],
    "warp-routing": {
      "enabled": false
    }
  }
}
EOF

# Update tunnel configuration
curl -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data @/tmp/tunnel_config.json
```

### Create DNS Records

```bash
ZONE_ID="your-zone-id"

for subdomain in coda github memory firecrawl; do
  curl -X POST \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{
      \"type\": \"CNAME\",
      \"name\": \"${subdomain}\",
      \"content\": \"bestviable.com\",
      \"proxied\": true
    }"
done
```

### Set SSL/TLS Mode to Flexible

**Required**: Must be done via Cloudflare dashboard (cannot be set via API with standard permissions)

1. Go to: https://dash.cloudflare.com/
2. Select your account
3. Click on your domain (e.g., bestviable.com)
4. Go to **SSL/TLS** tab (left sidebar)
5. Under "Configure", set mode to: **Flexible**
6. Wait 30-60 seconds for propagation

**Why Flexible Mode?**
- Cloudflare ↔ Visitor: HTTPS (SSL certificate provided by Cloudflare)
- Cloudflare ↔ Origin: HTTP (nginx-proxy without SSL certs)
- This matches our architecture where Cloudflare Tunnel terminates SSL

### Cloudflare Tunnel Docker Service

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CF_TUNNEL_TOKEN}
    networks:
      - syncbricks
    restart: unless-stopped
```

## Step 4: Deployment

### 1. Prepare Environment Variables

Create `.env` file in `/root/portfolio/infra/config/`:

```bash
# Domain
DOMAIN=bestviable.com

# Cloudflare Tunnel
CF_TUNNEL_TOKEN=your-tunnel-token-here

# Cloudflare API
CLOUDFLARE_API_TOKEN=your-api-token-here
CLOUDFLARE_ACCOUNT_ID=your-account-id-here

# Let's Encrypt
LETSENCRYPT_EMAIL=your-email@example.com

# MCP Service API Keys
CODA_API_TOKEN=your-coda-token
GITHUB_PERSONAL_ACCESS_TOKEN=your-github-token
# ... other service tokens
```

### 2. Build and Start Services

```bash
cd /root/portfolio/infra/docker

# Build gateway containers
docker compose -f docker-compose.production.yml build \
  coda-mcp-gateway \
  github-mcp-gateway \
  memory-mcp-gateway \
  firecrawl-mcp-gateway

# Start all services
docker compose -f docker-compose.production.yml up -d

# Verify containers started
docker compose -f docker-compose.production.yml ps
```

### 3. Verify Internal Endpoints

Test each gateway on internal ports:

```bash
# Coda (port 8080)
curl http://127.0.0.1:8080/health
# Expected: {"status":"ok"}

# GitHub (port 8081)
curl http://127.0.0.1:8081/health

# Memory (port 8082)
curl http://127.0.0.1:8082/health

# Firecrawl (port 8084)
curl http://127.0.0.1:8084/health
```

### 4. Verify External HTTPS Endpoints

After SSL/TLS mode set to Flexible:

```bash
curl -I https://coda.bestviable.com/health
curl -I https://github.bestviable.com/health
curl -I https://memory.bestviable.com/health
curl -I https://firecrawl.bestviable.com/health

# Expected: HTTP/2 200 OK
```

## Step 5: Claude Desktop Configuration

### Update MCP Settings

**File**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "coda": {
      "command": "node",
      "args": ["/path/to/http-streaming-client.js"],
      "env": {
        "MCP_HTTP_URL": "https://coda.bestviable.com/mcp"
      }
    },
    "github": {
      "command": "node",
      "args": ["/path/to/http-streaming-client.js"],
      "env": {
        "MCP_HTTP_URL": "https://github.bestviable.com/mcp"
      }
    },
    "memory": {
      "command": "node",
      "args": ["/path/to/http-streaming-client.js"],
      "env": {
        "MCP_HTTP_URL": "https://memory.bestviable.com/mcp"
      }
    },
    "firecrawl": {
      "command": "node",
      "args": ["/path/to/http-streaming-client.js"],
      "env": {
        "MCP_HTTP_URL": "https://firecrawl.bestviable.com/mcp"
      }
    }
  }
}
```

### HTTP Streaming Client

**File**: `http-streaming-client.js`

```javascript
#!/usr/bin/env node
const https = require('https');
const { URL } = require('url');

const MCP_URL = process.env.MCP_HTTP_URL;

if (!MCP_URL) {
  console.error('MCP_HTTP_URL environment variable required');
  process.exit(1);
}

const url = new URL(MCP_URL);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  }
};

const req = https.request(options, (res) => {
  res.on('data', (chunk) => {
    process.stdout.write(chunk);
  });

  res.on('end', () => {
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
  process.exit(1);
});

req.end();
```

Make executable:
```bash
chmod +x http-streaming-client.js
```

### Restart Claude Desktop

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. Verify MCP servers connected in status bar

## Troubleshooting

### HTTP 525 Errors (SSL Handshake Failed)

**Cause**: Cloudflare SSL/TLS mode incompatible with HTTP origin

**Fix**: Set SSL/TLS mode to "Flexible" in Cloudflare dashboard

### HTTP 301 Redirect Loops

**Causes**:
1. Cloudflare "Always Use HTTPS" enabled
2. Missing `HTTPS_METHOD=noredirect` in container env vars

**Fix**:
1. Disable "Always Use HTTPS" in Cloudflare dashboard
2. Add `HTTPS_METHOD=noredirect` to all gateway containers
3. Rebuild and restart containers

### Container Not Starting

**Check logs**:
```bash
docker logs coda-mcp-gateway
docker logs nginx-proxy
docker logs cloudflared
```

**Common issues**:
- Missing environment variables
- Invalid API tokens
- Port conflicts

### nginx-proxy Not Routing

**Check nginx config**:
```bash
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf
```

**Verify VIRTUAL_HOST detected**:
```bash
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 5 "coda.bestviable.com"
```

**Restart nginx-proxy**:
```bash
docker restart nginx-proxy
```

### Cloudflare Tunnel Not Loading Configuration

**Check tunnel logs**:
```bash
docker logs cloudflared | grep -i "config"
```

**Verify tunnel configuration version**:
```bash
curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations" \
  -H "Authorization: Bearer ${API_TOKEN}"
```

**Restart tunnel**:
```bash
docker restart cloudflared
```

## Port Mapping Reference

| Service | Container Port | VIRTUAL_PORT | External URL |
|---------|---------------|--------------|--------------|
| Coda | 8080 | 8080 | coda.bestviable.com |
| GitHub | 8081 | 8081 | github.bestviable.com |
| Memory | 8082 | 8082 | memory.bestviable.com |
| Firecrawl | 8084 | 8084 | firecrawl.bestviable.com |
| n8n | 5678 | 5678 | n8n.bestviable.com |

## Security Considerations

1. **API Tokens**: Store in `.env` file, never commit to git
2. **Network Isolation**: Use Docker networks to isolate services
3. **Cloudflare Proxy**: Always enable "Proxied" for DNS records (hides origin IP)
4. **Rate Limiting**: Configure Cloudflare rate limiting rules
5. **Authentication**: Add authentication middleware for public endpoints

## Monitoring

### Health Check Endpoints

All gateways expose `/health`:
```bash
curl https://coda.bestviable.com/health
# {"status":"ok"}
```

### Container Health

```bash
# Check all container status
docker compose -f docker-compose.production.yml ps

# Check specific container logs
docker logs --tail 100 -f coda-mcp-gateway
```

### Cloudflare Tunnel Metrics

View in Cloudflare dashboard:
1. Go to Zero Trust > Access > Tunnels
2. Click on your tunnel
3. View metrics: requests, bandwidth, uptime

## Related Documentation

- **Troubleshooting Runbook**: `/docs/runbooks/mcp_troubleshooting_v01.md`
- **SyncBricks Pattern**: `/docs/infrastructure/syncbricks_solution_breakdown_v1.md`
- **Deployment Quick Start**: `/docs/ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md`
- **Port Mapping**: `/docs/ops/PORTS.md`
- **Cloudflare Tunnel Guide**: `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md`

## Summary

This setup provides:
- ✅ Zero IP exposure (Cloudflare Tunnel)
- ✅ Automatic SSL certificates (Let's Encrypt via acme-companion)
- ✅ Auto-discovery reverse proxy (nginx-proxy)
- ✅ Network isolation (two-network design)
- ✅ HTTP streaming for MCP over internet
- ✅ Easy scaling (add new services by adding containers)
- ✅ Production-ready infrastructure

**Total setup time**: ~2 hours (first time), ~30 minutes (subsequent deployments)
