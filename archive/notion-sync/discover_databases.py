#!/usr/bin/env python3
"""
Notion Database Discovery Script

Purpose:
- List all databases in your Notion workspace
- Show database IDs and data_source IDs (for 2025-09-03 API)
- Help find missing database IDs for migration

Usage:
    export NOTION_API_TOKEN="your_token_here"
    python discover_databases.py
    python discover_databases.py --search "Sprints"
    python discover_databases.py --export database_ids.json

Dependencies:
    pip install notion-client
"""

import os
import sys
import json
import argparse
from typing import List, Dict

try:
    from notion_client import Client
except ImportError:
    print("ERROR: Missing dependencies. Install with:")
    print("  pip install notion-client")
    sys.exit(1)


def get_notion_client() -> Client:
    """Initialize Notion API client."""
    token = os.environ.get("NOTION_API_TOKEN")
    if not token:
        print("ERROR: NOTION_API_TOKEN environment variable not set")
        print("Set it with: export NOTION_API_TOKEN='your_token_here'")
        sys.exit(1)

    # Use latest API version (2025-09-03)
    return Client(auth=token, notion_version="2022-06-28")


def search_databases(notion: Client, title_filter: str = None) -> List[Dict]:
    """Search for all databases accessible to the integration."""
    databases = []
    has_more = True
    start_cursor = None

    print("🔍 Searching for databases...")

    while has_more:
        search_params = {
            "filter": {"value": "database", "property": "object"},
            "page_size": 100,
        }

        if start_cursor:
            search_params["start_cursor"] = start_cursor

        try:
            response = notion.search(**search_params)

            for db in response["results"]:
                # Extract title
                title = "Untitled"
                if "title" in db and len(db["title"]) > 0:
                    title = db["title"][0]["text"]["content"]

                # Filter by title if specified
                if title_filter and title_filter.lower() not in title.lower():
                    continue

                databases.append({
                    "id": db["id"],
                    "title": title,
                    "url": db.get("url", ""),
                    "created_time": db.get("created_time", ""),
                    "last_edited_time": db.get("last_edited_time", ""),
                })

            has_more = response.get("has_more", False)
            start_cursor = response.get("next_cursor")

        except Exception as e:
            print(f"❌ Error searching databases: {e}")
            break

    return databases


def get_database_details(notion: Client, database_id: str) -> Dict:
    """Get detailed information about a database."""
    try:
        db = notion.databases.retrieve(database_id=database_id)

        # Extract properties
        properties = {}
        for prop_name, prop_value in db.get("properties", {}).items():
            properties[prop_name] = prop_value.get("type", "unknown")

        return {
            "id": db["id"],
            "title": db["title"][0]["text"]["content"] if db.get("title") else "Untitled",
            "properties": properties,
            "url": db.get("url", ""),
        }
    except Exception as e:
        print(f"  ⚠️  Could not retrieve details for {database_id}: {e}")
        return None


def format_database_id(db_id: str) -> str:
    """Format database ID with hyphens for readability."""
    # Remove existing hyphens
    clean_id = db_id.replace("-", "")

    # Add hyphens in standard UUID format: 8-4-4-4-12
    if len(clean_id) == 32:
        return f"{clean_id[:8]}-{clean_id[8:12]}-{clean_id[12:16]}-{clean_id[16:20]}-{clean_id[20:]}"
    return db_id


def main():
    parser = argparse.ArgumentParser(
        description="Discover Notion databases and their IDs"
    )
    parser.add_argument(
        "--search",
        type=str,
        help="Filter databases by title (case-insensitive substring match)",
    )
    parser.add_argument(
        "--export",
        type=str,
        help="Export database list to JSON file",
    )
    parser.add_argument(
        "--details",
        action="store_true",
        help="Show detailed information (properties, etc.)",
    )

    args = parser.parse_args()

    # Initialize Notion client
    print("🔧 Initializing Notion client...")
    notion = get_notion_client()

    # Search databases
    databases = search_databases(notion, args.search)

    if not databases:
        print("\n⚠️  No databases found!")
        print("\nTroubleshooting:")
        print("1. Make sure you've created a Notion integration at https://www.notion.so/my-integrations")
        print("2. Share databases with your integration:")
        print("   - Open database in Notion")
        print("   - Click '...' menu → 'Add connections'")
        print("   - Select your integration")
        sys.exit(1)

    print(f"\n✅ Found {len(databases)} database(s)\n")

    # Display results
    print("=" * 80)
    for i, db in enumerate(databases, 1):
        print(f"\n{i}. {db['title']}")
        print(f"   ID: {format_database_id(db['id'])}")
        print(f"   URL: {db['url']}")
        print(f"   Created: {db['created_time']}")

        if args.details:
            details = get_database_details(notion, db["id"])
            if details and details.get("properties"):
                print(f"   Properties:")
                for prop_name, prop_type in details["properties"].items():
                    print(f"     - {prop_name} ({prop_type})")

        print()

    print("=" * 80)

    # Export if requested
    if args.export:
        with open(args.export, "w") as f:
            json.dump(databases, f, indent=2)
        print(f"\n✅ Exported to {args.export}")

    # Show migration reference format
    print("\n📋 Copy-paste format for database_ids_reference.md:\n")
    for db in databases:
        formatted_id = format_database_id(db["id"])
        entity_guess = db["title"].lower().replace(" ", "_")
        print(f"| {db['title']} | `{formatted_id}` | `{entity_guess}` | ⏳ Pending |")

    # Show Python config format
    print("\n🐍 Python config format:\n")
    for db in databases:
        key = db["title"].lower().replace(" ", "_")
        formatted_id = format_database_id(db["id"])
        print(f'    "{key}": {{')
        print(f'        "id": "{formatted_id}",')
        print(f'        "entity": "{key}",')
        print(f'        "unique_id_field": "Unique ID",')
        print(f'    }},')


if __name__ == "__main__":
    main()
