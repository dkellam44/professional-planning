---
entity: runbook
level: operational
zone: internal
version: v01
tags: [mcp, troubleshooting, agents, decision-tree, flowchart]
source_path: /docs/runbooks/MCP_AGENT_TROUBLESHOOTING_FLOW.md
date: 2025-10-31
---

# MCP Agent Troubleshooting Flow

Decision tree for agents diagnosing MCP (Model Context Protocol) connectivity issues. Follow this flow when MCP tools aren't accessible in Claude Desktop, Codex CLI, or other MCP clients.

## Quick Decision Tree

```
MCP tools not available?
    ↓
Is this Claude Desktop or other MCP client?
    ↓ Yes
┌─────────────────────────────────────────────────────┐
│ 1. Check Client Configuration                      │
│    • Config file syntax correct?                    │
│    • URLs pointing to correct endpoints?            │
│    • Client restarted after config changes?         │
└─────────────────────────────────────────────────────┘
    ↓ Config OK
┌─────────────────────────────────────────────────────┐
│ 2. Test External HTTPS Endpoints                   │
│    • Can reach https://[service].bestviable.com?    │
│    • Getting HTTP 200 or HTTP errors?               │
└─────────────────────────────────────────────────────┘
    ↓ HTTP errors (525, 301, 502, 000)
┌─────────────────────────────────────────────────────┐
│ 3. Check Cloudflare Settings                       │
│    • SSL/TLS mode = Flexible?                       │
│    • DNS records proxied?                           │
│    • Tunnel running?                                │
└─────────────────────────────────────────────────────┘
    ↓ Cloudflare OK
┌─────────────────────────────────────────────────────┐
│ 4. Check nginx-proxy                               │
│    • Container running?                             │
│    • VIRTUAL_HOST env vars correct?                 │
│    • Routing rules generated?                       │
└─────────────────────────────────────────────────────┘
    ↓ nginx-proxy OK
┌─────────────────────────────────────────────────────┐
│ 5. Check Gateway Containers                        │
│    • Containers running?                            │
│    • Internal health checks pass?                   │
│    • Environment variables set?                     │
│    • Logs show errors?                              │
└─────────────────────────────────────────────────────┘
    ↓ All checks pass
┌─────────────────────────────────────────────────────┐
│ 6. Check MCP Protocol Layer                        │
│    • SSE streaming working?                         │
│    • MCP stdio servers responding?                  │
│    • Test with curl SSE connection                  │
└─────────────────────────────────────────────────────┘
```

---

## 1. Check Client Configuration

### For Claude Desktop

**Config Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Check**:
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Expected Format**:
```json
{
  "mcpServers": {
    "coda": {
      "command": "node",
      "args": ["/path/to/http-streaming-client.js"],
      "env": {
        "MCP_HTTP_URL": "https://coda.bestviable.com/mcp"
      }
    }
  }
}
```

**Common Issues**:
- ❌ URLs still pointing to `/sse` instead of `/mcp`
- ❌ JSON syntax errors (missing commas, brackets)
- ❌ Relative paths instead of absolute paths
- ❌ Client not restarted after config changes

**Fix**: Update URLs to `/mcp`, fix JSON syntax, restart Claude Desktop

### For Codex CLI

**Config Location**: `~/.config/codex-cli/mcp_servers.json`

**Check**:
```bash
cat ~/.config/codex-cli/mcp_servers.json
```

**Expected Format**:
```json
{
  "servers": [
    {
      "name": "coda-gateway",
      "type": "sse",
      "url": "https://coda.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${CODA_API_TOKEN}"
      },
      "env": {
        "CODA_API_TOKEN": "your-token-here"
      }
    }
  ]
}
```

**Common Issues**:
- ❌ URLs still pointing to `/sse` instead of `/mcp`
- ❌ Missing or invalid API tokens
- ❌ Config file doesn't exist

**Fix**: See `/agents/context/mcp_setup_codex_cli_v01.md` for complete setup

**Decision**: If config correct → Go to Step 2

---

## 2. Test External HTTPS Endpoints

### Quick Health Check

```bash
# Test each service
for service in coda github memory firecrawl; do
  echo "Testing $service..."
  curl -I https://${service}.bestviable.com/health
done
```

### Expected Result
```
HTTP/2 200 OK
content-type: application/json
...
```

### Common HTTP Errors

| Error Code | Meaning | Next Step |
|------------|---------|-----------|
| HTTP 000 | Connection failed | Check Cloudflare Tunnel (Step 3) |
| HTTP 301 | Redirect loop | Check SSL/TLS mode (Step 3) |
| HTTP 502 | Bad Gateway | Check nginx-proxy (Step 4) |
| HTTP 503 | Service Unavailable | Check gateway containers (Step 5) |
| HTTP 525 | SSL Handshake Failed | Check SSL/TLS mode (Step 3) |
| HTTP 526 | Invalid SSL Certificate | Check acme-companion (Step 4) |

