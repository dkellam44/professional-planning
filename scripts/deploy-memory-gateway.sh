#!/bin/bash

################################################################################
# Memory Gateway Deployment Script
################################################################################
# This script deploys the Memory Gateway Docker image to the DigitalOcean droplet
#
# What this script does:
# 1. Saves the local Docker image to a compressed file
# 2. Transfers the image to the droplet via SCP
# 3. Loads the image on the droplet
# 4. Creates/updates docker-compose.yml with environment variables
# 5. Restarts the service
# 6. Validates the deployment with health checks
#
# Prerequisites:
# - Docker image 'memory-gateway:latest' built locally
# - SSH access configured with alias 'droplet' in ~/.ssh/config
# - Environment variables in /Users/davidkellam/workspace/portfolio/.env
#
# Usage:
#   ./scripts/deploy-memory-gateway.sh
################################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_IMAGE="memory-gateway:latest"
LOCAL_ARCHIVE="/tmp/memory-gateway.tar.gz"
REMOTE_ARCHIVE="/tmp/memory-gateway.tar.gz"
DROPLET_HOST="droplet"
SERVICE_DIR="/home/david/services/memory-gateway"
ENV_FILE="/Users/davidkellam/workspace/portfolio/.env"

################################################################################
# Helper Functions
################################################################################

# Print colored status messages
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Extract environment variable from .env file
get_env_var() {
    local var_name="$1"
    grep "^${var_name}=" "$ENV_FILE" | cut -d '=' -f2- | sed 's/^"//' | sed 's/"$//'
}

################################################################################
# Pre-flight Checks
################################################################################

print_step "Running pre-flight checks..."

# Check if Docker is running
if ! command_exists docker; then
    print_error "Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info >/dev/null 2>&1; then
    print_error "Docker daemon is not running"
    exit 1
fi

# Check if the Docker image exists locally
if ! docker image inspect "$DOCKER_IMAGE" >/dev/null 2>&1; then
    print_error "Docker image '$DOCKER_IMAGE' not found locally"
    echo "Please build the image first with: docker build -t memory-gateway:latest ."
    exit 1
fi

# Check if SSH access to droplet works
if ! ssh -o ConnectTimeout=5 "$DROPLET_HOST" "echo 'SSH connection successful'" >/dev/null 2>&1; then
    print_error "Cannot connect to droplet via SSH"
    echo "Please verify your SSH configuration in ~/.ssh/config"
    exit 1
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file not found: $ENV_FILE"
    exit 1
fi

print_success "Pre-flight checks passed"

################################################################################
# Step 1: Save Docker Image
################################################################################

print_step "Saving Docker image to archive..."
docker save "$DOCKER_IMAGE" | gzip > "$LOCAL_ARCHIVE"
ARCHIVE_SIZE=$(du -h "$LOCAL_ARCHIVE" | cut -f1)
print_success "Image saved: $LOCAL_ARCHIVE ($ARCHIVE_SIZE)"

################################################################################
# Step 2: Transfer Image to Droplet
################################################################################

print_step "Transferring image to droplet (this may take a few minutes)..."
scp "$LOCAL_ARCHIVE" "${DROPLET_HOST}:${REMOTE_ARCHIVE}"
print_success "Image transferred to droplet"

################################################################################
# Step 3: Load Image on Droplet
################################################################################

print_step "Loading Docker image on droplet..."
ssh "$DROPLET_HOST" "gunzip -c $REMOTE_ARCHIVE | docker load"
print_success "Image loaded on droplet"

# Clean up remote archive
ssh "$DROPLET_HOST" "rm -f $REMOTE_ARCHIVE"

################################################################################
# Step 4: Create/Update Service Directory and Configuration
################################################################################

print_step "Setting up service directory on droplet..."

# Create service directory if it doesn't exist
ssh "$DROPLET_HOST" "mkdir -p $SERVICE_DIR"

# Extract relevant environment variables
ZEP_API_KEY=$(get_env_var "ZEP_API_KEY")
ZEP_MEMORY_URL=$(get_env_var "ZEP_MEMORY_URL")
POSTGRES_HOST=$(get_env_var "POSTGRES_HOST")
POSTGRES_PORT=$(get_env_var "POSTGRES_PORT")
POSTGRES_USER=$(get_env_var "POSTGRES_USER")
POSTGRES_PASSWORD=$(get_env_var "POSTGRES_PASSWORD")
POSTGRES_DB=$(get_env_var "POSTGRES_DB")
PORT=$(get_env_var "PORT")

# Use default port 3000 if not specified
if [ -z "$PORT" ]; then
    PORT=3000
fi

# Create docker-compose.yml on droplet
print_step "Creating docker-compose.yml..."

ssh "$DROPLET_HOST" "cat > $SERVICE_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

