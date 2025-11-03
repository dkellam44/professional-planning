---
- entity: runbook
- level: internal
- zone: internal
- version: v01
- tags: [runbook, troubleshooting, mcp, operations]
- source_path: /docs/runbooks/mcp_troubleshooting_v01.md
- date: 2025-10-31
---

# MCP Troubleshooting Runbook

**Purpose**: Step-by-step diagnostics and recovery procedures for MCP servers across all three tiers (HTTP Streaming Transport).

**When to use**: Use this runbook when:
- MCP tools are unavailable in AI clients
- Remote MCP endpoints return errors or timeouts
- Local MCP servers fail to start
- Tools return unexpected results or errors

---

## Quick Diagnostic Matrix

| Symptom | Tier | Likely Cause | Section |
|---------|------|--------------|---------|
| Tool not available in client | Any | Client config issue | [Client Config](#client-configuration-issues) |
| 502 Bad Gateway | Tier 1 | Container not running or binding issue | [Tier 1: Container](#tier-1-container-not-running) |
| Connection refused | Tier 1 | nginx-proxy can't reach service | [Tier 1: Routing](#tier-1-routing-issues) |
| ERR_TOO_MANY_REDIRECTS | Tier 1 | Proxy trust misconfiguration | [Tier 1: Redirects](#tier-1-redirect-loops) |
| Command not found | Tier 2/3 | Package not installed | [Tier 2/3: Install](#tier-23-installation-issues) |
| Authentication failed | Any | API key invalid or missing | [Auth Issues](#authentication-issues) |
| Slow responses | Tier 1 | Resource exhaustion | [Performance](#performance-issues) |

---

## Tier 1: Remote Transport Servers (Droplet-Hosted)

### Tier 1: Health Check Procedure

**Quick health check for all Tier 1 MCPs:**

```bash
# From local machine
curl -I https://coda.bestviable.com/health
curl -I https://github.bestviable.com/health
curl -I https://memory.bestviable.com/health
curl -I https://firecrawl.bestviable.com/health

# Expected: HTTP/1.1 200 OK + JSON health status
# If 502/503/504: Service down (container not running)
# If 301 Moved Permanently: HTTPS redirect loop (see Redirect Loops section)
# If timeout or no response: Cloudflare Tunnel not configured for domain
# If 404: DNS misconfigured or service path incorrect
```

**Detailed health check from droplet:**

```bash
# SSH to droplet
ssh tools-droplet-agents

# Check all MCP containers
docker compose -f docker-compose.production.yml ps | grep mcp-gateway

# Expected output:
# coda-mcp-gateway    running    Up X hours (healthy)
# github-mcp-gateway  running    Up X hours (healthy)

# Check specific container logs
docker logs coda-mcp-gateway --tail 50
docker logs github-mcp-gateway --tail 50

# Check nginx-proxy routing
docker logs nginx-proxy --tail 40 | grep -E "(coda|github|memory)"

# Check Cloudflare Tunnel status
docker logs cloudflared --tail 40
```

---

### Tier 1: Container Not Running

**Symptoms:**
- `curl https://{mcp}.bestviable.com/health` returns 502 Bad Gateway
- `docker compose ps` shows container stopped or unhealthy

**Diagnostic steps:**

```bash
ssh tools-droplet-agents

# Check container status
docker compose -f docker-compose.production.yml ps {mcp-name}-mcp-gateway

# If stopped, check why
docker logs {mcp-name}-mcp-gateway --tail 100

# Common log errors:
# - "Cannot find module 'X'" → Missing npm dependency
# - "Permission denied" → File permissions issue
# - "Port already in use" → Port conflict
# - "ECONNREFUSED" → Dependency service not available
```

**Recovery actions:**

```bash
# Restart container
docker compose -f docker-compose.production.yml restart {mcp-name}-mcp-gateway

# If restart fails, rebuild and restart
docker compose -f docker-compose.production.yml build {mcp-name}-mcp-gateway
docker compose -f docker-compose.production.yml up -d {mcp-name}-mcp-gateway

# Watch logs for errors
docker logs -f {mcp-name}-mcp-gateway

# Verify health check passes
docker compose -f docker-compose.production.yml ps {mcp-name}-mcp-gateway
# Should show (healthy) after start_period (usually 120s)
```

---

### Tier 1: Routing Issues

**Symptoms:**
- Container running and healthy, but endpoint returns "Connection refused"
- nginx-proxy logs show "no upstream" or "connect() failed"

**Diagnostic steps:**

```bash
ssh tools-droplet-agents

# Verify container is on proxy network
docker inspect {mcp-name}-mcp-gateway | grep -A 10 Networks

# Should show "proxy" network

# Check if service is listening on 0.0.0.0 (not 127.0.0.1)
docker compose -f docker-compose.production.yml exec {mcp-name}-mcp-gateway netstat -tlnp | grep {port}

# Expected: 0.0.0.0:{port}
# Problem: 127.0.0.1:{port} (only listening on localhost inside container)

# Check VIRTUAL_HOST environment variable
docker inspect {mcp-name}-mcp-gateway | grep VIRTUAL_HOST

# Should match: {mcp-name}.bestviable.com
```

**Recovery actions:**

```bash
# If service bound to 127.0.0.1:
# 1. Update docker-compose.production.yml command to bind to 0.0.0.0
# 2. Rebuild and restart container

# If VIRTUAL_HOST incorrect:
# 1. Update docker-compose.production.yml environment section
# 2. Restart container (no rebuild needed for env vars)
docker compose -f docker-compose.production.yml up -d {mcp-name}-mcp-gateway

# Force nginx-proxy to regenerate config
docker compose -f docker-compose.production.yml restart nginx-proxy

# Wait 30 seconds for config regeneration
sleep 30

# Test endpoint
curl -I https://{mcp-name}.bestviable.com/health
```

---

### Tier 1: Redirect Loops

**Symptoms:**
- `curl https://{mcp}.bestviable.com/health` returns `301 Moved Permanently`
- Browser shows "ERR_TOO_MANY_REDIRECTS"
- `curl -L https://{mcp}.bestviable.com/health` loops infinitely

**Cause**: Cloudflare Tunnel terminates TLS and forwards HTTP to nginx-proxy. nginx-proxy tries to redirect HTTP → HTTPS, causing infinite loop.

**Diagnostic steps:**

```bash
ssh tools-droplet-agents

# Check proxy trust settings
docker inspect {mcp-name}-mcp-gateway | grep -E "(HTTPS_METHOD|TRUST_DOWNSTREAM_PROXY)"

# Should show:
# HTTPS_METHOD=noredirect
# TRUST_DOWNSTREAM_PROXY=true
```

**Recovery actions:**

```bash
# Update docker-compose.production.yml for the service:
environment:
  HTTPS_METHOD: noredirect
  TRUST_DOWNSTREAM_PROXY: "true"

# Restart service
docker compose -f docker-compose.production.yml up -d {mcp-name}-mcp-gateway

# Test
curl -I https://{mcp-name}.bestviable.com/health
# Should now return 200 OK without 301 redirects
```

**Reference**:
- ADR: `/agents/decisions/2025-10-28_cloudflare-proxy-trust-config_v01.md`
- Official nginx-proxy documentation: https://github.com/nginx-proxy/nginx-proxy (HTTPS_METHOD environment variable)

---

### Tier 1: SSL Certificate Issues

**Symptoms:**
- `curl` shows "certificate verify failed"
- Browser shows "Your connection is not private"

**Diagnostic steps:**

```bash
ssh tools-droplet-agents

# Check acme-companion logs
docker logs acme-companion --tail 50 | grep {mcp-name}

# Check if certificate was issued
ls -la ./certs/ | grep {mcp-name}.bestviable.com

# Should see:
# {mcp-name}.bestviable.com.crt
# {mcp-name}.bestviable.com.key
# {mcp-name}.bestviable.com.chain.pem
```

**Recovery actions:**

```bash
# If certificate missing, trigger renewal:

# 1. Verify LETSENCRYPT_HOST is set
docker inspect {mcp-name}-mcp-gateway | grep LETSENCRYPT_HOST

# 2. Restart acme-companion to trigger new certificate request
docker compose -f docker-compose.production.yml restart acme-companion

# 3. Watch acme-companion logs for certificate issuance (may take 1-5 minutes)
docker logs -f acme-companion

# 4. Verify certificate files created
ls -la ./certs/ | grep {mcp-name}.bestviable.com

# 5. Test endpoint
curl -I https://{mcp-name}.bestviable.com/health
```

---

### Tier 1: Cloudflare Tunnel Not Running

**Symptoms:**
- `curl https://{mcp}.bestviable.com/health` returns Cloudflare error 1033
- External HTTPS endpoints completely unresponsive

**Diagnostic steps:**

```bash
ssh tools-droplet-agents

# Check if cloudflared container is running
docker ps --filter name=cloudflared

# If not running, check logs for why it stopped
docker logs cloudflared --tail 100
```

**Recovery actions:**

```bash
ssh tools-droplet-agents

# Start cloudflared tunnel
docker compose -f docker-compose.production.yml up -d cloudflared

# Watch logs for successful connection
docker logs -f cloudflared

# Should see:
# "Registered tunnel connection" messages for configured domains
# Multiple connection registrations (typically 4)

# Test endpoints
curl -I https://coda.bestviable.com/health
```

**Reference**: See `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md` for tunnel setup and token management.

---

### Tier 1: Cloudflare Tunnel Domain Not Configured

**Symptoms:**
- Service works internally (`curl http://127.0.0.1:808X/health` returns 200 OK)
- Service returns `301 Moved Permanently` OR times out externally
- Other services on same droplet working fine

**Root Cause**: Domain not added to Cloudflare Tunnel configuration in Zero Trust dashboard

**Diagnostic steps:**

```bash
ssh tools-droplet-agents

# Check tunnel logs to see configured domains
docker logs cloudflared --tail 50 | grep "Updated to new configuration"

# Should show all configured hostnames in ingress rules
# Example:
# "ingress":[{"hostname":"coda.bestviable.com",...}, {"hostname":"github.bestviable.com",...}]

# Test internal endpoint (should work)
curl http://127.0.0.1:808X/health

# Test external endpoint (will fail if not in tunnel config)
curl https://{new-service}.bestviable.com/health
```

**Recovery actions:**

This requires access to Cloudflare Zero Trust dashboard:

1. Login to Cloudflare Zero Trust dashboard
2. Navigate to **Access** → **Tunnels**
3. Find your tunnel (e.g., "bestviable-tunnel")
4. Click **Configure**
5. Go to **Public Hostname** tab
6. Click **Add a public hostname**:
   - **Subdomain**: `{mcp-name}` (e.g., "github", "memory", "firecrawl")
   - **Domain**: `bestviable.com`
   - **Service**: `http://nginx-proxy` (internal docker network service name)
   - **HTTP Host Header**: Leave empty or set to subdomain.domain
7. Click **Save**
8. Wait 30-60 seconds for tunnel to reload configuration

9. Verify in tunnel logs:
```bash
ssh tools-droplet-agents
docker logs cloudflared --tail 20

# Should show "Updated to new configuration" with new hostname
```

10. Test endpoint:
```bash
curl -I https://{new-service}.bestviable.com/health
# Should now return 200 OK
```

**Note**: Without Cloudflare dashboard access, this blocker cannot be resolved. Services will work internally but not be accessible externally.

---

### Tier 1: DNS / Cloudflare Tunnel Issues

**Symptoms:**
- `curl https://{mcp}.bestviable.com/health` times out or shows "Could not resolve host"
- `dig {mcp}.bestviable.com` returns NXDOMAIN

**Diagnostic steps:**

```bash
# Check DNS resolution
dig {mcp-name}.bestviable.com

# Should return:
# ANSWER SECTION:
# {mcp-name}.bestviable.com. 300 IN CNAME bestviable.com.
# bestviable.com. 300 IN A 159.65.97.146  (or Cloudflare IP)

# Check Cloudflare Tunnel status
ssh tools-droplet-agents
docker logs cloudflared --tail 50

# Should show:
# "Connection registered" for all services
# No "connection refused" or "failed to connect" errors
```

**Recovery actions:**

**If DNS record missing:**
1. Login to Cloudflare dashboard
2. Navigate to DNS settings for `bestviable.com`
3. Add record:
   - Type: CNAME
   - Name: `{mcp-name}`
   - Target: `@` (or `bestviable.com`)
   - Proxied: ON (orange cloud)
4. Wait 1-2 minutes for DNS propagation
5. Test: `dig {mcp-name}.bestviable.com`

**If Cloudflare Tunnel down:**
```bash
ssh tools-droplet-agents

# Restart tunnel
docker compose -f docker-compose.production.yml restart cloudflared

# Watch logs for successful connection
docker logs -f cloudflared

# Should see "registered tunnel" messages
```

---

## Tier 2: User-Scope Local Servers

### Tier 2: Installation Issues

**Symptoms:**
- Client shows "Command not found: npx" or "Command not found: uvx"
- MCP server fails to start

**Diagnostic steps:**

```bash
# Check Node.js installed (for npx)
node --version
npm --version

# Check Python installed (for uvx)
python3 --version
pip --version

# Test manual installation
npx -y @modelcontextprotocol/server-{mcp-name}
# OR
uvx mcp-server-{mcp-name}

# Should start server without errors
```

**Recovery actions:**

**If Node.js missing:**
```bash
# Install Node.js (macOS)
brew install node

# Verify
node --version  # Should show v18+ or v20+
```

**If Python/uvx missing:**
```bash
# Install Python (macOS)
brew install python3

# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Verify
uvx --version
```

**If package install fails:**
```bash
# For npm packages, try clearing cache
npm cache clean --force
npx -y @modelcontextprotocol/server-{mcp-name}

# For uvx packages, try with --force
uvx --force mcp-server-{mcp-name}
```

---

### Tier 2: Client Configuration Issues

**Symptoms:**
- MCP tools not appearing in client UI
- Client shows "Failed to start MCP server"

**Diagnostic steps:**

**Claude Desktop:**
```bash
# Check config file exists
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Validate JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq .

# If jq fails, JSON is malformed

# Check client logs
tail -f ~/Library/Logs/Claude/mcp*.log
```

**Claude Code:**
```bash
# Check config file exists
cat ~/.config/claude-code/mcp.json

# Validate JSON syntax
cat ~/.config/claude-code/mcp.json | jq .
```

**Recovery actions:**

**If JSON malformed:**
1. Use online JSON validator to find syntax error
2. Common issues:
   - Missing comma between entries
   - Trailing comma at end of array/object
   - Unescaped quotes in strings
3. Fix syntax, save file
4. Restart client

**If config missing:**
1. Copy from template:
   ```bash
   cp ~/workspace/mcp-configs/user-scope/claude-desktop.json \
      ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
2. Replace placeholders with real API keys
3. Restart client

---

## Tier 3: Project-Scope Local Servers

### Tier 3: Configuration Issues

**Symptoms:**
- Project-scope MCP not starting when working in workspace
- Tools not available in project context

**Diagnostic steps:**

```bash
# Navigate to project
cd /Users/davidkellam/workspace/portfolio

# Check .mcp directory exists
ls -la .mcp/

# Expected:
# .mcp/config.json
# .mcp/.env
# .mcp/README.md

# Validate config
cat .mcp/config.json | jq .

# Check environment variables loaded
cat .mcp/.env

# Test MCP server manually
cd /Users/davidkellam/workspace/portfolio
npx -y @modelcontextprotocol/server-filesystem $PWD
```

**Recovery actions:**

**If .mcp directory missing:**
```bash
mkdir -p /Users/davidkellam/workspace/portfolio/.mcp

# Copy template or create config.json
cat > .mcp/config.json <<'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/davidkellam/workspace/portfolio"],
      "env": {}
    }
  }
}
EOF

# Create .env if secrets needed
touch .mcp/.env
echo "API_KEY=your-key-here" >> .mcp/.env

# Create README
cat > .mcp/README.md <<'EOF'
# Project MCP Configuration

See parent README for setup instructions.
EOF
```

**If filesystem scope incorrect:**
- Verify `args` in config.json points to correct project path
- Must be absolute path, not relative
- Update and test manually

---

## Authentication Issues

### Invalid or Missing API Keys

**Symptoms:**
- Tool returns "401 Unauthorized" or "403 Forbidden"
- Logs show "API key missing" or "Invalid credentials"

**Diagnostic steps:**

**Tier 1 (Remote):**
```bash
ssh tools-droplet-agents

# Check environment variable set
docker inspect {mcp-name}-mcp-gateway | grep {API_KEY_VAR}

# Should show non-empty value (may be masked as "***")

# Check .env file
cat .env | grep {API_KEY_VAR}

# Verify variable name matches exactly (case-sensitive)
```

**Tier 2/3 (Local):**
```bash
# Check client config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | jq '.mcpServers."{mcp-name}".env'

# Should show API key (or placeholder if using ${VAR} syntax)

# If using ${VAR} syntax, check environment variable set in shell
echo $API_KEY_VAR
```

**Recovery actions:**

**For Tier 1:**
```bash
ssh tools-droplet-agents

# Update .env file
nano .env
# Add or fix: {API_KEY_VAR}="actual-key-value"

# Restart service to reload env vars
docker compose -f docker-compose.production.yml restart {mcp-name}-mcp-gateway

# Test
curl -X POST https://{mcp-name}.bestviable.com/health \
  -H "Authorization: Bearer ${API_KEY_VAR}" \
  -d '{"method": "tools/list"}'
```

**For Tier 2/3:**
1. Update config file with correct API key
2. Restart client
3. Test tool invocation

**If API key expired/invalid:**
1. Generate new key from service dashboard (Coda, GitHub, etc.)
2. Update `.env` (Tier 1) or client config (Tier 2/3)
3. Restart service/client
4. Test

---

## Performance Issues

### Slow Response Times

**Symptoms:**
- Tools take >5 seconds to respond
- Client shows "Loading..." for extended periods
- Timeout errors

**Diagnostic steps:**

**Tier 1:**
```bash
ssh tools-droplet-agents

# Check container resource usage
docker stats {mcp-name}-mcp-gateway --no-stream

# High CPU (>80%) or memory (>500MB) indicates resource exhaustion

# Check for rate limiting in logs
docker logs {mcp-name}-mcp-gateway --tail 100 | grep -E "(rate|limit|429)"

# Test endpoint latency
time curl -X POST https://{mcp-name}.bestviable.com/health \
  -H "Authorization: Bearer ${API_KEY}" \
  -d '{"method": "tools/list"}'
```

**Recovery actions:**

**If high resource usage:**
```bash
# Restart container
docker compose -f docker-compose.production.yml restart {mcp-name}-mcp-gateway

# If persistent, check for:
# - Memory leaks in MCP server code
# - Runaway processes
# - Large data loads

# Consider adding resource limits to docker-compose:
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

**If rate limiting:**
- Check service API docs for rate limits
- Implement caching layer (future work)
- Consider upgrading API plan if available

---

## Recovery Procedures

### Complete Restart of All MCP Services

**When to use**: Multiple Tier 1 MCPs failing, or after droplet maintenance

```bash
ssh tools-droplet-agents

# Stop all MCP gateways
docker compose -f docker-compose.production.yml stop coda-mcp-gateway
docker compose -f docker-compose.production.yml stop github-mcp-gateway
docker compose -f docker-compose.production.yml stop memory-mcp-gateway

# Restart nginx-proxy and Cloudflare Tunnel
docker compose -f docker-compose.production.yml restart nginx-proxy
docker compose -f docker-compose.production.yml restart cloudflared

# Wait for services to stabilize
sleep 10

# Start MCP gateways
docker compose -f docker-compose.production.yml up -d coda-mcp-gateway
docker compose -f docker-compose.production.yml up -d github-mcp-gateway
docker compose -f docker-compose.production.yml up -d memory-mcp-gateway

# Wait for health checks (120s start_period)
sleep 120

# Verify all healthy
docker compose -f docker-compose.production.yml ps | grep mcp-gateway

# Test endpoints
curl -I https://coda.bestviable.com/health
curl -I https://github.bestviable.com/health
curl -I https://memory.bestviable.com/health
```

---

### Rollback to Previous Version

**When to use**: New MCP deployment causing issues

```bash
ssh tools-droplet-agents

# Check git log for previous working version
cd /path/to/integrations/mcp/servers/{mcp-name}/
git log --oneline

# Checkout previous commit
git checkout {previous-commit-hash}

# Rebuild container
docker compose -f docker-compose.production.yml build {mcp-name}-mcp-gateway

# Restart with old version
docker compose -f docker-compose.production.yml up -d {mcp-name}-mcp-gateway

# Verify
curl -I https://{mcp-name}.bestviable.com/health
```

---

## Escalation Path

If issue persists after following this runbook:

1. **Check related documentation**:
   - Server-specific troubleshooting: `/integrations/mcp/servers/{mcp-name}/TROUBLESHOOTING.md`
   - Infrastructure docs: `/docs/infrastructure/`
   - ADRs: `/agents/decisions/`

2. **Gather diagnostic bundle**:
   ```bash
   ssh tools-droplet-agents

   # Create diagnostic archive
   mkdir -p /tmp/mcp-diagnostics
   docker compose -f docker-compose.production.yml ps > /tmp/mcp-diagnostics/services.txt
   docker compose -f docker-compose.production.yml logs --tail=200 > /tmp/mcp-diagnostics/logs.txt
   docker logs nginx-proxy --tail=100 > /tmp/mcp-diagnostics/nginx.log
   docker logs cloudflared --tail=100 > /tmp/mcp-diagnostics/cloudflared.log
   tar -czf mcp-diagnostics-$(date +%Y%m%d).tar.gz -C /tmp mcp-diagnostics/
   ```

3. **Contact**:
   - Create issue in `/docs/infrastructure/issues/` (if internal tracking)
   - Escalate to infrastructure team
   - Post in team Slack/chat with diagnostic bundle

---

## Related Documentation

- **Server Catalog**: `/docs/architecture/integrations/mcp/server_catalog_v01.md`
- **Deployment Flows**: `/docs/architecture/integrations/mcp/DEPLOYMENT_FLOWS.md`
- **Architecture**: `/agents/context/playbooks/mcp_architecture_implementation_playbook_v01.md`
- **ADRs**: `/agents/decisions/2025-10-29_mcp-tier-architecture_v01.md`
- **Infrastructure**: `/docs/infrastructure/droplet_state_2025-10-28.md`
- **SyncBricks Pattern**: `/docs/infrastructure/syncbricks_solution_breakdown_v1.md`
- **Cloudflare Tunnel Guide**: `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md`

---

## Operational Notes

### SSH Access
Droplet access is configured with SSH alias for convenience:
```bash
ssh tools-droplet-agents  # Alias for: ssh root@159.65.97.146
```

**Configuration**: See `~/.ssh/config` for alias definition

### Official Documentation URLs
The following external documentation was referenced in this runbook:
- nginx-proxy: https://github.com/nginx-proxy/nginx-proxy
- Cloudflare Tunnels: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/

### Token Budget Monitoring
For agents working on troubleshooting sessions, use the **token-budget-advisor skill** to monitor context window usage proactively, especially when gathering large diagnostic outputs.

---

**Maintenance**: Update this runbook when:
- New failure modes discovered
- Recovery procedures change
- New tier added
- Infrastructure architecture changes
- External documentation URLs change

**Last Updated**: 2025-10-31 (Updated for HTTP Streaming Transport and added Cloudflare Tunnel configuration issues)
