# Remote Server Setup Guide

Complete guide for setting up a remote server with three admin users and a shared team project repository.

## 📋 Overview

This setup creates:
- **3 Admin Users**: alice, bob, charlie (all with sudo privileges)
- **SSH Key Authentication**: Secure passwordless login
- **Shared Team Repository**: Git repository for team collaboration
- **Proper Permissions**: Secure file and directory permissions

## 🏗️ Server Architecture

```
Remote Server (e.g., DigitalOcean Droplet)
│
├── Users (Admin Level)
│   ├── alice (sudo access, SSH key auth)
│   ├── bob (sudo access, SSH key auth)
│   └── charlie (sudo access, SSH key auth)
│
├── Shared Team Space
│   └── /home/shared/team-project/ (Git repository)
│
└── Security
    ├── SSH key authentication only
    ├── Root login disabled
    └── Password authentication disabled
```

## 🚀 Quick Start

### On the Server (as root)

```bash
# 1. Create setup directory
mkdir -p /root/server-setup
cd /root/server-setup

# 2. Copy the setup scripts to the server
# (upload setup-users.sh and setup-team-repo.sh)

# 3. Run user setup
chmod +x setup-users.sh
sudo ./setup-users.sh

# 4. Add SSH public keys for each user (see SSH_SETUP_GUIDE.md)

# 5. Run team repository setup
chmod +x setup-team-repo.sh
sudo ./setup-team-repo.sh

# 6. Restart SSH service
sudo systemctl restart sshd
```

### On Client Machines

Each team member:
```bash
# 1. Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. Copy public key to server
ssh-copy-id username@server-ip

# 3. Test connection
ssh username@server-ip

# 4. Clone team repository
cd ~/projects
git clone /home/shared/team-project team-project
cd team-project

# 5. Configure Git
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## 📚 Complete Setup Process

### Step 1: Initial Server Setup

**What you need:**
- A fresh Linux server (Ubuntu 20.04/22.04 or Debian 11/12)
- Root access to the server
- Server IP address

**First-time server login:**
```bash
# SSH to your server as root
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install essential packages
apt install -y git curl wget vim sudo ufw
```

### Step 2: Create Users and Setup Access

**Run the user setup script:**
```bash
# Download or create setup-users.sh
sudo bash setup-users.sh
```

**What this does:**
- Creates three users: alice, bob, charlie
- Adds them to dev-team group with sudo access
- Sets up SSH directories with correct permissions
- Configures SSH server for security
- Creates personal project directories

**Set strong passwords:**
```bash
sudo passwd alice
sudo passwd bob
sudo passwd charlie
```

### Step 3: Configure SSH Keys

**For each team member** (detailed in [SSH_SETUP_GUIDE.md](SSH_SETUP_GUIDE.md)):

1. Generate SSH key on local computer
2. Copy public key to server
3. Test SSH connection
4. Disable password authentication (optional)

**Quick method:**
```bash
# On client machine
ssh-keygen -t ed25519 -C "alice@company.com"
ssh-copy-id alice@server-ip
ssh alice@server-ip  # Should work without password
```

### Step 4: Setup Team Repository

**Run the repository setup script:**
```bash
sudo bash setup-team-repo.sh
```

**What this creates:**
- Shared directory: `/home/shared/team-project/`
- Initial Git repository with README
- Proper permissions for group collaboration
- Project structure (src/, docs/, tests/)

### Step 5: Team Members Clone Repository

**Each user on the server:**
```bash
# Login to server
ssh alice@server-ip

# Navigate to personal projects
cd ~/projects

# Clone the shared repository
git clone /home/shared/team-project my-team-project
cd my-team-project

# Configure Git identity
git config user.name "Alice Smith"
git config user.email "alice@company.com"

# Start working
git checkout -b feature/my-first-feature
```

## 🔐 Security Configuration

### Firewall Setup (UFW)

```bash
# Enable firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if running web server)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

### SSH Hardening

Edit `/etc/ssh/sshd_config.d/team-config.conf`:
```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 22  # Or use non-standard port like 2222
MaxAuthTries 3
MaxSessions 10
```

