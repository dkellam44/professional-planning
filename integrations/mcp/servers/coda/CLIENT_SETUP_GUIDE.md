# Coda MCP Client Setup Guide
**Status**: HTTP-native MCP server deployed and tested
**Protocol**: HTTP Streamable + SSE (Server-Sent Events) for streaming responses
**Server URL**: https://coda.bestviable.com (production) | http://localhost:8080 (local)

---

## Quick Summary

The Coda MCP HTTP-native server supports three client types:

| Client | Status | Setup Difficulty | Notes |
|--------|--------|------------------|-------|
| **CLI (curl-based)** | ✅ Working | Low | Requires manual SSE stream handling |
| **Claude Desktop** | ⚠️ Ready | Medium | OAuth2 authentication required |
| **ChatGPT Web Connector** | 🔄 Ready | Medium | Custom action/plugin configuration |

All clients authenticate via **Bearer Token** (Coda API token format: `pat_xxxxx`) to the HTTP-native endpoint.

---

## 1. CLI Client Setup (curl)

### Basic Health Check
```bash
curl -s https://coda.bestviable.com/health
# Returns: {"status":"ok","service":"coda-mcp","version":"1.0.0","timestamp":"..."}
```

### Initialize a Session (Step 1)
Create an MCP session and capture the session ID:

```bash
CODA_TOKEN="pat_your_token_here"
SERVER="http://127.0.0.1:8080"  # or https://coda.bestviable.com

# Initialize and save headers
curl -s -D /tmp/headers.txt -o /tmp/init.json \
  -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $CODA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"initialize",
    "params":{
      "protocolVersion":"2025-03-26",
      "capabilities":{},"client":{"name":"coda-mcp-cli","version":"1.0"}
    }
  }'

# Extract session ID from response headers
SESSION_ID=$(grep -i 'mcp-session-id' /tmp/headers.txt | awk '{print $2}' | tr -d '\r')
echo "Session ID: $SESSION_ID"
```

### Send a Tool Request (Step 2)
```bash
curl -s -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $CODA_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"tools/list","params":{}
  }'
# Note: This returns immediately but tool results come via SSE stream (Step 3)
```

### Open the SSE Stream (Step 3) - Critical!
The streaming protocol requires opening a GET stream to receive responses:

```bash
# Open stream in separate terminal (or use &)
curl -s -N \
  -H "Authorization: Bearer $CODA_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Accept: text/event-stream" \
  "$SERVER/mcp" &

# Keep this stream open. You'll see:
# :keep-alive
# data: {"jsonrpc":"2.0","method":"...",...}
# etc.

# When done, close the stream (Ctrl+C in interactive terminal, or kill the background job)
```

### Complete CLI Workflow Script
See `test-with-real-token.sh` for automated testing with STRICT=0 VERBOSE=true flags:

```bash
CODA_API_TOKEN=pat_your_token STRICT=0 VERBOSE=true \
  bash test-with-real-token.sh http://127.0.0.1:8080
```

---

## 2. Claude Desktop Client Setup

