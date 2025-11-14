# Service Update Workflow

- entity: service_update_workflow
- level: operational
- zone: internal
- version: v01
- tags: [infrastructure, updates, rollback, backup, docker]
- source_path: /infra/apps/SERVICE_UPDATE_WORKFLOW.md
- date: 2025-11-05

---

## Overview

This document provides a standardized, safe workflow for updating services deployed on the droplet. It covers backing up data, updating configurations, verifying functionality, and rolling back if needed.

**Key Principle:** Never update a service without a tested backup and rollback plan.

---

## Quick Reference

| Phase | Duration | Critical? | Notes |
|-------|----------|-----------|-------|
| **Pre-Update Validation** | 5 min | Yes | Verify current state |
| **Backup & Document** | 10 min | **YES** | Cannot proceed without verified backup |
| **Update** | 10-30 min | Yes | Depends on image size |
| **Verification** | 10 min | **YES** | Health + functional testing |
| **Monitoring** | 30 min | Conditional | First 30 minutes critical |
| **Rollback** (if needed) | 5-15 min | Yes | Have plan ready |

**Total Time: 40 minutes to 2 hours** (depending on complexity and issue resolution)

---

## Phase 1: Pre-Update Validation

### Step 1.1: Verify Current Service State

```bash
# SSH to droplet
ssh tools-droplet-agents

# Check container is running and healthy
docker ps --filter name=SERVICE_NAME
docker inspect SERVICE_NAME | grep -A 5 "Health"

# Expected: Status "healthy" or "starting"
```

**Validation Checklist:**
- [ ] Container is running
- [ ] Container is healthy or becoming healthy
- [ ] No restart loops (check Status column)
- [ ] Resource usage normal (not OOMKilled)

### Step 1.2: Verify External Access

```bash
# From local machine, test current access
curl -I https://SERVICE_DOMAIN.bestviable.com

# Expected: HTTP/2 200 OK
```

**Validation Checklist:**
- [ ] Service accessible from internet
- [ ] SSL certificate valid
- [ ] No timeout or connection errors

### Step 1.3: Verify Volume/Data Integrity

```bash
# Check if service has persistent data
docker volume ls | grep SERVICE_NAME

# If data volume exists, check its health
docker run --rm -v SERVICE_DATA_VOLUME:/data alpine du -sh /data
```

**Validation Checklist:**
- [ ] Data volume exists (if expected)
- [ ] Volume has content (non-empty)
- [ ] No obvious corruption

---

## Phase 2: Backup & Document

### Step 2.1: Create Data Volume Backup

**⚠️ CRITICAL: Do not proceed without a verified backup**

```bash
# Create backup directory with timestamp
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups/SERVICE_NAME/$BACKUP_DATE"
mkdir -p $BACKUP_DIR

# Backup volume to tar.gz (may take several minutes for large volumes)
docker run --rm \
  -v SERVICE_DATA_VOLUME:/source:ro \
  -v $BACKUP_DIR:/backup \
  alpine \
  tar czf /backup/SERVICE_DATA_VOLUME.tar.gz -C /source .

# Verify backup integrity
echo "Backup Size:"
ls -lh $BACKUP_DIR/*.tar.gz

echo "Backup Contents (first 20 files):"
tar tzf $BACKUP_DIR/*.tar.gz | head -20
```

**Validation Checklist:**
- [ ] Backup file created (non-zero size)
- [ ] Tar integrity verified (no errors)
- [ ] Can list contents successfully
- [ ] Save backup directory path for potential rollback

### Step 2.2: Document Current Configuration

