# Pre-Deployment Checklist - Coda MCP to DigitalOcean

**Before running `./DEPLOY_TO_DROPLET.sh`**, verify all items are complete:

---

## Local Prerequisites ✓ or ✗

- [ ] **Code builds without errors**
  ```bash
  pnpm build
  # Expected: No errors, dist/ directory populated
  ```

- [ ] **All tests pass**
  ```bash
  ./test-oauth.sh
  # Expected: 6/6 OAuth tests pass
  ```

- [ ] **Validation passes**
  ```bash
  ./validate-deployment.sh
  # Expected: 10+ checks pass
  ```

- [ ] **Docker image builds locally**
  ```bash
  docker build -t coda-mcp:v1.0.0 .
  docker images | grep coda-mcp
  # Expected: Image size ~150MB
  ```

- [ ] **Health check works locally**
  ```bash
  docker run -p 8080:8080 coda-mcp:v1.0.0 &
  sleep 2
  curl http://localhost:8080/health
  # Expected: {"status": "ok", ...}
  ```

- [ ] **Git repository clean**
  ```bash
  git status
  # Expected: All changes committed
  ```

---

## Droplet Prerequisites ✓ or ✗

- [ ] **SSH access configured**
  ```bash
  ssh tools-droplet echo "SSH works"
  # Expected: Prints "SSH works"
  ```

- [ ] **Docker installed on droplet**
  ```bash
  ssh tools-droplet docker --version
  # Expected: Docker version output
  ```

- [ ] **Docker Compose installed**
  ```bash
  ssh tools-droplet docker-compose --version
  # Expected: Docker Compose version output
  ```

- [ ] **SyncBricks pattern deployed**
  ```bash
  ssh tools-droplet docker ps | grep "nginx-proxy\|acme-companion"
  # Expected: Both containers running
  ```

- [ ] **Networks exist**
  ```bash
  ssh tools-droplet docker network ls | grep -E "proxy|syncbricks"
  # Expected: Both networks listed
  ```

- [ ] **Cloudflare Tunnel configured**
  ```bash
  ssh tools-droplet docker ps | grep cloudflared
  # Expected: cloudflared container running
  ```

- [ ] **DNS pointing to Cloudflare**
  ```bash
  nslookup coda.bestviable.com
  # Expected: Cloudflare IP address
  ```

- [ ] **Directory structure ready**
  ```bash
  ssh tools-droplet mkdir -p /root/portfolio/integrations/mcp/servers/coda
  # Expected: No error
  ```

---

## Configuration Prerequisites ✓ or ✗

- [ ] **docker-compose.production.yml exists**
  ```bash
  ssh tools-droplet test -f /root/portfolio/docs/ops/docker-compose.production.yml
  # Expected: File exists
  ```

- [ ] **Coda API token available**
  ```bash
  echo $CODA_API_TOKEN | head -c 10
  # Expected: pat_xxxxx (at least 10 chars)
  ```

- [ ] **Environment variables ready on droplet**
  ```bash
  ssh tools-droplet grep CODA_API_TOKEN /root/portfolio/infra/config/.env
  # Expected: CODA_API_TOKEN=pat_...
  ```

- [ ] **Backup directory exists**
  ```bash
  ssh tools-droplet mkdir -p /root/portfolio/backups
  # Expected: No error
  ```

---

## Documentation Prerequisites ✓ or ✗

- [ ] **Deployment guide reviewed**
  - Read: `DROPLET_DEPLOYMENT_GUIDE.md`
  - Understand: Steps 1-7

- [ ] **Testing guide reviewed**
  - Read: `TESTING_WITH_REAL_TOKEN.md`
  - Understand: Post-deployment validation

- [ ] **Monitoring guide reviewed**
  - Read: `MONITORING_HEALTH_CHECKS.md`
  - Understand: Health checks and alerts

- [ ] **Deployment script reviewed**
  - Read: `DEPLOY_TO_DROPLET.sh`
  - Understand: Pre-deployment checks

---

## Deployment Script Usage

Once all prerequisites are checked, run:

