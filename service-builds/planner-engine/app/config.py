"""Application configuration for Planner Engine service."""
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Environment-driven settings."""

    service_name: str = "Planner Engine"
    service_version: str = "0.1.0"

    # Networking
    service_domain: str = "planner.bestviable.com"
    port: int = 8091
    log_level: str = "INFO"

    # Postgres
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "n8n"
    postgres_user: str = "n8n"
    postgres_password: str = ""

    # Memory Gateway + Coda
    memory_gateway_url: str = "http://memory-gateway:8090"
    coda_mcp_url: str = "http://coda-mcp:8080"

    # Default client (until multi-tenant arrives)
    client_id: int = 1

    # LLM / Langfuse
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-3.5-sonnet"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    prompt_token_cost_usd: float = 0.000015
    completion_token_cost_usd: float = 0.000075
    langfuse_public_key: Optional[str] = None
    langfuse_secret_key: Optional[str] = None
    langfuse_host: str = "https://cloud.langfuse.com"
    langfuse_enabled: bool = True

    request_timeout_seconds: float = 30.0

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    @property
    def postgres_dsn(self) -> str:
        """Assemble asyncpg-compatible DSN."""
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def langfuse_configured(self) -> bool:
        return bool(self.langfuse_public_key and self.langfuse_secret_key and self.langfuse_enabled)


@lru_cache
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()


settings = get_settings()
