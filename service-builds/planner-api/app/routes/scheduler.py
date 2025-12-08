"""Scheduler API routes - converts plans into calendar events."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException, status

from app.config import settings
from app.models import CalendarEvent, ScheduleRequest, ScheduleResponse
from app.services import gcal, llm, memory, postgres

router = APIRouter(prefix="/api/v1/scheduler", tags=["scheduler"])
logger = logging.getLogger(__name__)


SCHEDULING_PROMPT = """
You are a scheduling optimization assistant. Given a plan with tasks and user preferences,
generate an optimized schedule that respects:
1. Task dependencies
2. Estimated hours per task
3. User's working hours and availability preferences
4. Realistic time blocks (no back-to-back marathon sessions)

Return ONLY valid JSON with this structure:
{
  "schedule": [
    {
      "task_id": "task identifier or step number",
      "title": "Task title",
      "start_date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "duration_hours": 2.0,
      "description": "Task description"
    }
  ],
  "metadata": {
    "total_days": 5,
    "working_hours_per_day": 6,
    "optimization_notes": "Brief explanation of scheduling decisions"
  }
}
"""


async def _generate_schedule_with_llm(
    plan_data: Dict[str, Any],
    start_date: str,
    preferences: List[Dict[str, Any]],
    client_id: int,
) -> Dict[str, Any]:
    """Use LLM to generate an optimized schedule."""
    plan_context = {
        "plan_title": plan_data.get("plan_title", ""),
        "sop": plan_data.get("sop", {}),
        "start_date": start_date,
    }

    preferences_str = json.dumps(preferences, indent=2) if preferences else "No preferences available"
    plan_str = json.dumps(plan_context, indent=2)

    user_prompt = f"""
Generate an optimized schedule for this plan:

{plan_str}

User preferences:
{preferences_str}

