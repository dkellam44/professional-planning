# Memory Gateway Deployment - Documentation Index

Complete deployment system for Memory Gateway service to DigitalOcean droplet.

## Quick Access

| What You Need | Document |
|---------------|----------|
| **Just want to deploy?** | [QUICKSTART-deploy-memory-gateway.md](./QUICKSTART-deploy-memory-gateway.md) |
| **First time deploying?** | [CHECKLIST-deploy-memory-gateway.md](./CHECKLIST-deploy-memory-gateway.md) |
| **Need detailed info?** | [README-deploy-memory-gateway.md](./README-deploy-memory-gateway.md) |
| **The actual script** | [deploy-memory-gateway.sh](./deploy-memory-gateway.sh) |

---

## Files in This Package

### 1. `deploy-memory-gateway.sh` (345 lines, 11KB)
**The main deployment script - executable and ready to run**

**Features:**
- Comprehensive pre-flight checks
- Automated image transfer (local → droplet)
- Service configuration generation
- Docker Compose setup
- Health endpoint validation
- Zep connection verification
- Detailed logging and error handling
- Colored output for readability

**Usage:**
```bash
./scripts/deploy-memory-gateway.sh
```

### 2. `QUICKSTART-deploy-memory-gateway.md` (2KB)
**2-minute quick reference guide**

**Best for:**
- Experienced users who know the process
- Quick command lookup
- Common operations reference

**Contains:**
- Minimal 2-command deployment
- Essential prerequisites checklist
- Common commands cheat sheet
- Quick troubleshooting table

### 3. `README-deploy-memory-gateway.md` (12KB)
**Complete deployment documentation**

**Best for:**
- First-time deployment
- Understanding what the script does
- Troubleshooting issues
- Learning the architecture

**Contains:**
- Detailed step-by-step walkthrough
- Environment variable explanations
- Docker Compose configuration details
- Comprehensive troubleshooting guide
- Post-deployment validation steps
- Manual service management commands
- Architecture diagrams
- Security notes

### 4. `CHECKLIST-deploy-memory-gateway.md` (5KB)
**Interactive pre-deployment checklist**

**Best for:**
- Verifying readiness before deployment
- Systematic preparation
- Avoiding common pitfalls

**Contains:**
- Pre-deployment verification steps
- Environment checks with commands
- Dependency validation
- Post-deployment verification
- Rollback procedures
- Best practices

### 5. `INDEX-memory-gateway-deployment.md` (This file)
**Navigation and overview**

**Best for:**
- Understanding the documentation structure
- Finding the right document for your needs
- Getting started

---

## Deployment Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. PREPARATION                                              │
│    Read: CHECKLIST-deploy-memory-gateway.md                │
│    Verify: SSH, Docker, Environment Variables              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BUILD                                                    │
│    Command: docker build -t memory-gateway:latest ...      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. DEPLOY                                                   │
│    Run: ./scripts/deploy-memory-gateway.sh                 │
│    Monitor: Watch colored output for progress              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. VERIFY                                                   │
│    Auto: Script runs health checks                         │
│    Manual: Check health endpoint, view logs                │
└─────────────────────────────────────────────────────────────┘
```

---

## What the Script Does (10 Steps)

1. **Pre-flight Checks** - Verifies Docker, SSH, image availability
2. **Save Image** - Compresses Docker image to tar.gz (~85MB)
3. **Transfer** - SCPs image to droplet (2-5 minutes)
4. **Load** - Loads image into Docker on droplet
5. **Configure** - Creates docker-compose.yml and .env
6. **Network** - Creates portfolio-network if needed
7. **Stop Old** - Stops previous container if running
8. **Start New** - Launches new container
9. **Health Check** - Waits up to 60s for /health endpoint
10. **Validate** - Checks Zep connection in logs

---

## Environment Variables Used

The script reads these from `/Users/davidkellam/workspace/portfolio/.env`:

**Zep Memory:**
- `ZEP_API_KEY` - Your Zep Cloud API key
- `ZEP_MEMORY_URL` - Zep API endpoint
- `ZEP_MEMORY_ENABLED` - Enable/disable Zep

**PostgreSQL:**
- `POSTGRES_HOST` - Database host (default: postgres)
- `POSTGRES_PORT` - Database port (default: 5432)
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password
- `POSTGRES_DB` - Database name

**Application:**
- `PORT` - Service port (default: 3000)
- `NODE_ENV` - Set to production
- `LOG_LEVEL` - Set to info

---

## Deployment Timeline

| Phase | Duration | What's Happening |
|-------|----------|------------------|
| Pre-flight | 5-10 sec | Checking requirements |
| Save image | 10-30 sec | Compressing Docker image |
| Transfer | 2-5 min | SCP to droplet (depends on internet) |
| Load | 10-20 sec | Loading image on droplet |
| Configure | 5 sec | Creating docker-compose.yml |
| Start | 10 sec | Starting container |
| Health check | 10-30 sec | Waiting for service ready |
| **Total** | **3-6 min** | End-to-end deployment |

---

## Quick Start Guide

### For First-Time Users

1. **Read the checklist**
   ```bash
   cat scripts/CHECKLIST-deploy-memory-gateway.md
   ```

2. **Verify prerequisites**
   - SSH to droplet works: `ssh droplet "echo OK"`
   - Docker is running: `docker info`
   - .env file exists: `ls -l /Users/davidkellam/workspace/portfolio/.env`

3. **Build the image**
   ```bash
   cd /Users/davidkellam/workspace/portfolio
   docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
   ```

4. **Deploy**
   ```bash
   ./scripts/deploy-memory-gateway.sh
   ```

5. **Verify**
   ```bash
   ssh droplet 'docker ps | grep memory-gateway'
   ssh droplet 'curl http://localhost:3000/health'
   ```

### For Experienced Users

```bash
# Deploy in 2 commands
docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
./scripts/deploy-memory-gateway.sh
```

---

## Common Tasks

### Check Service Status
```bash
ssh droplet 'docker ps | grep memory-gateway'
```

### View Logs
```bash
ssh droplet 'docker logs -f memory-gateway'
```

### Restart Service
```bash
ssh droplet 'cd /home/david/services/memory-gateway && docker-compose restart'
```

### Update Service (Redeploy)
```bash
docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
./scripts/deploy-memory-gateway.sh
```

### Stop Service
```bash
ssh droplet 'cd /home/david/services/memory-gateway && docker-compose down'
```

---

## Troubleshooting

### Script Fails - Where to Look

1. **Check the error message** - Script has detailed colored output
2. **View the README** - Section "Troubleshooting" has detailed solutions
3. **Check logs** - `ssh droplet 'docker logs memory-gateway --tail 100'`
4. **Verify prerequisites** - Use CHECKLIST document

### Common Issues

| Error | Quick Fix |
|-------|-----------|
| "Image not found" | Build first: `docker build -t memory-gateway:latest ...` |
| "SSH failed" | Check `~/.ssh/config` has droplet alias |
| "Health check timeout" | Normal if service is slow to start, wait 30s more |
| "Zep connection error" | Verify ZEP_API_KEY in .env file |

---

## Architecture

```
Local Machine                        Droplet
┌──────────────────┐                ┌─────────────────────────┐
│                  │                │                         │
│ 1. Build Image   │   2. Transfer  │ 3. Load & Run          │
│    docker build  ├───────SCP─────→│    docker load         │
│                  │                │    docker-compose up   │
└──────────────────┘                │                         │
                                    │ Services:               │
                                    │ ┌──────────────────┐   │
                                    │ │ memory-gateway   │   │
                                    │ │ Port: 3000       │   │
                                    │ └────────┬─────────┘   │
                                    │          │             │
                                    │    ┌─────┴──────┐      │
                                    │    │            │      │
                                    │    ▼            ▼      │
                                    │  Zep API    PostgreSQL │
                                    └─────────────────────────┘
