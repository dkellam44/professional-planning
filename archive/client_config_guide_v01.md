---
entity: mcp-client-config
level: internal
zone: internal
version: v01
tags: [mcp, client, configuration, claude-desktop, claude-code, authentication]
source_path: /docs/architecture/integrations/mcp/client_config_guide_v01.md
date: 2025-10-31
---

# MCP Client Configuration Guide

**Purpose**: Step-by-step guide to configuring Claude Desktop, Claude Code, and other clients for Tier 1 HTTP Gateway MCPs.

**Updated**: 2025-10-31

---

## Quick Start

### Claude Desktop (macOS)

**File Location**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Template Config** (Coda + GitHub + Memory + Firecrawl):

```json
{
  "mcpServers": {
    "coda": {
      "transport": "http",
      "url": "https://coda.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${CODA_API_TOKEN}"
      }
    },
    "github": {
      "transport": "http",
      "url": "https://github.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "memory": {
      "transport": "http",
      "url": "https://memory.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer memory-session-token"
      }
    },
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

### Claude Code

**File Location**: `~/.config/claude-code/mcp.json` (create if doesn't exist)

```json
{
  "mcpServers": {
    "coda": {
      "transport": "http",
      "url": "https://coda.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${CODA_API_TOKEN}"
      }
    },
    "github": {
      "transport": "http",
      "url": "https://github.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "memory": {
      "transport": "http",
      "url": "https://memory.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer memory-session-token"
      }
    },
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

---

## Detailed Configuration

### 1. Coda MCP

**Name**: Coda Document API

**Tools**: 34 tools (documents, pages, tables, columns, rows, formulas, controls, users)

**Authentication**: Bearer token (Coda API key)

**Get Token**:
1. Go to https://coda.io/account/settings
2. Find "API tokens" section
3. Click "Generate API token"
4. Copy token

**Configuration**:

```json
{
  "coda": {
    "transport": "http",
    "url": "https://coda.bestviable.com/mcp",
    "headers": {
      "Authorization": "Bearer ${CODA_API_TOKEN}"
    }
  }
}
```

**Environment Variable**:
```bash
export CODA_API_TOKEN="<your-token-here>"
```

**Test**:
```bash
curl -H "Authorization: Bearer $CODA_API_TOKEN" \
  https://coda.bestviable.com/.well-known/oauth-authorization-server | jq .issuer
```

---

### 2. GitHub MCP

**Name**: GitHub Repository API

**Tools**: ~15 tools (repos, issues, PRs, code search, content management)

**Authentication**: Bearer token (GitHub Personal Access Token)

**Get Token**:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Select scopes:
   - ✅ `repo` (full control of private repositories)
   - ✅ `read:user` (read user profile data)
   - ✅ `gist` (create gists)
4. Click "Generate token"
5. Copy token (only shown once!)

**Configuration**:

```json
{
  "github": {
    "transport": "http",
    "url": "https://github.bestviable.com/mcp",
    "headers": {
      "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
    }
  }
}
```

**Environment Variable**:
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_<your-token>"
```

**Test**:
```bash
curl -H "Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN" \
  https://github.bestviable.com/.well-known/oauth-authorization-server | jq .issuer
```

---

### 3. Memory MCP

**Name**: Shared Knowledge Graph

**Tools**: 5 tools (create/read/update entities, manage relationships, graph queries)

**Authentication**: Bearer token (any session identifier)

**Get Token**:
- Any non-empty string, e.g., `memory-session-token`
- Used to namespace shared memory graphs
- No API key needed

**Configuration**:

```json
{
  "memory": {
    "transport": "http",
    "url": "https://memory.bestviable.com/mcp",
    "headers": {
      "Authorization": "Bearer memory-session-token"
    }
  }
}
```

**Note**: Token is optional but recommended for session tracking. Memory persists across sessions on the droplet.

**Test**:
```bash
curl -H "Authorization: Bearer memory-session-token" \
  https://memory.bestviable.com/.well-known/oauth-authorization-server | jq .issuer
