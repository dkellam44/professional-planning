# Next Session: Option C - Traefik Migration & nginx-proxy Deprecation

**Goal**: Fix Traefik label discovery, then migrate all services and deprecate nginx-proxy
**Estimated Time**: 1-2 hours
**Prerequisites**: Fresh context window, all docs available

---

## Current State (As of 2025-11-12)

### Working Infrastructure
- ✅ All services running and healthy
- ✅ nginx-proxy handling all traffic (except Coda MCP has 301 issue)
- ✅ Traefik deployed (ports 8000/8443) but not discovering services
- ✅ All services labeled with Traefik config

### Blockers Identified
1. **Traefik Docker provider** not discovering labeled services persistently
2. **nginx-proxy** has proxy_pass loop for coda.bestviable.com

---

## Phase 1: Fix Traefik Discovery (30-60 min)

### Step 1: Enable Debug Logging
```bash
ssh droplet "
cd ~/services/traefik
# Stop Traefik
docker compose -f docker-compose.traefik.yml down

# Update traefik.yml to enable debug
sed -i 's/level: INFO/level: DEBUG/' traefik.yml

# Restart with debug logging
docker compose -f docker-compose.traefik.yml up -d
"
```

### Step 2: Monitor Discovery Process
```bash
# Watch Traefik logs for Docker events
docker logs -f traefik | grep -i 'docker\|label\|discover\|provider'

# In parallel, restart one service to trigger events
docker compose -f ~/services/apps/docker-compose.yml restart dozzle
```

### Step 3: Verify Label Format
```bash
# Check if Traefik v3.0.0 requires different syntax
# Test with simplified labels first:
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.dozzle.rule=Host(`logs.bestviable.com`)"
  - "traefik.http.routers.dozzle.entrypoints=websecure"
  - "traefik.http.services.dozzle.loadbalancer.server.port=8080"

# Remove TLS labels temporarily to isolate issue
```

