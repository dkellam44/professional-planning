- entity: session
- level: handoff
- zone: internal
- version: v01
- tags: [infrastructure, cloudflare, docker, mcp, n8n]
- source_path: /SESSION_HANDOFF_2025-10-28_v1.md
- date: 2025-10-28

---

# Session Handoff — Cloudflare Tunnel & Service Access Stabilized

**Status**: 🟢 External access to n8n and Coda MCP verified (HTTPS)

**Previous Status**: 🔴 External HTTPS hit redirect loops (n8n) and 502s (Coda)

---

## What We Did Today

- Replaced legacy `virtual.*` labels with nginx-proxy compatible `VIRTUAL_HOST` envs and added `HTTPS_METHOD=noredirect`, `TRUST_DOWNSTREAM_PROXY=true` so Cloudflare-terminated requests stop looping back to HTTP.
- Published n8n’s external URLs (`N8N_PROTOCOL=https`, `N8N_EDITOR_BASE_URL`, `WEBHOOK_URL`, etc.) which cleared the ERR_TOO_MANY_REDIRECTS issue and keeps secure cookies valid.
- Ensured Coda MCP gateway binds to `0.0.0.0:8080` (compose override) instead of 127.0.0.1, fixing the connection refused errors from nginx.
- Verified Cloudflare DNS and tunnel routing (`dig`, `curl --resolve`, `docker logs cloudflared`) and confirmed `/sse` streams from `https://coda.bestviable.com/sse`.
- Documented new operations guidance (see `/context/sessions/2025-10-28_n8n-coda-production-notes.md`) and captured ADR `2025-10-28_cloudflare-proxy-trust-config_v01.md`.

---

## Current Tests / Evidence

```bash
curl -sSL -o /dev/null -w "%{http_code}\n" https://n8n.bestviable.com     # 200
curl -I --resolve coda.bestviable.com:443:127.0.0.1 https://coda.bestviable.com/sse  # 200
docker logs nginx-proxy --tail 40 | grep -E '(n8n|coda)'                  # single 200 hits
```

Browser checks: Chrome + Safari load n8n UI (Safari warns about secure cookie but functions). `https://coda.bestviable.com` returns 404 at `/` (expected); `/sse` streams for MCP clients.

---

## Decisions & Policies

1. **Cloudflare-terminated HTTPS** — treat Cloudflare as the TLS edge; keep nginx `TRUST_DOWNSTREAM_PROXY=true` and service-level `HTTPS_METHOD=noredirect`.
2. **n8n External URLs** — always set `N8N_PROTOCOL=https` plus the base URL env vars when running behind tunnels/proxies to avoid redirect loops.
3. **MCP Gateway Binding** — enforce `mcp-proxy` to listen on `0.0.0.0:8080` (compose command override) so nginx can reach it on the proxy network.

Details recorded in ADR `/decisions/2025-10-28_cloudflare-proxy-trust-config_v01.md`.

---

## Open Items / Next MITs

1. **Browser security warnings** — Evaluate Safari/Brave cookie warning mitigation (docs or optional toggle of `N8N_SECURE_COOKIE=false` if acceptable).
2. **Coda MCP client validation** — Configure CLI/chat transports to use `https://coda.bestviable.com/sse` and run end-to-end task (MCP handshake + sample query).
3. **Repo sync plan** — Document and implement workflow for syncing local repo to droplet (rsync/scp/git) so config drifts are minimized.

---

## Outstanding Questions

- Do we want an HTTP landing page for `https://coda.bestviable.com/` (vs 404) to reduce noise? Optional.
- Should we add automated health checks (n8n `/healthz`, MCP `/health`) for monitoring and uptime alerts?

---

## TTL

Review and update by **2025-11-01** unless work continues sooner.
