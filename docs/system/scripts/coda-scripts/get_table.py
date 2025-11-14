#!/usr/bin/env python3
"""
Get Coda Table
=============

Retrieve table schema and metadata with caching support.

Usage:
    python get_table.py <doc_id> <table_id> [--human] [--no-cache] [--refresh]

Examples:
    python get_table.py abc123 grid-123
    python get_table.py abc123 grid-123 --human
    python get_table.py abc123 grid-123 --refresh

Features:
- Caches table schema locally for fast re-access
- Analyzes column types and constraints
- Dual output modes (JSON for agents, human-readable for debugging)
- Comprehensive error handling with retries

Token Efficiency:
- MCP approach: ~3,000 tokens (load all tool schemas)
- Script approach: ~20 tokens (progressive disclosure)
- Savings: 99.3%
"""

import sys
import argparse
import pandas as pd
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


class TableRetriever:
    """
    Handles table retrieval with caching and schema analysis.

    Implements the core pattern from beyond-mcp: substantial scripts
    with caching, filtering, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize table retriever.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def get_table(
        self,
        doc_id: str,
        table_id: str,
        use_cache: bool = True,
        refresh_cache: bool = False
    ) -> Dict[str, Any]:
        """
        Get table schema and metadata.

        Args:
            doc_id: Document ID
            table_id: Table ID
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh

        Returns:
            Table metadata dictionary with schema analysis

        Raises:
            CodaAPIError: If API request fails
        """
        # Validate input
        validate_doc_id(doc_id)
        validate_table_id(table_id)

        # Try cache first (unless refresh requested)
        if use_cache and not refresh_cache:
            cached = self._get_from_cache(doc_id, table_id)
            if cached is not None:
                return cached

        # Fetch from API
        table = self._fetch_from_api(doc_id, table_id)

        # Process and analyze
        processed = self._process_table(table)

        if use_cache:
            self._save_to_cache(doc_id, table_id, processed)

        return processed

    def _get_from_cache(self, doc_id: str, table_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve table from cache.

        Args:
            doc_id: Document ID
            table_id: Table ID

        Returns:
            Cached table data or None
        """
        cache_key = f"table_{doc_id}_{table_id}"
        df = self.cache.get(cache_key, ttl_minutes=None)  # Tables rarely change

        if df is not None and len(df) > 0:
            # Convert DataFrame back to dict
            return df.iloc[0].to_dict()

        return None

    def _fetch_from_api(self, doc_id: str, table_id: str) -> Dict[str, Any]:
        """
        Fetch table from Coda API.

        Args:
            doc_id: Document ID
            table_id: Table ID

        Returns:
            Raw API response

        Raises:
            CodaAPIError: If API request fails
        """
        try:
            response = self.client.request("GET", f"/docs/{doc_id}/tables/{table_id}")
            return response
        except CodaAPIError as e:
            # Add context to error
            if e.status_code == 404:
                raise CodaAPIError(
                    message=f"Table '{table_id}' not found in document '{doc_id}'",
                    status_code=404,
                    details={"doc_id": doc_id, "table_id": table_id}
                )
            elif e.status_code == 403:
                raise CodaAPIError(
                    message=f"Access denied to table '{table_id}' in document '{doc_id}'",
                    status_code=403,
                    details={"doc_id": doc_id, "table_id": table_id}
                )
            else:
                raise

    def _process_table(self, table: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process table data with schema analysis.

        Analyzes column types, constraints, and provides metadata
        for data validation and row operations.

        Args:
            table: Raw table data

        Returns:
            Processed table with schema analysis
        """
        # Extract key metadata
        processed = {
            "id": table.get("id"),
            "type": table.get("type"),
            "name": table.get("name"),
            "href": table.get("href"),
            "browserLink": table.get("browserLink"),
            "parent": table.get("parent"),
            "displayColumn": table.get("displayColumn"),
            "rowCount": table.get("rowCount", 0),
            "createdAt": table.get("createdAt"),
            "updatedAt": table.get("updatedAt"),
        }

        # Analyze columns
        columns = table.get("columns", [])
        processed["columns"] = self._analyze_columns(columns)

        # Add schema summary
        processed["schema"] = {
            "totalColumns": len(columns),
            "displayColumn": table.get("displayColumn"),
            "rowCount": table.get("rowCount", 0),
            "columnTypes": self._get_column_type_summary(columns),
            "hasFormulas": any(col.get("formula") for col in columns),
            "hasCalculatedColumns": any(col.get("calculated") for col in columns),
        }

        return processed

    def _analyze_columns(self, columns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze column metadata for data validation.

        Args:
            columns: Raw column data from API

        Returns:
            Processed column information
        """
        analyzed = []

        for col in columns:
            column_info = {
                "id": col.get("id"),
                "name": col.get("name"),
                "type": col.get("type"),
                "display": col.get("display"),
                "formula": col.get("formula"),
                "calculated": col.get("calculated", False),
                "primary": col.get("primary", False),
            }

            # Add type-specific metadata
            if col.get("type") == "lookup":
                column_info["lookupOptions"] = col.get("lookupOptions", {})
            elif col.get("type") == "select":
                column_info["selectOptions"] = col.get("selectOptions", [])
            elif col.get("type") == "scale":
                column_info["scaleOptions"] = col.get("scaleOptions", {})

            analyzed.append(column_info)

        return analyzed

    def _get_column_type_summary(self, columns: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Get summary of column types.

        Args:
            columns: List of column data

        Returns:
            Dictionary with type counts
        """
        type_counts = {}
        for col in columns:
            col_type = col.get("type", "unknown")
            type_counts[col_type] = type_counts.get(col_type, 0) + 1
        return type_counts

    def _save_to_cache(self, doc_id: str, table_id: str, table: Dict[str, Any]) -> None:
        """
        Save table to cache.

        Args:
            doc_id: Document ID
            table_id: Table ID
            table: Processed table data
        """
        cache_key = f"table_{doc_id}_{table_id}"

        # Convert to DataFrame for pandas caching
        df = pd.DataFrame([table])

        self.cache.set(cache_key, df)


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Retrieve Coda table schema and metadata",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Get table (JSON output):
    python get_table.py abc123 grid-123

  Get table (human-readable output):
    python get_table.py abc123 grid-123 --human

  Refresh cached table:
    python get_table.py abc123 grid-123 --refresh

  Bypass cache:
    python get_table.py abc123 grid-123 --no-cache

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
        "table_id",
        type=str,
        help="Coda table ID (starts with 'grid-' or 'table-')"
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
        retriever = TableRetriever()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute retrieval
    try:
        table = retriever.get_table(
            doc_id=args.doc_id,
            table_id=args.table_id,
            use_cache=not args.no_cache,
            refresh_cache=args.refresh
        )

        # Output results
        if args.human:
            # Human-readable output
            output = OutputFormatter.human_output(table, title="Coda Table Schema")
            print(output)
        else:
            # JSON output (default for agents)
            output = OutputFormatter.json_output(success=True, data=table)
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