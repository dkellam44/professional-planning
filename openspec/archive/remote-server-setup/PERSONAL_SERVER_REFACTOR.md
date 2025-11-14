# Personal Droplet Server Refactor Guide

## 🚨 Understanding Your Current Situation

### What You Did (Common Beginner Mistake!)

```
Current Setup (PROBLEMATIC):
/
├── root/                           ⚠️ You're working here as root user!
│   ├── projects/
│   ├── services/
│   └── all your working files      🔴 SECURITY RISK
│
└── home/
    ├── usermac/                    ❌ Created but not using
    └── userthinkpad/               ❌ Created but not using
```

### Why This Is Problematic

1. **Security Risk**: Working as `root` means every mistake can damage your entire system
2. **No Recovery**: If you accidentally run `rm -rf /` in the wrong directory, game over
3. **Permission Nightmares**: Services running as root can be exploited
4. **Not Expandable**: Can't easily add collaborators or separate concerns
5. **Backup Complexity**: Hard to backup just "your stuff" vs system files

### The Real Issue

You created `usermac` and `userthinkpad` users but **you're still logging in and working as root**. This is like having a fully equipped workshop but working in your bedroom with power tools!

## ✅ Recommended Structure for Your Use Case

Since you're **one human with two devices**, you don't need separate users per device. Here's what you should have:

```
Recommended Setup:
/
├── root/                           🔒 System only (rarely touch)
│   └── .ssh/                       🔒 Emergency access only
│
├── home/
│   └── yourname/                   ✅ YOUR main working directory
│       ├── .ssh/                   🔑 SSH keys for both devices
│       ├── projects/               💻 All your code projects
│       │   ├── personal/
│       │   ├── work/
│       │   └── experiments/
│       ├── services/               🔧 Service configs (docker-compose, etc.)
│       └── scripts/                📜 Utility scripts
│
├── opt/                            🏢 Third-party applications
│   ├── n8n/                        (if installed manually)
│   └── custom-apps/
│
├── srv/                            🌐 Service data (web servers, etc.)
│   ├── www/                        (web files if hosting sites)
│   └── data/                       (application data)
│
└── var/
    ├── lib/docker/                 🐳 Docker persistent data
    └── log/                        📋 Application logs
```

### Future Expansion Structure

When you add collaborators or agents:

```
Future Setup:
/home/
├── yourname/                       👤 Your personal space (full control)
│   ├── projects/
│   └── personal files
│
├── agent-automation/               🤖 Agent user profile
│   ├── workflows/
│   ├── scripts/
│   └── .ssh/                       (API keys, credentials)
│
├── agent-monitoring/               🤖 Monitoring agent
│   └── logs/
│
├── collaborator1/                  👥 Future team member
│   └── projects/
│
└── shared/                         🤝 Team shared space
    └── team-projects/
```

## 🔧 Your Specific Fix

### Step 1: Understand What You Actually Need

**Questions to answer:**
1. Do you need `usermac` AND `userthinkpad` as separate users? **NO!**
2. Should you have one personal user account? **YES!**
3. Can you connect from both devices to the same user? **YES!**

**The Answer**: Create ONE personal user (e.g., `david` or your name), and connect from both your Mac and Windows/WSL machines using different SSH keys to the SAME user account.

### Step 2: Create Your Personal User (Properly)

```bash
# As root, create your personal user
sudo adduser david  # Replace 'david' with your preferred username

# Add to sudo group (so you can use sudo when needed)
sudo usermod -aG sudo david

# Add to docker group (if you use Docker)
sudo usermod -aG docker david
```

### Step 3: Set Up SSH for Both Devices

**On your Mac:**
```bash
# Generate SSH key for Mac
ssh-keygen -t ed25519 -C "david-macbook" -f ~/.ssh/id_droplet_mac

# Copy to server
ssh-copy-id -i ~/.ssh/id_droplet_mac.pub david@your-droplet-ip
```

**On your Windows/WSL:**
```bash
# Generate SSH key for Windows
ssh-keygen -t ed25519 -C "david-thinkpad" -f ~/.ssh/id_droplet_thinkpad

# Copy to server
ssh-copy-id -i ~/.ssh/id_droplet_thinkpad.pub david@your-droplet-ip
```

**On the server** (`/home/david/.ssh/authorized_keys`):
```
# You'll have BOTH keys in the same file - this is correct!
ssh-ed25519 AAAAC3... david-macbook
ssh-ed25519 AAAAC3... david-thinkpad
```

### Step 4: Migrate Your Projects from /root/

This is the scary part, but we'll do it safely:

```bash
# Login as your new user
ssh david@your-droplet-ip

# Create your directory structure
mkdir -p ~/projects
mkdir -p ~/services
mkdir -p ~/scripts
mkdir -p ~/backups

# Now switch to root temporarily to copy files
sudo su -

# Create a backup FIRST (safety!)
tar -czf /tmp/root-backup-$(date +%Y%m%d).tar.gz /root/

# Copy (not move yet!) your projects
cp -r /root/projects/* /home/david/projects/
cp -r /root/services/* /home/david/services/

# Fix ownership (CRITICAL!)
chown -R david:david /home/david

# Exit root
exit

# Now verify everything works in your new location
ls -la ~/projects
cd ~/projects/your-main-project
# Test that everything works!
```

