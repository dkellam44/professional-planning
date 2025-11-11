# Infrastructure Spec Delta: Droplet 4GB Upgrade

## MODIFIED Requirements

### Requirement: DigitalOcean Droplet Hosting
The system SHALL run on a DigitalOcean Droplet with 4GB RAM, Ubuntu 22.04 LTS, located in SFO3 region, with public IP and reserved IP (bestviable.com).

**Previous**: 2GB RAM
**Updated**: 4GB RAM

The 4GB tier provides sufficient memory headroom for:
- Phase 1 services (n8n, nginx-proxy, acme-companion, postgres, qdrant, cloudflared): ~500MB
- Phase 2A services (archon-server, archon-mcp, archon-ui): ~400MB
- Optional services (openweb, uptime-kuma): ~800MB
- Free buffer: ~1.2GB for transient operations (docker compose, service startup)

**Cost Impact**: $6/month → $12/month (+$72/year)

#### Scenario: Phase 1 services run cleanly at startup
- **WHEN** droplet boots after resize to 4GB
- **THEN** all Phase 1 services (n8n, nginx-proxy, postgres, qdrant, cloudflared) restart automatically via compose `restart_policy: unless-stopped`
- **AND** memory utilization remains <50% (under 2GB)

#### Scenario: Phase 2A services run with nginx-proxy active
- **WHEN** all Phase 1 services are running and archon services are started via docker compose
- **THEN** archon-server, archon-mcp, archon-ui all reach "Up" status within 30s
- **AND** nginx-proxy auto-discovers archon-ui via VIRTUAL_HOST label
- **AND** memory utilization remains <60% (under 2.4GB)

#### Scenario: Optional services re-enable without memory pressure
- **WHEN** openweb (Open WebUI) and uptime-kuma are started after Phase 2A is stable
- **THEN** both services start cleanly without OOM kills
- **AND** total memory remains below 80% (under 3.2GB) even under concurrent load

#### Scenario: Docker operations complete reliably
- **WHEN** docker compose operations (down, up, build, logs) are executed
- **THEN** commands complete without hanging or SSH timeouts
- **AND** no OOM killer events in kernel logs

## Deprecation & Migration

**Deprecation**: 2GB tier is deprecated for current workload
**Reason**: Resource contention blocking Phase 2A deployment; only 83MB free RAM; SSH timeouts during docker operations
**Migration**: One-time DigitalOcean resize operation (~15-20 min downtime); all data preserved; services automatically restart
