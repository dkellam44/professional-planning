#!/bin/bash
# CHECK_REMAINING_ISSUES.sh
# Diagnose coda and nginx issues

cd ~/portfolio/ops

echo "======================================"
echo "CHECKING CODA-MCP-GATEWAY ISSUE"
echo "======================================"
echo ""

echo "1. Coda logs (last 50 lines):"
docker compose -f docker-compose.production.yml logs coda-mcp-gateway --tail 50
echo ""

echo "2. Coda environment variables:"
docker compose -f docker-compose.production.yml exec coda-mcp-gateway env | grep -E "PORT|NODE_ENV|CODA|LOG"
echo ""

echo "3. Check if coda process is actually running:"
docker compose -f docker-compose.production.yml exec coda-mcp-gateway sh -c "ps aux 2>/dev/null || echo 'ps not available'"
echo ""

echo ""
echo "======================================"
echo "CHECKING NGINX-PROXY ISSUE"
echo "======================================"
echo ""

echo "1. Nginx logs (last 50 lines):"
docker compose -f docker-compose.production.yml logs nginx-proxy --tail 50
echo ""

echo "2. Check nginx configuration:"
docker compose -f docker-compose.production.yml exec nginx-proxy cat /etc/nginx/conf.d/default.conf 2>/dev/null | head -30 || echo "Could not read nginx config"
echo ""

echo "3. Check if nginx upstream services are configured:"
docker compose -f docker-compose.production.yml exec nginx-proxy sh -c "grep -r 'upstream' /etc/nginx/ 2>/dev/null | head -10" || echo "No upstream config found"
echo ""

echo ""
echo "======================================"
echo "CHECKING DOCKER NETWORKS"
echo "======================================"
echo ""

echo "Docker networks:"
docker network ls | grep -E "proxy|syncbricks"
echo ""

echo "Services on 'proxy' network:"
docker network inspect $(docker network ls -q --filter name=proxy | head -1) 2>/dev/null | grep -A 20 "Containers" || echo "Could not inspect proxy network"
