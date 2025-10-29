- entity: session
- level: context
- zone: internal
- version: v01
- tags: [infrastructure, troubleshooting, cloudflare, mcp, n8n]
- source_path: /context/sessions/2025-10-28_n8n-coda-production-notes.md
- date: 2025-10-28

---

# Session Notes — n8n & Coda MCP Production Access

## Summary

Stabilized external access to the DigitalOcean droplet via Cloudflare Tunnel:

- Added nginx-proxy compatible discovery (`VIRTUAL_HOST`, `LETSENCRYPT_*`) and set `HTTPS_METHOD=noredirect` so Cloudflare-terminated HTTPS stops looping.
- Trust Cloudflare’s `X-Forwarded-*` headers (`TRUST_DOWNSTREAM_PROXY=true`) and told n8n its real external URLs (`N8N_PROTOCOL=https`, `N8N_*_BASE_URL`, `WEBHOOK_URL`).
- Forced the Coda MCP gateway (`mcp-proxy`) to bind to `0.0.0.0:8080`, eliminating 502/refused errors from nginx.
- Verified DNS, tunnel health, and service endpoints (`/` 404 expected, `/sse` 200).

## Key Outcomes

| Area | Result |
|------|--------|
| n8n access | `https://n8n.bestviable.com` loads in Chrome/Safari (Safari warns about secure cookie). |
| MCP gateway | `/sse` endpoint returns HTTP 200; browsers see 404 at `/` by design. |
| Cloudflare tunnel | Four QUIC connectors registered; DNS still proxied (CNAME → tunnel). |
| Compose config | Environment vars + explicit command override captured in `/ops/docker-compose.production.yml`. |

## Maintenance Notes

1. **Redeploy sequence**: `scp docker-compose.production.yml …`, `docker compose up -d`, wait ~30s for n8n/Coda to become healthy.
2. **Health checks**: Use `curl --resolve <host>` to test Cloudflare → droplet path without DNS changes.
3. **Certificates**: `acme-companion` still uses Let's Encrypt; warnings (`ssl_stapling`) are informational only.
4. **MCP clients**: Configure transports to call `https://coda.bestviable.com/sse`. Root path intentionally 404s.

## Learning Topics To Review

- Reverse proxy headers: `TRUST_DOWNSTREAM_PROXY`, `X-Forwarded-Proto`, `HTTPS_METHOD` options.
- n8n production configuration: meaning of `N8N_PROTOCOL`, `N8N_EDITOR_BASE_URL`, secure cookies.
- Cloudflare Tunnel mechanics: how proxied CNAMEs and QUIC connectors deliver traffic to origins.
- MCP server wrappers (`mcp-proxy`): stdio ↔ HTTP bridging, why binding to `0.0.0.0` matters.

## Infrastructure Update Checklist (Quick Ref)

1. Update compose file locally (`ops/docker-compose.production.yml`).
2. `scp` compose + any Dockerfiles to `/root/portfolio/ops`.
3. `docker compose -f docker-compose.production.yml up -d`.
4. Verify:
   - `docker compose ps` → all `Up` (healthy where configured).
   - `curl -sSL -o /dev/null -w "%{http_code}" https://n8n.bestviable.com` → 200.
   - `curl -I https://coda.bestviable.com/sse` → 200.
   - `docker logs cloudflared | grep Registered tunnel`.

## Decisions Logged

- ADR `/decisions/2025-10-28_cloudflare-proxy-trust-config_v01.md` captures HTTPS handling + MCP bind strategy.

## Possible Next Steps

1. Wire additional MCP transports (e.g., Coda CLI, chat clients) through `https://coda.bestviable.com/sse`.
2. Formalize repo→droplet sync (git remote, rsync script, or n8n-driven automation).
3. Consider a small landing page/service registry so `/` doesn’t 404 if that confuses users.
4. Add uptime/alerting (n8n `/healthz`, MCP `/sse` reachability) via Cron or monitoring stack.

---

**TTL**: Promote key learnings into playbooks by **2025-11-05** or after next infrastructure change.
