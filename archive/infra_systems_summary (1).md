# Infrastructure & MCP Gateway Setup Summary (Handoff Notes)

**Author:** David Kellam\
**Date:** 2025-10-19\
**Document Type:** System Configuration Summary\
**Location:** `/infra/docs/dns-setup.md` (suggested) or `/infra/docs/infra-overview.md`

---

## 1. Overview

This document summarizes the systems configuration work completed in October 2025 related to setting up a local + cloud hybrid infrastructure for AI tooling and agent orchestration. It is written as a handoff or onboarding guide for a new operator or automation agent assuming maintenance or expansion responsibilities.

---

## 2. Core Goals

- Establish a **self-hosted infrastructure foundation** to support future AI agents, web applications, and data automation workflows.
- Configure **secure connectivity** between local development environments, cloud servers, and external services.
- Deploy a **Docker MCP Gateway** to serve multiple MCP (Model Context Protocol) servers via a single unified endpoint.
- Expose the gateway securely over the internet via **Cloudflare Tunnel**, with DNS managed by Namecheap and Cloudflare.

---

## 3. Major Components

### 3.1 Local Development Environment

- **Host:** macOS (MacBook Pro)
- **Primary directories (subject to confirmation):**
  - `~/workspace/infra/mcp/coda/coda-mcp/` → cloned Coda MCP repo
  - `~/workspace/infra/gateway/` → Docker MCP Gateway configuration and compose files
  - `~/.cloudflared/` → Cloudflare Tunnel configuration and credentials
- **Node.js:** v22.14.0
- **Package manager:** pnpm (used for Coda MCP build)
- **Docker:** Installed and configured locally for container orchestration

### 3.2 Docker MCP Gateway

The MCP Gateway acts as a **unified access layer** that proxies requests from ChatGPT (or other MCP clients) to registered MCP servers.

- **Base image:** `docker/mcp-gateway:latest`
- **Configuration path:** `workspace/infra/gateway/docker-compose.yml`
- **Default exposed port:** 8080
- **Network:** Docker internal network `gateway_default`
- **Persistent issues resolved:** Daemon access, catalog initialization, OAuth disablement
- **OAuth:** Not enabled (intentionally omitted for early-stage local testing)

#### Gateway Behavior

- Reads from Docker MCP catalog at runtime.
- Supports live addition of servers via `docker mcp server enable <id>`.
- Communicates via standard I/O (STDIO) and HTTP (SSE transport).

### 3.3 Cloudflare Tunnel + DNS Integration

Cloudflare Tunnel enables secure public access to local services without directly exposing ports.

- **Registrar:** Namecheap (domain: `bestviable.com`)
- **DNS host:** Cloudflare (manages all subdomains and CNAME records)
- **Tunnel type:** Token-based (Option A)
- **Tunnel target:** `http://localhost:8080`
- **Hostname:** `tools.bestviable.com`

#### Status

- Verified tunnel creation and token connection.
- DNS record confirmed with Cloudflare (`CNAME` → active routing via Cloudflare edge).
- Verified with:
  ```bash
  curl -I https://tools.bestviable.com/
  ```
  returning `HTTP/2 200` or `404` indicates success; `502` suggests inactive local service.

#### MX Record

- Added MX entry for root domain:\
  `@ → mx1.bestviable.com (priority 0)`
- Pending validation; may require email service configuration (to be confirmed).

---

## 4. System Operation Flow

### 4.1 Local → Gateway → Tunnel → External

```text
ChatGPT → tools.bestviable.com (Cloudflare Edge)
    ↓
Cloudflare Tunnel (Token Auth)
    ↓
localhost:8080 (Docker MCP Gateway)
    ↓
Enabled MCP Servers (e.g., Coda, GitHub, Notion)
```

### 4.2 Key Ports and Network Flow

| Component         | Protocol    | Port                   | Purpose                    |
| ----------------- | ----------- | ---------------------- | -------------------------- |
| MCP Gateway       | HTTP/SSE    | 8080                   | MCP request routing        |
| Cloudflare Tunnel | HTTPS       | 443                    | Secure external access     |
| Docker Daemon     | UNIX socket | `/var/run/docker.sock` | Local container management |

---

## 5. Security Notes

- **OAuth:** Disabled for testing; Access Policies recommended for production.
- **Cloudflare Access:** Can later add Google/SSO enforcement per subdomain.
- **API keys:** Stored securely via `docker mcp secret set <id> KEY value`.
- **TLS:** Managed automatically by Cloudflare.

---

## 6. Next Steps (For Successor Operator)

1. **Verify Local Docker Daemon:**

   ```bash
   docker info
   ```

   Ensure Docker Desktop is running.

2. **Start Gateway:**

   ```bash
   docker mcp gateway run --port 8080 --transport sse
   ```

3. **Run Cloudflare Tunnel:**

   ```bash
   cloudflared tunnel run --token <YOUR_TUNNEL_TOKEN>
   ```

4. **Test Connectivity:**

   ```bash
   curl -I https://tools.bestviable.com/
   ```

5. **Add MCP Servers:**

   - Create catalog YAMLs under `~/.docker/mcp/catalogs/`
   - Example (Coda):
     ```yaml
     apiVersion: v1
     kind: Server
     metadata:
       id: coda
       title: Coda
       description: MCP server for Coda
     spec:
       transport: stdio
       runtime:
         type: docker
         image: acuvity/mcp-server-coda:1.1.2
         env:
           - API_KEY
     ```
     ```bash
     docker mcp catalog add personal coda ~/.docker/mcp/catalogs/coda.yaml
     docker mcp server enable coda
     docker mcp secret set coda API_KEY "YOUR_CODA_API_KEY"
     ```

6. **(Optional) Cloud Deployment:**

   - Provision a DigitalOcean droplet (Ubuntu 22.04 LTS).
   - Assign a reserved IP (optional for production).
   - Reuse Cloudflare Tunnel for remote access or install a dedicated connector.

---

## 7. Outstanding Issues / To‑Do

-

---

## 8. References & Logs

- **Docker Compose Logs:** `workspace/infra/gateway/docker-compose.yml`
- **Cloudflare Tunnel Config:** `~/.cloudflared/config.yml`
- **Coda MCP Repo:** `workspace/infra/mcp/coda/coda-mcp/`
- **Primary Commands:**
  ```bash
  docker compose up -d
  docker compose logs -f
  docker mcp server list
  docker mcp tools ls
  cloudflared tunnel run --token <TOKEN>
  curl -I https://tools.bestviable.com/
  ```

---

## 9. Summary

This setup establishes a functioning hybrid infrastructure:

- **Local Docker MCP Gateway** serving as a unified tool interface.
- **Cloudflare Tunnel** securely bridging localhost to a public subdomain.
- **DNS routing** handled by Cloudflare, Namecheap serving as registrar.
- **Ready for expansion** to additional servers (Coda, Notion, GitHub, etc.).

Once stable, this foundation will serve as the core for distributed AI agent operations, workflow automation, and future app hosting under the `bestviable.com` domain.

