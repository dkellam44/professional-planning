- entity: infrastructure
- level: documentation
- zone: internal
- version: v01
- tags: [infrastructure, docker, nginx-proxy, cloudflare, acme, technical-reference]
- source_path: /docs/infrastructure/syncbricks_solution_breakdown_v1.md
- date: 2025-10-26
- references: [https://github.com/syncbricks/n8n, jwilder/nginx-proxy documentation]

---

# SyncBricks Solution Breakdown - Technical Deep Dive

## Quick Reference

**Repository:** https://github.com/syncbricks/n8n
**Stars:** 32 | **Forks:** 14 | **Last Update:** April 2025
**Primary Technology:** Docker Compose with nginx-proxy + acme-companion
**Key Innovation:** Auto-discovery of services via Docker labels
**Best For:** Self-hosted automation stacks requiring secure public access

---

## Architecture Patterns Explained

### Pattern 1: nginx-proxy Auto-Discovery

**Traditional Approach (Manual):**
```nginx
# Edit nginx.conf manually
upstream n8n {
  server n8n:5678;
}
upstream coda_mcp {
  server coda_mcp_gateway:8080;
}
server {
  listen 80;
  server_name n8n.example.com;
  location / {
    proxy_pass http://n8n;
  }
}
server {
  listen 80;
  server_name coda.example.com;
  location / {
    proxy_pass http://coda_mcp;
  }
}
# ... repeat for every new service
```

**nginx-proxy Auto-Discovery Approach:**
```yaml
# Just declare in docker-compose!
services:
  n8n:
    environment:
      - VIRTUAL_HOST=n8n.example.com

  coda_mcp_gateway:
    environment:
      - VIRTUAL_HOST=coda.example.com

# nginx-proxy watches docker.sock and generates config automatically
```

**How nginx-proxy Works:**
1. Mounts Docker socket at runtime: `/var/run/docker.sock`
2. Watches for containers starting/stopping
3. Reads `VIRTUAL_HOST` environment variable from each container
4. Generates nginx config dynamically
5. Reloads nginx without downtime
6. Process repeats as containers are added/removed

**Benefits:**
- ✅ Add service = change docker-compose only
- ✅ No manual nginx configuration files
- ✅ Scales from 1 to 100+ services seamlessly
- ✅ Self-documenting (hostname in container config)
- ✅ Less error-prone than manual editing

---

### Pattern 2: Automatic SSL with acme-companion

**Traditional Approach (Manual):**
```bash
# Run certbot manually for each domain
certbot certonly --standalone -d n8n.example.com
certbot certonly --standalone -d coda.example.com
certbot renew  # Run monthly (cron job)
# Manual nginx config updates required
```

**acme-companion Approach:**
```yaml
services:
  acme-companion:
    image: nginxproxy/acme-companion
    environment:
      - DEFAULT_EMAIL=admin@example.com

  n8n:
    environment:
      - LETSENCRYPT_HOST=n8n.example.com
      - LETSENCRYPT_EMAIL=admin@example.com

  coda_mcp_gateway:
    environment:
      - LETSENCRYPT_HOST=coda.example.com
      - LETSENCRYPT_EMAIL=admin@example.com

# acme-companion watches for LETSENCRYPT_HOST labels
# Automatically requests and renews certificates
# Updates nginx config automatically
```

**How acme-companion Works:**
1. Watches Docker containers for `LETSENCRYPT_HOST` label
2. Contacts Let's Encrypt ACME API
3. Validates domain ownership (DNS/HTTP challenge)
4. Stores certificate in shared volume
5. Notifies nginx-proxy to reload
6. Sets up auto-renewal (30 days before expiration)
7. Renews automatically without any manual intervention

**Benefits:**
- ✅ Never manually run certbot
- ✅ Never manually renew certificates
- ✅ No cron jobs needed
- ✅ Certificates stored in Docker volumes (portable)
- ✅ Multi-domain certificates supported
- ✅ Failed renewal doesn't kill the stack

---

### Pattern 3: Token-Based Cloudflare Tunnel

**Traditional Approach (Config File):**
```yaml
# /root/.cloudflared/config.yml
tunnel: 123e4567-e89b-12d3-a456-426614174000
credentials-file: /root/.cloudflared/123e4567-e89b-12d3-a456-426614174000.json

ingress:
  - hostname: n8n.example.com
    service: http://localhost:80
  - hostname: coda.example.com
    service: http://localhost:80
  - service: http_status:404

# Start tunnel manually or via systemd
cloudflared tunnel run --config /root/.cloudflared/config.yml
```

**Token-Based Approach (SyncBricks):**
```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run --token YOUR_TOKEN_HERE
    # That's it! No config file needed
    # All routing is handled by nginx-proxy
```

**How Token-Based Tunnel Works:**
1. Obtain tunnel token from Cloudflare Zero Trust dashboard
2. Pass token directly in docker-compose command
3. cloudflared authenticates with token
4. Creates reverse tunnel to Cloudflare Edge
5. Cloudflare routes traffic based on DNS CNAME records
6. Traffic flows through nginx-proxy (which handles all routing)
7. If container restarts, tunnel automatically reconnects

**Advantages over Config File Approach:**
- ✅ No config file to manage
- ✅ One command line instead of multi-file setup
- ✅ No credentials file on disk (token is ephemeral)
- ✅ Easier token rotation (just restart container)
- ✅ Works better in containerized environments
- ✅ Integrates cleanly with Docker Compose secrets

**Why This Matters:**
- Config file approach requires copying credentials to server
- Token-based approach is more secure (no persistent secrets)
- Simpler to automate and reason about
- Aligns with cloud-native practices

---

### Pattern 4: Two-Network Design

**Single Network (Problematic):**
```yaml
networks:
  default:  # All services on same network

services:
  postgres:    # DB accessible to all
  n8n:         # Can see DB
  nginx-proxy: # Can also reach DB!
  cloudflared: # Exposed to internet
```

**Problems:**
- ❌ Database accessible from routing layer
- ❌ No network-level security boundaries
- ❌ Harder to reason about what can access what
- ❌ Violates principle of least privilege

**Two-Network Design (SyncBricks):**
```yaml
networks:
  syncbricks:  # Internal backend services
  proxy:       # Frontend/routing layer

services:
  # Backend - NOT exposed
  postgres:
    networks: ['syncbricks']  # Isolated from proxy

  qdrant:
    networks: ['syncbricks']  # Only n8n can reach

  # Application - dual network
  n8n:
    networks:
      - syncbricks  # Can reach postgres/qdrant
      - proxy       # Exposed via nginx

  # Routing - separate network
  nginx-proxy:
    networks: ['proxy']  # Cannot reach database

  cloudflared:
    networks: ['proxy']  # Internet-facing only

  acme-companion:
    networks: ['proxy']  # Only needs to talk to nginx
```

**Benefits:**
- ✅ Database network-isolated from internet-facing services
- ✅ Clear security boundary: backend ≠ proxy
- ✅ If proxy container compromised, database still protected
- ✅ Self-documenting (network assignment shows architecture)
- ✅ Scales to multi-tier applications (cache layer, etc.)

---

## Service-by-Service Breakdown

### Service: nginx-proxy

**Role:** Automatic reverse proxy with service discovery
**Image:** `jwilder/nginx-proxy`
**Port Mapping:** 80→80, 443→443 (listen on public ports)

**Key Configuration:**
```yaml
volumes:
  - /var/run/docker.sock:/tmp/docker.sock:ro  # READ-ONLY
  - certs:/etc/nginx/certs:ro                 # Certificates
  - acme:/etc/acme.sh                         # ACME data
```

**How to Use:**
1. Add `VIRTUAL_HOST=your-domain.com` to container
2. nginx-proxy auto-detects and creates reverse proxy
3. Traffic flows: Internet → nginx → container:internal_port

**Example:**
```yaml
my_app:
  image: my-app:latest
  environment:
    - VIRTUAL_HOST=myapp.example.com  # ← nginx watches for this
  # nginx automatically proxies myapp.example.com → my_app:8000
```

**Debugging:**
```bash
# Check generated nginx config
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf

# Check logs
docker logs nginx-proxy

# Test if service is accessible
curl -I http://localhost/  # Via nginx internally
curl -I https://myapp.example.com  # External test
```

---

### Service: acme-companion

**Role:** Automatic Let's Encrypt certificate management
**Image:** `nginxproxy/acme-companion`
**Parent Service:** Requires nginx-proxy to be running

**Key Configuration:**
```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
  - certs:/etc/nginx/certs          # Where certs stored
  - acme:/etc/acme.sh               # ACME state/credentials
environment:
  - DEFAULT_EMAIL=your@example.com  # For Let's Encrypt notifications
```

**How to Use:**
1. Add `LETSENCRYPT_HOST=your-domain.com` to container
2. acme-companion watches for this label
3. Requests certificate from Let's Encrypt
4. Stores in shared `certs` volume
5. nginx-proxy uses certificate automatically
6. Auto-renewal happens before expiration (30-day warning)

**Example:**
```yaml
my_app:
  image: my-app:latest
  environment:
    - VIRTUAL_HOST=myapp.example.com
    - LETSENCRYPT_HOST=myapp.example.com      # ← acme-companion watches
    - LETSENCRYPT_EMAIL=admin@example.com
  # Certificate automatically requested and renewed
```

**Debugging:**
```bash
# Check ACME state
docker logs acme-companion

# Verify certificates were created
docker exec nginx-proxy ls -la /etc/nginx/certs/

# Check certificate details
openssl x509 -in /path/to/cert.crt -text -noout

# Monitor renewal (search logs)
docker logs acme-companion | grep -i renew
```

---

### Service: PostgreSQL

**Role:** Persistent data store for n8n workflows and credentials
**Image:** `postgres:16-alpine`
**Network:** `syncbricks` (backend only, not exposed)

**Configuration:**
```yaml
postgres:
  image: postgres:16-alpine
  networks: ['syncbricks']  # NOT on proxy network
  environment:
    - POSTGRES_USER=amjid
    - POSTGRES_PASSWORD=amjid
    - POSTGRES_DB=n8ndb
  volumes:
    - postgres_storage:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U amjid -d n8ndb"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
  ports:
    - "5433:5432"  # Accessible only from docker host (for backups)
```

**Health Check Explained:**
- Command: `pg_isready -U amjid -d n8ndb`
- Interval: Check every 10 seconds
- Timeout: If query takes >5s, mark as failed
- Retries: Need 5 successful checks
- Start Period: Grace period of 30s after container starts
- Result: Docker knows when DB is truly ready

**Data Persistence:**
- `postgres_storage` volume stores actual data
- Survives container restart
- Can be backed up by saving volume contents

**Production Considerations:**
- Default credentials (`amjid`/`amjid`) MUST be changed
- Store in `.env` file (not in docker-compose.yml)
- Regular backups of `postgres_storage` volume
- Monitor disk space for growth

---

### Service: n8n

**Role:** Main automation workflow application
**Image:** `n8nio/n8n:1.83.2` (pinned version)
**Networks:** `syncbricks` (backend access) + `proxy` (public access)

**Configuration:**
```yaml
n8n:
  image: n8nio/n8n:1.83.2
  networks:
    - syncbricks  # Can reach postgres
    - proxy       # Exposed via nginx
  environment:
    - DB_TYPE=postgresdb
    - DB_POSTGRESDB_HOST=postgres        # Internal DNS name
    - DB_POSTGRESDB_USER=amjid
    - DB_POSTGRESDB_PASSWORD=amjid
    - DB_POSTGRESDB_DATABASE=n8ndb
    - N8N_ENCRYPTION_KEY=abc123123abc    # ⚠️ MUST BE RANDOM
    - N8N_USER_MANAGEMENT_JWT_SECRET=abc123123abc  # ⚠️ MUST BE RANDOM
    - WEBHOOK_URL=https://n8n.syncbricks.com/  # For webhooks
    - VIRTUAL_HOST=n8n.syncbricks.com          # nginx-proxy discovers
    - LETSENCRYPT_HOST=n8n.syncbricks.com      # SSL certificate
    - LETSENCRYPT_EMAIL=your@email.com
  volumes:
    - n8n_storage:/home/node/.n8n       # Workflows, settings
    - ./n8n/backup:/backup              # Import/export
    - ./shared:/data/shared             # Shared data
  depends_on:
    postgres:
      condition: service_healthy
    n8n-import:
      condition: service_completed_successfully
```

**Security Notes:**
- `N8N_ENCRYPTION_KEY` should be long random string (generate with `openssl rand -hex 32`)
- `N8N_USER_MANAGEMENT_JWT_SECRET` should be different random string
- Store in `.env` file, never commit to git
- The example values `abc123123abc` are insecure placeholders

**Workflow Between Services:**
1. Waits for postgres to report healthy
2. Waits for n8n-import container to complete
3. Starts with workflow/credential data already imported
4. Connects to postgres on `syncbricks` network
5. Exposes web UI via `VIRTUAL_HOST` to nginx-proxy
6. nginx-proxy proxies traffic from internet
7. acme-companion manages SSL certificate

---

### Service: n8n-import

**Role:** One-time data import (workflows and credentials)
**Image:** `n8nio/n8n:1.83.2` (same as n8n)
**Restart:** `no` (exits after completion)

**Purpose:**
- Runs once at startup
- Imports existing workflows from backup
- Imports existing credentials from backup
- Creates marker file (`/home/node/.n8n/import_done`)
- Exits (doesn't stay running)
- Main n8n waits for this completion before starting

**Workflow:**
```bash
# Inside n8n-import container:

# 1. Wait for postgres
while ! nc -z postgres 5432; do sleep 1; done

# 2. Import credentials (|| true means ignore errors)
n8n import:credentials --separate --input=/backup/credentials || true

# 3. Import workflows
n8n import:workflow --separate --input=/backup/workflows || true

# 4. Create marker file (signals completion to n8n)
touch /home/node/.n8n/import_done

# 5. Exit
exit 0
```

**Benefits:**
- Separates import logic from application runtime
- Prevents race conditions (n8n doesn't start until import done)
- Allows retry without restarting n8n
- Clear success/failure signal via marker file

**Usage:**
1. Place backup files in `./n8n/backup/credentials/` and `./n8n/backup/workflows/`
2. Start docker-compose
3. n8n-import runs, imports, exits
4. Main n8n starts with data already loaded

---

### Service: Qdrant

**Role:** Vector database for AI/semantic search
**Image:** `qdrant/qdrant`
**Network:** `syncbricks` (internal only)
**Status:** Optional - included for future AI integrations

**Configuration:**
```yaml
qdrant:
  image: qdrant/qdrant
  networks: ['syncbricks']  # NOT exposed
  ports:
    - 6333:6333  # Only accessible from docker host
  volumes:
    - qdrant_storage:/qdrant/storage  # Persistent vectors
  restart: unless-stopped
```

**When to Use:**
- Building AI-augmented workflows in n8n
- Semantic search across documents
- Vector embeddings storage
- RAG (Retrieval Augmented Generation) patterns

**Current Stack:** Included but not required
- n8n works fine without Qdrant
- Can be disabled if not needed
- Can be added later without stack changes

---

### Service: cloudflared

**Role:** Cloudflare Tunnel - secure public access
**Image:** `cloudflare/cloudflared:latest`
**Network:** `proxy`
**Restart:** `unless-stopped`

**Configuration (Token-Based):**
```yaml
cloudflared:
  image: cloudflare/cloudflared:latest
  container_name: cloudflared
  restart: unless-stopped
  networks: ['proxy']
  command: tunnel --no-autoupdate run --token YOUR_TOKEN_HERE
  volumes:
    - cloudflared_data:/etc/cloudflared
```

**How Tunnel Works:**
1. Client obtains token from Cloudflare dashboard
2. Container starts with token in command
3. cloudflared connects to Cloudflare Edge servers
4. Establishes persistent reverse tunnel
5. Traffic flow:
   ```
   User → Cloudflare Edge → Tunnel → nginx-proxy:80
   ```
6. cloudflared automatically reconnects if disconnected

**Obtaining Token:**
1. Go to Cloudflare Zero Trust dashboard
2. Create/select tunnel
3. Copy tunnel token (looks like: `eyJhIjoixxxx/xxxx==`)
4. Paste into docker-compose `command` field

**Benefits of Token Approach:**
- ✅ No credentials file on disk
- ✅ Token valid for limited time (set in dashboard)
- ✅ Easier to rotate tokens
- ✅ Works in ephemeral container environments
- ✅ Simpler than full config file setup

**Debugging:**
```bash
# Check tunnel status
docker logs cloudflared

# Verify tunnel is running
docker ps | grep cloudflared

# Check Cloudflare dashboard for active tunnels
# (Shows traffic stats and connection status)
```

---

## Complete Data Flow Example

**Request:** `curl https://n8n.syncbricks.com/`

```
1. Browser/curl makes HTTPS request to n8n.syncbricks.com
   ↓
2. DNS resolves to Cloudflare Edge (CNAME record)
   ↓
3. Cloudflare Edge receives request, checks Zero Trust policies
   ↓
4. Routes to established tunnel (via cloudflared)
   ↓
5. cloudflared tunnel receives request
   ↓
6. Forwards to nginx-proxy:80 (on proxy network)
   ↓
7. nginx-proxy checks request hostname (n8n.syncbricks.com)
   ↓
8. Looks up auto-generated config (from VIRTUAL_HOST=n8n.syncbricks.com)
   ↓
9. Routes to n8n container:5678 (on syncbricks network)
   ↓
10. n8n application receives request
   ↓
11. Returns HTTP response
   ↓
12. Response flows back: n8n → nginx → cloudflared → Cloudflare → Browser
```

**Security Notes:**
- TLS/SSL from Browser to Cloudflare (always HTTPS)
- HTTP inside tunnel (encrypted by Cloudflare tunnel)
- HTTP from cloudflared to nginx-proxy (internal docker network)
- SQL queries from n8n to postgres (internal docker network)

---

## Comparison: Before SyncBricks vs After SyncBricks

### Adding a New Service

**Before (Manual Caddy Config):**
```bash
# 1. Update Caddyfile
vim /root/infra/n8n/Caddyfile

# Add something like:
new-service.bestviable.com {
    reverse_proxy localhost:9000
    tls {
        dns cloudflare {env.CLOUDFLARE_API_TOKEN}
    }
}

# 2. Reload Caddy
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile

# 3. Run container manually or via compose
docker run -d --name new-service -p 127.0.0.1:9000:9000 my-service:latest
```

**After (SyncBricks Auto-Discovery):**
```bash
# 1. Add service to docker-compose.yml
services:
  new-service:
    image: my-service:latest
    environment:
      - VIRTUAL_HOST=new-service.bestviable.com
      - LETSENCRYPT_HOST=new-service.bestviable.com
      - LETSENCRYPT_EMAIL=your@email.com
    networks:
      - proxy

# 2. Deploy
docker compose up -d

# Done! nginx-proxy auto-discovers and configures routing
# acme-companion auto-requests SSL certificate
```

### Adding SSL Certificate

**Before (Manual Let's Encrypt):**
```bash
# 1. Generate certificate
certbot certonly --standalone -d new-service.bestviable.com

# 2. Update Caddy config (if needed)

# 3. Reload Caddy

# 4. Set up renewal cron job (if not already)
crontab -e
# Add: 0 0 * * * certbot renew --quiet

# 5. Hope renewal works automatically...
```

**After (SyncBricks):**
```bash
# 1. Add LETSENCRYPT_HOST environment variable
# 2. Deploy container
# Done! acme-companion:
#   - Requests certificate
#   - Stores in shared volume
#   - Auto-renews before expiration
#   - No cron jobs needed
```

---

## Production Readiness Checklist

When deploying SyncBricks pattern:

```
Security:
☑ Generate random N8N_ENCRYPTION_KEY (openssl rand -hex 32)
☑ Generate random N8N_USER_MANAGEMENT_JWT_SECRET
☑ Store secrets in .env file (never commit)
☑ Use strong database password (change from 'amjid')
☑ Enable Cloudflare Zero Trust Access policies (optional)
☑ Restrict database access to internal networks only

Operations:
☑ Set up volume backups for postgres_storage
☑ Set up volume backups for n8n_storage
☑ Document backup/restore procedures
☑ Monitor disk space for volume growth
☑ Set up log aggregation (optional)
☑ Document recovery procedures

Monitoring:
☑ Verify certificate renewal logs
☑ Monitor tunnel connection status
☑ Verify nginx-proxy reload on service changes
☑ Test failover scenarios
☑ Monitor n8n application logs

Documentation:
☑ Record all configured environment variables
☑ Document service dependencies
☑ Record backup locations and schedules
☑ Maintain disaster recovery runbook
☑ Document any customizations
```

---

**Document Status:** Complete
**Last Updated:** 2025-10-26
**Next Steps:** See migration procedure and state comparison documents
