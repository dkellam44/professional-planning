# Archon Integration Plan v0.1

- entity: integration_plan
- level: documentation
- zone: internal
- version: v01
- tags: [archon, integration, deployment, memory, architecture]
- source_path: /docs/architecture/integrations/archon/ARCHON_INTEGRATION_PLAN_v01.md
- date: 2025-11-05

---

## Executive Summary

This document defines the complete integration plan for deploying **Archon** (open-source knowledge management + MCP server) into the existing Personal AI Memory & Control Plane infrastructure. Archon will serve as the **memory orchestration hub** alongside Open WebUI (chat), Coda (task management), n8n (orchestration), and custom MCP servers.

**Status**: Phase 2A LOCAL SETUP COMPLETE ✅ | Phase 2B-2D PENDING
**Target Timeline**: 2-4 weeks remaining (droplet deployment + n8n integration)
**Estimated Cost**: $7/mo Year 1 → $32/mo Year 2+

**Latest Update** (2025-11-06):
- ✅ Local setup complete with all services healthy
- ✅ Supabase database migrated and validated
- ✅ Docker services running (archon-server, archon-mcp, archon-ui)
- ✅ API endpoints tested and working
- ✅ Knowledge ingestion tested (web crawl initiated)
- ⏳ Ready for droplet deployment (Phase 2A)
- See: `ARCHON_LOCAL_SETUP_COMPLETION_v01.md` for full details

---

## Architecture Overview

### Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Public Internet                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloudflare Zero Trust + Tunnel                      │
│  Routes:                                                         │
│    - n8n.bestviable.com → 5678                                  │
│    - archon.bestviable.com → 3737                               │
│    - chat.bestviable.com → 8080                                 │
│    - coda.bestviable.com → 8085 (MCP)                           │
│    - github.bestviable.com → 8081 (MCP)                         │
│    - firecrawl.bestviable.com → 8084 (MCP)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Nginx Reverse Proxy (Droplet)                   │
│  - SSL termination (Let's Encrypt)                              │
│  - Internal routing to Docker services                          │
│  - Request logging & security headers                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Phase 1     │  │    Phase 2A      │  │    Phase 2B      │
│   (Running)   │  │   (Archon)       │  │  (Open WebUI)    │
├───────────────┤  ├──────────────────┤  ├──────────────────┤
│ n8n           │  │ archon-ui        │  │ openwebui        │
│ PostgreSQL    │  │ archon-server    │  │                  │
│ Qdrant        │  │ archon-mcp       │  │ Letta (future)   │
│ nginx-proxy   │  │ archon-agents    │  │                  │
│ acme-companion│  │                  │  │                  │
│ cloudflared   │  │                  │  │                  │
└───────┬───────┘  └─────────┬────────┘  └─────────┬────────┘
        │                    │                      │
        │                    ▼                      │
        │          ┌──────────────────┐            │
        └─────────►│  Phase 2C (MCP)  │◄───────────┘
                   ├──────────────────┤
                   │ coda-mcp         │
                   │ github-mcp       │
                   │ firecrawl-mcp    │
                   └─────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Supabase     │  │  Redis Cloud     │  │  Coda Workspace  │
│  (Managed)    │  │  (Managed)       │  │  (SaaS)          │
├───────────────┤  ├──────────────────┤  ├──────────────────┤
│ PostgreSQL    │  │ Session state    │  │ Task management  │
│ + pgvector    │  │ Cache (30 MB)    │  │ General projects │
│ (Free→$25/mo) │  │ (Free)           │  │ Sync via n8n     │
└───────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Component Responsibilities

| Component | Role | Port | Integration Points |
|-----------|------|------|-------------------|
| **n8n** | Orchestration & workflows | 5678 | → Archon API, Open WebUI, Coda API, MCP servers |
| **Archon UI** | Knowledge + task management GUI | 3737 | ← User interaction, → Archon Server |
| **Archon Server** | RAG, embeddings, document processing | 8181 | ← n8n workflows, → Supabase |
| **Archon MCP** | MCP protocol for Claude Code | 8051 | ← Claude Code, Cursor, Windsurf |
| **Archon Agents** | PydanticAI document processing | 8052 | ← Archon Server, → LLM APIs |
| **Open WebUI** | Chat interface, model switching | 8080 | → n8n webhooks, LLM APIs |
| **Letta** (future) | Production AI agents | TBD | → Supabase (shared), n8n |
| **Coda MCP** | Coda workspace access | 8085 | ← Claude Code |
| **GitHub MCP** | Repository management | 8081 | ← Claude Code |
| **Firecrawl MCP** | Web scraping | 8084 | ← Claude Code |
| **Supabase** | Vector DB + settings storage | Cloud | ← Archon, Letta |
| **Redis Cloud** | Session state, cache | Cloud | ← n8n, Open WebUI |
| **Coda** | General task management surface | Cloud | ← n8n sync workflows |

---

## Data Flow: Memory Operations

### 1. Pre-Prompt Memory Assembly (Open WebUI → Archon)

```
User starts chat in Open WebUI
    ↓
Open WebUI pre-prompt hook
    ↓ HTTP POST
n8n webhook: /memory/assemble
    {
      "user_id": "...",
      "query": "How do I configure Cloudflare Tunnel?",
      "context_limit": 10
    }
    ↓
n8n HTTP Request → archon-server:8181/api/knowledge/search
    {
      "query": "How do I configure Cloudflare Tunnel?",
      "limit": 10,
      "use_hybrid_search": true,
      "use_reranking": true
    }
    ↓
Archon Server:
  1. Embed query (OpenAI text-embedding-3-small)
  2. Vector search in Supabase (pgvector)
  3. Hybrid keyword search
  4. Rerank results (cross-encoder)
  5. Return top 10 chunks
    ↓
n8n Function Node: Format context
    {
      "system_prompt": "You have access to these docs:\n\n[context]",
      "sources": ["cloudflare-docs", "portfolio-readme"],
      "confidence": 0.89
    }
    ↓
Response to Open WebUI
    ↓
Open WebUI injects context into chat prompt
```

### 2. Post-Conversation Writeback (Open WebUI → Archon)

```
User finishes conversation in Open WebUI
    ↓
Open WebUI post-conversation hook
    ↓ HTTP POST
n8n webhook: /memory/writeback
    {
      "user_id": "...",
      "session_id": "...",
      "transcript": "User: How do I...?\nAssistant: To configure...",
      "timestamp": "2025-11-05T10:00:00Z"
    }
    ↓
n8n Function Node: Extract facts/entities
  - Parse conversation
  - Identify: key decisions, new learnings, tasks
  - Extract: code snippets, references, action items
    ↓
n8n HTTP Request → archon-server:8181/api/knowledge/upload
    {
      "content": "Conversation about Cloudflare Tunnel setup...",
      "source_type": "conversation",
      "metadata": {
        "session_id": "...",
        "timestamp": "...",
        "topics": ["cloudflare", "infrastructure"]
      }
    }
    ↓
Archon Server:
  1. Chunk conversation transcript
  2. Generate embeddings
  3. Store in Supabase documents table
  4. Extract code examples (if any)
  5. Update knowledge graph
    ↓
Optional: n8n → Create tasks in Archon
    POST /api/tasks
    {
      "title": "Deploy Cloudflare Tunnel to droplet",
      "description": "Follow steps discussed in conversation...",
      "status": "todo",
      "project_id": "portfolio-infrastructure"
    }
    ↓
Optional: n8n → Sync to Coda
    POST https://coda.io/apis/v1/docs/{docId}/tables/{tableId}/rows
    {
      "cells": [
        {"column": "Task", "value": "Deploy Cloudflare Tunnel"},
        {"column": "Status", "value": "Todo"},
        {"column": "Source", "value": "Archon AI Conversation"}
      ]
    }
```

### 3. Claude Code MCP Tools Access

```
Claude Code session starts
    ↓
Claude Code connects to Archon MCP (SSE)
    GET http://archon-mcp:8051/sse
    Authorization: Bearer {token}
    ↓
Claude Code discovers available tools:
  - archon:rag_search_knowledge_base
  - archon:rag_search_code_examples
  - archon:rag_list_pages_for_source
  - archon:rag_read_full_page
  - archon:find_projects
  - archon:manage_project
  - archon:find_tasks
  - archon:manage_task
    ↓
User asks: "How do I set up nginx with SSL?"
    ↓
Claude Code calls: archon:rag_search_knowledge_base
    {
      "query": "nginx SSL setup",
      "limit": 5
    }
    ↓
Archon MCP → Archon Server → Supabase
    Returns: [
      {
        "content": "To configure nginx with SSL...",
        "source": "nginx-docs",
        "similarity": 0.92
      },
      ...
    ]
    ↓
Claude Code uses context to answer user
    ↓
User: "Create a task to implement this"
    ↓
Claude Code calls: archon:manage_task
    {
      "action": "create",
      "title": "Implement nginx SSL configuration",
      "description": "Follow steps from nginx-docs...",
      "status": "todo"
    }
    ↓
Task created in Archon → synced to Coda via n8n
```

---

## Phased Deployment Plan

### Phase 1: ✅ Complete (Current State)

**Infrastructure**:
- ✅ n8n stack deployed (Docker Compose)
- ✅ Nginx reverse proxy (jwilder/nginx-proxy)
- ✅ SSL certificates (acme-companion)
- ✅ Cloudflare Tunnel (token-based)
- ✅ PostgreSQL + Qdrant for n8n
- ✅ External HTTPS access working

**Status**: Production-ready, all services healthy

---

### Phase 2A: Archon Deployment (Week 1-2)

**Status**: ✅ LOCAL SETUP COMPLETE | ⏳ DROPLET DEPLOYMENT PENDING

**Objectives**:
1. ✅ Deploy Archon stack locally (DONE - 2025-11-06)
2. ✅ Configure Supabase cloud database (DONE)
3. ⏳ Wire Archon UI behind Cloudflare Access (NEXT)
4. ⏳ Test knowledge base features on droplet (NEXT)

**Prerequisites - COMPLETED**:
- [x] Supabase account created (free tier) - `ocvjzbzyvmfqixxwwqte.supabase.co`
- [x] Redis Cloud account created (free tier) - connected
- [x] OpenAI API key obtained - configured
- [x] Cloudflare Access policies - to be configured on droplet

**Key Findings from Local Testing**:
- API endpoints use `/api/knowledge-items/*` pattern (not `/api/knowledge/*`)
- Settings stored in Supabase table (encrypted) - not in .env
- Docker service dependency order matters (archon-server must be healthy first)
- Database migration must run before services start
- All services pass health checks
- See `ARCHON_LOCAL_SETUP_COMPLETION_v01.md` for detailed findings

**Steps**:

#### 1. Prepare Cloud Services

```bash
# Create accounts:
# 1. Supabase: https://supabase.com
#    - Create new project
#    - Note SUPABASE_URL and SUPABASE_SERVICE_KEY
# 2. Redis Cloud: https://redis.com/try-free/
#    - Create database
#    - Note REDIS_URL
```

#### 2. Initialize Supabase Database

```bash
# In Supabase SQL Editor, run:
# /Users/davidkellam/workspace/archon/migration/complete_setup.sql

# This creates:
# - archon_settings (config + encrypted credentials)
# - sources (crawled sites/docs)
# - documents (chunks + embeddings)
# - code_examples (extracted code)
# - archon_projects (optional)
# - archon_tasks (optional)
```

#### 3. Configure Archon on Droplet

```bash
# On droplet
mkdir -p /root/portfolio/infra/archon
cd /root/portfolio/infra/archon

# Create .env
cat > .env <<EOF
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# LLM Configuration (will be moved to Settings UI)
OPENAI_API_KEY=your-openai-key-here

# Service Ports
HOST=localhost
ARCHON_SERVER_PORT=8181
ARCHON_MCP_PORT=8051
ARCHON_AGENTS_PORT=8052
ARCHON_UI_PORT=3737

# Development
LOG_LEVEL=INFO
LOGFIRE_TOKEN=
AGENTS_ENABLED=true
PROJECTS_ENABLED=true

# RAG Strategy (managed via Settings UI after first boot)
LLM_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
MODEL_CHOICE=gpt-4.1-nano
EOF

chmod 600 .env
```

#### 4. Create docker-compose.yml

```bash
# Copy from local workspace
scp ~/workspace/archon/docker-compose.yml tools-droplet-agents:/root/portfolio/infra/archon/

# Or create manually (see Appendix A for full config)
```

#### 5. Deploy Archon Services

```bash
# On droplet
cd /root/portfolio/infra/archon
docker compose up --build -d

# Verify
docker compose ps
# Expected: archon-server, archon-mcp, archon-ui, archon-agents all healthy

# Check logs
docker compose logs -f archon-server
docker compose logs -f archon-mcp

# Test internal access
curl http://localhost:8181/health
curl http://localhost:3737
```

#### 6. Configure Nginx Routes

```nginx
# Add to /root/portfolio/infra/n8n/nginx/archon.conf

# Archon UI
location /archon/ {
    proxy_pass http://archon-ui:3737/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Archon API (for n8n integration)
location /archon-api/ {
    proxy_pass http://archon-server:8181/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# Archon MCP (for Claude Code)
location /archon-mcp/ {
    proxy_pass http://archon-mcp:8051/;
    proxy_set_header Host $host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_http_version 1.1;
}
```

#### 7. Update Cloudflare Tunnel

```yaml
# Update tunnel config to add Archon routes
# In Cloudflare Zero Trust dashboard:
# Add Public Hostnames:
#   - archon.bestviable.com → http://localhost:3737
#   - archon-api.bestviable.com → http://localhost:8181 (optional, for direct API)
```

#### 8. Configure Cloudflare Access Policies

```yaml
# In Cloudflare Zero Trust → Access → Applications
# Create new application:
Name: Archon Knowledge Base
Domain: archon.bestviable.com
Type: Self-hosted
Policy:
  - Rule: Allow
  - Include: Emails ending in @yourdomain.com (or your personal email)
  - Action: Allow
```

#### 9. Initial Configuration via Archon UI

```
1. Navigate to https://archon.bestviable.com
2. Onboarding flow will prompt for:
   - OpenAI API key (stored encrypted in archon_settings)
   - Embedding model selection (keep default: text-embedding-3-small)
   - RAG strategy toggles (keep defaults: hybrid search ON, reranking ON)
3. Test web crawl:
   - Knowledge Base → Crawl Website
   - Enter: https://docs.cloudflare.com/cloudflare-one/connections/connect-networks/
   - Wait for crawl to complete (~2-5 min)
4. Test search:
   - Knowledge Base → Search
   - Query: "How to configure Cloudflare Tunnel"
   - Verify results returned
```

**Success Criteria**:
- ✅ All 4 Archon services running and healthy
- ✅ Archon UI accessible at https://archon.bestviable.com
- ✅ Can crawl a documentation site successfully
- ✅ Search returns relevant results
- ✅ Database size < 100 MB (check Supabase dashboard)

**Rollback Plan**:
```bash
docker compose -f /root/portfolio/infra/archon/docker-compose.yml down -v
# Remove nginx config
# Remove Cloudflare route
```

---

### Phase 2B: Open WebUI + n8n Integration (Week 3-4)

**Objectives**:
1. Deploy Open WebUI
2. Create n8n memory orchestration workflows
3. Wire Open WebUI pre/post hooks
4. Test end-to-end chat → memory flow

**Steps**:

#### 1. Add Redis to docker-compose

```yaml
# In /root/portfolio/infra/archon/docker-compose.yml

services:
  redis:
    image: redis:7-alpine
    container_name: archon-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  redis-data:
```

#### 2. Deploy Open WebUI

```yaml
# Add to docker-compose.yml

services:
  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: openwebui
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_BASE_URL=https://openrouter.ai/api/v1
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - WEBUI_AUTH=False  # Disable auth (behind Cloudflare Access)
      - ENABLE_RAG_WEB_SEARCH=True
      - ENABLE_RAG_WEB_LOADER_SSL_VERIFICATION=True
      - RAG_EMBEDDING_MODEL=text-embedding-3-small
      - RAG_EMBEDDING_OPENAI_BATCH_SIZE=1
      # Pre/post hooks (configure after n8n workflows deployed)
      - WEBUI_MIDDLEWARE_PREPROMPT_URL=https://n8n.bestviable.com/webhook/memory-assemble
      - WEBUI_MIDDLEWARE_POSTPROMPT_URL=https://n8n.bestviable.com/webhook/memory-writeback
    volumes:
      - openwebui-data:/app/backend/data
    networks:
      - app-network
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  openwebui-data:
```

#### 3. Create n8n Workflows

**Workflow 1: `/memory/assemble`**

```json
{
  "name": "Memory Assemble for Open WebUI",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "memory-assemble",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Archon RAG Search",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://archon-server:8181/api/knowledge/search",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={\n  \"query\": \"{{$json.body.query}}\",\n  \"limit\": 10,\n  \"use_hybrid_search\": true,\n  \"use_reranking\": true\n}"
      }
    },
    {
      "name": "Format Context",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const results = $input.item.json.results || [];\n\nconst context = results.map(r => \n  `Source: ${r.source}\\nContent: ${r.content}\\nRelevance: ${r.similarity}`\n).join('\\n\\n---\\n\\n');\n\nreturn {\n  json: {\n    system_prompt: `You have access to the following knowledge base context:\\n\\n${context}`,\n    sources: results.map(r => r.source),\n    confidence: results.length > 0 ? results[0].similarity : 0\n  }\n};"
      }
    },
    {
      "name": "Respond to Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ]
}
```

**Workflow 2: `/memory/writeback`**

```json
{
  "name": "Memory Writeback from Open WebUI",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "memory-writeback",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Extract Entities",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const transcript = $input.item.json.body.transcript;\nconst metadata = $input.item.json.body.metadata || {};\n\n// Simple extraction (can be enhanced with LLM call)\nconst facts = [];\nconst tasks = [];\n\n// Look for action items\nif (transcript.includes('TODO:') || transcript.includes('Action:')) {\n  const lines = transcript.split('\\n');\n  lines.forEach(line => {\n    if (line.includes('TODO:') || line.includes('Action:')) {\n      tasks.push(line.replace(/TODO:|Action:/g, '').trim());\n    }\n  });\n}\n\nreturn {\n  json: {\n    transcript,\n    metadata,\n    facts,\n    tasks\n  }\n};"
      }
    },
    {
      "name": "Upload to Archon",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://archon-server:8181/api/knowledge/upload",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={\n  \"content\": \"{{$json.transcript}}\",\n  \"source_type\": \"conversation\",\n  \"metadata\": {{$json.metadata}}\n}"
      }
    },
    {
      "name": "Create Tasks (if any)",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$json.tasks.length}}",
              "operation": "greaterThan",
              "value2": 0
            }
          ]
        }
      }
    },
    {
      "name": "Archon Create Task",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://archon-server:8181/api/tasks",
        "method": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "={\n  \"title\": \"{{$json.tasks[0]}}\",\n  \"description\": \"From conversation: {{$json.metadata.session_id}}\",\n  \"status\": \"todo\"\n}"
      }
    },
    {
      "name": "Respond Success",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={\"status\": \"success\", \"tasks_created\": {{$json.tasks.length}} }"
      }
    }
  ]
}
```

**Workflow 3: Supabase Health Check (prevent pausing)**

```json
{
  "name": "Supabase Activity Health Check",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "days",
              "daysInterval": 6
            }
          ]
        }
      }
    },
    {
      "name": "Ping Archon Health",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://archon-server:8181/health",
        "method": "GET"
      }
    },
    {
      "name": "Log Activity",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "console.log('Supabase activity check:', new Date().toISOString());\nreturn $input.all();"
      }
    }
  ]
}
```

#### 4. Test End-to-End Flow

```
1. Open https://chat.bestviable.com
2. Start new conversation
3. Ask: "How do I configure Cloudflare Tunnel with nginx?"
4. Verify:
   - Open WebUI sends query to n8n /memory/assemble
   - n8n calls Archon RAG search
   - Context injected into prompt
   - Answer references Archon knowledge
5. Complete conversation
6. Verify:
   - n8n /memory/writeback called
   - Conversation uploaded to Archon
   - Check Archon UI → Knowledge Base for new entry
```

**Success Criteria**:
- ✅ Open WebUI accessible at https://chat.bestviable.com
- ✅ Pre-prompt hook returns context from Archon
- ✅ Post-conversation hook uploads to Archon
- ✅ Can see new conversations in Archon UI
- ✅ Health check workflow prevents Supabase pausing

---

### Phase 2C: Custom MCP Servers Deployment (Week 4-5)

**Objectives**:
1. Deploy Coda, GitHub, Firecrawl MCP servers
2. Configure Claude Code to use both Archon MCP and custom MCPs
3. Test tool execution from Claude Code

**Steps**:

See existing `/infra/mcp-servers/README.md` and docker-compose.yml from Phase 2 design (Nov 3 session).

**Integration with Archon**:
- Archon MCP provides: Knowledge search, task management, code examples
- Custom MCPs provide: Coda sync, GitHub operations, web scraping
- Claude Code uses both simultaneously

**Claude Code MCP Config** (`~/.config/claude-code/mcp_servers.json`):

```json
{
  "mcpServers": {
    "archon": {
      "url": "https://archon.bestviable.com/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN_HERE"
      }
    },
    "coda": {
      "url": "https://coda.bestviable.com/mcp",
      "transport": "sse"
    },
    "github": {
      "url": "https://github.bestviable.com/mcp",
      "transport": "sse"
    },
    "firecrawl": {
      "url": "https://firecrawl.bestviable.com/mcp",
      "transport": "sse"
    }
  }
}
```

---

### Phase 2D: Letta Integration (Future - Week 8+)

**Objectives**:
1. Deploy Letta agents service
2. Wire to same Supabase backend as Archon
3. Create production AI agents with persistent memory

**Deployment**:

```yaml
# Add to docker-compose.yml

services:
  letta:
    image: letta/letta:latest  # Check for official image
    container_name: letta
    ports:
      - "8053:8053"
    environment:
      - LETTA_DATABASE_URL=postgresql://postgres:${SUPABASE_PASSWORD}@${SUPABASE_HOST}:5432/postgres
      - LETTA_REDIS_URL=redis://redis:6379/1
      - LETTA_LLM_PROVIDER=openai
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    volumes:
      - letta-data:/app/data
    networks:
      - app-network
    depends_on:
      - redis

volumes:
  letta-data:
```

**Shared Database Schema**:
- Archon uses: `documents`, `sources`, `code_examples`, `archon_*` tables
- Letta uses: `letta_agents`, `letta_memory`, `letta_conversations` tables
- Shared: Same pgvector extension, same embedding model

**n8n Integration**:
- Create workflows to trigger Letta agents
- Pass Archon knowledge base context to Letta
- Store Letta outputs back to Archon

**Status**: Deferred to Phase 3 (after Archon + Open WebUI stable)

---

## Configuration Management

### Environment Variables Matrix

| Variable | Archon | Open WebUI | n8n | MCP Servers |
|----------|--------|------------|-----|-------------|
| `SUPABASE_URL` | ✅ | ❌ | ❌ | ❌ |
| `SUPABASE_SERVICE_KEY` | ✅ | ❌ | ❌ | ❌ |
| `OPENAI_API_KEY` | ✅ | ✅ | ✅ | ✅ |
| `REDIS_URL` | ❌ | ✅ | ✅ | ❌ |
| `ARCHON_SERVER_PORT` | ✅ | ❌ | ❌ | ❌ |
| `ARCHON_MCP_PORT` | ✅ | ❌ | ❌ | ❌ |
| `N8N_WEBHOOK_URL` | ❌ | ✅ | ❌ | ❌ |
| `CODA_API_KEY` | ❌ | ❌ | ✅ | ✅ |

### Secrets Storage

| Secret | Storage Location | Access Method |
|--------|------------------|---------------|
| Supabase keys | Archon `.env` (not committed) | Docker env |
| OpenAI API key | Archon `archon_settings` (encrypted) | Settings UI |
| Coda API key | n8n credentials store | n8n UI |
| GitHub token | MCP server `.env` | Docker env |
| Cloudflare tunnel token | Cloudflared `.env` | Docker env |

---

## Monitoring & Maintenance

### Health Checks

**Daily Automated Checks** (via n8n):
```
1. Archon health endpoint: GET archon-server:8181/health
2. Open WebUI health: GET openwebui:8080/health
3. Supabase connectivity: Query archon_settings table
4. Redis connectivity: PING command
5. MCP server availability: GET {mcp-url}/health
```

**Weekly Manual Checks**:
```
1. Supabase dashboard → Usage → Database size
2. Supabase dashboard → Usage → Egress
3. Redis Cloud dashboard → Memory usage
4. Archon UI → Settings → Database stats
```

### Capacity Alerts

**Set alerts for**:
- Supabase database size > 400 MB (80% of free tier)
- Supabase egress > 4 GB/month
- Redis memory > 25 MB (83% of free tier)
- Droplet RAM usage > 1.8 GB (90% of 2GB)

**Alert Destinations**:
- n8n → Send email via SMTP
- n8n → Post to Slack channel (optional)
- Cloudflare email alerts (for tunnel issues)

### Backup Strategy

**Supabase** (managed):
- Free tier: No automatic backups
- Pro tier: 7-day automatic backups
- Manual export: `pg_dump` via Supabase CLI weekly

**Archon knowledge base**:
- Export sources list weekly (JSON)
- Export key documents monthly (Markdown)
- Store in GitHub repo: `/infra/archon/backups/`

**n8n workflows**:
- Export workflows monthly (JSON)
- Store in repo: `/infra/n8n/workflows/`

---

## Cost Summary

### Year 1 (First 6-12 months)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase | Free | 500 MB database sufficient |
| Redis Cloud | Free | 30 MB sufficient |
| DigitalOcean Droplet | $6/mo = $72/yr | 2GB Basic |
| Cloudflare | Free | Tunnel + DNS |
| Domain (bestviable.com) | $12/yr | Annual renewal |
| OpenAI API | ~$5/mo = $60/yr | Embeddings + occasional queries |
| **TOTAL** | **$144/yr** | **~$12/month** |

### Year 2+ (Scaled usage)

| Service | Cost | Notes |
|---------|------|-------|
| Supabase Pro | $25/mo = $300/yr | When > 450 MB database |
| Redis Cloud | Free or $5/mo | Free tier likely sufficient |
| DigitalOcean Droplet | $6/mo = $72/yr | May need 4GB ($24/mo) if heavy |
| Cloudflare | Free | |
| Domain | $12/yr | |
| OpenAI API | ~$15/mo = $180/yr | More usage |
| **TOTAL** | **$564-624/yr** | **~$47-52/month** |

---

## Risk Assessment & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Supabase free tier exceeded** | High (Year 2) | Medium | Monitor weekly, upgrade to Pro when 80% |
| **Droplet RAM exhaustion** | Medium | High | Monitor RAM, disable agents if needed, upgrade to 4GB |
| **Archon service crashes** | Low | Medium | Health checks + auto-restart policies |
| **n8n workflow failures** | Medium | Medium | Error handling + retry logic |
| **Supabase pausing (inactivity)** | Low | High | Weekly health check cron |
| **Data loss (no backups)** | Low | High | Manual exports weekly, upgrade to Pro for backups |
| **API key leaks** | Low | High | Never commit .env, use Cloudflare Access |
| **Embedding cost overruns** | Low | Medium | Monitor OpenAI usage, set budget alerts |

---

## Success Criteria

### Phase 2A (Archon Deployment)

- [ ] All 4 Archon services running and healthy
- [ ] Archon UI accessible at https://archon.bestviable.com
- [ ] Can crawl documentation sites successfully
- [ ] Search returns accurate results (subjective test)
- [ ] Database size < 100 MB
- [ ] No errors in Archon logs

### Phase 2B (Open WebUI + n8n)

- [ ] Open WebUI accessible at https://chat.bestviable.com
- [ ] Pre-prompt hook injects Archon context
- [ ] Post-conversation hook uploads to Archon
- [ ] Can see conversations in Archon UI
- [ ] Tasks created from conversations appear in Archon
- [ ] Health check prevents Supabase pausing

### Phase 2C (MCP Servers)

- [ ] Coda, GitHub, Firecrawl MCPs deployed
- [ ] Claude Code can connect to all MCP servers
- [ ] Can execute tools from each MCP
- [ ] Archon MCP + custom MCPs work simultaneously
- [ ] No port conflicts or auth issues

### Overall Integration

- [ ] End-to-end flow: Chat → Memory assembly → Answer → Writeback → Knowledge stored
- [ ] Can query knowledge from multiple sources (Archon, Coda, GitHub)
- [ ] Task sync between Archon and Coda working (if implemented)
- [ ] No service downtime > 1 hour/month
- [ ] Total monthly cost < $15 (Year 1)

---

## Troubleshooting Guide

### Archon Services Won't Start

**Symptoms**: `docker compose ps` shows unhealthy or exited

**Checks**:
```bash
docker compose logs archon-server
# Look for:
# - Supabase connection errors → check SUPABASE_URL and key
# - OpenAI API errors → check OPENAI_API_KEY
# - Port conflicts → check ports not already in use
```

**Solutions**:
- Verify `.env` file has correct credentials
- Check Supabase project is not paused
- Ensure ports 8181, 8051, 8052, 3737 not in use
- Run `docker compose down -v && docker compose up --build -d`

### RAG Search Returns No Results

**Symptoms**: Archon search returns empty array

**Checks**:
```bash
# Check if embeddings generated
docker compose exec archon-server psql $SUPABASE_URL -c \
  "SELECT COUNT(*) FROM documents WHERE embedding IS NOT NULL;"
```

**Solutions**:
- Verify documents were crawled/uploaded (check Archon UI)
- Check OpenAI API key is valid and has credits
- Review Archon logs for embedding generation errors
- Re-crawl source if embeddings failed

### n8n Webhooks Not Triggered

**Symptoms**: Open WebUI doesn't receive context

**Checks**:
```bash
# Test webhook manually
curl -X POST https://n8n.bestviable.com/webhook/memory-assemble \
  -H "Content-Type: application/json" \
  -d '{"query": "test"}'
```

**Solutions**:
- Verify n8n workflow is activated (toggle in UI)
- Check Open WebUI environment variables for webhook URLs
- Ensure Cloudflare Access allows webhook domain
- Review n8n execution logs for errors

### Supabase Connection Errors

**Symptoms**: `Connection refused` or `Authentication failed`

**Checks**:
```bash
# Test connection from droplet
docker compose exec archon-server curl -H "apikey: $SUPABASE_SERVICE_KEY" \
  "$SUPABASE_URL/rest/v1/"
```

**Solutions**:
- Verify Supabase project is not paused (login to dashboard)
- Check you're using SERVICE_KEY, not anon key
- Ensure Supabase URL includes https://
- Verify no firewall blocking outbound HTTPS

---

## Appendix A: Complete docker-compose.yml for Archon

```yaml
# /root/portfolio/infra/archon/docker-compose.yml

services:
  # Archon Server (Core API)
  archon-server:
    build:
      context: /root/archon-repo  # Clone repo here first
      dockerfile: python/Dockerfile.server
    container_name: archon-server
    ports:
      - "8181:8181"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SERVICE_DISCOVERY_MODE=docker_compose
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
      - ARCHON_SERVER_PORT=8181
      - ARCHON_MCP_PORT=8051
      - ARCHON_AGENTS_PORT=8052
      - AGENTS_ENABLED=${AGENTS_ENABLED:-true}
      - ARCHON_HOST=${HOST:-localhost}
    networks:
      - app-network
    volumes:
      - archon-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8181/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Archon MCP Server
  archon-mcp:
    build:
      context: /root/archon-repo
      dockerfile: python/Dockerfile.mcp
    container_name: archon-mcp
    ports:
      - "8051:8051"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - SERVICE_DISCOVERY_MODE=docker_compose
      - TRANSPORT=sse
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
      - API_SERVICE_URL=http://archon-server:8181
      - AGENTS_ENABLED=${AGENTS_ENABLED:-true}
      - AGENTS_SERVICE_URL=http://archon-agents:8052
      - ARCHON_MCP_PORT=8051
    networks:
      - app-network
    depends_on:
      archon-server:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8051/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  # Archon Agents (PydanticAI)
  archon-agents:
    build:
      context: /root/archon-repo
      dockerfile: python/Dockerfile.agents
    container_name: archon-agents
    ports:
      - "8052:8052"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SERVICE_DISCOVERY_MODE=docker_compose
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
      - ARCHON_AGENTS_PORT=8052
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8052/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped

  # Archon UI (Frontend)
  archon-ui:
    build:
      context: /root/archon-repo/archon-ui-main
    container_name: archon-ui
    ports:
      - "3737:3737"
    environment:
      - VITE_ARCHON_SERVER_PORT=8181
      - ARCHON_SERVER_PORT=8181
      - HOST=${HOST:-localhost}
      - PROD=false
      - DOCKER_ENV=true
    networks:
      - app-network
    depends_on:
      archon-server:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3737"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Redis (for Open WebUI session state)
  redis:
    image: redis:7-alpine
    container_name: archon-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 3s
      retries: 3
    restart: unless-stopped

  # Open WebUI (Chat Interface)
  openwebui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: openwebui
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_BASE_URL=https://openrouter.ai/api/v1
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - WEBUI_AUTH=False
      - ENABLE_RAG_WEB_SEARCH=True
      - RAG_EMBEDDING_MODEL=text-embedding-3-small
      # Pre/post hooks (configure after n8n workflows created)
      - WEBUI_MIDDLEWARE_PREPROMPT_URL=https://n8n.bestviable.com/webhook/memory-assemble
      - WEBUI_MIDDLEWARE_POSTPROMPT_URL=https://n8n.bestviable.com/webhook/memory-writeback
    volumes:
      - openwebui-data:/app/backend/data
    networks:
      - app-network
    depends_on:
      - redis
      - archon-server
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  archon-data:
  redis-data:
  openwebui-data:
```

---

## Appendix B: Supabase SQL Monitoring Queries

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('postgres')) as db_size;

