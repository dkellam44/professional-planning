# Network Wiring Diagram v2 - Production Architecture

This diagram illustrates the production network architecture implementing the SyncBricks pattern with nginx-proxy auto-discovery, acme-companion SSL management, and token-based Cloudflare Tunnel.

## Network Architecture Overview

```mermaid
graph TD
    subgraph User["User Client"]
        A[Browser / Claude Code]
        B["Request: https://n8n.bestviable.com<br/>or<br/>https://coda.bestviable.com"]
    end

    subgraph CloudflareEdge["Cloudflare Edge Network"]
        C["Cloudflare DNS<br/>(n8n → tunnel CNAME)<br/>(coda → tunnel CNAME)"]
        D["Cloudflare WAF / CDN<br/>(TLS Termination)"]
        E["Secure Tunnel Endpoint<br/>(Tunnel: bestviable-droplet)"]
    end

    subgraph DropletNetwork["DigitalOcean Droplet<br/>(Single Source of Truth)"]

        subgraph ProxyNetwork["PROXY NETWORK<br/>(Public-Facing)"]
            F["cloudflared<br/>(Tunnel Client)<br/>━━━━━━━━━<br/>Authenticates with:<br/>CF_TUNNEL_TOKEN"]
            G["nginx-proxy<br/>(Reverse Proxy)<br/>━━━━━━━━━<br/>Auto-discovers via<br/>docker.sock"]
            H["acme-companion<br/>(SSL Auto-Renewal)<br/>━━━━━━━━━<br/>Watches for<br/>LETSENCRYPT_HOST"]
            I["n8n:5678<br/>(Automation Engine)"]
            J["coda-mcp:8080<br/>(HTTP MCP Server)"]
        end

        subgraph BackendNetwork["BACKEND NETWORK<br/>(Internal Only)"]
            K["postgres:5432<br/>(Database)<br/>━━━━━━━━━<br/>n8n data<br/>(ISOLATED)"]
            L["qdrant:6333<br/>(Vector Store)<br/>━━━━━━━━━<br/>AI/semantic search<br/>(ISOLATED)"]
        end

        M["Volumes:<br/>• ./data/postgres<br/>• ./data/n8n<br/>• ./data/qdrant<br/>• ./certs<br/>• ./acme"]
    end

    subgraph ExternalServices["External Services"]
        N["Coda.io<br/>(REST API)"]
        O["Other APIs<br/>(Webhooks, etc)"]
    end

    %% Data Flow
    A --> B
    B --> C
    C --> D
    D --> E
    E -->|Secure Tunnel<br/>Outbound Only| F

    F --> G
    G --> H

    G -->|Route by<br/>VIRTUAL_HOST| I
    G -->|Route by<br/>VIRTUAL_HOST| J

    I -.->|Backend Network<br/>(syncbricks)| K
    I -.->|Backend Network<br/>(syncbricks)| L

    J -.->|Backend Network<br/>Optional| K
    J -.->|Backend Network<br/>Optional| L

    I --> N
    I --> O
    J --> N

    %% Styling
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#f9f,stroke:#333,stroke-width:1px,font-size:11px

    style C fill:#bbf,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
    style E fill:#bbf,stroke:#333,stroke-width:2px

    style F fill:#cfc,stroke:#333,stroke-width:2px
    style G fill:#cfc,stroke:#333,stroke-width:2px
    style H fill:#cfc,stroke:#333,stroke-width:2px
    style I fill:#cfc,stroke:#333,stroke-width:2px
    style J fill:#cfc,stroke:#333,stroke-width:2px

    style K fill:#fcc,stroke:#333,stroke-width:2px
    style L fill:#fcc,stroke:#333,stroke-width:2px

    style M fill:#fff,stroke:#999,stroke-width:1px,stroke-dasharray: 5 5

    style N fill:#ffc,stroke:#333,stroke-width:2px
    style O fill:#ffc,stroke:#333,stroke-width:2px
```

