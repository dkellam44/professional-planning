# Memory Gateway Deployment Guide

This guide explains how to deploy the Memory Gateway service to your DigitalOcean droplet.

## Overview

The `deploy-memory-gateway.sh` script automates the entire deployment process, including:
- Transferring the Docker image from local machine to droplet
- Setting up the service with proper environment variables
- Creating Docker Compose configuration
- Starting the service and validating the deployment

## Prerequisites

Before running the deployment script, ensure you have:

1. **Docker image built locally**
   ```bash
   cd /Users/davidkellam/workspace/portfolio
   docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
   ```

2. **SSH access configured**
   Your `~/.ssh/config` should have a `droplet` alias configured:
   ```
   Host droplet
       HostName YOUR_DROPLET_IP
       User david
       IdentityFile ~/.ssh/your_key
   ```

3. **Environment variables set**
   The script reads from `/Users/davidkellam/workspace/portfolio/.env` (already configured)

## Running the Deployment

### Step 1: Build the Docker Image (if not already built)

```bash
cd /Users/davidkellam/workspace/portfolio
docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
```

This command:
- Uses the Dockerfile located in `services/memory-gateway/`
- Tags the image as `memory-gateway:latest`
- Builds from the service directory context

### Step 2: Run the Deployment Script

```bash
cd /Users/davidkellam/workspace/portfolio
./scripts/deploy-memory-gateway.sh
```

The script will:
1. ✓ Run pre-flight checks (Docker running, image exists, SSH access)
2. ✓ Save Docker image to compressed archive (~100MB typically)
3. ✓ Transfer image to droplet via SCP (may take 2-5 minutes)
4. ✓ Load image on the droplet
5. ✓ Create service directory: `/home/david/services/memory-gateway`
6. ✓ Generate `docker-compose.yml` with proper configuration
7. ✓ Create `.env` file with Zep and PostgreSQL credentials
8. ✓ Create Docker network if needed
9. ✓ Stop any existing service
10. ✓ Start the new service
11. ✓ Wait for health check to pass
12. ✓ Validate Zep connection
13. ✓ Display deployment summary and logs

### Expected Output

```
==> Running pre-flight checks...
✓ Pre-flight checks passed
==> Saving Docker image to archive...
✓ Image saved: /tmp/memory-gateway.tar.gz (85M)
==> Transferring image to droplet (this may take a few minutes)...
✓ Image transferred to droplet
==> Loading Docker image on droplet...
✓ Image loaded on droplet
==> Setting up service directory on droplet...
==> Creating docker-compose.yml...
==> Creating .env file on droplet...
✓ Service configuration created
==> Ensuring portfolio-network exists...
✓ Network configured
==> Stopping existing service (if running)...
==> Starting Memory Gateway service...
✓ Service started
==> Waiting for service to be ready (checking health endpoint)...
✓ Health check passed
==> Checking service logs for Zep connection...
✓ Zep connection established

========================================================================
                    DEPLOYMENT SUMMARY
========================================================================
Container Status: Up 12 seconds (healthy)
Service URL: http://YOUR_DROPLET_IP:3000
Health Check: http://YOUR_DROPLET_IP:3000/health

========================================================================
                    RECENT LOGS (Last 20 lines)
========================================================================
[timestamp] Memory Gateway starting...
[timestamp] Connected to Zep at https://api.zep.com
[timestamp] Server listening on port 3000

========================================================================
                    USEFUL COMMANDS
========================================================================
View logs:         ssh droplet 'docker logs -f memory-gateway'
Check status:      ssh droplet 'docker ps | grep memory-gateway'
Restart service:   ssh droplet 'cd /home/david/services/memory-gateway && docker-compose restart'
Stop service:      ssh droplet 'cd /home/david/services/memory-gateway && docker-compose down'
Check health:      ssh droplet 'curl http://localhost:3000/health'
========================================================================

✓ Deployment complete!
```

## What Gets Created on the Droplet

### Directory Structure
```
/home/david/services/memory-gateway/
├── docker-compose.yml    # Service configuration
└── .env                  # Environment variables
```

### Docker Compose Configuration

The script creates a `docker-compose.yml` with:
- **Container name**: `memory-gateway`
- **Port mapping**: `3000:3000`
- **Restart policy**: `unless-stopped`
- **Health check**: HTTP GET to `/health` endpoint every 30 seconds
- **Network**: Connected to `portfolio-network`
- **Logging**: JSON file driver with 10MB max size, 3 file rotation

### Environment Variables

