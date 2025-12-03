"""
Configuration Management
Pydantic settings for environment variables
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings from environment variables"""

    # Database
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "n8n"
    postgres_user: str = "n8n"
    postgres_password: str = ""

    # Vector Database
    qdrant_url: str = "http://localhost:6333"

    # Cache
    valkey_host: str = "localhost"
    valkey_port: int = 6379
    valkey_db: int = 0

    # External APIs
    openrouter_api_key: str = ""
    mem0_api_key: str = ""
    langfuse_public_key: str = ""
    langfuse_secret_key: str = ""

    # Logging
    log_level: str = "INFO"

    @property
    def postgres_url(self) -> str:
        """PostgreSQL connection URL"""
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"