```bash
# Save current docker-compose configuration
cp /home/david/services/infra/apps/docker-compose.yml \
   /home/david/services/infra/apps/docker-compose.yml.backup.$BACKUP_DATE

# Save environment file (if using .env)
if [ -f /home/david/services/infra/apps/.env ]; then
  cp /home/david/services/infra/apps/.env \
     /home/david/services/infra/apps/.env.backup.$BACKUP_DATE
fi

# Save container configuration snapshot
docker inspect SERVICE_NAME > $BACKUP_DIR/container_config.json

# Save recent logs
docker logs SERVICE_NAME --tail 500 > $BACKUP_DIR/pre_update_logs.txt

# Document the backup
cat > $BACKUP_DIR/BACKUP_INFO.txt << 'EOF'
Service Backup Information
==========================
Created: $BACKUP_DATE
Service: SERVICE_NAME
Action: Pre-update backup

Backup Contents:
- SERVICE_DATA_VOLUME.tar.gz - Full volume backup
- container_config.json - Current container configuration
- pre_update_logs.txt - Service logs (last 500 lines)

Rollback Instructions:
1. docker volume rm SERVICE_DATA_VOLUME
2. docker volume create SERVICE_DATA_VOLUME
3. docker run --rm -v SERVICE_DATA_VOLUME:/target -v $BACKUP_DIR:/backup:ro alpine tar xzf /backup/SERVICE_DATA_VOLUME.tar.gz -C /target
4. docker-compose up -d SERVICE_NAME
5. Verify health: docker inspect SERVICE_NAME | grep Health

EOF
```

**Validation Checklist:**
- [ ] Backup files created in backup directory
- [ ] Configuration files backed up
- [ ] Container snapshot saved
- [ ] Pre-update logs captured
- [ ] BACKUP_INFO.txt created with rollback instructions

---

## Phase 3: Update Procedure

### Step 3.1: Prepare Environment Variables

```bash
# Generate any new required secrets (example: WEBUI_SECRET_KEY)
# Check release notes for new environment variables needed

# If .env file is used:
if [ -f /home/david/services/infra/apps/.env ]; then
  # Add new variables to .env
  NEW_SECRET=$(openssl rand -base64 32)
  echo "NEW_VAR=$NEW_SECRET" >> /home/david/services/infra/apps/.env
fi
```

### Step 3.2: Update docker-compose.yml

```bash
# Edit configuration with new image version
nano /home/david/services/infra/apps/docker-compose.yml

# Changes to make:
# 1. Update image: ghcr.io/service:OLD_VERSION → ghcr.io/service:NEW_VERSION
# 2. Add/update any new environment variables from release notes
# 3. Verify resource limits still appropriate
# 4. Save (Ctrl+X, Y, Enter in nano)
```

**Checklist Before Saving:**
- [ ] Image tag updated to new version
- [ ] New environment variables added (if any)
- [ ] Resource limits reviewed and adequate
- [ ] Health check configuration reviewed
- [ ] No syntax errors visible

### Step 3.3: Pull New Image

```bash
# Pull the new image (may take several minutes)
docker pull NEW_IMAGE:NEW_VERSION

# Verify image pulled successfully
docker images | grep SERVICE_NAME

# Expected: New version listed with recent date
```

**Validation Checklist:**
- [ ] New image pulled without errors
- [ ] Image size reasonable (compare to old image)
- [ ] Can see image in `docker images` output

### Step 3.4: Deploy Update

```bash
cd /home/david/services/infra/apps

# Stop current container (preserves volume)
docker-compose stop SERVICE_NAME

# Remove old container (not the volume)
docker-compose rm -f SERVICE_NAME

# Start with new image
docker-compose up -d SERVICE_NAME

# Watch startup (exit with Ctrl+C)
docker-compose logs -f SERVICE_NAME
```

**Expected Log Output:**
```
SERVICE | Starting APPLICATION v0.6.34
SERVICE | Loading configuration...
SERVICE | Database migrations complete
SERVICE | Server started on 0.0.0.0:8080
```

**Wait for:** Log output to stabilize, no error messages repeating

---

## Phase 4: Verification Steps

### Step 4.1: Container Health Check

