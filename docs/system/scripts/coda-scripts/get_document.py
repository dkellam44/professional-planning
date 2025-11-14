#!/usr/bin/env python3
"""
Get Coda Document
================

Retrieve document metadata with caching support.

Usage:
    python get_document.py <doc_id> [--human] [--no-cache] [--refresh]

Examples:
    python get_document.py abc123
    python get_document.py abc123 --human
    python get_document.py abc123 --refresh

Features:
- Caches document metadata locally for fast re-access
- Filters large fields to reduce token usage
- Dual output modes (JSON for agents, human-readable for debugging)
- Comprehensive error handling with retries

Token Efficiency:
- MCP approach: ~3,000 tokens (load all 34 tool schemas)
- Script approach: ~20 tokens (progressive disclosure)
- Savings: 99.3%
"""

import sys
import argparse
import pandas as pd
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from coda_utils import (
    CodaClient,
    CacheManager,
    OutputFormatter,
    CodaAPIError,
    validate_doc_id
)


class DocumentRetriever:
    """
    Handles document retrieval with caching and data processing.

    Implements the core pattern from beyond-mcp: substantial scripts
    with caching, filtering, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize document retriever.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def get_document(
        self,
        doc_id: str,
        use_cache: bool = True,
        refresh_cache: bool = False
    ) -> Dict[str, Any]:
        """
        Get document metadata.

        Args:
            doc_id: Document ID
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh

        Returns:
            Document metadata dictionary

        Raises:
            CodaAPIError: If API request fails
        """
        # Validate input
        validate_doc_id(doc_id)

        # Try cache first (unless refresh requested)
        if use_cache and not refresh_cache:
            cached = self._get_from_cache(doc_id)
            if cached is not None:
                return cached

        # Fetch from API
        document = self._fetch_from_api(doc_id)

        # Process and cache
        processed = self._process_document(document)

        if use_cache:
            self._save_to_cache(doc_id, processed)

        return processed

    def _get_from_cache(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve document from cache.

        Args:
            doc_id: Document ID

        Returns:
            Cached document data or None
        """
        cache_key = f"document_{doc_id}"
        df = self.cache.get(cache_key, ttl_minutes=None)  # Documents rarely change

        if df is not None and len(df) > 0:
            # Convert DataFrame back to dict
            return df.iloc[0].to_dict()

        return None

    def _fetch_from_api(self, doc_id: str) -> Dict[str, Any]:
        """
        Fetch document from Coda API.

        Args:
            doc_id: Document ID

        Returns:
            Raw API response

        Raises:
            CodaAPIError: If API request fails
        """
        try:
            response = self.client.request("GET", f"/docs/{doc_id}")
            return response
        except CodaAPIError as e:
            # Add context to error
            if e.status_code == 404:
                raise CodaAPIError(
                    message=f"Document '{doc_id}' not found",
                    status_code=404,
                    details={"doc_id": doc_id}
                )
            elif e.status_code == 403:
                raise CodaAPIError(
                    message=f"Access denied to document '{doc_id}'",
                    status_code=403,
                    details={"doc_id": doc_id}
                )
            else:
                raise

    def _process_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process document data to reduce token usage.

        Filters out large fields and formats data for consumption.

        Args:
            document: Raw document data

        Returns:
            Processed document metadata
        """
        # Extract key metadata (exclude large/unnecessary fields)
        processed = {
            "id": document.get("id"),
            "type": document.get("type"),
            "href": document.get("href"),
            "browserLink": document.get("browserLink"),
            "name": document.get("name"),
            "owner": document.get("owner"),
            "ownerName": document.get("ownerName"),
            "createdAt": document.get("createdAt"),
            "updatedAt": document.get("updatedAt"),
            "workspace": document.get("workspace", {}),
            "folder": document.get("folder", {}),
            "icon": document.get("icon", {}),
            "docSize": document.get("docSize", {}),
            "sourceDoc": document.get("sourceDoc"),
            "published": document.get("published", {}),
        }

        # Add summary statistics
        doc_size = document.get("docSize", {})
        processed["summary"] = {
            "total_pages": doc_size.get("pageCount", 0),
            "total_tables": doc_size.get("tableAndViewCount", 0),
            "total_row_count": doc_size.get("totalRowCount", 0),
            "created": document.get("createdAt"),
            "last_modified": document.get("updatedAt")
        }

        return processed

    def _save_to_cache(self, doc_id: str, document: Dict[str, Any]) -> None:
        """
        Save document to cache.

        Args:
            doc_id: Document ID
            document: Processed document data
        """
        cache_key = f"document_{doc_id}"

        # Convert to DataFrame for pandas caching
        df = pd.DataFrame([document])

        self.cache.set(cache_key, df)


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Retrieve Coda document metadata",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Get document (JSON output):
    python get_document.py abc123

  Get document (human-readable output):
    python get_document.py abc123 --human

  Refresh cached document:
    python get_document.py abc123 --refresh

  Bypass cache:
    python get_document.py abc123 --no-cache

Token Efficiency:
  MCP approach: ~3,000 tokens (load all tool schemas)
  Script approach: ~20 tokens (no schema loading)
  Savings: 99.3%
        """
    )

    parser.add_argument(
        "doc_id",
        type=str,
        help="Coda document ID"
    )

    parser.add_argument(
        "--human",
        action="store_true",
        help="Output in human-readable format (default: JSON)"
    )

    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Bypass cache and fetch from API"
    )

    parser.add_argument(
        "--refresh",
        action="store_true",
        help="Refresh cache with latest data"
    )

    args = parser.parse_args()

    # Initialize retriever
    try:
        retriever = DocumentRetriever()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute retrieval
    try:
        document = retriever.get_document(
            doc_id=args.doc_id,
            use_cache=not args.no_cache,
            refresh_cache=args.refresh
        )

        # Output results
        if args.human:
            # Human-readable output
            output = OutputFormatter.human_output(document, title="Coda Document")
            print(output)
        else:
            # JSON output (default for agents)
            output = OutputFormatter.json_output(success=True, data=document)
            print(output)

        sys.exit(0)

    except ValueError as e:
        # Input validation error
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "VALIDATION_ERROR", "message": str(e)}
        )
        print(error_output, file=sys.stderr)
        sys.exit(1)

    except CodaAPIError as e:
        # Coda API error
        error_output = OutputFormatter.json_output(
            success=False,
            error=e.to_dict()
        )
        print(error_output, file=sys.stderr)
        sys.exit(1)

    except Exception as e:
        # Unexpected error
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "UNEXPECTED_ERROR", "message": str(e)}
        )
        print(error_output, file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
