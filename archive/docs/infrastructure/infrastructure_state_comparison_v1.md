- entity: infrastructure
- level: documentation
- zone: internal
- version: v01
- tags: [infrastructure, comparison, security, architecture, before-after]
- source_path: /docs/infrastructure/infrastructure_state_comparison_v1.md
- date: 2025-10-26

---

# Infrastructure State Comparison: Before vs After Migration

## Executive Summary

| Aspect | CURRENT (INSECURE) | AFTER MIGRATION (SECURE) | Improvement |
|--------|-------------------|--------------------------|-------------|
| **Laptop Exposure** | 🔴 Personal IP exposed | 🟢 No exposure | Critical fix |
| **Reverse Proxy** | Manual Caddy config | Auto nginx-proxy | Easier to scale |
| **SSL Management** | Manual Caddy Let's Encrypt | Auto acme-companion | No manual renewal |
| **Tunnel Config** | Config file + credentials | Token-based (simple) | More secure |
| **Service Addition** | Edit Caddyfile + reload | Add Docker label + restart | 10x simpler |
| **Network Security** | Single network | Two-network separation | Better isolation |
| **Availability** | Depends on laptop | Independent of laptop | Always available |
| **Architecture Complexity** | Medium-low | Medium (more services) | Better organized |

---

## CURRENT STATE (INSECURE) - As of 2025-10-26

### Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│                  PROBLEM: Laptop Tunnel                     │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─→ YOUR LAPTOP (MacBook Pro)
               │   ├─ cloudflared tunnel running
               │   ├─ Listens on localhost:8080
               │   └─ EXPOSES PUBLIC IP TO INTERNET 🔴
               │
               ↓ (when running)
        Cloudflare Edge
               ↓
        Laptop cloudflared
               ↓
        localhost:8080 (MCP Gateway - incomplete)


┌─────────────────────────────────────────────────────────────┐
│              OPERATIONAL: DigitalOcean Droplet              │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─→ n8n.bestviable.com → Caddy → n8n:5678
               │   Status: ✓ Running (mostly working)
               │
               ├─→ coda.bestviable.com → A record? → (Not configured)
               │   Status: ✗ Not deployed
               │
               └─→ root domain → MX records (incomplete)
                   Status: Partial
```

### Services Running

| Service | Status | Configuration | Issues |
|---------|--------|---------------|--------|
| **Cloudflared (Laptop)** | 🔴 Running | Token-based tunnel | ⚠️ Exposes personal IP |
| **Caddy (Droplet)** | ✓ Running | Manual Caddyfile | ⚠️ Manual config for each service |
| **n8n (Droplet)** | ✓ Running | PostgreSQL backend | ✓ Stable |
| **PostgreSQL (Droplet)** | ✓ Running | Docker volume | ✓ Persistent |
| **nginx-proxy** | ✗ Not running | - | N/A |
| **acme-companion** | ✗ Not running | - | N/A |
| **Coda MCP Gateway** | ✗ Not deployed | - | ⚠️ Custom image built but not running |

### Network Architecture

- **Single network:** All Docker containers on same network (postgres exposed to everything)
- **Manual routing:** Caddyfile requires edit for each new service
- **Manual SSL:** Caddy Let's Encrypt needs manual monitoring/renewal
- **Tunnel management:** Laptop tunnel to secure n8n partially, not complete solution

### DNS Records

```
bestviable.com (Root)
├─ @ (A record)          → ??? (unclear)
├─ n8n (A record)        → ???
├─ coda (A record)       → ??? (future)
└─ tools (CNAME record)  → xxxxx.cfargotunnel.com
                           └─→ Points to LAPTOP tunnel 🔴
```

### Security Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| **Laptop IP Exposure** | 🔴 CRITICAL | Cloudflare tunnel routes traffic to home network |
| **Production on Laptop** | 🔴 CRITICAL | Laptop must stay online for service availability |
| **No Network Isolation** | 🟠 HIGH | Database accessible from proxy layer |
| **Manual Config** | 🟡 MEDIUM | Error-prone, doesn't scale |
| **Incomplete Deployment** | 🟡 MEDIUM | Coda MCP gateway built but not integrated |

---

## AFTER MIGRATION (SECURE) - Target State

### Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│                  SOLUTION: Droplet Tunnel                   │
└──────────────┬──────────────────────────────────────────────┘
               │
        Cloudflare Edge
               ↓
        Cloudflare Tunnel (on droplet)
               ↓
        nginx-proxy (auto-discovery)
               ├─→ n8n.bestviable.com → n8n:5678
               ├─→ coda.bestviable.com → coda-mcp-gateway:8080
               └─→ (new services added automatically)


┌──────────────────────────────────────────────────────────────┐
│          DigitalOcean Droplet (All Services)                 │
└──────────────┬──────────────────────────────────────────────┘
               │
        ┌──────┴──────────────────────────────┐
        │    PROXY NETWORK (public-facing)   │
        │                                     │
        ├─ nginx-proxy (80/443)               │
        ├─ acme-companion (SSL auto-renew)   │
        ├─ cloudflared (tunnel client)       │
        └─ n8n (exposed via label)           │  ← All public services
            └─ coda-mcp-gateway (exposed via label)

        ┌──────────────────────────────────┐
        │  BACKEND NETWORK (internal)      │
        │                                   │
        ├─ postgres (DB - isolated)        │
        ├─ qdrant (vector store)           │  ← Private services
        └─ n8n (also on proxy network)
           └─ coda-mcp-gateway
```

