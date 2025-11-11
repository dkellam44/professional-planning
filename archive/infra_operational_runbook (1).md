# Infrastructure Operational Runbook (Updated with n8n Integration)

**Author:** David Kellam\
**Date:** 2025-10-21\
**Document Type:** Operations Runbook\
**Related Files:** `infra_systems_summary.md`, `/infra/docs/dns-setup.md`, `/infra/n8n/docker-compose.yml`

---

## 1. Purpose

This runbook defines operational workflows and learning pathways for maintaining and extending the infrastructure that powers the **n8n automation environment**, **MCP Gateway**, and **Cloudflare-managed public access endpoints**.

It now supports:

- **Production deployment** of `n8n.bestviable.com` on DigitalOcean with Caddy-managed SSL via Let's Encrypt.
- **Container orchestration** via Docker Compose with persistent data volumes.
- **Interoperability** with AI context systems, MCP Gateway, and automation pipelines.

---

## 2. Active Capabilities Overview

| Service                           | Description                                               | Key Components                                               |
| --------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| **n8n (Automation Orchestrator)** | Low-code workflow automation and API integration system.  | Docker, PostgreSQL, Caddy Reverse Proxy, Cloudflare DNS.     |
| **MCP Gateway**                   | Local multi-connector runtime for AI context integration. | MCP Servers (Coda, GitHub, Notion, Filesystem).              |
| **Caddy Reverse Proxy**           | Handles SSL termination and reverse proxying.             | Auto-renewing Let's Encrypt certificates.                    |
| **Cloudflare DNS + Tunnel**       | Secure public access for internal services.               | DNS entries for `bestviable.com` and subdomains.             |
| **DigitalOcean Droplet**          | Persistent cloud host for all Docker services.            | Ubuntu 24.04, Docker Engine, Compose, systemctl supervision. |

---

## 3. Daily Operations Checklist

| Task                     | Command / Action                                            | Notes                                              |
| ------------------------ | ----------------------------------------------------------- | -------------------------------------------------- |
| **Check System Status**  | `docker ps`                                                 | Ensure `n8n`, `caddy`, and `postgres` are running. |
| **Access n8n Dashboard** | `https://n8n.bestviable.com`                                | Verify UI is accessible via SSL.                   |
| **Check Caddy Logs**     | `docker compose logs -f caddy`                              | Confirm certificate renewals and proxy health.     |
| **Backup n8n Data**      | `docker exec -t n8n pg_dumpall -c -U postgres > backup.sql` | Weekly recommended.                                |
| **Update Images**        | `docker compose pull && docker compose up -d`               | Keeps all containers current.                      |
| **Healthcheck**          | `curl -I https://n8n.bestviable.com`                        | Expect `HTTP/2 200`.                               |

---

## 4. Infrastructure Layout

```
/root/infra/
 ├── n8n/
 │   ├── docker-compose.yml
 │   ├── .env
 │   ├── Caddyfile
 │   ├── data/
 │   ├── postgres_data/
 │   └── logs/
 ├── gateway/
 │   ├── docker-compose.yml
 │   └── configs/
 └── backups/
     └── n8n/
```

---

## 5. Cloudflare & SSL Configuration

- **DNS Mode:** “DNS Only” is acceptable — Caddy handles TLS issuance directly from Let's Encrypt.
- **Proxy (Orange Cloud):** Optional, but not required since Caddy manages certificates.
- **Auto-Renewal:** Caddy auto-renews within 30 days of expiration.

Verify certificate status:

```bash
docker compose exec caddy caddy list-certificates
```

If issues arise, clear cache and reload:

```bash
docker compose exec caddy sh -lc 'rm -rf /data/caddy/certificates/*'
docker compose restart caddy
```

---

## 6. Integration with AI Context Systems

n8n now acts as the **automation bridge** between local infrastructure and AI workflows.

**Connected Context Systems:**

- **MCP Gateway:** Enables bi-directional access to Notion, Coda, GitHub, and Filesystem connectors.
- **AI Assistants:** Can trigger or receive workflow runs via API (e.g., `/webhook/ai-events`).
- **Planned Integrations:**
  - Slack / Discord webhook triggers
  - File ingestion pipelines
  - Context sync between Founder HQ and n8n database

**Example Use Cases:**

- Auto-sync daily Founder HQ task exports → Coda → AI summarization.
- Trigger email or Slack notifications on system state change.
- Automatically archive weekly logs and Docker stats.

---

## 7. Learning and Development Goals

**Immediate Goals:**

- Understand Docker networking and volumes.
- Learn n8n credential handling and webhook management.
- Automate system health reporting with n8n workflows.

**Intermediate Goals:**

- Integrate MCP Gateway workflows into n8n for context ingestion.
- Deploy n8n sub-workflows for data syncing (Coda ↔ Notion ↔ Google Drive).

**Advanced Goals:**

- Build AI-augmented orchestration: “Ops Copilot” that uses LLMs to read logs, check health, and trigger recovery scripts.

**Learning Resources:**

- n8n Docs → [https://docs.n8n.io](https://docs.n8n.io)
- Docker Mastery (Udemy)
- Cloudflare Zero Trust Guide
- MCP Gateway Specification & CLI usage examples

---

## 8. Automation Roadmap

| Milestone   | Objective                               | Toolchain                         |
| ----------- | --------------------------------------- | --------------------------------- |
| **Phase 1** | Deploy n8n on droplet (✅ Completed)     | Docker Compose, Caddy, Cloudflare |
| **Phase 2** | Link n8n with MCP Gateway               | REST API, Webhooks                |
| **Phase 3** | Add context ingestion workflows         | Coda, Notion, GitHub APIs         |
| **Phase 4** | Automate monitoring and backup routines | Cron, n8n triggers                |
| **Phase 5** | Deploy centralized Ops Dashboard        | Coda or Notion with synced data   |

---

## 9. Operational Summary

**n8n Status:** Running at `https://n8n.bestviable.com`\
**SSL:** Active via Caddy + Let’s Encrypt\
**DNS:** Managed by Cloudflare (DNS-only mode)\
**Host:** DigitalOcean (Ubuntu 24.04, 2GB RAM)\
**Operator:** David Kellam

System now serves as the **automation backbone** for future ventures (Ops Studio, Digital Case Worker, and Founder HQ). It provides a **programmable layer** for integrating AI context systems, automating workflows, and scaling operational intelligence across projects.

---

**End of Updated Runbook**

