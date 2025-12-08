"""Planner Engine FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health, planner
from app.services import llm, memory, postgres

logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
structlog.configure(wrapper_class=structlog.make_filtering_bound_logger(logging.INFO))
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("planner-engine.starting")
    await postgres.initialize()
    await memory.initialize()
    yield
    logger.info("planner-engine.stopping")
    await memory.close()
    await postgres.close()
    await llm.close()


app = FastAPI(
    title=settings.service_name,
    version=settings.service_version,
    lifespan=lifespan,
    description="Intent → SOP generator for BestViable Planner",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(planner.router)


@app.get("/")
async def root():
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "health": "/health",
        "plan": "/api/v1/planner/plan",
    }
