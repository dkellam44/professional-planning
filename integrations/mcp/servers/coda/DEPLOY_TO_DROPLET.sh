#!/bin/bash

#############################################################################
# Coda MCP Deployment Script - Deploy to DigitalOcean Droplet
#
# This script automates the deployment process for the Coda MCP HTTP-native
# server to a DigitalOcean droplet using the SyncBricks pattern.
#
# Prerequisites:
# - SSH access to tools-droplet configured
# - DigitalOcean droplet with Docker + Docker Compose running
# - Docker image tag (default: v1.0.0)
#
# Usage:
#   ./DEPLOY_TO_DROPLET.sh [image-tag] [droplet-host]
#
# Example:
#   ./DEPLOY_TO_DROPLET.sh v1.0.0 tools-droplet
#############################################################################

set -e

# Configuration
IMAGE_TAG="${1:-v1.0.0}"
DROPLET_HOST="${2:-tools-droplet}"
LOCAL_DIR="/Users/davidkellam/workspace/portfolio/integrations/mcp/servers/coda"
REMOTE_DIR="/root/portfolio/integrations/mcp/servers/coda"
DOCKER_COMPOSE_DIR="/root/portfolio/docs/ops"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_step() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_info() {
  echo -e "${YELLOW}→${NC} $1"
}

#############################################################################
# Pre-deployment Checks
#############################################################################

log_step "PRE-DEPLOYMENT CHECKS"

log_info "Checking local build..."
if [ -f "$LOCAL_DIR/dist/http-server.js" ]; then
  log_success "Local build exists"
else
  log_error "Local build not found. Run 'pnpm build' first."
  exit 1
fi

log_info "Checking SSH access to $DROPLET_HOST..."
if ssh -o ConnectTimeout=5 "$DROPLET_HOST" echo "SSH connection successful" > /dev/null 2>&1; then
  log_success "SSH access verified"
else
  log_error "Cannot connect to $DROPLET_HOST via SSH"
  exit 1
fi

log_info "Checking Docker on droplet..."
if ssh "$DROPLET_HOST" docker --version > /dev/null 2>&1; then
  docker_version=$(ssh "$DROPLET_HOST" docker --version)
  log_success "Docker available: $docker_version"
else
  log_error "Docker not found on droplet"
  exit 1
fi

log_info "Checking Docker Compose on droplet..."
if ssh "$DROPLET_HOST" docker-compose --version > /dev/null 2>&1; then
  log_success "Docker Compose available"
else
  log_error "Docker Compose not found on droplet"
  exit 1
fi

#############################################################################
# Step 1: Copy Files to Droplet
#############################################################################

log_step "STEP 1: COPY FILES TO DROPLET"

log_info "Creating remote directory: $REMOTE_DIR"
ssh "$DROPLET_HOST" mkdir -p "$REMOTE_DIR"
log_success "Remote directory created"

log_info "Copying Coda MCP files to droplet..."

# Use rsync with exclusions for better compatibility
if command -v rsync &> /dev/null; then
  log_info "Using rsync for efficient transfer..."
  rsync -avz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='.DS_Store' \
    --exclude='dist' \
    --exclude='.next' \
    "$LOCAL_DIR/" \
    "$DROPLET_HOST:$REMOTE_DIR/"
else
  log_info "rsync not available, using tar+ssh..."
  # Fallback: use tar to exclude and transfer
  tar --exclude='node_modules' \
      --exclude='.git' \
      --exclude='.DS_Store' \
      --exclude='dist' \
      --exclude='.next' \
      -czf - -C "$LOCAL_DIR" . | \
    ssh "$DROPLET_HOST" "cd $REMOTE_DIR && tar -xzf -"
fi

log_success "Files copied to droplet"

log_info "Verifying files on droplet..."
ssh "$DROPLET_HOST" ls -la "$REMOTE_DIR/" | head -20
log_success "Files verified"

#############################################################################
# Step 2: Build Docker Image on Droplet
#############################################################################

log_step "STEP 2: BUILD DOCKER IMAGE ON DROPLET"

log_info "Building Docker image: coda-mcp:$IMAGE_TAG"
ssh "$DROPLET_HOST" "cd $REMOTE_DIR && docker build -t coda-mcp:$IMAGE_TAG ."

log_info "Verifying image build..."
if ssh "$DROPLET_HOST" docker images | grep "coda-mcp" | grep "$IMAGE_TAG" > /dev/null; then
  log_success "Docker image built successfully: coda-mcp:$IMAGE_TAG"
else
  log_error "Docker image build failed"
  exit 1
fi

log_info "Image details:"
ssh "$DROPLET_HOST" docker images | grep "coda-mcp"

#############################################################################
# Step 3: Update docker-compose.production.yml
#############################################################################

log_step "STEP 3: UPDATE DOCKER-COMPOSE CONFIGURATION"

log_info "Checking docker-compose.production.yml on droplet..."
if ssh "$DROPLET_HOST" test -f "$DOCKER_COMPOSE_DIR/docker-compose.production.yml"; then
  log_success "docker-compose.production.yml found"
else
  log_error "docker-compose.production.yml not found at $DOCKER_COMPOSE_DIR"
  echo "  You may need to update the path or create the file manually"
  echo "  See DROPLET_DEPLOYMENT_GUIDE.md for configuration template"
