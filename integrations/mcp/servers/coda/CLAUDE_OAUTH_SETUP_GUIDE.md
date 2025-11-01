# Claude MCP OAuth Setup - Quick Reference

**Date**: 2025-11-01
**For**: Connecting Coda MCP to Claude with OAuth credentials
**Status**: Ready to configure

---

## Quick Answer

**Q: Are OAuth Client ID and Client Secret available for Coda MCP?**

**A**: Not yet preconfigured, but the server supports OAuth 2.0 with Dynamic Client Registration (DCR).

**Q: Is the MCP server URL still https://coda.bestviable.com for Claude?**

**A**: ✅ Yes, exactly: `https://coda.bestviable.com`

---

## Two Connection Options for Claude

### Option 1: Bearer Token (Simplest) ✅ RECOMMENDED

**No OAuth credentials needed.** Use a Coda API token directly.

1. Get your Coda API token:
   - Visit: https://coda.io/account/settings
   - Create an API token (starts with `pat_`)
   - Copy the token

2. In Claude settings:
   ```
   Server URL: https://coda.bestviable.com
   Authentication: Bearer Token
   Token: pat_your-token-here
   ```

**Advantages**:
- ✅ Simple setup
- ✅ No registration needed
- ✅ Works immediately
- ✅ Full access with single token

---

### Option 2: OAuth Dynamic Client Registration (More Secure) ⭐

**For enterprise/production use.** Client credentials are automatically issued by the server.

1. In Claude settings:
   ```
   Server URL: https://coda.bestviable.com
   Authentication: OAuth 2.0
   (Leave Client ID and Client Secret blank initially)
   ```

2. First connection triggers Dynamic Client Registration (DCR):
   - Claude registers with the MCP server
   - Server issues unique `client_id` and `client_secret`
   - Credentials are stored securely
   - Future connections use these credentials

**Advantages**:
- ✅ More secure (unique per client)
- ✅ Token expiration support
- ✅ Token refresh capability
- ✅ Follows OAuth 2.0 best practices
- ✅ Automatic credential rotation possible

**How it Works**:
```
Claude.ai                          Coda MCP Server
   │                                    │
   ├──────── Register ─────────→        │
   │      (first connection)            │
   │                              Generate:
   │                              - client_id
   │                              - client_secret
   │                              - expires_in (30 days)
   │                                    │
   │       ←──── Credentials ──────     │
   │                                    │
   ├──────── Authenticate ─────→        │
   │  (using new credentials)           │
   │                                    │
   │       ←──── Access Token ──────    │
   │                                    │
   └──────── Use MCP Tools ───→         │
              (with token)
```

---

## Current Server Configuration

**Server URL**: `https://coda.bestviable.com`

**Supported Endpoints**:
- `POST /mcp` — Main MCP protocol (JSON-RPC over HTTP)
- `GET /mcp` — Server-Sent Events (SSE) for streaming
- `DELETE /mcp` — Session termination

**Authentication Methods**:
- ✅ Bearer Token (Coda API token)
- ✅ OAuth 2.0 with Dynamic Client Registration
- ✅ Cloudflare Access JWT (for tunnel)

**OAuth Compliance**:
- ✅ RFC 8414 (OAuth 2.0 Metadata)
- ✅ 3/26 spec (OAuth auth)
- ✅ 6/18 spec (OAuth auth + DCR)

---

## Setup Steps for Claude

### Using Bearer Token (Quick):

1. Visit https://coda.io/account/settings
2. Create or copy existing API token
3. In Claude settings → Add new MCP connector
4. Fill in:
   - **Name**: Coda
   - **Server URL**: `https://coda.bestviable.com`
   - **Authentication Type**: Bearer Token
   - **Token**: `pat_your-token-here`
5. Click "Connect"
6. ✅ Done! Tools should appear immediately

### Using OAuth DCR (Secure):

1. In Claude settings → Add new MCP connector
2. Fill in:
   - **Name**: Coda
   - **Server URL**: `https://coda.bestviable.com`
   - **Authentication Type**: OAuth 2.0
   - **Client ID**: (leave blank)
   - **Client Secret**: (leave blank)
3. Click "Connect"
4. Claude will register automatically and obtain credentials
5. ✅ Done! Future connections use secured credentials

---

## What Happens When You Connect

### Bearer Token Path:
```
1. You provide: Bearer token
2. Claude sends: POST /mcp with Authorization: Bearer pat_...
3. Server validates: Token format and Coda API access
4. Result: ✅ Tools available immediately
```

