"""
Test Suite for Coda Scripts
===========================

Tests equivalence between scripts and MCP tools.

Run with: pytest tests/
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from coda_utils import CodaClient, CacheManager, OutputFormatter


class TestGetDocument:
    """Test get_document.py script equivalence with MCP tools."""

    def test_client_initialization(self):
        """Test CodaClient can be initialized."""
        # This test requires CODA_API_TOKEN env var
        try:
            client = CodaClient()
            assert client.base_url == "https://coda.io/apis/v1"
        except ValueError as e:
            pytest.skip(f"CODA_API_TOKEN not set: {e}")

    def test_cache_manager(self):
        """Test CacheManager basic operations."""
        cache = CacheManager()
        assert cache.cache_dir.exists()

    def test_output_formatter_json(self):
        """Test JSON output formatting."""
        output = OutputFormatter.json_output(
            success=True,
            data={"id": "test123", "name": "Test Doc"}
        )
        assert '"success": true' in output
        assert '"data"' in output

    def test_output_formatter_error(self):
        """Test error output formatting."""
        output = OutputFormatter.json_output(
            success=False,
            error={"code": "NOT_FOUND", "message": "Document not found"}
        )
        assert '"success": false' in output
        assert '"error"' in output
        assert 'NOT_FOUND' in output


# TODO: Add equivalence tests comparing script output vs MCP tool output
# This requires actual Coda API access and MCP server running

class TestScriptEquivalence:
    """Test that scripts produce equivalent output to MCP tools."""

    @pytest.mark.skip(reason="Requires Coda API access")
    def test_get_document_equivalence(self):
        """
        Test that get_document.py produces same output as MCP get_document tool.

        Test pattern:
        1. Call MCP tool: get_document(doc_id="test123")
        2. Run script: python get_document.py test123
        3. Compare data structures (ignoring timestamp fields)
        4. Assert equivalence
        """
        pass

    @pytest.mark.skip(reason="Requires Coda API access")
    def test_list_documents_equivalence(self):
        """Test that list_documents.py matches MCP list_docs tool."""
        pass