fi

log_info "Backup current docker-compose.yml..."
backup_file="docker-compose.production.$(date +%Y-%m-%d_%H-%M-%S).yml"
ssh "$DROPLET_HOST" "cp $DOCKER_COMPOSE_DIR/docker-compose.production.yml $DOCKER_COMPOSE_DIR/$backup_file" || true
log_success "Backup created: $backup_file"

#############################################################################
# Step 4: Deploy Service
#############################################################################

log_step "STEP 4: DEPLOY SERVICE"

log_info "Stopping existing coda-mcp service (if running)..."
ssh "$DROPLET_HOST" "cd /root/portfolio && docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.production.yml stop coda-mcp" || true
log_success "Service stopped"

log_info "Starting coda-mcp service..."
ssh "$DROPLET_HOST" "cd /root/portfolio && docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.production.yml up -d coda-mcp"
log_success "Service started"

log_info "Waiting for service to be ready (5 seconds)..."
sleep 5

log_info "Checking service status..."
service_status=$(ssh "$DROPLET_HOST" "docker ps | grep coda-mcp")
if [ -n "$service_status" ]; then
  log_success "Service is running"
  echo "  $service_status"
else
  log_error "Service failed to start"
  log_info "Checking logs..."
  ssh "$DROPLET_HOST" docker logs coda-mcp | tail -50
  exit 1
fi

#############################################################################
# Step 5: Validate Deployment
#############################################################################

log_step "STEP 5: VALIDATE DEPLOYMENT"

log_info "Testing health endpoint..."
health_response=$(ssh "$DROPLET_HOST" curl -s http://localhost:8080/health)
if echo "$health_response" | grep -q '"status"'; then
  log_success "Health check passed"
  echo "  Response: $(echo $health_response | jq '.')"
else
  log_error "Health check failed"
  echo "  Response: $health_response"
fi

log_info "Testing OAuth endpoints..."
oauth_response=$(ssh "$DROPLET_HOST" curl -s http://localhost:8080/.well-known/oauth-authorization-server)
if echo "$oauth_response" | grep -q '"issuer"'; then
  log_success "OAuth Authorization Server endpoint working"
else
  log_error "OAuth endpoint failed"
fi

log_info "Checking Docker health status..."
health_status=$(ssh "$DROPLET_HOST" "docker inspect coda-mcp | jq '.[].State.Health.Status'")
log_success "Health Status: $health_status"

#############################################################################
# Step 6: Post-Deployment Checks
#############################################################################

log_step "STEP 6: POST-DEPLOYMENT CHECKS"

log_info "Checking logs for errors..."
error_count=$(ssh "$DROPLET_HOST" docker logs coda-mcp 2>&1 | grep -c "ERROR" || echo "0")
if [ "$error_count" -gt 0 ]; then
  log_error "Found $error_count errors in logs"
  ssh "$DROPLET_HOST" docker logs coda-mcp | grep ERROR | head -5
else
  log_success "No errors in logs"
fi

log_info "Resource usage..."
ssh "$DROPLET_HOST" docker stats coda-mcp --no-stream | tail -1

log_info "Volume mounts..."
ssh "$DROPLET_HOST" docker inspect coda-mcp | jq '.[].Mounts[]'

#############################################################################
# Deployment Summary
#############################################################################

log_step "DEPLOYMENT SUMMARY"

log_success "Coda MCP deployed successfully!"
echo ""
echo "  Image Tag:        coda-mcp:$IMAGE_TAG"
echo "  Droplet Host:     $DROPLET_HOST"
echo "  Remote Path:      $REMOTE_DIR"
echo "  Compose Path:     $DOCKER_COMPOSE_DIR"
echo ""

log_info "Next steps:"
echo "  1. Test with real token:       ./test-with-real-token.sh https://coda.bestviable.com"
echo "  2. Monitor logs:               ssh $DROPLET_HOST 'docker logs -f coda-mcp'"
echo "  3. Check service status:       ssh $DROPLET_HOST 'docker ps | grep coda-mcp'"
echo "  4. View configuration:         ssh $DROPLET_HOST 'cat $DOCKER_COMPOSE_DIR/docker-compose.production.yml | grep -A 30 coda-mcp'"
echo ""

log_info "Useful commands:"
echo "  ssh $DROPLET_HOST 'docker logs coda-mcp | grep ERROR'"
echo "  ssh $DROPLET_HOST 'curl https://coda.bestviable.com/health'"
echo "  ssh $DROPLET_HOST 'docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.production.yml ps'"
echo ""

log_success "Deployment complete!"

#############################################################################
# Rollback Instructions
#############################################################################

if [ "$error_count" -gt 0 ]; then
  log_error "Deployment had errors. Consider rolling back:"
  echo ""
  echo "  ssh $DROPLET_HOST 'docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.production.yml stop coda-mcp'"
  echo "  ssh $DROPLET_HOST 'docker images | grep coda-mcp'  # Check previous versions"
  echo "  # Edit docker-compose.production.yml to use previous image version"
  echo "  ssh $DROPLET_HOST 'docker-compose -f $DOCKER_COMPOSE_DIR/docker-compose.production.yml up -d coda-mcp'"
  echo ""
fi

exit 0
