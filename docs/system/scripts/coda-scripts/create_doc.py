#!/usr/bin/env python3
"""
Create Coda Document
===================

Create new Coda documents with optional copying from templates.

Usage:
    python create_doc.py --title "Document Name" [--source-doc SOURCE_DOC] [--folder FOLDER_ID] [--timezone TIMEZONE] [--human]

Examples:
    python create_doc.py --title "Project Tracker"
    python create_doc.py --title "Meeting Notes" --source-doc template123
    python create_doc.py --title "Team Wiki" --folder folder456 --timezone "America/New_York"

Features:
- Create blank documents or copy from templates
- Support for folder organization
- Timezone configuration
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


class DocumentCreator:
    """
    Handles document creation with template support and organization.

    Implements the core pattern from beyond-mcp: substantial scripts
    with caching, validation, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize document creator.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def create_document(
        self,
        title: str,
        source_doc: Optional[str] = None,
        folder_id: Optional[str] = None,
        timezone: Optional[str] = None,
        initial_page: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new Coda document.

        Args:
            title: Document title
            source_doc: Optional source document ID to copy from
            folder_id: Optional folder ID for organization
            timezone: Optional timezone for the document
            initial_page: Optional initial page content

        Returns:
            Created document metadata

        Raises:
            CodaAPIError: If API request fails
            ValueError: If validation fails
        """
        # Validate input
        if not title or not isinstance(title, str):
            raise ValueError("Document title must be a non-empty string")
        
        if len(title) > 100:
            raise ValueError("Document title must be 100 characters or less")

        # Build request data
        request_data = {"title": title}
        
        if source_doc:
            request_data["sourceDoc"] = source_doc
        
        if folder_id:
            request_data["folderId"] = folder_id
        
        if timezone:
            request_data["timezone"] = timezone
        
        if initial_page:
            request_data["initialPage"] = initial_page

        # Create document via API
        document = self._create_document_via_api(request_data)

        # Process and cache result
        processed = self._process_document(document)
        
        # Cache for future reference
        self._save_to_cache(processed)

        return processed

    def _create_document_via_api(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create document via Coda API.

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
                    message=f"Invalid document parameters: {e.message}",
                    status_code=400,
                    details=e.details
                )
            elif e.status_code == 403:
                raise CodaAPIError(
                    message="Access denied - user must be Doc Maker in workspace",
                    status_code=403,
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
        description="Create new Coda documents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Create blank document:
    python create_doc.py --title "Project Tracker"

  Create from template:
    python create_doc.py --title "Meeting Notes" --source-doc template123

  Create in specific folder:
    python create_doc.py --title "Team Wiki" --folder folder456 --timezone "America/New_York"

  Create with human-readable output:
    python create_doc.py --title "New Doc" --human

Token Efficiency:
  MCP approach: ~3,000 tokens (load all tool schemas)
  Script approach: ~30 tokens (progressive disclosure)
  Savings: 99.0%
        """
    )

    parser.add_argument(
        "--title",
        type=str,
        required=True,
        help="Document title (max 100 characters)"
    )

    parser.add_argument(
        "--source-doc",
        type=str,
        help="Source document ID to copy from"
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

    # Initialize creator
    try:
        creator = DocumentCreator()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute creation
    try:
        document = creator.create_document(
            title=args.title,
            source_doc=args.source_doc,
            folder_id=args.folder,
            timezone=args.timezone
        )

        # Output results
        if args.human:
            # Human-readable output
            output = f"✓ Created document: {document['name']} (ID: {document['id']})"
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