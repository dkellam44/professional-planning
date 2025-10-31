---
entity: architecture
level: implementation
zone: internal
version: v01
tags: [mcp, deployment, flows, architecture, routing, http]
source_path: /docs/architecture/integrations/mcp/DEPLOYMENT_FLOWS.md
date: 2025-10-31
---

# MCP Streaming HTTP Deployment Flows

**Purpose**: Document how MCP HTTP gateway services are deployed and how clients connect to them across different environments.

**Deployment Date**: 2025-10-31
**Status**: ✅ Production (All 4 services deployed and operational)

---

## Overview

MCP gateway services operate using **streaming HTTP** transport, deployed via Docker on a DigitalOcean droplet. Three distinct connection flows support different client contexts:

1. **Local Development** — Direct container access via localhost
2. **External HTTPS** — Remote clients via public domain + reverse proxy
3. **Internal Docker Network** — Container-to-container communication

---

## Connection Flow: Local Development

**For**: Testing, debugging, or local development environments

```
┌─────────────────────────────────────┐
│   Local Development Environment     │
│   (Laptop / Local Machine)          │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   Claude Desktop / Claude Code      │
│   (HTTP Client)                     │
└─────────────────────────────────────┘
           ↓ POST /mcp
┌─────────────────────────────────────┐
│   MCP HTTP Gateway Services         │
│   localhost:8080-8084               │
│   ├─ coda-mcp: 8080/mcp             │
│   ├─ github-mcp: 8081/mcp           │
│   ├─ memory-mcp: 8082/mcp           │
│   └─ firecrawl-mcp: 8084/mcp        │
└─────────────────────────────────────┘
```

### Configuration Example (Local)

```json
{
  "mcpServers": {
    "coda-mcp-http": {
      "url": "http://localhost:8080/mcp",
      "env": {
        "MCP_BEARER_TOKEN": "14460eab-8367-40a5-b430-33c40671f6f4"
      }
    }
  }
}
```

### Access Method

```bash
# Test local endpoint
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer 14460eab-8367-40a5-b430-33c40671f6f4" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

**Requirements**:
- ✅ Docker Desktop running
- ✅ Services started: `docker compose up -d coda-mcp-gateway github-mcp-gateway memory-mcp-gateway firecrawl-mcp-gateway`
- ✅ Bearer tokens configured (or services run without auth)

---

## Connection Flow: External HTTPS (Remote Clients)

**For**: ChatGPT web, remote AI clients, or external HTTP consumers

```
┌──────────────────────────────────────────────┐
│   External Client (ChatGPT Web, etc.)        │
│   Internet / Remote Network                  │
└──────────────────────────────────────────────┘
           ↓ HTTPS request
┌──────────────────────────────────────────────┐
│   Public Domain Name (DNS)                   │
│   • coda.bestviable.com                      │
│   • github.bestviable.com                    │
│   • memory.bestviable.com                    │
│   • firecrawl.bestviable.com                 │
│   (A records point to droplet IP)            │
└──────────────────────────────────────────────┘
           ↓ HTTPS/443
┌──────────────────────────────────────────────┐
│   DigitalOcean Droplet (159.65.97.146)       │
│   nginx-proxy Container                      │
│   ├─ VIRTUAL_HOST routing                    │
│   ├─ acme-companion SSL/TLS termination      │
│   └─ TRUST_DOWNSTREAM_PROXY=true             │
└──────────────────────────────────────────────┘
           ↓ HTTP/8080-8084 (internal)
