"""
Health Check Routes
"""

import logging
from fastapi import APIRouter
from app.models import HealthCheckResponse
from app.services import postgres, qdrant, valkey

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check() -> HealthCheckResponse:
    """
    Health check endpoint

    Returns basic service status and dependency health
    """
    return HealthCheckResponse(
        status="ready",
        version="0.1.0",
    )


@router.get("/health/detailed")
async def detailed_health():
    """
    Detailed health check with dependency status
    """
    pg_ok = await postgres.check_connection()
    qdrant_ok = await qdrant.check_connection()
    valkey_ok = await valkey.check_connection()

    status = "ready" if all([pg_ok, qdrant_ok, valkey_ok]) else "degraded"

    return {
        "status": status,
        "version": "0.1.0",
        "dependencies": {
            "postgres": "ok" if pg_ok else "failed",
            "qdrant": "ok" if qdrant_ok else "failed",
            "valkey": "ok" if valkey_ok else "failed",
        },
    }