**Decision**:
- If HTTP 200 → Go to Step 6 (protocol layer issue)
- If HTTP errors → Go to Step 3

---

## 3. Check Cloudflare Settings

### SSL/TLS Mode

**Check Current Mode**:
1. Go to: https://dash.cloudflare.com/
2. Select account → Click **bestviable.com** domain
3. Go to **SSL/TLS** tab
4. Check current mode

**Required Setting**: **Flexible**
- Cloudflare ↔ Visitor: HTTPS
- Cloudflare ↔ Origin: HTTP

**If set to Full or Full (strict)**:
- Will get HTTP 525 errors (SSL handshake failed)
- Origin (nginx-proxy) doesn't have valid SSL certificates
- Change to Flexible mode, wait 60 seconds

### Always Use HTTPS Setting

**Check**:
1. In Cloudflare dashboard → **SSL/TLS** tab
2. Click **Edge Certificates**
3. Check "Always Use HTTPS" setting

**If enabled and getting HTTP 301 loops**:
- Disable "Always Use HTTPS"
- Cloudflare Tunnel already provides HTTPS termination

### DNS Records

**Check via API**:
```bash
ZONE_ID="1021c01a2eb7a5311e6c4a7e7a8157df"
API_TOKEN="your-api-token"

curl -X GET \
  "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${API_TOKEN}" | jq '.result[] | select(.name | contains("bestviable.com")) | {name, type, content, proxied}'
```

**Expected Records**:
```json
{
  "name": "coda.bestviable.com",
  "type": "CNAME",
  "content": "bestviable.com",
  "proxied": true
}
```

**Common Issues**:
- ❌ CNAME records not created
- ❌ Records not proxied (proxied: false)
- ❌ Wrong target (should point to bestviable.com)

**Fix**: Create missing records via Cloudflare dashboard or API

### Cloudflare Tunnel Status

**Check via SSH to droplet**:
```bash
ssh tools-droplet-agents "docker logs cloudflared --tail 50"
```

**Expected Output**:
```
2025-10-31T16:55:08Z INF Updated to new configuration version=3
2025-10-31T16:55:08Z INF Connection established connIndex=0
```

**Check Tunnel Configuration**:
```bash
TUNNEL_ID="194e02e3-917b-4b95-9d9e-8f0934ccf315"
ACCOUNT_ID="73023089beb8a29af5bbf5a81091b38e"
API_TOKEN="your-api-token"

curl -X GET \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations" \
  -H "Authorization: Bearer ${API_TOKEN}" | jq '.result.config.ingress'
```

**Expected**: All 5 hostnames listed (n8n, coda, github, memory, firecrawl)

**Common Issues**:
- ❌ Tunnel container not running
- ❌ Missing hostnames in tunnel config
- ❌ Invalid CF_TUNNEL_TOKEN

**Fix**:
- Restart tunnel: `docker restart cloudflared`
- Update config via API (see `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md`)

**Decision**: If Cloudflare OK → Go to Step 4

---

## 4. Check nginx-proxy

### Container Status

```bash
ssh tools-droplet-agents "docker ps | grep nginx-proxy"
```

**Expected**: Container running, ports 80:80 and 443:443

**If not running**:
```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/docker && docker compose -f docker-compose.production.yml up -d nginx-proxy"
```

### Verify Routing Configuration

```bash
ssh tools-droplet-agents "docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A 10 'coda.bestviable.com'"
```

**Expected**: Upstream blocks for each service with correct VIRTUAL_HOST

**Example**:
```nginx
# coda.bestviable.com
upstream coda.bestviable.com {
    server coda-mcp-gateway:8080;
}

server {
    server_name coda.bestviable.com;
    listen 80;

    location / {
        proxy_pass http://coda.bestviable.com;
    }
}
```

**Common Issues**:
- ❌ No upstream block for service (VIRTUAL_HOST not detected)
- ❌ Wrong container name or port
- ❌ nginx-proxy not connected to syncbricks network

**Fix**:
1. Check gateway container env vars have VIRTUAL_HOST and VIRTUAL_PORT
2. Restart nginx-proxy: `docker restart nginx-proxy`
3. Check nginx-proxy logs: `docker logs nginx-proxy`

### Test Direct Connection to nginx-proxy

From inside droplet:
```bash
ssh tools-droplet-agents "curl -I -H 'Host: coda.bestviable.com' http://localhost:80/health"
```

**Expected**: HTTP 200 OK

