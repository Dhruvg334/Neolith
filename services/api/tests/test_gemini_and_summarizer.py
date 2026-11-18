"""Tests for Google Gemini LLM provider adapter and Governance Activity Summarizer."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from neolith_agent.provider import (
    DeterministicMockLLMProvider,
    GeminiLLMProvider,
    create_llm_provider,
)
from neolith_api.core.config import Settings
from neolith_api.core.database import build_engine, initialize_database
from neolith_api.main import create_app


@pytest.fixture()
def client(opa_server: str) -> TestClient:
    """Create a FastAPI TestClient backed by in-memory SQLite database."""
    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        redis_url="redis://localhost:6379/0",
        opa_url=opa_server,
        llm_provider="mock",
    )
    app: FastAPI = create_app(settings=settings)
    shared_engine = build_engine("sqlite+pysqlite:///:memory:")
    factory = initialize_database(shared_engine, seed_if_empty=True)
    app.state.db_engine = shared_engine
    app.state.session_factory = factory
    return TestClient(app)


def test_gemini_provider_requires_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """GeminiLLMProvider raises ValueError if no API key is provided or present in env."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)

    with pytest.raises(ValueError, match="Gemini API key must be provided"):
        GeminiLLMProvider(api_key=None)


def test_create_llm_provider_factory(monkeypatch: pytest.MonkeyPatch) -> None:
    """create_llm_provider resolves Gemini, OpenAI, or falls back to DeterministicMock."""
    monkeypatch.setenv("GEMINI_API_KEY", "test-gemini-key")
    provider = create_llm_provider(provider_name="gemini")
    assert isinstance(provider, GeminiLLMProvider)
    assert provider.api_key == "test-gemini-key"

    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    fallback = create_llm_provider()
    assert isinstance(fallback, DeterministicMockLLMProvider)


