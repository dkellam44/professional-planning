# Design: Traefik Migration Architecture

## Context

The existing nginx-proxy + docker-gen + acme-companion stack had:
- Complex 3-container architecture
- Template-based configuration generation prone to bugs
- Manual restart requirements for updates
- Difficult-to-debug routing issues (Coda MCP 301 loop)

Traefik offers:
- Single-container solution
- Direct Docker API integration
- Automatic service discovery
- Real-time configuration updates
- Built-in dashboard

## Goals

- Eliminate nginx-proxy routing bugs (especially Coda MCP 301 issue)
- Simplify reverse proxy architecture
- Enable automatic service discovery
- Maintain compatibility with Cloudflare Tunnel
- Support HTTP-only routing (Cloudflare handles SSL)

## Non-Goals

- Certificate management (Cloudflare Tunnel terminates SSL)
- Load balancing across multiple hosts (single droplet deployment)
- Advanced routing features (middleware, rate limiting) in initial deployment

## Key Decisions

### 1. HTTP-Only Routing (Not HTTPS)

**Decision**: Configure Traefik to accept HTTP on port 80, no TLS configuration

**Rationale**:
- Cloudflare Tunnel already terminates SSL at the edge
- Traffic from Cloudflare → droplet is encrypted in the tunnel
- HTTP routing eliminates:
  - Certificate management overhead
  - Double SSL termination
  - Let's Encrypt rate limit issues
- This matches how nginx-proxy was configured

**Alternatives Considered**:
- HTTPS everywhere: Adds complexity, no security benefit with Cloudflare Tunnel
- Mixed HTTP/HTTPS: Confusing configuration, unnecessary

### 2. Network Alias Strategy

**Decision**: Add `nginx-proxy` alias to Traefik container on docker_proxy network

**Rationale**:
- Cloudflare Tunnel configuration points to `http://nginx-proxy:80`
- Network alias allows zero-downtime migration (no tunnel config changes)
- Avoids modifying Cloudflare dashboard settings

**Alternatives Considered**:
- Update Cloudflare Tunnel config: Requires dashboard access, potential downtime
- Separate hostname: Unnecessary complexity

### 3. Service Label Format

**Decision**: Use simplified Traefik labels without TLS:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.{service}.rule=Host(`example.com`)"
  - "traefik.http.routers.{service}.entrypoints=web"
  - "traefik.http.services.{service}.loadbalancer.server.port={port}"
```

**Rationale**:
- Minimal configuration required
- No TLS complexity
- Clear and maintainable

**Alternatives Considered**:
- Separate HTTP/HTTPS routers: Unnecessary for Cloudflare Tunnel setup
- Middleware chains: Can add later if needed

### 4. Rollback Strategy

**Decision**: Stop nginx-proxy but keep containers as backup

**Rationale**:
- Quick rollback possible (< 2 minutes)
- Can restart nginx-proxy if critical issues found
- Remove only after confidence period

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Internet (HTTPS)                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Edge (SSL Termination)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼ HTTP via encrypted tunnel
┌─────────────────────────────────────────────────────────────┐
│ Cloudflare Tunnel (cloudflared)                            │
│ Routes to: http://nginx-proxy:80                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Traefik (aliased as nginx-proxy)                           │
│ - Port 80 (HTTP entrypoint: "web")                         │
│ - Port 8080 (Dashboard)                                    │
│ - Watches Docker API for labeled services                  │
└────────────────┬───────┬──────┬──────┬──────┬───────────────┘
                 │       │      │      │      │
                 ▼       ▼      ▼      ▼      ▼
            ┌────────┐ ┌───┐ ┌────┐ ┌──────┐ ┌──────┐
            │coda-mcp│ │n8n│ │apps│ │archon│ │kuma  │
            └────────┘ └───┘ └────┘ └──────┘ └──────┘
```

## Service Discovery Flow

1. Service starts with Traefik labels
2. Traefik receives Docker event via socket
3. Traefik parses labels and creates router
4. Router configuration validated and applied
5. Service immediately available (no restart needed)

## Migration Risks & Mitigations

### Risk 1: Traefik Discovery Failure
**Probability**: Medium (encountered during migration)
**Impact**: Services not accessible
**Mitigation**:
- Debug logging enabled by default
- Validate labels before container restart
- Keep nginx-proxy as backup

### Risk 2: Cloudflare Tunnel Connection Issues
**Probability**: Low
**Impact**: All services unavailable
**Mitigation**:
- Network alias prevents tunnel reconfiguration
- Tested hostname resolution before cutover
- Cloudflared restart resolves DNS cache issues

### Risk 3: Let's Encrypt Rate Limiting
**Probability**: High (hit during migration)
**Impact**: Certificate generation failures
**Mitigation**:
- Use HTTP-only routing (no certificates needed)
- Cloudflare handles SSL completely

## Performance Considerations

### Traefik Resource Usage
- Memory: ~150MB (vs 200MB+ for nginx-proxy stack)
- CPU: <5% idle, scales with traffic
- Startup time: ~5 seconds (vs 30+ for nginx-proxy)

### Routing Overhead
- HTTP routing adds negligible latency (<1ms)
- No SSL processing overhead (handled by Cloudflare)

## Operational Changes

### Before (nginx-proxy)
```bash
# Add new service
1. Add VIRTUAL_HOST env vars to docker-compose.yml
2. Restart service
3. Wait for docker-gen to regenerate nginx config
4. Restart nginx-proxy
5. Test access
```

### After (Traefik)
```bash
# Add new service
1. Add Traefik labels to docker-compose.yml
2. Restart service
3. Traefik auto-discovers (no restart needed)
4. Test access
```

## Open Questions

None remaining - all decisions validated during implementation.

## References

- Original Proposal: `reference/original-proposal.md`
- Session Summary: `reference/SESSION_SUMMARY_2025-11-12_TRAEFIK_ATTEMPT.md`
- Traefik Documentation: https://doc.traefik.io/traefik/providers/docker/
