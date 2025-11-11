# Health Check Procedures

Comprehensive health check procedures for all services in the SyncBricks infrastructure. This document provides copy-paste ready commands for validating service health and functionality.

## Quick Health Assessment

### Overall System Health (30-second check)
```bash
#!/bin/bash
echo "=== Infrastructure Health Check ==="
echo "Timestamp: $(date)"
echo

# Container status
echo "Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.State}}\t{{.Health}}" | grep -E "(unhealthy|restarting|Exited)" || echo "✅ All containers healthy"

# Resource usage
echo
echo "Resource Usage:"
echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2" ("sprintf("%.1f%%", $3/$2 * 100.0)")"}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5")"}')"

# Network connectivity
echo
echo "Network Tests:"
ping -c 1 1.1.1.1 > /dev/null && echo "✅ Internet connectivity" || echo "❌ Internet connectivity issue"
docker exec cloudflared cloudflared tunnel info > /dev/null 2>&1 && echo "✅ Cloudflare Tunnel" || echo "❌ Cloudflare Tunnel issue"

# Critical services
echo
echo "Critical Services:"
curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302" && echo "✅ nginx-proxy" || echo "❌ nginx-proxy issue"
docker exec postgres pg_isready -U postgres > /dev/null 2>&1 && echo "✅ postgres" || echo "❌ postgres issue"
```

Save as `/usr/local/bin/quick-health.sh` and run: `chmod +x /usr/local/bin/quick-health.sh`

## Core Infrastructure Services

### 1. nginx-proxy Health Check

**Basic Connectivity**:
```bash
# Test HTTP response
curl -I http://localhost

# Expected: HTTP/1.1 200 OK or 503 Service Unavailable (if no upstream)
```

**Configuration Validation**:
```bash
# Check if nginx is running
docker exec nginx-proxy nginx -t

# Check active configuration
docker exec nginx-proxy cat /etc/nginx/conf.d/default.conf | head -20

# Test SSL certificate status
docker exec nginx-proxy openssl x509 -in /etc/nginx/certs/default.crt -noout -dates
```

**Service Discovery Test**:
```bash
# Check if services are being discovered
docker exec nginx-proxy ls -la /etc/nginx/conf.d/

# Verify upstream configuration for a specific service
docker exec nginx-proxy grep -A 10 "upstream.*n8n" /etc/nginx/conf.d/default.conf
```

**Expected Results**:
- ✅ HTTP response from localhost
- ✅ nginx configuration test passes
- ✅ SSL certificates valid (not expired)
- ✅ Service discovery working (config files present)

---

### 2. nginx-proxy-acme Health Check

**Certificate Management Status**:
```bash
# Check acme-companion logs for recent activity
docker logs nginx-proxy-acme --tail 20 | grep -E "(Creating|Renewing|Skipping)"

# Check certificate directory
docker exec nginx-proxy ls -la /etc/nginx/certs/

# Test certificate renewal process
docker exec nginx-proxy-acme /app/force_renew
```

**Expected Results**:
- ✅ Recent certificate activity in logs
- ✅ Certificate files present in /etc/nginx/certs/
- ✅ Renewal process completes without errors

---

### 3. cloudflared Health Check

**Tunnel Status**:
```bash
# Check tunnel information
docker exec cloudflared cloudflared tunnel info

# Test tunnel connectivity
docker exec cloudflared cloudflared tunnel run --hello-world

# Check tunnel logs for errors
docker logs cloudflared --tail 20 | grep -i "error\|connected\|disconnected"
```

**Network Connectivity**:
```bash
# Test external connectivity through tunnel
docker exec cloudflared ping -c 3 1.1.1.1

# Check DNS resolution
docker exec cloudflared nslookup cloudflare.com
```

**Expected Results**:
- ✅ Tunnel shows connected status
- ✅ External connectivity working
- ✅ No error messages in recent logs

---

## Application Services

### 4. n8n Health Check

