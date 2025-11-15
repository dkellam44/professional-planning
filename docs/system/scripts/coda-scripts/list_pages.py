#!/usr/bin/env python3
"""
List Coda Pages
==============

List all pages in a Coda document with caching support.

Usage:
    python list_pages.py <doc_id> [--limit N] [--human] [--no-cache] [--refresh]

Examples:
    python list_pages.py abc123
    python list_pages.py abc123 --limit 10
    python list_pages.py abc123 --human
    python list_pages.py abc123 --refresh

Features:
- List all pages in a document
- Pagination support with limit parameter
- Caches page list for fast re-access
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
    validate_doc_id
)


class PageLister:
    """
    Handles page listing with caching and pagination.

    Implements the core pattern from beyond-mcp: substantial scripts
    with caching, filtering, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize page lister.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def list_pages(
        self,
        doc_id: str,
        limit: Optional[int] = None,
        use_cache: bool = True,
        refresh_cache: bool = False
    ) -> List[Dict[str, Any]]:
        """
        List all pages in a document.

        Args:
            doc_id: Document ID
            limit: Maximum number of pages to return
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh

        Returns:
            List of page metadata dictionaries

        Raises:
            CodaAPIError: If API request fails
        """
        # Validate input
        validate_doc_id(doc_id)

        # Get pages (from cache or API)
        pages = self._get_pages(doc_id, use_cache, refresh_cache, limit)

        return pages

    def _get_pages(self, doc_id: str, use_cache: bool, refresh_cache: bool, limit: Optional[int]) -> List[Dict[str, Any]]:
        """
        Get pages (from cache or API).

        Args:
            doc_id: Document ID
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh
            limit: Maximum number of pages to return

        Returns:
            List of page metadata

        Raises:
            CodaAPIError: If API request fails
        """
        cache_key = f"pages_{doc_id}"

        # Try cache first (unless refresh requested)
        if use_cache and not refresh_cache:
            cached = self.cache.get(cache_key, ttl_minutes=None)  # Pages rarely change
            if cached is not None and len(cached) > 0:
                pages = cached.to_dict('records')
                # Apply limit if specified
                if limit:
                    return pages[:limit]
                return pages

        # Fetch from API (with pagination)
        all_pages = self._fetch_from_api(doc_id)

        # Process pages
        processed = [self._process_page(page) for page in all_pages]

        # Cache for future use
        if use_cache:
            self._save_to_cache(doc_id, processed)

        # Apply limit if specified
        if limit:
            return processed[:limit]

        return processed

    def _fetch_from_api(self, doc_id: str) -> List[Dict[str, Any]]:
        """
        Fetch all pages from Coda API.

        Handles pagination automatically.

        Args:
            doc_id: Document ID

        Returns:
            List of raw page dictionaries

        Raises:
            CodaAPIError: If API request fails
        """
        all_pages = []
        page_token = None

        while True:
            params = {"limit": 100}  # Max per page
            if page_token:
                params["pageToken"] = page_token

            try:
                response = self.client.request("GET", f"/docs/{doc_id}/pages", params=params)
            except CodaAPIError as e:
                raise CodaAPIError(
                    message=f"Failed to list pages: {e.message}",
                    status_code=e.status_code,
                    details=e.details
                )

            pages = response.get("items", [])
            all_pages.extend(pages)

            # Check for next page
            page_token = response.get("nextPageToken")
            if not page_token:
                break

        return all_pages

    def _process_page(self, page: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process page data for output.

        Args:
            page: Raw page data from API

        Returns:
            Processed page metadata
        """
        return {
            "id": page.get("id"),
            "type": page.get("type"),
            "name": page.get("name"),
            "href": page.get("href"),
            "browserLink": page.get("browserLink"),
            "subtitle": page.get("subtitle"),
            "contentType": page.get("contentType"),
            "isHidden": page.get("isHidden", False),
            "isEffectivelyHidden": page.get("isEffectivelyHidden", False),
            "icon": page.get("icon", {}),
            "image": page.get("image", {}),
            "parent": page.get("parent", {}),
            "children": page.get("children", []),
            "authors": page.get("authors", []),
            "createdAt": page.get("createdAt"),
            "updatedAt": page.get("updatedAt"),
            "createdBy": page.get("createdBy", {}),
            "updatedBy": page.get("updatedBy", {})
        }

    def _save_to_cache(self, doc_id: str, pages: List[Dict[str, Any]]) -> None:
        """
        Save pages to cache for future use.

        Args:
            doc_id: Document ID
            pages: List of processed page data
        """
        cache_key = f"pages_{doc_id}"
        
        # Convert to DataFrame for pandas caching
        import pandas as pd
        df = pd.DataFrame(pages)
        
        self.cache.set(cache_key, df)


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="List pages in Coda documents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  List all pages:
    python list_pages.py abc123

  List with limit:
    python list_pages.py abc123 --limit 10

  List with human-readable output:
    python list_pages.py abc123 --human

  Refresh cached pages:
    python list_pages.py abc123 --refresh

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
        "--limit",
        type=int,
        help="Maximum number of pages to return"
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
        lister = PageLister()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute listing
    try:
        pages = lister.list_pages(
            doc_id=args.doc_id,
            limit=args.limit,
            use_cache=not args.no_cache,
            refresh_cache=args.refresh
        )

        # Output results
        if args.human:
            # Human-readable output
            if pages:
                print(f"\nPages in document {args.doc_id} ({len(pages)} found):")
                for i, page in enumerate(pages, 1):
                    hidden = " (hidden)" if page.get("isHidden") else ""
                    subtitle = f" - {page['subtitle']}" if page.get("subtitle") else ""
                    print(f"{i}. {page['name']}{subtitle}{hidden}")
            else:
                print(f"No pages found in document {args.doc_id}")
        else:
            # JSON output (default for agents)
            output_data = {
                "count": len(pages),
                "pages": pages
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