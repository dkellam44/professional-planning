#!/usr/bin/env python3
"""
Get Coda Page
============

Retrieve page details with caching support.

Usage:
    python get_page.py <doc_id> <page_id_or_name> [--human] [--no-cache] [--refresh]

Examples:
    python get_page.py abc123 canvas-XYZ
    python get_page.py abc123 "Launch Status"
    python get_page.py abc123 canvas-XYZ --human
    python get_page.py abc123 canvas-XYZ --refresh

Features:
- Get page details by ID or name
- Caches page metadata locally for fast re-access
- Support for page content analysis
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
    validate_doc_id
)


class PageRetriever:
    """
    Handles page retrieval with caching and data processing.

    Implements the core pattern from beyond-mcp: substantial scripts
    with caching, filtering, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize page retriever.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def get_page(
        self,
        doc_id: str,
        page_id_or_name: str,
        use_cache: bool = True,
        refresh_cache: bool = False
    ) -> Dict[str, Any]:
        """
        Get page metadata.

        Args:
            doc_id: Document ID
            page_id_or_name: Page ID or name
            use_cache: Whether to use cached data
            refresh_cache: Force cache refresh

        Returns:
            Page metadata dictionary

        Raises:
            CodaAPIError: If API request fails
        """
        # Validate input
        validate_doc_id(doc_id)

        if not page_id_or_name or not isinstance(page_id_or_name, str):
            raise ValueError("Page ID or name must be a non-empty string")

        # Try cache first (unless refresh requested)
        if use_cache and not refresh_cache:
            cached = self._get_from_cache(doc_id, page_id_or_name)
            if cached is not None:
                return cached

        # Fetch from API
        page = self._fetch_from_api(doc_id, page_id_or_name)

        # Process and cache
        processed = self._process_page(page)

        if use_cache:
            self._save_to_cache(doc_id, page_id_or_name, processed)

        return processed

    def _get_from_cache(self, doc_id: str, page_id_or_name: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve page from cache.

        Args:
            doc_id: Document ID
            page_id_or_name: Page ID or name

        Returns:
            Cached page data or None
        """
        # Create cache key based on page ID/name
        cache_key = f"page_{doc_id}_{page_id_or_name}"
        df = self.cache.get(cache_key, ttl_minutes=None)  # Pages rarely change

        if df is not None and len(df) > 0:
            # Convert DataFrame back to dict
            return df.iloc[0].to_dict()

        return None

    def _fetch_from_api(self, doc_id: str, page_id_or_name: str) -> Dict[str, Any]:
        """
        Fetch page from Coda API.

        Args:
            doc_id: Document ID
            page_id_or_name: Page ID or name

        Returns:
            Raw API response

        Raises:
            CodaAPIError: If API request fails
        """
        try:
            response = self.client.request("GET", f"/docs/{doc_id}/pages/{page_id_or_name}")
            return response
        except CodaAPIError as e:
            # Add context to error
            if e.status_code == 404:
                raise CodaAPIError(
                    message=f"Page '{page_id_or_name}' not found in document '{doc_id}'",
                    status_code=404,
                    details={"doc_id": doc_id, "page_id_or_name": page_id_or_name}
                )
            elif e.status_code == 403:
                raise CodaAPIError(
                    message=f"Access denied to page '{page_id_or_name}' in document '{doc_id}'",
                    status_code=403,
                    details={"doc_id": doc_id, "page_id_or_name": page_id_or_name}
                )
            elif e.status_code == 410:
                raise CodaAPIError(
                    message=f"Page '{page_id_or_name}' has been deleted from document '{doc_id}'",
                    status_code=410,
                    details={"doc_id": doc_id, "page_id_or_name": page_id_or_name}
                )
            else:
                raise

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

    def _save_to_cache(self, doc_id: str, page_id_or_name: str, page: Dict[str, Any]) -> None:
        """
        Save page to cache for future use.

        Args:
            doc_id: Document ID
            page_id_or_name: Page ID or name
            page: Processed page data
        """
        cache_key = f"page_{doc_id}_{page_id_or_name}"
        
        # Convert to DataFrame for pandas caching
        import pandas as pd
        df = pd.DataFrame([page])
        
        self.cache.set(cache_key, df)


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Retrieve page details from Coda documents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Get page by ID:
    python get_page.py abc123 canvas-XYZ

  Get page by name:
    python get_page.py abc123 "Launch Status"

  Get page with human-readable output:
    python get_page.py abc123 canvas-XYZ --human

  Refresh cached page:
    python get_page.py abc123 canvas-XYZ --refresh

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
        "page_id_or_name",
        type=str,
        help="Page ID (e.g., 'canvas-XYZ') or page name (e.g., 'Launch Status')"
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
        retriever = PageRetriever()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute retrieval
    try:
        page = retriever.get_page(
            doc_id=args.doc_id,
            page_id_or_name=args.page_id_or_name,
            use_cache=not args.no_cache,
            refresh_cache=args.refresh
        )

        # Output results
        if args.human:
            # Human-readable output
            hidden = " (hidden)" if page.get("isHidden") else ""
            subtitle = f" - {page['subtitle']}" if page.get("subtitle") else ""
            content_type = page.get("contentType", "unknown")
            
            output = f"✓ Page: {page['name']}{subtitle}{hidden}"
            output += f"\n  Type: {content_type}"
            output += f"\n  ID: {page['id']}"
            output += f"\n  Created: {page.get('createdAt', 'Unknown')}"
            
            if page.get("children"):
                output += f"\n  Children: {len(page['children'])}"
            
            print(output)
        else:
            # JSON output (default for agents)
            output = OutputFormatter.json_output(success=True, data=page)
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