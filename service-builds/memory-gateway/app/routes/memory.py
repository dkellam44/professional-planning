"""
Memory API Routes
/remember and /recall endpoints for memory operations
"""

import logging
import time
from fastapi import APIRouter, Query, HTTPException

from app.models import MemoryPayload, MemoryResponse, RecallQuery, RecallResponse
from app.services import postgres, qdrant, valkey

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/remember", response_model=MemoryResponse)
async def remember(payload: MemoryPayload):
    """
    Store a memory (remember endpoint)

    The /remember endpoint accepts memory content and stores it in multiple layers:
    - Postgres: Structured event log for durability and queries
    - Qdrant: Vector embeddings for semantic search
    - Valkey: Short-term cache for frequently accessed memories

    Args:
        payload: Memory content with client_id, content, memory_type, metadata, tags

    Returns:
        MemoryResponse with memory_id and storage layers used
    """
    try:
        start_time = time.time()
        stored_in = []

        # 1. Store in Postgres (primary storage)
        try:
            memory_id = await postgres.store_memory(
                client_id=payload.client_id,
                content=payload.content,
                memory_type=payload.memory_type,
                metadata=payload.metadata,
            )
            stored_in.append("postgres")
            logger.info(f"Memory {memory_id} stored in Postgres")
        except Exception as e:
            logger.error(f"Failed to store in Postgres: {e}")
            raise HTTPException(status_code=500, detail="Database storage failed")

        # 2. Store vector in Qdrant (semantic search)
        try:
            await qdrant.store_memory_vector(
                memory_id=memory_id,
                content=payload.content,
                client_id=payload.client_id,
                memory_type=payload.memory_type,
                metadata=payload.metadata,
            )
            stored_in.append("qdrant")
            logger.info(f"Memory {memory_id} stored in Qdrant")
        except Exception as e:
            logger.error(f"Failed to store in Qdrant: {e}")
            # Don't fail the request, Qdrant is supplementary
            logger.warning("Continuing without Qdrant storage")

        # 3. Cache in Valkey (optional)
        try:
            cache_key = f"memory:{payload.client_id}:{memory_id}"
            await valkey.set_cache(
                cache_key,
                {
                    "memory_id": memory_id,
                    "content": payload.content,
                    "memory_type": payload.memory_type,
                    "metadata": payload.metadata,
                },
            )
            stored_in.append("valkey")
        except Exception as e:
            logger.warning(f"Failed to cache in Valkey: {e}")

        elapsed_ms = (time.time() - start_time) * 1000
        logger.info(f"Memory {memory_id} stored in {len(stored_in)} layers ({elapsed_ms:.1f}ms)")

        return MemoryResponse(
            memory_id=memory_id,
            client_id=payload.client_id,
            stored_in=stored_in,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in /remember: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/recall", response_model=RecallResponse)
async def recall(
    query: str = Query(..., description="Search query"),
    client_id: int = Query(..., description="Client/user ID"),
    k: int = Query(default=10, ge=1, le=100, description="Number of results"),
    memory_type: str = Query(
        default=None,
        description="Optional: filter by memory type (fact, event, preference, observation)",
    ),
):
    """
    Recall memories using semantic search

    The /recall endpoint searches for memories using semantic similarity.
    It searches across:
    - Qdrant: Vector embeddings for semantic similarity matching
    - Valkey: Recent memories from short-term cache (faster)
    - Postgres: Structured queries as fallback

    Args:
        query: Search query (natural language)
        client_id: Client/user ID
        k: Number of results to return (1-100)
        memory_type: Optional filter by memory type

    Returns:
        RecallResponse with ranked list of matching memories and scores
    """
    try:
        start_time = time.time()

        # 1. Try Valkey cache first (fastest)
        cache_key = f"recall:{client_id}:{query}:{memory_type}"
        cached_result = await valkey.get_cache(cache_key)
        if cached_result:
            logger.info(f"Recall cache hit for client {client_id}")
            return RecallResponse(
                query=query,
                client_id=client_id,
                results=cached_result["results"],
                result_count=len(cached_result["results"]),
                search_time_ms=(time.time() - start_time) * 1000,
            )

        # 2. Search in Qdrant (semantic)
        results = []
        try:
            qdrant_results = await qdrant.search_memories(
                query=query,
                client_id=client_id,
                k=k,
                memory_type=memory_type,
            )
            results = qdrant_results
            logger.info(f"Found {len(results)} results in Qdrant for client {client_id}")
        except Exception as e:
            logger.warning(f"Qdrant search failed: {e}")
            logger.info("Falling back to Postgres search")

            # 3. Fallback to Postgres (structured query)
            try:
                events = await postgres.get_events(
                    client_id=client_id,
                    event_type=f"memory:{memory_type}" if memory_type else None,
                    limit=k,
                )

                # Convert to result format
                results = [
                    {
                        "memory_id": event["id"],
                        "content": event["payload"].get("content", ""),
                        "memory_type": event["payload"].get("memory_type", "fact"),
                        "similarity_score": 0.5,  # No score from SQL
                        "stored_at": event["created_at"],
                        "metadata": event.get("metadata", {}),
                    }
                    for event in events
                ]
            except Exception as e2:
                logger.error(f"Postgres fallback also failed: {e2}")
                raise HTTPException(status_code=500, detail="Search failed")

        # Cache the results
        try:
            await valkey.set_cache(
                cache_key,
                {"results": results},
                ttl=3600,  # Cache for 1 hour
            )
        except Exception as e:
            logger.warning(f"Failed to cache recall results: {e}")

        elapsed_ms = (time.time() - start_time) * 1000
        logger.info(f"Recall completed in {elapsed_ms:.1f}ms ({len(results)} results)")

        return RecallResponse(
            query=query,
            client_id=client_id,
            results=results,
            result_count=len(results),
            search_time_ms=elapsed_ms,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in /recall: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")
