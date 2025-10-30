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
├── docker-compose.production.yml    ← Compose file
├── Dockerfile.*-mcp-gateway         ← Build configurations
├── .env                             ← Example (real .env on droplet only)
├── runbooks/                        ← Documentation
└── quality_gates/                   ← Scripts
```

### Droplet (After Sync)
```
/root/portfolio/ops/
├── docker-compose.production.yml    ← Active compose (runtime)
├── .env                             ← Real secrets (NOT synced)
└── data/                            ← Volumes (NOT synced)

/root/portfolio/docs/ops/
├── Dockerfile.*-mcp-gateway         ← Build configs (synced)
├── runbooks/                        ← Documentation (synced)
└── quality_gates/                   ← Scripts (synced)
```

---

## Sync Procedure

### Standard Sync (Dockerfiles + Docs)

```bash
cd /Users/davidkellam/workspace/portfolio

# 1. Copy Dockerfiles to docs/ops/
scp docs/ops/Dockerfile.* root@159.65.97.146:/root/portfolio/docs/ops/

# 2. Copy compose to ops/
scp docs/ops/docker-compose.production.yml root@159.65.97.146:/root/portfolio/ops/

# 3. Copy documentation and scripts
scp -r docs/ops/runbooks root@159.65.97.146:/root/portfolio/docs/ops/
scp -r docs/ops/quality_gates root@159.65.97.146:/root/portfolio/docs/ops/

# 4. Verify
ssh root@159.65.97.146 "ls /root/portfolio/docs/ops/Dockerfile.* && ls /root/portfolio/ops/docker-compose.production.yml"
```

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
❌ `/root/portfolio/ops/data/` (volumes stay on droplet)
❌ `/root/portfolio/ops/certs/` (SSL certificates stay on droplet)

### Correct Path References

Dockerfiles use relative paths from portfolio root:
```dockerfile
COPY integrations/mcp/servers/coda/src/package.json ./
```

Compose file uses relative paths from ops directory:
```yaml
build:
  context: ..                           # /root/portfolio
  dockerfile: docs/ops/Dockerfile.coda-mcp-gateway
```

This allows correct builds whether running locally or on droplet.

---

## Troubleshooting

**"Cannot find Dockerfile" error**:
- Verify compose context is `..` (parent of /ops/)
- Verify dockerfile path is `docs/ops/Dockerfile.name`

**Build fails with missing source code**:
- Ensure source directories are synced: `integrations/mcp/servers/coda/src/`
- Check COPY commands in Dockerfile use correct paths

**Wrong version deployed**:
- Verify you synced the latest files: `ssh root@159.65.97.146 "md5sum /root/portfolio/docs/ops/Dockerfile.*"`
- Compare with local: `md5sum /Users/davidkellam/workspace/portfolio/docs/ops/Dockerfile.*`

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

**Last Updated**: 2025-10-30
**Related**: docker-compose.production.yml, Dockerfile.*.mcp-gateway
