#!/bin/bash

# Migrate from /root/ to proper user directory
# This script helps you safely migrate your projects from /root/ to /home/username/
#
# Usage: sudo bash migrate-from-root.sh
#
# IMPORTANT: This script is interactive and will ask for confirmation at each step

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     /root/ to /home/ Migration Script              ║${NC}"
echo -e "${BLUE}║     Safe migration with backups and checks         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Must run as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root: sudo bash $0${NC}"
    exit 1
fi

# Step 1: Get target username
echo -e "${YELLOW}[Step 1/8] User Information${NC}"
echo ""
read -p "Enter your personal username (not 'root'): " TARGET_USER

if [ -z "$TARGET_USER" ] || [ "$TARGET_USER" = "root" ]; then
    echo -e "${RED}Invalid username. Cannot be empty or 'root'.${NC}"
    exit 1
fi

# Check if user exists
if ! id "$TARGET_USER" &>/dev/null; then
    echo -e "${YELLOW}User $TARGET_USER doesn't exist yet.${NC}"
    read -p "Create user $TARGET_USER? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        adduser "$TARGET_USER"
        usermod -aG sudo "$TARGET_USER"
        # Add to docker group if it exists
        if getent group docker > /dev/null 2>&1; then
            usermod -aG docker "$TARGET_USER"
        fi
        echo -e "${GREEN}✓ User $TARGET_USER created${NC}"
    else
        echo -e "${RED}Cannot proceed without a target user.${NC}"
        exit 1
    fi
fi

TARGET_HOME="/home/$TARGET_USER"
echo -e "${GREEN}✓ Using target directory: $TARGET_HOME${NC}"
echo ""

# Step 2: Analyze current /root/ contents
echo -e "${YELLOW}[Step 2/8] Analyzing /root/ directory${NC}"
echo ""
echo "Current /root/ directory size and structure:"
du -sh /root/ 2>/dev/null || echo "Could not calculate size"
echo ""
echo "Top-level directories in /root/:"
ls -la /root/ | grep "^d" | awk '{print $9}' | grep -v "^\.$" | grep -v "^\.\.$" | sed 's/^/  - /'
echo ""

read -p "Continue with analysis? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Step 3: Create backup
echo -e "${YELLOW}[Step 3/8] Creating backup of /root/${NC}"
echo ""

BACKUP_DIR="/backup"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/root-migration-backup-$(date +%Y%m%d-%H%M%S).tar.gz"

echo "This may take several minutes depending on data size..."
echo "Backup location: $BACKUP_FILE"
echo ""

read -p "Create backup now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating backup..."
    tar -czf "$BACKUP_FILE" \
        --exclude=/root/.cache \
        --exclude=/root/.npm \
        --exclude=/root/.local/share/Trash \
        /root/ 2>&1 | grep -v "socket ignored" || true

    BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | awk '{print $1}')
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
    echo ""

    # Verify backup
    echo "Verifying backup..."
    if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backup verified successfully${NC}"
    else
        echo -e "${RED}✗ Backup verification failed!${NC}"
        exit 1
    fi
else
    echo -e "${RED}Cannot proceed without backup!${NC}"
    exit 1
fi
echo ""

# Step 4: Create directory structure
echo -e "${YELLOW}[Step 4/8] Creating directory structure in $TARGET_HOME${NC}"
echo ""

DIRS_TO_CREATE=("projects" "services" "scripts" "backups" "tmp")

echo "Will create the following directories:"
for dir in "${DIRS_TO_CREATE[@]}"; do
    echo "  - $TARGET_HOME/$dir"
done
echo ""

read -p "Create directory structure? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    for dir in "${DIRS_TO_CREATE[@]}"; do
        mkdir -p "$TARGET_HOME/$dir"
        echo "  ✓ Created $dir/"
    done
    echo -e "${GREEN}✓ Directory structure created${NC}"
else
    echo "Skipping directory creation."
fi
echo ""

# Step 5: Identify what to migrate
echo -e "${YELLOW}[Step 5/8] Identifying directories to migrate${NC}"
echo ""

# Common directories that should be migrated
MIGRATE_CANDIDATES=()
for dir in /root/projects /root/services /root/scripts /root/code /root/repos /root/work; do
    if [ -d "$dir" ]; then
        SIZE=$(du -sh "$dir" 2>/dev/null | awk '{print $1}')
        echo "Found: $dir ($SIZE)"
        MIGRATE_CANDIDATES+=("$dir")
    fi
done

