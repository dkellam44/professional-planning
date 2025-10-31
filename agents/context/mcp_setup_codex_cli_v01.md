- entity: guide
- level: internal
- zone: internal
- version: v01
- tags: [mcp, codex, tooling, setup]
- source_path: /context/startup/mcp_setup_codex_cli_v01.md
- date: 2025-10-28

---

# Codex CLI MCP Setup — Template & Instructions

Use this guide to enable Model Context Protocol (MCP) tools inside Codex CLI. Once configured, new sessions can access your local MCP servers (e.g., time server) and remote HTTP/SSE connectors (e.g., Coda gateway).

---

## 1. File Location

Codex CLI looks for MCP definitions under your user config directory:

| Platform | Config file path |
|----------|------------------|
| macOS / Linux | `~/.config/codex-cli/mcp_servers.json` |
| Windows | `%APPDATA%\codex-cli\mcp_servers.json` |

If the file or directories do not exist, create them.

---

## 2. Template Configuration

Below is a sample `mcp_servers.json` that wires up:

- **Local time server** (`~/mcp-server-time/main.py`)
- **Coda MCP gateway** exposed at `https://coda.bestviable.com/mcp`
- **GitHub, Memory, Firecrawl MCP gateways** (additional examples)

Update the paths, URLs, and environment variables for your environment.

```json
{
  "servers": [
    {
      "name": "time-local",
      "type": "stdio",
      "command": "python3",
      "args": [
        "/Users/davidkellam/mcp-server-time/main.py"
      ],
      "env": {}
    },
    {
      "name": "coda-gateway",
      "type": "sse",
      "url": "https://coda.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${CODA_API_TOKEN}"
      },
      "env": {
        "CODA_API_TOKEN": "PLACEHOLDER_TOKEN"
      }
    },
    {
      "name": "github-gateway",
      "type": "sse",
      "url": "https://github.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
      },
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "PLACEHOLDER_TOKEN"
      }
    },
    {
      "name": "memory-gateway",
      "type": "sse",
      "url": "https://memory.bestviable.com/mcp",
      "env": {}
    },
    {
      "name": "firecrawl-gateway",
      "type": "sse",
      "url": "https://firecrawl.bestviable.com/mcp",
      "headers": {
        "Authorization": "Bearer ${FIRECRAWL_API_KEY}"
      },
      "env": {
        "FIRECRAWL_API_KEY": "PLACEHOLDER_TOKEN"
      }
    }
  ]
}
```

### Notes
- `type: "stdio"` runs a local binary or script; `type: "sse"` connects to an SSE endpoint (Cloudflare tunnel works out of the box).
- **Endpoint paths**: All MCP gateways use `/mcp` endpoint (not `/sse`) for HTTP streaming.
- For sensitive tokens, prefer referencing environment variables (`${...}`) rather than storing raw values in the file.
- Additional servers can be appended to the `servers` array following the same structure.

---

## 3. Activation Steps

1. Save the JSON to the config path above.
2. Restart the Codex CLI session (exit and relaunch). On startup it will enumerate the MCP connectors listed.
3. Run `/tools` (or the CLI’s equivalent command) to confirm the new MCP tools appear.
4. Test each tool:
   - Time server: invoke `time-local.now`.
   - Coda gateway: send a simple MCP request or use your chat/CLI client to confirm it can list tables.

---

## 4. Maintenance

- Keep this guide updated whenever you add or rename servers; log changes in `logs/context_actions.csv`.
- For remote endpoints (like the Coda gateway), ensure the Cloudflare tunnel and Docker stack are running before launching Codex CLI (see `context/sessions/2025-10-28_n8n-coda-production-notes.md`).
- If you rotate secrets, update the environment variables referenced in the MCP config.

---

**TTL:** Review this setup after significant tool changes or by **2025-11-30**. Update `version` when making material revisions.