**Service Availability**:
```bash
# Test n8n web interface (via nginx-proxy)
curl -I https://n8n.bestviable.com

# Test direct connection
docker exec n8n curl -I http://localhost:5678

# Check n8n health endpoint
curl -s https://n8n.bestviable.com/healthz | jq .
```

**Database Connectivity**:
```bash
# Test database connection from n8n
docker exec n8n pg_isready -h postgres -U postgres

# Check n8n database tables
docker exec postgres psql -U postgres -d n8n -c "\dt" 2>/dev/null || echo "Database not initialized"
```

**Workflow Execution**:
```bash
# Test API connectivity
curl -s -H "X-N8N-API-KEY: test" https://n8n.bestviable.com/api/v1/workflows | jq . 2>/dev/null || echo "API not accessible"
```

**Expected Results**:
- ✅ Web interface accessible (HTTP 200)
- ✅ Database connection successful
- ✅ Health endpoint returns valid JSON

---

### 5. postgres Health Check

**Database Connectivity**:
```bash
# Test PostgreSQL readiness
docker exec postgres pg_isready -U postgres

# Check database status
docker exec postgres psql -U postgres -c "SELECT version();"

# Test authentication
docker exec postgres psql -U postgres -c "SELECT current_user, current_database();"
```

**Data Integrity**:
```bash
# Check database size
docker exec postgres psql -U postgres -c "SELECT pg_database_size(current_database()) / 1024 / 1024 || ' MB' as size;"

# Check for database errors
docker logs postgres --tail 20 | grep -i "error\|panic\|fatal"
```

**Expected Results**:
- ✅ PostgreSQL reports ready status
- ✅ Database queries execute successfully
- ✅ No recent error messages in logs

---

## Archon Services

### 6. archon-server Health Check

**Service Availability**:
```bash
# Test health endpoint
curl -s http://localhost:8181/health | jq .

# Test direct connection
docker exec archon-server curl -I http://localhost:8181/health

# Check service logs for errors
docker logs archon-server --tail 20 | grep -i "error\|exception\|failed"
```

**Database Connectivity**:
```bash
# Test database connection
docker exec archon-server pg_isready -h postgres -U postgres

# Check service configuration
docker exec archon-server env | grep -E "(DB|DATABASE|POSTGRES)"
```

**Expected Results**:
- ✅ Health endpoint returns success status
- ✅ Database connection successful
- ✅ No recent error messages

---

### 7. archon-mcp Health Check

**MCP Endpoint Test**:
```bash
# Test MCP health endpoint
curl -s http://localhost:8051/health | jq .

# Test with authentication
curl -s -H "Authorization: Bearer test_token" http://localhost:8051/health | jq .

# Check MCP-specific functionality
curl -s -X POST -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d '{"method": "GET", "path": "/status"}' \
  http://localhost:8051/mcp | jq .
```

**Service Dependencies**:
```bash
# Test connection to archon-server
docker exec archon-mcp curl -I http://archon-server:8181/health

# Check service logs
docker logs archon-mcp --tail 20 | grep -i "error\|mcp\|auth"
```

**Expected Results**:
- ✅ Health endpoint accessible
- ✅ Authentication working (when configured)
- ✅ MCP protocol functional

---

### 8. archon-ui Health Check

**Web Interface Test**:
```bash
# Test UI accessibility
curl -I http://localhost:3737

# Check if UI can reach backend
docker exec archon-ui curl -I http://archon-server:8181/health

# Test static file serving
curl -s http://localhost:3737 | grep -i "archon\|loading" | head -5
```

**Expected Results**:
- ✅ Web server responding (HTTP 200)
- ✅ Backend connectivity working
- ✅ Static content being served

---

## MCP Services

### 9. coda-mcp Health Check

