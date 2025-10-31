#!/usr/bin/env python3
"""
ULID Backfill Script for Notion Databases

Purpose:
- Generate ULIDs for all Notion records with empty "Unique ID" fields
- Ensures stable, lexicographically sortable IDs for sync with Portfolio SoT
- Idempotent: safe to run multiple times (only fills empty fields)

Usage:
    export NOTION_API_TOKEN="your_token_here"
    python prefill_ulids.py --databases ventures offers projects
    python prefill_ulids.py --all  # Process all configured databases
    python prefill_ulids.py --dry-run --all  # Preview changes without writing

Dependencies:
    pip install notion-client python-ulid pyyaml
"""

import os
import sys
import csv
import yaml
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Optional

try:
    from notion_client import Client
    from ulid import ULID
except ImportError:
    print("ERROR: Missing dependencies. Install with:")
    print("  pip install notion-client python-ulid pyyaml")
    sys.exit(1)


# Configuration
REPO_ROOT = Path(__file__).parent.parent.parent
CONFIG_PATH = REPO_ROOT / "integrations/notion-sync/config.yaml"
LOG_PATH = REPO_ROOT / "logs/context_actions.csv"

# Database configurations with IDs
# Core Migration Databases (23)
DATABASES = {
    # Session 1: Foundation
    "ventures": {
        "id": "2845c4eb-9526-8192-b602-d15b1d2bc537",
        "entity": "venture",
        "unique_id_field": "Unique ID",
    },
    "offers": {
        "id": "2845c4eb-9526-8161-a4e4-d22141e25e0c",
        "entity": "offer",
        "unique_id_field": "Unique ID",
    },
    "topics": {
        "id": "2845c4eb-9526-8171-8581-ef47a3619cf0",
        "entity": "topic",
        "unique_id_field": "Unique ID",
    },
    "areas": {
        "id": "2845c4eb-9526-8133-81f2-d40cdcd992f5",
        "entity": "area",
        "unique_id_field": "Unique ID",
    },
    # Session 2: Commercial
    "organizations": {
        "id": "2845c4eb-9526-813e-a1ef-cbea16707f73",
        "entity": "organization",
        "unique_id_field": "Unique ID",
    },
    "people": {
        "id": "2845c4eb-9526-81d4-bc26-ce6a98a92cce",
        "entity": "person",
        "unique_id_field": "Unique ID",
    },
    "deals": {
        "id": "2845c4eb-9526-816c-a03c-d5744f4e5198",
        "entity": "deal",
        "unique_id_field": "Unique ID",
    },
    "engagements": {
        "id": "2845c4eb-9526-814a-9c47-c02f22543cd7",
        "entity": "engagement",
        "unique_id_field": "Unique ID",
    },
    # Session 3: Execution
    "projects": {
        "id": "2845c4eb-9526-814d-bb7a-c37948933b47",
        "entity": "project",
        "unique_id_field": "Unique ID",
    },
    "tasks": {
        "id": "2845c4eb-9526-8192-8a7b-d0888712291c",
        "entity": "task",
        "unique_id_field": "Unique ID",
    },
    "sprints": {
        "id": "2845c4eb-9526-81dd-96c2-d477f7e4a140",
        "entity": "sprint",
        "unique_id_field": "Unique ID",
    },
    # Referenced/Supporting
    "service_blueprints": {
        "id": "2845c4eb-9526-8153-a593-c22af6165679",
        "entity": "service_blueprint",
        "unique_id_field": "Unique ID",
    },
    "icp_segments": {
        "id": "2845c4eb-9526-8108-9a27-d8aea4894532",
        "entity": "icp_segment",
        "unique_id_field": "Unique ID",
    },
    "process_templates": {
        "id": "2845c4eb-9526-816d-9931-ca60c74fa57b",
        "entity": "process_template",
        "unique_id_field": "Unique ID",
    },
    "resource_templates": {
        "id": "2845c4eb-9526-8192-8c4c-f194473b034e",
        "entity": "resource_template",
        "unique_id_field": "Unique ID",
    },
    "deliverables": {
        "id": "2845c4eb-9526-81cd-9c9b-f35fe889d53b",
        "entity": "deliverable",
        "unique_id_field": "Unique ID",
    },
    "results": {
        "id": "2845c4eb-9526-81e3-aa8d-ec44220a022b",
        "entity": "result",
        "unique_id_field": "Unique ID",
    },
    "touchpoints": {
        "id": "2845c4eb-9526-8187-bc25-ec9fa81d0261",
        "entity": "touchpoint",
        "unique_id_field": "Unique ID",
    },
    "experiments": {
        "id": "2845c4eb-9526-818e-9426-f75ae47fadba",
        "entity": "experiment",
        "unique_id_field": "Unique ID",
    },
    "decision_journal": {
        "id": "2845c4eb-9526-81bf-b8b7-cd20c04b5253",
        "entity": "decision",
        "unique_id_field": "Unique ID",
    },
    "workflows": {
        "id": "2845c4eb-9526-81ec-a331-e346afbfc1ad",
        "entity": "workflow",
        "unique_id_field": "Unique ID",
    },
    "outcomes": {
        "id": "2845c4eb-9526-816c-b367-d02659910f4d",
        "entity": "outcome",
        "unique_id_field": "Unique ID",
    },
    "daily_thread": {
        "id": "2845c4eb-9526-8167-9431-e4b011250ecb",
        "entity": "daily_thread",
        "unique_id_field": "Unique ID",
    },
    # Extended Databases (11)
    "okrs": {
        "id": "2845c4eb-9526-8177-8d20-dee8212093e6",
        "entity": "okr",
        "unique_id_field": "Unique ID",
    },
    "payments": {
        "id": "2845c4eb-9526-8154-97d7-c12a652fddcd",
        "entity": "payment",
        "unique_id_field": "Unique ID",
    },
    "invoices": {
        "id": "2845c4eb-9526-812b-b788-eb809b7e7d02",
        "entity": "invoice",
        "unique_id_field": "Unique ID",
    },
    "expenses": {
        "id": "2845c4eb-9526-818a-8550-e08e41bee1e3",
        "entity": "expense",
        "unique_id_field": "Unique ID",
    },
    "finance_snapshot": {
        "id": "2845c4eb-9526-8192-91e4-d6ca369f2c52",
        "entity": "finance_snapshot",
        "unique_id_field": "Unique ID",
    },
    "prompt_library": {
        "id": "2845c4eb-9526-8130-afc4-ea436eec55fd",
        "entity": "prompt",
        "unique_id_field": "Unique ID",
    },
    "kpis": {
        "id": "2845c4eb-9526-8185-a3b9-e17d4ac5d7dd",
        "entity": "kpi",
        "unique_id_field": "Unique ID",
    },
    "template_performance": {
        "id": "2845c4eb-9526-811e-8fb1-cb4f7d6bda94",
        "entity": "template_performance",
        "unique_id_field": "Unique ID",
    },
    "assets": {
        "id": "2845c4eb-9526-816b-b005-fc64cb067815",
        "entity": "asset",
        "unique_id_field": "Unique ID",
    },
    "ideas_inbox": {
        "id": "2845c4eb-9526-8148-9fb6-cee23edfd497",
        "entity": "idea",
        "unique_id_field": "Unique ID",
    },
    "icp_scoring": {
        "id": "2845c4eb-9526-8136-b12e-c5285eae5b23",
        "entity": "icp_score",
        "unique_id_field": "Unique ID",
    },
}


