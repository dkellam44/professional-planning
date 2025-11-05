
# 🧠 Personal AI Memory & Control Plane (DO Droplet - OpenMemory + Letta + OpenWeb UI + n8n)

A concise architectural canvas to orchestrate **personal LLM workflows**, **persistent memory**, and **agent tooling** on a tiny droplet—now including **Letta** for agents and **OpenMemory** for durable memory.
**Baseline:** DigitalOcean tiny droplet, **Cloudflare Zero Trust Tunnel + Nginx reverse proxy** (syncbricks/n8n style), **n8n already running**.

---

## 🎯 Goals

* Centralize **memory & context** across clients
* Keep compute **off-box** (use APIs / burst GPU)
* Add **Open WebUI**, **Letta (cloud/OSS)**, **OpenMemory (self-host or remote)**
* Stay lean on a **2 GB** droplet (use swap + managed services)

---

## ⚙️ System Overview

| Layer | Purpose | Deployment |
|-------|----------|-------------|
| **Frontend** | Chat UI and control panel for all workflows | Open WebUI (Docker) on your existing 2 GB Droplet |
| **Reverse Proxy / Secure Access** | TLS termination, routing, Zero Trust access | Nginx + Cloudflare Tunnel |
| **Automation Engine** | Orchestrate tasks, routing, and memory I/O | n8n (Docker) |
| **Memory Orchestrator** | Agentic coordination between memory layers, tools, and workflows | Letta (Cloud / OSS) + n8n integration |
| **Memory Backend** | Persistent and vectorized memory store | Postgres + pgvector / Qdrant Cloud |
| **Short-term State** | Working memory, cache, locks | Redis Cloud (free tier) |
| **LLM Inference** | Primary inference via API; optional GPU burst | OpenRouter / Portkey / RunPod GPU (on-demand) |
| **Tools & Connectors** | MCP servers for APIs, data, and automations | Cloudflare Agents (default) + optional self-hosted MCP |
| **Deployment Platform** | Container orchestration and service lifecycle management | Dokploy (on-droplet) |

---

## 🧩 Memory Architecture

### Memory Types

| Type | Example Use | Persistence | Backend |
|------|--------------|-------------|----------|
| **Profile / Entity** | Client name, goals, preferences | Long-term | Postgres |
| **Knowledge Chunks** | Docs, summaries, reference data | Long-term (embedded) | pgvector / Qdrant |
| **Episodic** | Key events or decisions | Medium-term | Postgres |
| **Working Memory** | Active conversation or workflow state | Short-term (TTL) | Redis / Postgres |

**Core Tables (pgvector)**  
- `client` (id, name, pii)  
- `client_profile` (client_id, key, value)  
- `memory_chunk` (client_id, content, embedding vector(1536))  
- `episode` (client_id, summary, importance)  
- `working_state` (client_id, flow_id, state jsonb, expires_at)

**Embedding Flow**  

---

## 🔄 Memory Orchestration ( n8n + Letta Workflows )

### `/memory/assemble`
1. Receive `{client_id, query}`  
2. Embed query → search pgvector / Qdrant  
3. Retrieve top documents + recent episodes + profile data  
4. Trim + re-rank → return structured context JSON  

### `/memory/writeback`
1. Receive conversation transcript  
2. Extract new facts → upsert to `client_profile`  
3. Summarize outcomes → insert into `episode`  
4. Optionally embed and store new snippets  

### **Letta / OpenMemory Integration**
- Letta provides an agent layer for multi-step memory interactions and tool use.  
- OpenMemory self-host instance handles personal memory flows (episodic + contextual).  
- Memory updates and retrievals synchronize through Postgres / pgvector backplane.

---

## 🌙 Nightly Cron ( n8n Scheduled Task )
- Purge expired `working_state` entries  
- Archive low-importance episodes  
- Garbage-collect volatile memory chunks  
- Compact pgvector index / vacuum Postgres  

---

## 🔐 Network & Access Model
- All inbound traffic → **Cloudflare Zero Trust Tunnel**  
- **Nginx** handles internal routing to Docker services  
- Dokploy manages service lifecycle and container health  
- Internal API calls ( n8n ↔ Postgres ↔ Letta ) restricted to localhost network  

---

✅ **Key Goal:**  
Create a **self-contained memory orchestration environment** — resilient on a small droplet, expandable via cloud APIs, and capable of maintaining persistent, composable, contextual memory across your entire AI workflow ecosystem.

---