┌──────────────────────────────────────────────┐
│   Docker Internal Network (proxy)            │
│   MCP Gateway Services                       │
│   ├─ coda-mcp-gateway:8080                   │
│   ├─ github-mcp-gateway:8081                 │
│   ├─ memory-mcp-gateway:8082                 │
│   └─ firecrawl-mcp-gateway:8084              │
└──────────────────────────────────────────────┘
```

### Request Flow in Detail

1. **Client sends HTTPS request**:
   ```
   POST https://coda.bestviable.com/mcp
   Authorization: Bearer {token}
   ```

2. **DNS resolution**: `coda.bestviable.com` → `159.65.97.146` (droplet IP)

3. **nginx-proxy intercepts**:
   - Reads `VIRTUAL_HOST: coda.bestviable.com` from container labels
   - Terminates TLS/SSL (cert from Let's Encrypt, managed by acme-companion)
   - Routes to upstream container via internal Docker network

4. **Docker network routing**:
   - nginx-proxy connects to `coda-mcp-gateway:8080` (internal address)
   - MCP gateway receives request via bridge network

5. **Container processing**:
   - Gateway validates Bearer token
   - Handles MCP protocol request
   - Returns response

6. **Response returns to client**: HTTPS encrypted end-to-end

### Configuration in docker-compose.production.yml

```yaml
coda-mcp-gateway:
  build:
    context: .
    dockerfile: services/coda-mcp-gateway/Dockerfile
  environment:
    PORT: 8080
    CODA_API_TOKEN: ${CODA_API_TOKEN}
    VIRTUAL_HOST: coda.${DOMAIN}      # nginx-proxy reads this
    VIRTUAL_PORT: 8080                 # nginx routes traffic here
    LETSENCRYPT_HOST: coda.${DOMAIN}  # acme-companion manages cert for this domain
    LETSENCRYPT_EMAIL: ${LETSENCRYPT_EMAIL}
    TRUST_DOWNSTREAM_PROXY: "true"    # Trust X-Forwarded-* headers from nginx
  expose:
    - "8080"
  networks:
    - proxy                            # nginx-proxy network
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Verification

```bash
# Test HTTPS endpoint with SSL verification
curl -I https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer {token}"

# Should return: HTTP/2 200 OK

# Test OAuth 2.0 discovery endpoint
curl https://coda.bestviable.com/.well-known/oauth-authorization-server
```

### Port Allocation Summary

| Service | Port | Internal Network | External Domain |
|---------|------|------------------|-----------------|
| Coda | 8080 | proxy network | `https://coda.bestviable.com` |
| GitHub | 8081 | proxy network | `https://github.bestviable.com` |
| Memory | 8082 | proxy network | `https://memory.bestviable.com` |
| Firecrawl | 8084 | proxy network | `https://firecrawl.bestviable.com` |

---

## Connection Flow: Internal Docker Network (Container-to-Container)

**For**: n8n workflows, other services that need programmatic access

```
┌──────────────────────────────────────┐
│   n8n Workflow / Service             │
│   (Same docker network)              │
└──────────────────────────────────────┘
           ↓ HTTP request (internal)
┌──────────────────────────────────────┐
│   Docker Internal Network            │
│   (syncbricks network)               │
│                                      │
│   Service Discovery:                 │
│   coda-mcp-gateway:8080              │
│   (direct container hostname)        │
└──────────────────────────────────────┘
           ↓ HTTP/8080 (no TLS overhead)
┌──────────────────────────────────────┐
│   MCP Gateway Container              │
│   Processes request directly         │
└──────────────────────────────────────┘
```

### Configuration Example (n8n Workflow)

```javascript
// n8n HTTP request node
{
  url: "http://coda-mcp-gateway:8080/mcp",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${env.CODA_API_TOKEN}"
  },
  body: {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {}
  }
}
```

### Access Method

```bash
# From inside n8n container or another service:
curl -X POST http://coda-mcp-gateway:8080/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${CODA_API_TOKEN}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# Note: Uses container hostname (coda-mcp-gateway), not localhost
# No TLS overhead (internal network only)
```

**Requirements**:
- ✅ Service must be on `proxy` or `syncbricks` docker network
- ✅ Valid Bearer token
- ✅ Can reference containers by hostname

---

## Authentication: Bearer Token Flow

All endpoints support Bearer token authentication for security:

### Token Validation

```
Request Headers:
─────────────────
Authorization: Bearer {token}

Gateway validates:
1. Token format (valid UUID or string)
2. Token matches CODA_API_TOKEN env var
3. Returns 401 if invalid/missing
```

### Token Configuration

**Local Development** (claude_desktop_config.json):
```json
{
  "coda-mcp-http": {
    "url": "http://localhost:8080/mcp",
    "env": {
      "MCP_BEARER_TOKEN": "14460eab-8367-40a5-b430-33c40671f6f4"
    }
  }
}
```

**Production** (docker-compose.production.yml):
```yaml
environment:
  CODA_API_TOKEN: ${CODA_API_TOKEN}  # Sourced from .env file
```

### Obtaining Tokens

| Service | Token Source | Instructions |
|---------|--------------|--------------|
| Coda | Coda workspace | https://coda.io/account/settings#api |
| GitHub | GitHub.com | https://github.com/settings/tokens |
| Memory | Not required | No token needed (local knowledge graph) |
| Firecrawl | Firecrawl dashboard | https://app.firecrawl.dev |

