#!/bin/bash

# Portfolio Migration Script - /root/portfolio → /home/david/
# Designed for syncbricks pattern with Cloudflare tunnel and nginx-proxy
#
# Key Features:
# - Preserves Docker volumes (your data stays in /var/lib/docker/volumes/)
# - Updates only filesystem paths in configs
# - Cloudflare tunnel token moves with .env file
# - nginx-proxy auto-discovery continues working (uses Docker labels, not paths)
#
# Usage: sudo bash migrate-portfolio.sh

set -e

# Configuration
USER="david"
HOME_DIR="/home/$USER"
OLD_ROOT="/root/portfolio"
BACKUP_DIR="/backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Portfolio Migration: /root/ → /home/david/      ║${NC}"
echo -e "${BLUE}║     Safe migration for syncbricks pattern           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Your data in Docker volumes will NOT be touched!${NC}"
echo -e "${GREEN}nginx-proxy auto-discovery will continue working!${NC}"
echo -e "${GREEN}Cloudflare tunnel will reconnect automatically!${NC}"
echo ""

# Check running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo bash $0${NC}"
    exit 1
fi

# Verify user exists
if ! id "$USER" &>/dev/null; then
    echo -e "${RED}User $USER does not exist. Create it first!${NC}"
    exit 1
fi

# Step 1: Create backup
echo -e "${YELLOW}[1/8] Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/root-portfolio-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "  Creating backup (excluding large data directories)..."
tar -czf "$BACKUP_FILE" \
    --exclude="$OLD_ROOT/infra/*/data" \
    --exclude="$OLD_ROOT/archive/coda-mcp-gateway-legacy-*" \
    --exclude="$OLD_ROOT/archive/coda-mcp-v1.0-session-docs" \
    "$OLD_ROOT/" 2>&1 | grep -v "socket ignored" || true

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | awk '{print $1}')
echo -e "  ${GREEN}✓ Backup created: $BACKUP_FILE ($BACKUP_SIZE)${NC}"

# Verify backup
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Backup verified${NC}"
else
    echo -e "${RED}✗ Backup verification failed!${NC}"
    exit 1
fi
echo ""

# Step 2: Stop all Docker services
echo -e "${YELLOW}[2/8] Stopping Docker services...${NC}"

# Find and stop all docker-compose services
cd "$OLD_ROOT/infra/"

# Stop main services
if [ -f "docker/docker-compose.production.yml" ]; then
    echo "  Stopping main stack (nginx-proxy, cloudflared, n8n, postgres)..."
    cd docker
    docker compose -f docker-compose.production.yml down 2>/dev/null || true
    cd ..
fi

# Stop individual services
for service_dir in */; do
    if [ -f "$service_dir/docker-compose.yml" ]; then
        service_name=$(basename "$service_dir")
        echo "  Stopping $service_name..."
        cd "$service_dir"
        docker compose down 2>/dev/null || true
        cd ..
    fi
done

# Check for any loose docker-compose files in root
if [ -f "/root/docker-compose.production.yml" ]; then
    echo "  Stopping root-level services..."
    cd /root
    docker compose -f docker-compose.production.yml down 2>/dev/null || true
fi

echo -e "  ${GREEN}✓ All services stopped${NC}"
echo ""
echo -e "  ${BLUE}Note: Docker volumes preserved:${NC}"
docker volume ls | grep -E "apps_|infisical_|n8n_|openweb_" | sed 's/^/    /'
echo ""

# Step 3: Create directory structure
echo -e "${YELLOW}[3/8] Creating new directory structure...${NC}"

sudo -u $USER mkdir -p "$HOME_DIR/portfolio"/{archive,backups,docs,integrations,workflows}
sudo -u $USER mkdir -p "$HOME_DIR/services"
sudo -u $USER mkdir -p "$HOME_DIR/scripts"

echo -e "  ${GREEN}✓ Directory structure created:${NC}"
echo "    $HOME_DIR/portfolio/"
echo "    $HOME_DIR/services/"
echo "    $HOME_DIR/scripts/"
echo ""

# Step 4: Copy portfolio content (static files)
echo -e "${YELLOW}[4/8] Copying portfolio content...${NC}"

[ -d "$OLD_ROOT/archive" ] && {
    echo "  Copying archive/ (may take a minute)..."
    cp -r "$OLD_ROOT/archive" "$HOME_DIR/portfolio/"
}

