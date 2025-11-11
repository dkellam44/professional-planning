# Docker Directory Structure Explained (For Beginners)

## 🤔 Your Confusion is 100% Normal!

You thought: "Docker container = a folder with all the files"
Reality: Docker splits things across multiple locations and orchestrates them together

**You're absolutely right** - Docker is an orchestration system that connects files from different locations!

## 📦 What Actually Happens with Docker

### The Three Layers

```
1. YOUR Configuration Files (Recipes/Blueprints)
   ↓
2. DOCKER System Files (Engine/Images/Volumes)
   ↓
3. RUNNING Container (Temporary, orchestrated)
```

Let me break each down:

## 1️⃣ Your Configuration Files (The Recipes)

**Location**: `/home/david/services/`

This is **YOUR space** where you keep the "recipes" for your services.

```
/home/david/services/
├── n8n/
│   ├── docker-compose.yml          ← Recipe/blueprint
│   ├── .env                         ← Environment variables
│   └── README.md                    ← Your notes
│
├── postgres/
│   ├── docker-compose.yml
│   ├── .env
│   └── init-scripts/                ← Custom SQL scripts
│
├── openwebui/
│   ├── docker-compose.yml
│   └── config.json                  ← Custom settings
│
└── nginx/
    ├── docker-compose.yml
    └── nginx.conf                   ← Custom Nginx config
```

**What's in docker-compose.yml?**
It's just a YAML text file that says:
- What Docker image to use
- What ports to expose
- What volumes to mount
- What environment variables to set
- What networks to create

**Think of it like a recipe card:**
```yaml
# Recipe for N8N
services:
  n8n:
    image: n8nio/n8n:latest          # ← Download this image
    ports:
      - "5678:5678"                  # ← Expose this port
    volumes:
      - n8n_data:/home/node/.n8n     # ← Save data here
    environment:
      - N8N_HOST=localhost           # ← Set these variables
```

## 2️⃣ Docker System Files (The Kitchen)

**Location**: `/var/lib/docker/`

This is **Docker's space** where it stores everything it needs to run.

```
/var/lib/docker/
├── image/                           🎨 Docker Images
│   └── overlay2/
│       ├── imagedb/
│       └── layerdb/
│       # This is where n8n, postgres, nginx base images live
│       # You almost NEVER look in here directly
│
├── volumes/                         💾 Docker Volumes (Persistent Data)
│   ├── n8n_data/
│   │   └── _data/
│   │       ├── workflows/           ← Your actual N8N workflows
│   │       └── credentials/         ← Your N8N credentials
│   │
│   ├── postgres_data/
│   │   └── _data/
│   │       └── (PostgreSQL database files)
│   │
│   └── openwebui_data/
│       └── _data/
│           └── (OpenWebUI data)
│
├── containers/                      📦 Running Containers (Temporary)
│   └── <container-id>/
│       ├── config.v2.json
│       └── logs/
│
└── networks/                        🌐 Docker Networks
    └── (network configurations)
```

### Understanding `/var/lib/docker/`

**Docker Images** (`/var/lib/docker/image/`):
- These are the "base templates"
- Like a pre-packaged application
- Read-only, shared across containers
- Downloaded from Docker Hub

**Docker Volumes** (`/var/lib/docker/volumes/`):
- This is where your **actual data** lives
- Persistent storage that survives container restarts
- Your N8N workflows, database files, configs
- **This is the important data you backup!**

**Docker Containers** (`/var/lib/docker/containers/`):
- Temporary running instances
- Created from images
- Destroyed when you `docker compose down`
- Logs and runtime state only

## 3️⃣ How It All Connects

### Example: N8N Service

```
Step-by-step when you run: docker compose up -d

1. You run command from:
   /home/david/services/n8n/
   $ docker compose up -d

2. Docker reads:
   /home/david/services/n8n/docker-compose.yml
   (This is your recipe)

3. Docker checks if image exists:
   /var/lib/docker/image/.../n8nio/n8n
   If not, downloads from Docker Hub

4. Docker creates volume (if doesn't exist):
   /var/lib/docker/volumes/n8n_data/_data/

5. Docker creates container:
   /var/lib/docker/containers/<random-id>/

6. Docker orchestrates:
   - Mounts volume into container
   - Exposes ports
   - Sets environment variables
   - Connects to networks

7. N8N runs and saves data to:
   /var/lib/docker/volumes/n8n_data/_data/
   (This is where your workflows actually live!)
```