## 🔐 Understanding Permissions (Beginner-Friendly)

### The Basics

Every file/directory has:
1. **Owner** (user): Usually you
2. **Group**: A collection of users
3. **Others**: Everyone else

Permissions are shown like: `rwxrwxrwx`
- First 3: Owner permissions (read, write, execute)
- Middle 3: Group permissions
- Last 3: Others permissions

### Common Permission Patterns

```bash
# Your personal files
-rw-r--r--  # 644 - You can read/write, others read only
drwxr-xr-x  # 755 - You can do everything, others can read/enter

# Executable scripts
-rwxr-xr-x  # 755 - Everyone can execute

# Sensitive files (SSH keys, passwords)
-rw-------  # 600 - Only you can read/write
drwx------  # 700 - Only you can access directory

# Shared project files (for future team collaboration)
-rw-rw-r--  # 664 - You and group can edit, others read
drwxrwsr-x  # 2775 - Shared directory with setgid bit
```

### Quick Permission Commands

```bash
# View permissions
ls -la

# Change owner
sudo chown username:groupname file

# Change permissions (numeric)
chmod 644 file.txt      # rw-r--r--
chmod 755 script.sh     # rwxr-xr-x
chmod 600 private.key   # rw-------

# Change permissions (symbolic)
chmod u+x script.sh     # Add execute for user
chmod g+w file.txt      # Add write for group
chmod o-r secret.txt    # Remove read for others
```

## 🔗 Symlinks Explained (With Your Use Case)

### What Are Symlinks?

Think of symlinks as "shortcuts" or "aliases" in Windows/Mac.

```bash
# Create a symlink
ln -s /actual/location/file /shortcut/to/file

# Example: Access Docker configs easily
ln -s /var/lib/docker/volumes ~/docker-volumes

# Now you can:
cd ~/docker-volumes  # Actually goes to /var/lib/docker/volumes
```

### Practical Examples for Your Server

**1. Quick access to logs:**
```bash
ln -s /var/log ~/logs
# Now: cd ~/logs instead of cd /var/log
```

**2. Access Docker Compose services:**
```bash
ln -s ~/services/n8n/docker-compose.yml ~/n8n.yml
# Quick edit: vim ~/n8n.yml
```

**3. Shared projects (future use):**
```bash
# When you add collaborators
ln -s /home/shared/team-project ~/projects/team-project
# You can work on team project from your home directory
```

### Symlink Commands

```bash
# Create symlink
ln -s /target/path /link/path

# View symlinks
ls -la  # Shows -> pointing to target

# Remove symlink (doesn't delete target!)
rm /link/path  # Safe - only removes shortcut

# Check where symlink points
readlink /link/path
```

## 🤖 Agent User Profiles

### Should Agents Have Their Own Users?

**YES**, for these reasons:
1. **Security**: Limit what agents can access
2. **Auditing**: See what each agent did (`last`, logs)
3. **Resource Control**: Set limits per agent
4. **Isolation**: Agent compromise doesn't affect your files

### Example Agent Setup

```bash
# Create agent user (no login shell for security)
sudo adduser --system --group --shell /bin/bash agent-automation

# Create API keys directory
sudo mkdir -p /home/agent-automation/.config
sudo chown agent-automation:agent-automation /home/agent-automation/.config

# Set up limited sudo access (if needed)
# /etc/sudoers.d/agent-automation
agent-automation ALL=(ALL) NOPASSWD: /usr/bin/docker compose, /usr/bin/systemctl restart
```

### Agent Structure Example

```
/home/
├── agent-automation/
│   ├── workflows/          # n8n workflows, scripts
│   ├── .env               # API keys (600 permissions)
│   ├── logs/
│   └── cache/
│
├── agent-claude/          # Claude Code agent
│   ├── projects/
│   └── .ssh/             # Deploy keys for git
│
└── agent-monitoring/      # Monitoring agent
    ├── scripts/
    └── alerts/
```

### Giving Agents Access to Your Projects

**Option 1: Group Permissions (Recommended)**
```bash
# Create a shared group
sudo groupadd developers

# Add yourself and agents
sudo usermod -aG developers david
sudo usermod -aG developers agent-automation

# Set project permissions
chmod -R 770 ~/projects/shared-project
chgrp -R developers ~/projects/shared-project
```

**Option 2: Symlinks**
```bash
# Link specific projects to agent
sudo ln -s /home/david/projects/automation \
           /home/agent-automation/projects/automation

# Agent can read but you control permissions
```

**Option 3: Dedicated Shared Space**
```bash
# Create shared directory
sudo mkdir /opt/shared-projects
sudo chown david:developers /opt/shared-projects
sudo chmod 2775 /opt/shared-projects  # setgid bit

# Both you and agents work here
```

## 🏗️ Where Services and Infrastructure Live

### Service Placement Guidelines