@pytest.mark.asyncio
async def test_gemini_provider_generate_structured_success() -> None:
    """GeminiLLMProvider formats request to Google v1beta API and parses JSON response."""
    provider = GeminiLLMProvider(api_key="mock-key-123", model="gemini-3.5-flash")

    mock_gemini_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": json.dumps(
                                {
                                    "intent": "pay_invoice",
                                    "target_id": "INV-001",
                                    "amount": "8000.00",
                                }
                            )
                        }
                    ]
                }
            }
        ]
    }

    mock_resp = httpx.Response(
        status_code=200,
        json=mock_gemini_response,
        request=httpx.Request("POST", "https://generativelanguage.googleapis.com"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        result = await provider.generate_structured(
            system_prompt="System instructions",
            user_prompt="User input",
            response_schema={},
        )

        assert result["intent"] == "pay_invoice"
        assert result["target_id"] == "INV-001"
        assert result["amount"] == "8000.00"
        mock_post.assert_awaited_once()


def test_get_governance_summarize_endpoint(client: TestClient) -> None:
    """GET /api/v1/governance/summarize returns synthesized activity brief."""
    res = client.get("/api/v1/governance/summarize")
    assert res.status_code == 200
    data = res.json()

    assert "executive_summary" in data
    assert "governance_posture" in data
    assert "breakdown" in data
    assert data["breakdown"]["currency"] == "INR"
    assert "allowed_count" in data["breakdown"]
    assert "controlled_count" in data["breakdown"]
    assert "blocked_count" in data["breakdown"]
    assert len(data["key_observations"]) >= 3
    assert len(data["invariant_findings"]) >= 1
    assert "audit_readiness_statement" in data
    assert "zero_trust_guarantee" in data
    assert data["is_live_llm"] is False
    assert data["provider_used"] == "deterministic-synthesis"


def test_post_governance_summarize_with_custom_actions(client: TestClient) -> None:
    """POST /api/v1/governance/summarize synthesizes custom evaluated session actions."""
    payload = {
        "actions": [
            {
                "id": "act-test-01",
                "target_id": "INV-001",
                "action_type": "pay_invoice",
                "vendor_name": "Acme Cloud",
                "is_verified_vendor": True,
                "amount": "8000.00",
                "currency": "INR",
                "category": "Software",
                "outcome": "allow",
                "risk_tier": "R2",
                "reason_codes": ["BASE_POLICY_ALLOW"],
                "rule_explanation": "Approved under routine spend limit.",
            },
            {
                "id": "act-test-02",
                "target_id": "INV-003",
                "action_type": "pay_invoice",
                "vendor_name": "Rogue Vendor",
                "is_verified_vendor": False,
                "amount": "50000.00",
                "currency": "INR",
                "category": "Infrastructure",
                "outcome": "deny",
                "risk_tier": "R4",
                "reason_codes": ["DENY_UNVERIFIED_BENEFICIARY"],
                "rule_explanation": "Blocked beneficiary.",
            },
        ],
        "profile_name": "Strict Control Baseline",
        "organization_name": "Neolith Treasury",
    }

    res = client.post("/api/v1/governance/summarize", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["active_profile_name"] == "Strict Control Baseline"
    assert data["breakdown"]["allowed_count"] == 1
    assert data["breakdown"]["allowed_amount"] == "8000.00"
    assert data["breakdown"]["blocked_count"] == 1
    assert data["breakdown"]["blocked_amount"] == "50000.00"
    assert data["breakdown"]["total_proposed_amount"] == "58000.00"
    assert "Guarded" in data["governance_posture"]


def test_post_governance_summarize_empty_actions(client: TestClient) -> None:
    """POST /api/v1/governance/summarize falls back to seeded history when empty."""
    payload = {
        "actions": [],
        "profile_name": "Balanced Control",
        "organization_name": "Neolith Treasury",
    }
    res = client.post("/api/v1/governance/summarize", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "breakdown" in data
    assert data["breakdown"]["currency"] == "INR"
    assert "LLM reasoning step" in data["zero_trust_guarantee"]


def test_post_governance_summarize_all_denied(client: TestClient) -> None:
    """POST /api/v1/governance/summarize correctly aggregates 100% blocked actions."""
    payload = {
        "actions": [
            {
                "id": "act-deny-1",
                "target_id": "INV-999",
                "action_type": "pay_invoice",
                "vendor_name": "Fraudulent Inc",
                "is_verified_vendor": False,
                "amount": "120000.00",
                "currency": "INR",
                "category": "Infrastructure",
                "outcome": "deny",
                "risk_tier": "R4",
                "reason_codes": ["DENY_UNVERIFIED_BENEFICIARY", "DENY_BUDGET_EXCEEDED"],
                "rule_explanation": "Critical security violation hard-blocked.",
            }
        ],
        "profile_name": "High Autonomy",
    }
    res = client.post("/api/v1/governance/summarize", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["breakdown"]["blocked_count"] == 1
    assert data["breakdown"]["blocked_amount"] == "120000.00"
    assert data["breakdown"]["allowed_count"] == 0
    assert data["breakdown"]["controlled_count"] == 0
    assert "authoritative signed permit" in data["zero_trust_guarantee"]


def test_post_governance_summarize_all_allowed(client: TestClient) -> None:
    """POST /api/v1/governance/summarize correctly aggregates autonomous allowed actions."""
    payload = {
        "actions": [
            {
                "id": "act-allow-1",
                "target_id": "INV-001",
                "action_type": "pay_invoice",
                "vendor_name": "Acme Cloud",
                "is_verified_vendor": True,
                "amount": "8000.00",
                "currency": "INR",
                "category": "Software",
                "outcome": "allow",
                "risk_tier": "R2",
                "reason_codes": ["BASE_POLICY_ALLOW"],
                "rule_explanation": "Routine payment permitted.",
            },
            {
                "id": "act-allow-2",
                "target_id": "INV-004",
                "action_type": "pay_invoice",
                "vendor_name": "Logistics Corp",
                "is_verified_vendor": True,
                "amount": "4500.00",
                "currency": "INR",
                "category": "Miscellaneous",
                "outcome": "allow",
                "risk_tier": "R1",
                "reason_codes": ["BASE_POLICY_ALLOW"],
                "rule_explanation": "Low risk miscellaneous expense.",
            },
        ],
        "profile_name": "Balanced Control",
    }
    res = client.post("/api/v1/governance/summarize", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["breakdown"]["allowed_count"] == 2
    assert data["breakdown"]["allowed_amount"] == "12500.00"
    assert data["breakdown"]["blocked_count"] == 0
    assert data["breakdown"]["controlled_count"] == 0
