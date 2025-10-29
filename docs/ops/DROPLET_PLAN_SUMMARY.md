- entity: operations
- level: plan
- zone: internal
- version: v01
- tags: [droplet, cleanup, git, quick-reference]
- source_path: /ops/DROPLET_PLAN_SUMMARY.md
- date: 2025-10-27

---

# Droplet Cleanup & Git Setup — Quick Plan

## TL;DR

**Goal**: Clean up legacy files + establish git sync (local ↔ GitHub ↔ droplet)

**Time**: 15 minutes
**Risk**: Low (zero downtime with recommended approach)
**Benefit**: Version-controlled infrastructure, easy deployments

---

## What We'll Remove

```diff
~/
- ├── n8n_backup_2025-10-21.tgz     ❌ REMOVE (duplicate)
- ├── infra/                         ❌ REMOVE (legacy Caddy setup)
- │   ├── .git/                      ❌ REMOVE (old repo)
- │   └── n8n/                       ❌ REMOVE (stopped containers)
  ├── backups/                       ✅ KEEP (moved to archive/)
  │   └── archive/                   ✅ NEW (consolidated backups)
  └── portfolio/                     ✅ KEEP (active deployment)
      └── ops/                       ✅ ADD git tracking
```

---

## 3-Step Plan

### Step 1: Cleanup (5 min, zero downtime)

```bash
ssh root@tools

# Archive old backups
mkdir -p ~/backups/archive
mv ~/n8n_backup_2025-10-21.tgz ~/backups/archive/
mv ~/backups/*.tgz ~/backups/archive/

# Remove legacy infra
rm -rf ~/infra

# Verify deployment still running
cd ~/portfolio/ops && docker compose ps
```

**Result**: Clean directory structure, all backups archived

---

### Step 2: Git Setup (10 min, zero downtime)

**Option A: Clone Fresh** (cleaner, 2 min downtime)
```bash
cd ~
mv portfolio portfolio.backup
git clone https://github.com/YOUR_USERNAME/portfolio.git
cp portfolio.backup/ops/.env portfolio/ops/
cp -r portfolio.backup/ops/data portfolio/ops/
cp -r portfolio.backup/ops/certs portfolio/ops/
cd portfolio/ops && docker compose up -d
```

**Option B: Init in Place** (recommended, zero downtime)
```bash
cd ~/portfolio
git init
git remote add origin https://github.com/YOUR_USERNAME/portfolio.git
git fetch origin
git branch --set-upstream-to=origin/main main
git status  # should show .env, data/ as ignored
```

**Result**: Git-tracked portfolio directory on droplet

---

### Step 3: Test Pull/Push (2 min)

```bash
# On droplet: Pull latest
cd ~/portfolio
git pull origin main

# On local: Make change, push
cd ~/workspace/portfolio
echo "# Test" >> ops/README_TEST.md
git add ops/README_TEST.md
git commit -m "Test: verify git sync"
git push origin main

# On droplet: Pull change
cd ~/portfolio
git pull origin main
ls ops/README_TEST.md  # should exist
```

**Result**: Verified bidirectional sync works

---

## Future Workflow

### Making Changes

**Local → Droplet**:
```bash
# Local machine
cd ~/workspace/portfolio
vim ops/docker-compose.production.yml
git commit -am "Update: config change"
git push origin main

# Droplet
ssh root@tools "cd ~/portfolio && git pull && cd ops && docker compose up -d"
```

**Or use deploy script**:
```bash
ssh root@tools ~/portfolio/ops/deploy.sh
```

---

## Safety Checks

Before cleanup:
- [x] All 7 containers running (verified above)
- [x] Current deployment in ~/portfolio/ops/ (confirmed)
- [x] Backups exist in ~/backups/ (confirmed)
- [x] Legacy ~/infra/ containers stopped (verified earlier)

After cleanup:
- [ ] `ls ~/` shows only: `.bash*`, `.docker/`, `backups/`, `portfolio/`
- [ ] `docker compose ps` shows 7 healthy containers
- [ ] `git status` works in ~/portfolio/
- [ ] `git pull` successful
- [ ] Services still accessible

---

## Commands Reference

```bash
# Quick cleanup
ssh root@tools 'mkdir -p ~/backups/archive && mv ~/n8n_backup_2025-10-21.tgz ~/backups/archive/ && mv ~/backups/*.tgz ~/backups/archive/ && rm -rf ~/infra'

# Quick git setup (Option B)
ssh root@tools 'cd ~/portfolio && git init && git remote add origin https://github.com/YOUR_USERNAME/portfolio.git && git fetch origin && git branch --set-upstream-to=origin/main main'

# Deploy from local
ssh root@tools 'cd ~/portfolio && git pull origin main && cd ops && docker compose -f docker-compose.production.yml up -d'
```

---

## Files Created

Local documentation:
- ✅ `DROPLET_CLEANUP_AND_GIT_SETUP.md` — Full detailed guide
- ✅ `DROPLET_PLAN_SUMMARY.md` — This quick reference
- ✅ `cleanup-droplet.sh` — Automated cleanup script

Ready to execute!

---

**Recommendation**: Start with **Step 1 (Cleanup)** now — it's safe and has zero impact on running services.

