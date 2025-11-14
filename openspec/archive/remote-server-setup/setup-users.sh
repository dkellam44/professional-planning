#!/bin/bash

# Remote Server User Setup Script
# This script creates three admin users and sets up the shared team environment
# Run as root: sudo bash setup-users.sh

set -e  # Exit on any error

echo "=== Remote Server User Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Create the dev-team group
echo "[1/6] Creating dev-team group..."
groupadd -f dev-team

# Create three admin users
USERS=("alice" "bob" "charlie")

for USER in "${USERS[@]}"; do
    echo "[2/6] Creating user: $USER..."

    # Create user with home directory
    if id "$USER" &>/dev/null; then
        echo "  User $USER already exists, skipping..."
    else
        useradd -m -s /bin/bash -G dev-team,sudo "$USER"
        echo "  User $USER created"
    fi

    # Set up SSH directory
    echo "  Setting up SSH directory for $USER..."
    SSH_DIR="/home/$USER/.ssh"
    mkdir -p "$SSH_DIR"
    touch "$SSH_DIR/authorized_keys"
    chmod 700 "$SSH_DIR"
    chmod 600 "$SSH_DIR/authorized_keys"
    chown -R "$USER:$USER" "$SSH_DIR"

    # Create personal projects directory
    PROJECTS_DIR="/home/$USER/projects"
    mkdir -p "$PROJECTS_DIR"
    chown "$USER:$USER" "$PROJECTS_DIR"

    echo "  ✓ $USER setup complete"
    echo ""
done

# Create shared directory structure
echo "[3/6] Creating shared team directory..."
mkdir -p /home/shared
chown root:dev-team /home/shared
chmod 2775 /home/shared  # setgid bit for group inheritance

echo "[4/6] Setting up sudo access..."
# Create sudoers file for admin team
SUDOERS_FILE="/etc/sudoers.d/admin-team"
cat > "$SUDOERS_FILE" << 'EOF'
# Admin team members have full sudo access
%dev-team ALL=(ALL:ALL) ALL

# Optional: Allow sudo without password (less secure, but convenient)
# Uncomment the line below if you want passwordless sudo:
# %dev-team ALL=(ALL:ALL) NOPASSWD: ALL
EOF
chmod 440 "$SUDOERS_FILE"

echo "[5/6] Configuring SSH server..."
# Backup original sshd_config
if [ ! -f /etc/ssh/sshd_config.backup ]; then
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
fi

# Update SSH configuration for security
cat >> /etc/ssh/sshd_config.d/team-config.conf << 'EOF'
# Team SSH Configuration
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
EOF

echo "[6/6] User passwords and SSH keys..."
echo ""
echo "⚠️  IMPORTANT: Set passwords for each user:"
for USER in "${USERS[@]}"; do
    echo "Setting password for $USER..."
    passwd "$USER"
done

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Each user needs to add their SSH public key to ~/.ssh/authorized_keys"
echo "2. Restart SSH service: sudo systemctl restart sshd"
echo "3. Test SSH access from client machines"
echo "4. Set up the shared team repository (see setup-team-repo.sh)"
echo ""
echo "Users created:"
for USER in "${USERS[@]}"; do
    echo "  - $USER (admin access via sudo)"
done
echo ""
echo "Shared directory: /home/shared (group: dev-team)"
