# Quick Reference: Your Server Refactor

## 🔍 At a Glance

### Current (Wrong) vs Recommended (Right)

| Aspect | ❌ Current Setup | ✅ Recommended Setup |
|--------|------------------|---------------------|
| **Login User** | `root` | `yourname` |
| **Projects Location** | `/root/projects/` | `/home/yourname/projects/` |
| **Services Location** | `/root/services/` | `/home/yourname/services/` |
| **SSH from Mac** | `ssh root@droplet` | `ssh yourname@droplet` |
| **SSH from WSL** | `ssh root@droplet` | `ssh yourname@droplet` |
| **Device Users** | `usermac`, `userthinkpad` | One user, multiple SSH keys |
| **Security Risk** | HIGH (working as root) | LOW (regular user + sudo) |
| **Expandable** | NO | YES |

## 🎯 Key Concepts

### One User, Multiple Devices

```
Your Setup:
┌─────────────┐         ┌──────────────┐
│   Mac       │         │  Windows/WSL │
│  (Client)   │         │   (Client)   │
└──────┬──────┘         └──────┬───────┘
       │                       │
       │ SSH Key #1            │ SSH Key #2
       │ id_droplet_mac        │ id_droplet_thinkpad
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
         ┌─────────────────┐
         │  Droplet Server │
         │                 │
         │  User: yourname │
         │  ~/.ssh/        │
         │  authorized_keys│
         │  - mac key      │
         │  - thinkpad key │
         └─────────────────┘

Both devices connect to the SAME user account!
```

### Permission Numbers Cheat Sheet

```
Common Permissions:
600  rw-------  Private file (SSH keys)
644  rw-r--r--  Regular file
700  rwx------  Private directory (.ssh/)
755  rwxr-xr-x  Regular directory
775  rwxrwxr-x  Shared team directory

Quick fixes:
chmod 755 directory/     # Standard directory
chmod 644 file.txt       # Standard file
chmod 600 ~/.ssh/*       # SSH keys
```

## ⚡ Quick Commands

### Check Current User
```bash
whoami                    # Shows current user
pwd                       # Shows current directory
ls -la                    # Show files with permissions
```

### Fix Permissions
```bash
# Fix all permissions in your home
sudo chown -R $USER:$USER ~/

# Fix SSH directory
chmod 700 ~/.ssh
chmod 600 ~/.ssh/*
```

### View SSH Keys
```bash
# On server
cat ~/.ssh/authorized_keys

# Should see:
# ssh-ed25519 AAAA... david-macbook
# ssh-ed25519 AAAA... david-thinkpad
```

### Symlink Examples
```bash
# Create shortcut to logs
ln -s /var/log ~/logs

# Use it
cd ~/logs  # Goes to /var/log

# Remove symlink (safe, doesn't delete target)
rm ~/logs
```

## 📁 Directory Cheat Sheet

### Where Things Should Live

```bash
# YOUR personal files
/home/yourname/
├── projects/           # All your code
├── services/          # Docker compose files
├── scripts/           # Utility scripts
└── backups/           # Personal backups

# SYSTEM files (rarely touch)
/root/                 # Emergency use only
/opt/                  # Third-party apps
/srv/                  # Service data
/var/lib/docker/       # Docker volumes (automatic)
/var/log/              # System logs

# FUTURE (agents)
/home/agent-automation/
/home/agent-monitoring/
```

## 🚦 Migration Safety Checklist

```
Phase 1: Preparation
[ ] Create new user
[ ] Test SSH from Mac
[ ] Test SSH from WSL
[ ] Test sudo access

Phase 2: Backup (CRITICAL!)
[ ] Create backup of /root/
[ ] Verify backup integrity
[ ] Know backup location

Phase 3: Copy & Test
[ ] Copy projects to new location
[ ] Test applications work
[ ] Test Docker containers
[ ] Test database access

Phase 4: Update Configs
[ ] Update docker-compose.yml paths
[ ] Update cron jobs
[ ] Update systemd services
[ ] Update scripts with hardcoded paths

Phase 5: Verification (1-2 weeks)
[ ] Everything works from Mac
[ ] Everything works from WSL
[ ] No errors in logs
[ ] Team members can access (if applicable)

Phase 6: Cleanup
[ ] Rename /root/projects to /root/projects.OLD
[ ] Delete usermac user
[ ] Delete userthinkpad user
[ ] After 30 days, delete .OLD directories
```

## 🔥 Emergency Recovery

### If Something Goes Wrong

```bash
# 1. You still have /root/ backup
cd /root/
ls -la  # Your files are still here!

# 2. Restore from backup
sudo tar -xzf /backup/root-migration-backup-*.tar.gz -C /

# 3. Switch back to root temporarily
# (if you can't login as new user)
# Use DigitalOcean console access

# 4. Fix permissions
sudo chown -R yourname:yourname /home/yourname

# 5. Check SSH keys
sudo cat /home/yourname/.ssh/authorized_keys
sudo chmod 700 /home/yourname/.ssh
sudo chmod 600 /home/yourname/.ssh/authorized_keys
```

## 🎓 Learning Path

### Week 1: Understanding
- [x] Read PERSONAL_SERVER_REFACTOR.md
- [ ] Understand why working as root is bad
- [ ] Learn about file permissions
- [ ] Practice SSH from both devices

### Week 2: Preparation
- [ ] Create new user
- [ ] Setup SSH keys from both devices
- [ ] Create backup of /root/
- [ ] Test new user can run sudo

### Week 3: Migration
- [ ] Copy one small project
- [ ] Test it works
- [ ] Copy remaining projects
- [ ] Update service configs

### Week 4: Verification
- [ ] Use new setup exclusively
- [ ] Monitor for errors
- [ ] Document any issues
- [ ] Fine-tune permissions

### Week 5: Cleanup
- [ ] Archive old /root/ files
- [ ] Remove old device users
- [ ] Update documentation

## 🤖 Agent Setup (Future)

### When to Create Agent Users

**Create agent user when:**
- Agent needs to run automated tasks
- Agent needs different permissions than you
- You want to audit agent actions separately
- Agent will interact with external services

**Example:**
```bash
# Create automation agent
sudo adduser --system --group agent-automation

# Give limited access
sudo usermod -aG docker agent-automation

# Set up API keys
sudo -u agent-automation vim /home/agent-automation/.env
```

## 📞 Getting Help

### Check if you're on the right track

```bash
# Good signs:
whoami                    # Shows YOUR username (not root)
pwd                       # Shows /home/yourname/...
ls -la ~/projects         # Shows your files
docker ps                 # Shows containers running
sudo systemctl status ssh # Shows SSH is active

# Bad signs:
whoami                    # Shows 'root'
ls -la                    # Permission denied errors
ssh yourname@droplet      # Connection refused
```

### Common Error Messages

**"Permission denied"**
→ Fix: `sudo chown -R $USER:$USER ~/`

**"Connection refused"**
→ Fix: Check firewall `sudo ufw allow 22/tcp`

**"No such file or directory"**
→ Fix: Update paths in config files

**"sudo: command not found"**
→ Fix: `su -` then `usermod -aG sudo yourname`

## 📚 Remember

1. **NEVER delete /root/ files until tested** (keep for 30+ days)
2. **ONE user for you**, not one per device
3. **Multiple SSH keys** in same authorized_keys file
4. **Backup before** any major change
5. **Test thoroughly** before cleanup
6. **Document changes** as you go

---

**You've got this!** Take it step by step and don't rush.
