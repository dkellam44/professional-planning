#!/usr/bin/env python3
"""
Notion Test Record Verification Script

Purpose:
- Verify test records exist with correct ULIDs
- Validate two-way relations are properly configured
- Check formula calculations match expected values
- Generate evaluation report for sync integration readiness

Usage:
    export NOTION_API_TOKEN="your_token_here"
    python verify_test_records.py
    python verify_test_records.py --detailed  # Show all property values
    python verify_test_records.py --export    # Export test records to JSON

Dependencies:
    pip install notion-client python-ulid
"""

import os
import sys
import json
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from pathlib import Path

try:
    from notion_client import Client
    from ulid import ULID
except ImportError:
    print("ERROR: Missing dependencies. Install with:")
    print("  pip install notion-client python-ulid")
    sys.exit(1)


# Configuration
REPO_ROOT = Path(__file__).parent.parent.parent
DATABASE_IDS = {
    "ventures": "2845c4eb-9526-8192-b602-d15b1d2bc537",
    "offers": "2845c4eb-9526-8161-a4e4-d22141e25e0c",
    "engagements": "2845c4eb-9526-814a-9c47-c02f22543cd7",
    "projects": "2845c4eb-9526-814d-bb7a-c37948933b47",
    "tasks": "2845c4eb-9526-8192-8a7b-d0888712291c",
    "sprints": "2845c4eb-9526-81dd-96c2-d477f7e4a140",
    "organizations": "2845c4eb-9526-813e-a1ef-cbea16707f73",
    "people": "2845c4eb-9526-81d4-bc26-ce6a98a92cce",
    "deals": "2845c4eb-9526-816c-a03c-d5744f4e5198",
}

TEST_RECORD_NAMES = {
    "ventures": "TEST-SYNC-VENTURE-001",
    "offers": "TEST-SYNC-OFFER-001",
    "engagements": "TEST-SYNC-ENGAGEMENT-001",
    "projects": "TEST-SYNC-PROJECT-001",
    "tasks": ["TEST-SYNC-TASK-001-BILLABLE", "TEST-SYNC-TASK-002-LEARNING"],
    "sprints": "TEST-2025-W42",
    "organizations": "TEST-SYNC-ORG-001",
    "people": "TEST-SYNC-PERSON-001",
    "deals": "TEST-SYNC-DEAL-001",
}


def get_notion_client() -> Client:
    """Initialize Notion API client."""
    token = os.environ.get("NOTION_API_TOKEN")
    if not token:
        print("ERROR: NOTION_API_TOKEN environment variable not set")
        print("Set it with: export NOTION_API_TOKEN='your_token_here'")
        sys.exit(1)
    return Client(auth=token)


def get_page_title(page: Dict) -> str:
    """Extract title from page properties."""
    for prop_name, prop_value in page["properties"].items():
        if prop_value["type"] == "title":
            if len(prop_value["title"]) > 0:
                return prop_value["title"][0]["text"]["content"]
    return "Untitled"


def get_property_value(page: Dict, property_name: str) -> Optional[str]:
    """Extract property value from page."""
    if property_name not in page["properties"]:
        return None

    prop = page["properties"][property_name]
    prop_type = prop["type"]

    if prop_type == "rich_text":
        if len(prop["rich_text"]) > 0:
            return prop["rich_text"][0]["text"]["content"]
    elif prop_type == "number":
        return prop["number"]
    elif prop_type == "select":
        if prop["select"]:
            return prop["select"]["name"]
    elif prop_type == "checkbox":
        return prop["checkbox"]
    elif prop_type == "relation":
        return len(prop["relation"])
    elif prop_type == "formula":
        formula_value = prop["formula"]
        if formula_value["type"] == "number":
            return formula_value["number"]
        elif formula_value["type"] == "string":
            return formula_value["string"]
        elif formula_value["type"] == "boolean":
            return formula_value["boolean"]

    return None


def find_test_record(notion: Client, database_name: str, record_name: str) -> Optional[Dict]:
    """Find a test record by name in a database."""
    database_id = DATABASE_IDS.get(database_name)
    if not database_id:
        return None

    results = notion.databases.query(database_id=database_id)

    for page in results["results"]:
        title = get_page_title(page)
        if title == record_name:
            return page

    return None


def verify_ulid(page: Dict) -> Tuple[bool, Optional[str]]:
    """Verify page has a valid ULID in Unique ID field."""
    unique_id = get_property_value(page, "Unique ID")

    if not unique_id:
        return False, None

    # ULID format: 26 characters, base32
    if len(unique_id) != 26:
        return False, unique_id

    # Try to parse as ULID
    try:
        ULID.from_str(unique_id)
        return True, unique_id
    except:
        return False, unique_id


