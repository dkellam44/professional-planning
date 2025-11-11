# Infisical Secrets Manager Pilot

- entity: runbook
- level: operational
- zone: internal
- version: v01
- tags: [infisical, secrets, deployment]
- source_path: /infra/infisical/README.md
- date: 2025-11-06

---

## Overview
This directory contains the pilot deployment for [Infisical](https://infisical.com/), an OSS secrets manager. The goal is to centralize credentials currently stored in local `.env` files (n8n, MCP services, Cloudflare tunnel, Archon). Once live, clients will fetch secrets at runtime via Infisical’s CLI or API.

## Deployment Steps

1. **Prepare environment**
   ```bash
   cd /root/portfolio/infra/infisical
   cp .env.example .env
   # Fill in strong values for POSTGRES_PASSWORD, ENCRYPTION_KEY, NEXTAUTH_SECRET, etc.
   ```
2. **Deploy stack**
   ```bash
   docker compose up -d
   ```
3. **Add Cloudflare route**
   - Dashboard → Access → Tunnels → `tools-droplet-agents`
   - Add Hostname: `infisical.bestviable.com`
   - Service: `http://nginx-proxy`
4. **Reload proxy**
   ```bash
   docker compose -f /root/portfolio/infra/n8n/docker-compose.yml up -d
   ```
5. **Create admin account**
   - Visit https://infisical.bestviable.com
   - Complete onboarding, create project `portfolio-prod`
6. **Generate machine identities**
   - Create service tokens for n8n, MCP servers, deployment scripts
   - Store tokens in 1Password/Vault until clients consume them
7. **Import secrets** (see `../../sot/secrets_manifest_v0_1.yaml`)
   - CF tunnel token
   - n8n encryption/jwt secrets
   - MCP API keys (Coda, GitHub, Firecrawl, etc.)
   - Supabase/OpenAI/Redis creds for Archon/Open WebUI
   - Authenticate with a Machine Identity (Universal or Token auth) so the CLI gets an `INFISICAL_TOKEN` for the target project.
   - Export `INFISICAL_API_URL=https://infisical.bestviable.com/api` and, if required, `INFISICAL_PROJECT_ID=<uuid>`.
   - Run `./import_from_dotenv.sh ../config/.env.local portfolio-prod prod` (project/env args are for logging; scope comes from the token + `--env`).

## Client Integration

### n8n
Add an Infisical sidecar to `infra/n8n/docker-compose.yml` or use the CLI wrapper:
```bash
infisical run --project=portfolio-prod --env=prod -- docker compose up -d
```
This injects secrets at runtime without committing them to disk. Update CI/deploy scripts accordingly.

### MCP Services
Replace static env blocks with Infisical-injected env files:
```bash
infisical export --project=portfolio-prod --env=prod --format=env > /root/portfolio/infra/mcp-servers/.env
```
Then reference the generated `.env` from docker compose (remove plain-text secrets afterwards).

### Archon/Open WebUI Deployments
Use Infisical CLI in deployment pipelines to fetch Supabase/Redis/OpenAI keys:
```bash
infisical export --project=portfolio-prod --env=prod --format=dotenv > archon/.env
```

## Backups & Access Control
- Enable Infisical backup job (UI → Settings → Backups).
- Use role-based access: Owner (David), Machine (n8n, MCP, Deploy).
- Rotate machine tokens quarterly; revoke immediately if compromised.

## Next Steps
- Pilot with n8n first, then migrate MCP services.
- Remove plaintext secrets from repo once clients are sourcing from Infisical.
- Update CI/deployment scripts to rely on Infisical CLI.
- Document fallback/restore procedure (weekly export of encrypted backup).
