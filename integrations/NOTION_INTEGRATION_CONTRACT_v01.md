# Notion Integration Contract (v01)

## Purpose
Define how Founder HQ in Notion maps to the portfolio Source of Truth (SoT) in files, including IDs, tables, fields, sync direction, and conflict rules.

## Scope
Databases covered (fill db_ids):
- Ventures (db_id: ___)
- Offers (db_id: ___)
- Engagements (db_id: ___)
- Programs (db_id: ___)
- Projects (db_id: ___)
- Sprints (db_id: ___)
- Tasks (db_id: ___)
- Deliverables (db_id: ___)
- Areas (db_id: ___)
- Campaigns (db_id: ___)
- Experiments (db_id: ___)
- Learning Units (db_id: ___)
- Environment/Platforms (db_id: ___)

## Source of Truth & Directionality
- Primary SoT: repository files (`/sot/context_schemas_v02.yaml`).
- Projection: Notion mirrors SoT for viewing and editing **whitelisted operational fields**.
- Sync model:
  - **Structure** (entities/props): one-way SoT → Notion.
  - **Data**: two-way only for fields explicitly whitelisted below.

## IDs
- Global primary key: **ULID** (string) generated in the repo/automation.
- Each Notion record MUST include property `ulid` (text).
- Keep `notion_page_id` as a secondary identifier.
- Maintain a mapping table `/integrations/notion_id_map.csv`.

## Field Mapping (examples; extend per entity)
- Engagement: client_name, dates, fee, acceptance_criteria, repo_path
- Project: name, status, deadline, engagement_ulid OR program_ulid, repo_path
- Deliverable: name, acceptance_tests, reviewer, repo_path
- Offer: name, tiers[], scope_in[], scope_out[], sla, repo_path
- Program: name, milestones[], dependencies[], repo_path

## Two-Way Fields (whitelist)
- status, notes, current_owner, next_due_date
_All other fields: SoT → Notion (one-way)._

## Relationships
- Relations in Notion MUST be backed by ULIDs (e.g., a Project keeps `engagement_ulid` text in addition to a Notion relation).

## Sync Windows & Frequency
- Structure sync: manual or weekly.
- Data sync: hourly or on demand.

## Conflict Resolution
- Canonical fields: **SoT wins**.
- Whitelisted operational fields: **latest edit timestamp wins**, with audit note.
- Missing ULID on a Notion page triggers assignment and backfill to mapping.

## Audit & Logging
- Log every sync to `/logs/context_actions.csv` with `action=notion_sync`.
- Write deltas to `/logs/notion_deltas/{timestamp}.json` (optional).

## Security & Zones
- Respect zones: `public | internal | private | restricted`.
- Records marked `restricted` are not pushed to Notion unless the target db is equivalently restricted.

## Acceptance
- All Notion dbs contain a `ulid` property.
- 100% of records backfilled with ULIDs.
- Mapping coverage ≥ 95% of SoT required fields.