def verify_relation(notion: Client, page: Dict, relation_property: str, expected_target: str) -> Tuple[bool, str]:
    """Verify a relation property points to expected target."""
    if relation_property not in page["properties"]:
        return False, f"Relation property '{relation_property}' not found"

    prop = page["properties"][relation_property]
    if prop["type"] != "relation":
        return False, f"Property '{relation_property}' is not a relation (type: {prop['type']})"

    relations = prop["relation"]
    if len(relations) == 0:
        return False, f"No relations found in '{relation_property}'"

    # Get first related page
    related_page_id = relations[0]["id"]

    try:
        related_page = notion.pages.retrieve(page_id=related_page_id)
        related_title = get_page_title(related_page)

        if related_title == expected_target:
            return True, f"✓ Points to {expected_target}"
        else:
            return False, f"Points to '{related_title}', expected '{expected_target}'"
    except Exception as e:
        return False, f"Failed to retrieve related page: {e}"


def verify_formula(page: Dict, formula_property: str, expected_value: float, tolerance: float = 0.01) -> Tuple[bool, str]:
    """Verify a formula property calculates to expected value."""
    actual_value = get_property_value(page, formula_property)

    if actual_value is None:
        return False, f"Formula '{formula_property}' returned None"

    if isinstance(expected_value, bool):
        if actual_value == expected_value:
            return True, f"✓ {actual_value}"
        else:
            return False, f"Expected {expected_value}, got {actual_value}"

    if abs(actual_value - expected_value) <= tolerance:
        return True, f"✓ {actual_value}"
    else:
        return False, f"Expected {expected_value}, got {actual_value}"