def get_notion_client() -> Client:
    """Initialize Notion API client."""
    token = os.environ.get("NOTION_API_TOKEN")
    if not token:
        print("ERROR: NOTION_API_TOKEN environment variable not set")
        print("Set it with: export NOTION_API_TOKEN='your_token_here'")
        sys.exit(1)
    return Client(auth=token)


def get_empty_unique_id_pages(
    notion: Client, database_id: str, unique_id_field: str
) -> List[Dict]:
    """Query database for pages with empty Unique ID field."""
    pages_with_empty_id = []
    has_more = True
    start_cursor = None

    while has_more:
        query_params = {"database_id": database_id, "page_size": 100}
        if start_cursor:
            query_params["start_cursor"] = start_cursor

        response = notion.databases.query(**query_params)

        for page in response["results"]:
            properties = page["properties"]

            # Check if Unique ID field exists
            if unique_id_field not in properties:
                print(f"  ⚠️  Page {page['id']} missing '{unique_id_field}' field")
                continue

            # Check if Unique ID is empty
            unique_id_prop = properties[unique_id_field]

            # Handle different field types
            is_empty = False
            if unique_id_prop["type"] == "rich_text":
                is_empty = len(unique_id_prop["rich_text"]) == 0
            elif unique_id_prop["type"] == "title":
                is_empty = len(unique_id_prop["title"]) == 0

            if is_empty:
                pages_with_empty_id.append(page)

        has_more = response["has_more"]
        start_cursor = response.get("next_cursor")

    return pages_with_empty_id


def generate_ulid() -> str:
    """Generate a new ULID."""
    return str(ULID())


def update_page_with_ulid(
    notion: Client, page_id: str, unique_id_field: str, ulid: str, dry_run: bool = False
) -> bool:
    """Update page with generated ULID."""
    if dry_run:
        print(f"  [DRY RUN] Would set {unique_id_field} = {ulid} for page {page_id}")
        return True

    try:
        notion.pages.update(
            page_id=page_id,
            properties={
                unique_id_field: {"rich_text": [{"text": {"content": ulid}}]}
            },
        )
        return True
    except Exception as e:
        print(f"  ❌ Failed to update page {page_id}: {e}")
        return False


