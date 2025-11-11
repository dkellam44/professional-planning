#!/bin/bash

# Team Repository Setup Script
# Creates a shared Git repository for team collaboration
# Run as root: sudo bash setup-team-repo.sh

set -e  # Exit on any error

echo "=== Team Repository Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Configuration
SHARED_DIR="/home/shared"
REPO_NAME="team-project"
REPO_PATH="$SHARED_DIR/$REPO_NAME"
GROUP="dev-team"

# Ensure shared directory exists
echo "[1/5] Setting up shared directory..."
mkdir -p "$SHARED_DIR"
chown root:$GROUP "$SHARED_DIR"
chmod 2775 "$SHARED_DIR"  # setgid bit ensures new files inherit group
echo "  ✓ Shared directory created: $SHARED_DIR"

# Create the Git repository
echo "[2/5] Creating Git repository..."
if [ -d "$REPO_PATH" ]; then
    echo "  Repository already exists at $REPO_PATH"
    read -p "  Delete and recreate? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$REPO_PATH"
    else
        echo "  Keeping existing repository"
        exit 0
    fi
fi

mkdir -p "$REPO_PATH"
cd "$REPO_PATH"

# Initialize Git repository
git init
echo "  ✓ Git repository initialized"

# Create initial project structure
echo "[3/5] Creating initial project files..."
cat > README.md << 'EOF'
# Team Project

Welcome to our team project repository!

## Team Members
- Alice (Admin)
- Bob (Admin)
- Charlie (Admin)

## Getting Started

1. Clone this repository to your local machine
2. Create a new branch for your work
3. Make changes and commit
4. Push to the shared repository

## Workflow

```bash
# Pull latest changes
git pull origin main

# Create a new branch
git checkout -b feature/your-feature-name

# Make changes, then commit
git add .
git commit -m "Description of changes"

# Push your branch
git push origin feature/your-feature-name

# Merge to main (after review)
git checkout main
git merge feature/your-feature-name
git push origin main
```

## Project Structure

```
team-project/
├── README.md
├── src/              # Source code
├── docs/             # Documentation
├── tests/            # Test files
└── .gitignore
```

## Guidelines

1. Always work on a feature branch
2. Write clear commit messages
3. Pull before you push
4. Communicate with the team
5. Keep the main branch stable
EOF

# Create project structure
mkdir -p src docs tests
echo "# Source code goes here" > src/README.md
echo "# Documentation goes here" > docs/README.md
echo "# Tests go here" > tests/README.md

# Create .gitignore
cat > .gitignore << 'EOF'
# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# Build files
build/
dist/
*.o
*.pyc
__pycache__/

# Dependencies
node_modules/
venv/
.env

# Logs
*.log
logs/
EOF

# Create initial commit
git add .
git config user.name "System Administrator"
git config user.email "admin@teamserver"
git commit -m "Initial commit: Project setup"
echo "  ✓ Initial project structure created"

# Set up permissions
echo "[4/5] Setting permissions..."
chown -R root:$GROUP "$REPO_PATH"
chmod -R 2775 "$REPO_PATH"
find "$REPO_PATH" -type f -exec chmod 664 {} \;
find "$REPO_PATH" -type d -exec chmod 2775 {} \;

# Make .git directory writable by group
chmod -R g+w "$REPO_PATH/.git"
echo "  ✓ Permissions set for group collaboration"

# Configure Git for shared repository
echo "[5/5] Configuring Git for team collaboration..."
cd "$REPO_PATH"
git config core.sharedRepository group
git config receive.denyNonFastForwards false
git config core.fileMode false  # Ignore file permission changes
echo "  ✓ Git configured for shared access"

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Repository location: $REPO_PATH"
echo "Repository URL (for cloning): ssh://username@server-ip$REPO_PATH"
echo ""
echo "Each team member should now:"
echo "1. Clone the repository to their home directory:"
echo "   cd ~/projects"
echo "   git clone $REPO_PATH my-team-project"
echo ""
echo "2. Configure their Git identity:"
echo "   cd my-team-project"
echo "   git config user.name \"Your Name\""
echo "   git config user.email \"your.email@example.com\""
echo ""
echo "3. Start working:"
echo "   git checkout -b feature/my-feature"
echo "   # make changes"
echo "   git add ."
echo "   git commit -m \"Your changes\""
echo "   git push origin feature/my-feature"
echo ""
echo "Repository structure created:"
ls -lah "$REPO_PATH"