## 🧱 Layers & Where They Live

| Layer                | Role                               | Deploy                                                  |
| -------------------- | ---------------------------------- | ------------------------------------------------------- |
| **Ingress**          | Auth, public entry                 | **Cloudflare Zero Trust** (Access policies)             |
| **Edge tunnel**      | Private link to droplet            | **Cloudflare Tunnel** (cloudflared)                     |
| **Reverse proxy**    | Local routing/terminates CF tunnel | **Nginx** (syncbricks layout)                           |
| **Orchestrator**     | Webhooks, routing, glue            | **n8n** (already deployed)                              |
| **Chat UI**          | Manual chats, model picker         | **Open WebUI** (Docker)                                 |
| **Agents**           | GUI + stateful agents              | **Letta** (start Cloud; optional OSS later)             |
| **Durable memory**   | Cross-workflow memory              | **OpenMemory** (self-host minimal or separate micro-VM) |
| **Vectors/DB**       | Embeddings + metadata              | **Managed Postgres + pgvector** *or* **Qdrant Cloud**   |
| **Short-term state** | Cache, locks, queues               | **Redis Cloud** (free tier)                             |
| **Inference**        | Models                             | **OpenRouter / Portkey**; later **vLLM/TGI** on GPU VM  |
| **Blob store**       | Files, exports                     | **DO Spaces / S3**                                      |

---

## 🔌 Ingress & Routing (fits your current setup)

### Cloudflare Zero Trust

* Protect **/ui** (Open WebUI), **/n8n**, and any admin endpoints
* Device posture or One-time PIN for personal use
* Keep everything closed to the public internet except via CF Access

### Nginx (syncbricks pattern)

* vhosts (server blocks) per app; upstreams target **Docker networks**
* Example paths:

  * `/n8n` → `n8n:5678`
  * `/ui`  → `openwebui:8080`
  * `/mem` → `openmemory:PORT` (if co-located)
* Keep **Docker bridge network** `internal_net` for app-to-app

---

## 🧩 Minimal Compose Add-ons (beside your existing n8n stack)

> Keep your current `cloudflared` + `nginx` + `n8n` containers. Add:

```yaml
services:
  openwebui:
    image: open-webui/open-webui:main
    environment:
      - OPENAI_API_BASE_URL=https://openrouter.ai/api/v1  # or https://api.portkey.ai/v1
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    networks: [internal_net]
    restart: unless-stopped

  # Optional local OpenMemory (prefer a separate micro-VM if RAM is tight)
  openmemory:
    image: ghcr.io/caviraoss/openmemory:latest
    environment:
      - OM_STORAGE=sqlite    # or point to remote DB / Qdrant
      - OM_BIND=0.0.0.0:8620
    volumes:
      - om-data:/data
    deploy:
      resources:
        limits:
          memory: 512m
    networks: [internal_net]
    restart: unless-stopped

networks:
  internal_net:
    external: true  # reuse your existing internal network if you already created one

volumes:
  om-data:
```

**Nginx snippets (server blocks):**

```
location /ui/  { proxy_pass http://openwebui:8080/;  }
location /n8n/ { proxy_pass http://n8n:5678/;       }
location /mem/ { proxy_pass http://openmemory:8620/; }  # if co-located
```

> Gate these routes behind **Cloudflare Access**. Keep ports closed on the droplet firewall; only `cloudflared` talks out.

---

## 🔄 Orchestration Contracts (n8n)

* **/memory/assemble** → reads from **OpenMemory** (+ pgvector/Qdrant), optional Letta block → returns context JSON for prompts
* **/memory/writeback** → extracts facts/episodes → upserts to OpenMemory (+ updates Letta block if present)

Wire **Open WebUI** pre-/post-hooks to these n8n webhooks. Let **Letta** agents call the same endpoints when they run outside of Open WebUI.

---

## 🧠 Storage Choices (lean)

* Start with **managed**:

  * Postgres(+pgvector): **Supabase / Neon**
  * Vector: **Qdrant Cloud** (hobby) or just pgvector
  * Cache/queue: **Redis Cloud** (free)
* Use **DO Spaces/S3** for files (ingested docs, exports)

---

## 🛡️ Security & Ops

* **Cloudflare Access** for every admin/UI route
* Secrets via **env vars** or **CF Zero Trust service tokens** (no secrets in git)
* **Swap 2–4 GB** on droplet; low `CONCURRENCY` in n8n
* Monitor with `docker stats` (or Dozzle) + simple uptime checks
* Back up n8n data volume + OpenMemory data (if co-located)

