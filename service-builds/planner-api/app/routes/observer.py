"""Observer API routes - generates reflections from events and execution data."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.config import settings
from app.models import ReflectionRequest, ReflectionResponse
from app.services import fact_extractor, llm, memory, postgres

router = APIRouter(prefix="/api/v1/observer", tags=["observer"])
logger = logging.getLogger(__name__)


REFLECTION_PROMPT = """
You are a reflective assistant that helps users learn from their experiences.

Given recent events and execution data, generate a thoughtful reflection that:
1. Summarizes what happened
2. Identifies patterns and trends
3. Highlights successes and challenges
4. Suggests actionable improvements
5. Extracts key insights

Your reflection should be:
- Constructive and encouraging
- Specific and evidence-based
- Forward-looking
- Actionable

Return ONLY valid JSON:
{
  "reflection": "The full reflection text (2-3 paragraphs)",
  "key_insights": [
    "Specific insight 1",
    "Specific insight 2"
  ],
  "patterns_observed": [
    "Pattern 1",
    "Pattern 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "metadata": {
    "tone": "encouraging|neutral|concerned",
    "confidence": 0.0-1.0
  }
}
"""


async def _query_recent_events(
    client_id: int,
    days_back: int,
) -> List[Dict[str, Any]]:
    """Query recent events from Postgres.

    This would query an events table that tracks user activities.
    For now, returns placeholder data.
    """
    # In production, this would query:
    # SELECT * FROM events WHERE client_id = $1 AND created_at >= NOW() - INTERVAL '$2 days'
    logger.info("Querying events for client %d over last %d days", client_id, days_back)

    # Placeholder data
    events = [
        {
            "event_id": 1,
            "event_type": "task_completed",
            "description": "Completed planning session",
            "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
        },
    ]
    return events


async def _query_execution_runs(
    client_id: int,
    days_back: int,
) -> List[Dict[str, Any]]:
    """Query execution runs for variance analysis.

    This would query execution_runs table to analyze plan vs actual.
    For now, returns placeholder data.
    """
    logger.info("Querying execution runs for client %d over last %d days", client_id, days_back)

    # Placeholder data
    execution_runs = [
        {
            "run_id": 1,
            "plan_id": 1,
            "estimated_hours": 8.0,
            "actual_hours": 10.5,
            "variance": 2.5,
            "status": "completed",
            "created_at": (datetime.utcnow() - timedelta(days=1)).isoformat(),
        },
    ]
    return execution_runs


async def _generate_reflection_with_llm(
    events: List[Dict[str, Any]],
    execution_runs: List[Dict[str, Any]],
    mode: str,
    client_id: int,
) -> Dict[str, Any]:
    """Use LLM to generate a reflection."""
    events_str = json.dumps(events, indent=2) if events else "No recent events"
    execution_str = json.dumps(execution_runs, indent=2) if execution_runs else "No execution data"

    user_prompt = f"""
Generate a {mode} reflection based on this data:

Recent Events ({len(events)} events):
{events_str}

Execution Runs ({len(execution_runs)} runs):
{execution_str}