-- Table sizes (top 10)
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY size_bytes DESC
LIMIT 10;

-- Document count by source
SELECT
  s.url,
  s.source_type,
  COUNT(d.id) as doc_count,
  pg_size_pretty(SUM(pg_column_size(d.embedding))) as embedding_size
FROM sources s
LEFT JOIN documents d ON d.source_id = s.id
GROUP BY s.id, s.url, s.source_type
ORDER BY doc_count DESC;

-- Recent growth (last 30 days)
SELECT
  DATE(created_at) as date,
  COUNT(*) as new_documents,
  pg_size_pretty(SUM(pg_column_size(embedding))) as new_embeddings_size
FROM documents
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Settings check
SELECT key, value, is_encrypted, category
FROM archon_settings
WHERE category IN ('rag_strategy', 'server_config')
ORDER BY category, key;
```

---

## Appendix C: n8n Workflow Templates

See Section "Phase 2B: Open WebUI + n8n Integration" for complete workflow JSON.

---

## Next Actions

### Immediate (This Week)

1. [ ] Create Supabase account and project
2. [ ] Create Redis Cloud account and database
3. [ ] Obtain OpenAI API key (if not already have)
4. [ ] Test Archon locally on MacBook:
   ```bash
   cd ~/workspace/archon
   cp .env.example .env
   # Edit .env with credentials
   docker compose up --build -d
   # Test at http://localhost:3737
   ```

### Week 1-2 (Phase 2A)

5. [ ] Deploy Archon to droplet (follow Phase 2A steps)
6. [ ] Configure Cloudflare Access policies
7. [ ] Test web crawl and search
8. [ ] Monitor Supabase usage for 1 week

### Week 3-4 (Phase 2B)

9. [ ] Deploy Open WebUI
10. [ ] Create n8n workflows (memory assemble, writeback, health check)
11. [ ] Wire Open WebUI hooks
12. [ ] Test end-to-end chat flow

### Week 4-5 (Phase 2C)

13. [ ] Deploy custom MCP servers (Coda, GitHub, Firecrawl)
14. [ ] Configure Claude Code MCP connections
15. [ ] Test tool execution from Claude Code

### Week 6-8 (Stabilization)

16. [ ] Monitor all services for stability
17. [ ] Optimize resource usage
18. [ ] Document any issues/solutions
19. [ ] Create runbook for common operations

### Future (Phase 3)

20. [ ] Implement Archon ↔ Coda sync workflows
21. [ ] Deploy Letta agents (if needed)
22. [ ] Scale Supabase to Pro tier (when needed)
23. [ ] Explore self-hosted options if cost exceeds $50/mo

---

**Version**: 0.1
**Last Updated**: 2025-11-05
**Status**: Ready for implementation
**Next Review**: After Phase 2A completion