---

## 🚀 Scale Path

1. **Now:** n8n + Open WebUI via Nginx/CF; memory via OpenMemory (small) + managed vector/DB; inference via OpenRouter/Portkey
2. **Soon:** Move OpenMemory to a **separate micro-VM** if RAM gets tight
3. **Later:** Add **GPU VM** with vLLM/TGI for heavy tasks; n8n flips inference base URL dynamically
4. **Optional:** Letta OSS on a second VM; keep cloud ADE for experimentation












# 🧠 Personal AI Control Plane (Dokploy-Managed) — with MCP

This extends your Dokploy canvas to include **Model Context Protocol (MCP) servers**, defaulting to **Cloudflare Agents-hosted MCP** with a **self-hosted fallback** (for a few tools you want to fully control).

---

## 🎯 Goals

* Keep your tiny DO droplet as a **lean control plane** (Open WebUI + n8n + OpenMemory).
* Offload **MCP tool servers** to **Cloudflare Agents** by default (edge scale, no droplet RAM).
* Self-host only a **small handful** of MCP servers (e.g., filesystem near OpenMemory, private DB) via **Dokploy**, behind Cloudflare Zero Trust.

---

## 🧱 Layers & Ownership (recap + MCP)

| Layer            | Role                                     | Runs Where                                                        |
| ---------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Ingress          | AuthN/AuthZ + tunnel                     | Cloudflare Zero Trust + `cloudflared`                             |
| Platform         | App & DB PaaS                            | **Dokploy** on droplet                                            |
| Reverse Proxy    | Nginx (current) **or** Dokploy’s Traefik | Droplet                                                           |
| Orchestrator     | Webhooks, routing, glue                  | **n8n** (Dokploy)                                                 |
| Chat UI          | Manual chats, model picker               | **Open WebUI** (Dokploy)                                          |
| Agents           | Stateful agents + ADE                    | **Letta Cloud** (OSS later)                                       |
| Durable Memory   | Cross-workflow memory                    | **OpenMemory** (Dokploy or small VM)                              |
| Vectors/DB       | Embeddings + metadata                    | Postgres(+pgvector)/Qdrant (Dokploy or managed)                   |
| Short-term State | Cache/locks/queues                       | Redis (Dokploy or managed)                                        |
| Inference        | Models                                   | OpenRouter/Portkey; GPU VM later                                  |
| **MCP Servers**  | **Tools** (web, calendar, FS, DB, etc.)  | **Cloudflare Agents (default)** + **Self-hosted few via Dokploy** |

---

## 🌐 MCP Transport & Auth (standard)

* **Transport:** Prefer **streamable-HTTP** (`POST /mcp`); keep **SSE** (`GET /sse`) only for legacy clients.
* **Auth:** **OAuth 2.1** / OIDC (per-user consent) for sensitive scopes; otherwise Cloudflare Access service tokens for internal-only tools.
* **Namespace:** Always include `client_id` and `agent_id` in MCP server config and calls to enforce tenant isolation.

---

## 🧩 Default: Cloudflare Agents-hosted MCP

**Why:** zero load on droplet, edge latency, built-in patterns for streamable-HTTP and OAuth, easy Zero Trust integration.

**Examples to host on Cloudflare:**

* Web fetch/scrape, HTTP requester, calendar/email bridges, GitHub/Jira, public API wrappers.
* Any MCP that doesn’t need your local disk or private subnet.

**Routing**

```
Client (Open WebUI / Letta / n8n)
  → Cloudflare Access (user login)
  → Cloudflare Worker/Agent (MCP server)
  → Target tool/API
```

**Zero Trust**

* Protect MCP endpoints with CF Access policies (email/OTP or device posture).
* Issue short-lived tokens to the client (Letta/Open WebUI) via OAuth or Access JWT.

---

## 🏠 Self-Hosted MCP (Dokploy) — for a Few Controlled Tools

**When to self-host:** tools needing local FS near OpenMemory, private Postgres reads, or intra-VPC resources.

**Service pattern (Docker/Dokploy):**

* Expose:

  * `POST /mcp`  → streamable HTTP
  * `GET  /sse`  → (optional) SSE transport
* Auth:

  * **Option A:** Cloudflare Access (JWT header validation in server)
  * **Option B:** OAuth 2.1 (Authorization Code w/ PKCE) against your IdP
* Network:

  * Join Dokploy’s internal network so the MCP can reach OpenMemory/Postgres directly.
