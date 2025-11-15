#!/usr/bin/env python3
"""
Copy Coda Document
==================

Copy existing Coda documents with optional customization.

Usage:
    python copy_doc.py <source_doc_id> --title "New Document Name" [--folder FOLDER_ID] [--timezone TIMEZONE] [--human]

Examples:
    python copy_doc.py abc123 --title "Project Tracker Copy"
    python copy_doc.py template456 --title "Team Wiki" --folder folder789
    python copy_doc.py source123 --title "Meeting Notes Copy" --timezone "America/New_York" --human

Features:
- Copy documents with new titles
- Support for folder organization
- Timezone configuration
- Template-based copying
- Dual output modes (JSON for agents, human-readable for debugging)
- Comprehensive error handling with retries

Token Efficiency:
- MCP approach: ~3,000 tokens (load all tool schemas)
- Script approach: ~30 tokens (progressive disclosure)
- Savings: 99.0%
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
    CodaAPIError
)


class DocumentCopier:
    """
    Handles document copying with customization options.

    Implements the core pattern from beyond-mcp: substantial scripts
    with caching, validation, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize document copier.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def copy_document(
        self,
        source_doc_id: str,
        title: str,
        folder_id: Optional[str] = None,
        timezone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Copy an existing Coda document.

        Args:
            source_doc_id: Source document ID to copy from
            title: New document title
            folder_id: Optional folder ID for organization
            timezone: Optional timezone for the document

        Returns:
            Copied document metadata

        Raises:
            CodaAPIError: If API request fails
            ValueError: If validation fails
        """
        # Validate input
        if not source_doc_id or not isinstance(source_doc_id, str):
            raise ValueError("Source document ID must be a non-empty string")
        
        if not title or not isinstance(title, str):
            raise ValueError("Document title must be a non-empty string")
        
        if len(title) > 100:
            raise ValueError("Document title must be 100 characters or less")

        # Build request data
        request_data = {
            "title": title,
            "sourceDoc": source_doc_id
        }
        
        if folder_id:
            request_data["folderId"] = folder_id
        
        if timezone:
            request_data["timezone"] = timezone

        # Copy document via API
        document = self._copy_document_via_api(request_data)

        # Process and cache result
        processed = self._process_document(document)
        
        # Cache for future reference
        self._save_to_cache(processed)

        return processed

    def _copy_document_via_api(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Copy document via Coda API.

        Args:
            request_data: Request parameters

        Returns:
            Raw API response

        Raises:
            CodaAPIError: If API request fails
        """
        try:
            response = self.client.request("POST", "/docs", data=request_data)
            return response
        except CodaAPIError as e:
            # Add context to error
            if e.status_code == 400:
                raise CodaAPIError(
                    message=f"Invalid copy parameters: {e.message}",
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
                    message=f"Source document '{request_data.get('sourceDoc')}' not found",
                    status_code=404,
                    details=e.details
                )
            elif e.status_code == 429:
                raise CodaAPIError(
                    message="Rate limit exceeded - please wait before creating more documents",
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
            "requestId": document.get("requestId"),
            "success": True
        }

    def _save_to_cache(self, document: Dict[str, Any]) -> None:
        """
        Save document to cache for future reference.

        Args:
            document: Processed document data
        """
        cache_key = f"document_{document['id']}"
        
        # Convert to DataFrame for pandas caching
        import pandas as pd
        df = pd.DataFrame([document])
        
        self.cache.set(cache_key, df)


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Copy existing Coda documents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Copy document with new title:
    python copy_doc.py source123 --title "Project Tracker Copy"

  Copy to specific folder:
    python copy_doc.py template456 --title "Team Wiki" --folder folder789

  Copy with timezone and human output:
    python copy_doc.py source123 --title "Meeting Notes Copy" --timezone "America/New_York" --human

Token Efficiency:
  MCP approach: ~3,000 tokens (load all tool schemas)
  Script approach: ~30 tokens (progressive disclosure)
  Savings: 99.0%
        """
    )

    parser.add_argument(
        "source_doc_id",
        type=str,
        help="Source document ID to copy from"
    )

    parser.add_argument(
        "--title",
        type=str,
        required=True,
        help="New document title (max 100 characters)"
    )

    parser.add_argument(
        "--folder",
        type=str,
        help="Folder ID to create document in"
    )

    parser.add_argument(
        "--timezone",
        type=str,
        help="Timezone for the document (e.g., 'America/New_York')"
    )

    parser.add_argument(
        "--human",
        action="store_true",
        help="Output in human-readable format (default: JSON)"
    )

    args = parser.parse_args()

    # Initialize copier
    try:
        copier = DocumentCopier()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute copying
    try:
        document = copier.copy_document(
            source_doc_id=args.source_doc_id,
            title=args.title,
            folder_id=args.folder,
            timezone=args.timezone
        )

        # Output results
        if args.human:
            # Human-readable output
            output = f"✓ Copied document: {document['name']} (ID: {document['id']})"
            if document.get('sourceDoc'):
                output += f" from {document['sourceDoc']['id']}"
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