### Visual Representation

```
┌─────────────────────────────────────────────────────────┐
│ YOUR WORKSPACE: /home/david/services/n8n/              │
│                                                         │
│  docker-compose.yml  ← You edit this                   │
│  .env                ← You edit this                   │
└────────────────┬────────────────────────────────────────┘
                 │ docker compose up -d
                 ↓
┌─────────────────────────────────────────────────────────┐
│ DOCKER ENGINE: /var/lib/docker/                        │
│                                                         │
│  ┌─────────────────────────────────────────┐          │
│  │ IMAGE: n8nio/n8n:latest                 │          │
│  │ (Read-only template)                    │          │
│  │ - OS files                              │          │
│  │ - N8N application                       │          │
│  │ - Dependencies                          │          │
│  └─────────────────────────────────────────┘          │
│                 ↓ creates                              │
│  ┌─────────────────────────────────────────┐          │
│  │ CONTAINER: n8n_container                │          │
│  │ (Temporary, running instance)           │          │
│  │ - Process running                       │          │
│  │ - Ports: 5678                           │          │
│  │ - Networks attached                     │          │
│  └─────────────────────────────────────────┘          │
│                 ↓ writes to                           │
│  ┌─────────────────────────────────────────┐          │
│  │ VOLUME: n8n_data                        │          │
│  │ /var/lib/docker/volumes/n8n_data/_data/ │          │
│  │ (Persistent storage)                    │          │
│  │ - workflows/ ← YOUR DATA LIVES HERE     │          │
│  │ - credentials/                          │          │
│  │ - settings/                             │          │
│  └─────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

## 🗂️ Linux Directory Names Explained

### `/opt/` - Optional Software
- **Stands for**: Optional or Third-party software
- **Purpose**: Manually installed applications not from package manager
- **Example**: If you download and install N8N directly (not Docker)

```
/opt/
├── n8n/                    # If installed manually (not Docker)
│   ├── bin/
│   └── lib/
│
├── custom-app/             # Your custom applications
└── third-party-tool/
```

**When to use `/opt/`**:
- Installing software from source
- Third-party applications
- Self-contained applications
- Things that don't fit in `/usr/local/`

**Note**: If using Docker, you typically DON'T use `/opt/` much, because your apps run in containers!

### `/var/` - Variable Data
- **Stands for**: Variable (data that changes frequently)
- **Purpose**: Files that are expected to grow and change
- **Contains**: Logs, databases, caches, mail, Docker data

```
/var/
├── lib/                    # Variable state information
│   ├── docker/            # ← Docker's persistent data
│   └── mysql/             # ← MySQL database files
│
├── log/                   # Log files
│   ├── nginx/
│   ├── syslog
│   └── auth.log
│
├── cache/                 # Cache files
├── tmp/                   # Temporary files
├── mail/                  # Mail data
└── www/                   # Web server files (traditional)
```

### Complete Picture

```
/
├── home/david/services/          📝 YOUR configs (recipes)
│   ├── n8n/docker-compose.yml
│   └── postgres/docker-compose.yml
│
├── var/lib/docker/               🐳 DOCKER's data
│   ├── volumes/                  💾 Your actual app data
│   ├── images/                   🎨 Downloaded images
│   └── containers/               📦 Running containers
│
├── opt/                          🏢 MANUAL installs (if not using Docker)
│   └── custom-app/               (rarely used with Docker)
│
└── var/log/                      📋 LOGS
    ├── docker/
    └── nginx/
```

## 💡 Key Insights

### 1. Separation of Concerns

```
Configuration (YOUR control):     /home/david/services/
Application (DOCKER manages):     /var/lib/docker/image/
Data (PERSISTENT):                /var/lib/docker/volumes/
Logs (DIAGNOSTIC):                /var/log/
```

### 2. Containers are Ephemeral

```bash
# Destroy container (safe - data preserved in volume)
docker compose down

