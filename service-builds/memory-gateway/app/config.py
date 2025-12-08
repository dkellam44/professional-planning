"""
Configuration Management
Pydantic settings for environment variables
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
import os


class Settings(BaseSettings):
    """Application settings from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"
    )

    # Database
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "n8n"
    postgres_user: str = "n8n"
    postgres_password: str = ""

    # Vector Database
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    @property
    def qdrant_url(self) -> str:
        """Qdrant connection URL"""
        return f"http://{self.qdrant_host}:{self.qdrant_port}"

    # Cache
    valkey_host: str = "localhost"
    valkey_port: int = 6379
    valkey_db: int = 0

    # External APIs
    openrouter_api_key: str = ""
    mem0_api_key: str = ""
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""

    # Zep Cloud (Long-term Memory)
    zep_api_key: str = ""
    zep_project_id: str = ""
    zep_memory_enabled: bool = True
    zep_memory_url: str = "https://api.zep.com"

    # Logging
    log_level: str = "INFO"

    @property
    def postgres_url(self) -> str:
        """PostgreSQL connection URL"""
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
