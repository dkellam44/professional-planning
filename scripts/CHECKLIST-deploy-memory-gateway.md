# Memory Gateway Deployment Checklist

Use this checklist before running the deployment script to ensure everything is ready.

## Pre-Deployment Checklist

### 1. Local Environment
- [ ] Docker is installed and running
  ```bash
  docker info
  ```

- [ ] Docker image can be built successfully
  ```bash
  docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
  ```

- [ ] Environment file exists and has required variables
  ```bash
  ls -l /Users/davidkellam/workspace/portfolio/.env
  grep ZEP_API_KEY /Users/davidkellam/workspace/portfolio/.env
  grep POSTGRES_PASSWORD /Users/davidkellam/workspace/portfolio/.env
  ```

### 2. SSH Access
- [ ] SSH config has droplet alias
  ```bash
  grep -A 3 "Host droplet" ~/.ssh/config
  ```

- [ ] SSH connection works
  ```bash
  ssh droplet "echo 'SSH working'"
  ```

- [ ] Can run Docker commands on droplet
  ```bash
  ssh droplet "docker ps"
  ```

### 3. Droplet Prerequisites
- [ ] PostgreSQL service is running
  ```bash
  ssh droplet "docker ps | grep postgres"
  ```

- [ ] PostgreSQL database exists
  ```bash
  ssh droplet "docker exec -it postgres psql -U postgres -c '\l' | grep portfolio_db"
  ```

- [ ] Portfolio network exists (or will be created)
  ```bash
  ssh droplet "docker network ls | grep portfolio"
  ```

- [ ] Port 3000 is available (or choose different port)
  ```bash
  ssh droplet "netstat -tuln | grep :3000"
  ```
  If something is using port 3000, you'll need to change the port in the deployment script.

### 4. Credentials Verification
- [ ] Zep API key is valid
  ```bash
  curl -H "Authorization: Bearer $(grep ZEP_API_KEY /Users/davidkellam/workspace/portfolio/.env | cut -d= -f2)" \
       https://api.zep.com/healthz
  ```

- [ ] PostgreSQL credentials are correct
  ```bash
  ssh droplet "docker exec -it postgres psql -U postgres -c 'SELECT version();'"
  ```

### 5. Service Dependencies
- [ ] Zep Cloud API is accessible from droplet
  ```bash
  ssh droplet "curl -I https://api.zep.com/healthz"
  ```

- [ ] Internet connectivity works on droplet
  ```bash
  ssh droplet "ping -c 3 8.8.8.8"
  ```

## Deployment Steps

Once all checklist items are complete:

1. **Build the Docker image**
   ```bash
   cd /Users/davidkellam/workspace/portfolio
   docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
   ```

2. **Run the deployment script**
   ```bash
   ./scripts/deploy-memory-gateway.sh
   ```

3. **Verify deployment**
   ```bash
   # Check service is running
   ssh droplet 'docker ps | grep memory-gateway'

   # Check health endpoint
   ssh droplet 'curl http://localhost:3000/health'

   # Check logs
   ssh droplet 'docker logs memory-gateway --tail 50'
   ```

## Post-Deployment Verification

- [ ] Container is running with "healthy" status
  ```bash
  ssh droplet 'docker ps | grep memory-gateway'
  ```

- [ ] Health endpoint returns 200 OK
  ```bash
  ssh droplet 'curl -i http://localhost:3000/health'
  ```

- [ ] Zep connection is established (check logs)
  ```bash
  ssh droplet 'docker logs memory-gateway 2>&1 | grep -i zep'
  ```

- [ ] PostgreSQL connection is working
  ```bash
  ssh droplet 'docker logs memory-gateway 2>&1 | grep -i postgres'
  ```

- [ ] No error messages in logs
  ```bash
  ssh droplet 'docker logs memory-gateway 2>&1 | grep -i error'
  ```

## Troubleshooting Quick Reference

| Symptom | Check | Solution |
|---------|-------|----------|
| Build fails | Dockerfile exists | Verify path: `services/memory-gateway/Dockerfile` |
| SSH fails | Config file | Check `~/.ssh/config` for droplet alias |
| Transfer slow | Network speed | Normal - large image takes 2-5 minutes |
| Container exits | Logs | `ssh droplet 'docker logs memory-gateway'` |
| Health check fails | Port binding | Check port 3000 is free on droplet |
| Zep error | API key | Verify ZEP_API_KEY in .env |
| PostgreSQL error | Database | Ensure postgres container is running |

## Rollback Procedure

If deployment fails and you need to rollback:

1. **Stop the new container**
   ```bash
   ssh droplet 'cd /home/david/services/memory-gateway && docker-compose down'
   ```

2. **Check for previous image**
   ```bash
   ssh droplet 'docker images | grep memory-gateway'
   ```

3. **If you have a backup, retag it**
   ```bash
   ssh droplet 'docker tag memory-gateway:backup memory-gateway:latest'
   ssh droplet 'cd /home/david/services/memory-gateway && docker-compose up -d'
   ```

## Best Practices

- ✓ Always test build locally before deploying
- ✓ Check logs after deployment
- ✓ Keep track of working image versions
- ✓ Don't deploy during peak usage times
- ✓ Have PostgreSQL backups before major changes
- ✓ Monitor logs for first 5 minutes after deployment
- ✓ Keep SSH session open until verification complete

## Emergency Contacts

If you need help:
- **Logs location**: `ssh droplet 'docker logs memory-gateway'`
- **Service location**: `/home/david/services/memory-gateway`
- **Configuration**: Check `docker-compose.yml` and `.env` on droplet

---

**Ready to deploy?** Run through this checklist, then execute:
```bash
./scripts/deploy-memory-gateway.sh
```
