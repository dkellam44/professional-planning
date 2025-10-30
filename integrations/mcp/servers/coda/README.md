---
- entity: integration
- level: operational
- zone: internal
- version: v01
- tags: [mcp, coda, server, documentation, tools]
- source_path: /integrations/mcp/servers/coda/README.md
- date: 2025-10-30
---

# Coda MCP Server

**Status**: ✅ Production Deployed
**Endpoint**: https://coda.bestviable.com/sse
**Tools**: 34 across 8 categories
**Source**: dustingood fork (4x more tools than original)
**Tier**: 1 (Remote Transport)

---

## Overview

Coda MCP Server exposes the Coda API as an MCP-compatible tool set. It enables AI agents to:
- List, read, and search documents and pages
- Create, update, delete pages with full markdown support
- Query tables with filtering, pagination, and sorting
- List and manage table columns and rows
- Execute buttons and retrieve formulas
- Access workspace user information

**34 Tools** provide comprehensive Coda workspace management via HTTP/SSE transport.

---

## Available Tools

### Document Operations (5 tools)

| Tool | Purpose |
|------|---------|
| `coda_list_documents` | List all accessible documents with search/filter |
| `coda_get_document` | Retrieve document details and metadata |
| `coda_create_document` | Create new document from template |
| `coda_update_document` | Update document title, icon, properties |
| `coda_get_document_stats` | Get document statistics and insights |

### Page Operations (10 tools)

| Tool | Purpose |
|------|---------|
| `coda_list_pages` | List pages with pagination support |
| `coda_get_page_content` | Get page content as markdown |
| `coda_peek_page` | Preview first N lines of page |
| `coda_create_page` | Create new page with optional parent |
| `coda_replace_page_content` | Replace entire page content |
| `coda_append_page_content` | Add content to end of page |
| `coda_duplicate_page` | Copy page with new name |
| `coda_rename_page` | Rename page and subtitle |
| `coda_delete_page` | Delete page permanently |
| `coda_search_pages` | Full-text search within document |

### Table Operations (4 tools)

| Tool | Purpose |
|------|---------|
| `coda_list_tables` | List all tables and views |
| `coda_get_table` | Get table schema and metadata |
| `coda_get_table_summary` | Comprehensive summary (rows, columns, samples) |
| `coda_search_tables` | Search tables by name |

### Column Operations (2 tools)

| Tool | Purpose |
|------|---------|
| `coda_list_columns` | List columns with visibility filtering |
| `coda_get_column` | Get column details and type info |

### Row Operations (7 tools)

| Tool | Purpose |
|------|---------|
| `coda_list_rows` | List rows with filtering, pagination, sorting |
| `coda_get_row` | Get single row details |
| `coda_create_rows` | Create/update multiple rows (upsert) |
| `coda_update_row` | Update single row values |
| `coda_delete_row` | Delete single row |
| `coda_delete_rows` | Delete multiple rows |
| `coda_bulk_update_rows` | Batch update with different values per row |

### Formula Operations (2 tools)

| Tool | Purpose |
|------|---------|
| `coda_list_formulas` | List all named formulas |
| `coda_get_formula` | Get formula details and definition |

### Control Operations (3 tools)

| Tool | Purpose |
|------|---------|
| `coda_list_controls` | List buttons, sliders, and other controls |
| `coda_get_control` | Get control details |
| `coda_push_button` | Trigger button in table row |

### User Operations (1 tool)

| Tool | Purpose |
|------|---------|
| `coda_whoami` | Get authenticated user information |

---

## Quick Start

### Using via Claude Code/Desktop

The server is available at `https://coda.bestviable.com/sse`. If configured in your client:

```json
{
  "mcpServers": {
    "coda": {
      "command": "sse",
      "url": "https://coda.bestviable.com/sse",
      "env": {
        "CODA_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### Example: List Your Documents

Ask your AI agent:
> "What documents are in my Coda workspace?"

The agent uses `coda_list_documents` tool to query your workspace.

### Example: Read a Page

> "Show me the content of my 'Project Plans' page"

The agent uses `coda_get_page_content` to retrieve markdown.

### Example: Update Data

> "Add a new row to the 'Tasks' table with title 'Review PR' and status 'In Progress'"

The agent uses `coda_create_rows` to insert the data.

---

## Environment Variables

**Required**:
- `CODA_API_TOKEN`: Your Coda API token (get from https://coda.io/account/settings#api)

**Optional**:
- `LOG_LEVEL`: Logging verbosity (default: info)

---

## Limitations

Per Coda API restrictions:
- ❌ Cannot create new tables (API limitation)
- ❌ Cannot create new canvas elements
- ❌ Cannot modify table schemas

These are platform limitations, not MCP server limitations. All read, update, and delete operations work normally.

---

## Performance Notes

- **Page reads**: ~200-500ms depending on page size
- **Table queries**: ~100-300ms for typical tables (100-1000 rows)
- **Bulk operations**: Up to 500 rows per request
- **Rate limiting**: Coda API: 50 requests/second

For large operations (10,000+ rows), use pagination with `limit` and `offset` parameters.

---

## Troubleshooting

**Invalid API token error**:
```
Error: 401 Unauthorized - Invalid token
```
→ Check token at https://coda.io/account/settings#api

**Document not found**:
```
Error: 404 Not Found - Document does not exist
```
→ Verify document ID and that you have access rights

**Rate limit exceeded**:
```
Error: 429 Too Many Requests
```
→ Reduce request frequency or implement exponential backoff

**Page too large**:
```
Error: Content exceeds maximum size
```
→ Split large updates into smaller chunks

---

## Source & Maintenance

**Source Repository**: https://github.com/dustingood/coda-mcp
**Upstream Original**: https://github.com/orellazri/coda-mcp
**Local Path**: `/integrations/mcp/servers/coda/src/`
**License**: Check LICENSE file in source directory (typically MIT)

**Why dustingood fork**:
- 34 tools vs 8-10 in original
- Full CRUD operations on pages, rows, tables
- Comprehensive test coverage
- Active maintenance

---

## Related Documentation

- **Deployment**: DEPLOYMENT.md
- **Changelog**: CHANGELOG.md
- **Troubleshooting**: TROUBLESHOOTING.md
- **Architecture Decision**: /agents/decisions/2025-10-29_mcp-tier-architecture_v01.md
- **Server Catalog**: /docs/architecture/integrations/mcp/server_catalog_v01.md

---

**Last Updated**: 2025-10-30
**Status**: Deployed and operational
**Endpoint Health**: https://coda.bestviable.com/sse → HTTP 200 OK
