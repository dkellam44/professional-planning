# SoT v0.2 Integration — Learning Primer
- entity: learning-module
- level: documentation
- zone: internal
- version: v0.1
- tags: [learning, sot, automation, github, coda, n8n]
- source_path: /docs/LEARNING_SOT_SYNC_PRIMER_v0_1.md
- date: 2025-10-25

---

## Purpose
Provide a beginner-friendly orientation to the infrastructure work completed during the SoT v0.2 integration so a future tutor can design lesson plans on APIs, automation, and systems integration.

## Key Concepts & Why They Matter
| Concept | What It Is | How It Shows Up Here |
|---------|------------|----------------------|
| Source of Truth (SoT) | The authoritative location for a type of information. | GitHub stores all versioned documentation; Coda holds live operational state. |
| Git / GitHub | Version control system + hosted repo service. | Stores docs, runs GitHub Actions, receives PRs from automations. |
| GitHub Actions | CI/CD platform that runs workflows on repo events. | Validates `data/*.jsonl`, then notifies n8n for downstream sync. |
| JSON / JSONL Schema Validation | Ensures structured data matches an agreed format. | Python `jsonschema` checks data before syncing to operational systems. |
| Webhooks | HTTP callbacks triggered by events. | GitHub Action posts to n8n; Coda automations call n8n to start GitHub PR flow. |
| n8n | Low-code automation/orchestration platform. | Hosts bidirectional flows (`github_to_coda_sync.json`, `coda_to_github_sync.json`). |
| Coda API | REST interface for Coda docs/tables. | n8n updates Coda templates and reads execution state for commit payloads. |
| GitHub REST API / CLI | Programmatic ways to interact with repos. | n8n opens branches, commits, and PRs when Coda changes occur. |
| MCP Gateway | Model Context Protocol proxy for tools. | Lets agents access Coda live data while referencing GitHub docs. |
| Cloudflare Tunnel + Access | Secure exposure of internal services. | Publishes MCP/n8n endpoints with identity enforcement. |

## Workflow Summary
1. **Authoritative Docs in GitHub**  
   - Docs/templates live in repo and change via commits/PRs.
   - GitHub Action validates structured data after each push.
2. **GitHub → Coda Automation**  
   - Action POSTs run metadata (changed paths, repo info) to n8n (`N8N_WEBHOOK_URL`).  
   - n8n classifies each file, resolves the target Coda table, fetches file content from GitHub, and updates matching Coda rows/docs.
3. **Coda → GitHub Automation**  
   - Coda automation webhook hits n8n with changed content.  
   - n8n renders markdown, creates a `chore/sot-auto-sync/*` branch, commits, and opens a PR.
4. **Audit & Authority**  
   - `sot/authority_map_v0_2.json` guides which system can edit which fields.  
   - Logs recorded in `logs/context_actions.csv` for traceability.

## Foundational Skills to Study
- Git basics (commits, branches, pull requests).
- YAML + GitHub Actions workflow syntax.
- REST APIs: authentication, JSON payloads, rate limits.
- Webhook design: request payloads, retry logic, security (signatures/tokens).
- n8n flow building: triggers, function nodes, HTTP requests, credentials.
- Data validation: JSON Schema, error handling.
- Secrets management for automation (GitHub secrets, environment variables).
- Cloud networking fundamentals (reverse tunnels, access control).

## Suggested Learning Sequence
1. **Version Control & Collaboration** — Understand Git fundamentals before automating.
2. **CI/CD Basics** — Learn how GitHub Actions orchestration works.
3. **APIs & Webhooks** — Practice building simple POST/GET flows, then add auth.
4. **n8n Projects** — Build a small flow (e.g., webhook → API call) to internalize the interface.
5. **Coda & GitHub API Usage** — Explore endpoints needed for syncing documents.
6. **Security & Observability** — Study secrets handling and logging strategies.

## Session Notes (2025-10-25)
- GitHub Actions now derives changed-path metadata and classifies docs to drive Coda table mapping.
- n8n flow scaffolding fetches GitHub file contents, maps them to Coda columns, and updates doc `CxcSmXz318`.
- Configuration checklist added for secrets (Coda/GitHub tokens, `N8N_WEBHOOK_URL`) and webhook hardening (Cloudflare Access or HMAC).

## Open Questions for Deeper Study
- How to best test n8n flows (unit vs. integration) before production?
- Patterns for handling merge conflicts when Coda and GitHub change the same doc simultaneously.
- Strategies for rate limiting / exponential backoff in webhook-driven systems.
- Approaches to diff visualization for automated PRs.

---
Use this primer as a starting point for designing tutoring modules that break down each concept with examples, hands-on labs, and references back to the SoT implementation.

## Docker Fundamentals

This section provides a brief overview of key Docker concepts.

### What is Docker?

Docker is a platform that allows you to develop, ship, and run applications in isolated environments called containers. This ensures that your application works consistently across different machines, from your local computer to a production server.

### Key Concepts

*   **Daemon:** A daemon is a program that runs in the background, rather than being under the direct control of a user. The Docker daemon (`dockerd`) is the service that manages all your Docker objects, including images, containers, networks, and volumes. When you use the `docker` command-line tool, you are interacting with the Docker daemon. On macOS and Windows, the Docker daemon is typically started automatically when you launch Docker Desktop.

*   **Container:** A container is a runnable instance of an image. It is a lightweight, standalone, and executable package that includes everything needed to run a piece of software, including the code, a runtime, libraries, environment variables, and config files.

*   **Image:** An image is a read-only template with instructions for creating a Docker container. Images are often based on other images, with some additional customization. For example, you might build an image that starts with an Ubuntu image, then installs the Apache web server and your application.

*   **Dockerfile:** A Dockerfile is a text document that contains all the commands a user could call on the command line to assemble an image. `docker build` uses this file to create a new image.

*   **Docker Compose:** Docker Compose is a tool for defining and running multi-container Docker applications. With Compose, you use a YAML file (like the `docker-compose.example.yml` in this repository) to configure your application's services. Then, with a single command, you can create and start all the services from your configuration.

## Learning Opportunities (2025-10-26)

Our troubleshooting session for the MCP infrastructure has highlighted several areas that would be beneficial to study:

*   **Docker & Docker Compose**:
    *   Understanding the difference between `docker run` and `docker-compose up`.
    *   How to read `docker ps` output to check container status (running, exited, restarting).
    *   How to inspect container logs with `docker logs` to debug issues.
    *   The purpose of a `.env` file for managing secrets like API keys.
    *   How to define services, images, commands, and environment variables in a `docker-compose.yml` file.

*   **Docker Images & Registries**:
    *   The concept of Docker images and tags (e.g., `:latest`).
    *   The difference between public and private image registries.
    *   How to authenticate with a private registry using `docker login` and Personal Access Tokens (PATs).

*   **Networking in Docker Compose**:
    *   How services in the same `docker-compose.yml` file can communicate with each other by service name.
    *   The difference between exposed ports and published ports.

*   **Cloudflare Tunnels**:
    *   How a Cloudflare Tunnel can securely expose a local service (like our Dockerized MCP server) to the internet.
    *   How to configure a tunnel to point to a specific service and port.

*   **MCP (Model Context Protocol)**:
    *   The difference between stdio-based and HTTP-based MCP servers.
    *   How an MCP gateway/proxy works.