services:
  memory-gateway:
    image: memory-gateway:latest
    container_name: memory-gateway
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # Zep Memory Configuration
      - ZEP_API_KEY=${ZEP_API_KEY}
      - ZEP_MEMORY_URL=${ZEP_MEMORY_URL:-https://api.zep.com}
      - ZEP_MEMORY_ENABLED=true

      # PostgreSQL Configuration
      - POSTGRES_HOST=${POSTGRES_HOST:-postgres}
      - POSTGRES_PORT=${POSTGRES_PORT:-5432}
      - POSTGRES_USER=${POSTGRES_USER:-postgres}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB:-portfolio_db}

      # Application Configuration
      - NODE_ENV=production
      - PORT=${PORT:-3000}
      - LOG_LEVEL=info

    # Health check configuration
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # Connect to existing network if needed
    networks:
      - portfolio-network

    # Logging configuration
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  portfolio-network:
    external: true
EOF

# Create .env file on droplet
print_step "Creating .env file on droplet..."

ssh "$DROPLET_HOST" "cat > $SERVICE_DIR/.env" << EOF
# Memory Gateway Environment Variables
ZEP_API_KEY=$ZEP_API_KEY
ZEP_MEMORY_URL=$ZEP_MEMORY_URL
ZEP_MEMORY_ENABLED=true
POSTGRES_HOST=$POSTGRES_HOST
POSTGRES_PORT=$POSTGRES_PORT
POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
NODE_ENV=production
PORT=$PORT
LOG_LEVEL=info
EOF

print_success "Service configuration created"

################################################################################
# Step 5: Create Portfolio Network if Needed
################################################################################

print_step "Ensuring portfolio-network exists..."
ssh "$DROPLET_HOST" "docker network inspect portfolio-network >/dev/null 2>&1 || docker network create portfolio-network"
print_success "Network configured"

################################################################################
# Step 6: Stop and Remove Old Container
################################################################################

print_step "Stopping existing service (if running)..."
ssh "$DROPLET_HOST" "cd $SERVICE_DIR && docker-compose down" || print_warning "No existing service to stop"

################################################################################
# Step 7: Start Service
################################################################################

print_step "Starting Memory Gateway service..."
ssh "$DROPLET_HOST" "cd $SERVICE_DIR && docker-compose up -d"
print_success "Service started"

################################################################################
# Step 8: Wait for Service to be Ready
################################################################################

print_step "Waiting for service to be ready (checking health endpoint)..."
sleep 5  # Give the container a moment to start

MAX_RETRIES=12  # 60 seconds total (12 * 5 seconds)
RETRY_COUNT=0
HEALTH_OK=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if ssh "$DROPLET_HOST" "curl -f -s http://localhost:$PORT/health >/dev/null 2>&1"; then
        HEALTH_OK=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 5
done
echo ""

if [ "$HEALTH_OK" = true ]; then
    print_success "Health check passed"
else
    print_warning "Health check timed out - service may still be starting"
fi

################################################################################
# Step 9: Validate Zep Connection
################################################################################

print_step "Checking service logs for Zep connection..."
ZEP_LOGS=$(ssh "$DROPLET_HOST" "docker logs memory-gateway --tail 50 2>&1" | grep -i "zep" || echo "")

if echo "$ZEP_LOGS" | grep -iq "connected"; then
    print_success "Zep connection established"
elif echo "$ZEP_LOGS" | grep -iq "error"; then
    print_warning "Possible Zep connection issues detected in logs"
else
    print_warning "No Zep connection logs found yet"
fi

################################################################################
# Step 10: Display Service Status
################################################################################

echo ""
echo "========================================================================"
echo "                    DEPLOYMENT SUMMARY                                  "
echo "========================================================================"

# Get container status
CONTAINER_STATUS=$(ssh "$DROPLET_HOST" "docker ps -a --filter name=memory-gateway --format '{{.Status}}'")
echo -e "Container Status: ${GREEN}$CONTAINER_STATUS${NC}"

# Get service URL
echo "Service URL: http://$(ssh "$DROPLET_HOST" "hostname -I | awk '{print \$1}'"):$PORT"
echo "Health Check: http://$(ssh "$DROPLET_HOST" "hostname -I | awk '{print \$1}'"):$PORT/health"

echo ""
echo "========================================================================"
echo "                    RECENT LOGS (Last 20 lines)                         "
echo "========================================================================"
ssh "$DROPLET_HOST" "docker logs memory-gateway --tail 20"

echo ""
echo "========================================================================"
echo "                    USEFUL COMMANDS                                     "
echo "========================================================================"
echo "View logs:         ssh $DROPLET_HOST 'docker logs -f memory-gateway'"
echo "Check status:      ssh $DROPLET_HOST 'docker ps | grep memory-gateway'"
echo "Restart service:   ssh $DROPLET_HOST 'cd $SERVICE_DIR && docker-compose restart'"
echo "Stop service:      ssh $DROPLET_HOST 'cd $SERVICE_DIR && docker-compose down'"
echo "Check health:      ssh $DROPLET_HOST 'curl http://localhost:$PORT/health'"
echo "========================================================================"

# Clean up local archive
rm -f "$LOCAL_ARCHIVE"
print_success "Local archive cleaned up"

echo ""
print_success "Deployment complete!"
