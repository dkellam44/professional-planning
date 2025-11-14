---
- entity: procedure
- level: operational
- zone: internal
- version: v01
- tags: [ops, deployment, sync, droplet]
- source_path: /docs/infrastructure/deployment/SYNC_PROCEDURE.md
- date: 2025-10-30
---

# Infrastructure Sync Procedure

**Purpose**: Keep local `/infra/` assets and droplet `/root/portfolio/infra/` in lockstep.

**Scope**: docker-compose files, Dockerfiles, helper scripts, infrastructure docs. Secrets and runtime volumes remain droplet-only.

---

## 1. Directory Overview

### Local (`/Users/davidkellam/workspace/portfolio`)
```
infra/
├── docker/
│   ├── docker-compose.production.yml
│   ├── docker-compose.example.yml
│   ├── services/
│   └── certs/, acme/, html/, data/, logs/, import/, vhost.d/ (git-kept placeholders)
├── config/.env.example
└── scripts/
    ├── sync-to-droplet.sh
    ├── validate-structure.sh
    └── legacy troubleshooting scripts
```

### Droplet (`/root/portfolio`)
```
infra/
├── docker/                 # Mirrors local tree
├── config/.env             # Real secrets (never committed)
├── scripts/
└── docs/ (synced separately under /root/portfolio/docs/infrastructure)
```

> Compatibility: `/root/portfolio/ops` is a symlink to `../infra/docker` until 2025-11-15.

---

## 2. Standard Sync (Recommended)

A wrapper script handles rsync and exclusion rules:

```bash
cd /Users/davidkellam/workspace/portfolio
./infra/scripts/validate-structure.sh      # confirms required files exist
./infra/scripts/sync-to-droplet.sh          # prompts before rsync
```

Script behaviour:
- Syncs `infra/` → `/root/portfolio/infra/` (excludes `.env*`, `.DS_Store`)
- Syncs `docs/infrastructure/` (deployment docs) → droplet
- Leaves droplet `.env` untouched

---

## 3. Manual Sync (If Script Unavailable)

```bash
# Push infra tree
rsync -av --delete \
  --exclude 'config/.env*' \
  --exclude '*.DS_Store' \
  infra/ root@159.65.97.146:/root/portfolio/infra/

# Update infrastructure docs
rsync -av --exclude '*.DS_Store' \
  docs/infrastructure/ root@159.65.97.146:/root/portfolio/docs/infrastructure/
```

---

## 4. Post-Sync Steps on Droplet

```bash
ssh root@159.65.97.146
cd /root/portfolio/infra/docker

# Optional: rebuild specific service
# docker compose --env-file ../config/.env -f docker-compose.production.yml build digitalocean-mcp-gateway

# Apply changes
docker compose --env-file ../config/.env -f docker-compose.production.yml up -d
```

**Health Check**
```bash
docker compose -f docker-compose.production.yml ps
curl -I https://n8n.bestviable.com
curl -I https://coda.bestviable.com/sse
```

---

## 5. What Not to Sync

| Path | Reason |
|------|--------|
| `infra/config/.env` | Secrets live only on droplet |
| `infra/docker/data/` | Runtime volumes |
| `infra/docker/certs/` / `acme/` | Let's Encrypt state |
| `infra/docker/logs/` | Operational logs |
| Any `.DS_Store` | macOS artefacts |

---

## 6. Troubleshooting

**Compose cannot find Dockerfiles**
- Ensure compose file paths point to `infra/docker/services/*.Dockerfile` and `context: ../..`
- Confirm `infra/` synced successfully (`ls /root/portfolio/infra/docker/services`)

**Network address overlap**
- Old networks may linger. Run `docker compose down`, remove `docker_proxy` / `docker_syncbricks`, then `up -d` again.

**Containers restarting (DigitalOcean/Cloudflare MCP)**
- Provide real tokens in `/root/portfolio/infra/config/.env` (`DIGITALOCEAN_API_TOKEN`, `CLOUDFLARE_REMOTE_URL`, etc.).

---

## 7. Future Cleanup

- Remove `/docs/ops → ../infra/docker` symlink by **2025-11-15** after confirming no consumers remain.
- Consider adding CI linting to confirm compose/Dockerfile paths. 

**Last updated**: 2025-10-30 (post-infra restructure)
