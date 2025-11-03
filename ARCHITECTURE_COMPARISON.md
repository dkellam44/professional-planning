- entity: infrastructure
- level: documentation
- zone: internal
- version: v1.0
- tags: [architecture, nginx, n8n, mcp]
- source_path: /ARCHITECTURE_COMPARISON.md
- date: 2025-11-02

---

# Architecture Comparison: Current vs. Proposed

## Current Setup (Broken - To Be Replaced)

```
┌─────────────────────────────────────────────────────────┐
│              nginx-proxy (nginxproxy/*) ❌              │
│              docker-gen template engine                 │
│              (refuses to recognize labels)              │
└─────────────────────────────────────────────────────────┘
                         ↓
           ┌─────────────┴──────────────┐
           ↓                            ↓
    ┌────────────────┐        ┌─────────────────┐
    │  n8n service   │        │  Cloudflare     │
    │  (unreachable  │        │  Tunnel         │
    │   externally)  │        │  (works but     │
    └────────────────┘        │   no reverse    │
           ↓                  │   proxy)        │
    ┌────────────────┐        │                 │
    │  PostgreSQL    │        │                 │
    │  Qdrant        │        │                 │
    │  (backend)     │        └─────────────────┘
    └────────────────┘
                        ↑
        Legacy MCP Services (⚠️ mixed in)
```

**Problems**:
- ❌ docker-gen doesn't recognize n8n labels
- ❌ nginx returns 503 for n8n.bestviable.com
- ❌ External HTTPS completely broken
- ❌ MCP services mixed with n8n (bloated)
- ❌ Internal port 5678 works (proves n8n is fine)

---

## Proposed Phase 1: Clean N8N Foundation

```
┌─────────────────────────────────────────────────────────┐
│              nginx-proxy (jwilder/*) ✅                 │
│              Simple label matching                      │
│              (proven, reliable)                         │
└─────────────────────────────────────────────────────────┘
                         ↓
           ┌─────────────┴──────────────┐
           ↓                            ↓
    ┌────────────────┐        ┌─────────────────┐
    │  n8n service   │        │  acme-companion │
    │  VIRTUAL_HOST  │        │  (certs auto)   │
    │  (recognized!) │        │                 │
    └────────────────┘        └─────────────────┘
           ↓                            ↑
    ┌────────────────┐        ┌─────────────────┐
    │  PostgreSQL    │        │  cloudflared    │
    │  Qdrant        │        │  (CF tunnel)    │
    │  n8n-import    │        │                 │
    │  (backend)     │        └─────────────────┘
    └────────────────┘

Result:
✅ n8n.bestviable.com → 200 OK
✅ All services healthy
✅ HTTPS working via nginx
✅ CF tunnel provides remote access
✅ Clean, isolated, proven setup
```

**Improvements**:
- ✅ jwilder/nginx-proxy recognizes labels
- ✅ External HTTPS access works
- ✅ PostgreSQL 16-alpine (lighter)
- ✅ n8n:1.83.2 (pinned version)
- ✅ n8n-import for workflow restoration
- ✅ Qdrant health checks tuned
- ✅ Clean separation (no legacy code)

---

## Proposed Phase 2: Separate MCP Layer

### Option A: With nginx-proxy (future enhancement)

```
        Internet
            ↓
    Cloudflare Tunnel
            ↓
    ┌───────┴───────┐
    ↓               ↓
n8n Stack        MCP Stack
┌─────────┐      ┌──────────────┐
│ nginx   │      │ mcp-nginx    │
│ (8.9)   │      │ (optional)   │
└─────────┘      └──────────────┘
    ↓                ↓
┌─────────┐      ┌──────────────┐
│ n8n     │      │ coda-mcp     │
│ postgres│      │ github-mcp   │
│ qdrant  │      │ firecrawl-mcp│
└─────────┘      └──────────────┘
```

**When to add this**:
- If you need local HTTPS access to MCP
- If you need complex routing rules
- Not needed for current design

---

### Option B: Without nginx (CURRENT PLAN)

```
        Internet
            ↓
    Cloudflare Tunnel
            ↓ (routes by hostname)
    ┌───────┬───────┬──────────┐
    ↓       ↓       ↓          ↓
   n8n   coda-mcp github-mcp firecrawl-mcp
  :5678   :8085    :8081      :8084

Result:
✅ Simpler (no proxy layer for MCP)
✅ Direct routing (CF handles HTTPS)
✅ Each service isolated
✅ Can add nginx later if needed
✅ Lower complexity = fewer bugs
```

**Architecture**:
```
Phase 1 Stack (n8n)           Phase 2 Stack (MCP)
┌─────────────────────┐       ┌─────────────────────┐
│ nginx-proxy         │       │ (No reverse proxy)  │
│ acme-companion      │       │                     │
│ cloudflared         │       │ cloudflared         │
│ n8n:5678            │       │ (uses tunnel)       │
│ postgres            │       │                     │
│ qdrant              │       │ coda-mcp:8085       │
│ n8n-import          │       │ github-mcp:8081     │
└─────────────────────┘       │ firecrawl-mcp:8084  │
     Port: 443                │                     │
   /root/portfolio/           │ /root/portfolio/    │
   infra/n8n/                 │ infra/mcp-servers/  │
                              └─────────────────────┘
                                  Ports: 8081-8089
```

