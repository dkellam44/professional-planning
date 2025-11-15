#!/usr/bin/env python3
"""
List Coda Columns
================

List all columns in a Coda table with caching support.

Usage:
    python list_columns.py <doc_id> <table_id> [--limit N] [--visible-only] [--human] [--no-cache] [--refresh]

Examples:
    python list_columns.py abc123 grid-123
    python list_columns.py abc123 grid-123 --limit 10
    python list_columns.py abc123 grid-123 --visible-only --human
    python list_columns.py abc123 grid-123 --refresh

Features:
- List all columns in a table
- Filter visible columns only
- Pagination support with limit parameter
- Caches column list for fast re-access
- Dual output modes (JSON for agents, human-readable for debugging)
- Comprehensive error handling with retries

Token Efficiency:
- MCP approach: ~3,000 tokens (load all tool schemas)
- Script approach: ~30 tokens (progressive disclosure)
- Savings: 99.0%
"""

import sys
import argparse
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from coda_utils import (
    CodaClient,
    CacheManager,
    OutputFormatter,
    CodaAPIError,
    validate_doc_id,
    validate_table_id
)


class ColumnLister:
    """
    Handles column listing with caching and filtering.

    Implements the core pattern from beyond-mcp: substantial scripts
    with caching, filtering, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize column lister.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def list_columns(
        self,
        doc_id: str,
        table_id: str,
        limit: Optional[int] = None,
        visible_only: bool = False,
        use_cache: bool = True,
        refresh_cache: bool = False
    ) -> List[Dict[str, Any]]:
        """
        List all columns in a table.

        Args:
            doc_id: Document ID
            table_id: Table ID
            limit: Maximum number of columns to return
            visible_only: Show only visible columns
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh

        Returns:
            List of column metadata dictionaries

        Raises:
            CodaAPIError: If API request fails
        """
        # Validate input
        validate_doc_id(doc_id)
        validate_table_id(table_id)

        # Get columns (from cache or API)
        columns = self._get_columns(doc_id, table_id, use_cache, refresh_cache, visible_only, limit)

        return columns

    def _get_columns(self, doc_id: str, table_id: str, use_cache: bool, refresh_cache: bool, visible_only: bool, limit: Optional[int]) -> List[Dict[str, Any]]:
        """
        Get columns (from cache or API).

        Args:
            doc_id: Document ID
            table_id: Table ID
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh
            visible_only: Show only visible columns
            limit: Maximum number of columns to return

        Returns:
            List of column metadata

        Raises:
            CodaAPIError: If API request fails
        """
        cache_key = f"columns_{doc_id}_{table_id}"
        if visible_only:
            cache_key += "_visible"

        # Try cache first (unless refresh requested)
        if use_cache and not refresh_cache:
            cached = self.cache.get(cache_key, ttl_minutes=None)  # Columns rarely change
            if cached is not None and len(cached) > 0:
                columns = cached.to_dict('records')
                # Apply limit if specified
                if limit:
                    return columns[:limit]
                return columns

        # Fetch from API (with pagination)
        all_columns = self._fetch_from_api(doc_id, table_id, visible_only)

        # Process columns
        processed = [self._process_column(col) for col in all_columns]

        # Cache for future use
        if use_cache:
            self._save_to_cache(doc_id, table_id, visible_only, processed)

        # Apply limit if specified
        if limit:
            return processed[:limit]

        return processed

    def _fetch_from_api(self, doc_id: str, table_id: str, visible_only: bool) -> List[Dict[str, Any]]:
        """
        Fetch all columns from Coda API.

        Handles pagination automatically.

        Args:
            doc_id: Document ID
            table_id: Table ID
            visible_only: Show only visible columns

        Returns:
            List of raw column dictionaries

        Raises:
            CodaAPIError: If API request fails
        """
        all_columns = []
        page_token = None

        while True:
            params = {"limit": 100}  # Max per page
            if visible_only:
                params["visibleOnly"] = "true"
            if page_token:
                params["pageToken"] = page_token

            try:
                response = self.client.request("GET", f"/docs/{doc_id}/tables/{table_id}/columns", params=params)
            except CodaAPIError as e:
                raise CodaAPIError(
                    message=f"Failed to list columns: {e.message}",
                    status_code=e.status_code,
                    details=e.details
                )

            columns = response.get("items", [])
            all_columns.extend(columns)

            # Check for next page
            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return all_columns

    def _process_column(self, column: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process column data for output.

        Args:
            column: Raw column data from API

        Returns:
            Processed column metadata
        """
        return {
            "id": column.get("id"),
            "type": column.get("type"),
            "name": column.get("name"),
            "href": column.get("href"),
            "display": column.get("display", False),
            "calculated": column.get("calculated", False),
            "formula": column.get("formula"),
            "defaultValue": column.get("defaultValue"),
            "format": column.get("format", {}),
            "parent": column.get("parent", {})
        }

    def _save_to_cache(self, doc_id: str, table_id: str, visible_only: bool, columns: List[Dict[str, Any]]) -> None:
        """
        Save columns to cache for future use.

        Args:
            doc_id: Document ID
            table_id: Table ID
            visible_only: Whether only visible columns were fetched
            columns: List of processed column data
        """
        cache_key = f"columns_{doc_id}_{table_id}"
        if visible_only:
            cache_key += "_visible"
        
        # Convert to DataFrame for pandas caching
        import pandas as pd
        df = pd.DataFrame(columns)
        
        self.cache.set(cache_key, df)


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="List columns in Coda tables",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  List all columns:
    python list_columns.py abc123 grid-123

  List only visible columns:
    python list_columns.py abc123 grid-123 --visible-only

  List with limit:
    python list_columns.py abc123 grid-123 --limit 10

  List with human-readable output:
    python list_columns.py abc123 grid-123 --human

  Refresh cached columns:
    python list_columns.py abc123 grid-123 --refresh

Token Efficiency:
  MCP approach: ~3,000 tokens (load all tool schemas)
  Script approach: ~30 tokens (progressive disclosure)
  Savings: 99.0%
        """
    )

    parser.add_argument(
        "doc_id",
        type=str,
        help="Coda document ID"
    )

    parser.add_argument(
        "table_id",
        type=str,
        help="Coda table ID (starts with 'grid-' or 'table-')"
    )

    parser.add_argument(
        "--limit",
        type=int,
        help="Maximum number of columns to return"
    )

    parser.add_argument(
        "--visible-only",
        action="store_true",
        help="Show only visible columns"
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

    # Initialize lister
    try:
        lister = ColumnLister()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute listing
    try:
        columns = lister.list_columns(
            doc_id=args.doc_id,
            table_id=args.table_id,
            limit=args.limit,
            visible_only=args.visible_only,
            use_cache=not args.no_cache,
            refresh_cache=args.refresh
        )

        # Output results
        if args.human:
            # Human-readable output
            if columns:
                print(f"\nColumns in table {args.table_id} ({len(columns)} found):")
                for i, column in enumerate(columns, 1):
                    display = " (display)" if column.get("display") else ""
                    calculated = " (calculated)" if column.get("calculated") else ""
                    formula = f" = {column['formula']}" if column.get("formula") else ""
                    print(f"{i}. {column['name']}{display}{calculated}{formula}")
            else:
                print(f"No columns found in table {args.table_id}")
        else:
            # JSON output (default for agents)
            output_data = {
                "count": len(columns),
                "columns": columns
            }
            output = OutputFormatter.json_output(success=True, data=output_data)
            print(output)

        sys.exit(0)

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