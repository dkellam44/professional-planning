"""
Data Models
Pydantic schemas for request/response validation
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# ============================================================================
# Health & Status
# ============================================================================


class HealthCheckResponse(BaseModel):
    """Health check response"""

    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Memory Operations
# ============================================================================


class MemoryPayload(BaseModel):
    """Memory storage request"""

    client_id: int = Field(..., description="Client/user ID")
    content: str = Field(..., description="Memory content to store")
    memory_type: str = Field(
        default="fact",
        description="Type: fact, event, preference, observation",
    )
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    tags: Optional[List[str]] = Field(default=None, description="Search tags")


class MemoryResponse(BaseModel):
    """Memory storage response"""

    memory_id: int = Field(..., description="Unique memory ID")
    client_id: int = Field(..., description="Client ID")
    stored_in: List[str] = Field(
        default=[],
        description="Storage layers used: postgres, qdrant, valkey, mem0",
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class RecallQuery(BaseModel):
    """Memory recall request"""

    query: str = Field(..., description="Search query")
    client_id: int = Field(..., description="Client/user ID")
    k: int = Field(default=10, description="Number of results to return")
    memory_type: Optional[str] = Field(
        default=None,
        description="Filter by memory type",
    )


class MemoryHit(BaseModel):
    """Single memory search result"""

    memory_id: int = Field(..., description="Memory ID")
    content: str = Field(..., description="Memory content")
    memory_type: str = Field(..., description="Memory type")
    similarity_score: float = Field(
        ...,
        description="Semantic similarity score (0-1)",
    )
    stored_at: datetime = Field(..., description="When memory was stored")
    metadata: Optional[Dict[str, Any]] = Field(default=None)


class RecallResponse(BaseModel):
    """Memory recall response"""

    query: str = Field(..., description="Original query")
    client_id: int = Field(..., description="Client ID")
    results: List[MemoryHit] = Field(default=[], description="Search results")
    result_count: int = Field(..., description="Total results")
    search_time_ms: float = Field(..., description="Search duration in milliseconds")


# ============================================================================
# Error Responses
# ============================================================================


class ErrorResponse(BaseModel):
    """Standard error response"""

    error: str = Field(..., description="Error type")
    detail: str = Field(..., description="Error detail")
    request_id: Optional[str] = Field(None, description="Request ID for tracking")