[ -d "$OLD_ROOT/backups" ] && {
    echo "  Copying backups/..."
    cp -r "$OLD_ROOT/backups" "$HOME_DIR/portfolio/"
}

[ -d "$OLD_ROOT/docs" ] && {
    echo "  Copying docs/..."
    cp -r "$OLD_ROOT/docs" "$HOME_DIR/portfolio/"
}

[ -d "$OLD_ROOT/integrations" ] && {
    echo "  Copying integrations/..."
    cp -r "$OLD_ROOT/integrations" "$HOME_DIR/portfolio/"
}

[ -d "$OLD_ROOT/workflows" ] && {
    echo "  Copying workflows/..."
    cp -r "$OLD_ROOT/workflows" "$HOME_DIR/portfolio/"
}

echo -e "  ${GREEN}✓ Portfolio content copied${NC}"
echo ""

# Step 5: Extract services
echo -e "${YELLOW}[5/8] Extracting services to ~/services/...${NC}"

# Main infra directory services
for service_dir in "$OLD_ROOT/infra/"*/; do
    service_name=$(basename "$service_dir")

    # Skip special directories
    if [ "$service_name" = "config" ] || [ "$service_name" = "scripts" ]; then
        continue
    fi

    echo "  Extracting $service_name..."
    mkdir -p "$HOME_DIR/services/$service_name"
    cp -r "$service_dir"* "$HOME_DIR/services/$service_name/" 2>/dev/null || true
done

