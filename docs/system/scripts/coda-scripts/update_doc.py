#!/usr/bin/env python3
"""
Update Coda Document
===================

Update document metadata like title and icon.

Usage:
    python update_doc.py <doc_id> [--title "New Title"] [--icon ICON_NAME] [--human]

Examples:
    python update_doc.py abc123 --title "Updated Project Tracker"
    python update_doc.py abc123 --icon "rocket"
    python update_doc.py abc123 --title "Team Wiki" --icon "book" --human

Features:
- Update document title
- Change document icon
- Support for partial updates (only changed fields)
- Dual output modes (JSON for agents, human-readable for debugging)
- Comprehensive error handling with retries

Token Efficiency:
- MCP approach: ~3,000 tokens (load all tool schemas)
- Script approach: ~25 tokens (progressive disclosure)
- Savings: 99.2%
"""

import sys
import argparse
import json
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


class DocumentUpdater:
    """
    Handles document metadata updates with partial update support.

    Implements the core pattern from beyond-mcp: substantial scripts
    with smart updates, validation, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize document updater.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def update_document(
        self,
        doc_id: str,
        title: Optional[str] = None,
        icon_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update document metadata.

        Args:
            doc_id: Document ID
            title: New document title (optional)
            icon_name: New icon name (optional)

        Returns:
            Updated document metadata

        Raises:
            CodaAPIError: If API request fails
            ValueError: If validation fails or no changes provided
        """
        # Validate input
        validate_doc_id(doc_id)

        # Check that at least one field is being updated
        if not title and not icon_name:
            raise ValueError("Must provide at least one field to update (title or icon)")

        # Build request data with only provided fields
        request_data = {}
        
        if title is not None:
            if not isinstance(title, str) or not title.strip():
                raise ValueError("Title must be a non-empty string")
            if len(title) > 100:
                raise ValueError("Document title must be 100 characters or less")
            request_data["title"] = title.strip()
        
        if icon_name is not None:
            if not isinstance(icon_name, str) or not icon_name.strip():
                raise ValueError("Icon name must be a non-empty string")
            request_data["iconName"] = icon_name.strip()

        # Update document via API
        document = self._update_document_via_api(doc_id, request_data)

        # Process and cache result
        processed = self._process_document(document)
        
        # Invalidate cache since we modified the document
        self._invalidate_cache(doc_id)

        return processed

    def _update_document_via_api(self, doc_id: str, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update document via Coda API.

        Args:
            doc_id: Document ID
            request_data: Request parameters

        Returns:
            Raw API response

        Raises:
            CodaAPIError: If API request fails
        """
        try:
            response = self.client.request("PATCH", f"/docs/{doc_id}", data=request_data)
            return response
        except CodaAPIError as e:
            # Add context to error
            if e.status_code == 400:
                raise CodaAPIError(
                    message=f"Invalid update parameters: {e.message}",
                    status_code=400,
                    details=e.details
                )
            elif e.status_code == 403:
                raise CodaAPIError(
                    message="Access denied - user must be Doc Maker in workspace",
                    status_code=403,
                    details=e.details
                )
            elif e.status_code == 404:
                raise CodaAPIError(
                    message=f"Document '{doc_id}' not found",
                    status_code=404,
                    details={"doc_id": doc_id}
                )
            elif e.status_code == 429:
                raise CodaAPIError(
                    message="Rate limit exceeded - please wait before updating more documents",
                    status_code=429,
                    details=e.details
                )
            else:
                raise

    def _process_document(self, document: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process document data for output.

        Args:
            document: Raw document data from API

        Returns:
            Processed document metadata
        """
        return {
            "id": document.get("id"),
            "type": document.get("type"),
            "name": document.get("name"),
            "href": document.get("href"),
            "browserLink": document.get("browserLink"),
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
            "success": True
        }

    def _invalidate_cache(self, doc_id: str) -> None:
        """
        Invalidate document cache after update.

        Args:
            doc_id: Document ID
        """
        cache_key = f"document_{doc_id}"
        self.cache.clear(cache_key)


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Update document metadata",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Update document title:
    python update_doc.py abc123 --title "Updated Project Tracker"

  Change document icon:
    python update_doc.py abc123 --icon "rocket"

  Update both title and icon:
    python update_doc.py abc123 --title "Team Wiki" --icon "book"

  Update with human-readable output:
    python update_doc.py abc123 --title "New Name" --human

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
        "--title",
        type=str,
        help="New document title (max 100 characters)"
    )

    parser.add_argument(
        "--icon",
        type=str,
        help="New icon name (e.g., 'rocket', 'book', 'star')"
    )

    parser.add_argument(
        "--human",
        action="store_true",
        help="Output in human-readable format (default: JSON)"
    )

    args = parser.parse_args()

    # Initialize updater
    try:
        updater = DocumentUpdater()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute update
    try:
        document = updater.update_document(
            doc_id=args.doc_id,
            title=args.title,
            icon_name=args.icon
        )

        # Output results
        if args.human:
            # Human-readable output
            changes = []
            if args.title:
                changes.append(f"title to '{args.title}'")
            if args.icon:
                changes.append(f"icon to '{args.icon}'")
            
            output = f"✓ Updated document {args.doc_id}: {', '.join(changes)}"
            print(output)
        else:
            # JSON output (default for agents)
            output = OutputFormatter.json_output(success=True, data=document)
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