| Type | Location | Reasoning |
|------|----------|-----------|
| **Docker Compose Files** | `~/services/` | Easy to manage, version control |
| **Docker Volumes** | `/var/lib/docker/volumes/` | Docker manages automatically |
| **Web Server Files** | `/srv/www/` or `/var/www/` | Standard location |
| **Application Data** | `/opt/appname/` | Third-party apps |
| **Logs** | `/var/log/appname/` | Standard log location |
| **Databases** | `/var/lib/mysql/` (managed) | DB manages itself |
| **Backups** | `/backup/` or `~/backups/` | Easy to find |
| **Scripts** | `~/scripts/` or `/usr/local/bin/` | Personal vs system-wide |

### Example Service Setup

**N8N Automation Service:**
```
Recommended:
/home/david/services/n8n/
├── docker-compose.yml      # Main config (you control)
├── .env                    # Environment variables
└── data/                   # Workflows, credentials (volume mount)

Docker volumes (automatic):
/var/lib/docker/volumes/n8n_data/

Symlink for agent access:
/home/agent-automation/n8n -> /home/david/services/n8n/data
```

**Web Server:**
```
/srv/www/
├── site1.com/
│   ├── public/            # Static files
│   └── logs/
└── site2.com/
```

**Shared Infrastructure:**
```
/opt/
├── monitoring/            # Prometheus, Grafana configs
├── backups/              # Backup scripts
└── scripts/              # System-wide utilities
```

## 📋 Complete Migration Plan

### Phase 1: Setup New User (Safe)

```bash
# 1. Create your personal user
sudo adduser david
sudo usermod -aG sudo,docker david

# 2. Set up SSH from both devices
# (Mac) ssh-keygen -t ed25519 -C "mac" -f ~/.ssh/id_droplet_mac
# (WSL) ssh-keygen -t ed25519 -C "wsl" -f ~/.ssh/id_droplet_wsl
# Copy both to server

# 3. Test login from both devices
ssh david@droplet-ip
```

### Phase 2: Create Backup (CRITICAL!)

```bash
# As root
sudo tar -czf /backup/root-migration-$(date +%Y%m%d).tar.gz \
    --exclude=/root/.cache \
    --exclude=/root/.npm \
    /root/

# Verify backup
ls -lh /backup/
tar -tzf /backup/root-migration-*.tar.gz | head -20
```

### Phase 3: Copy Projects (Test Run)

```bash
# As david
sudo cp -r /root/projects ~/projects-test
sudo chown -R david:david ~/projects-test

# Test thoroughly!
cd ~/projects-test
# Run your applications, check everything works
```

### Phase 4: Update Service Configs

```bash
# Update Docker Compose paths
cd ~/services
vim docker-compose.yml

# Change:
# volumes:
#   - /root/data:/app/data
# To:
#   - /home/david/services/data:/app/data

# Test services
docker compose up -d
docker compose logs
```

### Phase 5: Final Migration

```bash
# Only after testing everything works!
# Move original /root/ files
sudo mv /root/projects /root/projects.old
sudo mv /root/services /root/services.old

# Keep for 30 days, then delete
```

### Phase 6: Clean Up Old Users

```bash
# Remove usermac and userthinkpad (not needed)
sudo deluser --remove-home usermac
sudo deluser --remove-home userthinkpad
```

## ⚠️ Migration Safety Checklist

- [ ] Backup created and verified
- [ ] New user can login from both devices (Mac & WSL)
- [ ] New user has sudo access
- [ ] Projects copied to new location
- [ ] File permissions are correct (`chown` applied)
- [ ] Services updated to use new paths
- [ ] Docker containers running successfully
- [ ] Can access databases/volumes
- [ ] Cron jobs updated (if any)
- [ ] Tested for at least 1 week
- [ ] Old files still available in /root/*.old
- [ ] Documentation updated with new paths

## 🎯 Your Action Plan

### This Weekend (2-3 hours)

1. **Create new user and test SSH** (30 min)
2. **Create complete backup** (30 min)
3. **Copy one small project and test** (1 hour)
4. **Read and understand permissions** (30 min)

### Next Week

1. **Copy all projects** (1 hour)
2. **Update service configs** (2 hours)
3. **Test everything thoroughly** (ongoing)

### Later

1. **Create agent users when needed**
2. **Set up shared collaboration space**
3. **Clean up old /root/ files**

## 🆘 Common Questions

**Q: Can I still use root for emergencies?**
A: Yes! Keep root access, but use it only for system administration.

**Q: What if I mess up permissions?**
A: Run: `sudo chown -R david:david /home/david` to fix ownership.

**Q: Should I delete usermac and userthinkpad?**
A: Yes, after you confirm your new setup works.

**Q: How do I know if I'm logged in as root?**
A: Run `whoami` (should say "david" not "root")

**Q: Can both my Mac and WSL be logged in simultaneously?**
A: Yes! SSH supports multiple connections to the same user.

**Q: What about existing Docker containers?**
A: They'll keep running. Just update docker-compose.yml paths.

## 📚 Further Reading

- Linux file permissions in depth
- Docker user namespace remapping
- SSH key management best practices
- Setting up automated backups
- Linux Filesystem Hierarchy Standard (FHS)

---

**Remember**: Take it slow, backup everything, and test thoroughly!
