"""Pytest global configuration and fixtures for Neolith API and Agent tests."""

import os

import pytest


@pytest.fixture(autouse=True)
def configure_test_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    """Configure deterministic test environment defaults."""
    if "NEOLITH_FINANCIAL_DATA_MODE" not in os.environ:
        monkeypatch.setenv("NEOLITH_FINANCIAL_DATA_MODE", "fixture")
    monkeypatch.setenv("APP_ENV", "test")
