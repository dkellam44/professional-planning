"""Planner API routes."""
from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, status
from openai import RateLimitError

from app.config import settings
from app.models import PlanRequest, PlanResponse, PlannerContext
from app.services import llm, memory, postgres

router = APIRouter(prefix="/api/v1/planner", tags=["planner"])
logger = logging.getLogger(__name__)


@router.post("/plan", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def generate_plan(request: PlanRequest):
    """Transform natural-language intent into a structured SOP."""
    intent = request.intent.strip()
    if not intent:
        raise HTTPException(status_code=400, detail="Intent cannot be empty")

    context_dict = _normalize_context(request.context)
    client_id = context_dict.get("client_id") or request.metadata.get("client_id") or settings.client_id
    context_dict["client_id"] = client_id

    preferences = await memory.fetch_preferences(client_id=client_id, intent=intent, context=context_dict)

    prompt_template = None
    try:
        template = await postgres.get_prompt_template("sop_generator")
        prompt_template = template.content if template else None
    except Exception as exc:
        logger.warning("Prompt template lookup failed: %s", exc)

    plan_metadata = {"preferences_used": len(preferences), **request.metadata}
    llm_metadata = {
        "client_id": client_id,
        "engagement_id": context_dict.get("engagement_id"),
        "workflow_id": context_dict.get("workflow_id"),
    }

    try:
        sop = await llm.generate_sop(
            intent=intent,
            context=context_dict,
            preferences=preferences,
            prompt_template=prompt_template,
            metadata=llm_metadata,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RateLimitError as exc:  # type: ignore[name-defined]
        raise HTTPException(status_code=503, detail="LLM service temporarily unavailable") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to generate SOP") from exc

    plan_title = request.plan_title or sop.get("name") or f"Plan for {intent[:50]}"

    record = await postgres.insert_plan(
        plan_title=plan_title,
        intent=intent,
        sop=sop,
        client_id=client_id,
        metadata=plan_metadata,
    )

    logger.info("Plan %s created for client %s", record["id"], client_id)

    return PlanResponse(
        plan_id=record["id"],
        plan_title=plan_title,
        status=record["status"],
        client_id=client_id,
        sop=sop,
        created_at=record["created_at"],
        metadata=plan_metadata,
    )


def _normalize_context(context: Any) -> Dict[str, Any]:
    if context is None:
        return {}
    if isinstance(context, PlannerContext):
        return context.model_dump()
    if isinstance(context, dict):
        return context
    return {}
