# Client Integration Guide - Coda MCP HTTP-Native Server

This guide explains how to connect different types of clients to the Coda MCP HTTP-Native Server.

**Server URL**: `https://coda.bestviable.com` (production)
**Server URL**: `http://localhost:8080` (local development)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Web Client Integration (Claude.ai)](#web-client-integration)
3. [CLI Client Integration](#cli-client-integration)
4. [JavaScript SDK Integration](#javascript-sdk-integration)
5. [Python Integration](#python-integration)
6. [Tool Reference](#tool-reference)

---

## Authentication

### Bearer Token

All `/mcp` endpoints require a Coda API Bearer token:

```bash
# Get your Coda API token from https://coda.io/account/settings
# Format: Authorization: Bearer <token>

curl -X POST https://coda.bestviable.com/mcp \
  -H "Authorization: Bearer pat_your-token-here" \
  -H "Mcp-Session-Id: session-id-here" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Session Management

Sessions persist across multiple requests:

```bash
# Create session (POST without Mcp-Session-Id)
SESSION_ID=$(uuidgen)  # Generate new UUID

# Use same SESSION_ID for subsequent requests
curl -X POST https://coda.bestviable.com/mcp \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Authorization: Bearer pat_token" \
  ...

# Cleanup when done
curl -X DELETE https://coda.bestviable.com/mcp \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Authorization: Bearer pat_token"
```

---

## Web Client Integration

### Claude.ai Integration

**Option 1: Using MCP Configuration**

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "coda": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "https://coda.bestviable.com/mcp",
        "-H", "Authorization: Bearer $CODA_API_TOKEN",
        "-H", "Content-Type: application/json"
      ],
      "env": {
        "CODA_API_TOKEN": "pat_your-token-here"
      }
    }
  }
}
```

**Option 2: Using HTTP Transport (Recommended)**

Claude.ai natively supports HTTP MCP transport:

1. Get your Coda API token from https://coda.io/account/settings
2. Configure in Claude.ai settings:
   ```json
   {
     "serverUrl": "https://coda.bestviable.com/mcp",
     "authToken": "pat_your-token-here"
   }
   ```

### Custom Web App Integration

```javascript
// JavaScript fetch example
async function callCodaMcp(method, params, token) {
  const sessionId = localStorage.getItem('mcp-session-id') || generateUUID();
  localStorage.setItem('mcp-session-id', sessionId);

  const response = await fetch('https://coda.bestviable.com/mcp', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Mcp-Session-Id': sessionId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: method,
      params: params
    })
  });

  return response.json();
}

// Usage
const docs = await callCodaMcp('coda_list_documents', {}, token);
console.log(docs);
```

---

## CLI Client Integration

### Using curl (Bash/Shell)

**Basic Request**:

```bash
#!/bin/bash

# Configuration
API_TOKEN="pat_your-token-here"
SERVER="https://coda.bestviable.com"
SESSION_ID=$(uuidgen)

# List documents
curl -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "coda_list_documents",
    "params": {}
  }' | jq .
```

**Bash CLI Wrapper**:

Save as `coda-mcp.sh`:

```bash
#!/bin/bash

# Coda MCP CLI Wrapper
# Usage: ./coda-mcp.sh <method> [params_json]

set -e

API_TOKEN="${CODA_API_TOKEN:?Error: CODA_API_TOKEN not set}"
SERVER="${CODA_MCP_SERVER:-https://coda.bestviable.com}"
METHOD="$1"
PARAMS="${2:-{}}"

# Generate session ID (optional, for testing)
SESSION_ID=${SESSION_ID:-$(uuidgen)}

if [ -z "$METHOD" ]; then
  echo "Usage: $0 <method> [params_json]"
  echo "Example: $0 coda_list_documents '{}'"
  echo "Example: $0 coda_get_document '{\"docId\": \"doc_123\"}'"
  exit 1
fi

# Make request
curl -s -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"$METHOD\",
    \"params\": $PARAMS
  }" | jq .

# Cleanup session
curl -s -X DELETE "$SERVER/mcp" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Mcp-Session-Id: $SESSION_ID" > /dev/null
```

**Usage**:

```bash
# Set token
export CODA_API_TOKEN="pat_your-token-here"

# List documents
./coda-mcp.sh coda_list_documents

# Get document
./coda-mcp.sh coda_get_document '{"docId":"doc_abc123"}'

# List pages
./coda-mcp.sh coda_list_pages '{"docId":"doc_abc123"}'

# Create page
./coda-mcp.sh coda_create_page '{
  "docId": "doc_abc123",
  "name": "New Page",
  "content": "Page content here"
}'
```

### Using zsh/fish

Fish shell example:

```fish
#!/usr/bin/env fish

function coda
  set -l method $argv[1]
  set -l params $argv[2]

  curl -s -X POST https://coda.bestviable.com/mcp \
    -H "Authorization: Bearer $CODA_API_TOKEN" \
    -H "Mcp-Session-Id" (uuidgen) \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": 1,
      \"method\": \"$method\",
      \"params\": $params
    }" | jq .
end

# Usage
coda coda_list_documents '{}'
```

---

## JavaScript SDK Integration

### Node.js Client

```bash
npm install axios
```

```javascript
// client.js
const axios = require('axios');

class CodaMcpClient {
  constructor(token, serverUrl = 'https://coda.bestviable.com') {
    this.token = token;
    this.serverUrl = serverUrl;
    this.sessionId = generateUUID();
  }

  async call(method, params = {}) {
    const response = await axios.post(`${this.serverUrl}/mcp`, {
      jsonrpc: '2.0',
      id: 1,
      method: method,
      params: params
    }, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Mcp-Session-Id': this.sessionId,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.error) {
      throw new Error(`MCP Error: ${response.data.error.message}`);
    }

    return response.data.result;
  }

  async listDocuments() {
    return this.call('coda_list_documents', {});
  }

  async getDocument(docId) {
    return this.call('coda_get_document', { docId });
  }

  async listPages(docId) {
    return this.call('coda_list_pages', { docId });
  }

  async listTables(docId) {
    return this.call('coda_list_tables', { docId });
  }

  async listRows(docId, tableIdOrName) {
    return this.call('coda_list_rows', { docId, tableIdOrName });
  }

  async cleanup() {
    try {
      await axios.delete(`${this.serverUrl}/mcp`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Mcp-Session-Id': this.sessionId
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup session:', error.message);
    }
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = CodaMcpClient;
```

**Usage**:

```javascript
const CodaMcpClient = require('./client');

(async () => {
  const client = new CodaMcpClient(process.env.CODA_API_TOKEN);

  try {
    // List documents
    const docs = await client.listDocuments();
    console.log('Documents:', docs);

    // Get specific document
    const doc = await client.getDocument('doc_abc123');
    console.log('Document:', doc);

    // List pages in document
    const pages = await client.listPages('doc_abc123');
    console.log('Pages:', pages);

  } finally {
    await client.cleanup();
  }
})();
```

### TypeScript Client

```typescript
// client.ts
import axios, { AxiosInstance } from 'axios';

interface McpRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params: Record<string, any>;
}

interface McpResponse<T = any> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
  };
}

export class CodaMcpClient {
  private http: AxiosInstance;
  private sessionId: string;

  constructor(
    private token: string,
    private serverUrl: string = 'https://coda.bestviable.com'
  ) {
    this.sessionId = this.generateUUID();
    this.http = axios.create({
      baseURL: serverUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Mcp-Session-Id': this.sessionId,
        'Content-Type': 'application/json'
      }
    });
  }

  async call<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    const request: McpRequest = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params: params || {}
    };

    const response = await this.http.post<McpResponse<T>>('/mcp', request);

    if (response.data.error) {
      throw new Error(`${response.data.error.code}: ${response.data.error.message}`);
    }

    return response.data.result!;
  }

  async listDocuments() {
    return this.call('coda_list_documents', {});
  }

  async getDocument(docId: string) {
    return this.call('coda_get_document', { docId });
  }

  async listPages(docId: string, limit?: number) {
    return this.call('coda_list_pages', { docId, limit });
  }

  async listTables(docId: string) {
    return this.call('coda_list_tables', { docId });
  }

  async listRows(docId: string, tableIdOrName: string, limit?: number) {
    return this.call('coda_list_rows', { docId, tableIdOrName, limit });
  }

  async cleanup(): Promise<void> {
    try {
      await this.http.delete('/mcp');
    } catch (error) {
      console.warn('Session cleanup failed:', error);
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
```

---

## Python Integration

### Python Client

```bash
pip install requests
```

```python
# client.py
import requests
import json
import uuid
from typing import Any, Dict

class CodaMcpClient:
    def __init__(self, token: str, server_url: str = 'https://coda.bestviable.com'):
        self.token = token
        self.server_url = server_url
        self.session_id = str(uuid.uuid4())
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Mcp-Session-Id': self.session_id,
            'Content-Type': 'application/json'
        }

    def call(self, method: str, params: Dict[str, Any] = None) -> Any:
        """Call an MCP method"""
        request = {
            'jsonrpc': '2.0',
            'id': 1,
            'method': method,
            'params': params or {}
        }

        response = requests.post(
            f'{self.server_url}/mcp',
            json=request,
            headers=self.headers
        )
        response.raise_for_status()

        data = response.json()
        if 'error' in data:
            raise Exception(f"MCP Error: {data['error']['message']}")

        return data.get('result')

    def list_documents(self):
        return self.call('coda_list_documents', {})

    def get_document(self, doc_id: str):
        return self.call('coda_get_document', {'docId': doc_id})

    def list_pages(self, doc_id: str):
        return self.call('coda_list_pages', {'docId': doc_id})

    def list_tables(self, doc_id: str):
        return self.call('coda_list_tables', {'docId': doc_id})

    def list_rows(self, doc_id: str, table_id: str):
        return self.call('coda_list_rows', {'docId': doc_id, 'tableIdOrName': table_id})

    def cleanup(self):
        try:
            requests.delete(
                f'{self.server_url}/mcp',
                headers=self.headers
            )
        except Exception as e:
            print(f'Cleanup failed: {e}')
```

**Usage**:

```python
import os
from client import CodaMcpClient

token = os.getenv('CODA_API_TOKEN')
client = CodaMcpClient(token)

try:
    # List documents
    docs = client.list_documents()
    print(f'Found {len(docs["items"])} documents')

    # Get document details
    doc = client.get_document('doc_abc123')
    print(f'Document: {doc["name"]}')

    # List pages
    pages = client.list_pages('doc_abc123')
    print(f'Pages: {[p["name"] for p in pages["items"]]}')

finally:
    client.cleanup()
```

---

## Tool Reference

### Document Operations

```javascript
// List documents
await client.call('coda_list_documents', {
  query: 'search term',       // optional
  limit: 10,                  // optional
  isOwner: true,              // optional
  isPublished: false          // optional
});

// Get document
await client.call('coda_get_document', {
  docId: 'doc_abc123'
});

// Create document
await client.call('coda_create_document', {
  title: 'New Document',
  sourceDoc: 'doc_template',  // optional
  folderId: 'folder_123'      // optional
});
```

### Page Operations

```javascript
// List pages
await client.call('coda_list_pages', {
  docId: 'doc_abc123',
  limit: 25,                  // optional
  nextPageToken: 'token'      // optional for pagination
});

// Create page
await client.call('coda_create_page', {
  docId: 'doc_abc123',
  name: 'New Page',
  content: 'Markdown content',  // optional
  parentPageId: 'page_456',     // optional
  subtitle: 'Subtitle',         // optional
  iconName: 'star'              // optional
});

// Get page content
await client.call('coda_get_page_content', {
  docId: 'doc_abc123',
  pageIdOrName: 'page_456'
});

// Replace page content
await client.call('coda_replace_page_content', {
  docId: 'doc_abc123',
  pageIdOrName: 'page_456',
  content: 'New markdown content'
});
```

### Table Operations

```javascript
// List tables
await client.call('coda_list_tables', {
  docId: 'doc_abc123',
  tableTypes: ['table', 'view'],  // optional
  limit: 50                       // optional
});

// List rows
await client.call('coda_list_rows', {
  docId: 'doc_abc123',
  tableIdOrName: 'table_456',
  query: 'column_name:value',     // optional filter
  limit: 100,                     // optional
  sortBy: 'createdAt',            // optional: createdAt, updatedAt, natural
  useColumnNames: true            // optional
});

// Create rows
await client.call('coda_create_rows', {
  docId: 'doc_abc123',
  tableIdOrName: 'table_456',
  rows: [
    { Name: 'John', Email: 'john@example.com' },
    { Name: 'Jane', Email: 'jane@example.com' }
  ],
  keyColumns: ['Email']  // optional for upsert
});

// Update row
await client.call('coda_update_row', {
  docId: 'doc_abc123',
  tableIdOrName: 'table_456',
  rowIdOrName: 'row_789',
  values: {
    Status: 'Completed',
    UpdatedAt: new Date().toISOString()
  }
});

// Delete row
await client.call('coda_delete_row', {
  docId: 'doc_abc123',
  tableIdOrName: 'table_456',
  rowIdOrName: 'row_789'
});
```

### Search Operations

```javascript
// Search pages
await client.call('coda_search_pages', {
  docId: 'doc_abc123',
  query: 'search term',
  includeContent: true  // optional, slower
});

// Search tables
await client.call('coda_search_tables', {
  docId: 'doc_abc123',
  query: 'table name',
  tableTypes: ['table']  // optional
});
```

### User Operations

```javascript
// Get current user
await client.call('coda_whoami', {});
```

---

## Error Handling

All clients should handle JSON-RPC errors:

```javascript
// Successful response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}

// Error response
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

**Error Codes**:
- `-32700`: Parse error
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32000`: Server error

---

## Examples

### Complete Example: Fetch and Update Data

```bash
#!/bin/bash

# Set up
API_TOKEN="$CODA_API_TOKEN"
DOC_ID="doc_abc123"
TABLE_ID="table_456"
SERVER="https://coda.bestviable.com"

# 1. List rows from table
ROWS=$(curl -s -X POST "$SERVER/mcp" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Mcp-Session-Id: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d "{
    \"jsonrpc\": \"2.0\",
    \"id\": 1,
    \"method\": \"coda_list_rows\",
    \"params\": {
      \"docId\": \"$DOC_ID\",
      \"tableIdOrName\": \"$TABLE_ID\",
      \"limit\": 10
    }
  }" | jq '.result.items')

echo "Found $(echo $ROWS | jq 'length') rows"

# 2. Process each row
echo $ROWS | jq -c '.[]' | while read row; do
  ROW_ID=$(echo $row | jq -r '.id')
  echo "Processing row: $ROW_ID"

  # 3. Update row
  curl -s -X POST "$SERVER/mcp" \
    -H "Authorization: Bearer $API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": 1,
      \"method\": \"coda_update_row\",
      \"params\": {
        \"docId\": \"$DOC_ID\",
        \"tableIdOrName\": \"$TABLE_ID\",
        \"rowIdOrName\": \"$ROW_ID\",
        \"values\": {
          \"Status\": \"Processed\",
          \"ProcessedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }
      }
    }" | jq '.result'
done
```

---

**Last Updated**: 2025-11-01
**Status**: Complete and Ready for Integration
