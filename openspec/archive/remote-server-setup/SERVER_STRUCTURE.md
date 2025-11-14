# Remote Server Directory Structure

## Typical Linux Server Layout

```
/
├── home/
│   ├── alice/              # Admin User 1
│   │   ├── .ssh/
│   │   │   ├── authorized_keys
│   │   │   └── config
│   │   ├── .bashrc
│   │   └── projects/       # Personal workspace
│   │
│   ├── bob/                # Admin User 2
│   │   ├── .ssh/
│   │   │   ├── authorized_keys
│   │   │   └── config
│   │   ├── .bashrc
│   │   └── projects/
│   │
│   ├── charlie/            # Admin User 3
│   │   ├── .ssh/
│   │   │   ├── authorized_keys
│   │   │   └── config
│   │   ├── .bashrc
│   │   └── projects/
│   │
│   └── shared/             # Shared team directory
│       └── team-project/   # Main team Git repository
│
├── opt/
│   └── team-apps/          # Shared applications
│
├── var/
│   ├── log/                # System and application logs
│   └── www/                # Web server files (if needed)
│
└── etc/
    ├── ssh/
    │   └── sshd_config     # SSH server configuration
    └── sudoers.d/
        └── admin-team      # Sudo permissions for team
```

## User Accounts

### Admin Users (sudo access)
- **alice** - Full admin privileges
- **bob** - Full admin privileges
- **charlie** - Full admin privileges

### Shared Resources
- **Team Repository**: `/home/shared/team-project/`
- **Group**: `dev-team` (all users are members)

## Access Control

### File Permissions
- User home directories: `755` (rwxr-xr-x)
- SSH directories: `700` (rwx------)
- authorized_keys: `600` (rw-------)
- Shared project: `2775` (rwxrwsr-x with setgid bit)

### Group Ownership
- Shared directory uses `dev-team` group
- Setgid bit ensures new files inherit group ownership