```

---

## File Locations

**On Local Machine:**
- Script: `/Users/davidkellam/workspace/portfolio/scripts/deploy-memory-gateway.sh`
- Env file: `/Users/davidkellam/workspace/portfolio/.env`
- Dockerfile: `/Users/davidkellam/workspace/portfolio/services/memory-gateway/Dockerfile`
- Temp archive: `/tmp/memory-gateway.tar.gz` (auto-deleted)

**On Droplet:**
- Service dir: `/home/david/services/memory-gateway/`
- Compose file: `/home/david/services/memory-gateway/docker-compose.yml`
- Env file: `/home/david/services/memory-gateway/.env`
- Container: `memory-gateway` (name)
- Network: `portfolio-network`

---

## Script Features Explained

### Color-Coded Output
- **Blue (==>)** - Step in progress
- **Green (✓)** - Success message
- **Yellow (⚠)** - Warning (non-critical)
- **Red (✗)** - Error (critical)

### Error Handling
- `set -e` - Exits on first error
- Validates all prerequisites before starting
- Provides helpful error messages with next steps

### Health Validation
- Waits up to 60 seconds for /health endpoint
- Retries every 5 seconds
- Shows progress dots
- Warns if timeout but continues

### Zep Connection Check
- Searches logs for "zep" keyword
- Looks for "connected" or "error" patterns
- Reports status in deployment summary

---

## Next Steps After Deployment

1. **Configure Traefik** - Expose via HTTPS with domain
2. **Set up monitoring** - Track health and performance
3. **Configure backups** - PostgreSQL database backups
4. **Add logging** - Centralized log aggregation
5. **CI/CD** - Automate future deployments

---

## Support & Documentation

| Need Help With | Look Here |
|----------------|-----------|
| Quick commands | QUICKSTART-deploy-memory-gateway.md |
| Detailed guide | README-deploy-memory-gateway.md |
| Pre-flight prep | CHECKLIST-deploy-memory-gateway.md |
| Understanding script | Read deploy-memory-gateway.sh comments |
| Errors | README "Troubleshooting" section |

---

## Version Information

- **Script version**: 1.0
- **Target service**: Memory Gateway
- **Target platform**: DigitalOcean Droplet
- **Docker Compose version**: 3.8
- **Created**: 2025-12-07

---

**Ready to deploy?** → Start with [CHECKLIST-deploy-memory-gateway.md](./CHECKLIST-deploy-memory-gateway.md)

**Just need to run it?** → See [QUICKSTART-deploy-memory-gateway.md](./QUICKSTART-deploy-memory-gateway.md)
