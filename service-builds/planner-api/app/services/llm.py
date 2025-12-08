"""LLM + Langfuse utilities for Planner Engine."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Tuple

import httpx
from langfuse import Langfuse
from openai import APIError, APIStatusError, AsyncOpenAI, RateLimitError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)

openrouter = AsyncOpenAI(base_url=settings.openrouter_base_url, api_key=settings.openrouter_api_key)
_http_health_client = httpx.AsyncClient(timeout=5)

langfuse_client: Optional[Langfuse] = None
if settings.langfuse_configured:
    try:
        langfuse_client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("Langfuse client init failed: %s", exc)
        langfuse_client = None

DEFAULT_PROMPT = """
You are Planner Engine, a senior operations consultant. Convert the provided intent, context,
recent preferences, and memory highlights into a structured Standard Operating Procedure (SOP)
JSON document. ALWAYS return strictly valid JSON with the schema below:
{
  "name": "Short plan title",
  "summary": "One paragraph overview",
  "template_type": "Operational",
  "assumptions": ["..."],
  "risks": ["..."],
  "checklist": [
    {
      "step_number": 1,
      "title": "",
      "description": "",
      "estimated_hours": 1.5,
      "dependencies": ["step-id-or-title"],
      "owner": "",
      "tags": [""]
    }
  ],
  "metadata": {
    "intent_keywords": [],
    "engagement_id": null,
    "workflow_id": null
  }
}
If information is missing, make thoughtful assumptions and note them in the `assumptions` array.
"""


def _build_user_prompt(*, intent: str, context: Dict[str, Any], preferences: list[Dict[str, Any]]) -> str:
    """Create a deterministic prompt for Claude."""
    context_json = json.dumps(context, indent=2, ensure_ascii=False)
    preferences_json = json.dumps(preferences, indent=2, ensure_ascii=False)
    return (
        "Generate a process template for the following intent.\n"
        "- Intent: "
        + intent
        + "\n- Structured context JSON:\n"
        + context_json
        + "\n- Memory preferences:\n"
        + preferences_json
        + "\nRespond ONLY with JSON matching the documented schema."
    )


def _start_trace(metadata: Dict[str, Any]):
    if not langfuse_client:
        return None

    try:
        trace = langfuse_client.trace(
            name="planner.generate_sop",
            user_id=str(metadata.get("client_id", "unknown")),
            metadata=metadata,
        )
        generation = trace.generation(
            name="planner.llm",
            model=settings.openrouter_model,
            input=json.dumps(metadata.get("prompt_preview", {}))[:2000],
            metadata={"intent": metadata.get("intent")},
        )
        return trace, generation
    except Exception as exc:  # pragma: no cover
        logger.debug("Langfuse trace creation failed: %s", exc)
        return None


def _end_trace(trace_tuple, *, output: Dict[str, Any], usage: Optional[Dict[str, Any]], status: str, error: Optional[str] = None):
    if not trace_tuple:
        return
    trace, generation = trace_tuple
    try:
        if generation:
            generation.end(
                output=json.dumps(output)[:4000],
                usage=usage or {},
                status=status,
                error=error,
            )
        trace.update(status=status, output=output, error=error)
    except Exception as exc:  # pragma: no cover
        logger.debug("Langfuse trace update failed: %s", exc)


def _format_usage(response) -> Optional[Dict[str, Any]]:
    usage = getattr(response, "usage", None)
    if not usage:
        return None
    return {
        "prompt_tokens": getattr(usage, "prompt_tokens", None),
        "completion_tokens": getattr(usage, "completion_tokens", None),
        "total_tokens": getattr(usage, "total_tokens", None),
    }


def _estimate_cost(usage: Optional[Dict[str, Any]]) -> Optional[float]:
    if not usage:
        return None
    prompt_cost = (usage.get("prompt_tokens") or 0) * settings.prompt_token_cost_usd
    completion_cost = (usage.get("completion_tokens") or 0) * settings.completion_token_cost_usd
    total = round(prompt_cost + completion_cost, 6)
    return total


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=4),
    retry=retry_if_exception_type((RateLimitError, APIError, APIStatusError)),
)
async def _call_openrouter(messages: list[Dict[str, str]]):
    return await openrouter.chat.completions.create(
        model=settings.openrouter_model,
        messages=messages,
        temperature=0.7,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )


async def generate_sop(
    *,
    intent: str,
    context: Dict[str, Any],
    preferences: list[Dict[str, Any]],
    prompt_template: Optional[str],
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Call OpenRouter + Langfuse to build the structured SOP."""
    if not settings.openrouter_api_key:
        raise RuntimeError("Missing OPENROUTER_API_KEY")

    system_prompt = prompt_template or DEFAULT_PROMPT
    user_prompt = _build_user_prompt(intent=intent, context=context, preferences=preferences)

    trace_metadata = {
        "client_id": context.get("client_id"),
        "intent": intent,
        "prompt_preview": {"system": system_prompt[:400], "user": user_prompt[:400]},
    }
    if metadata:
        trace_metadata.update(metadata)

    trace_tuple = _start_trace(trace_metadata)

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        response = await _call_openrouter(messages)
        usage = _format_usage(response)
        sop = _parse_response(response)
        estimated_cost = _estimate_cost(usage)

        _end_trace(trace_tuple, output={"sop": sop, "cost": estimated_cost}, usage=usage, status="success")
        logger.info(
            "Generated SOP via %s (prompt=%s, completion=%s, cost~$%s)",
            settings.openrouter_model,
            usage.get("prompt_tokens") if usage else None,
            usage.get("completion_tokens") if usage else None,
            estimated_cost,
        )
        return sop
    except Exception as exc:
        _end_trace(trace_tuple, output={"error": str(exc)}, usage=None, status="error", error=str(exc))
        logger.exception("LLM generation failed")
        raise


def _parse_response(response) -> Dict[str, Any]:
    """Safely parse JSON responses from the LLM."""
    message = response.choices[0].message
    content = getattr(message, "content", "")
    if isinstance(content, list):  # OpenRouter might return list of content blocks
        content = "".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in content)

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        # attempt to extract JSON block between ``` markers
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(content[start : end + 1])
            except json.JSONDecodeError:
                pass
        raise ValueError("LLM returned non-JSON content")


async def check_health() -> Tuple[bool, str]:
    if not settings.openrouter_api_key:
        return False, "missing-api-key"

    try:
        resp = await _http_health_client.get(f"{settings.openrouter_base_url}/models")
        if resp.status_code < 500:
            return True, "ok"
        return False, f"status-{resp.status_code}"
    except Exception as exc:  # pragma: no cover
        return False, str(exc)


async def close() -> None:
    """Close shared HTTP resources."""
    try:
        await _http_health_client.aclose()
    except Exception:  # pragma: no cover
        pass
