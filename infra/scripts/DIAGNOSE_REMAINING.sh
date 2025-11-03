#!/bin/bash
# DIAGNOSE_REMAINING.sh
# Check why nginx-proxy, cloudflared, n8n, coda are unhealthy

set -e
cd ~/portfolio/ops

echo "======================================"
echo "DIAGNOSING REMAINING UNHEALTHY SERVICES"
echo "======================================"
echo ""

# Function to check service logs
check_service() {
    local service=$1
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "SERVICE: $service"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    echo "Last 40 lines of logs:"
    docker compose -f docker-compose.production.yml logs $service --tail 40 2>&1
    echo ""

    echo "Health check details:"
    docker inspect $service 2>/dev/null | grep -A 15 '"HealthCheck"' || echo "No health config found"
    echo ""
}

# Check unhealthy services
check_service nginx-proxy
check_service cloudflared
check_service n8n
check_service coda-mcp

echo ""
echo "======================================"
echo "TESTING ENDPOINTS FROM CONTAINERS"
echo "======================================"
echo ""

# Test nginx from inside
echo "Testing nginx from nginx-proxy container:"
docker compose -f docker-compose.production.yml exec nginx-proxy netstat -tlnp 2>&1 | grep -E "80|443" || echo "netstat check failed"
echo ""

# Test n8n from inside
echo "Testing n8n endpoint from n8n container:"
docker compose -f docker-compose.production.yml exec n8n curl -v http://localhost:5678/health 2>&1 | head -20 || echo "curl to n8n health failed"
echo ""

# Test coda from inside
echo "Testing coda endpoint from coda-mcp container:"
docker compose -f docker-compose.production.yml exec coda-mcp curl -v http://localhost:8080/health 2>&1 | head -20 || echo "curl to coda health failed"
echo ""

# Test cloudflared from inside
echo "Testing cloudflared process from cloudflared container:"
docker compose -f docker-compose.production.yml exec cloudflared ps aux | grep -i cloudflared || echo "cloudflared process check failed"
echo ""

echo "======================================"
echo "DOCKER INSPECT - ALL UNHEALTHY"
echo "======================================"
echo ""

for service in nginx-proxy cloudflared n8n coda-mcp; do
    echo "--- $service health config ---"
    docker inspect $service 2>/dev/null | jq '.[] | {Name: .Name, State: .State, HealthCheck: .HealthCheck}' 2>/dev/null || echo "Could not inspect $service"
    echo ""
done