def log_action(database_name: str, entity: str, success_count: int, total_count: int):
    """Log backfill action to context_actions.csv."""
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Check if log file exists and has header
    file_exists = LOG_PATH.exists()

    with open(LOG_PATH, "a", newline="") as f:
        writer = csv.writer(f)

        # Write header if new file
        if not file_exists:
            writer.writerow([
                "ts",
                "agent",
                "action",
                "entity",
                "path",
                "latency_ms",
                "token_in",
                "token_out",
                "success",
                "notes",
            ])

        # Write log entry
        writer.writerow([
            datetime.now(timezone.utc).isoformat(),
            "prefill_ulids_v01",
            "ulid_backfill",
            entity,
            f"/integrations/notion-sync/prefill_ulids.py",
            0,  # latency not measured for bulk operations
            0,  # token counts not applicable
            0,
            success_count == total_count,
            f"{success_count}/{total_count} records updated in {database_name}",
        ])


def process_database(
    notion: Client, database_name: str, config: Dict, dry_run: bool = False
) -> Dict:
    """Process a single database to backfill ULIDs."""
    print(f"\n🔍 Processing database: {database_name}")
    print(f"   Entity: {config['entity']}")
    print(f"   Database ID: {config['id']}")
    print(f"   Unique ID Field: {config['unique_id_field']}")

    # Get pages with empty Unique ID
    print(f"   Querying for empty '{config['unique_id_field']}' fields...")
    empty_pages = get_empty_unique_id_pages(
        notion, config["id"], config["unique_id_field"]
    )

    if not empty_pages:
        print("   ✅ No pages found with empty Unique ID (all set!)")
        return {"total": 0, "updated": 0, "failed": 0}

    print(f"   Found {len(empty_pages)} pages with empty Unique ID")

    # Update pages
    updated_count = 0
    failed_count = 0

    for i, page in enumerate(empty_pages, 1):
        ulid = generate_ulid()
        page_id = page["id"]

        # Get page title for better logging
        title = "Untitled"
        for prop_name, prop_value in page["properties"].items():
            if prop_value["type"] == "title" and len(prop_value["title"]) > 0:
                title = prop_value["title"][0]["text"]["content"]
                break

        print(f"   [{i}/{len(empty_pages)}] {title} ({page_id})")

        success = update_page_with_ulid(
            notion, page_id, config["unique_id_field"], ulid, dry_run
        )

        if success:
            updated_count += 1
            print(f"      ✅ Set Unique ID = {ulid}")
        else:
            failed_count += 1

    # Log results
    if not dry_run:
        log_action(database_name, config["entity"], updated_count, len(empty_pages))

    print(f"\n   Summary: {updated_count} updated, {failed_count} failed")

    return {
        "total": len(empty_pages),
        "updated": updated_count,
        "failed": failed_count,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Backfill ULIDs for Notion database records"
    )
    parser.add_argument(
        "--databases",
        nargs="+",
        choices=list(DATABASES.keys()),
        help="Specific databases to process (space-separated)",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all configured databases",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without writing to Notion",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available databases and exit",
    )

    args = parser.parse_args()

    # Handle --list
    if args.list:
        print("Available databases:")
        for name, config in DATABASES.items():
            print(f"  - {name} ({config['entity']})")
        sys.exit(0)

    # Determine which databases to process
    if args.all:
        databases_to_process = list(DATABASES.keys())
    elif args.databases:
        databases_to_process = args.databases
    else:
        print("ERROR: Must specify --databases or --all")
        print("Use --list to see available databases")
        sys.exit(1)

    # Initialize Notion client
    print("🔧 Initializing Notion client...")
    notion = get_notion_client()

    # Process databases
    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be written\n")

    total_stats = {"total": 0, "updated": 0, "failed": 0}

    for db_name in databases_to_process:
        if db_name not in DATABASES:
            print(f"❌ Unknown database: {db_name}")
            continue

        stats = process_database(notion, db_name, DATABASES[db_name], args.dry_run)
        total_stats["total"] += stats["total"]
        total_stats["updated"] += stats["updated"]
        total_stats["failed"] += stats["failed"]

    # Final summary
    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    print(f"Total pages processed: {total_stats['total']}")
    print(f"Successfully updated: {total_stats['updated']}")
    print(f"Failed: {total_stats['failed']}")

    if args.dry_run:
        print("\n⚠️  This was a dry run. Re-run without --dry-run to apply changes.")
    else:
        print(f"\n✅ Log written to: {LOG_PATH}")

    # Exit with error code if any failures
    if total_stats["failed"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
