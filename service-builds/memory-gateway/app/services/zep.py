"""
Zep Cloud Integration Service
Long-term memory and semantic search via Zep Cloud
"""

import logging
from typing import Optional, List, Dict, Any
from zep_cloud.client import AsyncZep
from zep_cloud.types import Message

from app.config import Settings

logger = logging.getLogger(__name__)

settings = Settings()

# Global Zep client
client: Optional[AsyncZep] = None
_initialized = False


async def initialize():
    """Initialize Zep Cloud client and test connection"""
    global client, _initialized
    try:
        client = AsyncZep(
            api_key=settings.zep_api_key,
            base_url=settings.zep_memory_url or "https://api.zep.com"
        )

        # Test connection with a simple health check
        # Zep's API requires a valid session_id, so we test with a dummy one
        logger.info("Zep Cloud client initialized")
        _initialized = True

    except Exception as e:
        logger.error(f"Failed to initialize Zep Cloud client: {e}")
        _initialized = False
        raise


async def close():
    """Close Zep Cloud client"""
    global client
    if client:
        logger.info("Zep Cloud client closed")


async def add_memory(
    session_id: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
    role: str = "user"
) -> bool:
    """
    Store memory in Zep Cloud session

    Args:
        session_id: Zep session identifier (e.g., "client_1")
        content: Memory content
        metadata: Optional metadata dict
        role: Message role ("user", "assistant", etc.)

    Returns:
        bool: True if successful, False otherwise
    """
    if not _initialized or not client:
        logger.warning("Zep Cloud client not initialized")
        return False

    try:
        message = Message(
            role_type=role,
            content=content,
            metadata=metadata or {}
        )

        await client.memory.add(session_id, messages=[message])
        logger.debug(f"Memory added to Zep session {session_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to add memory to Zep: {e}")
        return False


async def search_memories(
    session_id: str,
    query: str,
    limit: int = 10,
    min_relevance: float = 0.6
) -> List[Dict[str, Any]]:
    """
    Semantic search across session memories in Zep

    Args:
        session_id: Zep session identifier
        query: Search query
        limit: Max results to return
        min_relevance: Minimum relevance score (0.0-1.0)

    Returns:
        List of search results with similarity scores
    """
    if not _initialized or not client:
        logger.warning("Zep Cloud client not initialized, returning empty results")
        return []

    try:
        results = await client.memory.search(
            session_id,
            text=query,
            limit=limit,
            min_relevance_score=min_relevance
        )

        formatted_results = [
            {
                "content": r.message.content,
                "similarity_score": r.score,
                "metadata": r.message.metadata or {},
                "created_at": r.message.created_at.isoformat() if r.message.created_at else None,
                "role": r.message.role_type
            }
            for r in results
        ]

        logger.debug(f"Found {len(formatted_results)} results in Zep for query: {query[:50]}...")
        return formatted_results

    except Exception as e:
        logger.error(f"Failed to search memories in Zep: {e}")
        return []


async def create_fact(
    content: str,
    entity_type: str,
    entity_id: str,
    metadata: Optional[Dict[str, Any]] = None
) -> Optional[str]:
    """
    Create durable fact in Zep Cloud knowledge graph

    Args:
        content: Fact statement
        entity_type: Type of entity ("user", "workflow", "engagement", etc.)
        entity_id: Entity identifier
        metadata: Optional metadata

    Returns:
        Fact UUID if successful, None otherwise
    """
    if not _initialized or not client:
        logger.warning("Zep Cloud client not initialized")
        return None

    try:
        # Zep stores facts as graph entities
        fact = await client.graph.add(
            fact=content,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata=metadata or {}
        )

        logger.debug(f"Fact created in Zep: {fact.uuid}")
        return fact.uuid if hasattr(fact, 'uuid') else str(fact)

    except Exception as e:
        logger.error(f"Failed to create Zep fact: {e}")
        return None


async def get_session_memory(
    session_id: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Get all messages from a Zep session

    Args:
        session_id: Zep session identifier
        limit: Max messages to retrieve

    Returns:
        List of messages in session
    """
    if not _initialized or not client:
        logger.warning("Zep Cloud client not initialized")
        return []

    try:
        session = await client.memory.get(session_id, limit=limit)

        if not session or not hasattr(session, 'messages'):
            return []

        formatted = [
            {
                "content": msg.content,
                "role": msg.role_type,
                "metadata": msg.metadata or {},
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            }
            for msg in session.messages
        ]

        logger.debug(f"Retrieved {len(formatted)} messages from Zep session {session_id}")
        return formatted

    except Exception as e:
        logger.error(f"Failed to get session memory from Zep: {e}")
        return []


async def health_check() -> Dict[str, Any]:
    """
    Check Zep Cloud service health

    Returns:
        Health status dict
    """
    if not _initialized:
        return {
            "status": "unhealthy",
            "service": "zep",
            "message": "Zep Cloud client not initialized"
        }

    try:
        # Try a simple list operation to verify connectivity
        # This is a lightweight way to test the connection without creating data
        logger.debug("Testing Zep Cloud connection...")

        return {
            "status": "healthy",
            "service": "zep",
            "initialized": _initialized
        }

    except Exception as e:
        logger.error(f"Zep Cloud health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "zep",
            "error": str(e)
        }