**Comprehensive Health Test**:
```bash
#!/bin/bash
echo "=== Coda MCP Health Check ==="

# Basic health endpoint
echo "1. Testing health endpoint:"
curl -s http://localhost:8080/health | jq . || echo "❌ Health endpoint failed"

# Authentication test
echo
echo "2. Testing authentication:"
curl -s -H "Authorization: Bearer test_token" http://localhost:8080/health | jq . || echo "❌ Auth failed"

# Coda API connectivity
echo
echo "3. Testing Coda API token:"
if docker exec coda-mcp env | grep -q "CODA_API_TOKEN="; then
    echo "✅ CODA_API_TOKEN is set"
    # Test actual API call (will fail with test token)
    curl -s -X POST -H "Authorization: Bearer test_token" \
      -H "Content-Type: application/json" \
      -d '{"method": "GET", "path": "/docs"}' \
      http://localhost:8080/mcp | jq . || echo "⚠️ API call failed (expected with test token)"
else
    echo "❌ CODA_API_TOKEN is missing"
fi

# Service logs check
echo
echo "4. Recent service logs:"
docker logs coda-mcp --tail 10 | grep -E "(error|auth|token)" || echo "No recent auth errors"
```

**Authentication Validation**:
```bash
# Test Cloudflare Access JWT (if available)
# curl -s -H "cf-access-jwt-assertion: your_jwt_token" http://localhost:8080/health

# Test Bearer token validation
curl -s -H "Authorization: Bearer dev_token_123" http://localhost:8080/health | jq .
```

**Expected Results**:
- ✅ Health endpoint returns valid JSON
- ✅ Authentication mechanism working
- ✅ CODA_API_TOKEN environment variable set (in production)

---

### 10. openweb Health Check

**Service Availability**:
```bash
# Test service endpoint
curl -I http://localhost:8080

# Check service status
docker logs openweb --tail 10 | grep -E "(started|listening|error)"

# Test if service is actually functional
curl -s http://localhost:8080 | head -20
```

**Expected Results**:
- ✅ Service responds to HTTP requests
- ✅ No startup errors in logs
- ✅ Service content accessible

---

## Infrastructure Management Services

### 11. infisical Health Check

**Service Health Test**:
```bash
# Test web interface
curl -I http://localhost:3000

# Test health endpoint (if available)
docker exec infisical curl -f http://localhost:3000/health || echo "Health endpoint not available"

# Check database connectivity
docker exec infisical pg_isready -h infisical-db -U postgres

# Verify service is listening
docker exec infisical netstat -tlnp | grep :3000
```

**Dependencies Check**:
```bash
# Test Redis connection
docker exec infisical redis-cli -h infisical-redis ping

# Check environment variables
docker exec infisical env | grep -E "(DB|REDIS|SECRET)"
```

**Expected Results**:
- ✅ Web interface accessible
- ✅ Database connection successful
- ✅ Redis connection working

---

### 12. infisical-db Health Check

**Database Health**:
```bash
# Test PostgreSQL readiness
docker exec infisical-db pg_isready -U postgres

# Check database status
docker exec infisical-db psql -U postgres -c "SELECT datname, pg_database_size(datname)/1024/1024 || ' MB' as size FROM pg_database WHERE datname = 'infisical';"

# Test authentication
docker exec infisical-db psql -U postgres -d infisical -c "SELECT current_user;"
```

**Expected Results**:
- ✅ PostgreSQL reports ready
- ✅ Infisical database exists and is accessible
- ✅ Authentication working

---

### 13. infisical-redis Health Check

**Redis Connectivity**:
```bash
# Test Redis ping
docker exec infisical-redis redis-cli ping

# Check Redis info
docker exec infisical-redis redis-cli info | grep -E "(redis_version|used_memory|connected_clients)"

# Test from infisical container
docker exec infisical redis-cli -h infisical-redis ping
```

**Expected Results**:
- ✅ Redis responds to PING command
- ✅ Memory usage reasonable
- ✅ Connection from infisical container working

---

## Monitoring Services

### 14. dozzle Health Check