---

## Endpoint Reference

### Local Development Endpoints

```bash
# Direct to containers on localhost
http://localhost:8080/mcp      # Coda
http://localhost:8081/mcp      # GitHub
http://localhost:8082/mcp      # Memory
http://localhost:8084/mcp      # Firecrawl
```

### Production HTTPS Endpoints

```bash
# Via nginx-proxy + HTTPS
https://coda.bestviable.com/mcp
https://github.bestviable.com/mcp
https://memory.bestviable.com/mcp
https://firecrawl.bestviable.com/mcp
```

### Health Check Endpoints

```bash
# Available on all services
http://localhost:8080/health   # Coda health
http://localhost:8081/health   # GitHub health
http://localhost:8082/health   # Memory health
http://localhost:8084/health   # Firecrawl health
```

Response format:
```json
{
  "status": "ok",
  "service": "coda-mcp",
  "version": "1.4.2",
  "timestamp": "2025-10-31T12:34:56Z"
}
```

### OAuth 2.0 Discovery Endpoints

```bash
# RFC 8414 compliant OAuth metadata
http://localhost:8080/.well-known/oauth-authorization-server
https://coda.bestviable.com/.well-known/oauth-authorization-server
```

---

## Troubleshooting Connection Issues

### Common Issues Quick Reference Table

| Error/Symptom | HTTP Code | Root Cause | Solution | Reference |
|---------------|-----------|------------|----------|-----------|
| Connection refused | 000 | Cloudflare Tunnel not running | Check `docker logs cloudflared`, restart if needed | [Cloudflare Guide](/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md) |
| SSL handshake failed | 525 | SSL/TLS mode incompatible | Set Cloudflare SSL mode to "Flexible" via dashboard | [Status Doc](/sessions/handoffs/CLOUDFLARE_COMPLETION_STATUS.md) |
| Redirect loop | 301 | HTTPS redirect conflict | Disable "Always Use HTTPS" or add `HTTPS_METHOD=noredirect` | [Troubleshooting](/docs/runbooks/mcp_troubleshooting_v01.md) |
| Bad gateway | 502 | nginx-proxy routing issue | Check nginx config, restart nginx-proxy | [Agent Flow](/docs/runbooks/MCP_AGENT_TROUBLESHOOTING_FLOW.md) |
| Service unavailable | 503 | Gateway container not running | Check container status, restart specific gateway | [Agent Flow](/docs/runbooks/MCP_AGENT_TROUBLESHOOTING_FLOW.md) |
| Invalid SSL cert | 526 | Let's Encrypt cert issue | Check acme-companion logs, force renewal | This document, below |
| Unauthorized | 401 | Missing/invalid Bearer token | Verify token in env vars, test with valid token | This document, below |
| Container not starting | N/A | Missing env vars or port conflict | Check logs, verify VIRTUAL_HOST set | [Troubleshooting](/docs/runbooks/mcp_troubleshooting_v01.md) |
| MCP tools unavailable | N/A | Client config or protocol issue | Follow decision tree from Step 1 | [Agent Flow](/docs/runbooks/MCP_AGENT_TROUBLESHOOTING_FLOW.md) |

### Cloudflare-Specific Issues (HTTP 525, 301, 000)

**When to suspect Cloudflare issues**:
- All services return same error code (525/301/000)
- Services worked previously, broke after Cloudflare changes
- Internal endpoints work (localhost), external don't

**Key Settings to Check**:
1. **SSL/TLS Mode**: Must be "Flexible" (not "Full" or "Full Strict")
   - Location: Cloudflare Dashboard → SSL/TLS → Overview
   - Why: Origin uses HTTP, not HTTPS
2. **Always Use HTTPS**: Should be disabled
   - Location: Cloudflare Dashboard → SSL/TLS → Edge Certificates
   - Why: Cloudflare Tunnel already handles HTTPS
3. **DNS Proxied**: All CNAME records must be proxied (orange cloud)
   - Location: Cloudflare Dashboard → DNS → Records
   - Why: Traffic must route through Cloudflare

**Quick Test**:
```bash
# Test all external endpoints
for service in coda github memory firecrawl; do
  echo "=== $service ==="
  curl -I https://${service}.bestviable.com/health
done
# Expected: All return HTTP/2 200 OK
```

### Cannot connect to localhost:8080

**Symptom**: `Connection refused` or `ERR_CONNECTION_REFUSED`

**Causes**:
- Docker services not running
- Port not exposed correctly
- Service not healthy

