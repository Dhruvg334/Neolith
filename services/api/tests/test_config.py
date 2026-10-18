"""Tests for structured environment configuration loading and validation."""

import pytest
from pydantic import ValidationError

from neolith_api.core.config import Settings


def test_settings_loads_defaults_without_llm_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    """Settings loads valid defaults and does not require LLM_API_KEY."""
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    settings = Settings(_env_file=None)

    assert settings.app_name == "neolith"
    assert settings.service_name == "neolith-api"
    assert settings.service_version == "0.1.0"
    assert settings.api_port == 8000
    assert settings.neolith_permit_ttl_seconds == 60
    assert settings.llm_api_key == ""


def test_settings_respects_environment_overrides(monkeypatch: pytest.MonkeyPatch) -> None:
    """Settings reads environment variable overrides and normalises OPA_URL."""
    monkeypatch.setenv("APP_ENV", "staging")
    monkeypatch.setenv("API_PORT", "8080")
    monkeypatch.setenv("OPA_URL", "http://opa.internal:8181/")
    monkeypatch.setenv("NEOLITH_PERMIT_TTL_SECONDS", "45")
    monkeypatch.setenv("LLM_PROVIDER", "mock")

    settings = Settings(_env_file=None)

    assert settings.app_env == "staging"
    assert settings.api_port == 8080
    assert settings.opa_url == "http://opa.internal:8181"
    assert settings.neolith_permit_ttl_seconds == 45
    assert settings.llm_provider == "mock"


def test_settings_rejects_invalid_schemes_and_bounds() -> None:
    """Settings rejects non-PostgreSQL database URLs and out-of-range permit TTLs."""
    with pytest.raises(ValidationError):
        Settings(_env_file=None, DATABASE_URL="mysql://localhost:3306/neolith")

    with pytest.raises(ValidationError):
        Settings(_env_file=None, REDIS_URL="http://localhost:6379/0")

    with pytest.raises(ValidationError):
        Settings(_env_file=None, NEOLITH_PERMIT_TTL_SECONDS=600)