---

## Network Flow Explanation

### 1. Request Initiation
- **User:** Makes HTTPS request to `https://n8n.bestviable.com`
- **Browser:** Uses Cloudflare DNS servers to resolve domain
- **Resolution:** DNS returns Cloudflare edge IP (not droplet IP - **security benefit**)

### 2. Cloudflare Edge Processing
- **WAF:** Cloudflare Web Application Firewall inspects request
- **TLS:** Cloudflare terminates external TLS connection
- **Routing:** Routes traffic to tunnel endpoint for `bestviable-droplet`

### 3. Secure Tunnel (Outbound Only)
- **cloudflared client** on droplet maintains persistent outbound connection to Cloudflare
- **Tunnel authentication:** Uses `CF_TUNNEL_TOKEN` (passed via environment variable)
- **No inbound exposure:** Droplet has NO open ports to internet
- **Security:** Personal laptop IP completely hidden (no longer exposed)

### 4. Reverse Proxy Routing
- **cloudflared** receives traffic from tunnel
- **Forwards to:** `nginx-proxy` on localhost:80
- **nginx-proxy** uses auto-discovery pattern:
  - Monitors `/var/run/docker.sock` for container changes
  - Reads `VIRTUAL_HOST` environment variable from services
  - Dynamically generates nginx config
  - Routes `Host: n8n.bestviable.com` → n8n:5678
  - Routes `Host: coda.bestviable.com` → coda-mcp:8080

### 5. SSL Certificate Management
- **acme-companion** monitors for `LETSENCRYPT_HOST` labels
- **Automatic process:**
  1. Detects new service with label
  2. Requests certificate from Let's Encrypt
  3. Stores in `./certs/` volume
  4. Notifies nginx-proxy to reload config
  5. Auto-renews 30 days before expiry
- **Result:** No manual certificate management needed

- **n8n:** Handles automation workflows
  - Connects to postgres (backend network only)
  - Connects to qdrant (backend network only)
  - Accessible externally via nginx-proxy

- **coda-mcp (HTTP-native):** Directly serves MCP over HTTP/SSE
  - Listens on 8080
  - Accessible externally via nginx-proxy (no separate gateway container)
  - Makes API calls to coda.io

### 7. Backend Network Isolation
- **Two Docker networks:**
  - **proxy:** nginx-proxy, acme-companion, cloudflared, n8n, coda-mcp
  - **syncbricks:** postgres, qdrant, n8n, coda-mcp

- **Security benefit:** Database only accessible from services in backend network
  - postgres NOT accessible from cloudflared or nginx-proxy
  - No direct internet access to database
  - Network-level security boundary

### 8. Data Persistence
- **Volumes:** Docker volumes mounted for data persistence
  - `./data/postgres/` - n8n database
  - `./data/n8n/` - n8n configuration and workflows
  - `./data/qdrant/` - Vector embeddings
  - `./certs/` - SSL certificates
  - `./acme/` - Let's Encrypt account data

### 9. External API Communication
- **n8n** makes outbound calls to:
  - Coda.io (Coda API)
  - Other external services (webhooks, integrations)
- **coda-mcp (HTTP-native)** calls:
  - Coda.io REST API
- **cloudflared** calls:
  - Cloudflare infrastructure (tunnel heartbeat)

---

## Request Flow Example: n8n Access

