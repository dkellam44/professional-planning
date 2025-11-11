# SSH Setup Guide for Team Members

## Overview
This guide explains how to set up SSH key authentication for secure access to the remote server.

## For Each Team Member (Client Side)

### Step 1: Generate SSH Key Pair (if you don't have one)

On your **local computer** (not the server), run:

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "your_email@example.com"

# Or use RSA if ed25519 is not supported
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

**Prompts you'll see:**
- Location: Press Enter to accept default `~/.ssh/id_ed25519`
- Passphrase: Enter a strong passphrase (recommended) or leave empty

**What this creates:**
- Private key: `~/.ssh/id_ed25519` (keep this SECRET!)
- Public key: `~/.ssh/id_ed25519.pub` (this is safe to share)

### Step 2: Copy Public Key to Server

**Method 1: Using ssh-copy-id (easiest)**
```bash
ssh-copy-id alice@your-server-ip
```

**Method 2: Manual copy**
```bash
# Display your public key
cat ~/.ssh/id_ed25519.pub

# Then SSH to the server (using password one last time)
ssh alice@your-server-ip

# On the server, add your public key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "paste-your-public-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

**Method 3: Server admin adds it**
The server admin can add your public key directly:
```bash
# Admin runs this on the server
echo "user-public-key" >> /home/alice/.ssh/authorized_keys
```

### Step 3: Test SSH Connection

```bash
# Connect using SSH key
ssh alice@your-server-ip

# If you set a passphrase, you'll be prompted for it (not the user password)
```

### Step 4: Configure SSH Client (Optional but Recommended)

Create/edit `~/.ssh/config` on your **local computer**:

```
# Team Server Configuration
Host teamserver
    HostName your-server-ip-or-domain
    User alice
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3

# Now you can connect with just: ssh teamserver
```

## For Server Administrator

### Add User's Public Key to Server

For user `alice`:
```bash
# Method 1: User provides their public key
echo "ssh-ed25519 AAAAC3Nz... alice@laptop" >> /home/alice/.ssh/authorized_keys

# Method 2: Copy from a file
cat alice_key.pub >> /home/alice/.ssh/authorized_keys

# Ensure correct permissions
chmod 600 /home/alice/.ssh/authorized_keys
chown alice:alice /home/alice/.ssh/authorized_keys
```

Repeat for `bob` and `charlie`.

### Verify SSH Configuration

```bash
# Check SSH service status
sudo systemctl status sshd

# Test configuration
sudo sshd -t

# Restart if needed
sudo systemctl restart sshd

# View SSH logs
sudo tail -f /var/log/auth.log  # Debian/Ubuntu
sudo tail -f /var/log/secure     # CentOS/RHEL
```

## Example SSH Keys (for reference only)

### Alice's Setup
```bash
# Local machine (alice's laptop)
ssh-keygen -t ed25519 -C "alice@company.com"
# Creates: ~/.ssh/id_ed25519 and ~/.ssh/id_ed25519.pub

# Copy public key to server
ssh-copy-id alice@192.168.1.100
```

### Bob's Setup
```bash
# Local machine (bob's laptop)
ssh-keygen -t ed25519 -C "bob@company.com"
ssh-copy-id bob@192.168.1.100
```

### Charlie's Setup
```bash
# Local machine (charlie's laptop)
ssh-keygen -t ed25519 -C "charlie@company.com"
ssh-copy-id charlie@192.168.1.100
```

## Security Best Practices

1. **Never share your private key** (`id_ed25519`)
2. **Use a strong passphrase** for your SSH key
3. **Use ssh-agent** to avoid typing passphrase repeatedly:
   ```bash
   eval "$(ssh-agent -s)"
   ssh-add ~/.ssh/id_ed25519
   ```
4. **Disable password authentication** after SSH keys are working
5. **Use different keys** for different servers/purposes
6. **Backup your private key** securely

## Troubleshooting

### Permission Issues
```bash
# On the server, check permissions
ls -la ~/.ssh
# Should be: drwx------ (700) for .ssh directory
# Should be: -rw------- (600) for authorized_keys

# Fix permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Connection Refused
```bash
# Check if SSH service is running
sudo systemctl status sshd

# Check firewall
sudo ufw status
sudo ufw allow 22/tcp
```

### Debug Connection
```bash
# Verbose SSH connection
ssh -v alice@your-server-ip

# Very verbose (more details)
ssh -vvv alice@your-server-ip
```

### Key Not Working
Common issues:
- Wrong permissions on `.ssh` or `authorized_keys`
- Wrong username
- Server doesn't have your public key
- Using wrong private key (specify with `ssh -i ~/.ssh/specific_key`)
- SELinux blocking (CentOS/RHEL): `restorecon -R -v ~/.ssh`

## Quick Reference

```bash
# Generate key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy to server
ssh-copy-id username@server

# Connect
ssh username@server

# Connect with specific key
ssh -i ~/.ssh/custom_key username@server

# Copy files to server
scp file.txt username@server:/path/to/destination

# Copy files from server
scp username@server:/path/to/file.txt ./local-directory
```
