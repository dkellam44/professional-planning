# ChatGPT Custom Connector Flow - Complete Guide

**Status**: Flow documented and ready for Plus plan support (coming soon)
**Compatibility**: Currently requires Business/Enterprise/Edu plan (full MCP)
**Future**: ChatGPT Plus custom connectors rolling out soon

---

## Quick Summary: What ChatGPT Connectors Do

ChatGPT custom connectors allow you to connect ChatGPT directly to the Coda MCP server via an **OpenAPI schema**. This enables ChatGPT to:

- List your Coda documents
- Access document details
- Read tables and rows
- Execute any available MCP tool
- Stream results back in conversations

**Key Difference from Claude Desktop**: ChatGPT uses OpenAPI schema instead of direct MCP protocol, but the backend server is the same.

---

## How It Works: The Complete Flow

### Step 1: User Creates Custom Action in ChatGPT

```
User goes to: https://chatgpt.com/gpts/editor
             ↓
Click "Create new action"
             ↓
Paste OpenAPI schema (see below)
             ↓
Configure Authentication with Coda token
```

### Step 2: ChatGPT Converts OpenAPI to Internal Protocol

```
OpenAPI Schema
    ↓
ChatGPT Parses Schema
    ↓
Understands endpoints:
  - POST /mcp (execute commands)
  - GET /mcp (stream results via SSE)
    ↓
Stores authentication (Bearer token)
```

### Step 3: User Asks ChatGPT a Question

```
User: "What documents do I have in Coda?"
    ↓
ChatGPT Decides: "I need to call coda_list_documents tool"
    ↓
ChatGPT Constructs JSON-RPC request:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "coda_list_documents",
  "params": {"limit": 10}
}
```

### Step 4: ChatGPT Sends to Coda MCP Server

```
POST https://coda.bestviable.com/mcp
Headers:
  - Authorization: Bearer pat_xxx
  - Mcp-Session-Id: {auto-generated}
  - Content-Type: application/json
  - Accept: application/json, text/event-stream

Body: { JSON-RPC request from Step 3 }
    ↓
Server Creates Session
    ↓
Returns: HTTP 200 OK (with mcp-session-id header)
```

### Step 5: ChatGPT Opens SSE Stream

```
GET https://coda.bestviable.com/mcp
Headers:
  - Authorization: Bearer pat_xxx
  - Mcp-Session-Id: {same as Step 4}
  - Accept: text/event-stream
    ↓
Server Starts Streaming:
  :keep-alive
  data: {"jsonrpc":"2.0","result":{...documents...}}
    ↓
ChatGPT Receives Event
    ↓
Extracts Result: [Document1, Document2, ...]
```

### Step 6: ChatGPT Displays Results

```
ChatGPT Parses response
    ↓
Formats for conversation:
"You have 5 documents in Coda:
  1. Project Plan (updated 2 hours ago)
  2. Team Handbook (updated yesterday)
  ..."
    ↓
User Sees Natural Language Response
```

---

## The OpenAPI Schema (What Powers It)

The OpenAPI schema tells ChatGPT **how to talk to your server**. It's like a contract that defines:

1. **What endpoints exist** (POST /mcp, GET /mcp)
2. **What parameters they accept** (JSON-RPC request structure)
3. **What authentication is needed** (Bearer token)
4. **What responses look like** (JSON-RPC responses)

