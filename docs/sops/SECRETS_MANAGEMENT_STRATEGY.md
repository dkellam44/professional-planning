# Secrets Management Strategy - Phase 3+

- entity: secrets_strategy
- level: internal
- zone: internal
- version: v01
- tags: [secrets, security, infisical, vault, phase3, post-launch]
- source_path: /docs/SECRETS_MANAGEMENT_STRATEGY.md
- date: 2025-11-05

---

## Overview

Post-Phase 3, when workflows go live, API keys and credentials will be scattered across:
- N8N workflow credentials
- Open WebUI environment variables
- Postgres connection strings
- Cloudflare tunnel token
- OpenRouter API keys
- Coda API token

This document recommends a secrets management solution and deployment plan.

---

## Recommendation: Infisical

**Decision: Deploy Infisical as the secrets backend**

### Why Infisical Over Hashicorp Vault?

| Factor | Infisical | Vault | Decision |
|--------|-----------|-------|----------|
| **Setup Time** | 15 mins (Docker) | 30+ mins (HA setup needed) | ✅ Infisical |
| **Resource Footprint** | ~100MB RAM | ~200MB+ RAM | ✅ Infisical |
| **API Key Auto-Rotation** | Native feature | Enterprise only | ✅ Infisical |
| **N8N Integration** | REST API (simple) | Native plugin (better) | Tie |
| **Learning Curve** | Low (intuitive UI) | Steep (complex) | ✅ Infisical |
| **OSS & Free** | ✅ Yes (Infisical Cloud free tier) | ✅ Yes | Tie |
| **Audit Logging** | ✅ Built-in | ✅ Built-in | Tie |
| **Docker Compatibility** | ✅ Excellent | ✅ Good | ✅ Infisical |
| **Deployment Maturity** | Production-ready | Industry standard | Vault |
| **2GB Droplet Fit** | ✅ Comfortable (leaves room for workflows) | ❌ Tight (would push RAM) | ✅ Infisical |

**Conclusion:** Infisical is the right choice for this use case (learning project on 2GB droplet with future automation).

---

## Infisical Deployment Plan

### Phase 1: Minimal Setup (Post-Phase 3, Week 1)

**Deployment Location:** Droplet (same 2GB instance)
**Resource Allocation:** 100-150MB RAM, 5GB disk
**Approach:** Docker Compose alongside existing stack

### Step 1: Deploy Infisical Container

**Add to `/infra/apps/docker-compose.yml`:**

```yaml
infisical:
  image: infisical/infisical:latest
  container_name: infisical
  restart: unless-stopped
  environment:
    - NODE_ENV=production
    - ENCRYPTION_KEY=${INFISICAL_ENCRYPTION_KEY:-$(openssl rand -base64 32)}
    - DB_CONNECTION_URI=postgresql://n8n:${POSTGRES_PASSWORD}@postgres:5432/infisical
    - AUTH_SECRET=${INFISICAL_AUTH_SECRET:-$(openssl rand -base64 32)}
    - PORT=8080
  volumes:
    - infisical_data:/app/data
  networks:
    - n8n_proxy
    - n8n_syncbricks
  ports:
    - "127.0.0.1:8086:8080"
  deploy:
    resources:
      limits:
        memory: 150m
  labels:
    - "VIRTUAL_HOST=secrets.bestviable.com"
    - "VIRTUAL_PORT=8080"
    - "LETSENCRYPT_HOST=secrets.bestviable.com"
  depends_on:
    - postgres

volumes:
  infisical_data:
    driver: local
```

### Step 2: Initialize Database

```bash
# Run migration
ssh tools-droplet-agents "docker exec infisical npm run migration:latest"

# Create initial admin user (UI-driven)
# Visit https://secrets.bestviable.com
# Set up admin credentials
```

### Step 3: Create Organization & Projects

**In Infisical UI:**

1. Create organization: `portfolio`
2. Create project: `production`
3. Create environments:
   - `dev` (for testing)
   - `prod` (for live)

### Step 4: Populate Secrets

**Secrets to store:**

```
Project: production
Environment: prod

[API Keys]
OPENROUTER_API_KEY = sk-or-v1-...
CODA_API_TOKEN = ...
GITHUB_TOKEN = ...
CLOUDFLARE_TOKEN = ...

[Database]
POSTGRES_PASSWORD = ...
POSTGRES_CONNECTION_STRING = postgresql://...

[Service Tokens]
N8N_WEBHOOK_SECRET = ...
```

---

## Integration Points

### 1. N8N Credentials (Primary Use Case)

**Instead of storing directly in N8N, use HTTP requests to fetch from Infisical:**

**N8N Workflow Pattern:**
```
1. Trigger (webhook)
   ↓
2. HTTP Request Node:
   - Method: GET
   - URL: https://secrets.bestviable.com/api/v3/secrets/OPENROUTER_API_KEY
   - Auth: Bearer {{INFISICAL_SERVICE_TOKEN}}
   - Response: {"secret": "sk-or-v1-..."}
   ↓
3. Set Variable: OPENROUTER_KEY = response.secret
   ↓
4. Use OPENROUTER_KEY in subsequent nodes
```

**Benefits:**
- No secrets stored in N8N workflows (auditable)
- Auto-rotation happens in Infisical, workflows pick up new key automatically
- Service account token can be rotated independently

### 2. Open WebUI

**Current:** Environment variable at startup
```bash
docker run \
  -e OPENROUTER_API_KEY=sk-or-v1-... \
  ...
```

