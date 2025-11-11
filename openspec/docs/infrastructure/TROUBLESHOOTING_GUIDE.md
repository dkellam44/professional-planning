# Troubleshooting Guide

Comprehensive troubleshooting guide for the SyncBricks infrastructure deployment. This guide covers common issues, diagnostic procedures, and resolution steps for all 14 running services.

## Quick Diagnostic Commands

### System Health Check
```bash
# Overall system status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}\t{{.Health}}"

# Resource utilization
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Service restart history
docker ps -a --filter "status=restarting" --format "table {{.Names}}\t{{.Status}}\t{{.CreatedAt}}"
```

### Network Connectivity Test
```bash
# Test external connectivity
curl -I https://www.google.com

# Test Cloudflare Tunnel
docker exec cloudflared cloudflared tunnel info

# Test nginx-proxy
curl -I http://localhost

# Test service discovery
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep server_name
```

## Service-Specific Issues

### 1. Coda MCP Authentication Issues (401 Errors)

**Symptoms**:
- MCP server returns 401 Unauthorized
- Health check passes but API calls fail
- Logs show "Missing CODA_API_TOKEN" errors

**Root Cause**: Missing `CODA_API_TOKEN` environment variable

**Diagnostic Steps**:
```bash
# Check environment variables
docker exec coda-mcp env | grep CODA

# Test health endpoint
curl http://localhost:8080/health

# Test with Bearer token
curl -H "Authorization: Bearer test_token" http://localhost:8080/mcp

# Check container logs
docker logs coda-mcp --tail 50 | grep -i "token\|auth\|401"
```

**Resolution**:
```bash
# 1. Add Coda API token to environment file
echo "CODA_API_TOKEN=your_coda_api_token_here" >> infra/mcp-servers/.env

# 2. Restart the service
docker-compose -f infra/mcp-servers/docker-compose.yml restart coda-mcp

# 3. Verify fix
docker exec coda-mcp env | grep CODA_API_TOKEN
curl -H "Authorization: Bearer test_token" http://localhost:8080/mcp
```

**Prevention**: Always validate environment variables before deployment

---

### 2. Uptime-Kuma Restart Loop (Exit 137)

**Symptoms**:
- Container continuously restarting
- Exit code 137 (SIGKILL, typically memory-related)
- No uptime monitoring available

**Root Cause**: Memory pressure causing OOM killer to terminate container

**Diagnostic Steps**:
```bash
# Check restart status
docker ps --filter "name=uptime-kuma" --format "table {{.Names}}\t{{.Status}}"

# Check container logs for memory errors
docker logs uptime-kuma --tail 100 | grep -i "memory\|oom\|killed"

# Check system memory
free -h

# Check memory usage by service
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | sort -k2 -hr
```

**Resolution Options**:

**Option 1: Increase Memory Limits**
```bash
# Edit docker-compose.yml to add memory limits
services:
  uptime-kuma:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

**Option 2: Disable Service (Temporary)**
```bash
# Stop and remove the service
docker-compose -f infra/monitoring/docker-compose.yml stop uptime-kuma
docker-compose -f infra/monitoring/docker-compose.yml rm uptime-kuma
```

**Option 3: Optimize Configuration**
```bash
# Reduce monitoring frequency
# Edit uptime-kuma configuration to check less frequently
# Reduce number of monitored services
```

**Prevention**: Set appropriate memory limits for all services

---

### 3. Infisical Unhealthy Status

**Symptoms**:
- Health check failing
- Container running but not responding
- Secrets management unreliable

**Root Cause**: Health check configuration or service startup issues

**Diagnostic Steps**:
```bash
# Check health status
docker inspect infisical --format='{{.State.Health.Status}}'

# Check health check logs
docker inspect infisical --format='{{json .State.Health}}' | jq .

# Test service directly
docker exec infisical curl -f http://localhost:3000/health || echo "Health check failed"

# Check service logs
docker logs infisical --tail 50 | grep -i "health\|error\|listen"
```

**Resolution**:
```bash
# 1. Check if service is actually listening
docker exec infisical netstat -tlnp | grep :3000

# 2. Test different health check endpoints
docker exec infisical curl -f http://localhost:3000/api/health || echo "Alternative endpoint failed"

# 3. Restart service
docker restart infisical