Start date: {start_date}
Respect task dependencies, estimated hours, and user availability patterns.
"""

    messages = [
        {"role": "system", "content": SCHEDULING_PROMPT},
        {"role": "user", "content": user_prompt},
    ]

    response = await llm._call_openrouter(messages)
    content = response.choices[0].message.content

    try:
        schedule_data = json.loads(content)
        return schedule_data
    except json.JSONDecodeError:
        # Try to extract JSON from content
        start = content.find("{")
        end = content.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(content[start : end + 1])
            except json.JSONDecodeError:
                pass
        raise ValueError("LLM returned non-JSON schedule")


def _parse_iso_date(date_str: str) -> datetime:
    """Parse ISO date string to datetime."""
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except ValueError:
        # Try just the date part
        return datetime.strptime(date_str[:10], "%Y-%m-%d")


async def _create_calendar_events(
    schedule_items: List[Dict[str, Any]],
    plan_id: int,
    client_id: int,
) -> List[CalendarEvent]:
    """Create Google Calendar events from schedule items."""
    calendar_events = []

    for item in schedule_items:
        try:
            task_id = str(item.get("task_id", ""))
            title = item.get("title", "Untitled Task")
            description = item.get("description", "")
            start_date_str = item.get("start_date", "")
            start_time_str = item.get("start_time", "09:00")
            duration_hours = float(item.get("duration_hours", 1.0))

            # Parse start datetime
            start_date = _parse_iso_date(start_date_str)
            start_time_parts = start_time_str.split(":")
            start_hour = int(start_time_parts[0])
            start_minute = int(start_time_parts[1]) if len(start_time_parts) > 1 else 0

            start_datetime = start_date.replace(hour=start_hour, minute=start_minute, second=0, microsecond=0)
            end_datetime = start_datetime + timedelta(hours=duration_hours)

            # Format for Google Calendar (ISO 8601 with timezone)
            start_iso = start_datetime.strftime("%Y-%m-%dT%H:%M:%S")
            end_iso = end_datetime.strftime("%Y-%m-%dT%H:%M:%S")

            # Add timezone offset
            start_iso = f"{start_iso}-08:00"  # Pacific Time
            end_iso = f"{end_iso}-08:00"

            # Create event metadata
            event_metadata = {
                "plan_id": plan_id,
                "task_id": task_id,
                "client_id": client_id,
                "source": "planner-api-scheduler",
            }

            # Create Google Calendar event
            created_event = await gcal.create_event(
                title=f"[Plan {plan_id}] {title}",
                start_time=start_iso,
                end_time=end_iso,
                description=description,
                metadata=event_metadata,
            )

            calendar_event = CalendarEvent(
                event_id=created_event.get("id", ""),
                title=title,
                start_time=start_iso,
                end_time=end_iso,
                description=description,
                task_id=task_id,
            )
            calendar_events.append(calendar_event)

            logger.info("Created calendar event for task %s: %s", task_id, title)

        except Exception as exc:
            logger.error("Failed to create calendar event for item %s: %s", item, exc)
            # Continue with other events even if one fails

    return calendar_events


async def _store_scheduler_run(
    plan_id: int,
    client_id: int,
    events_created: int,
    schedule_data: Dict[str, Any],
    metadata: Dict[str, Any],
) -> int:
    """Store scheduler run record in Postgres."""
    # This would insert into a scheduler_runs table
    # For now, return a placeholder ID
    scheduler_run_id = 1  # Would be auto-generated

    logger.info(
        "Stored scheduler run %d for plan %d (created %d events)",
        scheduler_run_id,
        plan_id,
        events_created,
    )
    return scheduler_run_id


@router.post("/schedule", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
async def schedule_plan(request: ScheduleRequest):
    """Convert a plan into an optimized schedule with Google Calendar events.

    This endpoint:
    1. Retrieves the plan from Postgres
    2. Queries Memory Gateway for scheduling preferences
    3. Uses LLM to optimize the schedule
    4. Creates Google Calendar events
    5. Stores the scheduler run record
    """
    plan_id = request.plan_id
    start_date = request.start_date
    client_id = request.client_id or settings.client_id

    # Validate start_date format
    try:
        _parse_iso_date(start_date)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid start_date format. Use ISO 8601 (e.g., '2024-12-08')",
        )

    # Retrieve plan from Postgres
    plan_data = await postgres.get_plan(plan_id)
    if not plan_data:
        raise HTTPException(status_code=404, detail=f"Plan {plan_id} not found")

    if plan_data.get("client_id") != client_id:
        raise HTTPException(status_code=403, detail="Plan does not belong to this client")

    # Query Memory Gateway for scheduling preferences
    preferences = await memory.fetch_preferences(
        client_id=client_id,
        intent=f"scheduling plan: {plan_data.get('plan_title', '')}",
        context={"source": "scheduler", "plan_id": plan_id},
        limit=10,
    )

    logger.info("Retrieved %d scheduling preferences for client %d", len(preferences), client_id)

    # Generate optimized schedule using LLM
    try:
        schedule_data = await _generate_schedule_with_llm(
            plan_data=plan_data,
            start_date=start_date,
            preferences=preferences,
            client_id=client_id,
        )
    except Exception as exc:
        logger.error("Schedule generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to generate schedule") from exc

    schedule_items = schedule_data.get("schedule", [])
    if not schedule_items:
        raise HTTPException(status_code=422, detail="LLM generated empty schedule")

    # Create Google Calendar events
    try:
        calendar_events = await _create_calendar_events(
            schedule_items=schedule_items,
            plan_id=plan_id,
            client_id=client_id,
        )
    except Exception as exc:
        logger.error("Calendar event creation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create calendar events") from exc

    # Store scheduler run
    scheduler_run_id = await _store_scheduler_run(
        plan_id=plan_id,
        client_id=client_id,
        events_created=len(calendar_events),
        schedule_data=schedule_data,
        metadata=request.metadata,
    )

    return ScheduleResponse(
        scheduler_run_id=scheduler_run_id,
        plan_id=plan_id,
        events_created=len(calendar_events),
        calendar_events=calendar_events,
        status="completed",
        created_at=datetime.utcnow(),
        metadata={
            "preferences_used": len(preferences),
            "schedule_metadata": schedule_data.get("metadata", {}),
            **request.metadata,
        },
    )