# Data still exists in:
/var/lib/docker/volumes/n8n_data/_data/

# Recreate container (data automatically reconnected)
docker compose up -d
```

### 3. Docker Orchestrates

Docker is like a chef that:
1. Reads your recipe (`docker-compose.yml`)
2. Gets ingredients (downloads images)
3. Prepares kitchen (creates volumes)
4. Cooks meal (runs container)
5. Serves (exposes ports, networks)

## 📂 Practical Example: N8N Full Setup

### Your File Structure

```
/home/david/
└── services/
    └── n8n/
        ├── docker-compose.yml    ← You manage this
        └── .env                  ← You manage this
```

### docker-compose.yml Content

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n    # Named volume
      - ./custom-nodes:/home/node/custom-nodes  # Local bind mount
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
    restart: unless-stopped

volumes:
  n8n_data:  # Docker creates this in /var/lib/docker/volumes/
```

### What Docker Actually Creates

```
/var/lib/docker/
├── volumes/
│   ├── n8n_data/                          # Named volume (created by Docker)
│   │   └── _data/
│   │       ├── workflows/                 # Your actual workflows
│   │       ├── credentials/
│   │       └── database.sqlite
│   │
│   └── n8n_custom-nodes/                  # If you create another volume
│       └── _data/
│
├── containers/
│   └── abc123.../                         # Running N8N container
│       ├── config.v2.json
│       ├── hostname
│       └── logs/
│
└── image/
    └── overlay2/
        └── (n8n image layers)
```

### Bind Mount vs Named Volume

**Named Volume** (Docker manages location):
```yaml
volumes:
  - n8n_data:/home/node/.n8n
  # Creates: /var/lib/docker/volumes/n8n_data/
```

**Bind Mount** (You specify exact location):
```yaml
volumes:
  - /home/david/services/n8n/custom-nodes:/home/node/custom-nodes
  # Uses your exact path
```

## 🎯 Where Things Really Are

### N8N Example

| What | Where | Managed By | Purpose |
|------|-------|------------|---------|
| `docker-compose.yml` | `/home/david/services/n8n/` | You | Configuration |
| N8N Image | `/var/lib/docker/image/` | Docker | Base application |
| N8N Workflows | `/var/lib/docker/volumes/n8n_data/_data/` | Docker | Your data |
| Running Container | `/var/lib/docker/containers/<id>/` | Docker | Runtime |
| Logs | `/var/lib/docker/containers/<id>/logs/` | Docker | Debugging |

### PostgreSQL Example

| What | Where | Purpose |
|------|-------|---------|
| `docker-compose.yml` | `/home/david/services/postgres/` | Configuration |
| PostgreSQL Image | `/var/lib/docker/image/` | Base database |
| Database Files | `/var/lib/docker/volumes/postgres_data/_data/` | Your actual databases |
| Init Scripts | `/home/david/services/postgres/init-scripts/` | Custom SQL files |

## 🔧 Common Operations

### View Your Docker Volumes

```bash
# List all volumes
docker volume ls

# Inspect a volume (see where it is)
docker volume inspect n8n_data

# Output shows:
# "Mountpoint": "/var/lib/docker/volumes/n8n_data/_data"
```

### Access Volume Data

```bash
# You CAN access volume data directly (as root/sudo)
sudo ls -la /var/lib/docker/volumes/n8n_data/_data/

# But usually better to use docker exec
docker exec -it n8n ls /home/node/.n8n/
```

### Backup Volume Data

```bash
# Backup a volume
docker run --rm \
  -v n8n_data:/data \
  -v /home/david/backups:/backup \
  alpine tar czf /backup/n8n-backup.tar.gz /data

# Or direct copy (when container is stopped)
sudo cp -r /var/lib/docker/volumes/n8n_data/_data/ /home/david/backups/n8n/
```

### Clean Up Docker

```bash
# Remove unused images
docker image prune

# Remove unused volumes (CAREFUL! This deletes data!)
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```