### Core Schema Structure

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Coda MCP API",
    "version": "1.0.0"
  },
  "servers": [
    {"url": "https://coda.bestviable.com"}
  ],
  "paths": {
    "/mcp": {
      "post": {
        "operationId": "executeToolCall",
        "summary": "Send MCP tool request",
        "parameters": [...],
        "requestBody": {...},
        "responses": {...}
      },
      "get": {
        "operationId": "streamToolResults",
        "summary": "Stream results via SSE",
        "parameters": [...],
        "responses": {...}
      }
    }
  }
}
```

### Why Two Endpoints?

**POST /mcp** = Request channel
- ChatGPT sends: JSON-RPC request (what tool to call)
- Server returns: Session ID (synchronous response)
- Purpose: Initialize command execution

**GET /mcp** = Response channel
- Server sends: Tool results via SSE stream (asynchronous)
- ChatGPT receives: Real-time events as they arrive
- Purpose: Receive results from long-running operations

---

## Request/Response Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ChatGPT                                  │
│                    (User Interface)                             │
└────────────────┬──────────────────────────┬─────────────────────┘
                 │                          │
        Step 3: User asks           Step 6: Display results
        "List my documents"         "You have 5 docs..."
                 │                          △
                 │                          │
                 ▼                          │
    ┌────────────────────────────┐         │
    │  ChatGPT Decides:          │         │
    │  Need coda_list_documents  │         │
    │  Build JSON-RPC request    │         │
    └────────┬───────────────────┘         │
             │                              │
             │ Step 4: POST /mcp            │
             │ (+ Bearer token)             │
             ▼                              │
    ┌────────────────────────────┐         │
    │  Coda MCP Server           │         │
    │  (coda.bestviable.com:8080)│         │
    │                            │         │
    │  POST /mcp:                │         │
    │  ├─ Receive request        │         │
    │  ├─ Validate Bearer token  │         │
    │  ├─ Create session         │         │
    │  └─ Return 200 OK          │         │
    │     (with session ID)      │         │
    └──────┬─────────────────────┘         │
           │                               │
           │ ┌──────────────────────────┐  │
           │ │ Step 5: GET /mcp (SSE)   │  │
           │ │ Server streams results   │  │
           │ │ via Server-Sent Events   │  │
           │ └──────────────────────────┘  │
           │                               │
           │ :keep-alive                   │
           │ data: {...tool results...}    │
           │                               │
           └───────────────────────────────┘
```

---

## Different Ways to Interact

### Current: ChatGPT + OpenAPI Schema (Requires Business Plan)

```
User → ChatGPT → OpenAPI Schema → POST /mcp → Coda Server
                                    ↓
                              GET /mcp (SSE) ← Results flow back
```

**Advantage**: Uses standard OpenAPI, works with any client that supports OpenAPI
**Limitation**: Requires ChatGPT Business plan (custom actions for Pro coming soon)

### Current: Claude Desktop + Direct MCP (Works with Coda MCP)

```
User → Claude → Native MCP Protocol → POST /mcp → Coda Server
                                         ↓
                                   GET /mcp (SSE) ← Results
```

**Advantage**: Native MCP support, works on Plus plan too
**Limitation**: Only Claude Desktop (not web-based)

### Current: CLI + curl (Works with Everyone)

```
User → Terminal → Manual curl requests → POST /mcp → Coda Server
                                            ↓
                                      GET /mcp (SSE) ← Results
```

**Advantage**: Works anywhere, full control
**Limitation**: Manual stream management, no GUI

---

## When ChatGPT Plus Custom Connectors Launch

Once OpenAI rolls out custom connectors for Plus plan, the setup becomes:

```
Step 1: Same as now (create action with OpenAPI schema)
Step 2: Same as now (configure Bearer token)
Step 3: Assign to custom GPT
Step 4: Share with Plus users (no Business plan needed!)
```

**Timeline**: Currently rolling out to selected users, full availability expected by end of 2025.

---

## Step-by-Step: Setting Up ChatGPT Connector (Today)

### Prerequisites