```

---

### 4. Firecrawl MCP

**Name**: Web Scraping & Content Extraction

**Tools**: 6 tools (scrape URLs, extract structured data, crawl sites, monitor changes)

**Authentication**: Bearer token (Firecrawl API key)

**Get Token**:
1. Go to https://firecrawl.dev
2. Sign up / log in
3. Go to dashboard
4. Find "API Keys" section
5. Create new API key
6. Copy key

**Configuration**:

```json
{
  "firecrawl": {
    "transport": "http",
    "url": "https://firecrawl.bestviable.com/mcp",
    "headers": {
      "Authorization": "Bearer ${FIRECRAWL_API_KEY}"
    }
  }
}
```

**Environment Variable**:
```bash
export FIRECRAWL_API_KEY="fc_<your-api-key>"
```

**Test**:
```bash
curl -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  https://firecrawl.bestviable.com/.well-known/oauth-authorization-server | jq .issuer
```

---

## Setup Instructions

### Claude Desktop (macOS)

1. **Locate config file**:
   ```bash
   open ~/Library/Application\ Support/Claude/
   ```

2. **Edit or create `claude_desktop_config.json`**:
   ```bash
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Add MCP servers** (paste from templates above)

4. **Set environment variables** in your shell profile:
   ```bash
   # Add to ~/.zshrc or ~/.bash_profile
   export CODA_API_TOKEN="<token>"
   export GITHUB_PERSONAL_ACCESS_TOKEN="<token>"
   export FIRECRAWL_API_KEY="<api-key>"
   ```

5. **Restart Claude Desktop**:
   - Quit Claude completely
   - Reopen Claude
   - Check status line for MCP indicator

### Claude Code

1. **Create config directory**:
   ```bash
   mkdir -p ~/.config/claude-code
   ```

2. **Create `mcp.json`**:
   ```bash
   nano ~/.config/claude-code/mcp.json
   ```

3. **Paste config** from templates above

4. **Ensure environment variables are set**:
   ```bash
   # These should already be exported from ~/.zshrc
   echo $CODA_API_TOKEN
   echo $GITHUB_PERSONAL_ACCESS_TOKEN
   echo $FIRECRAWL_API_KEY
   ```

5. **Reload Claude Code**:
   ```bash
   # Restart your terminal or IDE with Claude Code
   # Or use: source ~/.zshrc (if using zsh)
   ```

### Cursor IDE

**File Location**: `~/.cursor/mcp.json` (or similar - check Cursor docs)

Use same config structure as Claude Code above.

### Zed Editor

**File Location**: `~/.config/zed/settings.json` or Zed settings UI

```json
{
  "mcp_servers": {
    "coda": {
      "transport": "http",
      "url": "https://coda.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${CODA_API_TOKEN}"
      }
    }
    // ... add other servers similarly
  }
}
```

---

## Environment Variables

### Setup

Add to your shell profile (`~/.zshrc`, `~/.bash_profile`, etc.):

```bash
# Coda API Token
export CODA_API_TOKEN="<your-coda-token>"

# GitHub Personal Access Token
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_<your-github-token>"

# Firecrawl API Key
export FIRECRAWL_API_KEY="fc_<your-firecrawl-key>"

# For memory (optional)
export MEMORY_SESSION_TOKEN="memory-session-token"
```

### Verification

```bash
# Check all tokens are set
printenv | grep -E "CODA|GITHUB|FIRECRAWL"

# Output should show all three
CODA_API_TOKEN=<token>
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_<token>
FIRECRAWL_API_KEY=fc_<key>
```

---

## Verification Steps

### 1. Health Check

```bash
# Test each endpoint returns 200
curl -I https://coda.bestviable.com/health
curl -I https://github.bestviable.com/health
curl -I https://memory.bestviable.com/health
curl -I https://firecrawl.bestviable.com/health

# All should return: HTTP/2 200
```

### 2. OAuth Discovery

```bash
# Test discovery endpoints
curl -s https://coda.bestviable.com/.well-known/oauth-authorization-server | jq '.issuer'
curl -s https://github.bestviable.com/.well-known/oauth-authorization-server | jq '.issuer'

# Should both return: "https://coda.bestviable.com"
# And: "https://github.bestviable.com"
```

### 3. Authentication

```bash
# Test Coda with token
curl -H "Authorization: Bearer $CODA_API_TOKEN" \
  -X POST https://coda.bestviable.com/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools | length'

# Should return: 34

# Test GitHub with token
curl -H "Authorization: Bearer $GITHUB_PERSONAL_ACCESS_TOKEN" \
  -X POST https://github.bestviable.com/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: test" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools | length'

# Should return: ~15
```

### 4. Claude Desktop Status

1. Open Claude
2. Check bottom right status line
3. Should show MCP indicator with names:
   - ✅ coda
   - ✅ github
   - ✅ memory
   - ✅ firecrawl

4. Click MCP indicator to see details

### 5. Test MCP Usage

In Claude Desktop/Code chat:

**Coda Test**:
```
Please list all my Coda documents
```

**GitHub Test**:
```
Show me the recent commits to my repositories
```

**Memory Test**:
```
Remember: I prefer TypeScript over Python for web projects
```

**Firecrawl Test**:
```
Scrape the content from https://example.com
```

---

## Troubleshooting

### Environment Variables Not Loading

**Problem**: Claude showing "MCP server not found"

**Solution**:
1. Verify variables are exported (not just set):
   ```bash
   # Wrong
   CODA_API_TOKEN="..."

   # Right
   export CODA_API_TOKEN="..."
   ```

2. Verify they're in the right shell profile:
   ```bash
   # For zsh:
   nano ~/.zshrc

   # For bash:
   nano ~/.bash_profile
   ```

3. Reload shell:
   ```bash
   source ~/.zshrc
   # or
   source ~/.bash_profile
   ```

### Authentication Errors

**Problem**: "Invalid or expired token"

**Solution**:
1. Verify token is current:
   - Coda: https://coda.io/account/settings
   - GitHub: https://github.com/settings/tokens
   - Firecrawl: https://firecrawl.dev/dashboard

2. Regenerate if needed:
   - Create new token
   - Update environment variable
   - Update config file
   - Restart client

3. Check token format:
   ```bash
   echo $CODA_API_TOKEN
   # Should be: exactly as copied from service (no spaces)
   ```

### MCP Server Not Connecting

**Problem**: MCP indicator shows error

**Solution**:
1. Check server is running on droplet:
   ```bash
   ssh tools-droplet-agents
   docker ps | grep mcp-gateway

   # Should show all 4 containers running
   ```

2. Check logs:
   ```bash
   docker logs coda-mcp-gateway
   docker logs github-mcp-gateway
   # Look for error messages
   ```

3. Test endpoint manually:
   ```bash
   curl -I https://coda.bestviable.com/health
   # Should return: HTTP/2 200
   ```

4. Check firewall:
   - Ensure HTTPS (443) is accessible
   - Cloudflare Tunnel should handle this

### Rate Limiting

**Problem**: Getting 429 (Too Many Requests)

**Solution**:
- Each gateway allows 10 req/min per IP on auth endpoints
- Stagger MCP initialization (don't restart all at once)
- Wait 1 minute before retrying
- This is by design (prevents brute force attacks)

---

## Security Best Practices

### Token Storage
- ✅ Store in shell profile (`~/.zshrc`, `~/.bash_profile`)
- ✅ Use `export` keyword (not just assignment)
- ❌ Don't store in Git
- ❌ Don't hardcode in config files
- ❌ Don't share in screenshots/logs

### Token Rotation
- ⏰ **Coda**: Every 90 days (calendar reminder: Jan 29, Apr 29, Jul 29, Oct 29)
- ⏰ **GitHub**: Every 90 days
- ⏰ **Firecrawl**: Every 90 days (check their docs)
- ⏰ **Memory**: No rotation needed (no API key)

### Token Revocation
If token is compromised:
1. Immediately revoke from service dashboard
2. Update environment variable
3. Generate new token
4. Update Claude config
5. Restart Claude

### Audit
- ✅ Server logs all auth attempts
- ✅ Tokens redacted in logs (***REDACTED***)
- ✅ Failures logged with timestamp and IP
- Monitor droplet logs regularly:
  ```bash
  ssh tools-droplet-agents
  docker logs coda-mcp-gateway | grep AUTH
  ```

---

## Reference: Endpoint Structure

All MCPs follow this structure:

```
https://{mcp-name}.bestviable.com/mcp

POST /mcp - Send JSON-RPC requests
GET /mcp  - Receive SSE stream (Server→Client)
DELETE /mcp - Terminate session

Headers:
  Authorization: Bearer <token>
  mcp-session-id: <session-id> (optional, auto-generated)
  Content-Type: application/json
```

Example MCP Request:
```bash
curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer $CODA_API_TOKEN" \
  -H "mcp-session-id: session-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

---

## Related Documentation

- **Auth Strategies**: `/docs/architecture/integrations/mcp/auth_strategies_v01.md`
- **Server Catalog**: `/docs/architecture/integrations/mcp/server_catalog_v01.md`
- **Gateway Template**: `/integrations/mcp/gateway-template/README.md`
- **Droplet State**: `/docs/infrastructure/droplet_state_*.md`

---

**Last Updated**: 2025-10-31
**Next Review**: 2025-12-31 (token rotation check + OAuth 2.1 planning)
