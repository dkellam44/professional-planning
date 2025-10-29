#!/bin/bash
# cleanup-droplet.sh
# Run on droplet to clean up legacy files and set up git

set -e

echo "======================================"
echo "DROPLET CLEANUP & GIT SETUP"
echo "======================================"
echo ""

# Phase 1: Cleanup
echo "Phase 1: Cleaning up legacy files..."
echo ""

echo "1. Archiving old backups..."
mkdir -p ~/backups/archive
if [ -f ~/n8n_backup_2025-10-21.tgz ]; then
    mv ~/n8n_backup_2025-10-21.tgz ~/backups/archive/
    echo "  ✓ Moved n8n_backup_2025-10-21.tgz"
fi

if [ -f ~/backups/n8n_infra_2025-10-21_0121.tgz ]; then
    mv ~/backups/n8n_infra_2025-10-21_0121.tgz ~/backups/archive/
    echo "  ✓ Moved n8n_infra_2025-10-21_0121.tgz"
fi

if [ -f ~/backups/n8n_legacy_2025-10-21_0121.tgz ]; then
    mv ~/backups/n8n_legacy_2025-10-21_0121.tgz ~/backups/archive/
    echo "  ✓ Moved n8n_legacy_2025-10-21_0121.tgz"
fi

echo ""
echo "2. Removing legacy infra directory..."
if [ -d ~/infra ]; then
    rm -rf ~/infra
    echo "  ✓ Removed ~/infra/"
else
    echo "  ✓ ~/infra/ already removed"
fi

echo ""
echo "3. Verifying current deployment..."
cd ~/portfolio/ops
docker compose -f docker-compose.production.yml ps
echo ""

# Phase 2: Git setup
echo "======================================"
echo "Phase 2: Setting up git..."
echo "======================================"
echo ""

cd ~/portfolio

if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    echo "  ✓ Git initialized"
else
    echo "  ✓ Git already initialized"
fi

echo ""
echo "Setting up remote (you'll need to provide your GitHub repo URL)..."
echo "Run manually: git remote add origin https://github.com/yourusername/portfolio.git"
echo "Then: git fetch origin"
echo "Then: git branch --set-upstream-to=origin/main main"
echo ""

echo "======================================"
echo "Cleanup Complete!"
echo "======================================"
echo ""
echo "Directory structure:"
tree -L 2 ~/
echo ""
echo "Next steps:"
echo "1. Configure git remote (see above)"
echo "2. Run: git pull origin main"
echo "3. Verify deployment still works"
