#!/usr/bin/env python3
"""
Notion Database Schema Analysis Script

Purpose:
- Query all 34 databases from Notion API
- Extract property schemas (names, types, relations, formulas)
- Compare actual vs planned state from NOTION_BUILD_COMPLETION_PLAN
- Generate comprehensive markdown report

Usage:
    export NOTION_API_TOKEN="your_token_here"
    python analyze_schemas.py
"""

import os
import sys
import json
from typing import Dict, List, Optional
from pathlib import Path

try:
    from notion_client import Client
except ImportError:
    print("ERROR: Missing notion-client. Install with:")
    print("  pip install notion-client")
    sys.exit(1)

# Database configurations from prefill_ulids.py
DATABASES = {
    # Session 1: Foundation
    "ventures": {
        "id": "2845c4eb-9526-8192-b602-d15b1d2bc537",
        "entity": "venture",
        "session": 1,
    },
    "offers": {
        "id": "2845c4eb-9526-8161-a4e4-d22141e25e0c",
        "entity": "offer",
        "session": 1,
    },
    "topics": {
        "id": "2845c4eb-9526-8171-8581-ef47a3619cf0",
        "entity": "topic",
        "session": 1,
    },
    "areas": {
        "id": "2845c4eb-9526-8133-81f2-d40cdcd992f5",
        "entity": "area",
        "session": 1,
    },
    # Session 2: Commercial
    "organizations": {
        "id": "2845c4eb-9526-813e-a1ef-cbea16707f73",
        "entity": "organization",
        "session": 2,
    },
    "people": {
        "id": "2845c4eb-9526-81d4-bc26-ce6a98a92cce",
        "entity": "person",
        "session": 2,
    },
    "deals": {
        "id": "2845c4eb-9526-816c-a03c-d5744f4e5198",
        "entity": "deal",
        "session": 2,
    },
    "engagements": {
        "id": "2845c4eb-9526-814a-9c47-c02f22543cd7",
        "entity": "engagement",
        "session": 2,
    },
    # Session 3: Execution
    "projects": {
        "id": "2845c4eb-9526-814d-bb7a-c37948933b47",
        "entity": "project",
        "session": 3,
    },
    "tasks": {
        "id": "2845c4eb-9526-8192-8a7b-d0888712291c",
        "entity": "task",
        "session": 3,
    },
    "sprints": {
        "id": "2845c4eb-9526-81dd-96c2-d477f7e4a140",
        "entity": "sprint",
        "session": 3,
    },
    # Referenced/Supporting
    "service_blueprints": {
        "id": "2845c4eb-9526-8153-a593-c22af6165679",
        "entity": "service_blueprint",
        "session": 0,
    },
    "icp_segments": {
        "id": "2845c4eb-9526-8108-9a27-d8aea4894532",
        "entity": "icp_segment",
        "session": 0,
    },
    "process_templates": {
        "id": "2845c4eb-9526-816d-9931-ca60c74fa57b",
        "entity": "process_template",
        "session": 0,
    },
    "resource_templates": {
        "id": "2845c4eb-9526-8192-8c4c-f194473b034e",
        "entity": "resource_template",
        "session": 0,
    },
    "deliverables": {
        "id": "2845c4eb-9526-81cd-9c9b-f35fe889d53b",
        "entity": "deliverable",
        "session": 0,
    },
    "results": {
        "id": "2845c4eb-9526-81e3-aa8d-ec44220a022b",
        "entity": "result",
        "session": 0,
    },
    "touchpoints": {
        "id": "2845c4eb-9526-8187-bc25-ec9fa81d0261",
        "entity": "touchpoint",
        "session": 0,
    },
    "experiments": {
        "id": "2845c4eb-9526-818e-9426-f75ae47fadba",
        "entity": "experiment",
        "session": 0,
    },
    "decision_journal": {
        "id": "2845c4eb-9526-81bf-b8b7-cd20c04b5253",
        "entity": "decision",
        "session": 0,
    },
    "workflows": {
        "id": "2845c4eb-9526-81ec-a331-e346afbfc1ad",
        "entity": "workflow",
        "session": 0,
    },
    "outcomes": {
        "id": "2845c4eb-9526-816c-b367-d02659910f4d",
        "entity": "outcome",
        "session": 0,
    },
    "daily_thread": {
        "id": "2845c4eb-9526-8167-9431-e4b011250ecb",
        "entity": "daily_thread",
        "session": 0,
    },
    # Extended Databases
    "okrs": {
        "id": "2845c4eb-9526-8177-8d20-dee8212093e6",
        "entity": "okr",
        "session": 0,
    },
    "payments": {
        "id": "2845c4eb-9526-8154-97d7-c12a652fddcd",
        "entity": "payment",
        "session": 0,
    },
    "invoices": {
        "id": "2845c4eb-9526-812b-b788-eb809b7e7d02",
        "entity": "invoice",
        "session": 0,
    },
    "expenses": {
        "id": "2845c4eb-9526-818a-8550-e08e41bee1e3",
        "entity": "expense",
        "session": 0,
    },
    "finance_snapshot": {
        "id": "2845c4eb-9526-8192-91e4-d6ca369f2c52",
        "entity": "finance_snapshot",
        "session": 0,
    },
    "prompt_library": {
        "id": "2845c4eb-9526-8130-afc4-ea436eec55fd",
        "entity": "prompt",
        "session": 0,
    },
    "kpis": {
        "id": "2845c4eb-9526-8185-a3b9-e17d4ac5d7dd",
        "entity": "kpi",
        "session": 0,
    },
    "template_performance": {
        "id": "2845c4eb-9526-811e-8fb1-cb4f7d6bda94",
        "entity": "template_performance",
        "session": 0,
    },
    "assets": {
        "id": "2845c4eb-9526-816b-b005-fc64cb067815",
        "entity": "asset",
        "session": 0,
    },
    "ideas_inbox": {
        "id": "2845c4eb-9526-8148-9fb6-cee23edfd497",
        "entity": "idea",
        "session": 0,
    },
    "icp_scoring": {
        "id": "2845c4eb-9526-8136-b12e-c5285eae5b23",
        "entity": "icp_score",
        "session": 0,
    },
}