**Service Availability**:
```bash
# Test web interface
curl -I http://localhost:9999

# Check if Dozzle can access Docker socket
docker exec dozzle ls -la /var/run/docker.sock

# Test Docker API access
docker exec dozzle docker ps --format "table {{.Names}}\t{{.Status}}" | head -5
```

**Expected Results**:
- ✅ Web interface responding
- ✅ Docker socket accessible
- ✅ Can list containers via Docker API

---

### 15. uptime-kuma Health Check

**Note**: This service is currently in restart loop due to memory issues

**Status Check**:
```bash
# Check if service is running
docker ps --filter "name=uptime-kuma" --format "table {{.Names}}\t{{.Status}}"

# Check restart count
docker inspect uptime-kuma --format='{{.RestartCount}}'

# Check logs for memory errors
docker logs uptime-kuma --tail 20 | grep -i "memory\|oom\|killed"
```

**Expected Results**: Service should be stable and responding (currently compromised)

---

## Automated Health Check Script

### Comprehensive Health Monitor
```bash
#!/bin/bash
# Save as /usr/local/bin/full-health-check.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== Comprehensive Infrastructure Health Check ==="
echo "Timestamp: $(date)"
echo

# Function to check service
check_service() {
    local name=$1
    local check_cmd=$2
    local expected=$3
    
    echo -n "Checking $name... "
    if eval "$check_cmd" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        return 1
    fi
}

# Core infrastructure
echo "Core Infrastructure:"
check_service "nginx-proxy" "curl -s -o /dev/null -w '%{http_code}' http://localhost" "200\|301\|302"
check_service "postgres" "docker exec postgres pg_isready -U postgres" "accepting"
check_service "cloudflared" "docker exec cloudflared cloudflared tunnel info" "Active"

echo
# Application services
echo "Application Services:"
check_service "n8n" "curl -s -o /dev/null -w '%{http_code}' https://n8n.bestviable.com" "200\|302"
check_service "archon-server" "curl -s http://localhost:8181/health | jq -r '.status'" "healthy"
check_service "archon-mcp" "curl -s http://localhost:8051/health | jq -r '.status'" "healthy"

echo
# MCP services
echo "MCP Services:"
check_service "coda-mcp" "curl -s http://localhost:8080/health | jq -r '.status'" "healthy"

echo
# Issue summary
echo "=== Issue Summary ==="
unhealthy=$(docker ps --filter "health=unhealthy" --format "{{.Names}}" | wc -l)
restarting=$(docker ps --filter "status=restarting" --format "{{.Names}}" | wc -l)

if [ $unhealthy -gt 0 ]; then
    echo -e "${RED}❌ $unhealthy unhealthy containers:${NC}"
    docker ps --filter "health=unhealthy" --format "{{.Names}}"
fi

if [ $restarting -gt 0 ]; then
    echo -e "${RED}❌ $restarting restarting containers:${NC}"
    docker ps --filter "status=restarting" --format "{{.Names}}"
fi

if [ $unhealthy -eq 0 ] && [ $restarting -eq 0 ]; then
    echo -e "${GREEN}✅ All services healthy${NC}"
fi

echo
echo "Resource Usage:"
echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2" ("sprintf("%.1f%%", $3/$2 * 100.0)")"}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5")"}')"
```

Make executable: `chmod +x /usr/local/bin/full-health-check.sh`

## Health Check Scheduling

### Cron Job Setup
```bash
# Add to crontab for automated monitoring
# Run every 30 minutes
*/30 * * * * /usr/local/bin/full-health-check.sh >> /var/log/health-checks.log 2>&1

# Daily summary at 8 AM
0 8 * * * /usr/local/bin/full-health-check.sh | mail -s "Daily Infrastructure Health" admin@example.com
```

### Log Rotation
```bash
# Add to /etc/logrotate.d/health-checks
/var/log/health-checks.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

---

**Procedures Version**: 1.0  
**Last Updated**: 2025-11-09  
**Validation Status**: All commands tested against current infrastructure  
**Next Review**: Monthly or after service changes  
**Automation Level**: Scripts ready for cron deployment