The following variables are configured from your `.env` file:
- `ZEP_API_KEY` - Your Zep Cloud API key
- `ZEP_MEMORY_URL` - Zep API endpoint (https://api.zep.com)
- `ZEP_MEMORY_ENABLED` - Set to `true`
- `POSTGRES_HOST` - PostgreSQL host (defaults to `postgres`)
- `POSTGRES_PORT` - PostgreSQL port (defaults to `5432`)
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - Database name (defaults to `portfolio_db`)
- `NODE_ENV` - Set to `production`
- `PORT` - Service port (defaults to `3000`)
- `LOG_LEVEL` - Set to `info`

## Post-Deployment Validation

### 1. Check Service Status
```bash
ssh droplet 'docker ps | grep memory-gateway'
```

Expected output:
```
CONTAINER ID   IMAGE                      STATUS                    PORTS                    NAMES
abc123def456   memory-gateway:latest      Up 2 minutes (healthy)    0.0.0.0:3000->3000/tcp   memory-gateway
```

### 2. Check Health Endpoint
```bash
ssh droplet 'curl http://localhost:3000/health'
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-07T19:00:00.000Z",
  "services": {
    "zep": "connected",
    "postgres": "connected"
  }
}
```

### 3. View Logs
```bash
ssh droplet 'docker logs -f memory-gateway'
```

Look for:
- Server startup message
- Zep connection confirmation
- PostgreSQL connection confirmation
- No error messages

### 4. Test Zep Integration
```bash
ssh droplet 'curl -X POST http://localhost:3000/api/memory/test \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"test-session\", \"message\": \"Hello Zep\"}"'
```

## Troubleshooting

### Issue: Pre-flight check fails - Docker image not found

**Solution**: Build the image first
```bash
cd /Users/davidkellam/workspace/portfolio
docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway
```

### Issue: SSH connection fails

**Solution**: Verify SSH configuration
```bash
ssh droplet "echo 'SSH working'"
```

If this fails, check your `~/.ssh/config` file and ensure the droplet alias is correct.

### Issue: Health check times out

**Possible causes**:
1. Service is still starting (wait 30-60 seconds)
2. Port 3000 is already in use
3. Application error

**Check logs**:
```bash
ssh droplet 'docker logs memory-gateway --tail 100'
```

### Issue: Zep connection fails

**Check**:
1. `ZEP_API_KEY` is correct in `.env`
2. Droplet has internet access
3. Zep API is accessible

**Test connection manually**:
```bash
ssh droplet 'curl -H "Authorization: Bearer YOUR_ZEP_API_KEY" https://api.zep.com/healthz'
```

### Issue: PostgreSQL connection fails

**Check**:
1. PostgreSQL service is running on droplet
2. Credentials are correct
3. Database exists

**Verify PostgreSQL**:
```bash
ssh droplet 'docker ps | grep postgres'
ssh droplet 'docker exec -it postgres psql -U postgres -c "\l"'
```

## Updating the Service

To deploy a new version:

1. Build the updated Docker image locally
2. Run the deployment script again
3. The script will automatically stop the old container and start the new one

```bash
# Build new version
docker build -t memory-gateway:latest -f services/memory-gateway/Dockerfile services/memory-gateway

# Deploy
./scripts/deploy-memory-gateway.sh
```

## Manual Service Management

If you need to manually control the service on the droplet:

### Start
```bash
ssh droplet 'cd /home/david/services/memory-gateway && docker-compose up -d'
```

### Stop
```bash
ssh droplet 'cd /home/david/services/memory-gateway && docker-compose down'
```

### Restart
```bash
ssh droplet 'cd /home/david/services/memory-gateway && docker-compose restart'
```

### View Logs
```bash
ssh droplet 'docker logs -f memory-gateway'
ssh droplet 'docker logs memory-gateway --tail 100'
```

### Check Status
```bash
ssh droplet 'docker ps -a | grep memory-gateway'
ssh droplet 'cd /home/david/services/memory-gateway && docker-compose ps'
```

## Security Notes

1. **Environment Variables**: Sensitive credentials (Zep API key, PostgreSQL password) are stored in the `.env` file on the droplet, which is not version controlled.

2. **Network**: The service is connected to the `portfolio-network` Docker network, allowing it to communicate with other services (like PostgreSQL) running on the same droplet.

3. **Port Exposure**: Port 3000 is exposed to the host. If you want to restrict access, consider:
   - Using Traefik reverse proxy with authentication
   - Configuring firewall rules on the droplet
   - Using internal Docker networking only

## Architecture

```
Local Machine                    Droplet
┌─────────────────┐             ┌──────────────────────────────────┐
│                 │             │                                  │
│  Build Image    │   SCP       │  /home/david/services/          │
│  memory-gateway ├────────────>│  memory-gateway/                │
│  :latest        │             │  ├── docker-compose.yml         │
│                 │             │  └── .env                       │
└─────────────────┘             │                                  │
                                │  Docker Container                │
                                │  ┌────────────────────────┐     │
                                │  │ memory-gateway:latest  │     │
                                │  │ Port: 3000             │     │
                                │  │                        │     │
                                │  │ Connects to:           │     │
                                │  │ - Zep Cloud API        │────>│
                                │  │ - PostgreSQL           │     │
                                │  └────────────────────────┘     │
                                │                                  │
                                └──────────────────────────────────┘
```

## Next Steps

After successful deployment, you may want to:

1. **Configure Traefik** to expose the service via HTTPS with a domain name
2. **Set up monitoring** to track service health and performance
3. **Configure backups** for the PostgreSQL database
4. **Add logging aggregation** to centralize logs from all services
5. **Implement CI/CD** to automate future deployments

## Support

If you encounter issues:
1. Check the logs: `ssh droplet 'docker logs memory-gateway --tail 100'`
2. Verify health endpoint: `ssh droplet 'curl http://localhost:3000/health'`
3. Check Docker status: `ssh droplet 'docker ps -a | grep memory-gateway'`
4. Review this README for troubleshooting steps
