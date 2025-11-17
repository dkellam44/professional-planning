# Coda MCP Server

Stytch OAuth 2.1–compliant Model Context Protocol (MCP) server for Coda. Phase 2 replaces the legacy Cloudflare Access middleware with Stytch-managed authentication while keeping a Bearer fallback for Claude Code/local development.

## Features

- ✅ **Stytch OAuth 2.1 Authentication** – External authorization server handles login, consent UI, PKCE, and token issuance.
- ✅ **Protected Resource Metadata** – `/.well-known/oauth-protected-resource` advertises Stytch’s issuer per RFC 9728.
- ✅ **Bearer Token Fallback** – Optional `Authorization: Bearer <token>` path for local dev while OAuth rollout finishes.
- ✅ **Coda API Proxy** – MCP requests forwarded to the Coda REST API using a service token kept server-side.
- ✅ **Health & Status Endpoints** – `/health` reports OAuth compliance; `/status` is a lightweight check.
- ✅ **Docker + Traefik Ready** – Container attaches to `docker_proxy` / `docker_syncbricks` networks behind Traefik v3.
- ✅ **Logging & Error Handling** – Structured logs for authentication outcomes and upstream API failures.

## Authentication Flow

1. Client hits `POST /mcp` without credentials → server returns `401` with `WWW-Authenticate: Bearer ... resource_metadata_uri="https://coda.bestviable.com/.well-known/oauth-protected-resource"`.
2. Client fetches the protected-resource metadata (PRM) → learns `authorization_servers: ["https://malachite-regnosaurus-2033.customers.stytch.com"]`.
3. Client opens `https://coda.bestviable.com/oauth/authorize?...` which renders the React/Vite page mounting Stytch’s `<B2BIdentityProvider />` component. The component walks the user through Stytch’s hosted login + consent UI.
4. Client exchanges the authorization code for an access token.
5. Client retries `/mcp` with `Authorization: Bearer <stytch-token>`; middleware validates signature **plus** `aud`, `iss`, and `exp` claims.

### Bearer Token Fallback (Development Only)
Set `BEARER_TOKEN` and run with `NODE_ENV=development` to bypass OAuth for Claude Code/local testing:
```bash
curl -H "Authorization: Bearer $BEARER_TOKEN" http://localhost:8080/mcp
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CODA_API_TOKEN` | ✅ | - | Coda service token used for upstream API calls |
| `STYTCH_PROJECT_ID` | ✅ | - | Project ID from the Stytch dashboard (**B2B project required**) |
| `STYTCH_SECRET` | ✅ | - | Stytch project secret |
| `STYTCH_DOMAIN` | ✅ | `https://api.stytch.com` | Issuer domain (update when creating the B2B project) |
| `STYTCH_PUBLIC_TOKEN` | ✅ | - | Browser-safe token used by the `/oauth/authorize` React app |
| `STYTCH_OAUTH_REDIRECT_URI` | ✅ | `https://coda.bestviable.com/oauth/authorize` | Redirect passed to Stytch login + consent UI |
| `BASE_URL` | ❌ | `https://coda.bestviable.com` | Public base URL used in metadata + headers |
| `PORT` | ❌ | `8080` | Server port |
| `HOST` | ❌ | `0.0.0.0` | Bind address |
| `LOG_LEVEL` | ❌ | `info` | One of `debug`, `info`, `warn`, `error` |
| `BEARER_TOKEN` | ❌ | - | Dev-only token used when OAuth is bypassed |

> ℹ️ `.env` currently contains **B2C** credentials (`project-live-543e711c-431a-4958-ac10-9ee5af154558`). Creating a new **B2B** project will issue new IDs/secrets/domains. Rotate values locally, in docker-compose, and on the droplet immediately after the B2B project is created.

## Running Locally

```bash
cd service-builds/mcp-servers/coda
npm install
cp .env.example .env  # populate with CODA/STYTCH secrets
npm run build
npm run dev
```

### Docker

```bash
cd service-builds/mcp-servers/coda
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Testing Quick Reference

```bash
# Protected resource metadata (public)
curl http://localhost:8080/.well-known/oauth-protected-resource | jq

# Health endpoint (public) – check oauth flag
curl http://localhost:8080/health | jq
# => {"auth":{"provider":"stytch","oauth_compliant":true}, ...}

# Dev-only Bearer flow
curl -X POST \
  -H "Authorization: Bearer $BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"method":"GET","path":"/docs"}' \
  http://localhost:8080/mcp
```

## Deployment

1. Update `.env` (local and droplet) with `STYTCH_PROJECT_ID`, `STYTCH_SECRET`, `STYTCH_DOMAIN`, `STYTCH_PUBLIC_TOKEN`, `CODA_API_TOKEN`.
2. `docker-compose down && docker-compose build --no-cache && docker-compose up -d`.
3. Verify Traefik route + Cloudflare tunnel.
4. Hit `/health`, `/.well-known/oauth-protected-resource`, and `/oauth/authorize` externally to confirm the React bundle loads.

## Development Workflow

Run the standard tooling before every change:

- `npm run lint`
- `npm test`
- `npm run build` (or `npm run build:auth` / `npm run build:server` individually)
- `npm run dev:auth` (optional Vite dev server for `/oauth/authorize`)
- `docker-compose up --build`

## Logs

```
[INFO] Stytch auth successful: user@example.com
[WARN] OAuth error invalid_token (audience mismatch)
[DEBUG] Forwarding MCP request → Coda API path=/docs
[ERROR] Coda API error: 403
```

## References

- MCP Spec (2025‑06‑18): https://modelcontextprotocol.io/specification/2025-06-18
- Stytch MCP OAuth Guide: https://stytch.com/blog/MCP-authentication-and-authorization-guide/
- Internal SOP: `docs/system/architecture/STYTCH_SETUP_GUIDE.md`
