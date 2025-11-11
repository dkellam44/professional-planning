---
entity: playbook
level: operational
zone: internal
version: v01
tags: [deployment, legacy-code, backups, development, droplet, best-practices]
source_path: /agents/playbooks/codebase-hygiene-deployment-best-practices_v01.md
date: 2025-11-01
status: active
---

# Codebase Hygiene & Deployment Best Practices

**Purpose**: Keep your droplet deployment lean, avoid legacy code bloat, and maintain clean git history

---

## Problem Statement

**What Goes Wrong**:
- Old code versions pile up in docker images (3GB → 5GB → 7GB over time)
- Backup files clutter source (`.old`, `.bak`, `v1_`, `v2_`)
- Git history becomes messy (merge commits, reverts, branch chaos)
- Docker builds include unused files (node_modules, dist/, .git/)
- Multiple versions of same service running (stale containers)
- No clear way to rollback without complete rebuild

**Result**:
- Slow deploys
- Wasted disk space on droplet
- Hard to debug (which version is running?)
- Difficult to rollback (no clean snapshots)

---

## Strategy: Three-Layer Approach

### Layer 1: Local Development (Your Machine)
**Keep clean, iterate fast**

### Layer 2: Git Repository (GitHub)
**Single source of truth**

### Layer 3: Droplet Deployment (Production)
**Minimal, optimized for runtime**

---

## Layer 1: Local Development

### ✅ DO: Keep Multiple Versions Locally

```bash
# Use git branches for experiments
git checkout -b feature/oauth-v2

# Keep local backups in a separate directory
/Users/davidkellam/workspace/
├── portfolio/              # Current working version
├── portfolio-backup-2025-11-01/  # Snapshot before major change
└── experiments/
    ├── oauth-approach-1/
    ├── oauth-approach-2/
    └── auth-redesign/
```

**Benefits**:
- No clutter in main codebase
- Easy to reference old approaches
- Can experiment without affecting production

### ✅ DO: Use .gitignore Aggressively

```bash
# .gitignore template for Node.js MCP
node_modules/
dist/
*.log
.env
.env.local
.DS_Store
*.bak
*.old
.tmp/
coverage/
.nyc_output/

# Keep only what's needed
# - src/
# - package.json
# - tsconfig.json
# - .gitignore
```

### ❌ DON'T: Commit Backup Files

```bash
# BAD - don't do this
git add server.ts.backup
git add http-server.ts.old
git add response-wrapper.v1.ts

# GOOD - use git history instead
git log --oneline src/http-server.ts
git show HEAD~2:src/http-server.ts  # See version from 2 commits ago
```

### ✅ DO: Use Git Branches for Versions

```bash
# Instead of: http-server-v1.ts, http-server-v2.ts
# Use branches:

git checkout -b feature/http-native-base
# ... implement core
git commit -m "Add HTTP-native server skeleton"

git checkout -b feature/http-native-token-estimation
# ... enhance with tokens
git commit -m "Add token estimation framework"

git checkout -b feature/http-native-memory-hooks
# ... add memory hooks
git commit -m "Add memory hook callbacks"

# When ready to merge all:
git checkout main
git merge feature/http-native-base
git merge feature/http-native-token-estimation
git merge feature/http-native-memory-hooks
```

---

## Layer 2: Git Repository

### ✅ DO: Clean Commit History

```bash
# Good commit message
git commit -m "Enhance: HTTP server - add token estimation

- Create token-counter utility
- Add response metadata wrapper
- Track session metrics
- Implement token budgeting

Status: Token estimation framework complete"

# Bad commit message
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "working version"
```

### ✅ DO: Squash Before Merging

```bash
# If you have messy branch history:
git log main..feature/my-feature --oneline
# Output:
# a1b2c3d Fix typo
# b2c3d4e Add token counting
# c3d4e5f WIP: refactor
# d4e5f6g Add response wrapper
# e5f6g7h Fix imports again

# Rebase and squash
git rebase -i main

# In editor, mark all as 'squash' except first
# Result: one clean commit per feature
```

### ✅ DO: Tag Release Versions

```bash
# Before deploying to droplet, tag
git tag -a v0.1.0-coda-http-native -m "Coda MCP HTTP-native initial release
- Token estimation framework
- Memory hooks integration
- Ready for OAuth integration"

git push origin v0.1.0-coda-http-native

# Later, can easily checkout:
git checkout v0.1.0-coda-http-native
```