**Future:** Fetch from Infisical on startup
```bash
# Add init script to container entrypoint
#!/bin/bash
OPENROUTER_KEY=$(curl -s https://secrets.bestviable.com/api/v3/secrets/OPENROUTER_API_KEY \
  -H "Authorization: Bearer $INFISICAL_SERVICE_TOKEN" | jq -r .secret)

export OPENROUTER_API_KEY=$OPENROUTER_KEY
# Run original Open WebUI
exec node server.js
```

### 3. Postgres Connection (N8N)

**N8N Postgres nodes:**
- Currently: Connection string hardcoded
- Future: Use Infisical service account to fetch DSN at runtime

---

## Auto-Rotation Strategy

### API Key Rotation (90-day policy)

**Infisical Feature:** Scheduled rotation

1. Configure rotation policy:
   - Rotation interval: 90 days
   - Auto-rotate: OPENROUTER_API_KEY, CODA_API_TOKEN
   - Preserve old keys: Last 2 versions (for grace period)

2. N8N automatically picks up new key from next API call

3. Audit trail in Infisical: `Key rotated from X to Y on Z date`

### Service Token Rotation (Monthly)

**Infisical Service Tokens:**
- Used by N8N to authenticate to Infisical API
- Rotate monthly via Infisical UI
- Update in N8N environment variables (or use secrets manager for this too)

---

## Security Best Practices

### 1. Network Isolation
- Infisical on `n8n_proxy` + `n8n_syncbricks` networks
- Only accessible internally or via Cloudflare Tunnel
- No direct internet exposure

### 2. Service Account Permissions
- Create service account: `n8n-fetcher`
- Grant only read access to production secrets
- No write/delete permissions
- Audit logging on all reads

### 3. Backup & Recovery
- Infisical database (Postgres) - backed up with main DB
- Encryption key stored securely (not in Git, use `.env`)
- Recovery procedure documented in `/docs/infrastructure/`

### 4. Audit Trail
- Infisical logs all secret access
- Check logs for unauthorized reads:
  ```bash
  # In Infisical UI: Logs section
  # Filter by: timestamp, service_account, secret_name
  ```

---

## Deployment Timeline

### Immediate (Post-Phase 3)
- [ ] Add Infisical to docker-compose
- [ ] Deploy and initialize
- [ ] Create projects/environments
- [ ] Populate non-rotating secrets (DB passwords, tokens)

### Week 1
- [ ] Update N8N workflows to fetch OPENROUTER_API_KEY from Infisical
- [ ] Test with curl (manual fetch)
- [ ] Update Open WebUI init script

### Week 2
- [ ] Enable API key rotation policies
- [ ] Document recovery procedures
- [ ] Audit trail monitoring in place

### Week 3+
- [ ] Migrate all remaining hardcoded secrets to Infisical
- [ ] Sunset environment variables
- [ ] Quarterly rotation cycle established

---

## Cost & Resource Impact

### Infisical Cloud (Recommended for learning/hobby)
- **Cost:** Free tier (unlimited secrets)
- **Backup:** Automatic (by Infisical)
- **Maintenance:** Zero (managed service)

### Self-Hosted (If you want full control)
- **Cost:** Free (OSS)
- **Resources:** 100-150MB RAM on droplet
- **Maintenance:** You manage upgrades, backups, recovery

**Recommendation:** Start with Cloud free tier, migrate to self-hosted if needed later.

---

## Infisical Cloud Setup (Fastest Path)

If using Infisical Cloud instead of self-hosted:

1. Sign up: https://app.infisical.com
2. Create organization: `portfolio`
3. Create project: `production`
4. Generate service account token
5. Store token in `.env` on droplet:
   ```bash
   INFISICAL_SERVICE_TOKEN=...
   ```
6. N8N HTTP nodes point to: `https://app.infisical.com/api/v3/secrets`

**Benefits:**
- No additional Docker container (saves RAM)
- No backups to manage
- No infrastructure to maintain
- Free tier covers hobby use

---

## Fallback Plan (If Infisical Fails)

If Infisical is down and N8N workflows can't fetch secrets:

1. **Graceful degradation:** N8N uses last-known-good cached value (stored locally)
2. **Manual override:** Administrator can set `OPENROUTER_API_KEY=...` in environment
3. **Recovery:** Fix Infisical, restart N8N, resume normal operation

---

## Comparison with Current State

### Before (Phase 3 deployment)
```
Open WebUI Environment → OPENROUTER_API_KEY (hardcoded)
N8N Credentials → Postgres credentials (hardcoded)
Risk: Secrets visible in docker-compose, git history, environment
```

### After (Infisical deployed)
```
Open WebUI → [startup init script] → Infisical API ← secrets
N8N → [HTTP Request node] → Infisical API ← secrets
Risk: Only service token exposed; all keys centralized and auditable
```

---

## Next Steps

1. **Choose deployment method:**
   - ✅ **Recommended:** Infisical Cloud (free, zero-ops)
   - **Alternative:** Self-hosted Infisical (if you want full control)
   - **Not recommended:** Continue hardcoding (security risk)

2. **Create account & initialize** (if Cloud)
   - Infisical Cloud signup: 5 mins
   - Create organization: 2 mins
   - Generate service token: 1 min

3. **Plan integration** (Week after Phase 3)
   - Update N8N fetch logic
   - Test with non-critical keys first
   - Monitor for 48 hours, then go full rotation

4. **Monitor & audit**
   - Weekly: Check Infisical audit logs
   - Monthly: Review rotation schedule
   - Quarterly: Test recovery procedure

---

**Version:** 1.0
**Status:** Ready for Phase 3 completion → immediate post-launch
**Effort:** 2-3 hours setup, then 30 mins/month for rotation
**ROI:** Significant security improvement, minimal operational overhead