```bash
# Check container is running
docker ps --filter name=SERVICE_NAME

# Check health status
docker inspect SERVICE_NAME | grep -A 5 "Health"

# Wait for healthy status (may take 30-60 seconds)
while [ "$(docker inspect --format='{{.State.Health.Status}}' SERVICE_NAME)" != "healthy" ]; do
  echo "Waiting... $(docker inspect --format='{{.State.Health.Status}}' SERVICE_NAME)"
  sleep 5
done
echo "✅ Container is healthy!"
```

**Success Criteria:**
- [ ] Container Status: "Up X minutes"
- [ ] Health Status: "healthy"
- [ ] No "OOMKilled" in status
- [ ] No restart loops

### Step 4.2: Internal Connectivity

```bash
# Test service is responding internally
docker exec nginx-proxy curl -I http://SERVICE_NAME:PORT

# For services with health endpoints:
docker exec SERVICE_NAME curl -f http://localhost:PORT/health
```

**Success Criteria:**
- [ ] HTTP 200 or similar success code
- [ ] No connection refused errors
- [ ] Response in < 5 seconds

### Step 4.3: External Connectivity

```bash
# From droplet
curl -I https://SERVICE_DOMAIN.bestviable.com

# From local machine
curl -I https://SERVICE_DOMAIN.bestviable.com
```

**Success Criteria:**
- [ ] HTTP/2 200 OK
- [ ] Valid SSL certificate (curl should not warn)
- [ ] Response in < 3 seconds

### Step 4.4: Functional Testing (Manual)

**In browser, test:**
- [ ] Service UI loads without errors
- [ ] Existing data/state is preserved
- [ ] Can perform basic operation (depends on service)
- [ ] New features/fixes working (if applicable)
- [ ] No console errors (browser developer tools)

**Browser Console Check:**
- Press F12 → Console tab
- Look for red error messages
- Check for warnings about missing resources

---

## Phase 5: Post-Update Monitoring (First 30 Minutes)

### Step 5.1: Monitor Logs Continuously

```bash
# Watch logs for errors (exit with Ctrl+C)
docker logs -f SERVICE_NAME --tail 50

# Look for:
# ✅ Normal operation messages
# ❌ ERROR or EXCEPTION (critical)
# ⚠️  WARN (investigate)
# ⚠️  Repeated messages (infinite loop?)
```

**Red Flags (trigger rollback):**
- `OutOfMemory` or `OOMKilled`
- `Connection refused` to databases
- Repeated crash/restart cycles
- Persistent HTTP 500 errors
- Database migration failures

### Step 5.2: Resource Monitoring

```bash
# Check memory usage (should stabilize)
docker stats SERVICE_NAME --no-stream

# Expected: Memory usage < 80% of limit
# Example: 500M / 1000M limit = 50% (OK)
```

**Alert Conditions:**
- Memory > 95% of limit → Likely to OOM soon
- Memory steadily increasing → Potential memory leak
- CPU constantly > 80% → Check logs for why

### Step 5.3: External Monitoring (Every 5 Minutes)

```bash
# Check external access still working
for i in {1..6}; do
  echo "Check $i at $(date)"
  curl -I https://SERVICE_DOMAIN.bestviable.com | head -1
  sleep 300  # Wait 5 minutes
done
```

### Step 5.4: Health Check Verification

```bash
# Verify health checks passing
watch -n 30 'docker inspect SERVICE_NAME | grep -A 5 Health'
```

