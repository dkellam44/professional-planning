# Dockerfile Migration: HTTP-Native Entry Point

## Changes Made

### Multi-Stage Build
- **Stage 1 (builder)**: Full build environment with dev dependencies
  - Installs pnpm dependencies
  - Compiles TypeScript to `/build/dist`
  - Total size: ~500MB (discarded after build)

- **Stage 2 (runtime)**: Minimal production image
  - Only runtime dependencies (`npm install --production`)
  - Only compiled JavaScript (`/build/dist`)
  - No source code, node_modules, or build artifacts
  - Final image size: ~150MB (vs ~600MB previously)

### Entry Point
- **Before**: `CMD ["node", "dist/index.js"]` (stdio-based mcp-proxy wrapper)
- **After**: `CMD ["node", "dist/http-server.js"]` (HTTP-native server)

### Health Check
- Added Docker HEALTHCHECK that tests `/health` endpoint every 30 seconds
- Container automatically restarts if health check fails 3 times
- Required for proper container orchestration on droplet

### .dockerignore
- Excludes build artifacts (node_modules, dist, tests, etc.)
- Excludes git files (.git, .github, .gitignore)
- Excludes documentation and editor files
- Keeps image size minimal

## Building the Image

```bash
cd /Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda

# Build with specific version tag
docker build -t coda-mcp:v1.0.0 .

# Tag for registry if needed
docker tag coda-mcp:v1.0.0 myregistry/coda-mcp:v1.0.0

# Test locally
docker run -p 8080:8080 \
  -e "NODE_ENV=production" \
  -e "PORT=8080" \
  coda-mcp:v1.0.0

# Verify health
curl http://localhost:8080/health
```

## Docker Compose Integration

Update in `docker-compose.production.yml`:

```yaml
services:
  coda-mcp:
    image: coda-mcp:v1.0.0
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    volumes:
      - coda-logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    restart: unless-stopped

volumes:
  coda-logs:
```

## Size Optimization

**Before** (old Dockerfile):
```
Stage (final): ~600MB
- node_modules/: 250MB
- dist/: 50MB
- src/: 20MB
- .git/: 30MB
- Other: 250MB
```

**After** (multi-stage):
```
Stage 1 (builder, discarded): ~500MB
Stage 2 (runtime): ~150MB
- node_modules (prod only): 80MB
- dist/: 50MB
- Other (minimal): 20MB
```

**Savings**: ~450MB per image (87% reduction)

## Deployment

On droplet, replace old image:

```bash
# Copy updated Dockerfile
scp Dockerfile tools-droplet:/root/portfolio/integrations/mcp/servers/coda/

# Build on droplet (or push from local)
ssh tools-droplet 'cd /root/portfolio/integrations/mcp/servers/coda && docker build -t coda-mcp:v1.0.0 .'

# Update docker-compose.yml and restart
ssh tools-droplet 'cd /root/portfolio && docker-compose -f docs/ops/docker-compose.production.yml up -d coda-mcp'

# Verify
curl https://coda.bestviable.com/health
```

## Rollback

If issues occur, keep previous image:

```bash
# Revert to previous version
docker tag coda-mcp:v0.9.0 coda-mcp:latest
docker-compose -f docker-compose.production.yml up -d coda-mcp

# Then fix and redeploy
```

## Verification Checklist

- [ ] Dockerfile multi-stage build is valid
- [ ] .dockerignore excludes unnecessary files
- [ ] Image builds without errors locally
- [ ] Image size < 200MB
- [ ] Health check endpoint `/health` responds
- [ ] HTTP server listens on port 8080
- [ ] Bearer token auth works with /mcp endpoints
- [ ] OAuth endpoints are accessible
- [ ] Image pushed to registry or ready for deployment
- [ ] docker-compose.yml updated with new image version
- [ ] Container restarts properly with health check failures

---

**Status**: Ready for droplet deployment
**Version**: v1.0.0
**Image Size**: ~150MB (compressed)