- ChatGPT account with **Business plan** (or wait for Plus plan support)
- Coda API token (from https://coda.io/account/settings)
- Access to create custom actions

### Setup Instructions

**Step 1: Go to Custom Action Editor**

```
1. Open https://chatgpt.com/gpts/editor
2. Create new GPT or edit existing
3. Click "Create new action" button
```

**Step 2: Paste OpenAPI Schema**

The full schema below tells ChatGPT everything it needs to know:

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Coda MCP API",
    "version": "1.0.0",
    "description": "Access Coda documents, tables, and rows via MCP protocol"
  },
  "servers": [
    {
      "url": "https://coda.bestviable.com",
      "description": "Coda MCP Production Server"
    }
  ],
  "paths": {
    "/mcp": {
      "post": {
        "operationId": "executeToolCall",
        "summary": "Execute MCP tool call",
        "description": "Send a tool execution request to the MCP server",
        "parameters": [
          {
            "name": "Authorization",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Bearer token for Coda API"
            }
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
            "description": "Tool execution request accepted",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MCPResponse"
                }
              }
            }
          },
          "401": {
            "description": "Unauthorized - invalid token"
          }
        }
      },
      "get": {
        "operationId": "streamToolResults",
        "summary": "Stream tool results via SSE",
        "description": "Receive tool execution results as Server-Sent Events",
        "parameters": [
          {
            "name": "Authorization",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "Mcp-Session-Id",
            "in": "header",
            "required": true,
            "schema": {
              "type": "string",
              "description": "Session ID from POST request"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Server-Sent Event stream",
            "content": {
              "text/event-stream": {
                "schema": {
                  "type": "object",
                  "description": "Stream of JSON-RPC responses"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "MCPRequest": {
        "type": "object",
        "description": "JSON-RPC 2.0 request for MCP tool",
        "properties": {
          "jsonrpc": {
            "type": "string",
            "enum": ["2.0"],
            "description": "JSON-RPC version"
          },
          "id": {
            "type": "integer",
            "description": "Request ID for correlation"
          },
          "method": {
            "type": "string",
            "description": "Tool name to execute (e.g., coda_list_documents)"
          },
          "params": {
            "type": "object",
            "description": "Tool parameters"
          }
        },
        "required": ["jsonrpc", "id", "method"]
      },
      "MCPResponse": {
        "type": "object",
        "description": "JSON-RPC 2.0 response from MCP tool",
        "properties": {
          "jsonrpc": {
            "type": "string",
            "enum": ["2.0"]
          },
          "id": {
            "type": "integer"
          },
          "result": {
            "type": "object",
            "description": "Tool execution result"
          },
          "error": {
            "type": "object",
            "description": "Error details if failed",
            "properties": {
              "code": {
                "type": "integer"
              },
              "message": {
                "type": "string"
              }
            }
          }
        }
      }
    }
  }
}
```

**Step 3: Configure Authentication**

```
In the Action Editor:

1. Click "Authentication" dropdown
2. Select "API Key"
3. Set:
   - Key Name: "Authorization"
   - Header: "Authorization"
   - Value: "Bearer pat_your_coda_token_here"

4. Replace "pat_your_coda_token_here" with your actual Coda API token
   (Get from https://coda.io/account/settings)
```

**Step 4: Add to Custom GPT**

```
1. In GPT Editor, scroll to "Actions"
2. Click "Add action"
3. Select the action you just created
4. Configure any additional instructions for your GPT
5. Save and publish
```

**Step 5: Test in ChatGPT**

```
1. Start a conversation with your custom GPT
2. Ask: "What documents do I have in Coda?"
3. ChatGPT will:
   - Call coda_list_documents
   - Receive results via SSE stream
   - Display them naturally

Example response:
"You have 5 documents in Coda:
1. Project Plan (68 pages)
2. Team Handbook (12 pages)
3. Q4 Goals (5 pages)
4. Expenses (3 pages)
5. Meeting Notes (24 pages)"
```

---

## Available Tools via Custom Connector

Once configured, ChatGPT can call any MCP tool. Common ones:

| Tool | What It Does |
|------|-------------|
| `coda_list_documents` | List all user's Coda documents |
| `coda_get_document` | Get specific document by ID |
| `coda_list_tables` | List tables in a document |
| `coda_get_table` | Get specific table with rows |
| `coda_list_rows` | List rows in a table with filtering |
| `coda_get_row` | Get specific row details |
| `coda_update_row` | Modify row values |
| `coda_create_rows` | Add new rows to table |
| (40+ more tools) | Full Coda API coverage |

---

## Troubleshooting ChatGPT Custom Connectors

### Issue: "Action failed to execute"

**Cause**: Authentication not working
**Solution**:
1. Verify Bearer token starts with `pat_`
2. Check token not expired (regenerate if needed)
3. Verify token format in auth config: `Bearer pat_xxx`

### Issue: "No response from server"

**Cause**: Server unreachable or offline
**Solution**:
1. Test manually: `curl https://coda.bestviable.com/health`
2. Verify domain resolves: `nslookup coda.bestviable.com`
3. Check if server is healthy: Should return `{"status":"ok",...}`

### Issue: "Timeout waiting for results"

**Cause**: SSE stream not working or timing out
**Solution**:
1. Check `/mcp` GET endpoint is accessible
2. Verify `Mcp-Session-Id` header being sent correctly
3. Wait longer (first request may take 5+ seconds for Coda API)

### Issue: "Invalid JSON format"

**Cause**: Request body doesn't match schema
**Solution**:
1. Review OpenAPI schema - ensure it's copied correctly
2. Check that `MCPRequest` schema has all required fields
3. Verify `jsonrpc: "2.0"` (string, not number)

---

## Differences: ChatGPT vs Claude Desktop

### ChatGPT Custom Connector (OpenAPI-based)

```
✅ Works with ChatGPT conversations
✅ Web-based (no app installation)
✅ Share with others via custom GPT
✅ Can be trained with system prompts

❌ Requires Business plan (for now)
❌ OpenAPI spec required
❌ Manual action creation
❌ Limited control over protocol details
```

### Claude Desktop (Direct MCP)

```
✅ Works on Plus plan
✅ Native MCP protocol
✅ Auto-discovery of tools
✅ Better streaming support
✅ Full protocol control

❌ Desktop application only
❌ Can't share easily (copy settings)
❌ No web-based access
❌ Per-device setup
```

### CLI (Manual curl)

```
✅ Works anywhere (terminal)
✅ Maximum control
✅ Scriptable
✅ No plan limitations

❌ Manual stream management
❌ No GUI
❌ Complex setup
❌ Requires curl knowledge
```

---

## Why SSE (Server-Sent Events)?

The OpenAPI schema specifies two separate endpoints because HTTP has a limitation:

**Standard REST**: 1 request = 1 response (synchronous)
```
Request → Server → Response (immediate)
```

**MCP Pattern**: Request triggers async execution (results come later)
```
Request → Server → "OK, I'm working on it"
                    (results stream back separately)
```

**SSE Solution**:
- POST /mcp = Async request submission
- GET /mcp = Receive results as they arrive (streaming)

This enables ChatGPT to:
1. Send request without waiting
2. Keep stream open for results
3. Process results in real-time
4. Show streaming responses to user

---

## Security Considerations

### Bearer Token Handling

- **In ChatGPT**: Stored encrypted in action configuration
- **In Transit**: HTTPS only (coda.bestviable.com)
- **In Logs**: Token never logged (only `pat_...` shown)
- **Expiration**: Can be revoked anytime from Coda settings

### Session Management

- **Duration**: Sessions expire after 5 minutes of inactivity
- **Isolation**: Each session is independent
- **Cleanup**: Automatic on disconnect

### Data Privacy

- **Server**: No data stored on our MCP server
- **Coda**: All data stays in Coda.io
- **ChatGPT**: Follows OpenAI's standard data policies

---

## Future: When Plus Plan Support Arrives

```
Current (Business plan):
1. Create custom action
2. Add to custom GPT
3. Share with Business plan users

Future (Plus plan - coming soon):
1. Same as above
2. Plus users can now use the connector
3. No Business plan needed

Note: You can already prepare by:
- Testing with Business plan
- Creating the OpenAPI schema
- Being ready to enable for Plus when available
```

---

## Quick Reference: Setup Checklist

- [ ] Have ChatGPT Business plan
- [ ] Have Coda API token (pat_xxx format)
- [ ] Go to https://chatgpt.com/gpts/editor
- [ ] Create new action
- [ ] Paste OpenAPI schema (provided above)
- [ ] Configure Bearer authentication
- [ ] Test: "What documents do I have in Coda?"
- [ ] Verify results display correctly
- [ ] Publish custom GPT
- [ ] Share with team or users

---

## Summary

The ChatGPT custom connector flow allows seamless integration between ChatGPT and the Coda MCP server by:

1. **Using OpenAPI schema** to define the API contract
2. **Implementing two-channel communication** (POST for requests, GET for results)
3. **Leveraging SSE streaming** for async result delivery
4. **Supporting Bearer token auth** for secure access
5. **Enabling natural language** interaction with Coda data

When Plus plan support launches, this same flow will be available to all ChatGPT Plus users without needing a Business plan.

---

**Current Status**: Ready for Business plan users
**Future Status**: Coming to Plus plan users (early 2025)
**Server Support**: ✅ Full support implemented
**Documentation**: ✅ Complete