### Step 4: Test Alternate Approaches
If labels still not discovered:
- Try `exposedByDefault: true` in traefik.yml (to see if it's label-specific)
- Check Docker API version: `docker version`
- Try Traefik v2.10 instead of v3.0.0 (known stable)

**Expected Result**: Dozzle (and other services) appear in `curl http://localhost:8080/api/http/routers`

---

## Phase 2: Migrate All Services to Traefik (30 min)

Once discovery is working:

### Step 1: Switch Traefik to Production Ports
```bash
# Update docker-compose.traefik.yml
ports:
  - "80:80"      # Was 8000:80
  - "443:443"    # Was 8443:443
  - "127.0.0.1:8080:8080"

# This will conflict with nginx-proxy - we'll stop it first
```

### Step 2: Stop nginx-proxy
```bash
ssh droplet "
cd ~/services/docker
docker compose -f docker-compose.production.yml stop nginx-proxy acme-companion docker-gen
"
```

### Step 3: Start Traefik on Production Ports
```bash
ssh droplet "
cd ~/services/traefik
docker compose -f docker-compose.traefik.yml down
# Update ports in compose file
docker compose -f docker-compose.traefik.yml up -d
"
```

### Step 4: Verify All Services
```bash
# Check all routers are discovered
curl -s http://localhost:8080/api/http/routers | python3 -c '
import sys, json
data = json.load(sys.stdin)
routers = [r["name"] for r in data if "@" not in r["name"]]
print(f"Found {len(routers)} routers:")
for r in sorted(routers):
    print(f"  - {r}")
'

# Test each service manually:
curl -sk https://logs.bestviable.com
curl -sk https://n8n.bestviable.com
curl -sk https://archon.bestviable.com
curl -sk https://openweb.bestviable.com
curl -sk https://kuma.bestviable.com
curl -sk https://coda.bestviable.com/health  # THE BIG TEST
```

**Expected Result**: All 6 services accessible via HTTPS, including Coda MCP

---

## Phase 3: Cleanup nginx-proxy (15 min)

Once all services verified working:

### Step 1: Remove nginx-proxy Services
```bash
ssh droplet "
cd ~/services/docker
# Remove from docker-compose.production.yml
docker compose -f docker-compose.production.yml rm -f nginx-proxy acme-companion docker-gen
"
```

### Step 2: Remove VIRTUAL_HOST Environment Variables
```bash
# Clean up all docker-compose.yml files
# Remove:
# - VIRTUAL_HOST
# - VIRTUAL_PORT
# - LETSENCRYPT_HOST
# - LETSENCRYPT_EMAIL

# These are now replaced by Traefik labels
```

### Step 3: Document New Architecture
Update:
- Service deployment docs
- Network topology diagrams
- Troubleshooting guides

---

## Rollback Plan (If Anything Fails)

```bash
# Quick rollback to nginx-proxy
ssh droplet "
cd ~/services/traefik
docker compose -f docker-compose.traefik.yml down

cd ~/services/docker
docker compose -f docker-compose.production.yml up -d nginx-proxy acme-companion docker-gen
"

# Wait 30s for nginx-proxy to regenerate config
# All services revert to nginx-proxy routing
```

**Recovery time**: < 2 minutes

---

## Files You'll Need

### Documentation
- `TRAEFIK_MIGRATION_PROPOSAL_2025-11-12.md` - Comprehensive strategy
- `SESSION_SUMMARY_2025-11-12_TRAEFIK_ATTEMPT.md` - Findings from this session
- `CODA_MCP_FAILURE_ANALYSIS_2025-11-12.md` - Original Coda MCP analysis

### Configs
- `/home/david/services/traefik/docker-compose.traefik.yml` - Traefik deployment
- `/home/david/services/traefik/traefik.yml` - Traefik static config
- All services already have Traefik labels (ready to go)

---

## Success Criteria

### Phase 1 Success
- ✅ Traefik logs show "provider: docker" discovering containers
- ✅ At least 6 routers appear in `/api/http/routers`
- ✅ Can test via port 8443: `curl -sk https://localhost:8443 -H 'Host: logs.bestviable.com'`

### Phase 2 Success
- ✅ All 6 services accessible via HTTPS on production ports
- ✅ Coda MCP returns JSON (not 301!) at https://coda.bestviable.com/health
- ✅ SSL certificates auto-generated for all domains
- ✅ Traefik dashboard shows all services healthy

### Phase 3 Success
- ✅ nginx-proxy containers removed
- ✅ All VIRTUAL_HOST env vars cleaned up
- ✅ Infrastructure simplified (1 proxy instead of 3 containers)

---

## Debugging Commands Reference

### Traefik Discovery
```bash
# Check provider is running
docker logs traefik 2>&1 | grep "Starting provider \*docker"

# Check for Docker events
docker logs traefik 2>&1 | grep -i "event"

# Check Docker socket access
docker exec traefik ls -la /var/run/docker.sock

# Check which containers Traefik can see
docker exec traefik docker ps --format '{{.Names}}'
```

### Service Labels
```bash
# Verify labels on container
docker inspect <service> --format='{{json .Config.Labels}}' | python3 -m json.tool | grep traefik

# Check which network service is on
docker inspect <service> | grep -A 10 'Networks'
```

### Traefik API
```bash
# All routers
curl -s http://localhost:8080/api/http/routers | jq .

# All services
curl -s http://localhost:8080/api/http/services | jq .

# Configuration overview
curl -s http://localhost:8080/api/overview | jq .
```

---

## Estimated Timeline

| Phase | Activity | Time |
|-------|----------|------|
| 1.1 | Enable debug logging, restart Traefik | 5 min |
| 1.2 | Monitor logs, test service restart | 10 min |
| 1.3 | Debug label format if needed | 15-30 min |
| 1.4 | Test alternate approaches if stuck | 10-20 min |
| 2.1 | Switch Traefik to prod ports | 5 min |
| 2.2 | Stop nginx-proxy | 2 min |
| 2.3 | Verify all services | 10 min |
| 2.4 | Test Coda MCP end-to-end | 5 min |
| 3.1 | Clean up nginx-proxy | 10 min |
| 3.2 | Remove env variables | 5 min |
| **Total** | | **1-2 hours** |

---

## Key Insights from This Session

1. **Traefik labels are correct** - we verified this by inspecting containers
2. **Docker provider IS working** - logs show it's starting
3. **Discovery is the issue** - services aren't being picked up persistently
4. **Proof it CAN work** - Dozzle appeared briefly when restarted
5. **nginx-proxy issue is separate** - won't affect Traefik migration

---

## Next Session Opener

```
Continue with Option C:
1. Fix Traefik label discovery (debug logging)
2. Switch Traefik to production ports (80/443)
3. Deprecate nginx-proxy completely
4. Verify Coda MCP finally works

Current state:
- Traefik deployed (test ports 8000/8443)
- All services labeled and ready
- nginx-proxy still running (fallback)
- Blocker: Docker provider not discovering labels persistently

First action: Enable DEBUG logging in traefik.yml and monitor discovery
```

---

**Ready for next session!** All context preserved, clear path forward.
