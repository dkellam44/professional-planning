"""
Memory Gateway Service
Main FastAPI application for unified memory API
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import Settings
from app.routes import memory, health
from app.services import postgres, qdrant, valkey

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage startup and shutdown events
    """
    # Startup
    logger.info("Memory Gateway starting up...")
    try:
        await postgres.initialize()
        logger.info("✓ Postgres connection pool initialized")

        await valkey.initialize()
        logger.info("✓ Valkey cache initialized")

        await qdrant.initialize()
        logger.info("✓ Qdrant client initialized")

        logger.info("✓ Memory Gateway ready")
    except Exception as e:
        logger.error(f"✗ Startup failed: {e}")
        raise

    yield

    # Shutdown
    logger.info("Memory Gateway shutting down...")
    try:
        await postgres.close()
        await valkey.close()
        logger.info("✓ Connections closed")
    except Exception as e:
        logger.error(f"✗ Shutdown error: {e}")


# Create FastAPI app
app = FastAPI(
    title="Memory Gateway",
    description="Unified memory API for Planner & Memory Architecture",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(memory.router, prefix="/api/v1/memory", tags=["memory"])


@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "service": "Memory Gateway",
        "version": "0.1.0",
        "status": "ready",
        "endpoints": {
            "health": "/health",
            "api": "/api/v1",
            "docs": "/docs",
            "openapi": "/openapi.json",
        },
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8090,
        log_level="info",
    )