# 4. If still failing, check database connectivity
docker exec infisical pg_isready -h infisical-db -U postgres
```

**Prevention**: Implement comprehensive health checks during service setup

---

### 4. Qdrant Vector Database Unhealthy

**Symptoms**:
- Health check failing for vector database
- May affect AI/ML and search functionality
- Container appears running but unresponsive

**Root Cause**: Database startup or connectivity issues

**Diagnostic Steps**:
```bash
# Check Qdrant status
docker exec qdrant curl -f http://localhost:6333/health || echo "Health check failed"

# Check Qdrant logs
docker logs qdrant --tail 50 | grep -i "error\|panic\|startup"

# Test vector operations
docker exec qdrant curl -X POST http://localhost:6333/collections/test/points \
  -H "Content-Type: application/json" \
  -d '{"points": [{"id": 1, "vector": [0.1, 0.2, 0.3]}]}' || echo "Vector operation failed"

# Check storage
docker exec qdrant df -h /qdrant/storage
```

**Resolution**:
```bash
# 1. Restart Qdrant service
docker restart qdrant

# 2. Check for storage issues
docker exec qdrant ls -la /qdrant/storage

# 3. If corrupted, clear storage (WARNING: Data loss)
# docker exec qdrant rm -rf /qdrant/storage/*
# docker restart qdrant

# 4. Verify fix
sleep 10
docker exec qdrant curl -f http://localhost:6333/health
```

**Prevention**: Monitor storage usage and implement proper backup procedures

---

### 5. Dozzle Log Viewer Unhealthy

**Symptoms**:
- Health check failing for log viewer
- Limited log visibility for troubleshooting
- Container running but web interface inaccessible

**Root Cause**: Health check endpoint or web server issues

**Diagnostic Steps**:
```bash
# Check Dozzle status
docker exec dozzle curl -f http://localhost:8080/health || echo "Health check failed"

# Check if web server is running
docker exec dozzle netstat -tlnp | grep :8080

# Check Dozzle logs (self-referential)
docker logs dozzle --tail 50 | grep -i "error\|listen\|health"

# Test web interface
curl -I http://localhost:9999
```

**Resolution**:
```bash
# 1. Restart Dozzle
docker restart dozzle

# 2. Check configuration
docker exec dozzle env | grep DOZZLE

# 3. Verify mount points
docker inspect dozzle --format='{{json .Mounts}}' | jq .

# 4. Test again
sleep 5
curl -I http://localhost:9999
```

**Prevention**: Ensure proper Docker socket mounting and configuration

---

## Network and Connectivity Issues

### Cloudflare Tunnel Problems

**Symptoms**:
- Services inaccessible from internet
- Cloudflare error pages
- Tunnel status shows disconnected

**Diagnostic Steps**:
```bash
# Check tunnel status
docker exec cloudflared cloudflared tunnel info

# Check tunnel logs
docker logs cloudflared --tail 50 | grep -i "error\|disconnect\|reconnect"

# Test tunnel connectivity
docker exec cloudflared ping 1.1.1.1

# Check certificate validity
docker exec cloudflared cloudflared tunnel run --cert-duration 24h
```

**Resolution**:
```bash
# 1. Restart tunnel
docker restart cloudflared

# 2. If certificate issues, re-authenticate
# docker exec cloudflared cloudflared tunnel login

# 3. Verify tunnel is running
docker exec cloudflared cloudflared tunnel list
```

### nginx-proxy Routing Issues

**Symptoms**:
- Services return 502 Bad Gateway
- nginx configuration not updating
- Service discovery failing

**Diagnostic Steps**:
```bash
# Check nginx configuration
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | grep -A5 -B5 "server_name"

# Check nginx logs
docker logs nginx-proxy --tail 50 | grep -i "error\|upstream"

# Test service connectivity from nginx
docker exec nginx-proxy curl -I http://target-service:port

# Check container labels
docker inspect target-service --format='{{json .Config.Labels}}' | jq .
```

**Resolution**:
```bash
# 1. Force nginx configuration reload
docker kill -s HUP nginx-proxy

# 2. Restart nginx-proxy if needed
docker restart nginx-proxy

# 3. Verify service labels are correct
# Check that labels match expected format
```

### Database Connectivity Issues

**Symptoms**:
- Application services cannot connect to database
- Database health checks failing
- Connection timeout errors

**Diagnostic Steps**:
```bash
# Test postgres connectivity
docker exec postgres pg_isready -U postgres

# Test from application container
docker exec app-container pg_isready -h postgres -U postgres

# Check network connectivity
docker network inspect n8n_syncbricks | jq '.[0].Containers'

# Check database logs
docker logs postgres --tail 50 | grep -i "error\|connection\|startup"
```

**Resolution**:
```bash
# 1. Restart database if needed
docker restart postgres