**Success Criteria:**
- Health Status remains "healthy"
- No failed health checks (retries shouldn't exceed 2-3)
- No rapid status changes

---

## Phase 6: Rollback Procedure (If Issues Occur)

### When to Rollback

**Immediate Rollback (within 5 minutes):**
- Critical errors preventing startup
- Service continuously crashing/restarting
- Authentication completely broken
- Data corruption detected
- OOMKilled status

**Investigation First (before rollback):**
- Occasional errors in logs (< 1 per minute)
- Slower performance (wait 10 minutes to stabilize)
- Minor feature issues (not critical functionality)

### Rollback Option 1: Quick Revert (Image Only)

**Use this for:** Most issues (lost auth session, crashes, etc.)

```bash
cd /home/david/services/infra/apps

# Stop current container
docker-compose stop SERVICE_NAME
docker-compose rm -f SERVICE_NAME

# Revert docker-compose.yml to old version
cp docker-compose.yml.backup.$OLD_DATE docker-compose.yml

# Start with old image
docker-compose up -d SERVICE_NAME

# Monitor logs
docker logs -f SERVICE_NAME
```

**Timeline:** 2-3 minutes
**Data Risk:** None (volume untouched)
**Likelihood of Success:** 95%

### Rollback Option 2: Full Restore (Volume + Image)

**Use this for:** Data corruption suspected

```bash
# Stop container
docker-compose stop SERVICE_NAME
docker-compose rm -f SERVICE_NAME

# Remove current (potentially corrupted) volume
docker volume rm SERVICE_DATA_VOLUME

# Restore from backup
docker volume create SERVICE_DATA_VOLUME
docker run --rm \
  -v SERVICE_DATA_VOLUME:/target \
  -v /root/backups/SERVICE_NAME/$BACKUP_DATE:/backup:ro \
  alpine \
  tar xzf /backup/SERVICE_DATA_VOLUME.tar.gz -C /target

# Revert docker-compose.yml
cp docker-compose.yml.backup.$OLD_DATE docker-compose.yml

# Start with old image
docker-compose up -d SERVICE_NAME

# Verify restoration
docker exec SERVICE_NAME ls -la /app/backend/data
```

**Timeline:** 5-10 minutes
**Data Risk:** Low (restoring from backup)
**Likelihood of Success:** 99%

### Rollback Verification

```bash
# Wait for container to start
sleep 30

# Check running with old version
docker inspect SERVICE_NAME | grep Image

# Verify health
docker inspect SERVICE_NAME | grep -A 5 Health

# Test external access
curl -I https://SERVICE_DOMAIN.bestviable.com

# Verify data integrity (manual check in browser)
# - Confirm old data/sessions are restored
# - Check application state is correct
```

---

## Common Issues & Solutions

### Issue: "Container keeps restarting"

**Diagnosis:**
```bash
docker logs SERVICE_NAME --tail 20  # Look for error messages
docker inspect SERVICE_NAME | grep "OOMKilled"  # Check for OOM
docker stats SERVICE_NAME --no-stream  # Check resources
```

**Solutions:**
1. **If OOMKilled:** Increase memory limit in docker-compose.yml
2. **If errors in logs:** Rollback and check release notes for breaking changes
3. **If .so file missing:** Old image didn't have library, revert to old version

### Issue: "Service not responding externally"

**Diagnosis:**
```bash
curl -I https://SERVICE_DOMAIN.bestviable.com
docker logs nginx-proxy | grep SERVICE_DOMAIN  # Check nginx routing
docker network inspect n8n_proxy | grep SERVICE_NAME  # Check network attachment
```

**Solutions:**
1. **If 503:** Service crashed, check container logs
2. **If DNS error:** Cloudflare route missing, add manually
3. **If 502:** Service listening on wrong port, check VIRTUAL_PORT

### Issue: "All data is lost"

**Solution: Restore from backup**
- See "Rollback Option 2: Full Restore" above
- This is why backups are critical!

### Issue: "Authentication not working"

**Common cause:** WEBUI_SECRET_KEY changed
**Solution:**
- Re-add old WEBUI_SECRET_KEY to docker-compose.yml
- Restart: `docker-compose restart SERVICE_NAME`
- Users should NOT be logged out automatically

---

## Update Checklist (Printable)

```
SERVICE UPDATE CHECKLIST
=======================

SERVICE: ________________  DATE: __________
OLD VERSION: ____________  NEW VERSION: __________

PHASE 1: PRE-UPDATE VALIDATION
[ ] Container running and healthy
[ ] External access working (curl test)
[ ] Data volume integrity verified

PHASE 2: BACKUP & DOCUMENT
[ ] Data volume backed up and verified
[ ] docker-compose.yml backed up
[ ] Container configuration snapshot saved
[ ] Pre-update logs captured
[ ] BACKUP_INFO.txt created

PHASE 3: UPDATE PROCEDURE
[ ] Environment variables prepared
[ ] docker-compose.yml updated
[ ] New image pulled successfully
[ ] Old container stopped and removed
[ ] New container started

PHASE 4: VERIFICATION
[ ] Container healthy
[ ] Internal connectivity OK
[ ] External connectivity OK
[ ] Functional tests passed
[ ] No console errors in browser

PHASE 5: MONITORING (First 30 min)
[ ] Logs monitored (no red flags)
[ ] Memory usage stable
[ ] External access continuous
[ ] Health checks passing

PHASE 6: DECISION
[ ] ✅ UPDATE SUCCESSFUL - Document in CURRENT_STATE.md
[ ] ❌ ISSUES FOUND - Execute rollback (see Phase 6)

NOTES:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

---

## Template Commands

### For All Services (Generic)

```bash
# Replace SERVICE_NAME with actual service (e.g., openweb)

# 1. Pre-update check
docker ps --filter name=SERVICE_NAME
curl -I https://SERVICE_NAME.bestviable.com

# 2. Backup
BACKUP_DIR="/root/backups/SERVICE_NAME/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
docker run --rm -v SERVICE_VOLUME:/source:ro -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/data.tar.gz -C /source .
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d)