### ❌ DON'T: Keep Deprecated Code in Main Branch

```bash
# BAD - old versions cluttering the repo
src/
├── http-server.ts
├── http-server.v1.ts      # Don't do this
├── http-server.v2.ts      # Don't do this
├── http-server.old.ts     # Don't do this
└── http-server.backup.ts  # Don't do this

# GOOD - old versions accessible via git history
src/
└── http-server.ts         # Only current version
# Access old versions via: git show <commit>:src/http-server.ts
```

---

## Layer 3: Droplet Deployment

### Container Strategy: Minimal Images

#### ✅ DO: Use .dockerignore

```dockerfile
# .dockerignore
node_modules/
dist/
.git/
.gitignore
README.md
*.md
.DS_Store
.env.local
.nyc_output/
coverage/
.github/
tests/
.eslintrc*
.prettierrc

# Keep only production essentials
# COPY package.json
# COPY src/
# RUN npm ci --production  (NOT npm install - production only)
```

**Result**: Image size 200MB instead of 600MB

#### ✅ DO: Multi-Stage Docker Builds

```dockerfile
# Stage 1: Build
FROM node:23-alpine AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Stage 2: Runtime (minimal)
FROM node:23-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY --from=builder /build/dist ./dist
CMD ["node", "dist/http-server.js"]
```

**Result**:
- Build image: 500MB (deleted after build)
- Runtime image: 150MB (deployed)

#### ❌ DON'T: Include Build Artifacts in Production

```dockerfile
# BAD
COPY . /app
RUN npm install
RUN npm run build
CMD ["node", "dist/index.js"]
# Result: 600MB image with dev dependencies + source code + node_modules

# GOOD
FROM node:23-alpine AS builder
COPY . /build
RUN npm ci && npm run build

FROM node:23-alpine
COPY --from=builder /build/dist ./dist
COPY package*.json ./
RUN npm ci --production
CMD ["node", "dist/index.js"]
# Result: 150MB image with only runtime dependencies
```

### Deployment Strategy: Clean Transitions

#### ✅ DO: Version Your Docker Images

```bash
# Tag by version and date
docker build -t coda-mcp:v0.1.0 .
docker build -t coda-mcp:v0.1.0-2025-11-01 .
docker build -t coda-mcp:latest .

# In docker-compose.production.yml
services:
  coda-mcp:
    image: coda-mcp:v0.1.0
    # Not 'latest' - explicit version for easy rollback
```

#### ✅ DO: Keep Old Images for Rollback

```bash
# On droplet, keep last 2-3 images
docker images

# Result:
# REPOSITORY   TAG           SIZE
# coda-mcp     v0.1.0        150MB     # Current
# coda-mcp     v0.0.9        150MB     # Previous (for rollback)
# coda-mcp     v0.0.8        150MB     # Older
# (delete older versions to save space)

# Rollback:
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml up -d  # Uses v0.0.9 if you change compose file
```

#### ✅ DO: Use Volume Mounts for Data

```yaml
# docker-compose.production.yml
services:
  coda-mcp:
    image: coda-mcp:v0.1.0
    volumes:
      - coda-data:/app/data  # Persistent data (survives container restart)
      - coda-logs:/app/logs  # Persistent logs
    # When image updates, data persists

volumes:
  coda-data:
  coda-logs:
```

#### ✅ DO: Health Checks

```yaml
# docker-compose.production.yml
services:
  coda-mcp:
    image: coda-mcp:v0.1.0
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    # Docker automatically restarts if unhealthy
```

---

## Practical Workflow: Development to Deployment

### Local Development (Weekly)

```bash
# 1. Feature branch
git checkout -b feature/oauth-integration
cd integrations/mcp/servers/coda

# 2. Make changes, test locally
pnpm build
node dist/http-server.js
curl http://localhost:8080/health

# 3. Commit often with clear messages
git commit -m "Add OAuth discovery endpoints"

# 4. Before push, clean up
git log feature/oauth-integration --oneline  # Review commits
git rebase -i main  # Squash if needed
```

### Code Review & Testing (Before Merge)

```bash
# 1. Create PR on GitHub
gh pr create --title "Add OAuth integration"

# 2. Run local tests
pnpm test

# 3. Merge to main when approved
gh pr merge --squash  # Squash commits for clean history
```

### Deployment Prep (Before Droplet)