Analyze patterns, variance between planned and actual time, and provide constructive insights.
"""

    messages = [
        {"role": "system", "content": REFLECTION_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    response = await llm._call_openrouter(messages)
    content = response.choices[0].message.content

    try:
        reflection_data = json.loads(content)
        return reflection_data
    except json.JSONDecodeError:
        # Try to extract JSON from content
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(content[start : end + 1])
            except json.JSONDecodeError:
                pass
        raise ValueError("LLM returned non-JSON reflection")


async def _store_reflection(
    client_id: int,
    mode: str,
    reflection_text: str,
    reflection_data: Dict[str, Any],
    metadata: Dict[str, Any],
) -> int:
    """Store reflection in Postgres.

    This would insert into a reflections table.
    For now, returns a placeholder ID.
    """
    reflection_id = 1  # Would be auto-generated

    logger.info("Stored %s reflection %d for client %d", mode, reflection_id, client_id)
    return reflection_id


async def _sync_reflection_to_memory(
    reflection_id: int,
    reflection_text: str,
    client_id: int,
) -> None:
    """Store reflection in Memory Gateway.

    This allows the reflection to be recalled in future planning sessions.
    """
    logger.info("Syncing reflection %d to Memory Gateway for client %d", reflection_id, client_id)

    # Placeholder - would make HTTP call to Memory Gateway
    # await memory.store_memory(
    #     client_id=client_id,
    #     memory_type="reflection",
    #     content=reflection_text,
    #     metadata={"reflection_id": reflection_id},
    # )


@router.post("/reflect", response_model=ReflectionResponse, status_code=status.HTTP_201_CREATED)
async def generate_reflection(
    mode: str = Query(..., description="Reflection mode: daily or weekly"),
    client_id: Optional[int] = Query(None, description="Client ID (optional)"),
    metadata: Optional[str] = Query(None, description="Optional metadata as JSON string"),
):
    """Generate a reflection from recent events and execution data.

    This endpoint:
    1. Queries recent events from Postgres (24h for daily, 7d for weekly)
    2. Queries execution_runs for variance analysis
    3. Uses LLM to generate a thoughtful reflection
    4. Stores the reflection in Memory Gateway
    5. Extracts high-salience insights as facts

    Args:
        mode: 'daily' (24 hours) or 'weekly' (7 days)
        client_id: Optional client ID (uses default if not provided)
        metadata: Optional metadata as JSON string
    """
    # Validate mode
    if mode not in ["daily", "weekly"]:
        raise HTTPException(
            status_code=400,
            detail="Mode must be 'daily' or 'weekly'",
        )

    client_id = client_id or settings.client_id

    # Parse metadata if provided
    metadata_dict = {}
    if metadata:
        try:
            metadata_dict = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid metadata JSON")

    # Determine time window
    days_back = 1 if mode == "daily" else 7
    logger.info("Generating %s reflection for client %d (looking back %d days)", mode, client_id, days_back)

    # Query recent events
    events = await _query_recent_events(client_id=client_id, days_back=days_back)

    # Query execution runs
    execution_runs = await _query_execution_runs(client_id=client_id, days_back=days_back)

    # Generate reflection using LLM
    try:
        reflection_data = await _generate_reflection_with_llm(
            events=events,
            execution_runs=execution_runs,
            mode=mode,
            client_id=client_id,
        )
    except Exception as exc:
        logger.error("Reflection generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to generate reflection") from exc

    reflection_text = reflection_data.get("reflection", "")
    if not reflection_text:
        raise HTTPException(status_code=422, detail="LLM generated empty reflection")

    # Store reflection
    reflection_id = await _store_reflection(
        client_id=client_id,
        mode=mode,
        reflection_text=reflection_text,
        reflection_data=reflection_data,
        metadata=metadata_dict,
    )

    # Sync to Memory Gateway
    await _sync_reflection_to_memory(
        reflection_id=reflection_id,
        reflection_text=reflection_text,
        client_id=client_id,
    )

    # Extract high-salience insights as facts
    facts = []
    try:
        # Combine key insights and patterns as content for fact extraction
        fact_content = f"""
Reflection: {reflection_text}

Key Insights:
{json.dumps(reflection_data.get('key_insights', []), indent=2)}

Patterns Observed:
{json.dumps(reflection_data.get('patterns_observed', []), indent=2)}
"""
        facts = await fact_extractor.extract_facts_from_reflection(
            reflection_text=fact_content,
            client_id=client_id,
            reflection_id=reflection_id,
        )
    except Exception as exc:
        logger.warning("Fact extraction from reflection failed: %s", exc)
        # Don't fail the whole request if fact extraction fails

    return ReflectionResponse(
        reflection_id=reflection_id,
        mode=mode,
        client_id=client_id,
        reflection_text=reflection_text,
        facts_extracted=len(facts),
        status="completed",
        created_at=datetime.utcnow(),
        metadata={
            "events_analyzed": len(events),
            "execution_runs_analyzed": len(execution_runs),
            "key_insights": reflection_data.get("key_insights", []),
            "patterns_observed": reflection_data.get("patterns_observed", []),
            "recommendations": reflection_data.get("recommendations", []),
            **metadata_dict,
        },
    )
