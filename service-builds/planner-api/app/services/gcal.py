"""Google Calendar integration service."""
from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

from app.config import settings

logger = logging.getLogger(__name__)

# Google Calendar API scopes
SCOPES = ["https://www.googleapis.com/auth/calendar"]

_service = None
_credentials = None


async def initialize() -> None:
    """Initialize Google Calendar service."""
    global _service, _credentials

    if _service is not None:  # Allow reinitialization after OAuth
        # Only return if service was already initialized before
        try:
            check_ok, _ = await check_health()
            if check_ok:
                return
        except Exception:
            pass

    try:
        _credentials = load_credentials()
        _service = build("calendar", "v3", credentials=_credentials)
        logger.info("Google Calendar service initialized")
    except Exception as exc:
        logger.warning("Google Calendar initialization failed: %s", exc)
        _service = None
        _credentials = None


def load_credentials() -> Optional[Credentials]:
    """Load Google Calendar credentials from JSON file.

    This function looks for credentials at the path specified in settings.
    In production, this should be mounted as a volume in Docker.

    Returns:
        Credentials object if found and valid, None if OAuth not yet completed.

    Raises:
        FileNotFoundError: If client secrets file not found.
    """
    creds = None
    token_path = settings.gcal_credentials_path.replace(".json", "_token.json")

    # Check if we have a saved token
    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    # If no valid credentials, check if we can refresh
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        # Save refreshed credentials
        with open(token_path, "w") as token:
            token.write(creds.to_json())

    # If still no valid credentials, return None (OAuth flow not completed yet)
    if not creds or not creds.valid:
        logger.warning("Google Calendar: No valid token found at %s. Complete OAuth flow first.", token_path)
        return None

    return creds


async def check_health() -> Tuple[bool, str]:
    """Validate Google Calendar service readiness."""
    if not _service:
        return False, "service-not-initialized"

    try:
        # Try to list calendars as a health check
        calendar_list = _service.calendarList().list(maxResults=1).execute()
        return True, "ok"
    except Exception as exc:
        logger.warning("Google Calendar health check failed: %s", exc)
        return False, str(exc)


async def get_events(
    days_ahead: int = 14,
    calendar_id: str = "primary",
) -> List[Dict[str, Any]]:
    """Retrieve upcoming events from Google Calendar.

    Args:
        days_ahead: Number of days to look ahead
        calendar_id: Calendar ID (default: 'primary')

    Returns:
        List of event dictionaries
    """
    if not _service:
        raise RuntimeError("Google Calendar service not initialized")

    now = datetime.utcnow()
    time_max = now + timedelta(days=days_ahead)

    try:
        events_result = (
            _service.events()
            .list(
                calendarId=calendar_id,
                timeMin=now.isoformat() + "Z",
                timeMax=time_max.isoformat() + "Z",
                singleEvents=True,
                orderBy="startTime",
            )
            .execute()
        )

        events = events_result.get("items", [])
        logger.info("Retrieved %d events from Google Calendar", len(events))
        return events
    except Exception as exc:
        logger.error("Failed to retrieve events: %s", exc)
        raise


async def create_event(
    title: str,
    start_time: str,
    end_time: str,
    description: Optional[str] = None,
    calendar_id: str = "primary",
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a new event in Google Calendar.

    Args:
        title: Event title
        start_time: ISO 8601 datetime string (e.g., '2024-12-08T10:00:00-08:00')
        end_time: ISO 8601 datetime string
        description: Event description
        calendar_id: Calendar ID (default: 'primary')
        metadata: Additional metadata to store in event

    Returns:
        Created event dictionary
    """
    if not _service:
        raise RuntimeError("Google Calendar service not initialized")

    event = {
        "summary": title,
        "description": description or "",
        "start": {
            "dateTime": start_time,
            "timeZone": settings.gcal_timezone,
        },
        "end": {
            "dateTime": end_time,
            "timeZone": settings.gcal_timezone,
        },
    }

    # Add metadata to extended properties if provided
    if metadata:
        event["extendedProperties"] = {
            "private": metadata
        }

    try:
        created_event = (
            _service.events()
            .insert(calendarId=calendar_id, body=event)
            .execute()
        )

        logger.info("Created event: %s (ID: %s)", title, created_event.get("id"))
        return created_event
    except Exception as exc:
        logger.error("Failed to create event: %s", exc)
        raise


async def update_event(
    event_id: str,
    title: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    description: Optional[str] = None,
    calendar_id: str = "primary",
) -> Dict[str, Any]:
    """Update an existing event in Google Calendar.

    Args:
        event_id: Google Calendar event ID
        title: New event title (optional)
        start_time: New start time (optional)
        end_time: New end time (optional)
        description: New description (optional)
        calendar_id: Calendar ID (default: 'primary')

    Returns:
        Updated event dictionary
    """
    if not _service:
        raise RuntimeError("Google Calendar service not initialized")

    try:
        # Get existing event
        event = _service.events().get(calendarId=calendar_id, eventId=event_id).execute()

        # Update fields if provided
        if title:
            event["summary"] = title
        if description:
            event["description"] = description
        if start_time:
            event["start"]["dateTime"] = start_time
        if end_time:
            event["end"]["dateTime"] = end_time

        updated_event = (
            _service.events()
            .update(calendarId=calendar_id, eventId=event_id, body=event)
            .execute()
        )

        logger.info("Updated event: %s", event_id)
        return updated_event
    except Exception as exc:
        logger.error("Failed to update event %s: %s", event_id, exc)
        raise


async def delete_event(event_id: str, calendar_id: str = "primary") -> None:
    """Delete an event from Google Calendar.

    Args:
        event_id: Google Calendar event ID
        calendar_id: Calendar ID (default: 'primary')
    """
    if not _service:
        raise RuntimeError("Google Calendar service not initialized")

    try:
        _service.events().delete(calendarId=calendar_id, eventId=event_id).execute()
        logger.info("Deleted event: %s", event_id)
    except Exception as exc:
        logger.error("Failed to delete event %s: %s", event_id, exc)
        raise
