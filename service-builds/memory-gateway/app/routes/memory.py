"""
Memory API Routes
/remember and /recall endpoints for memory operations
"""

import logging
import time
from fastapi import APIRouter, Query, HTTPException

from app.config import Settings
from app.models import (
    MemoryPayload,
    MemoryResponse,
    RecallQuery,
    RecallResponse,
    FactPayload,
    FactResponse,
)
from app.services import postgres, qdrant, valkey, zep

settings = Settings()
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

        # 2. Store in Zep Cloud (if enabled)
        zep_session_id = None
        if settings.zep_memory_enabled:
            try:
                zep_session_id = f"client_{payload.client_id}"
                success = await zep.add_memory(
                    session_id=zep_session_id,
                    content=payload.content,
                    metadata={
                        "memory_id": memory_id,
                        "memory_type": payload.memory_type,
                        **payload.metadata,
                    },
                )
                if success:
                    stored_in.append("zep")
                    logger.info(f"Memory {memory_id} stored in Zep Cloud")
            except Exception as e:
                logger.error(f"Failed to store in Zep Cloud: {e}")
                # Don't fail the request, Zep is supplementary
                logger.warning("Continuing without Zep Cloud storage")

        # 3. Store vector in Qdrant (semantic search)
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

        # 4. Cache in Valkey (optional)
        try:
            cache_key = f"memory:{payload.client_id}:{memory_id}"
            await valkey.set_cache(
                cache_key,
                {
                    "memory_id": memory_id,
                    "content": payload.content,
                    "memory_type": payload.memory_type,
                    "metadata": payload.metadata,
                    "zep_session_id": zep_session_id,
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

        # 2. Search in Zep Cloud (if enabled, highest quality semantic search)
        results = []
        if settings.zep_memory_enabled:
            try:
                zep_session_id = f"client_{client_id}"
                zep_results = await zep.search_memories(
                    session_id=zep_session_id,
                    query=query,
                    limit=k,
                    min_relevance=0.6,
                )
                results = [
                    {
                        "memory_id": r["metadata"].get("memory_id", "unknown"),
                        "content": r["content"],
                        "memory_type": r["metadata"].get("memory_type", "fact"),
                        "similarity_score": r["similarity_score"],
                        "stored_at": r["created_at"],
                        "metadata": r["metadata"],
                        "source": "zep",
                    }
                    for r in zep_results
                ]
                logger.info(f"Found {len(results)} results in Zep Cloud for client {client_id}")
            except Exception as e:
                logger.warning(f"Zep Cloud search failed: {e}")
                logger.info("Falling back to Qdrant search")

        # 3. Fallback to Qdrant (if no Zep results)
        if not results:
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

                # 4. Final fallback to Postgres (structured query)
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
                            "source": "postgres",
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


@router.post("/facts", response_model=FactResponse, status_code=201)
async def create_fact(payload: FactPayload):
    """
    Create a durable fact in Zep Cloud knowledge graph

    Durable facts are long-term statements about entities (users, workflows, etc.)
    that should be retained and retrieved for contextual reasoning.

    Args:
        payload: Fact content, entity type, entity ID, and type

    Returns:
        FactResponse with fact ID and storage layers used
    """
    try:
        start_time = time.time()
        stored_in = []
        fact_id = None

        # 1. Create fact in Zep Cloud (if enabled)
        if settings.zep_memory_enabled:
            try:
                zep_fact_id = await zep.create_fact(
                    content=payload.content,
                    entity_type=payload.entity_type,
                    entity_id=payload.entity_id,
                    metadata=payload.metadata,
                )
                if zep_fact_id:
                    fact_id = zep_fact_id
                    stored_in.append("zep")
                    logger.info(f"Fact created in Zep Cloud: {zep_fact_id}")
            except Exception as e:
                logger.error(f"Failed to create fact in Zep Cloud: {e}")
                # Don't fail the request, Zep is supplementary

        # 2. Store in Postgres (optional, for audit trail)
        try:
            # If we have a fact_id from Zep, use it; otherwise generate one
            if not fact_id:
                fact_id = f"{payload.entity_type}_{payload.entity_id}_{int(time.time())}"

            # Store metadata about the fact creation
            await postgres.store_memory(
                client_id=0,  # Use 0 for system-level facts
                content=payload.content,
                memory_type=f"fact:{payload.fact_type}",
                metadata={
                    "fact_id": fact_id,
                    "entity_type": payload.entity_type,
                    "entity_id": payload.entity_id,
                    "fact_type": payload.fact_type,
                    **(payload.metadata or {}),
                },
            )
            stored_in.append("postgres")
            logger.info(f"Fact audit logged in Postgres: {fact_id}")
        except Exception as e:
            logger.warning(f"Failed to log fact in Postgres: {e}")

        elapsed_ms = (time.time() - start_time) * 1000
        logger.info(f"Fact {fact_id} created in {len(stored_in)} layers ({elapsed_ms:.1f}ms)")

        return FactResponse(
            fact_id=fact_id or "unknown",
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            fact_type=payload.fact_type,
            content=payload.content,
            stored_in=stored_in,
        )

    except Exception as e:
        logger.error(f"Unexpected error in /facts: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create fact")
