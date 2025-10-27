- entity: operations
- level: runbook
- zone: internal
- version: v01
- tags: [droplet, cleanup, git, deployment, automation]
- source_path: /ops/DROPLET_CLEANUP_AND_GIT_SETUP.md
- date: 2025-10-27

---

# Droplet Cleanup & Git Setup Plan

## Current State Analysis

### Directory Structure
```
~/
├── backups/                    # Keep (safe to archive)
│   ├── n8n_infra_2025-10-21_0121.tgz
│   └── n8n_legacy_2025-10-21_0121.tgz
├── n8n_backup_2025-10-21.tgz  # DUPLICATE - can delete
├── infra/                      # LEGACY - can delete after verification
│   ├── .git/                   # Old repo
│   └── n8n/                    # Old Caddy setup (stopped)
└── portfolio/                  # ACTIVE - needs git setup
    └── ops/                    # Currently synced via SCP only
```

### Issues to Address
1. **Duplicate backups** — `n8n_backup_2025-10-21.tgz` in root is duplicate
2. **Legacy infra repo** — Old git repo with stopped Caddy setup
3. **portfolio not in git** — Currently SCP-only sync, no version control on droplet
4. **No pull/push workflow** — Manual SCP for every change

---

## Phase 1: Cleanup Legacy Files (5 minutes)

### Step 1: Archive Old Backups
```bash
ssh root@tools

# Move all backups to consolidated location
mkdir -p ~/backups/archive
mv ~/n8n_backup_2025-10-21.tgz ~/backups/archive/
mv ~/backups/n8n_infra_2025-10-21_0121.tgz ~/backups/archive/
mv ~/backups/n8n_legacy_2025-10-21_0121.tgz ~/backups/archive/

# Verify current deployment still running
cd ~/portfolio/ops
docker compose -f docker-compose.production.yml ps
```

### Step 2: Remove Legacy infra Directory
```bash
# Verify nothing is running from ~/infra/n8n
cd ~/infra/n8n
docker compose ps
# Should show: no containers

# Safe to remove entire legacy directory
cd ~
rm -rf ~/infra

# Verify
ls -la ~/ | grep -E "infra|n8n"
# Should only show: backups/ and portfolio/
```

### Step 3: Clean Up Root Directory
```bash
cd ~/

# Current structure after cleanup:
tree -L 2
# Expected:
# ~/
# ├── .bash_history
# ├── .bashrc
# ├── .cache/
# ├── .docker/
# ├── .git-credentials
# ├── .gitconfig
# ├── .ssh/
# ├── backups/
# │   └── archive/
# └── portfolio/
#     └── ops/
```

---

## Phase 2: Set Up Git on Droplet (10 minutes)

### Option A: Clone Fresh from GitHub (Recommended)

**Pros**: Clean, version-controlled, easy pull/push
**Cons**: Need to merge current .env and data/ directories

```bash
ssh root@tools

# 1. Backup current ops directory
cd ~
mv portfolio portfolio.backup

# 2. Clone portfolio repo from GitHub
git clone https://github.com/yourusername/portfolio.git
cd portfolio

# 3. Restore .env and data from backup
cp ~/portfolio.backup/ops/.env ~/portfolio/ops/.env
cp -r ~/portfolio.backup/ops/data ~/portfolio/ops/
cp -r ~/portfolio.backup/ops/certs ~/portfolio/ops/
cp -r ~/portfolio.backup/ops/acme ~/portfolio/ops/

# 4. Verify deployment still works
cd ~/portfolio/ops
docker compose -f docker-compose.production.yml ps

# 5. Set up git remote tracking
git remote -v
git branch --set-upstream-to=origin/main main

# 6. Test pull
git pull
```

### Option B: Initialize Git in Existing Directory

**Pros**: Keep everything in place
**Cons**: More complex setup, need to handle .gitignore

```bash
ssh root@tools
cd ~/portfolio

# 1. Initialize git if not already
git init
git remote add origin https://github.com/yourusername/portfolio.git

# 2. Fetch from remote
git fetch origin

# 3. Set up tracking branch
git branch --set-upstream-to=origin/main main

# 4. Check status
git status

# 5. If diverged, reset to remote (careful!)
# First verify what will be overwritten
git diff HEAD origin/main

# If safe, reset to remote
git reset --hard origin/main

# 6. Restore .env and data (not in git)
# These should already be present from SCP
ls -la ops/.env ops/data/
```

---

## Phase 3: Establish Sync Workflow (2 minutes)

### Workflow: Local → GitHub → Droplet

```bash
# Local machine workflow
cd ~/workspace/portfolio

# Make changes locally
vim ops/docker-compose.production.yml

# Commit to git
git add ops/docker-compose.production.yml
git commit -m "Update: configuration change"

# Push to GitHub
git push origin main

# On droplet, pull changes
ssh root@tools
cd ~/portfolio
git pull origin main

# Restart services if needed
cd ops
docker compose -f docker-compose.production.yml up -d
```

