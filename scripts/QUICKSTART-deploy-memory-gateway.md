# Memory Gateway Deployment - Quick Start

## TL;DR - Deploy in 2 Commands

```bash
# 1. Build the image
docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway

# 2. Deploy to droplet
./scripts/deploy-memory-gateway.sh
```

## What You Need Before Deploying

- [x] SSH configured with `droplet` alias in `~/.ssh/config`
- [x] Environment variables in `/Users/davidkellam/workspace/portfolio/.env`
- [x] Docker running locally

## Quick Commands Reference

### Deploy or Update
```bash
cd /Users/davidkellam/workspace/portfolio
docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
./scripts/deploy-memory-gateway.sh
```

### Check Status
```bash
ssh droplet 'docker ps | grep memory-gateway'
```

### View Logs
```bash
ssh droplet 'docker logs -f memory-gateway'
```

### Test Health
```bash
ssh droplet 'curl http://localhost:3000/health'
```

### Restart Service
```bash
ssh droplet 'cd /home/david/services/memory-gateway && docker-compose restart'
```

### Stop Service
```bash
ssh droplet 'cd /home/david/services/memory-gateway && docker-compose down'
```

## Expected Deployment Time

- Build image: ~30 seconds
- Transfer to droplet: ~2-5 minutes (depends on internet speed)
- Service startup: ~10-20 seconds
- **Total**: ~3-6 minutes

## Service Information

- **Container Name**: `memory-gateway`
- **Port**: `3000`
- **Location on Droplet**: `/home/david/services/memory-gateway`
- **Network**: `portfolio-network`
- **Health Check**: `http://localhost:3000/health`

## Common Issues

| Issue | Solution |
|-------|----------|
| Image not found | Run: `docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway` |
| SSH fails | Check `~/.ssh/config` has `droplet` alias |
| Health check timeout | Wait 30s, check logs: `ssh droplet 'docker logs memory-gateway'` |
| Port already in use | Stop conflicting service or change port in compose file |

## Full Documentation

For detailed information, see: `README-deploy-memory-gateway.md`