Restart SSH:
```bash
sudo systemctl restart sshd
```

### Sudo Security

Require password for sudo (default):
```bash
# /etc/sudoers.d/admin-team
%dev-team ALL=(ALL:ALL) ALL
```

Or allow passwordless sudo (less secure):
```bash
# /etc/sudoers.d/admin-team
%dev-team ALL=(ALL:ALL) NOPASSWD: ALL
```

## 👥 Team Workflow

### Daily Workflow

**1. Pull latest changes:**
```bash
git pull origin main
```

**2. Create feature branch:**
```bash
git checkout -b feature/add-login-page
```

**3. Make changes and commit:**
```bash
# Edit files
vim src/app.js

# Check status
git status

# Add changes
git add src/app.js

# Commit with message
git commit -m "Add login page with authentication"
```

**4. Push to shared repository:**
```bash
git push origin feature/add-login-page
```

**5. Merge to main:**
```bash
git checkout main
git merge feature/add-login-page
git push origin main
```

### Collaboration Tips

1. **Always pull before starting work**
   ```bash
   git pull origin main
   ```

2. **Use descriptive branch names**
   - ✅ `feature/user-authentication`
   - ✅ `bugfix/login-error`
   - ❌ `my-branch`
   - ❌ `test`

3. **Write clear commit messages**
   - ✅ `Add user registration form with validation`
   - ❌ `update`
   - ❌ `changes`

4. **Communicate with team**
   - Use comments in code
   - Update documentation
   - Notify team of major changes

5. **Handle merge conflicts**
   ```bash
   # If merge conflict occurs
   git status  # See conflicting files
   vim conflicted-file.js  # Edit and resolve
   git add conflicted-file.js
   git commit -m "Resolve merge conflict in login feature"
   ```

## 📁 File Structure

### Server Directory Layout

```
/home/
├── alice/
│   ├── .ssh/
│   │   ├── authorized_keys (alice's public key)
│   │   └── config
│   ├── projects/
│   │   └── my-team-project/ (cloned from shared repo)
│   ├── .bashrc
│   └── .bash_history
│
├── bob/
│   ├── .ssh/
│   │   └── authorized_keys (bob's public key)
│   └── projects/
│       └── my-team-project/ (cloned from shared repo)
│
├── charlie/
│   ├── .ssh/
│   │   └── authorized_keys (charlie's public key)
│   └── projects/
│       └── my-team-project/ (cloned from shared repo)
│
└── shared/
    └── team-project/ (shared Git repository)
        ├── .git/
        ├── README.md
        ├── src/
        ├── docs/
        ├── tests/
        └── .gitignore
```

## 🛠️ Common Tasks

### Add a New User

```bash
# Create user
sudo useradd -m -s /bin/bash -G dev-team,sudo dave

# Set password
sudo passwd dave

# Setup SSH
sudo mkdir -p /home/dave/.ssh
sudo touch /home/dave/.ssh/authorized_keys
sudo chmod 700 /home/dave/.ssh
sudo chmod 600 /home/dave/.ssh/authorized_keys
sudo chown -R dave:dave /home/dave/.ssh

# Add SSH public key
echo "dave's-public-key" | sudo tee -a /home/dave/.ssh/authorized_keys
```

### Remove a User

```bash
# Remove user and home directory
sudo userdel -r charlie

# Or keep home directory
sudo userdel charlie
```

### Check User Access

```bash
# List all users
cat /etc/passwd | grep /home

# Check sudo access
sudo -l -U alice

# View group members
getent group dev-team

# Check SSH keys
sudo cat /home/alice/.ssh/authorized_keys
```

### Backup Team Repository

```bash
# Create backup
sudo tar -czf team-project-backup-$(date +%Y%m%d).tar.gz /home/shared/team-project/

# Or use Git
cd /home/shared/team-project
git bundle create /backup/team-project.bundle --all
```

### Monitor Server

```bash
# Check system resources
htop

# View disk usage
df -h

# Check memory
free -h

# View active SSH sessions
who

# View login history
last

# Monitor SSH attempts
sudo tail -f /var/log/auth.log  # Ubuntu/Debian
```