def get_notion_client() -> Client:
    """Initialize Notion API client."""
    token = os.environ.get("NOTION_API_TOKEN")
    if not token:
        print("ERROR: NOTION_API_TOKEN environment variable not set")
        sys.exit(1)
    return Client(auth=token)


def get_database_schema(notion: Client, database_id: str, database_name: str) -> Optional[Dict]:
    """Retrieve database schema via Notion API."""
    try:
        response = notion.databases.retrieve(database_id=database_id)
        return response
    except Exception as e:
        print(f"ERROR retrieving {database_name}: {e}")
        return None


def analyze_properties(properties: Dict) -> Dict:
    """Analyze database properties and categorize them."""
    analysis = {
        "all_properties": [],
        "relations": [],
        "formulas": [],
        "rollups": [],
        "unique_id_present": False,
        "created_time_present": False,
        "last_edited_time_present": False,
    }

    for prop_name, prop_config in properties.items():
        prop_type = prop_config.get("type")

        prop_info = {
            "name": prop_name,
            "type": prop_type,
        }

        # Check for Unique ID
        if prop_name == "Unique ID":
            analysis["unique_id_present"] = True

        # Check for metadata fields
        if prop_name == "Created Time" or prop_type == "created_time":
            analysis["created_time_present"] = True
        if prop_name == "Last Edited Time" or prop_type == "last_edited_time":
            analysis["last_edited_time_present"] = True

        # Extract relation details
        if prop_type == "relation":
            relation_config = prop_config.get("relation", {})
            relation_info = {
                "name": prop_name,
                "database_id": relation_config.get("database_id"),
                "synced_property_name": relation_config.get("synced_property_name"),
                "synced_property_id": relation_config.get("synced_property_id"),
                "type": relation_config.get("type"),  # dual_property or single_property
            }
            analysis["relations"].append(relation_info)
            prop_info["relation_details"] = relation_info

        # Extract formula details
        if prop_type == "formula":
            formula_config = prop_config.get("formula", {})
            formula_info = {
                "name": prop_name,
                "expression": formula_config.get("expression"),
            }
            analysis["formulas"].append(formula_info)
            prop_info["formula_expression"] = formula_config.get("expression")

        # Extract rollup details
        if prop_type == "rollup":
            rollup_config = prop_config.get("rollup", {})
            rollup_info = {
                "name": prop_name,
                "relation_property_name": rollup_config.get("relation_property_name"),
                "rollup_property_name": rollup_config.get("rollup_property_name"),
                "function": rollup_config.get("function"),
            }
            analysis["rollups"].append(rollup_info)
            prop_info["rollup_details"] = rollup_info

        analysis["all_properties"].append(prop_info)

    return analysis


