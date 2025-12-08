"""OAuth 2.0 routes for Google Calendar integration."""
from __future__ import annotations

import json
import logging
import os
from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials

from app.config import settings
from app.services import gcal

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/oauth", tags=["oauth"])

# Required environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")


@router.get("/authorize")
async def authorize_google_calendar():
    """Redirect user to Google OAuth consent screen."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Missing Google OAuth credentials",
                "message": "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables",
            },
        )

    # Create OAuth flow using environment variables
    flow = Flow.from_client_config(
        {
            "installed": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [f"https://{settings.service_domain}/oauth/callback"],
            }
        },
        scopes=["https://www.googleapis.com/auth/calendar"],
    )

    # Set up redirect URI (must match Google Cloud Console configuration)
    flow.redirect_uri = f"https://{settings.service_domain}/oauth/callback"

    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
    )

    return {"authorization_url": authorization_url, "state": state}


@router.get("/callback")
async def oauth_callback(code: str = Query(...), state: str = Query(None)) -> dict[str, Any]:
    """Handle OAuth callback from Google.

    After user authorizes, Google redirects here with an authorization code.
    We exchange it for tokens and save them.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Missing Google OAuth credentials",
                "message": "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables",
            },
        )

    try:
        # Recreate the flow
        flow = Flow.from_client_config(
            {
                "installed": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [f"https://{settings.service_domain}/oauth/callback"],
                }
            },
            scopes=["https://www.googleapis.com/auth/calendar"],
        )
        flow.redirect_uri = f"https://{settings.service_domain}/oauth/callback"

        # Exchange authorization code for tokens
        flow.fetch_token(code=code)

        # Get credentials
        credentials = flow.credentials

        # Save credentials to file
        token_path = settings.gcal_credentials_path.replace(".json", "_token.json")
        os.makedirs(os.path.dirname(token_path), exist_ok=True)
        with open(token_path, "w") as token_file:
            token_file.write(credentials.to_json())

        logger.info("Google Calendar credentials saved successfully to %s", token_path)

        # Reinitialize the Google Calendar service with new credentials
        await gcal.initialize()

        return {
            "status": "success",
            "message": "Google Calendar OAuth completed. Credentials saved.",
            "token_path": token_path,
        }

    except Exception as exc:
        logger.error("OAuth callback failed: %s", exc)
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": f"OAuth failed: {str(exc)}",
            },
        )