```
Step 1: Browser Request
├─ User: https://n8n.bestviable.com
└─ Method: GET

Step 2: DNS Resolution
├─ Resolver: Cloudflare nameserver
├─ Query: "What IP for n8n.bestviable.com?"
└─ Response: Cloudflare edge IP (0.0.0.0/0 globally anycast)

Step 3: Cloudflare Edge
├─ Receives: HTTPS traffic
├─ TLS: Terminates (decrypts)
├─ WAF: Inspects request
└─ Routes: To tunnel endpoint "bestviable-droplet"

Step 4: Cloudflare Tunnel
├─ cloudflared client: Receives request
├─ Authentication: Verified via CF_TUNNEL_TOKEN
└─ Forwards: To localhost:80 (nginx-proxy)

Step 5: nginx-proxy
├─ Reads: Host header = "n8n.bestviable.com"
├─ Looks up: VIRTUAL_HOST label on services
├─ Finds: n8n service with VIRTUAL_HOST=n8n.bestviable.com
└─ Forwards: To http://n8n:5678

Step 6: n8n
├─ Receives: HTTP request
├─ Processes: n8n login page
└─ Returns: HTML response

Step 7: Response Path (Reverse)
├─ n8n → nginx-proxy
├─ nginx-proxy → cloudflared (via localhost)
├─ cloudflared → Cloudflare tunnel
├─ Cloudflare → TLS re-encryption
└─ Browser: HTTPS response received
```

---

## Service Dependencies & Startup Order

```
docker-compose ensures proper startup sequence:

1. nginx-proxy starts first
   └─ Listens on 80/443
   └─ Ready to proxy traffic

2. acme-companion starts
   └─ Monitors for LETSENCRYPT_HOST labels
   └─ Depends on nginx-proxy

3. postgres starts (health check)
   └─ Waits until `pg_isready` succeeds
   └─ Ready for connections

4. qdrant starts (health check)
   └─ Waits until API responds
   └─ Ready for connections

5. n8n starts (health check)
   └─ Depends on: postgres healthy ✓
   └─ Depends on: qdrant healthy ✓
   └─ Connects to postgres
   └─ nginx-proxy auto-discovers via docker.sock
   └─ acme-companion generates certificate
   └─ Ready for external traffic

6. coda-mcp starts (health check)
   └─ Depends on: n8n running (loose dependency)
   └─ nginx-proxy auto-discovers
   └─ acme-companion generates certificate
   └─ Ready for external traffic

7. cloudflared starts last
   └─ Depends on: nginx-proxy healthy ✓
   └─ Establishes tunnel to Cloudflare
   └─ Tunnel status: HEALTHY
   └─ Traffic can now flow
```

---

## Security Architecture

### Layers of Security

```
Internet (Untrusted)
  ↓
Cloudflare WAF (Inspection)
  ↓
Cloudflare Tunnel (Encrypted)
  ↓
cloudflared client (Auth: CF_TUNNEL_TOKEN)
  ↓
localhost:80 (No internet exposure)
  ↓
nginx-proxy (TLS termination)
  ↓
Service containers (Private IPs)
  ↓
Backend network (No internet access)
```

### Network Isolation

**Public-Facing Services (proxy network):**
- cloudflared ← Internet-connected
- nginx-proxy ← Internet-connected
- acme-companion ← Manages certs
- n8n ← External access via nginx-proxy
- coda-mcp ← External access via nginx-proxy

**Backend Services (syncbricks network):**
- postgres ← Database (NO internet access)
- qdrant ← Vector store (NO internet access)

**Network Rule:**
- Services on `proxy` network cannot directly reach `syncbricks` network
- Services on `syncbricks` network can reach `proxy` network
- Result: Database NOT accessible from internet-facing services

---

## Comparison: Before vs After

### Before (Current - Insecure)
```
User Browser
  ↓
Cloudflare DNS
  ↓
Laptop cloudflared tunnel
  ↓ PROBLEM: Exposes home network IP
Your Laptop (must stay online)
  ↓
localhost:8080 (MCP Gateway incomplete)
  ↓
Caddy (manual config)
  └─ n8n (partially working)
```

**Issues:**
- 🔴 Personal IP exposed to internet
- 🔴 Laptop must stay online
- 🟠 Manual Caddy configuration
- 🟠 Incomplete Coda deployment

