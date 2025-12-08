"""Postgres client helpers for Planner Engine."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional, Tuple

import asyncpg

from app.config import settings
from app.models import PromptTemplate

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


async def initialize() -> None:
    """Create the asyncpg connection pool."""
    global _pool
    if _pool:
        return

    _pool = await asyncpg.create_pool(
        host=settings.postgres_host,
        port=settings.postgres_port,
        database=settings.postgres_db,
        user=settings.postgres_user,
        password=settings.postgres_password,
        min_size=2,
        max_size=10,
        timeout=settings.request_timeout_seconds,
    )
    logger.info("Postgres pool ready")


async def close() -> None:
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def check_connection() -> Tuple[bool, str]:
    """Validate pool readiness."""
    if not _pool:
        return False, "pool-not-initialized"

    try:
        async with _pool.acquire() as conn:
            val = await conn.fetchval("SELECT 1")
            return val == 1, "ok"
    except Exception as exc:  # pragma: no cover
        logger.warning("Postgres health check failed: %s", exc)
        return False, str(exc)


async def insert_plan(
    *,
    plan_title: str,
    intent: str,
    sop: Dict[str, Any],
    client_id: int,
    status: str = "draft",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Persist a new plan row."""
    if not _pool:
        raise RuntimeError("Postgres pool not initialized")

    payload = json.dumps(sop)
    metadata_json = json.dumps(metadata or {})

    query = """
        INSERT INTO plans (plan_title, intent, sop, client_id, status, metadata, created_at, updated_at)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6::jsonb, NOW(), NOW())
        RETURNING id, status, created_at
    """

    async with _pool.acquire() as conn:
        row = await conn.fetchrow(query, plan_title, intent, payload, client_id, status, metadata_json)
        return {
            "id": row["id"],
            "status": row["status"],
            "created_at": row["created_at"],
        }


async def get_plan(plan_id: int) -> Optional[Dict[str, Any]]:
    if not _pool:
        raise RuntimeError("Postgres pool not initialized")

    query = """
        SELECT id, plan_title, intent, sop, client_id, status, metadata, created_at, updated_at
        FROM plans WHERE id = $1
    """

    async with _pool.acquire() as conn:
        row = await conn.fetchrow(query, plan_id)
        if not row:
            return None
        return {
            "id": row["id"],
            "plan_title": row["plan_title"],
            "intent": row["intent"],
            "sop": row["sop"],
            "client_id": row["client_id"],
            "status": row["status"],
            "metadata": row["metadata"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }


async def update_plan_status(plan_id: int, status: str, metadata: Optional[Dict[str, Any]] = None) -> None:
    if not _pool:
        raise RuntimeError("Postgres pool not initialized")

    query = """
        UPDATE plans SET status = $2, metadata = COALESCE(metadata, '{}'::jsonb) || $3::jsonb, updated_at = NOW()
        WHERE id = $1
    """
    meta_json = json.dumps(metadata or {})

    async with _pool.acquire() as conn:
        await conn.execute(query, plan_id, status, meta_json)


async def get_prompt_template(template_name: str, version: Optional[str] = None) -> Optional[PromptTemplate]:
    """Return prompt template details."""
    if not _pool:
        raise RuntimeError("Postgres pool not initialized")

    query = """
        SELECT template_name, version, content, metadata
        FROM prompt_templates
        WHERE template_name = $1
        ORDER BY updated_at DESC
        LIMIT 1
    """
    params = [template_name]

    if version:
        query = """
            SELECT template_name, version, content, metadata
            FROM prompt_templates
            WHERE template_name = $1 AND version = $2
            ORDER BY updated_at DESC
            LIMIT 1
        """
        params.append(version)

    async with _pool.acquire() as conn:
        row = await conn.fetchrow(query, *params)
        if not row:
            return None
        metadata = row["metadata"] if isinstance(row["metadata"], dict) else {}
        return PromptTemplate(
            name=row["template_name"],
            version=row["version"],
            content=row["content"],
            metadata=metadata or {},
        )
