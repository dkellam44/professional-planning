<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

---

## Environment Quick Reference

**Local Development**
- Location: `/Users/davidkellam/workspace/portfolio/`
- Purpose: Git repo, development, spec authoring
- Builds: `docker build`, `docker-compose up` (testing only)
- Edits: All changes made here before deployment

**Droplet Production**
- Hostname: `tools-droplet-agents` or `droplet`
- SSH: `ssh droplet` (connects as `david@159.65.97.146`)
- Services: `/home/david/services/` (docker-compose files, containers)
- Reference: `/home/david/portfolio/` (docs, workflows, source code copies)
- Deployment: SCP docker files, `docker-compose up -d`

**Critical Paths**
| Item | Local | Droplet |
|------|-------|---------|
| Deployments | service-builds/ | ~/services/ |
| Docs | docs/system/sops/ | ~/portfolio/docs/ |
| SSH | ~/.ssh/config | /home/david/.ssh/ |
| Secrets | .env (local only) | ~/services/*/.env |

**Reverse Proxy**
- Current: **Traefik v3.0** (HTTP-only, port 80)
- Networking: `docker_proxy` network
- Labels: `traefik.enable=true`, `traefik.http.routers.*` patterns
- Deprecated: nginx-proxy, acme-companion (removed 2025-11-13)

**Key Docs**
- Deployment: `/docs/system/sops/SERVICE_DEPLOYMENT_GUIDE.md` (Traefik section)
- Inventory: `/docs/system/architecture/SERVICE_INVENTORY.md` (current state)
- SOPs: `/docs/system/sops/` (operations guides)
- Architecture: `/openspec/project.md` (system overview)

<user details>
Note: David, the user, is a beginner to programming so when in dialog with the user, provide brief explanations without slowing progress. Be explicit about file paths and commands.
</user details>