### After (Production - Secure)
```
User Browser
  ↓
Cloudflare DNS
  ↓
Cloudflare Tunnel (encrypted)
  ↓ SECURE: Personal IP hidden
DigitalOcean Droplet
  ↓
cloudflared + nginx-proxy (auto-discovery)
  ├─ n8n (via label)
  ├─ coda-mcp (via label)
  └─ acme-companion (auto-SSL)
```

**Benefits:**
- 🟢 Zero personal IP exposure
- 🟢 Droplet-based (always available)
- 🟢 Auto-configuration via labels
- 🟢 Complete multi-service deployment
- 🟢 Automatic SSL certificates
- 🟢 Scales trivially to 10+ services

---

## Adding a New Service

With nginx-proxy auto-discovery, adding a new service is trivial:

```yaml
# In docker-compose.production.yml
services:
  new-service:
    image: new-service:latest
    networks:
      - proxy           # IMPORTANT: attach to proxy network
      - syncbricks      # Optional: if needs backend access
    environment:
      - VIRTUAL_HOST=new-service.bestviable.com
      - LETSENCRYPT_HOST=new-service.bestviable.com
    labels:
      - "com.github.jrcs.letsencrypt_nginx_proxy_companion.main=new-service.bestviable.com"
```

**What happens automatically:**
1. Service starts on proxy network
2. nginx-proxy sees VIRTUAL_HOST label
3. Generates nginx config for routing
4. acme-companion sees LETSENCRYPT_HOST
5. Requests Let's Encrypt certificate
6. Service is immediately accessible at https://new-service.bestviable.com
7. Zero manual configuration needed

---

## Health Checks & Monitoring

Each service includes health checks for production reliability:

```
Service          Health Check              Interval    Timeout   Retries
─────────────────────────────────────────────────────────────────────
nginx-proxy      curl /health              30s         10s       3
acme-companion   cert file exists          300s        10s       1
cloudflared      tunnel info              60s         10s       3
postgres         pg_isready               10s         5s        5
qdrant           curl /health             30s         10s       3
n8n              curl /health             30s         10s       3
coda-mcp         curl /health             30s         10s       3
```

**Docker Compose Behavior:**
- Services with `condition: service_healthy` wait for dependencies
- Health check failures trigger service restart
- Logs available via `docker logs <service-name>`

---

## Data Flow Summary

| Flow | Source | Target | Protocol | Security |
|------|--------|--------|----------|----------|
| User → Service | Browser | nginx-proxy | HTTPS | TLS via Cloudflare |
| Internet → Tunnel | Cloudflare | cloudflared | Encrypted | Cloudflare tunnel |
| Tunnel → Proxy | cloudflared | nginx-proxy | HTTP | Localhost only |
| Proxy → Service | nginx-proxy | n8n / coda-mcp | HTTP | Internal network |
| Service → DB | n8n | postgres | SQL | Backend network |
| Service → API | n8n / coda-mcp | Coda.io | HTTPS | Outbound TLS |

---

## Volume Mounting Strategy

**Persistent Data:**
```
Host Machine              Docker Container
─────────────────────────────────────────────
./data/postgres/   ←→  /var/lib/postgresql/data
./data/n8n/        ←→  /home/node/.n8n
./data/qdrant/     ←→  /qdrant/storage
./certs/           ←→  /etc/nginx/certs
./acme/            ←→  /etc/acme.sh
```

**Benefits:**
- Data persists across container restarts
- Easy backup (copy `./data/` directory)
- Easy restore (restore `./data/` directory)
- Database migrations handled by n8n/postgres

---

**Diagram Version:** v2 (Production - SyncBricks Pattern)
**Last Updated:** 2025-10-26
**Related Documentation:**
- `/docs/infrastructure/syncbricks_solution_breakdown_v1.md` - Pattern explanation
- `/docs/infrastructure/droplet_migration_procedure_v1.md` - Deployment steps
- `/docs/infrastructure/cloudflare_tunnel_token_guide_v1.md` - Token setup
- `/ops/docker-compose.production.yml` - Production configuration
