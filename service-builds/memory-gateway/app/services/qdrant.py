"""
Qdrant Service
Vector search and semantic memory operations
"""

import logging
import hashlib
from typing import Optional, Dict, Any, List
from datetime import datetime

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import httpx

from app.config import Settings

logger = logging.getLogger(__name__)

settings = Settings()

# Global Qdrant client
client: Optional[QdrantClient] = None

VECTOR_SIZE = 1536
COLLECTION_NAME = "events"


async def initialize():
    """Initialize Qdrant client"""
    global client
    try:
        client = QdrantClient(url=settings.qdrant_url)
        # Test connection
        info = client.get_collection(COLLECTION_NAME)
        logger.info(f"Qdrant initialized. Collection '{COLLECTION_NAME}' exists")
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant: {e}")
        raise


async def embed_text(text: str) -> List[float]:
    """
    Generate embeddings for text using OpenAI API via OpenRouter

    Args:
        text: Text to embed

    Returns:
        Vector embedding
    """
    try:
        # Use OpenRouter to access OpenAI's embedding model
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                "https://openrouter.ai/api/v1/embeddings",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "HTTP-Referer": "https://bestviable.com",
                },
                json={
                    "model": "openai/text-embedding-3-small",
                    "input": text,
                },
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()
                embedding = data["data"][0]["embedding"]
                logger.debug(f"Generated embedding for text ({len(embedding)} dims)")
                return embedding
            else:
                logger.error(f"Embedding API error: {response.status_code} - {response.text}")
                raise Exception(f"Failed to generate embedding: {response.status_code}")

    except Exception as e:
        logger.error(f"Failed to embed text: {e}")
        raise


async def store_memory_vector(
    memory_id: int,
    content: str,
    client_id: int,
    memory_type: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Store a memory as a vector in Qdrant

    Args:
        memory_id: Memory ID from Postgres
        content: Memory content
        client_id: Client/user ID
        memory_type: Type of memory
        metadata: Additional metadata

    Returns:
        Success status
    """
    if not client:
        raise RuntimeError("Qdrant client not initialized")

    try:
        # Generate embedding
        embedding = await embed_text(content)

        # Create point with payload
        point = PointStruct(
            id=memory_id,
            vector=embedding,
            payload={
                "memory_id": memory_id,
                "client_id": client_id,
                "content": content,
                "memory_type": memory_type,
                "timestamp": datetime.utcnow().isoformat(),
                **(metadata or {}),
            },
        )

        # Upsert point
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=[point],
        )

        logger.debug(f"Memory {memory_id} stored in Qdrant")
        return True

    except Exception as e:
        logger.error(f"Failed to store memory vector: {e}")
        raise


async def search_memories(
    query: str,
    client_id: int,
    k: int = 10,
    memory_type: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Search for memories using semantic similarity

    Args:
        query: Search query
        client_id: Client/user ID
        k: Number of results
        memory_type: Optional memory type filter

    Returns:
        List of matching memories with scores
    """
    if not client:
        raise RuntimeError("Qdrant client not initialized")

    try:
        # Generate query embedding
        query_embedding = await embed_text(query)

        # Build filter for client_id
        query_filter = {
            "must": [
                {
                    "key": "client_id",
                    "match": {
                        "value": client_id,
                    },
                },
            ],
        }

        # Add memory_type filter if provided
        if memory_type:
            query_filter["must"].append(
                {
                    "key": "memory_type",
                    "match": {
                        "value": memory_type,
                    },
                }
            )

        # Search
        results = client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            query_filter=query_filter,
            limit=k,
            with_payload=True,
        )

        # Format results
        memories = []
        for result in results:
            memories.append(
                {
                    "memory_id": result.payload.get("memory_id"),
                    "content": result.payload.get("content"),
                    "memory_type": result.payload.get("memory_type"),
                    "similarity_score": result.score,
                    "stored_at": result.payload.get("timestamp"),
                    "metadata": {
                        k: v
                        for k, v in result.payload.items()
                        if k
                        not in [
                            "memory_id",
                            "content",
                            "memory_type",
                            "timestamp",
                            "client_id",
                        ]
                    },
                }
            )

        logger.debug(f"Found {len(memories)} memories for query")
        return memories

    except Exception as e:
        logger.error(f"Failed to search memories: {e}")
        raise


async def check_connection() -> bool:
    """Check if Qdrant is accessible"""
    if not client:
        return False

    try:
        client.get_collection(COLLECTION_NAME)
        return True
    except Exception as e:
        logger.error(f"Qdrant connection check failed: {e}")
        return False
