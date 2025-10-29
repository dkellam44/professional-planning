#!/bin/bash
# DEPLOY_FIXES.sh
# Deploy updated health checks to droplet
# Run from ~/portfolio/ops on droplet

set -e

cd ~/portfolio/ops

echo "======================================"
echo "DEPLOYING HEALTH CHECK FIXES"
echo "======================================"
echo ""

# Backup current config
echo "Step 1: Backing up current docker-compose.production.yml..."
cp docker-compose.production.yml docker-compose.production.yml.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"
echo ""

# Stop containers
echo "Step 2: Stopping all containers..."
docker compose -f docker-compose.production.yml down
echo "✅ Containers stopped"
echo ""

# Start fresh
echo "Step 3: Starting containers with updated health checks..."
docker compose -f docker-compose.production.yml up -d
echo "✅ Containers started"
echo ""

# Show status
echo "Step 4: Initial status (give it 30 seconds)..."
sleep 5
docker compose -f docker-compose.production.yml ps
echo ""

# Monitor
echo "======================================"
echo "MONITORING HEALTH STATUS"
echo "======================================"
echo ""
echo "Watching for health checks to pass (Ctrl+C to stop)..."
echo ""

watch -n 3 'docker compose -f docker-compose.production.yml ps'