### Services Running

| Service | Status | Configuration | Benefits |
|---------|--------|---------------|----------|
| **cloudflared (Droplet)** | ✓ Will run | Token in docker-compose | ✓ No personal IP exposed |
| **nginx-proxy** | ✓ Will run | Auto-discovers via labels | ✓ No manual Caddyfile edits |
| **acme-companion** | ✓ Will run | Auto-manages Let's Encrypt | ✓ Certs auto-renew |
| **n8n** | ✓ Will run | PostgreSQL + Docker labels | ✓ Inherited + new features |
| **PostgreSQL** | ✓ Will run | Isolated on backend network | ✓ Secure, not exposed |
| **Qdrant** | ✓ Will run | Optional vector DB | ✓ Future AI features ready |
| **Coda MCP Gateway** | ✓ Will run | Docker labels | ✓ Auto-exposed via nginx-proxy |

### Network Architecture

```
Two separate Docker networks:

proxy network:
  ├─ nginx-proxy (0.0.0.0:80, 0.0.0.0:443)
  ├─ acme-companion
  ├─ cloudflared
  ├─ n8n (also on syncbricks)
  └─ coda-mcp-gateway (also on syncbricks)

syncbricks network:
  ├─ postgres (isolated, n8n access only)
  ├─ qdrant (isolated)
  ├─ n8n (also on proxy)
  └─ coda-mcp-gateway (also on proxy)
```

**Benefits:**
- ✅ Database cannot be accessed from internet-facing services
- ✅ Network-level security boundary
- ✅ Clear architecture (backend ≠ frontend)
- ✅ Easier to reason about service interactions

### DNS Records

```
bestviable.com (Root)
├─ @ (A record)          → ??? (unchanged)
├─ n8n (CNAME record)    → xxxxx.cfargotunnel.com ← Updated
│                          └─→ Points to DROPLET tunnel
├─ coda (CNAME record)   → xxxxx.cfargotunnel.com ← New
│                          └─→ Points to DROPLET tunnel
└─ tools (CNAME record)  → xxxxx.cfargotunnel.com (can delete)
                          └─→ Previously: laptop, now: unused
```

### Security Improvements

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| **Laptop IP Exposure** | 🔴 CRITICAL | 🟢 FIXED | No personal IP exposed |
| **Production on Laptop** | 🔴 CRITICAL | 🟢 FIXED | All on stable droplet |
| **Network Isolation** | 🟠 HIGH | 🟢 FIXED | Two-network design |
| **Config Scalability** | 🟡 MEDIUM | 🟢 FIXED | Auto-discovery pattern |
| **SSL Management** | 🟡 MEDIUM | 🟢 FIXED | Auto with acme-companion |
| **Coda Integration** | 🟡 MEDIUM | 🟢 FIXED | Fully deployed & accessible |

---

## Side-by-Side Service Comparison

### Adding a New Service

**BEFORE (Current Caddy Approach):**
```bash
# 1. Manually edit Caddyfile
vim /root/infra/n8n/Caddyfile
  # Add:
  new-service.bestviable.com {
    reverse_proxy localhost:9000
    tls ...
  }

# 2. Reload Caddy
docker exec caddy caddy reload

# 3. Start service somewhere
docker run -p 127.0.0.1:9000:9000 new-service:latest

# 4. Pray config is correct
```

**AFTER (nginx-proxy Auto-Discovery):**
```bash
# 1. Add to docker-compose
services:
  new-service:
    image: new-service:latest
    environment:
      - VIRTUAL_HOST=new-service.bestviable.com
      - LETSENCRYPT_HOST=new-service.bestviable.com
    networks:
      - proxy

# 2. Deploy
docker-compose up -d

# Done! nginx-proxy auto-configures everything
```

### Certificate Management

