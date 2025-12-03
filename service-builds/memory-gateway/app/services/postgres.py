"""
PostgreSQL Service
Connection pooling and event storage
"""

import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any, List

import asyncpg
from app.config import Settings

logger = logging.getLogger(__name__)

settings = Settings()

# Global connection pool
pool: Optional[asyncpg.Pool] = None


async def initialize():
    """Initialize Postgres connection pool"""
    global pool
    try:
        pool = await asyncpg.create_pool(
            host=settings.postgres_host,
            port=settings.postgres_port,
            database=settings.postgres_db,
            user=settings.postgres_user,
            password=settings.postgres_password,
            min_size=5,
            max_size=20,
            command_timeout=60,
        )
        logger.info("Postgres pool initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Postgres pool: {e}")
        raise


async def close():
    """Close Postgres connection pool"""
    global pool
    if pool:
        await pool.close()
        logger.info("Postgres pool closed")


async def insert_event(
    event_type: str,
    event_source: str,
    client_id: int,
    payload: Dict[str, Any],
    metadata: Optional[Dict[str, Any]] = None,
) -> int:
    """
    Insert an event into the events table

    Args:
        event_type: Type of event (e.g., "memory:remember", "memory:recall")
        event_source: Source of event (e.g., "memory-gateway")
        client_id: Client/user ID
        payload: Event data as JSON
        metadata: Additional metadata

    Returns:
        Event ID
    """
    if not pool:
        raise RuntimeError("Postgres pool not initialized")

    try:
        query = """
        INSERT INTO events (event_type, event_source, client_id, payload, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        """

        event_id = await pool.fetchval(
            query,
            event_type,
            event_source,
            client_id,
            json.dumps(payload),
            json.dumps(metadata) if metadata else None,
            datetime.utcnow(),
        )

        logger.debug(f"Event {event_id} inserted (type: {event_type})")
        return event_id

    except Exception as e:
        logger.error(f"Failed to insert event: {e}")
        raise


async def get_events(
    client_id: int,
    event_type: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[Dict[str, Any]]:
    """
    Retrieve events for a client

    Args:
        client_id: Client/user ID
        event_type: Optional event type filter
        limit: Number of results to return
        offset: Result offset for pagination

    Returns:
        List of events
    """
    if not pool:
        raise RuntimeError("Postgres pool not initialized")

    try:
        if event_type:
            query = """
            SELECT id, event_type, event_source, client_id, payload, metadata, created_at
            FROM events
            WHERE client_id = $1 AND event_type = $2
            ORDER BY created_at DESC
            LIMIT $3 OFFSET $4
            """
            rows = await pool.fetch(query, client_id, event_type, limit, offset)
        else:
            query = """
            SELECT id, event_type, event_source, client_id, payload, metadata, created_at
            FROM events
            WHERE client_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
            """
            rows = await pool.fetch(query, client_id, limit, offset)

        events = []
        for row in rows:
            events.append(
                {
                    "id": row["id"],
                    "event_type": row["event_type"],
                    "event_source": row["event_source"],
                    "client_id": row["client_id"],
                    "payload": json.loads(row["payload"]) if row["payload"] else None,
                    "metadata": json.loads(row["metadata"]) if row["metadata"] else None,
                    "created_at": row["created_at"].isoformat(),
                }
            )

        return events

    except Exception as e:
        logger.error(f"Failed to retrieve events: {e}")
        raise


async def store_memory(
    client_id: int,
    content: str,
    memory_type: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> int:
    """
    Store a memory as an event (wrapper for remember endpoint)

    Args:
        client_id: Client/user ID
        content: Memory content
        memory_type: Type of memory (fact, event, preference, observation)
        metadata: Additional metadata

    Returns:
        Memory ID (event ID)
    """
    payload = {
        "content": content,
        "memory_type": memory_type,
    }

    return await insert_event(
        event_type=f"memory:{memory_type}",
        event_source="memory-gateway",
        client_id=client_id,
        payload=payload,
        metadata=metadata,
    )


async def check_connection() -> bool:
    """Check if Postgres is accessible"""
    if not pool:
        return False

    try:
        async with pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            return result == 1
    except Exception as e:
        logger.error(f"Postgres connection check failed: {e}")
        return False