# Copy scripts separately
if [ -d "$OLD_ROOT/infra/scripts" ]; then
    echo "  Copying infrastructure scripts..."
    cp -r "$OLD_ROOT/infra/scripts"/* "$HOME_DIR/scripts/" 2>/dev/null || true
fi

# Copy loose files from /root/ if they're docker-compose related
if [ -f "/root/docker-compose.production.yml" ]; then
    echo "  Copying root-level docker-compose.production.yml..."
    cp "/root/docker-compose.production.yml" "$HOME_DIR/services/"
fi

if [ -f "/root/Dockerfile.coda-mcp-gateway" ]; then
    echo "  Copying root-level Dockerfile..."
    cp "/root/Dockerfile.coda-mcp-gateway" "$HOME_DIR/services/"
fi

echo -e "  ${GREEN}✓ Services extracted${NC}"
echo ""

# Step 6: Update paths in configuration files
echo -e "${YELLOW}[6/8] Updating paths in configuration files...${NC}"
cd "$HOME_DIR"

echo "  Updating docker-compose files..."
find services/ -name "*.yml" -type f -exec sed -i "s|/root/portfolio|$HOME_DIR|g" {} +
find services/ -name "*.yaml" -type f -exec sed -i "s|/root/portfolio|$HOME_DIR|g" {} +
find services/ -name "docker-compose*.yml" -type f -exec sed -i "s|/root/|$HOME_DIR/|g" {} +

echo "  Updating config files..."
find services/ -name "*.conf" -type f -exec sed -i "s|/root/portfolio|$HOME_DIR|g" {} +
find services/ -name "nginx*.conf" -type f -exec sed -i "s|/root/|$HOME_DIR/|g" {} +

echo "  Updating .env files..."
find services/ -name ".env" -type f -exec sed -i "s|/root/portfolio|$HOME_DIR|g" {} +
find services/ -name ".env*" -type f -exec sed -i "s|/root/|$HOME_DIR/|g" {} +

echo "  Updating Dockerfiles..."
find services/ -name "Dockerfile*" -type f -exec sed -i "s|/root/portfolio|$HOME_DIR|g" {} +

echo "  Updating scripts..."
find scripts/ -name "*.sh" -type f -exec sed -i "s|/root/portfolio|$HOME_DIR|g" {} + 2>/dev/null || true
find scripts/ -name "*.sh" -type f -exec sed -i "s|/root/|$HOME_DIR/|g" {} + 2>/dev/null || true

echo -e "  ${GREEN}✓ Paths updated${NC}"
echo ""

# Step 7: Fix permissions and ownership
echo -e "${YELLOW}[7/8] Fixing permissions...${NC}"

echo "  Setting ownership to $USER:$USER..."
chown -R $USER:$USER "$HOME_DIR/portfolio"
chown -R $USER:$USER "$HOME_DIR/services"
chown -R $USER:$USER "$HOME_DIR/scripts"

echo "  Making scripts executable..."
find "$HOME_DIR/scripts" -name "*.sh" -exec chmod +x {} + 2>/dev/null || true

echo "  Securing .env files..."
find "$HOME_DIR/services" -name ".env*" -exec chmod 600 {} + 2>/dev/null || true

echo -e "  ${GREEN}✓ Permissions fixed${NC}"
echo ""

# Step 8: Summary and verification
echo -e "${YELLOW}[8/8] Verification & Summary${NC}"
echo ""

# Check for any remaining /root/ references
echo "  Checking for remaining /root/ references..."
ROOT_REFS=$(grep -r "/root" "$HOME_DIR/services/" --include="*.yml" --include="*.yaml" --include="*.conf" --include=".env" 2>/dev/null | wc -l)

if [ "$ROOT_REFS" -gt 0 ]; then
    echo -e "  ${YELLOW}⚠ Found $ROOT_REFS references to /root/ (may be in comments):${NC}"
    grep -r "/root" "$HOME_DIR/services/" --include="*.yml" --include="*.yaml" --include="*.conf" --include=".env" 2>/dev/null | head -5
    echo "  (Check these manually if needed)"
else
    echo -e "  ${GREEN}✓ No /root/ references found${NC}"
fi
echo ""

# Display structure
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Migration Complete!                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "New structure created:"
echo "  $HOME_DIR/"
echo "  ├── portfolio/"
echo "  │   ├── archive/"
echo "  │   ├── backups/"
echo "  │   ├── docs/"
echo "  │   ├── integrations/"
echo "  │   └── workflows/"
echo "  ├── services/            ← Your active services"
echo "  │   ├── docker/"
echo "  │   ├── n8n/"
echo "  │   ├── nginx/"
echo "  │   ├── postgres/"
echo "  │   ├── archon/"
echo "  │   └── ..."
echo "  └── scripts/            ← Utility scripts"
echo ""
echo "Docker volumes (unchanged):"
docker volume ls | grep -E "apps_|infisical_|n8n_|openweb_" | sed 's/^/  /'
echo ""
echo -e "${BLUE}IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. Login as $USER:"
echo "   su - $USER"
echo ""
echo "2. Navigate and verify:"
echo "   cd ~/services"
echo "   ls -la"
echo ""
echo "3. Check your main docker-compose file:"
echo "   cd ~/services/docker"
echo "   cat docker-compose.production.yml | grep -E 'CF_TUNNEL|VIRTUAL_HOST'"
echo ""
echo "4. Start services (order matters for syncbricks pattern):"
echo "   cd ~/services/docker"
echo "   docker compose -f docker-compose.production.yml up -d nginx-proxy"
echo "   docker compose -f docker-compose.production.yml up -d acme-companion"
echo "   docker compose -f docker-compose.production.yml up -d postgres"
echo "   sleep 10  # Wait for postgres to be healthy"
echo "   docker compose -f docker-compose.production.yml up -d n8n"
echo "   docker compose -f docker-compose.production.yml up -d cloudflared"
echo ""
echo "5. Verify services:"
echo "   docker ps"
echo "   docker compose -f docker-compose.production.yml logs -f"
echo ""
echo "6. Test Cloudflare tunnel:"
echo "   - Check dashboard: Tunnel should show 🟢 HEALTHY"
echo "   - Test: https://n8n.bestviable.com"
echo "   - Test: https://coda.bestviable.com"
echo ""
echo "7. Monitor for 24-48 hours, then clean up:"
echo "   sudo mv /root/portfolio /root/portfolio.OLD-$(date +%Y%m%d)"
echo ""
echo -e "${YELLOW}⚠️  Notes:${NC}"
echo "  • nginx-proxy will auto-discover services (watches Docker socket)"
echo "  • Cloudflare tunnel token in .env moved with services"
echo "  • VIRTUAL_HOST labels unchanged (auto-discovery continues)"
echo "  • Your data in Docker volumes never moved (safe!)"
echo ""
echo "Backup location: $BACKUP_FILE"
echo "Old files preserved: $OLD_ROOT"
echo ""
echo -e "${GREEN}Migration script complete!${NC}"
