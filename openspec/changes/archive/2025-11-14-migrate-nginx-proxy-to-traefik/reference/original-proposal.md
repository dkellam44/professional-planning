# Traefik Migration Proposal
## From nginx-proxy to Modern Reverse Proxy

**Date**: 2025-11-12
**Status**: PROPOSAL
**Priority**: HIGH
**Impact**: Infrastructure-wide, medium risk with rollback capability

---

## Executive Summary

The current nginx-proxy + docker-gen + acme-companion stack is exhibiting configuration generation bugs (Coda MCP 301 redirect issue) that consume hours of debugging time. **Traefik** offers a modern, unified alternative that:

- ✅ Watches Docker API directly (no docker-gen complexity)
- ✅ Dynamic service discovery (no nginx restart needed)
- ✅ Built-in Let's Encrypt (no separate acme-companion)
- ✅ Dashboard for visibility (transparent routing)
- ✅ Gradual migration path (run alongside nginx-proxy)

**Estimated ROI**: 50+ hours saved per year from reduced debugging + simpler configuration management.

---

## Current Infrastructure Issues

### Problem 1: Docker-gen Configuration Bugs
**Symptom**: Coda MCP returning 301 instead of proxying
- Upstream defined correctly in nginx config
- Direct container access works
- But proxy_pass mysteriously returns 301
- **Root cause**: docker-gen configuration generation issue

**Impact**:
- 3+ hours spent debugging this session
- Similar issues likely in future (hard to diagnose)
- Requires deep nginx knowledge to troubleshoot

### Problem 2: Manual Restarts Required
**Symptom**: Changes to docker-compose require nginx-proxy restart
- Add new service → must restart nginx-proxy
- Change VIRTUAL_HOST → must restart nginx-proxy
- Creates brief downtime for all other services

**Impact**:
- Every deployment touches core infrastructure
- Risk of cascading failures
- No zero-downtime deployments possible

### Problem 3: Multiple Containers for One Function
**Symptom**: Three separate containers (nginx, docker-gen, acme-companion)
- 3 failure points instead of 1
- 3 configuration files to manage
- 3 sets of logs to debug

**Impact**:
- Operational complexity
- Higher debugging time
- More memory/CPU overhead

---

## Proposed Solution: Traefik

### Why Traefik?

| Feature | nginx-proxy | Traefik |
|---------|-------------|---------|
| Docker discovery | docker-gen (indirect) | Direct API (fast) |
| Config reload | Manual restart | Automatic |
| Service discovery | Env variables + labels | Labels only |
| Let's Encrypt | Separate container | Built-in |
| Dashboard | None | Native (visual) |
| Startup time | ~30 seconds | ~5 seconds |
| Configuration | nginx.conf | traefik.yml + labels |
| Zero-downtime updates | No | Yes |
| Learning curve | Medium (nginx knowledge) | Low (labels only) |

### Traefik Architecture

```
Internet (HTTPS via Cloudflare Tunnel)
         ↓
  Traefik Container
    (Watches Docker API)
         ↓
  ┌─────┴──────┬──────────┬──────────┐
  ↓            ↓          ↓          ↓
n8n        Archon    OpenWebUI   Coda MCP
```

**Key Difference**: Traefik watches Docker events in real-time, updates config instantly.

---

## Implementation Plan

### Phase 1: Deploy Traefik Alongside nginx-proxy (30 minutes)

**Goal**: Have both systems running, nginx-proxy still handling all traffic

**Steps**:

1. Create Traefik docker-compose.yml
2. Configure Traefik for docker_proxy network
3. Start Traefik (it won't interfere yet)
4. Verify Traefik dashboard accessible
5. Verify nginx-proxy still handling all traffic

**Files to create/modify**:
- `~/services/docker/docker-compose.traefik.yml` (new)
- `~/services/docker/traefik.yml` (new config file)

**Rollback**: `docker compose -f docker-compose.traefik.yml down`

---

### Phase 2: Test with One Service (1 hour)

**Goal**: Migrate ONE non-critical service to Traefik, verify it works

**Test service**: Dozzle (logs viewer, least critical)

**Steps**:

1. Add Traefik labels to Dozzle docker-compose.yml
2. Keep nginx-proxy VIRTUAL_HOST for redundancy
3. Test Dozzle via Traefik: `https://logs.bestviable.com`
4. Verify logs in Traefik dashboard
5. Test 3 times, wait 24 hours, confirm stable

**Success criteria**:
- ✅ Dozzle accessible via Traefik URL
- ✅ HTTPS works (Let's Encrypt)
- ✅ No errors in Traefik logs
- ✅ Dashboard shows correct routing

**Rollback**: Remove Traefik labels, restart Dozzle

---

### Phase 3: Migrate Critical Services (2-3 hours)

**Order** (by criticality, low-to-high):
1. Uptime Kuma (monitoring - critical but can tolerate brief downtime)
2. OpenWebUI (stable service)
3. Archon services (newest, fewer unknowns)
4. n8n (business logic)
5. **Last**: Coda MCP (the problematic one - test last)

**Per-service steps**:
1. Add Traefik labels
2. Test via new URL
3. Keep nginx-proxy labels for 24h redundancy
4. Remove nginx-proxy labels after verification
5. Wait 24h before next service

**Expected time**: 20-30 minutes per service

---

### Phase 4: Full Cutover (30 minutes)

**When**: After all services migrated and stable

**Steps**:
1. Remove all VIRTUAL_HOST env variables
2. Remove nginx-proxy acme-companion container
3. Keep nginx-proxy running (as fallback only)
4. Monitor for 24 hours
5. If stable: decomission nginx-proxy entirely

---

## Risk Analysis

### Risk 1: Both Systems Conflict
**Probability**: LOW
**Severity**: MEDIUM (brief downtime)
**Mitigation**:
- Run on separate networks initially
- Test non-critical service first
- Keep nginx-proxy running as fallback

### Risk 2: Traefik Configuration Errors
**Probability**: MEDIUM
**Severity**: MEDIUM (service-specific downtime)
**Mitigation**:
- Document label syntax before starting
- Test one service at a time
- Dashboard validates config in real-time

### Risk 3: SSL Certificate Issues
**Probability**: LOW
**Severity**: HIGH (service inaccessible)
**Mitigation**:
- Keep Let's Encrypt working on nginx-proxy as backup
- Traefik reuses same certificate directory
- Test HTTPS explicitly per service

### Risk 4: Service Discovery Lag
**Probability**: VERY LOW
**Severity**: MEDIUM
**Mitigation**:
- Traefik updates within 500ms of Docker events
- Monitor dashboard during migration
- Rollback plan tested for each service

### Overall Risk Assessment
**Risk Level**: MEDIUM
**Mitigation**: Phased approach, parallel systems, tested rollbacks

---

## Rollback Strategy

### Full Rollback (Any Phase)
```bash
# Stop all Traefik services
docker compose -f docker-compose.traefik.yml down

# Restart nginx-proxy (was still running)
docker compose -f docker-compose.production.yml restart nginx-proxy

# Traffic automatically reverts to nginx-proxy
```

**Recovery time**: 60 seconds

### Per-Service Rollback (Phase 3)
```bash
# Remove Traefik labels from problematic service
# Restart service
docker compose restart <service>

# Traffic reverts to nginx-proxy
```

**Recovery time**: 15 seconds

---

## Traefik Configuration Details

### traefik.yml (Static Config)
```yaml
# Global
global:
  checkNewVersion: false
  sendAnonymousUsage: false

# Entrypoints
entrypoints:
  web:
    address: :80
  websecure:
    address: :443
    http:
      tls:
        certResolver: letsencrypt

# Certificate resolver
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@bestviable.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entrypoint: web

# Docker provider
providers:
  docker:
    endpoint: unix:///var/run/docker.sock
    network: docker_proxy
    exposedByDefault: false

# Dashboard
api:
  dashboard: true
  insecure: true  # Only accessible from localhost:8080 in prod
```

### Service Labels (Dynamic Config)
```yaml
# Example for Dozzle
dozzle:
  environment:
    - DOZZLE_LEVEL=info
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.dozzle.rule=Host(`logs.bestviable.com`)"
    - "traefik.http.routers.dozzle.entrypoints=websecure"
    - "traefik.http.routers.dozzle.tls.certresolver=letsencrypt"
    - "traefik.http.services.dozzle.loadbalancer.server.port=8080"
  networks:
    - docker_proxy
```

---

## Timeline

### Day 1 (Today - 2.5 hours)
- [ ] Phase 1: Deploy Traefik (30 min)
- [ ] Phase 2: Test with Dozzle (1 hour)
- [ ] Phase 3 Start: OpenWebUI (30 min)

### Day 2 (Next session)
- [ ] Monitor Day 1 services (stability check)
- [ ] Phase 3 Cont: Migrate remaining services (2 hours)
- [ ] Phase 4 Start: Prepare cutover

### Day 3 (If needed)
- [ ] Phase 4: Full cutover and cleanup
- [ ] Monitor for 24 hours
- [ ] Decommission nginx-proxy

**Total implementation time**: 4-5 hours spread over 2-3 sessions

---

## Success Criteria

### Phase 1 Complete ✅
- [ ] Traefik container healthy
- [ ] Dashboard accessible at http://localhost:8080
- [ ] nginx-proxy still handling all traffic
- [ ] No error logs in Traefik

### Phase 2 Complete ✅
- [ ] Dozzle accessible via https://logs.bestviable.com
- [ ] SSL certificate valid (green lock)
- [ ] Traefik dashboard shows correct routing
- [ ] Wait 24 hours, no issues

### Phase 3 Complete ✅
- [ ] All services migrated to Traefik labels
- [ ] All HTTPS working
- [ ] All services stable for 24+ hours

### Phase 4 Complete ✅
- [ ] nginx-proxy decommissioned
- [ ] All services running on Traefik only
- [ ] Coda MCP routing working (no 301 errors)
- [ ] Performance stable

---

## Commands Reference

### Deploy Traefik
```bash
ssh droplet "cd ~/services/docker && \
docker compose -f docker-compose.traefik.yml up -d"
```

### Access Dashboard
```bash
# Local port forward (if needed)
ssh -L 8080:localhost:8080 droplet
# Then visit http://localhost:8080
```

### Monitor Traefik Logs
```bash
ssh droplet "docker logs -f traefik"
```

### Add Traefik Labels to Service
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.<service>.rule=Host(\`<domain>\`)"
  - "traefik.http.routers.<service>.entrypoints=websecure"
  - "traefik.http.routers.<service>.tls.certresolver=letsencrypt"
  - "traefik.http.services.<service>.loadbalancer.server.port=<port>"
```

### Remove Service from nginx-proxy
```bash
# Just remove VIRTUAL_HOST and VIRTUAL_PORT env vars
sed -i '/VIRTUAL_HOST/d' docker-compose.yml
sed -i '/VIRTUAL_PORT/d' docker-compose.yml
```

---

## Decision Points

### Before Phase 1
- [ ] Agree on migration approach (phased vs. all-at-once)
- [ ] Confirm Traefik as solution
- [ ] Reserve 5 hours for implementation

### Before Phase 2
- [ ] Confirm Traefik working correctly
- [ ] Test service (Dozzle) identified

### Before Phase 3
- [ ] Phase 2 confirmed stable for 24 hours
- [ ] Priority order of remaining services finalized

### Before Phase 4
- [ ] All services tested on Traefik
- [ ] Confidence level: HIGH (all systems working)
- [ ] Maintenance window scheduled if needed

---

## Long-term Benefits

### Immediate (Post-migration)
1. **No more 301 errors** - Clean separation of concerns
2. **Faster deployments** - Zero downtime for service updates
3. **Better debugging** - Dashboard shows exact routing config
4. **Less infrastructure code** - Fewer env variables, fewer restarts

### Medium-term (Weeks 1-4)
1. **Time savings** - Less debugging, faster troubleshooting
2. **Operational confidence** - Understand routing completely
3. **Foundation for automation** - Easier to script service deployment

### Long-term (Months+)
1. **Scalability** - Ready for multiple droplets with load balancing
2. **DevOps maturity** - Modern infrastructure practices
3. **Reduced operational load** - More time for feature development

---

## Comparison: Final State

### Before (nginx-proxy)
```
9 services with varying issues
├── n8n (working, password issue fixed)
├── OpenWebUI (working, after label fix)
├── Archon (working, newly deployed)
├── Coda MCP (❌ BROKEN - 301 redirects)
├── Uptime Kuma (working)
├── Dozzle (working)
├── postgres (internal only)
├── qdrant (internal only)
└── nginx-proxy (3 containers: nginx, docker-gen, acme)
```

### After (Traefik)
```
9 services all healthy
├── n8n (healthy, working)
├── OpenWebUI (healthy, working)
├── Archon (healthy, working)
├── Coda MCP (✅ FIXED - routing working)
├── Uptime Kuma (healthy, working)
├── Dozzle (healthy, working)
├── postgres (internal only)
├── qdrant (internal only)
└── traefik (1 container, simpler, dashboard included)
```

---

## Next Steps

### Immediate (Next 30 minutes)
1. **Approve** this proposal
2. **Create** docker-compose.traefik.yml
3. **Create** traefik.yml config
4. **Deploy** Traefik to droplet

### Follow-up (Same session)
5. **Test** Dozzle migration
6. **Document** label syntax
7. **Prepare** rollback procedures

### Ready to proceed? 👇
- [ ] Create Phase 1 files and deploy Traefik

---

## Appendix: Traefik Resources

### Official Documentation
- Traefik Docker docs: https://doc.traefik.io/traefik/providers/docker/
- Label reference: https://doc.traefik.io/traefik/routing/providers/docker/

### Key Label Fields
- `traefik.enable`: Enable routing (must be true)
- `traefik.http.routers.{name}.rule`: Routing rule (Host(`domain`))
- `traefik.http.routers.{name}.entrypoints`: Entry points (web, websecure)
- `traefik.http.routers.{name}.tls.certresolver`: ACME resolver name
- `traefik.http.services.{name}.loadbalancer.server.port`: Container port

### Example: Complete Migration Labels
```yaml
# For any service (e.g., coda-mcp)
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.coda.rule=Host(`coda.bestviable.com`)"
  - "traefik.http.routers.coda.entrypoints=websecure"
  - "traefik.http.routers.coda.tls.certresolver=letsencrypt"
  - "traefik.http.services.coda.loadbalancer.server.port=8080"
```

That's it! No env variables, no custom nginx config, no docker-gen complexity.

---

**Status**: READY FOR APPROVAL & IMPLEMENTATION