## 🐛 Troubleshooting

### SSH Connection Issues

**Problem: Permission denied (publickey)**
```bash
# Check SSH key permissions on client
ls -la ~/.ssh/
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# Check authorized_keys on server
sudo ls -la /home/alice/.ssh/
sudo chmod 700 /home/alice/.ssh
sudo chmod 600 /home/alice/.ssh/authorized_keys
sudo chown alice:alice /home/alice/.ssh/authorized_keys
```

**Problem: Connection refused**
```bash
# Check if SSH is running
sudo systemctl status sshd

# Check firewall
sudo ufw status
sudo ufw allow 22/tcp

# Check SSH port
sudo netstat -tlnp | grep :22
```

### Git Permission Issues

**Problem: Permission denied when pushing**
```bash
# Check repository permissions
ls -la /home/shared/team-project/

# Fix permissions
sudo chown -R root:dev-team /home/shared/team-project/
sudo chmod -R 2775 /home/shared/team-project/
sudo find /home/shared/team-project/ -type f -exec chmod 664 {} \;
sudo chmod -R g+w /home/shared/team-project/.git/
```

**Problem: Cannot pull/push to shared repo**
```bash
# Configure Git for shared repository
cd /home/shared/team-project
sudo git config core.sharedRepository group
sudo git config receive.denyNonFastForwards false
```

### Sudo Issues

**Problem: User not in sudoers file**
```bash
# Add user to sudo group
sudo usermod -aG sudo alice

# Or edit sudoers
sudo visudo
# Add: alice ALL=(ALL:ALL) ALL
```

## 📖 Additional Resources

- [SERVER_STRUCTURE.md](SERVER_STRUCTURE.md) - Detailed directory structure
- [SSH_SETUP_GUIDE.md](SSH_SETUP_GUIDE.md) - Complete SSH configuration guide
- `setup-users.sh` - Automated user creation script
- `setup-team-repo.sh` - Automated repository setup script

## 🎓 Learning Resources

### Linux Basics
- [Linux Journey](https://linuxjourney.com/) - Interactive tutorials
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

### Git & Version Control
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [Pro Git Book](https://git-scm.com/book/en/v2)

### SSH & Security
- [SSH Academy](https://www.ssh.com/academy/ssh)
- [Digital Ocean Security Tutorials](https://www.digitalocean.com/community/tags/security)

## ✅ Checklist

Server Setup:
- [ ] Server created and accessible
- [ ] System updated (`apt update && apt upgrade`)
- [ ] Three users created (alice, bob, charlie)
- [ ] Users have sudo access
- [ ] SSH keys configured for all users
- [ ] Password authentication disabled
- [ ] Firewall configured (UFW)
- [ ] Shared team repository created
- [ ] Repository permissions set correctly

Client Setup (for each team member):
- [ ] SSH key generated
- [ ] Public key added to server
- [ ] Can login without password
- [ ] Team repository cloned
- [ ] Git configured (name and email)
- [ ] Can push/pull to shared repository

## 🆘 Need Help?

Common mistakes beginners make:
1. **Wrong permissions** - SSH very strict about file permissions
2. **Forgot to restart SSH** - Changes require `systemctl restart sshd`
3. **Using wrong key** - Make sure you're using the right private key
4. **Root login issues** - Don't lock yourself out before testing user access
5. **Git conflicts** - Always pull before you push

**Testing checklist:**
1. Can you SSH as each user? ✅
2. Can each user run sudo commands? ✅
3. Can each user clone the repository? ✅
4. Can each user push changes? ✅
5. Do changes from one user appear for others? ✅

## 📝 Notes

- Always test SSH access before disabling password authentication
- Keep a backup access method (console access via hosting provider)
- Document any changes to the server configuration
- Regularly backup the shared repository
- Update system packages regularly
- Monitor server logs for security issues

---

**Created for**: New programmers and network IT learners
**Server Type**: Remote droplet (DigitalOcean, Linode, etc.)
**Team Size**: 3 admin users
**Access Method**: SSH key authentication
**Collaboration**: Shared Git repository