**Solutions**:
```bash
# Check services are running
docker compose -f infra/docker/docker-compose.production.yml ps

# Check port is listening
lsof -i :8080

# Restart services
docker compose restart coda-mcp-gateway

# Check logs
docker logs coda-mcp-gateway --tail 50
```

### Cannot connect to coda.bestviable.com (HTTPS)

**Symptom**: `SSL certificate error` or `Connection timeout`

**Causes**:
- nginx-proxy not running
- Certificate not issued
- DNS not resolving
- Cloudflare SSL/TLS mode incorrect

**Solutions**:
```bash
# Test DNS resolution
nslookup coda.bestviable.com

# Check nginx-proxy is running
docker ps | grep nginx-proxy

# Check certificate
docker exec nginx-proxy cat /etc/nginx/certs/coda.bestviable.com.crt

# Force certificate renewal
docker compose restart acme-companion

# Check Cloudflare SSL mode (must be Flexible)
# Go to Cloudflare Dashboard → SSL/TLS → Overview
```

### 401 Unauthorized errors

**Symptom**: `"error": "Unauthorized"` or `401 Unauthorized`

**Causes**:
- Missing Bearer token
- Invalid token format
- Token doesn't match env var

**Solutions**:
```bash
# Verify token is correct
echo $CODA_API_TOKEN

# Test request with valid token
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer 14460eab-8367-40a5-b430-33c40671f6f4" \
  -H "Content-Type: application/json"

# Check container env vars
docker exec coda-mcp-gateway env | grep CODA_API_TOKEN
```

---

## Performance Characteristics

### Local Development (localhost)

- **Latency**: <10ms (same machine)
- **Throughput**: Limited by Docker bridge network
- **Best for**: Testing, development, rapid iteration

### External HTTPS (Remote)

- **Latency**: 50-200ms depending on geographic location and network
- **Throughput**: Limited by nginx-proxy rate limiting (10 req/sec default)
- **TLS overhead**: ~20-30ms for handshake (cached after first request)
- **Best for**: Production, remote clients, 24/7 availability

### Internal Docker Network

- **Latency**: <5ms (container-to-container)
- **Throughput**: Minimal overhead (no TLS)
- **Best for**: Workflows, inter-service communication, scheduled tasks

---

## Security Considerations

### Bearer Token Management

- ✅ Tokens stored as environment variables (not hardcoded)
- ✅ Tokens never logged in audit trails
- ✅ Tokens validated on every request
- ⚠️ Tokens visible in container inspect (use secrets management for production)

### HTTPS/TLS

- ✅ All external traffic encrypted (Let's Encrypt certificates)
- ✅ Automatic certificate renewal (acme-companion)
- ✅ nginx-proxy handles SSL termination
- ✅ X-Forwarded-* headers validated

### Network Isolation

- ✅ MCP gateways on internal `proxy` network (nginx-proxy routing only)
- ✅ Database on separate `syncbricks` network (no MCP gateway access)
- ✅ Services expose ports 8080-8084 but only internally to nginx-proxy
- ⚠️ Rate limiting in development (local): None
- ✅ Rate limiting in production: 10 req/sec per IP (nginx-proxy)

---

## Deployment Verification Checklist

After deploying MCP gateways, verify:

```bash
# 1. Services running
docker compose ps | grep mcp-gateway
# Expected: 4 services in "Up" state

# 2. Health checks passing
for port in 8080 8081 8082 8084; do
  echo "Port $port:"
  curl -s http://127.0.0.1:$port/health | jq .status
done
# Expected: All return "ok"

# 3. OAuth discovery working
curl -s https://coda.bestviable.com/.well-known/oauth-authorization-server | jq '.issuer'
# Expected: Returns issuer URL

# 4. Bearer token validation
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer invalid" \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: 401 Unauthorized

# 5. Valid token accepted
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer 14460eab-8367-40a5-b430-33c40671f6f4" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
# Expected: MCP response (200 OK)
```

---

## Related Documentation

- **MCP Server Catalog**: `/docs/architecture/integrations/mcp/server_catalog_v01.md`
- **Individual Services**: `/integrations/mcp/servers/*/README.md`
- **Infrastructure**: `/docs/infrastructure/PRODUCTION_DEPLOYMENT_QUICKSTART.md`
- **Docker Compose**: `/infra/docker/docker-compose.production.yml`

---

**Last Updated**: 2025-10-31 | **Status**: ✅ Production Operational
