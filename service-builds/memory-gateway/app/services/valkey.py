"""
Valkey Service
Short-term memory cache with TTL
"""

import logging
import json
from typing import Optional, Dict, Any
import redis.asyncio as redis

from app.config import Settings

logger = logging.getLogger(__name__)

settings = Settings()

# Global Redis/Valkey connection
cache: Optional[redis.Redis] = None

DEFAULT_TTL = 86400  # 24 hours


async def initialize():
    """Initialize Valkey connection"""
    global cache
    try:
        cache = await redis.from_url(
            f"redis://{settings.valkey_host}:{settings.valkey_port}/{settings.valkey_db}",
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=10,
            socket_keepalive=True,
            retry_on_timeout=True,
        )
        await cache.ping()
        logger.info("Valkey cache initialized")
    except Exception as e:
        logger.error(f"Failed to initialize Valkey: {e}")
        raise


async def close():
    """Close Valkey connection"""
    global cache
    if cache:
        await cache.close()
        logger.info("Valkey cache closed")


async def set_cache(
    key: str,
    value: Dict[str, Any],
    ttl: int = DEFAULT_TTL,
) -> bool:
    """
    Set value in cache

    Args:
        key: Cache key
        value: Value to cache (will be JSON-serialized)
        ttl: Time to live in seconds

    Returns:
        Success status
    """
    if not cache:
        raise RuntimeError("Valkey cache not initialized")

    try:
        serialized = json.dumps(value)
        await cache.setex(key, ttl, serialized)
        logger.debug(f"Set cache key: {key} (TTL: {ttl}s)")
        return True
    except Exception as e:
        logger.error(f"Failed to set cache: {e}")
        return False


async def get_cache(key: str) -> Optional[Dict[str, Any]]:
    """
    Get value from cache

    Args:
        key: Cache key

    Returns:
        Cached value or None if not found
    """
    if not cache:
        raise RuntimeError("Valkey cache not initialized")

    try:
        value = await cache.get(key)
        if value:
            logger.debug(f"Cache hit: {key}")
            return json.loads(value)
        else:
            logger.debug(f"Cache miss: {key}")
            return None
    except Exception as e:
        logger.error(f"Failed to get cache: {e}")
        return None


async def delete_cache(key: str) -> bool:
    """
    Delete value from cache

    Args:
        key: Cache key

    Returns:
        Success status
    """
    if not cache:
        raise RuntimeError("Valkey cache not initialized")

    try:
        await cache.delete(key)
        logger.debug(f"Deleted cache key: {key}")
        return True
    except Exception as e:
        logger.error(f"Failed to delete cache: {e}")
        return False


async def clear_client_cache(client_id: int) -> bool:
    """
    Clear all cache entries for a client

    Args:
        client_id: Client/user ID

    Returns:
        Success status
    """
    if not cache:
        raise RuntimeError("Valkey cache not initialized")

    try:
        pattern = f"recall:{client_id}:*"
        cursor = 0
        deleted_count = 0

        while True:
            cursor, keys = await cache.scan(cursor, match=pattern, count=100)
            if keys:
                await cache.delete(*keys)
                deleted_count += len(keys)
            if cursor == 0:
                break

        logger.debug(f"Cleared {deleted_count} cache entries for client {client_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to clear client cache: {e}")
        return False


async def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache statistics

    Returns:
        Cache stats (size, memory usage, etc.)
    """
    if not cache:
        raise RuntimeError("Valkey cache not initialized")

    try:
        info = await cache.info()
        return {
            "used_memory": info.get("used_memory"),
            "used_memory_human": info.get("used_memory_human"),
            "total_system_memory": info.get("total_system_memory"),
            "connected_clients": info.get("connected_clients"),
            "total_connections_received": info.get("total_connections_received"),
        }
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        return {}


async def check_connection() -> bool:
    """Check if Valkey is accessible"""
    if not cache:
        return False

    try:
        await cache.ping()
        return True
    except Exception as e:
        logger.error(f"Valkey connection check failed: {e}")
        return False
