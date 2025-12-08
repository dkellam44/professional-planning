"""Pydantic models used across the Planner API service."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, constr


# ============================================================
# PLANNER MODELS
# ============================================================


class PlannerContext(BaseModel):
    """Optional metadata supplied by the caller."""

    client_id: Optional[int] = Field(default=None, description="Overrides default client id")
    engagement_id: Optional[str] = None
    workflow_id: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[str] = None
    channel: Optional[str] = None
    extra: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"extra": "allow"}


class PlanRequest(BaseModel):
    """Incoming plan generation payload."""

    intent: constr(strip_whitespace=True, min_length=1)
    plan_title: Optional[str] = None
    context: PlannerContext | Dict[str, Any] | None = Field(
        default=None, description="Optional structured context metadata"
    )
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SOPTask(BaseModel):
    """Single task/step within the SOP."""

    step_number: int
    title: str
    description: str
    estimated_hours: Optional[float] = None
    dependencies: List[str] = Field(default_factory=list)
    owner: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

    model_config = {"extra": "allow"}


class SOPDocument(BaseModel):
    """Structured SOP output."""

    name: str
    summary: Optional[str] = None
    template_type: str = "Operational"
    checklist: List[SOPTask] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    model_config = {"extra": "allow"}


class PlanResponse(BaseModel):
    """Response payload returned to callers."""

    plan_id: int
    plan_title: str
    status: str
    client_id: int
    sop: SOPDocument | Dict[str, Any]
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================
# SCHEDULER MODELS
# ============================================================


class ScheduleRequest(BaseModel):
    """Incoming schedule generation payload."""

    plan_id: int
    start_date: str = Field(description="ISO 8601 date string (e.g., '2024-12-08')")
    client_id: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CalendarEvent(BaseModel):
    """Represents a single calendar event."""

    event_id: str
    title: str
    start_time: str
    end_time: str
    description: Optional[str] = None
    task_id: Optional[str] = None


class ScheduleResponse(BaseModel):
    """Response payload for schedule generation."""

    scheduler_run_id: int
    plan_id: int
    events_created: int
    calendar_events: List[CalendarEvent]
    status: str
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================
# OBSERVER MODELS
# ============================================================


class ReflectionRequest(BaseModel):
    """Incoming reflection request payload."""

    mode: str = Field(description="daily or weekly")
    client_id: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ReflectionResponse(BaseModel):
    """Response payload for reflection generation."""

    reflection_id: int
    mode: str
    client_id: int
    reflection_text: str
    facts_extracted: int
    status: str
    created_at: Optional[datetime] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ============================================================
# HEALTH MODELS
# ============================================================


class HealthDependency(BaseModel):
    name: str
    status: str
    details: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    dependencies: List[HealthDependency]
    timestamp: datetime


# ============================================================
# UTILITY MODELS
# ============================================================


class PromptTemplate(BaseModel):
    name: str
    version: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
