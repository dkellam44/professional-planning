---
- entity: procedure
- level: operational
- zone: internal
- version: v01
- tags: [ops, deployment, sync, droplet]
- source_path: /docs/ops/SYNC_PROCEDURE.md
- date: 2025-10-30
---

# Ops Directory Sync Procedure

**Purpose**: Standardized process for syncing operational files from local portfolio to droplet.

**Source**: `/docs/ops/` (local)
**Destination**: `/root/portfolio/ops/` and `/root/portfolio/docs/ops/` (droplet)

---

## Directory Structure

### Local Portfolio
```
/docs/ops/
├── docker-compose.production.yml    ← Compose file (source of truth)
├── Dockerfile.*-mcp-gateway         ← Build configurations
├── runbooks/                        ← Documentation
├── quality_gates/                   ← Scripts
└── .env.example                     ← Template (real .env on droplet only)
```

### Droplet (Runtime)
```
/root/portfolio/ops/
├── docker-compose.production.yml    ← Active compose (runtime, synced from local)
├── Dockerfile.*-mcp-gateway         ← Build configs (synced from local)
├── .env                             ← Real secrets (local-only, NOT synced)
├── data/                            ← Volumes (local-only, NOT synced)
└── certs/                           ← SSL certificates (local-only, NOT synced)
```

**Key Point**: All Dockerfiles and compose file are in `/root/portfolio/ops/` on droplet, with `docker-compose.production.yml` using `context: ..` to reference the parent `/root/portfolio/` directory for source code paths.

---

## Sync Procedure

### Standard Sync (Docker configs + Documentation)

```bash
cd /Users/davidkellam/workspace/portfolio

# 1. Copy all Docker configs to ops/ (Dockerfiles + compose)
scp docs/ops/Dockerfile.* docs/ops/docker-compose.production.yml root@159.65.97.146:/root/portfolio/ops/

# 2. Copy documentation and scripts to docs/ops/
scp -r docs/ops/runbooks docs/ops/quality_gates root@159.65.97.146:/root/portfolio/docs/ops/

# 3. Verify
ssh root@159.65.97.146 "ls /root/portfolio/ops/Dockerfile.* /root/portfolio/ops/docker-compose.production.yml"
```

**Note**: This syncs to `/root/portfolio/ops/` only. The `/root/portfolio/docs/ops/` directory on droplet contains only documentation/scripts, not Dockerfiles.

### After Updating Compose or Dockerfiles

```bash
ssh root@159.65.97.146
cd /root/portfolio/ops

# Rebuild affected service (example: coda-mcp-gateway)
docker compose build coda-mcp-gateway

# Redeploy
docker compose up -d coda-mcp-gateway

# Verify
curl -I https://coda.bestviable.com/sse
```

---

## Important Notes

### Never Sync These
❌ `/root/portfolio/ops/.env` (secrets stay on droplet)
❌ `/root/portfolio/ops/data/` (Docker volumes stay on droplet)
❌ `/root/portfolio/ops/certs/` (Let's Encrypt certificates stay on droplet)
❌ `/root/portfolio/ops/.DS_Store` (macOS artifacts)
❌ `/root/portfolio/docs/ops/Dockerfile.*` (now in `/ops/` on droplet, don't overwrite)

### Correct Path References

**Dockerfiles** reference source code from portfolio root:
```dockerfile
# Builds assume context: .. resolves to /root/portfolio/
COPY integrations/mcp/servers/coda/src/package.json ./
```

**Compose file** (in `/ops/`) uses parent directory context:
```yaml
coda-mcp-gateway:
  build:
    context: ..                           # /root/portfolio
    dockerfile: ops/Dockerfile.coda-mcp-gateway
```

This allows correct builds whether running locally (`/docs/ops/docker-compose.production.yml`) or on droplet (`/root/portfolio/ops/docker-compose.production.yml`).

---

## Troubleshooting

**"Cannot find Dockerfile" error**:
- Verify compose context is `..` (which resolves to `/root/portfolio/`)
- Verify dockerfile path is `ops/Dockerfile.name` (NOT `docs/ops/Dockerfile.name`)
- Confirm Dockerfiles are in `/root/portfolio/ops/` (not `/root/portfolio/docs/ops/`)

**Build fails with missing source code**:
- Ensure source directories are synced from local to droplet: `integrations/mcp/servers/coda/src/`
- Check COPY commands in Dockerfile use correct relative paths from portfolio root
- Verify context: `..` points to `/root/portfolio/` on droplet

**Wrong version deployed**:
- Verify latest files on droplet: `md5sum /root/portfolio/ops/Dockerfile.*`
- Compare with local: `md5sum /Users/davidkellam/workspace/portfolio/docs/ops/Dockerfile.*`
- If different, resync: `scp docs/ops/Dockerfile.* root@159.65.97.146:/root/portfolio/ops/`

---

## Automation (Future)

Consider adding to CI/CD:
```bash
# Deploy script
#!/bin/bash
scp docs/ops/Dockerfile.* root@$DROPLET:/root/portfolio/docs/ops/
scp docs/ops/docker-compose.production.yml root@$DROPLET:/root/portfolio/ops/
ssh root@$DROPLET "cd /root/portfolio/ops && docker compose up -d"
```

---

**Last Updated**: 2025-10-30 (refactored for cleaner structure)
**Related**: docker-compose.production.yml, Dockerfile.*.mcp-gateway, server_catalog_v01.md
**Key Change**: All Dockerfiles now consolidated in `/root/portfolio/ops/` on droplet (single sync target)