**If getting errors**:
- Check nginx-proxy logs for routing issues
- Verify gateway containers are on same network (syncbricks)

**Decision**: If nginx-proxy OK → Go to Step 5

---

## 5. Check Gateway Containers

### Container Status

```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/docker && docker compose -f docker-compose.production.yml ps"
```

**Expected**: All gateway containers running (coda, github, memory, firecrawl)

**If not running**:
```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/docker && docker compose -f docker-compose.production.yml up -d coda-mcp-gateway github-mcp-gateway memory-mcp-gateway firecrawl-mcp-gateway"
```

### Check Container Logs

```bash
ssh tools-droplet-agents "docker logs coda-mcp-gateway --tail 50"
```

**Look for**:
- ✅ "Gateway listening on port 8080"
- ✅ "MCP server connected"
- ❌ Connection errors to stdio MCP server
- ❌ Missing environment variables
- ❌ Port binding failures

### Internal Health Checks

Test each gateway on internal port:
```bash
ssh tools-droplet-agents "curl http://127.0.0.1:8080/health"  # coda
ssh tools-droplet-agents "curl http://127.0.0.1:8081/health"  # github
ssh tools-droplet-agents "curl http://127.0.0.1:8082/health"  # memory
ssh tools-droplet-agents "curl http://127.0.0.1:8084/health"  # firecrawl
```

**Expected**: `{"status":"ok"}`

**If failing**:
- Check gateway container logs for errors
- Verify environment variables set (API tokens, etc.)
- Check stdio MCP server installed in container

### Verify Environment Variables

```bash
ssh tools-droplet-agents "docker inspect coda-mcp-gateway | jq '.[0].Config.Env'"
```

**Expected Variables**:
- `VIRTUAL_HOST=coda.bestviable.com`
- `VIRTUAL_PORT=8080`
- `HTTPS_METHOD=noredirect`
- `CODA_API_TOKEN=<token>`

