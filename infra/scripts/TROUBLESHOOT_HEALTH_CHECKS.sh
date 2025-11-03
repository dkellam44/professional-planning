#!/bin/bash
# TROUBLESHOOT_HEALTH_CHECKS.sh
# Diagnostic script to identify why containers are unhealthy
# Run this on the droplet: bash TROUBLESHOOT_HEALTH_CHECKS.sh

set -e

cd ~/portfolio/ops

echo "======================================"
echo "CONTAINER HEALTH CHECK DIAGNOSTICS"
echo "======================================"
echo ""

# Function to check a service's health
check_service() {
    local service=$1
    echo "--- $service ---"
    echo "Logs (last 30 lines):"
    docker compose -f docker-compose.production.yml logs $service --tail 30 2>&1 | head -50
    echo ""
}

# Check all unhealthy services
echo "Checking nginx-proxy..."
check_service nginx-proxy

echo "Checking acme-companion..."
check_service acme-companion

echo "Checking cloudflared..."
check_service cloudflared

echo "Checking n8n..."
check_service n8n

echo "Checking coda-mcp..."
check_service coda-mcp

echo ""
echo "======================================"
echo "NETWORK & PORT DIAGNOSTICS"
echo "======================================"
echo ""

# Check if ports are listening
echo "Checking port availability..."
docker compose -f docker-compose.production.yml exec nginx-proxy netstat -tlnp 2>/dev/null || echo "netstat not available in nginx-proxy"
echo ""

# Check internal connectivity
echo "Testing internal connectivity from nginx-proxy..."
docker compose -f docker-compose.production.yml exec nginx-proxy curl -I http://localhost/ 2>&1 || echo "curl failed or no response"
echo ""

# Check if services are responding to health checks
echo "Testing n8n health endpoint..."
docker compose -f docker-compose.production.yml exec n8n curl -I http://localhost:5678/health 2>&1 || echo "n8n health check failed"
echo ""

echo "Testing coda-mcp health endpoint..."
docker compose -f docker-compose.production.yml exec coda-mcp curl -I http://localhost:8080/health 2>&1 || echo "coda health check failed"
echo ""

echo "======================================"
echo "VOLUME & FILE PERMISSIONS"
echo "======================================"
ls -la ~/portfolio/ops/data/ 2>&1
echo ""
ls -la ~/portfolio/ops/certs/ 2>&1 || echo "certs directory not found"
echo ""

echo "======================================"
echo "DOCKER INSPECT - Health Check Config"
echo "======================================"
echo ""

for service in nginx-proxy acme-companion cloudflared n8n coda-mcp; do
    echo "--- $service health config ---"
    docker inspect $service 2>/dev/null | grep -A 20 '"HealthCheck"' || echo "No health config found"
    echo ""
done