### Prerequisites
- Claude Desktop installed (https://claude.ai/download)
- Coda API token (from https://coda.io/account/settings)

### Configuration Steps

1. **Open Claude Desktop Settings**
   - Click ⚙️ (Settings) in Claude Desktop

2. **Navigate to Developer > MCP Servers**

3. **Add new Server with these settings:**

   ```json
   {
     "name": "Coda MCP",
     "url": "https://coda.bestviable.com",
     "authenticationMethod": "Bearer Token",
     "authenticationValue": "pat_your_token_here"
   }
   ```

4. **Click "Save" and "Connect"**

5. **Verify Connection**
   - Look for 🔗 icon next to server name
   - Try asking Claude: "List my Coda documents"

### Troubleshooting Claude Desktop

| Issue | Solution |
|-------|----------|
| "Server refused connection" | Verify server URL is correct and firewall allows HTTPS |
| "Invalid authentication" | Check token format: must start with `pat_` |
| "Server not responding" | Check `curl https://coda.bestviable.com/health` works |
| "Tools not available" | Restart Claude Desktop after adding server |

---

## 3. ChatGPT Web Connector Setup

### Prerequisites
- ChatGPT Plus subscription with GPT-4
- ChatGPT web connector enabled (https://openai.com/index/introducing-actions/)

### Configuration Steps

1. **Create Custom Action in ChatGPT**
   - Go to https://chatgpt.com/gpts/editor
   - Click "Create new action"

2. **Configure Action Schema**

   ```json
   {
     "openapi": "3.0.0",
     "info": {
       "title": "Coda MCP API",
       "version": "1.0.0",
       "description": "Access Coda documents via MCP protocol"
     },
     "servers": [
       {"url": "https://coda.bestviable.com"}
     ],
     "paths": {
       "/mcp": {
         "post": {
           "operationId": "executeToolCall",
           "summary": "Execute MCP tool",
           "parameters": [
             {
               "name": "Authorization",
               "in": "header",
               "required": true,
               "schema": {"type": "string", "default": "Bearer pat_"}
             }
           ],
           "requestBody": {
             "required": true,
             "content": {
               "application/json": {
                 "schema": {
                   "$ref": "#/components/schemas/MCPRequest"
                 }
               }
             }
           },
           "responses": {
             "200": {
               "description": "Tool execution response",
               "content": {
                 "application/json": {
                   "schema": {
                     "$ref": "#/components/schemas/MCPResponse"
                   }
                 }
               }
             }
           }
         },
         "get": {
           "operationId": "streamToolResults",
           "summary": "Stream tool results via SSE",
           "parameters": [
             {
               "name": "Authorization",
               "in": "header",
               "required": true,
               "schema": {"type": "string"}
             },
             {
               "name": "Mcp-Session-Id",
               "in": "header",
               "required": true,
               "schema": {"type": "string"}
             }
           ],
           "responses": {
             "200": {
               "description": "SSE stream of results"
             }
           }
         }
       }
     },
     "components": {
       "schemas": {
         "MCPRequest": {
           "type": "object",
           "properties": {
             "jsonrpc": {"type": "string", "enum": ["2.0"]},
             "id": {"type": "integer"},
             "method": {"type": "string"},
             "params": {"type": "object"}
           },
           "required": ["jsonrpc", "id", "method"]
         },
         "MCPResponse": {
           "type": "object",
           "properties": {
             "jsonrpc": {"type": "string", "enum": ["2.0"]},
             "id": {"type": "integer"},
             "result": {"type": "object"},
             "error": {"type": "object"}
           }
         }
       }
    }
   }
   ```

3. **Add Authentication**
   - Under "Authentication", select "API Key"
   - Set Key Name: `Authorization`
   - Set Value: `Bearer pat_your_coda_token`

4. **Enable the Custom GPT**
   - Add action to your custom GPT
   - Save and publish

5. **Test in ChatGPT**
   - Open your custom GPT
   - Ask: "What documents do I have in Coda?"
   - The action will execute `coda_list_documents` tool

### ChatGPT Connector Troubleshooting

| Issue | Solution |
|-------|----------|
| "Action failed to execute" | Check Authorization header is set correctly |
| "No response from server" | Verify `curl https://coda.bestviable.com/health` works |
| "Invalid JSON format" | Check request body matches MCPRequest schema |
| "Timeout waiting for results" | Ensure SSE GET stream is open (`/mcp` GET endpoint) |

---

## 4. Architecture Overview

### HTTP Flow Diagram

```
┌─────────────┐
│   Client    │  (Claude, ChatGPT, or CLI)
└──────┬──────┘
       │
       │ 1. POST /mcp (with Bearer token)
       │    {"method": "tools/list", ...}
       ▼
┌──────────────────────────┐
│  HTTP-Native MCP Server  │  (coda.bestviable.com:8080)
│   - Bearer auth check    │
│   - Session creation     │
│   - Tool dispatch        │
└──────┬───────────────────┘
       │
       │ 2. Return session ID + 200 OK (body empty or partial)
       │    (Transport prepares async execution)
       ▼
┌─────────────┐
│   Client    │  Must keep stream open!
└──────┬──────┘
       │
       │ 3. GET /mcp (with Mcp-Session-Id header)
       │    Accept: text/event-stream
       ▼
┌──────────────────────────┐
│  SSE Streaming Channel   │  (open connection, receives events)
│   - Tool results         │
│   - Notifications        │
│   - Keep-alive pings     │
└──────────────────────────┘
```

### Key HTTP Headers

| Header | Direction | Example |
|--------|-----------|---------|
| `Authorization` | Request | `Bearer pat_3e4ccc61-3ba5-4be5-a003-96f520ec65c9` |
| `Mcp-Session-Id` | Request | `0ad4b3c4-e1c4-4f59-84ba-cee20c3e2120` |
| `Mcp-Protocol-Version` | Request | `2025-03-26` |
| `Accept` | Request | `text/event-stream` (for GET /mcp) |
| `mcp-session-id` | Response | Session ID (from POST /mcp) |
| `Content-Type` | Response | `application/json` (POST), `text/event-stream` (GET) |

---

## 5. Available Tools

Once authenticated, clients can call these MCP tools:

### Core Tools (Always Available)
- `tools/list` - List available tools
- `resources/list` - List available resources
- `initialize` - Initialize session (called automatically by clients)

### Coda API Tools (Requires valid Coda token)
- `coda_list_documents` - List user's documents
- `coda_get_document` - Get document by ID
- `coda_list_tables` - List tables in a document
- `coda_get_table` - Get table by ID
- (40+ more tools available)

### Example Tool Call
```bash
curl -X POST http://localhost:8080/mcp \
  -H "Authorization: Bearer pat_xxx" \
  -H "Mcp-Session-Id: session-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {"limit": 10}
  }'
```

---

## 6. Testing & Validation

### Quick Validation Checklist

- [ ] Server health: `curl https://coda.bestviable.com/health`
- [ ] OAuth metadata: `curl https://coda.bestviable.com/.well-known/oauth-authorization-server`
- [ ] Bearer auth: `CODA_API_TOKEN=pat_xxx bash test-with-real-token.sh`
- [ ] Claude Desktop: Settings → Developer → MCP Servers → Add Coda
- [ ] ChatGPT action: Custom GPT with action pointing to `/mcp` endpoint

### Advanced Testing

Run the full test suite:
```bash
# Test against local server
CODA_API_TOKEN=pat_your_token STRICT=0 VERBOSE=true \
  bash test-with-real-token.sh http://localhost:8080

# Test against production
CODA_API_TOKEN=pat_your_token STRICT=0 VERBOSE=true \
  bash test-with-real-token.sh https://coda.bestviable.com
```

Expected output:
```
✓ Server reachable
✓ Health endpoint responds
✓ OAuth Authorization Server metadata
✓ OAuth Protected Resource metadata
✓ Token validation endpoint
✓ MCP endpoint rejects requests without Bearer token
✓ CORS headers on OPTIONS request
✓ Session initialized
✓ MCP endpoint with Bearer token
✓ JSON-RPC 2.0 response format
✓ Error handling for invalid method
[... more tests ...]
✓ All tests passed!
```

---

## 7. Troubleshooting by Client

### All Clients: Server Not Reachable
```bash
# Test connectivity
curl -v https://coda.bestviable.com/health

# If using local: check port forwarding
lsof -i :8080

# If using production: check DNS
nslookup coda.bestviable.com
```

### All Clients: Authentication Failed
```bash
# Verify token format
echo $CODA_API_TOKEN | head -c 10  # Should show "pat_"

# Test token directly with curl
curl -H "Authorization: Bearer $CODA_API_TOKEN" \
  https://coda.bestviable.com/mcp \
  -X POST -d '...'
```

### Claude Desktop: Server Won't Connect
1. Check token has `pat_` prefix
2. Restart Claude Desktop completely
3. Clear browser cache
4. Try with http://localhost:8080 first for local testing

### ChatGPT: Action Not Triggering
1. Verify custom GPT is saved with action
2. Test action directly: POST https://coda.bestviable.com/mcp
3. Check Authorization header in GPT action configuration
4. SSE stream must be open in background (GPT handles this)

### CLI: Commands Time Out
**This is expected!** The POST returns immediately but the actual tool results come via SSE.

Solution:
1. Send POST request (captures session ID)
2. Open GET stream with same session ID in another terminal
3. Watch stream for `data: {...}` events
4. Parse JSON from event stream for tool results

---

## 8. Production Deployment

### Server Status
- **URL**: https://coda.bestviable.com
- **Protocol**: HTTPS (via Cloudflare)
- **Load Balancing**: Nginx reverse proxy
- **Health Check**: Every 30 seconds via container health check

### Monitoring
Check logs:
```bash
ssh tools-droplet-agents "docker logs -f coda-mcp"
```

Expected log patterns:
```
[HTTP] POST /mcp auth=yes
[MCP] Incoming request: initialize
[MCP] Session created: {uuid}
[HTTP] GET /mcp auth=yes
[SSE] Client connected: {uuid}
[SSE] Sending tool result: {uuid}
```

### Failover
If server goes down:
```bash
# On droplet
ssh tools-droplet-agents

# Check container
docker ps | grep coda-mcp

# Restart if needed
docker restart coda-mcp

# Verify
curl https://coda.bestviable.com/health
```

---

## 9. FAQ

**Q: Do I need an actual MCP client installed?**
A: No. Claude and ChatGPT handle the protocol themselves. For CLI, you just need curl.

**Q: What format is the Coda API token?**
A: Format: `pat_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. Get it from https://coda.io/account/settings.

**Q: Can I use the same session across multiple tool calls?**
A: Yes! Use the `Mcp-Session-Id` header to reuse sessions. Session timeout is 5 minutes of inactivity.

**Q: What if my tool call returns too much data?**
A: The server estimates token consumption and may truncate responses. Check logs for truncation warnings.

**Q: Is the server production-ready?**
A: Yes! It's deployed on the droplet and behind Cloudflare. All endpoints are tested and working.

---

## 10. Next Steps

1. **For CLI Users**: Start with `test-with-real-token.sh` to validate setup
2. **For Claude Desktop**: Add server in Settings → Developer → MCP Servers
3. **For ChatGPT**: Create custom action pointing to `/mcp` endpoint
4. **For Integrations**: Use the HTTP-native endpoint in your own applications

---

**Last Updated**: November 2, 2025
**Server Version**: 1.0.0
**MCP Protocol Version**: 2025-03-26

For issues or questions, check the logs or review DEPLOYMENT_STATUS.md for architecture details.
