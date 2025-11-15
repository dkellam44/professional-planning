#!/usr/bin/env python3
"""
Delete Coda Document
===================

Delete Coda documents with safety confirmation.

Usage:
    python delete_doc.py <doc_id> [--force] [--human]

Examples:
    python delete_doc.py abc123
    python delete_doc.py abc123 --force
    python delete_doc.py abc123 --human

Features:
- Safety confirmation (unless --force is used)
- Document existence verification
- Comprehensive error handling with retries
- Dual output modes (JSON for agents, human-readable for debugging)

Token Efficiency:
- MCP approach: ~3,000 tokens (load all tool schemas)
- Script approach: ~20 tokens (progressive disclosure)
- Savings: 99.3%
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


class DocumentDeleter:
    """
    Handles document deletion with safety measures.

    Implements the core pattern from beyond-mcp: substantial scripts
    with safety checks, confirmation, and error handling.
    """

    def __init__(self, api_token: Optional[str] = None, cache_manager: Optional[CacheManager] = None):
        """
        Initialize document deleter.

        Args:
            api_token: Coda API token (defaults to env var)
            cache_manager: Cache manager instance
        """
        self.client = CodaClient(api_token=api_token)
        self.cache = cache_manager or CacheManager()
        self.formatter = OutputFormatter()

    def delete_document(
        self,
        doc_id: str,
        force: bool = False
    ) -> Dict[str, Any]:
        """
        Delete a Coda document.

        Args:
            doc_id: Document ID to delete
            force: Skip confirmation prompt

        Returns:
            Deletion result

        Raises:
            CodaAPIError: If API request fails
            ValueError: If validation fails or user cancels
        """
        # Validate input
        validate_doc_id(doc_id)

        # Get document info for confirmation if not forced
        if not force:
            doc_info = self._get_document_info(doc_id)
            self._confirm_deletion(doc_info)

        # Delete document via API
        self._delete_document_via_api(doc_id)

        # Invalidate caches
        self._invalidate_caches(doc_id)

        return {
            "success": True,
            "message": f"Document {doc_id} deleted successfully",
            "docId": doc_id,
            "deletedAt": datetime.now().isoformat()
        }

    def _get_document_info(self, doc_id: str) -> Dict[str, Any]:
        """
        Get document information for confirmation prompt.

        Args:
            doc_id: Document ID

        Returns:
            Document information

        Raises:
            CodaAPIError: If API request fails
        """
        try:
            response = self.client.request("GET", f"/docs/{doc_id}")
            return response
        except CodaAPIError as e:
            if e.status_code == 404:
                raise CodaAPIError(
                    message=f"Document '{doc_id}' not found",
                    status_code=404,
                    details={"doc_id": doc_id}
                )
            else:
                raise

    def _confirm_deletion(self, doc_info: Dict[str, Any]) -> None:
        """
        Prompt user for deletion confirmation.

        Args:
            doc_info: Document information for display

        Raises:
            ValueError: If user cancels deletion
        """
        # Extract display information
        doc_id = doc_info.get("id", "unknown")
        doc_name = doc_info.get("name", "Untitled Document")
        owner = doc_info.get("ownerName", "Unknown Owner")
        
        # Build confirmation message
        message = f"Delete document '{doc_name}' (ID: {doc_id}, Owner: {owner})? This action cannot be undone."
        
        # Prompt for confirmation
        try:
            response = input(f"{message} [y/N]: ").strip().lower()
            if response not in ['y', 'yes']:
                raise ValueError("Deletion cancelled by user")
        except (EOFError, KeyboardInterrupt):
            raise ValueError("Deletion cancelled")

    def _delete_document_via_api(self, doc_id: str) -> None:
        """
        Delete document via Coda API.

        Args:
            doc_id: Document ID

        Raises:
            CodaAPIError: If API request fails
        """
        try:
            self.client.request("DELETE", f"/docs/{doc_id}")
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
                    message=f"Access denied to delete document '{doc_id}'",
                    status_code=403,
                    details={"doc_id": doc_id}
                )
            elif e.status_code == 409:
                raise CodaAPIError(
                    message="Delete conflict - document may be in use or have dependencies",
                    status_code=409,
                    details=e.details
                )
            else:
                raise

    def _invalidate_caches(self, doc_id: str) -> None:
        """
        Invalidate relevant caches after deletion.

        Args:
            doc_id: Document ID
        """
        # Clear document cache
        cache_key = f"document_{doc_id}"
        self.cache.clear(cache_key)
        
        # Clear related caches (documents list, etc.)
        self.cache.clear("all_documents")


def main():
    """Main entry point for script execution."""
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Delete Coda documents with safety confirmation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Delete document with confirmation:
    python delete_doc.py abc123

  Delete document without confirmation:
    python delete_doc.py abc123 --force

  Delete with human-readable output:
    python delete_doc.py abc123 --human

Token Efficiency:
  MCP approach: ~3,000 tokens (load all tool schemas)
  Script approach: ~20 tokens (progressive disclosure)
  Savings: 99.3%
        """
    )

    parser.add_argument(
        "doc_id",
        type=str,
        help="Coda document ID to delete"
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Skip confirmation prompt"
    )

    parser.add_argument(
        "--human",
        action="store_true",
        help="Output in human-readable format (default: JSON)"
    )

    args = parser.parse_args()

    # Initialize deleter
    try:
        deleter = DocumentDeleter()
    except Exception as e:
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "INIT_ERROR", "message": str(e)}
        )
        print(error_output)
        sys.exit(1)

    # Execute deletion
    try:
        result = deleter.delete_document(
            doc_id=args.doc_id,
            force=args.force
        )

        # Output results
        if args.human:
            # Human-readable output
            output = f"✓ Document {result['docId']} deleted successfully"
            print(output)
        else:
            # JSON output (default for agents)
            output = OutputFormatter.json_output(success=True, data=result)
            print(output)

        sys.exit(0)

    except ValueError as e:
        # User cancelled or validation error
        error_output = OutputFormatter.json_output(
            success=False,
            error={"code": "CANCELLED", "message": str(e)}
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