# 2. Check network membership
# Ensure both containers are on same network

# 3. Verify credentials
docker exec app-container env | grep DB
```

## Performance Issues

### High Memory Usage

**Symptoms**:
- System becoming unresponsive
- Services restarting frequently
- Memory utilization >90%

**Diagnostic Steps**:
```bash
# Check memory usage
free -h

# Identify high-memory services
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}" | sort -k2 -hr

# Check for memory leaks
docker exec high-memory-service ps aux --sort=-%mem | head -10

# Monitor memory over time
watch -n 5 'docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"'
```

**Resolution**:
```bash
# 1. Restart high-memory services
docker restart high-memory-service

# 2. Set memory limits
# Edit docker-compose.yml to add memory constraints

# 3. Clean up Docker system
docker system prune -a

# 4. Consider droplet upgrade if persistent
```

### High CPU Usage

**Symptoms**:
- Slow response times
- Services timing out
- High load average

**Diagnostic Steps**:
```bash
# Check CPU usage
top -bn1 | grep "Cpu(s)"

# Identify high-CPU containers
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}" | sort -k2 -hr

# Check process-level CPU usage
docker exec high-cpu-service ps aux --sort=-%cpu | head -10
```

**Resolution**:
```bash
# 1. Identify and restart problematic services
docker restart high-cpu-service

# 2. Set CPU limits if needed
# Edit docker-compose.yml to add CPU constraints

# 3. Optimize service configuration
# Review service-specific performance tuning
```

## SSL/TLS Certificate Issues

### Certificate Expiration

**Symptoms**:
- Browsers showing certificate warnings
- HTTPS services inaccessible
- Certificate expired errors

**Diagnostic Steps**:
```bash
# Check certificate status
docker exec nginx-proxy openssl x509 -in /etc/nginx/certs/default.crt -noout -dates

# Check acme-companion logs
docker logs nginx-proxy-acme --tail 50 | grep -i "cert\|renew\|error"

# Test certificate renewal
docker exec nginx-proxy-acme /app/force_renew
```

**Resolution**:
```bash
# 1. Force certificate renewal
docker exec nginx-proxy-acme /app/force_renew

# 2. Restart nginx-proxy
docker restart nginx-proxy

# 3. Check DNS resolution
# Ensure domains resolve correctly
```

## Emergency Procedures

### Complete System Restart
```bash
# 1. Stop all services gracefully
docker-compose -f infra/docker-compose.yml down

# 2. Clean up Docker system
docker system prune -f

# 3. Restart infrastructure services first
docker-compose -f infra/docker-compose.yml up -d nginx-proxy postgres

# 4. Restart application services
docker-compose -f infra/docker-compose.yml up -d

# 5. Verify all services are running
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Memory Emergency Response
```bash
# 1. Identify memory hogs
docker stats --no-stream --sort-mem

# 2. Stop non-critical services
docker stop dozzle uptime-kuma openweb

# 3. Restart memory-intensive services
docker restart n8n archon-server

# 4. Monitor recovery
watch -n 5 'free -h'
```

### Storage Emergency Response
```bash
# 1. Check disk usage
df -h

# 2. Clean Docker system
docker system prune -a

# 3. Remove old logs
find /var/lib/docker/containers -name "*.log" -mtime +7 -delete

# 4. Archive old data
# Move old logs and data to backup location
```

## Prevention and Monitoring

### Proactive Monitoring Setup
```bash
# Set up basic monitoring script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
echo "=== Infrastructure Health Check ==="
echo "Memory: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk: $(df / | tail -1 | awk '{print $5}')"
echo "Unhealthy containers: $(docker ps --filter "health=unhealthy" --format "{{.Names}}" | wc -l)"
echo "Restarting containers: $(docker ps --filter "status=restarting" --format "{{.Names}}" | wc -l)"
EOF

chmod +x /usr/local/bin/health-check.sh
```

### Regular Maintenance Tasks
```bash
# Daily health check
0 8 * * * /usr/local/bin/health-check.sh | mail -s "Daily Health Check" admin@example.com

# Weekly Docker cleanup
0 2 * * 0 docker system prune -f

# Monthly log rotation
0 3 1 * * find /var/lib/docker/containers -name "*.log" -mtime +30 -delete
```

---

**Guide Version**: 1.0  
**Last Updated**: 2025-11-09  
**Tested Commands**: All commands validated against current infrastructure  
**Next Review**: Monthly or after major infrastructure changes