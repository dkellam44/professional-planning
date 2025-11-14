# n8n Integration — SoT Sync
- entity: portfolio
- level: integration
- zone: internal
- version: v0.2
- tags: [n8n, automation, integrations, sot]
- source_path: /integrations/n8n/README.md
- date: 2025-10-17

---

## Contract Overview
- **Flow 1 (GitHub → Coda)**: Triggered by `.github/workflows/validate_data.yml`. After validation, the workflow calls an n8n webhook with commit metadata; n8n fetches updated docs/templates and PATCHes Coda tables/docs so execution surfaces stay current.
- **Flow 2 (Coda → GitHub)**: Triggered by Coda automations when templates/process docs change. n8n receives the webhook, renders markdown/JSON, and uses GitHub CLI/API (`gh pr create`) to open/update PRs in branches prefixed `chore/sot-auto-sync/`.

## Secrets & Configuration
- `N8N_WEBHOOK_URL` GitHub secret (for Flow 1).
- Coda API token stored in n8n credentials (never committed).
- GitHub PAT/CLI token with `repo` scope stored in n8n credentials.

## Deliverables
- Flow exports (JSON) stored under `integrations/n8n/flows/`:
  - `github_to_coda_sync.json` — webhook endpoint for GitHub Action → Coda updates.
  - `coda_to_github_sync.json` — webhook endpoint for Coda automations → GitHub PRs.
- Audit logs appended to `logs/context_actions.csv`.

## Configuration Steps
1. Import both flow JSON files into n8n and set the timezone to `America/Los_Angeles` (already encoded in the export).
2. Attach credentials:
   - **Coda API** (OAuth or token) for the “Update Coda Docs” node.
   - **GitHub PAT/GitHub App** with `repo` scope for the HTTP nodes in the Coda → GitHub flow.
   - **Slack webhook** (optional) or remove the notification node.
3. Update the webhook URLs (under n8n settings) so they align with Cloudflare/Access routing, e.g. `https://n8n.tools.bestviable.com/webhook/github-to-coda`.
4. In the GitHub → Coda flow, ensure incoming payloads include `documents[]` objects with `tableId`, `rows`, `summary`, and `path`. Adjust the Function node if you introduce additional metadata.
5. In the Coda → GitHub flow, confirm metadata includes `entityId`, `path`, and `baseSha`. Defaults for `repo` (`davidkellam/professional-planning`) and `baseBranch` (`main`) can be overridden per event.
6. Enable Cloudflare Access or HMAC verification on both webhooks before going live.

## Required Secrets
- `N8N_WEBHOOK_URL` — GitHub repository secret pointing to the GitHub → n8n webhook (used by `.github/workflows/validate_data.yml`).
- `CODA_API_TOKEN` (stored inside n8n credentials) — grants write access to the DK Enterprise OS doc.
- `GITHUB_SYNC_TOKEN` (or equivalent) — PAT/App credentials for n8n to commit/PR.
- Optional: `SLACK_WEBHOOK_URL` if you keep the Slack notification node.

## Mapping & Columns
- GitHub Action payloads classify files by prefix (`templates/`, `architecture/`, `ops/runbooks/`, etc.) and set a `tableHint` consumed by the `Shape Payload` function in the GitHub → Coda flow. Adjust the classification logic (`validate_data.yml`) and the hint → table map inside the flow if you add new directories.
- The `Prepare Rows` function maps table IDs to Coda column names (`Source Path`, `Template Markdown`, etc.). Update these column names to match the actual columns in your Coda tables before enabling the flow.
- If a table requires additional metadata (e.g., tags, version), extend the `rows` structure to include extra cells.

## Coda Targets
- Doc ID (`Founder HQ`): `CxcSmXz318`
- Common tables to sync  
  | Purpose | Table | ID |
  |---------|-------|----|
  | Resource templates | `DB Resource Templates` | `grid-v4BEeA-eq1` |
  | Service blueprints | `DB Service Blueprints` | `grid-pgL9kxkhKI` |
  | Process templates | `DB Process Templates` | `grid-6ZlgsRtZO7` |
  | Workflows | `DB Workflows` | `grid-BccTVdgIEo` |
  | Deliverables / assets | `DB Assets` | `grid-aprrpKni50` |

Refer to `coda_table_ids.txt` for the complete table list exported from Coda.

## Failure Handling
- Reference `ops/runbooks/sot_troubleshooting_v0_2.md` for diagnostic steps.
- All failed executions should notify the ops channel with execution URL and payload summary.

## Notes
- GitHub remains the documentation SoT; every Coda-originated change returns as a PR for review.
- Keep flows idempotent so reruns do not duplicate updates.