```bash
# Standard deployment
./DEPLOY_TO_DROPLET.sh

# With custom image tag
./DEPLOY_TO_DROPLET.sh v1.0.1

# With custom droplet host
./DEPLOY_TO_DROPLET.sh v1.0.0 custom-droplet-host
```

---

## What the Script Does

1. **Pre-deployment Checks** (2 min)
   - Verifies local build exists
   - Checks SSH access to droplet
   - Verifies Docker and Docker Compose

2. **Copy Files** (1-2 min)
   - SCP files to droplet
   - Excludes node_modules, .git, .DS_Store

3. **Build Docker Image** (3-5 min)
   - Builds on droplet
   - Verifies image created
   - Shows image details

4. **Update Configuration** (1 min)
   - Verifies docker-compose.yml exists
   - Creates backup of current version
   - Ready for manual updates if needed

5. **Deploy Service** (1-2 min)
   - Stops existing service
   - Starts new service
   - Waits for readiness

6. **Validate** (1-2 min)
   - Checks health endpoint
   - Checks OAuth endpoints
   - Reviews logs for errors
   - Shows resource usage

---

## Estimated Total Time

**10-20 minutes** depending on:
- Network speed to droplet
- Docker image build time (3-5 min)
- Coda API availability

---

## Rollback Plan

If deployment fails, rollback is simple:

```bash
# Stop current service
ssh tools-droplet docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml stop coda-mcp

# Edit docker-compose.yml to use previous image version
ssh tools-droplet vim /root/portfolio/docs/ops/docker-compose.production.yml
# Change: image: coda-mcp:v1.0.0 → image: coda-mcp:v0.9.0

# Restart service
ssh tools-droplet docker-compose -f /root/portfolio/docs/ops/docker-compose.production.yml up -d coda-mcp

# Verify
curl https://coda.bestviable.com/health
```

---

## Post-Deployment Validation

After successful deployment:

```bash
# 1. Test with real token
export CODA_API_TOKEN=pat_your_token
./test-with-real-token.sh https://coda.bestviable.com

# 2. Monitor logs
ssh tools-droplet docker logs -f coda-mcp

# 3. Setup Uptime Robot monitoring
# Follow: MONITORING_HEALTH_CHECKS.md

# 4. Integrate with clients
# Follow: CLIENT_INTEGRATION_GUIDE.md
```

---

## Troubleshooting

### Script fails at SSH access check
```bash
# Verify SSH config
ssh-keygen -F tools-droplet
# If not found, add to ~/.ssh/config
```

### Script fails at Docker check
```bash
# Install Docker on droplet
ssh tools-droplet 'curl -fsSL https://get.docker.com | sh'
# Then re-run script
```

### Script fails at Docker Compose check
```bash
# Install Docker Compose on droplet
ssh tools-droplet 'sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && sudo chmod +x /usr/local/bin/docker-compose'
```

### Image build fails
```bash
# Check logs from build
ssh tools-droplet docker build -t coda-mcp:v1.0.0 /root/portfolio/integrations/mcp/servers/coda/ 2>&1 | tail -100
```

### Service won't start
```bash
# Check health status
ssh tools-droplet docker inspect coda-mcp | jq '.[].State.Health'

# Check logs
ssh tools-droplet docker logs coda-mcp | tail -50
```

---

## Deployment Readiness

| Component | Status | Reference |
|-----------|--------|-----------|
| Code Build | ✓ Complete | `pnpm build` |
| Tests | ✓ Passing | `./test-oauth.sh` |
| Docker Image | ✓ Built | `docker build` |
| Droplet Access | ? Check SSH | `ssh tools-droplet` |
| Docker/Compose | ? Check Droplet | Droplet Prerequisites |
| Configuration | ? Check Droplet | `docker-compose.production.yml` |
| Documentation | ✓ Complete | All guides in place |

---

**Status**: Ready for deployment
**Next Step**: Run `./DEPLOY_TO_DROPLET.sh`
**Estimated Duration**: 10-20 minutes

---

See `DEPLOY_TO_DROPLET.sh` for automated deployment.
See `DROPLET_DEPLOYMENT_GUIDE.md` for manual deployment steps.