## 🤔 Common Questions

### Q: Why not put everything in /home/david/?

**Answer**: You CAN using bind mounts!

```yaml
# Instead of named volume:
volumes:
  - n8n_data:/home/node/.n8n

# Use bind mount:
volumes:
  - /home/david/data/n8n:/home/node/.n8n
```

**Trade-offs**:
- Named volumes: Docker optimized, better performance
- Bind mounts: Easier to access, easier to backup

**Many people use hybrid**:
```yaml
volumes:
  - n8n_data:/home/node/.n8n              # App data (fast)
  - /home/david/services/n8n/custom-nodes:/custom  # Your files (accessible)
```

### Q: Should I ever touch /var/lib/docker/?

**Answer**: Rarely, and with caution!

```bash
# ✅ OK to look
sudo ls -la /var/lib/docker/volumes/

# ✅ OK to backup
sudo cp -r /var/lib/docker/volumes/n8n_data/_data/ /backup/

# ⚠️ Be careful editing
sudo vim /var/lib/docker/volumes/n8n_data/_data/config.json

# ❌ Never delete while container running
sudo rm -rf /var/lib/docker/volumes/n8n_data/  # DANGEROUS!
```

### Q: What about /opt/ - do I need it with Docker?

**Answer**: Usually no, unless mixing Docker + manual installs.

**Scenario 1 - All Docker** (most common):
```
/home/david/services/          ← Your docker-compose files
/var/lib/docker/volumes/       ← Your data
(No need for /opt/)
```

**Scenario 2 - Mixed approach**:
```
/home/david/services/n8n/      ← N8N via Docker
/opt/custom-python-app/        ← Custom app installed manually
```

**Scenario 3 - No Docker**:
```
/opt/n8n/                      ← N8N installed from source
/opt/postgres/                 ← PostgreSQL installed manually
(Not recommended for beginners!)
```

### Q: Where are MCP servers?

**Answer**: Depends on how you install them!

**If Docker**:
```
/home/david/services/mcp-server/
├── docker-compose.yml
└── config/

Data in: /var/lib/docker/volumes/mcp_data/
```

**If Installed via npm/pip**:
```
/home/david/.local/share/mcp/        # User install
or
/opt/mcp/                            # System install
```

**If Agent User**:
```
/home/agent-automation/mcp/
└── servers/
```

## 🎓 Mental Model

Think of Docker like this:

```
1. docker-compose.yml = Recipe card (you write this)
2. Docker Image = Pre-made meal kit (Docker downloads)
3. Container = Cooking the meal (Docker runs)
4. Volume = Leftovers container (Docker stores data)
5. You = Chef who orchestrates everything
```

**You control**:
- Recipes (`docker-compose.yml`)
- Which meal kits to use (`image: n8nio/n8n`)
- How to prepare (`environment`, `ports`)

**Docker controls**:
- Where ingredients stored (`/var/lib/docker/`)
- Cooking process (running containers)
- Cleaning up (removing stopped containers)

## 📚 Summary

| Directory | Purpose | Example | You Edit? |
|-----------|---------|---------|-----------|
| `/home/david/services/` | Docker compose configs | `docker-compose.yml` | ✅ Yes |
| `/var/lib/docker/volumes/` | Persistent app data | N8N workflows | ⚠️ Rarely |
| `/var/lib/docker/images/` | Downloaded images | N8N base image | ❌ No |
| `/var/lib/docker/containers/` | Running containers | Live N8N process | ❌ No |
| `/opt/` | Manual installs | Non-Docker apps | ✅ Yes (if used) |
| `/var/log/` | Log files | Application logs | 👀 Read only |

**Key Takeaway**: Docker splits things up for good reasons:
- **Config** (your control) separate from **data** (persistent) separate from **runtime** (temporary)
- You mostly work in `/home/david/services/`
- Docker mostly works in `/var/lib/docker/`
- They connect via docker-compose orchestration

---

**Does this clear it up?** Docker's separation can be confusing at first, but it makes sense once you understand Docker is orchestrating multiple pieces together!