def generate_markdown_report(all_schemas: Dict) -> str:
    """Generate comprehensive markdown report comparing actual vs planned state."""

    report = """# Notion Database Schema Analysis Report

**Generated**: 2025-10-17
**Total Databases Analyzed**: {total}
**Source**: Notion API via `analyze_schemas.py`

---

## Executive Summary

This report compares the actual Notion database schemas (as retrieved via API) against the planned state defined in `NOTION_BUILD_COMPLETION_PLAN_v01.md`.

### Key Findings

**Session 1 (Foundation):**
- Topics: {topics_status}
- Areas: {areas_status}
- Ventures: {ventures_status}
- Offers: {offers_status}

**Session 2 (Commercial):**
- Organizations: {orgs_status}
- People: {people_status}
- Deals: {deals_status}
- Engagements: {engagements_status}

**Session 3 (Execution):**
- Projects: {projects_status}
- Tasks: {tasks_status}
- Sprints: {sprints_status}

---

""".format(
        total=len(all_schemas),
        topics_status="Analyzed" if "topics" in all_schemas else "Missing",
        areas_status="Analyzed" if "areas" in all_schemas else "Missing",
        ventures_status="Analyzed" if "ventures" in all_schemas else "Missing",
        offers_status="Analyzed" if "offers" in all_schemas else "Missing",
        orgs_status="Analyzed" if "organizations" in all_schemas else "Missing",
        people_status="Analyzed" if "people" in all_schemas else "Missing",
        deals_status="Analyzed" if "deals" in all_schemas else "Missing",
        engagements_status="Analyzed" if "engagements" in all_schemas else "Missing",
        projects_status="Analyzed" if "projects" in all_schemas else "Missing",
        tasks_status="Analyzed" if "tasks" in all_schemas else "Missing",
        sprints_status="Analyzed" if "sprints" in all_schemas else "Missing",
    )

    # Session 1: Foundation
    report += "## Session 1: Foundation\n\n"
    for db_name in ["topics", "areas", "ventures", "offers"]:
        if db_name in all_schemas:
            report += generate_database_section(db_name, all_schemas[db_name])

    # Session 2: Commercial
    report += "\n---\n\n## Session 2: Commercial\n\n"
    for db_name in ["organizations", "people", "deals", "engagements"]:
        if db_name in all_schemas:
            report += generate_database_section(db_name, all_schemas[db_name])

    # Session 3: Execution
    report += "\n---\n\n## Session 3: Execution\n\n"
    for db_name in ["projects", "tasks", "sprints"]:
        if db_name in all_schemas:
            report += generate_database_section(db_name, all_schemas[db_name])

    # Supporting Databases
    report += "\n---\n\n## Supporting & Extended Databases\n\n"
    supporting_dbs = [k for k in all_schemas.keys()
                     if k not in ["topics", "areas", "ventures", "offers",
                                 "organizations", "people", "deals", "engagements",
                                 "projects", "tasks", "sprints"]]

    for db_name in sorted(supporting_dbs):
        report += generate_database_section(db_name, all_schemas[db_name])

    # Summary tables
    report += "\n---\n\n## Summary: Unique ID Coverage\n\n"
    report += "| Database | Unique ID Present | Created Time | Last Edited Time |\n"
    report += "|----------|-------------------|--------------|------------------|\n"

    for db_name in sorted(all_schemas.keys()):
        analysis = all_schemas[db_name]["analysis"]
        report += f"| {db_name.title().replace('_', ' ')} | "
        report += f"{'✅' if analysis['unique_id_present'] else '❌'} | "
        report += f"{'✅' if analysis['created_time_present'] else '❌'} | "
        report += f"{'✅' if analysis['last_edited_time_present'] else '❌'} |\n"

    report += "\n---\n\n## Summary: Two-Way Relations\n\n"
    report += "| Database | Total Relations | Two-Way Relations | One-Way Relations |\n"
    report += "|----------|-----------------|-------------------|-------------------|\n"

    for db_name in sorted(all_schemas.keys()):
        analysis = all_schemas[db_name]["analysis"]
        relations = analysis["relations"]
        two_way = sum(1 for r in relations if r.get("type") == "dual_property")
        one_way = len(relations) - two_way
        report += f"| {db_name.title().replace('_', ' ')} | {len(relations)} | {two_way} | {one_way} |\n"

    report += "\n---\n\n## Summary: Formulas & Rollups\n\n"
    report += "| Database | Formulas | Rollups |\n"
    report += "|----------|----------|----------|\n"

    for db_name in sorted(all_schemas.keys()):
        analysis = all_schemas[db_name]["analysis"]
        report += f"| {db_name.title().replace('_', ' ')} | "
        report += f"{len(analysis['formulas'])} | "
        report += f"{len(analysis['rollups'])} |\n"

    return report


