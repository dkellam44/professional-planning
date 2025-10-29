- entity: decision
- level: architecture
- zone: internal
- version: v01
- tags: [infrastructure, cloudflare, nginx, n8n, mcp, security]
- source_path: /decisions/2025-10-28_cloudflare-proxy-trust-config_v01.md
- date: 2025-10-28

---

# ADR: Normalize Cloudflare-Terminated HTTPS & MCP Gateway Binding

## Context

During production testing of `https://n8n.bestviable.com` and `https://coda.bestviable.com`, Cloudflare tunnel requests entered the droplet over plain HTTP (Cloudflare terminates TLS).  
nginx-proxy interpreted these as insecure hits and forced redirects back to HTTPS (`301`), creating infinite loops for n8n.  
Separately, the Coda MCP gateway only listened on `127.0.0.1:8080`, so nginx (reaching it via `172.20.x.x`) received connection refused errors (HTTP 502).

## Decision

1. **Trust Cloudflare as the TLS edge**  
   - `nginx-proxy` now runs with `TRUST_DOWNSTREAM_PROXY=true`.  
   - Each public service sets `HTTPS_METHOD=noredirect` to bypass automatic 80 → 443 redirects (Cloudflare already enforces HTTPS).

2. **Publish correct external URLs for n8n**  
   - Set `N8N_PROTOCOL=https`, `N8N_EDITOR_BASE_URL`, `N8N_API_BASE_URL`, `WEBHOOK_URL`, and `N8N_EXTERNAL_FRONTEND_BASE_URL` to `https://n8n.${DOMAIN}/`.  
   - Keeps secure cookies valid and prevents `ERR_TOO_MANY_REDIRECTS`.

3. **Bind MCP gateway to proxy network**  
   - Override compose command to run `mcp-proxy --host 0.0.0.0 --port 8080 -- node dist/index.js` so the service listens on all interfaces.  
   - Allows nginx to connect at `http://coda-mcp-gateway:8080` without 502 errors.

## Alternatives Considered

| Option | Outcome |
|--------|---------|
| Leave defaults | Persistent redirect loop (n8n) and 502 errors (Coda). |
| Enable per-app TLS inside containers | Added complexity, duplicated certificate management, no benefit behind Cloudflare. |
| Replace nginx-proxy | High effort; existing auto-discovery pattern already aligned with SyncBricks design. |

## Consequences

### Positive
- Stable HTTPS access for n8n via Cloudflare tunnel, including secure cookies.
- MCP gateway reachable through nginx; `/sse` endpoint functional for clients.
- Configuration documented in compose file and this ADR for future operators.

### Negative / Follow-ups
- Browsers still see a 404 at `/` for the MCP gateway (expected; no landing page).  
- Safari/Brave can warn about secure cookies on first load; acceptable given strict settings.
- Need to communicate the reliance on `/sse` to client tools.

## Notes & References

- Compose updates: `ops/docker-compose.production.yml` (n8n env vars, HTTPS method, command override).  
- Validation commands: `curl --resolve`, `docker logs cloudflared`, `docker logs nginx-proxy`.  
- Related documentation: `/context/sessions/2025-10-28_n8n-coda-production-notes.md`, `/SESSION_HANDOFF_2025-10-28_v1.md`.

## Status

✅ Implemented 2025-10-28. Review when adding new tunnel-exposed services or changing proxy stack.
