- entity: decision
- level: architecture
- zone: internal
- version: v01
- tags: [infrastructure, repo, restructuring]
- source_path: /agents/decisions/2025-10-30_portfolio-infrastructure-restructure_v01.md
- date: 2025-10-30
-
- status: accepted
- supersedes: []

# ADR: Portfolio Infrastructure Restructure

## Context

Operational assets (docker-compose files, Dockerfiles, deployment scripts) lived under `/docs/ops/`, mixing executable infrastructure with documentation. Local builds were fragile, README referenced outdated paths, and the droplet used a different directory layout. This created confusion for agents, made sync operations brittle, and risked drift between local and remote environments.

## Decision

1. **Create `/infra/` at the portfolio root** for all executable infrastructure assets (compose files, Dockerfiles, scripts, env templates), mirroring the droplet.
2. **Move documentation-only artifacts into `/docs/`** (`docs/infrastructure/deployment/`, `docs/runbooks/`, `docs/quality_gates/`).
3. **Rename ambiguous directories** for clarity:
   - `y_collection_box` → `sessions/`
   - `inbox` → `planning/`
   - `z_archive` → `archive/`
   - `business_model` → `docs/business/`
4. **Update README and supporting docs** to describe the new structure and deployment workflow.
5. **Add infrastructure utilities** (`infra/scripts/`) and a canonical env template (`infra/config/.env.example`).
6. **Create a temporary symlink `docs/ops → ../infra/docker`** for backwards compatibility until all downstream references are updated (planned removal by 2025-11-15).

## Consequences

### Positive
- Local and remote repositories now share the same layout, simplifying syncs and reducing mistakes.
- README/onboarding docs match reality, lowering cognitive load for new contributors.
- Infrastructure assets are isolated from documentation, following industry best practices.
- Local docker builds work without path hacks (`context: ../..`).
- Directory names (`sessions/`, `planning/`, `archive/`) now reflect their purpose.

### Negative / Follow-ups
- Need to update any scripts, docs, or automations still referencing `/docs/ops/` before removing the symlink.
- Partners must pull/merge before deploying new infrastructure.
- Monitor for tooling that assumed previous directory names.

## Status

Accepted and implemented 2025-10-30. Remove the compatibility symlink after confirming no tooling depends on it (target 2025-11-15).

## Related Documents
- `README.md`
- `docs/infrastructure/deployment/PRODUCTION_DEPLOYMENT_QUICKSTART.md`
- `infra/docker/docker-compose.production.yml`
- `infra/config/.env.example`