def main():
    print("🔍 Notion Test Record Verification")
    print("=" * 60)

    # Initialize client
    notion = get_notion_client()

    # Track results
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    issues = []

    # Test Critical Path 1: Business Operations
    print("\n📊 CRITICAL PATH 1: Business Operations Flow")
    print("-" * 60)

    # 1. Find Venture
    print("\n1. Verifying TEST-SYNC-VENTURE-001...")
    venture = find_test_record(notion, "ventures", TEST_RECORD_NAMES["ventures"])
    if venture:
        print("   ✅ Found venture")
        ulid_valid, ulid = verify_ulid(venture)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid or missing: {ulid}")
            failed_tests += 1
            issues.append(("Venture", "ULID", "Invalid or missing ULID"))
    else:
        print("   ❌ Venture not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Venture", "Existence", "Test record not found"))

    # 2. Find Offer
    print("\n2. Verifying TEST-SYNC-OFFER-001...")
    offer = find_test_record(notion, "offers", TEST_RECORD_NAMES["offers"])
    if offer:
        print("   ✅ Found offer")
        ulid_valid, ulid = verify_ulid(offer)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Offer", "ULID", "Invalid ULID"))

        # Verify Venture relation
        if venture:
            total_tests += 1
            relation_valid, msg = verify_relation(notion, offer, "Venture", TEST_RECORD_NAMES["ventures"])
            if relation_valid:
                print(f"   ✅ Venture relation: {msg}")
                passed_tests += 1
            else:
                print(f"   ❌ Venture relation: {msg}")
                failed_tests += 1
                issues.append(("Offer", "Venture Relation", msg))

        # Verify Margin formula
        total_tests += 1
        formula_valid, msg = verify_formula(offer, "Margin", 6000.0)
        if formula_valid:
            print(f"   ✅ Margin formula: {msg}")
            passed_tests += 1
        else:
            print(f"   ❌ Margin formula: {msg}")
            failed_tests += 1
            issues.append(("Offer", "Margin Formula", msg))
    else:
        print("   ❌ Offer not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Offer", "Existence", "Test record not found"))

    # 3. Find Engagement
    print("\n3. Verifying TEST-SYNC-ENGAGEMENT-001...")
    engagement = find_test_record(notion, "engagements", TEST_RECORD_NAMES["engagements"])
    if engagement:
        print("   ✅ Found engagement")
        ulid_valid, ulid = verify_ulid(engagement)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Engagement", "ULID", "Invalid ULID"))

        # Verify Offer relation
        if offer:
            total_tests += 1
            relation_valid, msg = verify_relation(notion, engagement, "Offer", TEST_RECORD_NAMES["offers"])
            if relation_valid:
                print(f"   ✅ Offer relation: {msg}")
                passed_tests += 1
            else:
                print(f"   ❌ Offer relation: {msg}")
                failed_tests += 1
                issues.append(("Engagement", "Offer Relation", msg))
    else:
        print("   ❌ Engagement not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Engagement", "Existence", "Test record not found"))

    # 4. Find Project
    print("\n4. Verifying TEST-SYNC-PROJECT-001...")
    project = find_test_record(notion, "projects", TEST_RECORD_NAMES["projects"])
    if project:
        print("   ✅ Found project")
        ulid_valid, ulid = verify_ulid(project)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Project", "ULID", "Invalid ULID"))

        # Verify Engagement relation
        if engagement:
            total_tests += 1
            relation_valid, msg = verify_relation(notion, project, "Engagement", TEST_RECORD_NAMES["engagements"])
            if relation_valid:
                print(f"   ✅ Engagement relation: {msg}")
                passed_tests += 1
            else:
                print(f"   ❌ Engagement relation: {msg}")
                failed_tests += 1
                issues.append(("Project", "Engagement Relation", msg))

        # Verify Margin formula
        total_tests += 1
        formula_valid, msg = verify_formula(project, "Margin", 6500.0)
        if formula_valid:
            print(f"   ✅ Margin formula: {msg}")
            passed_tests += 1
        else:
            print(f"   ❌ Margin formula: {msg}")
            failed_tests += 1
            issues.append(("Project", "Margin Formula", msg))

        # Verify Billable formula
        total_tests += 1
        formula_valid, msg = verify_formula(project, "Billable", True)
        if formula_valid:
            print(f"   ✅ Billable formula: {msg}")
            passed_tests += 1
        else:
            print(f"   ❌ Billable formula: {msg}")
            failed_tests += 1
            issues.append(("Project", "Billable Formula", msg))
    else:
        print("   ❌ Project not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Project", "Existence", "Test record not found"))

    # 5. Find Tasks
    print("\n5. Verifying TEST-SYNC-TASK-001-BILLABLE...")
    task1 = find_test_record(notion, "tasks", TEST_RECORD_NAMES["tasks"][0])
    if task1:
        print("   ✅ Found billable task")
        ulid_valid, ulid = verify_ulid(task1)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Task1", "ULID", "Invalid ULID"))

        # Verify Project relation
        if project:
            total_tests += 1
            relation_valid, msg = verify_relation(notion, task1, "Project", TEST_RECORD_NAMES["projects"])
            if relation_valid:
                print(f"   ✅ Project relation: {msg}")
                passed_tests += 1
            else:
                print(f"   ❌ Project relation: {msg}")
                failed_tests += 1
                issues.append(("Task1", "Project Relation", msg))
    else:
        print("   ❌ Billable task not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Task1", "Existence", "Test record not found"))

    print("\n6. Verifying TEST-SYNC-TASK-002-LEARNING...")
    task2 = find_test_record(notion, "tasks", TEST_RECORD_NAMES["tasks"][1])
    if task2:
        print("   ✅ Found learning task")
        ulid_valid, ulid = verify_ulid(task2)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Task2", "ULID", "Invalid ULID"))
    else:
        print("   ❌ Learning task not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Task2", "Existence", "Test record not found"))

    # 7. Find Sprint
    print("\n7. Verifying TEST-2025-W42...")
    sprint = find_test_record(notion, "sprints", TEST_RECORD_NAMES["sprints"])
    if sprint:
        print("   ✅ Found sprint")
        ulid_valid, ulid = verify_ulid(sprint)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Sprint", "ULID", "Invalid ULID"))

        # Verify Sprint formulas
        total_tests += 1
        formula_valid, msg = verify_formula(sprint, "Planned Billable Hrs", 8.0)
        if formula_valid:
            print(f"   ✅ Planned Billable Hrs: {msg}")
            passed_tests += 1
        else:
            print(f"   ❌ Planned Billable Hrs: {msg}")
            failed_tests += 1
            issues.append(("Sprint", "Planned Billable Hrs", msg))

        total_tests += 1
        formula_valid, msg = verify_formula(sprint, "Planned Learning Hrs", 4.0)
        if formula_valid:
            print(f"   ✅ Planned Learning Hrs: {msg}")
            passed_tests += 1
        else:
            print(f"   ❌ Planned Learning Hrs: {msg}")
            failed_tests += 1
            issues.append(("Sprint", "Planned Learning Hrs", msg))

        total_tests += 1
        formula_valid, msg = verify_formula(sprint, "Billable %", 0.20)
        if formula_valid:
            print(f"   ✅ Billable %: {msg}")
            passed_tests += 1
        else:
            print(f"   ❌ Billable %: {msg}")
            failed_tests += 1
            issues.append(("Sprint", "Billable %", msg))
    else:
        print("   ❌ Sprint not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Sprint", "Existence", "Test record not found"))

    # Test Critical Path 2: CRM Flow
    print("\n\n📊 CRITICAL PATH 2: CRM Flow")
    print("-" * 60)

    # 8. Find Organization
    print("\n8. Verifying TEST-SYNC-ORG-001...")
    org = find_test_record(notion, "organizations", TEST_RECORD_NAMES["organizations"])
    if org:
        print("   ✅ Found organization")
        ulid_valid, ulid = verify_ulid(org)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Organization", "ULID", "Invalid ULID"))
    else:
        print("   ❌ Organization not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Organization", "Existence", "Test record not found"))

    # 9. Find Person
    print("\n9. Verifying TEST-SYNC-PERSON-001...")
    person = find_test_record(notion, "people", TEST_RECORD_NAMES["people"])
    if person:
        print("   ✅ Found person")
        ulid_valid, ulid = verify_ulid(person)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Person", "ULID", "Invalid ULID"))

        # Verify Organization relation
        if org:
            total_tests += 1
            relation_valid, msg = verify_relation(notion, person, "Organization", TEST_RECORD_NAMES["organizations"])
            if relation_valid:
                print(f"   ✅ Organization relation: {msg}")
                passed_tests += 1
            else:
                print(f"   ❌ Organization relation: {msg}")
                failed_tests += 1
                issues.append(("Person", "Organization Relation", msg))
    else:
        print("   ❌ Person not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Person", "Existence", "Test record not found"))

    # 10. Find Deal
    print("\n10. Verifying TEST-SYNC-DEAL-001...")
    deal = find_test_record(notion, "deals", TEST_RECORD_NAMES["deals"])
    if deal:
        print("   ✅ Found deal")
        ulid_valid, ulid = verify_ulid(deal)
        total_tests += 1
        if ulid_valid:
            print(f"   ✅ ULID valid: {ulid}")
            passed_tests += 1
        else:
            print(f"   ❌ ULID invalid: {ulid}")
            failed_tests += 1
            issues.append(("Deal", "ULID", "Invalid ULID"))

        # Verify Organization relation
        if org:
            total_tests += 1
            relation_valid, msg = verify_relation(notion, deal, "Organization", TEST_RECORD_NAMES["organizations"])
            if relation_valid:
                print(f"   ✅ Organization relation: {msg}")
                passed_tests += 1
            else:
                print(f"   ❌ Organization relation: {msg}")
                failed_tests += 1
                issues.append(("Deal", "Organization Relation", msg))

        # Verify Person relation
        if person:
            total_tests += 1
            relation_valid, msg = verify_relation(notion, deal, "Primary Contact", TEST_RECORD_NAMES["people"])
            if relation_valid:
                print(f"   ✅ Primary Contact relation: {msg}")
                passed_tests += 1
            else:
                print(f"   ❌ Primary Contact relation: {msg}")
                failed_tests += 1
                issues.append(("Deal", "Primary Contact Relation", msg))

        # Verify Weighted Value formula
        total_tests += 1
        formula_valid, msg = verify_formula(deal, "Weighted Value", 15000.0)
        if formula_valid:
            print(f"   ✅ Weighted Value formula: {msg}")
            passed_tests += 1
        else:
            print(f"   ❌ Weighted Value formula: {msg}")
            failed_tests += 1
            issues.append(("Deal", "Weighted Value Formula", msg))
    else:
        print("   ❌ Deal not found - create test record first")
        total_tests += 1
        failed_tests += 1
        issues.append(("Deal", "Existence", "Test record not found"))

    # Summary
    print("\n\n" + "=" * 60)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests} ✅")
    print(f"Failed: {failed_tests} ❌")
    print(f"Pass Rate: {(passed_tests / total_tests * 100):.1f}%")

    if issues:
        print("\n⚠️  ISSUES FOUND:")
        for component, test, description in issues:
            print(f"   - {component} / {test}: {description}")

    print("\n" + "=" * 60)

    if failed_tests == 0:
        print("✅ ALL TESTS PASSED - Ready for sync integration!")
        return 0
    else:
        print("❌ SOME TESTS FAILED - Fix issues before proceeding to sync integration")
        return 1


if __name__ == "__main__":
    sys.exit(main())
