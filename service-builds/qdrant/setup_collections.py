#!/usr/bin/env python3
"""
Qdrant Collections Setup
Purpose: Initialize vector collections for Planner & Memory Architecture
Vector Size: 1536 (OpenAI ada-002 compatible)
Created: 2025-12-02
"""

import requests
import json
import time
import sys
from typing import Dict, Any

# Configuration
QDRANT_URL = "http://localhost:6333"
VECTOR_SIZE = 1536
TIMEOUT = 30

# Collections to create
COLLECTIONS = {
    "doc_chunks": {
        "description": "Document chunks for RAG (Docling/Crawl4AI ingest)",
        "vectors_config": {
            "size": VECTOR_SIZE,
            "distance": "Cosine"
        }
    },
    "events": {
        "description": "Event embeddings for semantic search over activities",
        "vectors_config": {
            "size": VECTOR_SIZE,
            "distance": "Cosine"
        }
    },
    "agent_memories": {
        "description": "Long-term agent memory embeddings (mem0 extracted)",
        "vectors_config": {
            "size": VECTOR_SIZE,
            "distance": "Cosine"
        }
    },
    "daily_threads": {
        "description": "Daily reflection thread embeddings for recall",
        "vectors_config": {
            "size": VECTOR_SIZE,
            "distance": "Cosine"
        }
    }
}


def check_qdrant_health() -> bool:
    """Verify Qdrant is accessible"""
    try:
        response = requests.get(f"{QDRANT_URL}/health", timeout=TIMEOUT)
        if response.status_code == 200:
            print("✓ Qdrant health check passed")
            return True
        else:
            print(f"✗ Qdrant health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Qdrant unreachable: {e}")
        return False


def create_collection(collection_name: str, config: Dict[str, Any]) -> bool:
    """Create a single collection"""
    try:
        # Create collection
        url = f"{QDRANT_URL}/collections/{collection_name}"
        payload = {
            "vectors": config["vectors_config"]
        }

        response = requests.put(url, json=payload, timeout=TIMEOUT)

        if response.status_code in [200, 201]:
            print(f"✓ Collection '{collection_name}' created")
            return True
        else:
            print(f"✗ Failed to create '{collection_name}': {response.status_code}")
            print(f"  Response: {response.text}")
            return False

    except Exception as e:
        print(f"✗ Error creating collection '{collection_name}': {e}")
        return False


def list_collections() -> Dict[str, Any]:
    """List all collections"""
    try:
        response = requests.get(f"{QDRANT_URL}/collections", timeout=TIMEOUT)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"✗ Failed to list collections: {response.status_code}")
            return {}
    except Exception as e:
        print(f"✗ Error listing collections: {e}")
        return {}


def main():
    """Main setup function"""
    print("=" * 60)
    print("Qdrant Collections Setup")
    print("=" * 60)

    # Check health
    print("\n[1/3] Checking Qdrant health...")
    if not check_qdrant_health():
        print("\nFATAL: Qdrant is not accessible. Exiting.")
        sys.exit(1)

    # Create collections
    print("\n[2/3] Creating collections...")
    created_count = 0
    for collection_name, config in COLLECTIONS.items():
        print(f"\n  Creating '{collection_name}'...")
        print(f"    Description: {config['description']}")
        print(f"    Vector size: {config['vectors_config']['size']}")
        print(f"    Distance metric: {config['vectors_config']['distance']}")

        if create_collection(collection_name, config):
            created_count += 1

        # Small delay between creations
        time.sleep(0.5)

    # Verify collections
    print("\n[3/3] Verifying collections...")
    collections = list_collections()

    if "result" in collections and "collections" in collections["result"]:
        actual_collections = collections["result"]["collections"]
        print(f"\n✓ Found {len(actual_collections)} collections in Qdrant:")
        for coll in actual_collections:
            coll_name = coll.get("name", "Unknown")
            points = coll.get("points_count", 0)
            print(f"  - {coll_name} ({points} points)")

        # Verify our collections exist
        our_collection_names = set(COLLECTIONS.keys())
        found_collection_names = {coll["name"] for coll in actual_collections}

        missing = our_collection_names - found_collection_names
        if missing:
            print(f"\n✗ Missing collections: {missing}")
            return False
        else:
            print(f"\n✓ All {len(COLLECTIONS)} required collections found!")
            return True
    else:
        print("✗ Failed to verify collections")
        return False


if __name__ == "__main__":
    success = main()
    print("\n" + "=" * 60)
    if success:
        print("SUCCESS: All collections initialized")
        print("=" * 60)
        sys.exit(0)
    else:
        print("FAILURE: Setup incomplete")
        print("=" * 60)
        sys.exit(1)