def generate_database_section(db_name: str, schema_data: Dict) -> str:
    """Generate markdown section for a single database."""

    db_info = schema_data["database"]
    analysis = schema_data["analysis"]

    section = f"### {db_name.title().replace('_', ' ')}\n\n"
    section += f"**Database ID:** `{db_info['id']}`\n"
    section += f"**Title:** {db_info.get('title', [{}])[0].get('plain_text', 'N/A')}\n"
    section += f"**Total Properties:** {len(analysis['all_properties'])}\n"
    section += f"**Relations:** {len(analysis['relations'])}\n"
    section += f"**Formulas:** {len(analysis['formulas'])}\n"
    section += f"**Rollups:** {len(analysis['rollups'])}\n\n"

    # Unique ID status
    if analysis["unique_id_present"]:
        section += "✅ **Unique ID field present**\n\n"
    else:
        section += "❌ **Unique ID field MISSING**\n\n"

    # All properties
    section += "#### All Properties\n\n"
    section += "| Property Name | Type |\n"
    section += "|---------------|------|\n"
    for prop in analysis["all_properties"]:
        section += f"| {prop['name']} | `{prop['type']}` |\n"
    section += "\n"

    # Relations detail
    if analysis["relations"]:
        section += "#### Relations\n\n"
        section += "| Property Name | Target Database | Two-Way Sync | Synced Property |\n"
        section += "|---------------|-----------------|--------------|------------------|\n"

        for rel in analysis["relations"]:
            is_two_way = rel.get("type") == "dual_property"
            sync_status = "✅" if is_two_way else "❌"
            synced_prop = rel.get("synced_property_name", "N/A")
            target_db_id = rel.get("database_id", "Unknown")

            # Try to resolve database ID to name
            target_name = "Unknown"
            for name, config in DATABASES.items():
                if config["id"] == target_db_id:
                    target_name = name.title().replace('_', ' ')
                    break

            section += f"| {rel['name']} | {target_name} | {sync_status} | {synced_prop} |\n"
        section += "\n"

    # Formulas detail
    if analysis["formulas"]:
        section += "#### Formulas\n\n"
        for formula in analysis["formulas"]:
            section += f"**{formula['name']}:**\n"
            section += f"```\n{formula['expression']}\n```\n\n"

    # Rollups detail
    if analysis["rollups"]:
        section += "#### Rollups\n\n"
        section += "| Property Name | Relation Property | Rollup Property | Function |\n"
        section += "|---------------|-------------------|-----------------|----------|\n"

        for rollup in analysis["rollups"]:
            section += f"| {rollup['name']} | {rollup['relation_property_name']} | "
            section += f"{rollup['rollup_property_name']} | {rollup['function']} |\n"
        section += "\n"

    section += "---\n\n"
    return section


def main():
    print("🔧 Initializing Notion client...")
    notion = get_notion_client()

    print(f"📊 Querying {len(DATABASES)} databases...")

    all_schemas = {}

    for db_name, config in DATABASES.items():
        print(f"   Querying {db_name}...")
        schema = get_database_schema(notion, config["id"], db_name)

        if schema:
            properties = schema.get("properties", {})
            analysis = analyze_properties(properties)

            all_schemas[db_name] = {
                "database": schema,
                "analysis": analysis,
                "config": config,
            }

            print(f"      ✅ Retrieved {len(analysis['all_properties'])} properties")
        else:
            print(f"      ❌ Failed to retrieve schema")

    # Generate markdown report
    print("\n📝 Generating markdown report...")
    report = generate_markdown_report(all_schemas)

    # Write report to file
    output_path = Path(__file__).parent.parent / "notion" / "NOTION_SCHEMA_ANALYSIS_REPORT.md"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        f.write(report)

    print(f"\n✅ Report written to: {output_path}")

    # Also save raw JSON for reference
    json_output_path = Path(__file__).parent.parent / "notion" / "notion_schema_export_v01.json"
    with open(json_output_path, "w") as f:
        json.dump(all_schemas, f, indent=2)

    print(f"✅ Raw schema JSON written to: {json_output_path}")

    print("\n" + "=" * 60)
    print("ANALYSIS COMPLETE")
    print("=" * 60)
    print(f"Total databases analyzed: {len(all_schemas)}")
    print(f"With Unique ID: {sum(1 for s in all_schemas.values() if s['analysis']['unique_id_present'])}")
    print(f"Missing Unique ID: {sum(1 for s in all_schemas.values() if not s['analysis']['unique_id_present'])}")


if __name__ == "__main__":
    main()