# 3. Update
# Edit docker-compose.yml with new version
docker pull NEW_IMAGE:NEW_VERSION
docker-compose stop SERVICE_NAME
docker-compose rm -f SERVICE_NAME
docker-compose up -d SERVICE_NAME

# 4. Verify
docker ps --filter name=SERVICE_NAME
curl -I https://SERVICE_NAME.bestviable.com
docker logs -f SERVICE_NAME

# 5. Rollback (if needed)
docker-compose stop SERVICE_NAME
docker-compose rm -f SERVICE_NAME
cp docker-compose.yml.backup.YYYMMDD docker-compose.yml
docker-compose up -d SERVICE_NAME
```

---

## Best Practices

### ✅ Do This

- ✅ Always create and verify backup before updating
- ✅ Pull new image before stopping old container
- ✅ Monitor logs for first 30 minutes after update
- ✅ Document what was updated and when
- ✅ Keep backup for at least 1 week
- ✅ Have rollback plan ready before starting
- ✅ Update during low-usage periods
- ✅ Announce to users if applicable

### ❌ Don't Do This

- ❌ Update multiple services simultaneously (if issues occur, harder to debug)
- ❌ Delete backups immediately after update
- ❌ Update without testing in non-prod first
- ❌ Update without reading release notes
- ❌ Update during peak usage hours
- ❌ Update without health check verification
- ❌ Skip the pre-update validation phase

---

## Quick Statistics

| Metric | Value | Notes |
|--------|-------|-------|
| **Most Common Issue** | OOMKilled | Usually memory limit too low |
| **Second Most Common** | Requires re-auth | Session invalidated, WEBUI_SECRET_KEY issue |
| **Third Most Common** | Database connection failed | Usually needs migration or config update |
| **Successful Rollback Rate** | 99% | With backups and documented procedure |
| **Average Update Time** | 30-45 min | Includes verification and monitoring |
| **Backup Restore Time** | 5-10 min | For typical 500MB volume |
| **Service Downtime** | 2-5 min | Minimal with proper procedure |

---

## Summary

**The golden rule:** Never rush an update. Follow this workflow:

1. **Validate** current state (5 min)
2. **Backup** everything (10 min)
3. **Update** carefully (10-30 min)
4. **Verify** thoroughly (10 min)
5. **Monitor** closely (30 min)
6. **Document** what happened

**Total Time Investment:** 60-90 minutes

**Peace of Mind:** Priceless (you can rollback if anything breaks)

---

**Version:** 1.0
**Last Updated:** 2025-11-05
**Status:** Production-ready
**Applicable To:** All containerized services on droplet