```bash
# 1. Tag release
git tag -a v0.1.1 -m "Add OAuth integration"

# 2. Build image locally (test first)
docker build -t coda-mcp:v0.1.1 .

# 3. Test image
docker run -p 8080:8080 coda-mcp:v0.1.1
curl http://localhost:8080/health

# 4. Push to droplet
scp -r integrations/mcp/servers/coda tools-droplet:/root/portfolio/integrations/mcp/servers/coda

# 5. Update docker-compose.production.yml version
# Edit: image: coda-mcp:v0.1.1

# 6. Deploy
ssh tools-droplet 'cd /root/portfolio && docker-compose -f docs/ops/docker-compose.production.yml up -d coda-mcp'

# 7. Verify
curl https://coda.bestviable.com/health
```

### Cleanup (Monthly)

```bash
# On droplet, remove old images
docker image prune -a

# Keep last 3 versions
docker images | grep coda-mcp
# Delete oldest manually if needed

# Check disk usage
df -h
du -sh /root/portfolio

# Archive old code locally if needed (backup)
tar -czf ~/backups/portfolio-2025-10-01.tar.gz ~/workspace/portfolio
```

---

## Best Practices Checklist

### Development
- [ ] Use .gitignore to exclude build artifacts
- [ ] No `.backup`, `.old`, `.v1` files in git
- [ ] Use git branches for major changes
- [ ] Clean commit messages (imperative mood)
- [ ] Squash commits before merging

### Git Repository
- [ ] Single source of truth (main branch)
- [ ] Clear branch naming (feature/*, fix/*, etc.)
- [ ] Tag releases (v0.1.0, v0.1.1, etc.)
- [ ] Keep only current version of each file
- [ ] Old code accessible via git history

### Docker/Deployment
- [ ] Use .dockerignore for lean images
- [ ] Multi-stage builds (build → runtime)
- [ ] Production dependencies only (npm ci --production)
- [ ] Version images (not just 'latest')
- [ ] Keep 2-3 old images for rollback
- [ ] Health checks in docker-compose
- [ ] Use volume mounts for persistent data

### Droplet Space Management
- [ ] Monitor with `df -h` and `du -sh`
- [ ] Remove unused images monthly
- [ ] Archive old backups off-droplet
- [ ] Keep old docker-compose files as backups (in git tags)

---

## Space Optimization Summary

**Before Optimization**:
```
Docker images:  2GB
Source code:    500MB
node_modules:   800MB
Build artifacts: 300MB
─────────────────────
Total: ~3.6GB
```

**After Optimization**:
```
Docker images:  300MB (current + 2 backups)
Source code:    150MB (git-optimized)
node_modules:   0MB (only in Docker)
Build artifacts: 0MB (multi-stage build)
─────────────────────
Total: ~450MB
```

**Savings**: ~3.1GB (87% reduction)

---

## Rollback Procedure

If deployment breaks:

```bash
# 1. Identify issue
ssh tools-droplet
docker logs coda-mcp | tail -50

# 2. Rollback to previous version
# Edit docker-compose.production.yml
image: coda-mcp:v0.1.0  # Change back to previous

# 3. Restart
docker-compose -f docs/ops/docker-compose.production.yml up -d coda-mcp

# 4. Verify
curl https://coda.bestviable.com/health

# 5. Fix issue and redeploy
# (back on your machine)
git revert abc123def  # Or fix the code
git tag v0.1.2
docker build -t coda-mcp:v0.1.2
scp changes...
```

---

## Reference: What to Keep vs Delete

### Keep in Git
```
src/
├── ✅ http-server.ts (current)
├── ✅ server.ts
├── ✅ config.ts
└── ❌ server.old.ts
└── ❌ http-server.v1.ts
```

### Keep on Droplet
```
/root/portfolio/
├── ✅ integrations/mcp/servers/coda/  (current source)
├── ✅ docs/ops/docker-compose.production.yml
├── ✅ .git/ (git history - small, useful)
└── ❌ coda-mcp-backup-2025-10-15/
```

### Keep in Docker Images
```
coda-mcp:v0.1.0     ✅ (current)
coda-mcp:v0.0.9     ✅ (previous, for rollback)
coda-mcp:v0.0.8     ✅ (older, for reference)
coda-mcp:v0.0.7     ❌ (delete to save space)
```

---

**Status**: Active
**Last Updated**: 2025-11-01
**Applies To**: All MCP services on droplet
**Review Quarterly**: More MCPs = more space management needed
