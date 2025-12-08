"""Fact extraction service for converting observations into durable facts."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from openai import AsyncOpenAI
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings
from app.services import memory, postgres

logger = logging.getLogger(__name__)

openrouter = AsyncOpenAI(base_url=settings.openrouter_base_url, api_key=settings.openrouter_api_key)

FACT_EXTRACTION_PROMPT = """
You are a fact extraction assistant. Your job is to analyze observations, events, or reflections
and extract high-salience, durable facts that should be stored in long-term memory.

A good fact is:
1. Objectively true (not an opinion or speculation)
2. Durable (will remain relevant for weeks/months)
3. Actionable or contextually important
4. Specific and concrete

Extract facts from the provided content. Return ONLY a JSON array of fact objects:
[
  {
    "fact_text": "The specific fact statement",
    "category": "preference|behavior|constraint|outcome",
    "salience": 0.0-1.0,
    "tags": ["tag1", "tag2"]
  }
]

If no meaningful facts can be extracted, return an empty array [].
"""


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type(Exception),
)
async def _call_llm_for_facts(content: str, context: Optional[Dict[str, Any]] = None) -> str:
    """Call LLM to extract facts from content."""
    context_str = json.dumps(context, indent=2) if context else "No additional context"

    user_prompt = f"""
Content to analyze:
{content}

Additional context:
{context_str}

Extract durable facts from this content.
"""

    messages = [
        {"role": "system", "content": FACT_EXTRACTION_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    response = await openrouter.chat.completions.create(
        model=settings.openrouter_model,
        messages=messages,
        temperature=0.3,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )

    return response.choices[0].message.content


async def extract_facts_from_event(
    event_id: int,
    client_id: int,
) -> List[Dict[str, Any]]:
    """Extract facts from a specific event stored in Postgres.

    Args:
        event_id: Event ID in the events table
        client_id: Client ID for the event

    Returns:
        List of extracted facts
    """
    # This would query the events table (which needs to be created)
    # For now, this is a placeholder
    logger.info("Extracting facts from event %d for client %d", event_id, client_id)

    # Placeholder - in real implementation, would query event from Postgres
    event_data = {"event_id": event_id, "description": "placeholder"}

    return await extract_facts_from_text(
        content=str(event_data),
        client_id=client_id,
        context={"source": "event", "event_id": event_id},
    )


async def extract_facts_from_reflection(
    reflection_text: str,
    client_id: int,
    reflection_id: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Extract facts from a reflection text.

    Args:
        reflection_text: The reflection content
        client_id: Client ID
        reflection_id: Optional reflection ID for context

    Returns:
        List of extracted facts
    """
    context = {"source": "reflection"}
    if reflection_id:
        context["reflection_id"] = reflection_id

    return await extract_facts_from_text(
        content=reflection_text,
        client_id=client_id,
        context=context,
    )


async def extract_facts_from_text(
    content: str,
    client_id: int,
    context: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """Extract facts from arbitrary text content.

    Args:
        content: Text content to analyze
        client_id: Client ID
        context: Optional context metadata

    Returns:
        List of extracted facts
    """
    if not settings.openrouter_api_key:
        logger.warning("OpenRouter API key not configured, skipping fact extraction")
        return []

    try:
        # Call LLM to extract facts
        llm_response = await _call_llm_for_facts(content, context)

        # Parse response
        try:
            facts_data = json.loads(llm_response)
            # Handle both array response and object with facts key
            if isinstance(facts_data, dict) and "facts" in facts_data:
                facts = facts_data["facts"]
            elif isinstance(facts_data, list):
                facts = facts_data
            else:
                logger.warning("Unexpected fact extraction response format")
                return []
        except json.JSONDecodeError as exc:
            logger.error("Failed to parse fact extraction response: %s", exc)
            return []

        if not facts:
            logger.info("No facts extracted from content")
            return []

        # Store facts in Postgres
        stored_facts = []
        for fact in facts:
            fact_record = await store_fact(
                fact_text=fact.get("fact_text", ""),
                category=fact.get("category", "unknown"),
                salience=fact.get("salience", 0.5),
                tags=fact.get("tags", []),
                client_id=client_id,
                metadata=context or {},
            )
            stored_facts.append(fact_record)

        # Sync high-salience facts to Memory Gateway (Zep Cloud)
        high_salience_facts = [f for f in stored_facts if f.get("salience", 0) >= 0.7]
        if high_salience_facts:
            await sync_facts_to_memory(high_salience_facts, client_id)

        logger.info("Extracted and stored %d facts (%d high-salience)", len(facts), len(high_salience_facts))
        return stored_facts

    except Exception as exc:
        logger.error("Fact extraction failed: %s", exc)
        return []


async def store_fact(
    fact_text: str,
    category: str,
    salience: float,
    tags: List[str],
    client_id: int,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Store a fact in the Postgres facts table.

    Args:
        fact_text: The fact content
        category: Fact category (preference, behavior, constraint, outcome)
        salience: Importance score (0.0-1.0)
        tags: List of tags
        client_id: Client ID
        metadata: Optional metadata

    Returns:
        Stored fact record
    """
    # This requires a facts table in Postgres
    # For now, return a placeholder
    fact_record = {
        "id": -1,  # Would be auto-generated
        "fact_text": fact_text,
        "category": category,
        "salience": salience,
        "tags": tags,
        "client_id": client_id,
        "metadata": metadata or {},
        "created_at": "2024-12-07T00:00:00",  # Would be NOW()
    }

    logger.info("Stored fact: %s (salience: %.2f)", fact_text[:50], salience)
    return fact_record


async def sync_facts_to_memory(
    facts: List[Dict[str, Any]],
    client_id: int,
) -> None:
    """Sync high-salience facts to Memory Gateway (Zep Cloud).

    Args:
        facts: List of fact records to sync
        client_id: Client ID
    """
    # This would call the Memory Gateway to store facts as memories
    # Memory Gateway would then sync to Zep Cloud
    logger.info("Syncing %d facts to Memory Gateway for client %d", len(facts), client_id)

    # Placeholder - would make HTTP call to Memory Gateway
    # for fact in facts:
    #     await memory.store_memory(
    #         client_id=client_id,
    #         memory_type="fact",
    #         content=fact["fact_text"],
    #         metadata={
    #             "category": fact["category"],
    #             "salience": fact["salience"],
    #             "tags": fact["tags"],
    #         },
    #     )