---

## CloudFlare Tunnel Routing (Phase 2)

Single tunnel routes to both stacks using DNS:

```
Public Hostname Routing:

n8n.bestviable.com
    ↓
    Cloudflare Tunnel
    ↓
    localhost:443  (nginx from Phase 1 stack)
    ↓
    n8n:5678

---

coda-mcp.bestviable.com
    ↓
    Cloudflare Tunnel
    ↓
    localhost:8085  (direct to coda-mcp)
    ↓
    coda-mcp container

github-mcp.bestviable.com
    ↓
    Cloudflare Tunnel
    ↓
    localhost:8081  (direct to github-mcp)
    ↓
    github-mcp container

firecrawl-mcp.bestviable.com
    ↓
    Cloudflare Tunnel
    ↓
    localhost:8084  (direct to firecrawl-mcp)
    ↓
    firecrawl-mcp container
```

---

## Comparison Table

| Aspect | Current (Broken) | Phase 1 (Proposed) | Phase 2 (Proposed) |
|--------|-----------------|-------------------|-------------------|
| **N8N Access** | 503 ❌ | 200 OK ✅ | (no change) |
| **Nginx** | nginxproxy ❌ | jwilder ✅ | None (direct) |
| **MCP Location** | Mixed in | Separate | Separate |
| **External Access** | Broken | Tunnel + nginx | Tunnel (direct) |
| **Complexity** | High ❌ | Medium ✅ | Low ✅ |
| **Future Expandable** | No | Yes | Yes |
| **OAuth Ready** | No | Partial | Yes ✅ |

---

## Why This Design is Future-Proof

### 1. MCP Standards Still Evolving (Nov 2025)
- OAuth flows being standardized
- Streaming HTTPS specs in development
- Keep MCP separate until standards firm

### 2. Easy to Add nginx Later
```bash
# If needed, add to /infra/mcp-servers/docker-compose.yml:
  mcp-nginx-proxy:
    image: jwilder/nginx-proxy
    # ... config ...

# No rebuild of n8n stack needed
# Just add and re-route CF tunnel
```

### 3. Can Upgrade Either Stack Independently
```bash
# Upgrade n8n without touching MCP
cd /root/portfolio/infra/n8n
docker-compose up -d --no-deps --build

# Upgrade MCP without touching n8n
cd /root/portfolio/infra/mcp-servers
docker-compose up -d --no-deps --build
```

### 4. Scales to Multiple Stacks
```
Future possibility (not now):
- n8n stack (workflows)
- MCP servers stack (integrations)
- Background jobs stack (long-running)
- Redis cache stack (performance)

All behind same CF tunnel, all independent.
```

---

## Network Isolation

### Phase 1 Networks
```
proxy network (external-facing):
  - nginx-proxy
  - acme-companion
  - cloudflared
  - n8n (bridges to backend)

syncbricks network (backend-only):
  - postgres
  - qdrant
  - n8n (bridges to proxy)
  - n8n-import
```

### Phase 2 Networks
```
mcp-network (isolated):
  - coda-mcp
  - github-mcp
  - firecrawl-mcp
  - (no nginx)

Note: MCP services don't connect to n8n network
      They're completely isolated
      Communication via HTTP/HTTPS only (if needed)
```

---

## Data Flow Examples

### N8N Webhook Request (Phase 1)

```
External Client
    ↓ (HTTPS)
Cloudflare Tunnel
    ↓ (HTTP to localhost:443)
nginx-proxy
    ↓ (reverse proxy to n8n:5678)
n8n service
    ↓ (processes webhook)
PostgreSQL
    ↓ (stores execution)
Qdrant (optional)
    ↓ (stores vectors)
```

### MCP API Call (Phase 2)

```
External Client
    ↓ (HTTPS)
Cloudflare Tunnel
    ↓ (HTTP to localhost:8085)
coda-mcp service
    ↓ (handles request)
CODA_API_TOKEN
    ↓
Coda API
    ↓ (returns data)
```

---

## Rollback Path

If anything breaks during deployment:

```
Phase 1 Rollback:
  1. Stop new stack: docker-compose down -v
  2. Restore database from backup
  3. Deploy old compose file from git
  4. Verify services running
  5. Data intact (backups)

Cost: ~30 minutes of downtime
```

---

## Summary: Why This Approach

✅ **Uses proven patterns** (syncbricks is battle-tested)
✅ **Solves the immediate problem** (nginx issue fixed)
✅ **Scales for future** (separate MCP stack)
✅ **Standards-compliant** (follows MCP evolution)
✅ **OAuth-ready** (no proxy in front of MCP)
✅ **Low complexity** (fewer moving parts)
✅ **Independently deployable** (upgrade n8n without MCP)
✅ **Graceful fallback** (CF tunnel is primary access)

---

**Decision**: Proceed with Phase 1 (jwilder nginx) + Phase 2 (direct tunnel MCP)
