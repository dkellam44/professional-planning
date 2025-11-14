# Implementation Tasks: Droplet 4GB Upgrade

## Phase A: Pre-Upgrade (Skip Phase 2A - Upgrade First)

**Decision**: Skip Phase 2A on 2GB; upgrade immediately then complete Phase 2A on 4GB with headroom.

### A.1 Prepare for Downtime
- [ ] A.1.1 Document current memory baseline: `ssh tools-droplet-agents "free -h && docker stats --no-stream"` (for comparison post-upgrade)
- [ ] A.1.2 Note all running services and ports (Phase 1: n8n, nginx-proxy, postgres, qdrant, cloudflared)
- [ ] A.1.3 Confirm SSH access working: `ssh tools-droplet-agents "uptime"`

## Phase B: Upgrade (DigitalOcean Console)

### B.1 Resize Droplet
- [ ] B.1.1 Log into DigitalOcean dashboard: https://cloud.digitalocean.com
- [ ] B.1.2 Navigate to Droplets → tools-droplet-agents
- [ ] B.1.3 Click "Resize" button
- [ ] B.1.4 Select "Resize Droplet" (not "Migrate")
- [ ] B.1.5 Choose 4GB RAM tier (currently $12/month)
- [ ] B.1.6 Confirm resize (expect 15-20 min downtime)
- [ ] B.1.7 Wait for droplet to power back on (observe power LED in console)

## Phase C: Post-Upgrade (Verify and Restore)

### C.1 Verify Droplet Health
- [ ] C.1.1 Wait 2 minutes, then test SSH connectivity: `ssh tools-droplet-agents "uptime"`
- [ ] C.1.2 Verify memory increased: `ssh tools-droplet-agents "free -h"`
- [ ] C.1.3 Check all Phase 1 services restarted: `ssh tools-droplet-agents "docker compose -f /root/portfolio/infra/n8n/docker-compose.yml ps"`

### C.2 Restore Phase 2A Services
- [ ] C.2.1 Verify archon services still running: `ssh tools-droplet-agents "docker compose -f /root/portfolio/infra/archon/docker-compose.yml ps"`
- [ ] C.2.2 Test archon-server health: `ssh tools-droplet-agents "curl -s http://localhost:8181/health | jq ."`

### C.3 Re-Enable Optional Services
- [ ] C.3.1 Start openweb (Open WebUI): `docker compose -f /root/portfolio/infra/n8n/docker-compose.yml start openweb`
- [ ] C.3.2 Start uptime-kuma: `docker compose -f /root/portfolio/infra/n8n/docker-compose.yml start uptime-kuma`
- [ ] C.3.3 Verify all services healthy: `docker compose -f /root/portfolio/infra/n8n/docker-compose.yml ps`

### C.4 Document Post-Upgrade State
- [ ] C.4.1 Capture memory and resource stats: `ssh tools-droplet-agents "free -h && docker stats --no-stream"`
- [ ] C.4.2 Compare with pre-upgrade baseline
- [ ] C.4.3 Update `/portfolio/CURRENT_STATE_v1.md` with new tier
- [ ] C.4.4 Update `/portfolio/openspec/project.md` cost summary

## Phase D: Validation

### D.1 Performance & Stability
- [ ] D.1.1 Monitor for 10 minutes, watch no OOM kills: `docker logs --since 5m --until now` for each service
- [ ] D.1.2 Verify SSH remains responsive under normal operations
- [ ] D.1.3 Test docker compose operations complete without hangs

### D.2 Documentation
- [ ] D.2.1 Archive this change proposal: `openspec archive update-droplet-4gb --yes`
- [ ] D.2.2 Commit: "infrastructure: Upgrade droplet to 4GB for Phase 2 headroom"

## Success Criteria

- ✅ Phase 2A deployment complete with nginx-proxy active on 2GB
- ✅ Droplet resizes successfully to 4GB without data loss
- ✅ All Phase 1 + Phase 2A services restart cleanly post-upgrade
- ✅ Memory utilization drops to ~40% (1.6GB used of 3.9GB)
- ✅ No SSH timeouts or hanging operations
- ✅ Optional services (openweb, uptime-kuma) function normally

## Rollback Plan

If resize fails or services don't come back online:

1. Verify droplet still has IP connectivity: `ping 159.65.97.146`
2. If SSH inaccessible, use DigitalOcean console to debug
3. If services won't start: check logs on 4GB tier (likely easier than reverting)
4. Downgrade is not recommended (would require data backup/restore)

## Timeline

| Phase | Duration | Window |
|-------|----------|--------|
| A | ~10 min | Immediate (today) |
| B | ~20 min | Brief downtime window |
| C | ~10 min | Post-reboot recovery |
| D | ~5 min | Validation |
| **Total** | **~45 min** | **Single maintenance window** |
