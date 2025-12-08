"""Health check routes for Planner Engine."""
from datetime import datetime

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.config import settings
from app.models import HealthDependency, HealthResponse
from app.services import llm, memory, postgres

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check():
    """Surface dependency health without failing the ELB/Traefik check immediately."""
    dependencies: list[HealthDependency] = []

    pg_ok, pg_details = await postgres.check_connection()
    dependencies.append(
        HealthDependency(name="postgres", status="up" if pg_ok else "down", details=pg_details)
    )

    memory_ok, memory_details = await memory.check_health()
    dependencies.append(
        HealthDependency(name="memory-gateway", status="up" if memory_ok else "down", details=memory_details)
    )

    llm_ok, llm_details = await llm.check_health()
    dependencies.append(
        HealthDependency(name="openrouter", status="up" if llm_ok else "down", details=llm_details)
    )

    status_text = "healthy"
    http_status = status.HTTP_200_OK

    if not all(dep.status == "up" for dep in dependencies):
        status_text = "degraded"
        if not pg_ok:
            status_text = "unhealthy"
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE

    payload = HealthResponse(
        status=status_text,
        version=settings.service_version,
        dependencies=dependencies,
        timestamp=datetime.utcnow(),
    )

    return JSONResponse(status_code=http_status, content=payload.model_dump(mode="json"))
