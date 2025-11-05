# Coda MCP - Quick Start Guide
**Last Updated**: November 2, 2025 | **Status**: ✅ Production Ready

Get started with Coda MCP in 3 steps. Choose your client type below.

---

## 🚀 Choose Your Client

### 1️⃣ **CLI (curl / Terminal)**
Best for: Developers, scripting, automation

```bash
# Get your Coda token from https://coda.io/account/settings
export CODA_API_TOKEN="pat_xxxxx"

# Test the script
bash test-with-sse-stream.sh https://coda.bestviable.com

# Or run locally
bash test-with-sse-stream.sh http://localhost:8080
```

**See**: `CLIENT_SETUP_GUIDE.md` Section 1 for full workflow

---

### 2️⃣ **Claude Desktop**
Best for: Conversational AI, creative work

```
1. Install Claude: https://claude.ai/download
2. Open Settings → Developer → MCP Servers
3. Add new server:
   - Name: Coda MCP
   - URL: https://coda.bestviable.com
   - Auth: Bearer Token
   - Token: pat_xxxxx
4. Click "Connect"
5. Ask Claude: "List my Coda documents"
```

**See**: `CLIENT_SETUP_GUIDE.md` Section 2 for detailed setup & troubleshooting

---

### 3️⃣ **ChatGPT (Web Connector)**
Best for: Broad knowledge integration, creative workflows

```
1. Go to ChatGPT Builder
2. Create new GPT: "Coda Assistant"
3. Add Action using OpenAPI spec (see CLIENT_SETUP_GUIDE.md Section 3)
4. Configure authentication:
   - Type: API Key
   - Header: Authorization
   - Value: Bearer pat_xxxxx
5. Save and test
```

**See**: `CLIENT_SETUP_GUIDE.md` Section 3 for full schema

---

## ⚡ Quick Test

### Check Server is Running
```bash
curl https://coda.bestviable.com/health
# Should return: {"status":"ok","service":"coda-mcp","version":"1.0.0",...}
```

### For Power Users (Manual Curl)
```bash
TOKEN="pat_your_token"
SERVER="https://coda.bestviable.com"

# 1. Initialize session (capture mcp-session-id from headers)
curl -s -D /tmp/h.txt -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"client":{"name":"test","version":"1.0"}}}'

SESSION=$(grep -i 'mcp-session-id' /tmp/h.txt | awk '{print $2}' | tr -d '\r')

# 2. Open SSE stream (in background)
curl -s -N -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION" \
  -H "Accept: text/event-stream" \
  "$SERVER/mcp" &
STREAM_PID=$!
sleep 0.5

# 3. Send tool request
curl -s -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Mcp-Session-Id: $SESSION" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"coda_list_documents","params":{"limit":5}}'

# 4. Watch stream output (or check in another terminal)
# kill $STREAM_PID when done
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **CLIENT_SETUP_GUIDE.md** | Complete setup for CLI, Claude, ChatGPT |
| **CLIENT_INTEGRATION_PLAN.md** | 3-week rollout strategy & validation |
| **test-with-sse-stream.sh** | Automated CLI testing with SSE |
| **DEPLOYMENT_STATUS.md** | Server status & architecture |
| **CLAUDE.md** | Code conventions & architecture |

---

## 🔑 Important Details

### Authentication
- **Format**: Coda API token (`pat_xxxxx`)
- **Get it**: https://coda.io/account/settings
- **Header**: `Authorization: Bearer pat_xxxxx`

### The SSE Pattern
Unlike REST APIs, tool results come via streaming:
1. **POST** to `/mcp` → Get session ID
2. **GET** `/mcp` SSE stream → Stay open to receive results
3. Both requests use same `Mcp-Session-Id` header

This is automatic in Claude/ChatGPT but requires manual handling in CLI.

### Server URL
- **Production**: `https://coda.bestviable.com`
- **Local Testing**: `http://localhost:8080`

---

## ✅ What Works Now

- ✅ **Health Endpoint**: `GET /health`
- ✅ **Bearer Token Auth**: `Authorization: Bearer pat_xxx`
- ✅ **Session Management**: `Mcp-Session-Id` header
- ✅ **Tool Listing**: `tools/list`
- ✅ **Coda API Tools**: 40+ tools (documents, tables, rows, etc.)
- ✅ **Error Handling**: Proper JSON-RPC error responses
- ✅ **SSE Streaming**: Real-time tool result delivery

---

## 🐛 Troubleshooting

### Server Won't Respond
```bash
# Check health
curl -L https://coda.bestviable.com/health

# Check DNS (if using custom domain)
nslookup coda.bestviable.com

# Check token format
echo $CODA_API_TOKEN | head -c 10  # Should show "pat_"
```

### Claude Desktop Won't Connect
1. Verify token starts with `pat_`
2. Restart Claude completely (not just refresh)
3. Try local URL first: `http://localhost:8080`
4. Check firewall / VPN isn't blocking

### ChatGPT Action Returns Error
1. Validate OpenAPI schema in ChatGPT action editor
2. Test endpoint directly: `curl -H "Authorization: Bearer pat_xxx" ...`
3. Check Authorization header is in correct format
4. Ensure token is valid (test with CLI first)

### CLI Timeout Issues
- **Symptom**: `curl` command hangs or returns empty
- **Cause**: SSE stream not opened (required for results)
- **Fix**: Always open GET stream before sending tool requests

---

## 📋 Before You Start

1. ✅ Have a Coda account (free at coda.io)
2. ✅ Generate API token from account settings
3. ✅ Choose your client (Claude / ChatGPT / CLI)
4. ✅ Have internet access to https://coda.bestviable.com
5. ✅ Read section 1-3 of CLIENT_SETUP_GUIDE.md

---

## 🎯 Next Steps

### Just Testing?
→ Run `bash test-with-sse-stream.sh` with your token

### Using Claude Desktop?
→ Follow Section 2 of CLIENT_SETUP_GUIDE.md

### Building a ChatGPT Action?
→ Follow Section 3 of CLIENT_SETUP_GUIDE.md

### Want to Run Locally?
→ Clone repo, `npm install`, `npm run dev`
→ Then use `http://localhost:8080` as server URL

---

## 💬 Support

**Issue**: Check CLIENT_SETUP_GUIDE.md Section 7 (Troubleshooting)
**Questions**: Review DEPLOYMENT_STATUS.md for architecture overview
**Feature Request**: Create issue with details and use case

---

**Server Status**: 🟢 Production Ready
**Last Test**: November 2, 2025
**Server URL**: https://coda.bestviable.com
**API Token**: Get from https://coda.io/account/settings

**Happy coding! 🚀**