### Add Deployment Script

Create `~/portfolio/ops/deploy.sh` on droplet:

```bash
#!/bin/bash
# deploy.sh - Pull latest from GitHub and restart services

set -e
cd ~/portfolio

echo "Pulling latest from GitHub..."
git pull origin main

echo "Restarting services..."
cd ops
docker compose -f docker-compose.production.yml up -d

echo "Deployment complete!"
docker compose -f docker-compose.production.yml ps
```

Make executable:
```bash
chmod +x ~/portfolio/ops/deploy.sh
```

Then deploy with:
```bash
ssh root@tools ~/portfolio/ops/deploy.sh
```

---

## Phase 4: Gitignore Configuration

Ensure `.gitignore` covers sensitive files:

```gitignore
# Environment variables
.env
.env.*
!.env.example

# Data directories (persistent volumes)
ops/data/
ops/certs/
ops/acme/
ops/html/
ops/vhost.d/
ops/logs/

# Backups
ops/*.backup
ops/*.tgz

# Mac files
.DS_Store

# Editor files
*.swp
*~
```

Verify on droplet:
```bash
cd ~/portfolio
cat .gitignore
git status
# Should NOT show .env, data/, certs/ as untracked
```

---

## Phase 5: Automated Deployment Hook (Optional)

### Set Up GitHub Webhook → Droplet Auto-Deploy

If you want automatic deployments when pushing to GitHub:

1. **On droplet**: Set up webhook receiver
2. **On GitHub**: Configure webhook to call droplet endpoint
3. **Result**: Push to GitHub → Droplet auto-pulls and restarts

This requires:
- Webhook endpoint (e.g., via n8n workflow)
- Authentication token
- Deploy script execution

**For now**: Manual pull is safer until workflows are stable.

---

## Verification Checklist

After cleanup and git setup:

### Cleanup Verification
- [ ] `~/infra/` directory removed
- [ ] Only one backup directory: `~/backups/archive/`
- [ ] No duplicate `n8n_backup_2025-10-21.tgz` in root
- [ ] Clean `ls ~/` output

### Git Verification
- [ ] `~/portfolio/.git/` exists
- [ ] `git remote -v` shows correct GitHub repo
- [ ] `git status` shows clean working tree
- [ ] `git pull` works without errors
- [ ] `.gitignore` excludes .env and data/

### Deployment Verification
- [ ] All 7 containers still running
- [ ] `docker compose ps` shows healthy services
- [ ] n8n accessible at https://n8n.bestviable.com
- [ ] Coda accessible at https://coda.bestviable.com

---

## Emergency Rollback

If anything breaks during cleanup:

```bash
# Restore from backup
cd ~
rm -rf portfolio
mv portfolio.backup portfolio
cd portfolio/ops
docker compose -f docker-compose.production.yml up -d
```

---

## Timeline

| Phase | Duration | Downtime |
|-------|----------|----------|
| Phase 1: Cleanup | 5 min | None |
| Phase 2: Git Setup (Option A) | 10 min | ~2 min |
| Phase 2: Git Setup (Option B) | 5 min | None |
| Phase 3: Workflow Setup | 2 min | None |
| Phase 4: Gitignore | 2 min | None |
| **Total** | **15-20 min** | **0-2 min** |

---

## Recommended Approach

**Best for production stability**:

1. **Phase 1** (Cleanup): Do immediately, no risk
2. **Phase 2** (Git Setup): Use **Option B** (initialize in place), no downtime
3. **Phase 3** (Workflow): Set up pull-based deployment
4. **Phase 4** (Gitignore): Verify protection of sensitive files
5. **Phase 5** (Webhooks): Skip for now, add later if needed

This approach:
- ✅ Zero downtime
- ✅ Keeps current deployment intact
- ✅ Establishes version control
- ✅ Enables pull/push workflow

---

## Quick Start Commands

```bash
# SSH to droplet
ssh root@tools

# Phase 1: Cleanup
mkdir -p ~/backups/archive
mv ~/n8n_backup_2025-10-21.tgz ~/backups/archive/
mv ~/backups/*.tgz ~/backups/archive/
rm -rf ~/infra

# Phase 2: Git setup (Option B)
cd ~/portfolio
git init
git remote add origin https://github.com/yourusername/portfolio.git
git fetch origin
git branch --set-upstream-to=origin/main main
git status

# Phase 3: Test pull
git pull origin main

# Verify
docker compose -f ~/portfolio/ops/docker-compose.production.yml ps
```

Done! 🎉

---

**Status**: Ready to execute
**Risk**: Low (backup preserved, zero downtime with Option B)
**Benefit**: Version-controlled droplet, easy deployment workflow