### OAuth DCR Path:
```
1. Claude discovers: OAuth endpoints via /.well-known/
2. Claude registers: POST /oauth/register with client info
3. Server issues: Unique client_id + client_secret
4. Claude stores: Credentials securely
5. Claude authenticates: Uses credentials for future requests
6. Result: ✅ Tools available with rotatable credentials
```

---

## Available Tools (40+)

Once connected, you have access to all Coda API tools:

**Document Operations**:
- `coda_list_documents` — List or search documents
- `coda_create_document` — Create new document
- `coda_get_document` — Get document details
- `coda_update_document` — Update document
- `coda_delete_document` — Delete document (advanced)

**Page Operations**:
- `coda_list_pages` — List pages in document
- `coda_create_page` — Create new page
- `coda_get_page_content` — Get page markdown
- `coda_update_page_content` — Update page
- `coda_delete_page` — Delete page

**Table Operations**:
- `coda_list_tables` — List tables in document
- `coda_get_table` — Get table details
- `coda_list_rows` — List/query rows
- `coda_create_rows` — Create rows
- `coda_update_row` — Update single row
- `coda_delete_rows` — Delete rows
- Plus: columns, formulas, controls, etc.

**40+ tools total** covering:
- Documents & Pages
- Tables & Views
- Columns & Data Types
- Rows & Records
- Formulas & Calculations
- Controls & Automation
- Resources & Metadata

---

## Security Notes

### Bearer Token:
- ✅ Simple setup
- ⚠️ Single token has full access
- ⚠️ If compromised, attacker gets full Coda access
- ✅ Can revoke token anytime in Coda settings

### OAuth DCR:
- ✅ Automatic credential management
- ✅ Unique credentials per client
- ✅ Token expiration (30 days default)
- ✅ Supports token refresh
- ✅ Can revoke individual client access
- ✅ Audit trail of which clients accessed what

**Recommendation**: Use Bearer Token for personal use, OAuth DCR for team/enterprise.

---

## Troubleshooting

### "Connection Failed" Error

**Check**:
1. Server URL is correct: `https://coda.bestviable.com` (not `http://`)
2. Bearer token is valid (starts with `pat_`)
3. Coda API access is enabled on your token
4. Network connectivity (try pinging coda.bestviable.com)

### Token Invalid Error

**Fix**:
1. Get new token from https://coda.io/account/settings
2. Delete and recreate connection in Claude
3. Verify token hasn't been revoked

### Tools Not Appearing

**Check**:
1. Wait 30 seconds (Claude caches tool list)
2. Refresh Claude page (Cmd+R / Ctrl+R)
3. Verify connection is "Connected" (green status)
4. Check server logs for errors

### Credentials Expire

**OAuth Only**:
1. Server auto-refreshes tokens (transparent)
2. If manual refresh needed: Reconnect in Claude
3. Credentials valid for 30 days by default

---

## Server Endpoints for Reference

**Public Endpoints** (no auth):

```bash
GET /.well-known/oauth-authorization-server
GET /.well-known/oauth-protected-resource
GET /.well-known/protected-resource-metadata
GET /health
```

**Protected Endpoints** (require Bearer token or OAuth):

```bash
POST /mcp              # Send tool requests (JSON-RPC)
GET /mcp               # Receive responses (SSE)
DELETE /mcp            # Close session

POST /oauth/validate-token
```

---

## Files & Documentation

- **CLIENT_INTEGRATION_GUIDE.md** — Complete integration guide
- **CLAUDE.md** — Development conventions
- **QUICK_REFERENCE.md** — 1-minute overview
- **DEPLOYMENT_READY.md** — Readiness summary

---

## Next Steps

1. ✅ Choose authentication method (Bearer Token or OAuth)
2. ✅ Gather credentials:
   - Bearer: Get API token from Coda
   - OAuth: Leave fields blank (auto-register)
3. ✅ Add MCP connector in Claude settings
4. ✅ Fill in server URL: `https://coda.bestviable.com`
5. ✅ Test with a simple command (e.g., list documents)

---

## Summary

| Aspect | Bearer Token | OAuth DCR |
|--------|---|---|
| **Setup Time** | 2 minutes | 2 minutes (auto-register) |
| **Complexity** | Simple | Transparent |
| **Security** | Single token | Unique per client |
| **Token Rotation** | Manual | Automatic |
| **Best For** | Personal use | Enterprise/Team |
| **Recommendation** | ✅ Start here | ⭐ Long-term |

**Status**: Server ready to connect. Choose your method and go!

---

**Questions?** Check CLIENT_INTEGRATION_GUIDE.md for detailed examples.
**Issues?** Verify server is running: `curl https://coda.bestviable.com/health`

**Created**: 2025-11-01
**Updated**: 2025-11-01