if [ ${#MIGRATE_CANDIDATES[@]} -eq 0 ]; then
    echo "No standard project directories found in /root/"
    echo ""
    read -p "Enter custom directory to migrate (full path, or press Enter to skip): " CUSTOM_DIR
    if [ -n "$CUSTOM_DIR" ] && [ -d "$CUSTOM_DIR" ]; then
        MIGRATE_CANDIDATES+=("$CUSTOM_DIR")
    fi
fi

echo ""

# Step 6: Copy files
if [ ${#MIGRATE_CANDIDATES[@]} -gt 0 ]; then
    echo -e "${YELLOW}[Step 6/8] Copying files${NC}"
    echo ""
    echo "Will copy the following directories:"
    for dir in "${MIGRATE_CANDIDATES[@]}"; do
        echo "  - $dir -> $TARGET_HOME/$(basename "$dir")"
    done
    echo ""
    echo -e "${YELLOW}WARNING: This preserves originals in /root/ (safe operation)${NC}"
    echo ""

    read -p "Proceed with copying? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for src_dir in "${MIGRATE_CANDIDATES[@]}"; do
            dest_dir="$TARGET_HOME/$(basename "$src_dir")"
            echo "Copying $(basename "$src_dir")..."

            # Copy with rsync if available (better), otherwise cp
            if command -v rsync &> /dev/null; then
                rsync -a --info=progress2 "$src_dir/" "$dest_dir/" || cp -r "$src_dir" "$dest_dir"
            else
                cp -r "$src_dir" "$dest_dir"
            fi

            echo -e "  ${GREEN}✓ Copied $(basename "$src_dir")${NC}"
        done
        echo -e "${GREEN}✓ All files copied${NC}"
    else
        echo "Skipping file copy."
    fi
else
    echo -e "${YELLOW}No directories to migrate found.${NC}"
fi
echo ""

# Step 7: Fix permissions
echo -e "${YELLOW}[Step 7/8] Fixing permissions${NC}"
echo ""
echo "Setting ownership to $TARGET_USER:$TARGET_USER for all files in $TARGET_HOME"
echo ""

read -p "Fix permissions now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Updating ownership..."
    chown -R "$TARGET_USER:$TARGET_USER" "$TARGET_HOME"

    echo "Setting directory permissions (755)..."
    find "$TARGET_HOME" -type d -exec chmod 755 {} \;

    echo "Setting file permissions (644)..."
    find "$TARGET_HOME" -type f -exec chmod 644 {} \;

    # Make scripts executable if they exist
    if [ -d "$TARGET_HOME/scripts" ]; then
        echo "Making scripts executable..."
        find "$TARGET_HOME/scripts" -type f -name "*.sh" -exec chmod 755 {} \;
    fi

    # Secure SSH directory if exists
    if [ -d "$TARGET_HOME/.ssh" ]; then
        chmod 700 "$TARGET_HOME/.ssh"
        chmod 600 "$TARGET_HOME/.ssh/"* 2>/dev/null || true
    fi

    echo -e "${GREEN}✓ Permissions fixed${NC}"
else
    echo -e "${YELLOW}WARNING: Skipped permission fixing. Run manually:${NC}"
    echo "  sudo chown -R $TARGET_USER:$TARGET_USER $TARGET_HOME"
fi
echo ""

# Step 8: Summary and next steps
echo -e "${YELLOW}[Step 8/8] Migration Summary${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Migration Complete!                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Backup location: $BACKUP_FILE"
echo "Target directory: $TARGET_HOME"
echo ""
echo -e "${BLUE}IMPORTANT NEXT STEPS:${NC}"
echo ""
echo "1. Switch to your new user and test:"
echo "   su - $TARGET_USER"
echo "   cd ~/projects"
echo "   ls -la"
echo ""
echo "2. Test your applications:"
echo "   cd ~/projects/your-project"
echo "   # Run your tests, start services, etc."
echo ""
echo "3. Update service configurations:"
echo "   # Edit docker-compose.yml, config files, etc."
echo "   # Change paths from /root/ to $TARGET_HOME/"
echo ""
echo "4. Update cron jobs (if any):"
echo "   crontab -e -u $TARGET_USER"
echo ""
echo "5. Update SSH config (connect as $TARGET_USER, not root):"
echo "   # On your local machine:"
echo "   ssh $TARGET_USER@your-server-ip"
echo ""
echo "6. After testing for 1-2 weeks, rename old directories:"
echo "   # As root:"
echo "   sudo mv /root/projects /root/projects.OLD-DELETE-AFTER-$(date -d '+30 days' +%Y%m%d)"
echo ""
echo -e "${YELLOW}⚠️  DO NOT DELETE /root/ contents until you've verified everything works!${NC}"
echo ""
echo "7. Optional: Remove old device-specific users:"
echo "   sudo deluser --remove-home usermac"
echo "   sudo deluser --remove-home userthinkpad"
echo ""
echo -e "${BLUE}Troubleshooting:${NC}"
echo "- Permission denied: sudo chown -R $TARGET_USER:$TARGET_USER $TARGET_HOME"
echo "- Can't login as $TARGET_USER: Check SSH keys in $TARGET_HOME/.ssh/"
echo "- Services not working: Check paths in config files"
echo ""
echo "Backup kept at: $BACKUP_FILE"
echo ""

# Create a summary file
SUMMARY_FILE="$TARGET_HOME/MIGRATION_SUMMARY.txt"
cat > "$SUMMARY_FILE" << EOF
Migration Summary
=================

Date: $(date)
Source: /root/
Target: $TARGET_HOME
User: $TARGET_USER
Backup: $BACKUP_FILE

Directories migrated:
EOF

for dir in "${MIGRATE_CANDIDATES[@]}"; do
    echo "  - $(basename "$dir")" >> "$SUMMARY_FILE"
done

cat >> "$SUMMARY_FILE" << EOF

Next Steps:
-----------
1. Test all applications in new location
2. Update service configurations
3. Update cron jobs
4. Test from both client machines (Mac & WSL)
5. After 1-2 weeks, archive /root/ old files
6. Document any custom paths that needed updating

Original backup location: $BACKUP_FILE
Keep this backup for at least 30 days!
EOF

chown "$TARGET_USER:$TARGET_USER" "$SUMMARY_FILE"
echo -e "${GREEN}✓ Summary saved to: $SUMMARY_FILE${NC}"
echo ""

echo -e "${GREEN}Done! Review the steps above and test thoroughly.${NC}"
