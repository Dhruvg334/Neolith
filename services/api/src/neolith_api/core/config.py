"""Structured environment configuration for Neolith API."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        frozen=True,
    )

    app_env: Literal["local", "test", "staging", "production"] = Field(
        default="local",
        validation_alias="APP_ENV",
    )
    app_name: str = Field(default="neolith", validation_alias="APP_NAME", min_length=1)
    service_name: str = Field(default="neolith-api", min_length=1)
    service_version: str = Field(default="0.1.0", min_length=1)

    api_host: str = Field(default="0.0.0.0", validation_alias="API_HOST")
    api_port: int = Field(default=8000, validation_alias="API_PORT", ge=1, le=65535)
    web_port: int = Field(default=3000, validation_alias="WEB_PORT", ge=1, le=65535)

    database_url: str = Field(
        default="postgresql+psycopg://neolith:neolith_local@localhost:5432/neolith",
        validation_alias="DATABASE_URL",
        min_length=1,
    )
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        validation_alias="REDIS_URL",
        min_length=1,
    )
    opa_url: str = Field(
        default="http://localhost:8181",
        validation_alias="OPA_URL",
        min_length=1,
    )
    opa_decision_path: str = Field(
        default="/v1/data/neolith/decision/result",
        validation_alias="OPA_DECISION_PATH",
        min_length=1,
    )
    dependency_timeout_seconds: float = Field(
        default=2.0,
        validation_alias="NEOLITH_DEPENDENCY_TIMEOUT_SECONDS",
        gt=0.0,
        le=30.0,
    )

    neolith_issuer: str = Field(
        default="https://neolith.local",
        validation_alias="NEOLITH_ISSUER",
        min_length=1,
    )
    neolith_permit_ttl_seconds: int = Field(
        default=60,
        validation_alias="NEOLITH_PERMIT_TTL_SECONDS",
        ge=5,
        le=300,
    )
    neolith_signing_private_key_path: Path = Field(
        default=Path(".secrets/permit-ed25519-private.pem"),
        validation_alias="NEOLITH_SIGNING_PRIVATE_KEY_PATH",
    )
    neolith_signing_public_key_path: Path = Field(
        default=Path(".secrets/permit-ed25519-public.pem"),
        validation_alias="NEOLITH_SIGNING_PUBLIC_KEY_PATH",
    )
    neolith_signing_key_id: str = Field(
        default="local-permit-key-1",
        validation_alias="NEOLITH_SIGNING_KEY_ID",
        min_length=1,
    )

    otel_exporter_otlp_endpoint: str = Field(
        default="http://localhost:4317",
        validation_alias="OTEL_EXPORTER_OTLP_ENDPOINT",
    )
    otel_service_name: str = Field(
        default="neolith-api",
        validation_alias="OTEL_SERVICE_NAME",
        min_length=1,
    )

    llm_provider: Literal["openai", "mock"] = Field(
        default="openai",
        validation_alias="LLM_PROVIDER",
    )
    llm_api_key: str = Field(default="", validation_alias="LLM_API_KEY")
    llm_model_fast: str = Field(default="", validation_alias="LLM_MODEL_FAST")
    llm_model_reasoning: str = Field(default="", validation_alias="LLM_MODEL_REASONING")
    embedding_model: str = Field(default="", validation_alias="EMBEDDING_MODEL")

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        if not value.startswith(("postgresql://", "postgresql+psycopg://")):
            msg = "DATABASE_URL must use a PostgreSQL connection scheme"
            raise ValueError(msg)
        return value

    @field_validator("redis_url")
    @classmethod
    def validate_redis_url(cls, value: str) -> str:
        if not value.startswith(("redis://", "rediss://")):
            msg = "REDIS_URL must use a redis:// or rediss:// scheme"
            raise ValueError(msg)
        return value

    @field_validator("opa_url")
    @classmethod
    def validate_opa_url(cls, value: str) -> str:
        if not value.startswith(("http://", "https://")):
            msg = "OPA_URL must use an http:// or https:// scheme"
            raise ValueError(msg)
        return value.rstrip("/")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached runtime settings."""
    return Settings()
