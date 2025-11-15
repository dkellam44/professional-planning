#!/usr/bin/env python3
"""
Get Coda Column
==============

Retrieve column details with caching support.

Usage:
    python get_column.py <doc_id> <table_id> <column_id_or_name> [--human] [--no-cache] [--refresh]

Examples:
    python get_column.py abc123 grid-123 c-XYZ
    python get_column.py abc123 grid-123 "Task Name"
    python get_column.py abc123 grid-123 c-XYZ --human
    python get_column.py abc123 grid-123 c-XYZ --refresh

Features:
- Get column details by ID or name
- Caches column metadata locally for fast re-access
- Support for formula analysis and format details
- Dual output modes (JSON for agents, human-readable for debugging)
- Comprehensive error handling with retries

Token Efficiency:
- MCP approach: ~3,000 tokens (load all tool schemas)
- Script approach: ~25 tokens (progressive disclosure)
- Savings: 99.2%
"""

import sys
import argparse
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
    validate_doc_id,
    validate_table_id
)


class ColumnRetriever:
    """
    Handles column retrieval with caching and data processing.

    Implements the core pattern from beyond-mcp: substantial scripts
    with caching, filtering, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize column retriever.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def get_column(
        self,
        doc_id: str,
        table_id: str,
        column_id_or_name: str,
        use_cache: bool = True,
        refresh_cache: bool = False
    ) -> Dict[str, Any]:
        """
        Get column metadata.

        Args:
            doc_id: Document ID
            table_id: Table ID
            column_id_or_name: Column ID or name
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh

        Returns:
            Column metadata dictionary

        Raises:
            CodaAPIError: If API request fails
        """
        # Validate input
        validate_doc_id(doc_id)
        validate_table_id(table_id)

        if not column_id_or_name or not isinstance(column_id_or_name, str):
            raise ValueError("Column ID or name must be a non-empty string")

        # Try cache first (unless refresh requested)
        if use_cache and not refresh_cache:
            cached = self._get_from_cache(doc_id, table_id, column_id_or_name)
            if cached is not None:
                return cached

        # Fetch from API
        column = self._fetch_from_api(doc_id, table_id, column_id_or_name)

        # Process and cache
        processed = self._process_column(column)

        if use_cache:
            self._save_to_cache(doc_id, table_id, column_id_or_name, processed)

        return processed

    def _get_from_cache(self, doc_id: str, table_id: str, column_id_or_name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve column from cache.

        Args:
            doc_id: Document ID
            table_id: Table ID
            column_id_or_name: Column ID or name

        Returns:
            Cached column data or None
        """
        # Create cache key based on column ID/name
        cache_key = f"column_{doc_id}_{table_id}_{column_id_or_name}"
        df = self.cache.get(cache_key, ttl_minutes=None)  # Columns rarely change

        if df is not None and len(df) > 0:
            # Convert DataFrame back to dict
            return df.iloc[0].to_dict()

        return None

    def _fetch_from_api(self, doc_id: str, table_id: str, column_id_or_name: str) -> Dict[str, Any]:
        """
        Fetch column from Coda API.

        Args:
            doc_id: Document ID
            table_id: Table ID
            column_id_or_name: Column ID or name

        Returns:
            Raw API response

        Raises:
            CodaAPIError: If API request fails
        """
        try:
            response = self.client.request("GET", f"/docs/{doc_id}/tables/{table_id}/columns/{column_id_or_name}")
            return response
        except CodaAPIError as e:
            # Add context to error
            if e.status_code == 404:
                raise CodaAPIError(
                    message=f"Column '{column_id_or_name}' not found in table '{table_id}' of document '{doc_id}'",
                    status_code=404,
                    details={"doc_id": doc_id, "table_id": table_id, "column_id_or_name": column_id_or_name}
                )
            elif e.status_code == 403:
                raise CodaAPIError(
                    message=f"Access denied to column '{column_id_or_name}' in table '{table_id}' of document '{doc_id}'",
                    status_code=403,
                    details={"doc_id": doc_id, "table_id": table_id, "column_id_or_name": column_id_or_name}
                )
            else:
                raise

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

    def _save_to_cache(self, doc_id: str, table_id: str, column_id_or_name: str, column: Dict[str, Any]) -> None:
        """
        Save column to cache for future use.

        Args:
            doc_id: Document ID
            table_id: Table ID
            column_id_or_name: Column ID or name
            column: Processed column data
        """
        cache_key = f"column_{doc_id}_{table_id}_{column_id_or_name}"
        
        # Convert to DataFrame for pandas caching
        import pandas as pd
        df = pd.DataFrame([column])
        
        self.cache.set(cache_key, df)


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Retrieve column details from Coda tables",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Get column by ID:
    python get_column.py abc123 grid-123 c-XYZ

  Get column by name:
    python get_column.py abc123 grid-123 "Task Name"

  Get column with human-readable output:
    python get_column.py abc123 grid-123 c-XYZ --human

  Refresh cached column:
    python get_column.py abc123 grid-123 c-XYZ --refresh

Token Efficiency:
  MCP approach: ~3,000 tokens (load all tool schemas)
  Script approach: ~25 tokens (progressive disclosure)
  Savings: 99.2%
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
        "column_id_or_name",
        type=str,
        help="Column ID (e.g., 'c-XYZ') or column name (e.g., 'Task Name')"
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
        retriever = ColumnRetriever()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute retrieval
    try:
        column = retriever.get_column(
            doc_id=args.doc_id,
            table_id=args.table_id,
            column_id_or_name=args.column_id_or_name,
            use_cache=not args.no_cache,
            refresh_cache=args.refresh
        )

        # Output results
        if args.human:
            # Human-readable output
            display = " (display)" if column.get("display") else ""
            calculated = " (calculated)" if column.get("calculated") else ""
            formula = f" = {column['formula']}" if column.get("formula") else ""
            
            output = f"✓ Column: {column['name']}{display}{calculated}{formula}"
            output += f"\n  ID: {column['id']}"
            output += f"\n  Type: {column.get('type', 'unknown')}"
            
            if column.get("defaultValue"):
                output += f"\n  Default: {column['defaultValue']}"
            
            print(output)
        else:
            # JSON output (default for agents)
            output = OutputFormatter.json_output(success=True, data=column)
            print(output)

        sys.exit(0)

    except ValueError as e:
        # Validation error
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