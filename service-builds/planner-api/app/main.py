"""Planner API FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health, observer, oauth, planner, scheduler
from app.services import gcal, llm, memory, postgres

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
structlog.configure(wrapper_class=structlog.make_filtering_bound_logger(logging.INFO))
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("planner-api.starting")
    await postgres.initialize()
    await memory.initialize()
    await gcal.initialize()
    yield
    logger.info("planner-api.stopping")
    await memory.close()
    await postgres.close()
    await llm.close()


app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
    lifespan=lifespan,
    description="Consolidated Planner API: Intent → SOP → Schedule → Reflect",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(oauth.router)
app.include_router(planner.router)
app.include_router(scheduler.router)
app.include_router(observer.router)


@app.get("/")
async def root():
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "health": "/health",
        "endpoints": {
            "plan": "/api/v1/planner/plan",
            "schedule": "/api/v1/scheduler/schedule",
            "reflect": "/api/v1/observer/reflect",
        },
    }
