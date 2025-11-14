"""
Coda API Utilities
=================

Shared utilities for Coda API scripts following beyond-mcp patterns.

Features:
- CodaClient: API calls with retry logic
- CacheManager: Pandas-based local caching
- OutputFormatter: Dual output modes (JSON and human-readable)
- Error handling and logging
"""

import os
import sys
import json
import time
import requests
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


class CodaClient:
    """
    HTTP client for Coda API with retry logic and error handling.

    Implements exponential backoff for rate limiting and transient errors.
    """

    def __init__(self, api_token: Optional[str] = None, base_url: str = "https://coda.io/apis/v1"):
        """
        Initialize Coda API client.

        Args:
            api_token: Coda API token (defaults to CODA_API_TOKEN env var)
            base_url: Coda API base URL
        """
        self.api_token = api_token or os.getenv("CODA_API_TOKEN")
        if not self.api_token:
            raise ValueError("CODA_API_TOKEN environment variable not set")

        self.base_url = base_url
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create requests session with retry strategy."""
        session = requests.Session()

        # Retry strategy: 3 retries with exponential backoff
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,  # 1s, 2s, 4s delays
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET", "POST", "PUT", "DELETE"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("https://", adapter)
        session.mount("http://", adapter)

        return session

    def _get_headers(self) -> Dict[str, str]:
        """Get default headers for Coda API requests."""
        return {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json",
            "User-Agent": "Coda-Scripts/1.0.0"
        }

    def request(
        self,
        method: str,
        path: str,
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Make API request to Coda.

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            path: API endpoint path (e.g., "/docs")
            data: Request body for POST/PUT
            params: Query parameters

        Returns:
            API response data

        Raises:
            CodaAPIError: If API request fails
        """
        url = f"{self.base_url}{path}"

        try:
            response = self.session.request(
                method=method,
                url=url,
                headers=self._get_headers(),
                json=data if data else None,
                params=params,
                timeout=30
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else None
            error_data = {}

            try:
                error_data = e.response.json() if e.response else {}
            except:
                pass

            raise CodaAPIError(
                message=error_data.get("message", str(e)),
                status_code=status_code,
                details=error_data
            )

        except requests.exceptions.RequestException as e:
            raise CodaAPIError(
                message=f"Request failed: {str(e)}",
                status_code=None,
                details={}
            )


class CacheManager:
    """
    Pandas-based cache manager for Coda API responses.

    Implements TTL-based cache invalidation and parquet storage.
    Following Dan Isler's beyond-mcp pattern.
    """

    def __init__(self, cache_dir: Optional[Path] = None):
        """
        Initialize cache manager.

        Args:
            cache_dir: Directory for cache files (defaults to ./cache)
        """
        if cache_dir is None:
            cache_dir = Path(__file__).parent / "cache"

        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _get_cache_path(self, cache_key: str) -> Path:
        """Get cache file path for given key."""
        return self.cache_dir / f"{cache_key}.parquet"

    def _get_metadata_path(self, cache_key: str) -> Path:
        """Get metadata file path for given key."""
        return self.cache_dir / f"{cache_key}.meta.json"

    def get(self, cache_key: str, ttl_minutes: Optional[int] = None) -> Optional[pd.DataFrame]:
        """
        Get cached data if valid.

        Args:
            cache_key: Cache identifier
            ttl_minutes: Time-to-live in minutes (None = no expiration)

        Returns:
            Cached DataFrame or None if expired/missing
        """
        cache_path = self._get_cache_path(cache_key)
        meta_path = self._get_metadata_path(cache_key)

        if not cache_path.exists() or not meta_path.exists():
            return None

        # Check TTL
        if ttl_minutes is not None:
            with open(meta_path, 'r') as f:
                metadata = json.load(f)

            cached_at = datetime.fromisoformat(metadata['cached_at'])
            expires_at = cached_at + timedelta(minutes=ttl_minutes)

            if datetime.now() > expires_at:
                return None  # Cache expired

        # Load and return cached data
        try:
            return pd.read_parquet(cache_path)
        except Exception as e:
            print(f"Warning: Failed to load cache: {e}", file=sys.stderr)
            return None

    def set(self, cache_key: str, data: pd.DataFrame) -> None:
        """
        Store data in cache.

        Args:
            cache_key: Cache identifier
            data: DataFrame to cache
        """
        cache_path = self._get_cache_path(cache_key)
        meta_path = self._get_metadata_path(cache_key)

        # Save data
        data.to_parquet(cache_path, index=False)

        # Save metadata
        metadata = {
            "cached_at": datetime.now().isoformat(),
            "rows": len(data),
            "columns": list(data.columns)
        }

        with open(meta_path, 'w') as f:
            json.dump(metadata, f, indent=2)

    def clear(self, cache_key: Optional[str] = None) -> None:
        """
        Clear cache.

        Args:
            cache_key: Specific key to clear (None = clear all)
        """
        if cache_key:
            cache_path = self._get_cache_path(cache_key)
            meta_path = self._get_metadata_path(cache_key)
            cache_path.unlink(missing_ok=True)
            meta_path.unlink(missing_ok=True)
        else:
            for file in self.cache_dir.glob("*"):
                file.unlink()


class OutputFormatter:
    """
    Dual output formatter for JSON (agents) and human-readable (debugging).
    """

    @staticmethod
    def json_output(success: bool, data: Any = None, error: Optional[Dict[str, Any]] = None) -> str:
        """
        Format output as JSON for AI agents.

        Args:
            success: Whether operation succeeded
            data: Result data (if successful)
            error: Error details (if failed)

        Returns:
            JSON string
        """
        output = {"success": success, "timestamp": datetime.now().isoformat()}

        if success:
            output["data"] = data
        else:
            output["error"] = error

        return json.dumps(output, indent=2)

    @staticmethod
    def human_output(data: Any, title: Optional[str] = None) -> str:
        """
        Format output as human-readable text.

        Args:
            data: Data to format
            title: Optional title

        Returns:
            Formatted string
        """
        lines = []

        if title:
            lines.append(f"\n{'='*60}")
            lines.append(f"{title:^60}")
            lines.append(f"{'='*60}\n")

        if isinstance(data, pd.DataFrame):
            lines.append(data.to_string())
        elif isinstance(data, dict):
            for key, value in data.items():
                lines.append(f"{key}: {value}")
        elif isinstance(data, list):
            for i, item in enumerate(data, 1):
                lines.append(f"{i}. {item}")
        else:
            lines.append(str(data))

        return "\n".join(lines)


class CodaAPIError(Exception):
    """Custom exception for Coda API errors."""

    def __init__(self, message: str, status_code: Optional[int] = None, details: Optional[Dict] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert error to dictionary for JSON output."""
        return {
            "code": self.status_code or "UNKNOWN",
            "message": self.message,
            "details": self.details
        }


def validate_doc_id(doc_id: str) -> bool:
    """
    Validate Coda document ID format.

    Args:
        doc_id: Document ID to validate

    Returns:
        True if valid

    Raises:
        ValueError: If invalid format
    """
    if not doc_id or not isinstance(doc_id, str):
        raise ValueError("Document ID must be a non-empty string")

    # Coda doc IDs are typically alphanumeric with hyphens
    if not all(c.isalnum() or c in ['-', '_'] for c in doc_id):
        raise ValueError(f"Invalid document ID format: {doc_id}")

    return True


def validate_table_id(table_id: str) -> bool:
    """
    Validate Coda table ID format.

    Args:
        table_id: Table ID to validate

    Returns:
        True if valid

    Raises:
        ValueError: If invalid format
    """
    if not table_id or not isinstance(table_id, str):
        raise ValueError("Table ID must be a non-empty string")

    # Coda table IDs start with 'grid-' or 'table-'
    if not (table_id.startswith("grid-") or table_id.startswith("table-")):
        raise ValueError(f"Invalid table ID format: {table_id} (must start with 'grid-' or 'table-')")

    return True


def validate_row_id(row_id: str) -> bool:
    """
    Validate Coda row ID format.

    Args:
        row_id: Row ID to validate

    Returns:
        True if valid

    Raises:
        ValueError: If invalid format
    """
    if not row_id or not isinstance(row_id, str):
        raise ValueError("Row ID must be a non-empty string")

    # Coda row IDs start with 'i-'
    if not row_id.startswith("i-"):
        raise ValueError(f"Invalid row ID format: {row_id} (must start with 'i-')")

    return True