**Common Issues**:
- ❌ Missing VIRTUAL_HOST (nginx-proxy won't route)
- ❌ Missing HTTPS_METHOD=noredirect (causes redirect loops)
- ❌ Missing service API tokens (MCP server can't authenticate)

**Fix**: Update docker-compose.production.yml, rebuild and restart containers

**Decision**: If containers OK → Go to Step 6

---

## 6. Check MCP Protocol Layer

This step verifies the HTTP SSE streaming and MCP protocol itself.

### Test SSE Connection

```bash
curl -N -H "Accept: text/event-stream" https://coda.bestviable.com/mcp
```

**Expected**: SSE stream opens, data events received

**Example Output**:
```
data: {"jsonrpc":"2.0","id":1,"method":"initialize",...}

data: {"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}
```

**Common Issues**:
- ❌ Connection closes immediately
- ❌ No data events received
- ❌ HTTP 400/500 errors

**If failing**:
- Check gateway server logs for MCP protocol errors
- Verify stdio MCP server working: `docker exec coda-mcp-gateway npx -y @modelcontextprotocol/server-coda`
- Check MCP server environment variables

### Test MCP Initialize Handshake

Using MCP client tool (if available):
```bash
node http-streaming-client.js <<EOF
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "test-client",
      "version": "1.0.0"
    }
  }
}
EOF
```

**Expected**: MCP server responds with initialize result

> ⚠ **Common Failure (HTTP 406 / Not Acceptable)**  
> The Coda gateway requires clients to accept both JSON responses *and* SSE upgrades.  
> If you see `{"error":"Not Acceptable: Client must accept both application/json and text/event-stream"}`, retry with:
> ```bash
> curl -s https://coda.bestviable.com/mcp \
>   -H "Authorization: Bearer $CODA_API_TOKEN" \
>   -H "Content-Type: application/json" \
>   -H "Accept: application/json, text/event-stream" \
>   --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"diag","version":"0.1"}}}'
> ```
> (Spec reference: [MCP Basic Transport §Authentication & Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#authentication-and-authorization))

**If still failing**:
- MCP stdio server not responding
- Gateway not properly forwarding stdio ↔ HTTP SSE
- Check gateway server implementation

### Verify Stdio MCP Server

SSH into droplet and test stdio server directly:
```bash
ssh tools-droplet-agents "docker exec -e CODA_API_TOKEN=your-token coda-mcp-gateway npx -y @modelcontextprotocol/server-coda"
```

**Expected**: Server starts, no immediate errors

**Common Issues**:
- ❌ Package not installed
- ❌ Invalid API tokens
- ❌ Python/Node dependencies missing

**Fix**:
- Rebuild container with correct dependencies
- Verify package.json or requirements.txt includes MCP server
- Check Dockerfile installs MCP server correctly

**Decision**: If all checks pass but still not working → Escalate to human operator

---

## Common Failure Patterns

### Pattern 1: "All services return HTTP 525"
**Diagnosis**: Cloudflare SSL/TLS mode incompatible
**Root Cause**: SSL/TLS mode set to "Full" but origin uses HTTP
**Fix**: Set SSL/TLS mode to "Flexible" in Cloudflare dashboard
**Reference**: `/sessions/handoffs/CLOUDFLARE_COMPLETION_STATUS.md` lines 51-68

### Pattern 2: "Services worked yesterday, broken today"
**Diagnosis**: Container restart or configuration drift
**Root Cause**: Docker containers restarted without persisted volumes
**Fix**: Check container status, restart affected services
**Reference**: `/docs/runbooks/mcp_troubleshooting_v01.md` Section 2

### Pattern 3: "Health checks pass but MCP tools still unavailable"
**Diagnosis**: Client configuration issue
**Root Cause**: Client config file not updated or client not restarted
**Fix**: Update client config, restart client application
**Reference**: `/agents/context/mcp_setup_codex_cli_v01.md`

### Pattern 4: "Getting HTTP 301 redirect loops"
**Diagnosis**: HTTPS redirect conflict
**Root Cause**: Cloudflare "Always Use HTTPS" + HTTPS_METHOD missing
**Fix**: Disable "Always Use HTTPS" OR add HTTPS_METHOD=noredirect to containers
**Reference**: `/docs/runbooks/mcp_troubleshooting_v01.md` Section 4

### Pattern 5: "One service works, others don't"
**Diagnosis**: Individual gateway container issue
**Root Cause**: Specific container not running or misconfigured
**Fix**: Check logs for that specific gateway, verify env vars, restart container
**Reference**: This document, Step 5

---

## Quick Reference Commands

### Health Check All Services
```bash
for service in coda github memory firecrawl; do
  echo "=== $service ==="
  curl -I https://${service}.bestviable.com/health
done
```

### Check All Container Status
```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/docker && docker compose -f docker-compose.production.yml ps"
```

### Restart All MCP Gateways
```bash
ssh tools-droplet-agents "cd /root/portfolio/infra/docker && docker compose -f docker-compose.production.yml restart coda-mcp-gateway github-mcp-gateway memory-mcp-gateway firecrawl-mcp-gateway"
```

### View All Gateway Logs
```bash
ssh tools-droplet-agents "docker logs coda-mcp-gateway --tail 20 && docker logs github-mcp-gateway --tail 20 && docker logs memory-mcp-gateway --tail 20 && docker logs firecrawl-mcp-gateway --tail 20"
```

### Check Cloudflare Tunnel Logs
```bash
ssh tools-droplet-agents "docker logs cloudflared --tail 50 | grep -i error"
```

### Check nginx-proxy Routing
```bash
ssh tools-droplet-agents "docker exec nginx-proxy nginx -t && docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep 'server_name'"
```

---

## Related Documentation

- **Detailed Troubleshooting Guide**: `/docs/runbooks/mcp_troubleshooting_v01.md`
- **HTTP Streaming Setup**: `/docs/infrastructure/MCP_HTTP_STREAMING_SETUP.md`
- **Cloudflare Tunnel Guide**: `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md`
- **MCP Setup for Codex CLI**: `/agents/context/mcp_setup_codex_cli_v01.md`
- **SyncBricks Architecture**: `/docs/infrastructure/syncbricks_solution_breakdown_v1.md`
- **Deployment Quick Start**: `/docs/ops/PRODUCTION_DEPLOYMENT_QUICKSTART.md`

---

## Escalation Path

If all checks pass but MCP tools still unavailable:

1. **Capture diagnostics**:
   ```bash
   bash /docs/scripts/mcp_diagnostic_capture.sh > ~/mcp_diagnostics_$(date +%Y%m%d_%H%M%S).txt
   ```

2. **Document issue** in `/sessions/issues/mcp_issue_YYYYMMDD.md`:
   - What stopped working and when
   - All checks performed (reference this flow)
   - Error messages and logs
   - Changes made before issue appeared

3. **Check recent commits**:
   ```bash
   git log --oneline --since="3 days ago" -- docs/infrastructure/ infra/docker/
   ```

4. **Review recent session handoffs** for related changes:
   - `/sessions/handoffs/SESSION_HANDOFF_*.md`
   - `/sessions/handoffs/CLOUDFLARE_COMPLETION_STATUS.md`

5. **Create new session handoff** documenting current state and requesting human assistance

---

**Summary**: This decision tree helps agents systematically diagnose MCP connectivity issues by checking each layer of the stack: client config → external HTTPS → Cloudflare → nginx-proxy → gateway containers → MCP protocol. Most issues are caught at the Cloudflare or container layers.
