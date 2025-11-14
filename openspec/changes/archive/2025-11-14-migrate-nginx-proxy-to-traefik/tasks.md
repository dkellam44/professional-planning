# Implementation Tasks: Traefik Migration

## 1. Preparation

- [x] 1.1 Review existing nginx-proxy configuration
- [x] 1.2 Document current service routing
- [x] 1.3 Create Traefik docker-compose.yml
- [x] 1.4 Create Traefik static configuration (traefik.yml)
- [x] 1.5 Test Traefik deployment on non-production ports (8000/8443)

## 2. Traefik Discovery Configuration

- [x] 2.1 Enable DEBUG logging in traefik.yml
- [x] 2.2 Deploy Traefik container
- [x] 2.3 Verify Docker socket access
- [x] 2.4 Test service discovery with one service (Dozzle)
- [x] 2.5 Diagnose discovery issues (containers filtered as unhealthy/disabled)
- [x] 2.6 Identify root cause: labels not applied to running containers

## 3. Service Label Migration

- [x] 3.1 Add Traefik labels to Apps services (dozzle, openweb, uptime-kuma)
- [x] 3.2 Add Traefik labels to Archon services (archon-server, archon-mcp, archon-ui)
- [x] 3.3 Add Traefik labels to Coda MCP service
- [x] 3.4 Remove TLS configuration from all labels (HTTP-only routing)
- [x] 3.5 Change entrypoints from `websecure` to `web`
- [x] 3.6 Recreate all services to apply new labels
- [x] 3.7 Verify Traefik discovers all services (6+ routers)

## 4. Network Alias Configuration

- [x] 4.1 Add `nginx-proxy` alias to Traefik on docker_proxy network
- [x] 4.2 Update docker-compose.traefik.yml with network aliases
- [x] 4.3 Recreate Traefik container
- [x] 4.4 Verify alias visible in Docker network inspect
- [x] 4.5 Test hostname resolution from cloudflared container

## 5. Production Cutover

- [x] 5.1 Stop nginx-proxy and acme-companion containers
- [x] 5.2 Update Traefik ports from 8000/8443 to 80/443
- [x] 5.3 Restart Traefik on production ports
- [x] 5.4 Restart cloudflared to pick up DNS changes
- [x] 5.5 Verify all services discovered by Traefik

## 6. Testing & Validation

- [x] 6.1 Test local HTTP access (curl http://localhost:80)
- [x] 6.2 Test Traefik by IP (curl http://172.20.0.2:80)
- [x] 6.3 Test external HTTPS access via Cloudflare Tunnel
  - [x] Coda MCP: https://coda.bestviable.com/health → JSON response
  - [x] Uptime Kuma: https://kuma.bestviable.com → Redirect to /dashboard
  - [x] Archon UI: https://archon.bestviable.com → HTML response
  - [x] OpenWebUI: https://openweb.bestviable.com → HTML response
- [x] 6.4 Verify Coda MCP 301 issue resolved (returns proper JSON)
- [x] 6.5 Check Traefik dashboard (http://localhost:8080)
- [x] 6.6 Monitor Traefik logs for errors

## 7. Documentation & Cleanup

- [x] 7.1 Document HTTP-only routing decision
- [x] 7.2 Document network alias strategy
- [x] 7.3 Create OpenSpec change proposal
- [x] 7.4 Create design document
- [x] 7.5 Move related session summaries to reference folder
- [x] 7.6 Run final end-to-end tests
  - ✅ Coda MCP: Returns JSON health data
  - ✅ Uptime Kuma: Returns redirect to dashboard
  - ✅ Archon UI: Returns HTML
  - ✅ OpenWebUI: Returns HTML
  - ✅ Traefik: 6 routers discovered and enabled
- [x] 7.7 Update infrastructure documentation
- [x] 7.8 Create spec delta for reverse-proxy capability
- [x] 7.9 Validate with `openspec validate migrate-nginx-proxy-to-traefik --strict`

## 8. Post-Migration (Future)

- [ ] 8.1 Monitor services for 24-48 hours
- [ ] 8.2 Remove nginx-proxy containers after confidence period
- [ ] 8.3 Clean up old VIRTUAL_HOST environment variables
- [ ] 8.4 Document Traefik label patterns for new services
- [ ] 8.5 Archive change with `openspec archive migrate-nginx-proxy-to-traefik`

## Issues Encountered & Resolutions

### Issue 1: Traefik not discovering services
**Symptom**: All containers filtered as "disabled" by Traefik
**Root Cause**: Labels in docker-compose.yml not applied to running containers
**Resolution**: Recreate all containers with `docker compose up -d --force-recreate`

### Issue 2: Services returning 404 with TLS configuration
**Symptom**: HTTP requests to port 80 returned 404
**Root Cause**: Routers configured with TLS expecting HTTPS
**Resolution**: Remove TLS config, use only `web` entrypoint for HTTP

### Issue 3: Cloudflare Tunnel returns 502
**Symptom**: External access failed with 502 Bad Gateway
**Root Cause**: Cloudflared couldn't resolve `nginx-proxy` hostname
**Resolution**: Restart cloudflared to pick up DNS changes

### Issue 4: Let's Encrypt rate limiting
**Symptom**: Certificate generation failures
**Impact**: Not critical - using HTTP-only routing
**Resolution**: None needed, Cloudflare handles SSL

## Time Invested

- Discovery and debugging: ~1.5 hours
- Label migration: ~30 minutes
- Testing and validation: ~30 minutes
- Documentation: ~1 hour
**Total**: ~3.5 hours

## Success Metrics

✅ All services accessible externally via HTTPS
✅ Coda MCP 301 issue resolved
✅ Automatic service discovery working
✅ Zero-downtime capability validated
✅ Simplified architecture (1 container vs 3)
✅ nginx-proxy successfully replaced