**BEFORE (Manual Let's Encrypt):**
```bash
# 1. Manually generate cert
certbot certonly -d n8n.bestviable.com

# 2. Hope renewal works
crontab -e
# Add: 0 0 * * * certbot renew

# 3. Monitor renewal logs
docker logs caddy | grep renew
```

**AFTER (Auto acme-companion):**
```bash
# 1. Add environment variable
environment:
  - LETSENCRYPT_HOST=n8n.bestviable.com

# 2. acme-companion:
#    - Requests cert automatically
#    - Renews 30 days before expiry
#    - Updates nginx config
#    - No manual intervention needed
```

---

## Operational Metrics Comparison

### Availability

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Uptime Dependency** | Laptop must be online | Droplet only | ✓ 100% improvement |
| **Service Addition Time** | 15-30 min (edit+test) | 5 min (label+restart) | ✓ 3-6x faster |
| **Certificate Renewal** | Manual monitoring | Automatic | ✓ No manual work |
| **Configuration Errors** | Common (manual edits) | Rare (Docker labels) | ✓ Error surface reduced |
| **Scaling to 10 services** | Very painful | Trivial | ✓ Same effort per service |

### Security Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Public IP Exposure** | 1 (laptop) | 0 | ✓ Eliminated |
| **Database Exposure** | Full (same network) | 0 (isolated) | ✓ Eliminated |
| **Certificate Expiry Risk** | High (manual) | Low (auto-renew) | ✓ Reduced |
| **Configuration Audit Trail** | Git only | Git + Docker labels | ✓ Improved |
| **Service Isolation** | None | Network-level | ✓ Added |

---

## Risk Assessment

### Migration Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **Service downtime** | Medium | High | 15-30 min maintenance window |
| **Data loss** | Low | Critical | Full backup before migration |
| **SSL cert gaps** | Low | High | acme-companion handles overlap |
| **nginx-proxy misconfiguration** | Low | Medium | Auto-discovery reduces errors |
| **Tunnel token failure** | Very Low | High | Keep laptop tunnel as fallback |

### Mitigation Strategy

✓ Complete backups of all data before starting
✓ Test docker-compose config before deploying
✓ Slow rollout (n8n first, then coda-mcp)
✓ Keep laptop tunnel running until droplet tunnel verified
✓ Document all DNS changes before making them
✓ Scheduled during low-traffic period (optional but recommended)

---

## Post-Migration Verification

### Health Checks

```
✓ Access https://n8n.bestviable.com (shows UI)
✓ Access https://coda.bestviable.com (shows response)
✓ SSL certificates show "Valid" (no warnings)
✓ DNS resolves to Cloudflare IPs (not droplet IP)
✓ Cloudflare tunnel shows "HEALTHY" in dashboard
✓ nginx-proxy logs show request routing
✓ All docker-compose services show "Up"
✓ n8n workflows execute correctly
✓ Coda MCP operations work from Claude Code
✓ Laptop tunnel can be safely stopped
```

### Metrics to Monitor (First 48 Hours)

- nginx-proxy: Certificate auto-renewal logs
- acme-companion: Let's Encrypt interactions
- cloudflared: Tunnel connection stability
- n8n: Workflow execution logs
- postgres: Query performance (unchanged expected)
- Disk usage: No dramatic growth expected

---

## Long-Term Benefits

### Scalability

| Scenario | Before | After |
|----------|--------|-------|
| **Adding 5th service** | Edit Caddyfile, test, reload | Add 4 lines to docker-compose, restart |
| **Adding vector DB** | Complex integration | Qdrant already running (just enable) |
| **Adding webhook handler** | Manual proxy config | Add service + VIRTUAL_HOST label |
| **Migrating to bigger droplet** | Rebuild everything | `docker-compose up -d` on new droplet |

### Maintainability

| Aspect | Before | After |
|--------|--------|-------|
| **Configuration drift** | Easy (manual edits) | Hard (Docker source of truth) |
| **Documentation** | Manual (Caddyfile comments) | Auto-generated (Docker labels) |
| **Onboarding new ops** | Learn Caddy, certbot, nginx | Learn Docker labels, compose patterns |
| **Disaster recovery** | Rebuild from notes | Restore volumes, run `docker-compose up -d` |
| **Testing changes** | Live environment | Can test locally with docker-compose |

---

## Summary Table

```
┌─────────────────────────────────────────────────────────────┐
│                 MIGRATION SUMMARY                           │
├─────────────────────────────────────────────────────────────┤
│ Current State: WORKING but INSECURE                         │
│ - Laptop exposes personal IP (critical issue)              │
│ - Manual configuration (error-prone)                        │
│ - Incomplete Coda MCP deployment                           │
│                                                             │
│ Target State: WORKING and SECURE                            │
│ - Zero personal IP exposure                                │
│ - Auto-configuration (nginx-proxy + acme-companion)        │
│ - Complete multi-service deployment                        │
│ - Ready to scale (add services trivially)                  │
│                                                             │
│ Downtime: ~5-10 minutes (during cutover)                   │
│ Effort: 30-45 minutes (experienced), 1-2 hours (first-time)│
│ Rollback: Possible within 30 minutes                        │
│ Risk: MEDIUM (mitigated by backups + detailed procedures)  │
└─────────────────────────────────────────────────────────────┘
```

---

**Document Status:** Complete
**Last Updated:** 2025-10-26
