"""HTTP client for interacting with the Memory Gateway service."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_client: Optional[httpx.AsyncClient] = None


async def initialize() -> None:
    global _client
    if _client:
        return

    _client = httpx.AsyncClient(
        base_url=settings.memory_gateway_url,
        timeout=settings.request_timeout_seconds,
    )
    logger.info("Memory Gateway client initialized (%s)", settings.memory_gateway_url)


async def close() -> None:
    global _client
    if _client:
        await _client.aclose()
        _client = None


async def check_health() -> Tuple[bool, str]:
    if not _client:
        return False, "client-not-initialized"

    try:
        resp = await _client.get("/health", timeout=5)
        if resp.status_code == 200:
            return True, "ok"
        return False, f"status-{resp.status_code}"
    except Exception as exc:  # pragma: no cover
        return False, str(exc)


async def fetch_preferences(
    *,
    client_id: int,
    intent: str,
    context: Optional[Dict[str, Any]] = None,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """Recall preference memories for personalization."""
    if not _client:
        raise RuntimeError("Memory Gateway client not initialized")

    query_text = intent
    if context:
        query_text = f"{intent}\ncontext:{json.dumps(context, ensure_ascii=False)}"

    params = {
        "client_id": client_id,
        "query": query_text,
        "k": limit,
        "memory_type": "preference",
    }

    try:
        resp = await _client.get("/api/v1/memory/recall", params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get("results", [])
    except Exception as exc:
        logger.warning("Memory Gateway recall failed: %s", exc)
        return []


async def fetch_recent_plans(*, client_id: int, limit: int = 3) -> List[Dict[str, Any]]:
    """Placeholder for future caching logic via Memory Gateway events."""
    if not _client:
        raise RuntimeError("Memory Gateway client not initialized")

    try:
        resp = await _client.get(
            "/api/v1/memory/recall",
            params={"client_id": client_id, "query": "plan", "k": limit},
        )
        resp.raise_for_status()
        return resp.json().get("results", [])
    except Exception:
        return []
