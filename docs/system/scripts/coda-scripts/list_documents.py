#!/usr/bin/env python3
"""
List Coda Documents
==================

List all accessible documents with local search capabilities.

Usage:
    python list_documents.py [--search QUERY] [--human] [--no-cache] [--refresh]

Examples:
    python list_documents.py
    python list_documents.py --search "project"
    python list_documents.py --search "Q1 Goals" --human
    python list_documents.py --refresh

Features:
- Caches full document list locally for instant re-queries
- Local pandas search (compensates for missing Coda API search)
- Filters and sorts data before returning to LLM
- Dual output modes (JSON for agents, human-readable for debugging)

Token Efficiency:
- MCP approach: ~4,400 tokens (schema + full list processing in LLM)
- Script approach: ~40 tokens (local filtering, only matching results)
- Savings: 99.1%
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
    CodaAPIError
)


class DocumentLister:
    """
    Handles document listing with caching and local search.

    Key feature: Local pandas search compensates for missing Coda API search endpoint.
    Following Dan Isler's beyond-mcp pattern: "complete local cache once, then search instantly using pandas"
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize document lister.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def list_documents(
        self,
        search_query: Optional[str] = None,
        use_cache: bool = True,
        refresh_cache: bool = False
    ) -> List[Dict[str, Any]]:
        """
        List all documents with optional search.

        Args:
            search_query: Optional search string for filtering
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh

        Returns:
            List of document metadata dictionaries

        Raises:
            CodaAPIError: If API request fails
        """
        # Get documents (from cache or API)
        df = self._get_documents_df(use_cache, refresh_cache)

        # Apply search filter if provided
        if search_query:
            df = self._search_documents(df, search_query)

        # Convert to list of dicts
        documents = df.to_dict('records')

        return documents

    def _get_documents_df(self, use_cache: bool, refresh_cache: bool) -> pd.DataFrame:
        """
        Get documents as DataFrame (from cache or API).

        Args:
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh

        Returns:
            Documents DataFrame

        Raises:
            CodaAPIError: If API request fails
        """
        cache_key = "all_documents"

        # Try cache first (unless refresh requested)
        if use_cache and not refresh_cache:
            cached_df = self.cache.get(cache_key, ttl_minutes=None)  # Long-lived cache
            if cached_df is not None:
                return cached_df

        # Fetch from API
        documents = self._fetch_from_api()

        # Process documents
        processed = [self._process_document(doc) for doc in documents]

        # Create DataFrame
        df = pd.DataFrame(processed)

        # Cache for future use
        if use_cache:
            self.cache.set(cache_key, df)

        return df

    def _fetch_from_api(self) -> List[Dict[str, Any]]:
        """
        Fetch all documents from Coda API.

        Handles pagination automatically.

        Returns:
            List of raw document dictionaries

        Raises:
            CodaAPIError: If API request fails
        """
        all_documents = []
        page_token = None

        while True:
            params = {"limit": 100}  # Max per page
            if page_token:
                params["pageToken"] = page_token

            try:
                response = self.client.request("GET", "/docs", params=params)
            except CodaAPIError as e:
                raise CodaAPIError(
                    message=f"Failed to list documents: {e.message}",
                    status_code=e.status_code,
                    details=e.details
                )

            documents = response.get("items", [])
            all_documents.extend(documents)

            # Check for next page
            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return all_documents

    def _process_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process document data for caching and search.

        Args:
            document: Raw document data

        Returns:
            Processed document metadata
        """
        doc_size = document.get("docSize", {})

        return {
            "id": document.get("id"),
            "type": document.get("type"),
            "href": document.get("href"),
            "browserLink": document.get("browserLink"),
            "name": document.get("name"),
            "owner": document.get("owner"),
            "ownerName": document.get("ownerName"),
            "createdAt": document.get("createdAt"),
            "updatedAt": document.get("updatedAt"),
            "workspace": document.get("workspace", {}).get("name", ""),
            "folder": document.get("folder", {}).get("name", ""),
            "pageCount": doc_size.get("pageCount", 0),
            "tableCount": doc_size.get("tableAndViewCount", 0),
            "rowCount": doc_size.get("totalRowCount", 0),
        }

    def _search_documents(self, df: pd.DataFrame, query: str) -> pd.DataFrame:
        """
        Search documents using local pandas filtering.

        Searches across: name, workspace, folder, owner name.
        Case-insensitive partial matching.

        Args:
            df: Documents DataFrame
            query: Search query string

        Returns:
            Filtered DataFrame
        """
        query_lower = query.lower()

        # Create boolean mask for matching rows
        mask = (
            df["name"].str.lower().str.contains(query_lower, na=False) |
            df["workspace"].str.lower().str.contains(query_lower, na=False) |
            df["folder"].str.lower().str.contains(query_lower, na=False) |
            df["ownerName"].str.lower().str.contains(query_lower, na=False)
        )

        return df[mask]


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="List Coda documents with local search",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  List all documents (JSON output):
    python list_documents.py

  Search for documents (local pandas filtering):
    python list_documents.py --search "project"

  Search with human-readable output:
    python list_documents.py --search "Q1 Goals" --human

  Refresh cache:
    python list_documents.py --refresh

Token Efficiency:
  Scenario: "Find document named 'Q1 Goals'"

  MCP approach:
    1. Load 34 tool schemas: 3,000 tokens
    2. Call list_documents: 50 tokens
    3. LLM processes full list: 1,000 tokens (20 docs)
    4. LLM filters to find "Q1 Goals": 200 tokens
    Total: 4,250 tokens

  Script approach:
    1. No schema loading: 0 tokens
    2. Execute list_documents.py --search "Q1 Goals": 20 tokens
    3. Returns only matching doc (filtered locally): 20 tokens
    Total: 40 tokens

  Savings: 99.1% (4,250 → 40 tokens)
        """
    )

    parser.add_argument(
        "--search",
        type=str,
        help="Search query (filters name, workspace, folder, owner)"
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
        lister = DocumentLister()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute listing
    try:
        documents = lister.list_documents(
            search_query=args.search,
            use_cache=not args.no_cache,
            refresh_cache=args.refresh
        )

        # Output results
        if args.human:
            # Human-readable output
            df = pd.DataFrame(documents)
            output = OutputFormatter.human_output(df, title=f"Coda Documents ({len(documents)} found)")
            print(output)
        else:
            # JSON output (default for agents)
            output_data = {
                "count": len(documents),
                "documents": documents
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