* Security:

  * Per-scope allowlist (e.g., directories, SQL roles), audit logs to Postgres.

**Compose (sketch):**

```yaml
services:
  mcp-fs:
    image: your/mcp-fs:latest
    environment:
      - OM_URL=http://openmemory:8620
      - ALLOW_DIR=/data/client
      - AUTH_MODE=cf_access   # or oauth2
    networks: [internal_net]
    restart: unless-stopped
```

**Nginx (if keeping Nginx):**

```
location /mcp/fs/  { proxy_set_header CF-Access-Jwt-Assertion $http_cf_access_jwt_assertion;
                     proxy_pass http://mcp-fs:8080/; }
```

**Dokploy (if using Traefik):**

* Add service with route `mcp-fs.yourdomain` protected by Cloudflare Access.
* Configure env/secrets in Dokploy UI.

---

## 🔌 Orchestration: How MCP plugs into your flows

### Open WebUI

* Register MCP servers (Cloudflare + self-hosted) in the tools panel.
* **Pre-prompt hook** (calls `n8n /memory/assemble`) decides which MCP servers to enable per client/task.

### Letta (Agents)

* In agent configs, list MCP endpoints (Cloudflare default; add self-hosted FS/DB where needed).
* Use per-agent OAuth scopes; store tokens in Letta or request on first use.

### n8n

* Has two HTTP nodes:

  1. Call **MCP** (Cloudflare) for tools not needing local access.
  2. Call **MCP** (self-host) for local FS/DB actions.
* Include `client_id` + `agent_id` in all calls; log outcomes to `audit_log`.

---

## 🔐 Auth Matrix (pick per server)

| MCP Type                                         | Recommended Auth                            | Notes                             |
| ------------------------------------------------ | ------------------------------------------- | --------------------------------- |
| Public API wrappers                              | OAuth 2.1 (per user)                        | Least privilege; easy revoke      |
| Internal-only helpers (e.g., FS near OpenMemory) | CF Access JWT (service token)               | Keep private; path allowlist      |
| DB readers/writers                               | OAuth to your IdP **plus** SQL role scoping | Read replicas for safety          |
| Legacy clients (need SSE)                        | SSE + CF Access                             | Plan migration to streamable-HTTP |

---

## 📦 Minimal MCP Catalog (starting set)

* **Cloudflare (default):**

  * `mcp-http` (generic HTTP fetch with headers/robots compliance)
  * `mcp-web-scrape` (playwright-based snapshotting)
  * `mcp-calendar` / `mcp-gmail` (personal integrations with OAuth)
  * `mcp-github` (issues/PRs)
* **Self-host (few only):**

  * `mcp-fs` (read/pin docs under `/data/client/*` for RAG)
  * `mcp-sql` (parameterized SELECT/UPSERT to your Postgres memory)
  * `mcp-openmemory` (convenience wrapper for OpenMemory CRUD/search)

---

## 🔄 Memory-Oriented Flow (with MCP)

1. **Pre-prompt** (Open WebUI → `n8n /memory/assemble`):

   * Query OpenMemory/pgvector.
   * If missing context, call **Cloudflare MCP** web-fetch to capture page → embed → store.
   * If local files needed, call **self-hosted `mcp-fs`** to pull snippets path-limited to the client.
   * Return merged context JSON.

2. **Post-run** (Open WebUI → `n8n /memory/writeback`):

   * Extract facts/episodes → **OpenMemory upsert**.
   * If external actions taken via MCP, log tool results to `audit_log`.

---

## 🛡️ Guardrails & Limits

* **Rate limits:** Cloudflare WAF rules on MCP routes (burst QPS, token TTL).
* **Scopes:** Tool-specific allowlists (domains, directories, SQL schemas).
* **Audit:** `audit_log(client_id, tool, action, args_hash, at)` in Postgres.
* **Secrets:** Store API keys in Dokploy secrets or Cloudflare Workers KV; never in repos.
* **TTLs:** Expire OAuth tokens; rotate Access service tokens.

---

## ✅ TL;DR

* **Default** all MCP servers to **Cloudflare Agents** to keep the droplet light and secure.
* **Self-host** only a **select few** MCP servers (FS/DB) in **Dokploy**, fronted by **Cloudflare Access**, implementing **streamable-HTTP** (and SSE if needed).
* Wire everything through **n8n** and **Open WebUI** with `client_id`/`agent_id` so context stays isolated and auditable.
