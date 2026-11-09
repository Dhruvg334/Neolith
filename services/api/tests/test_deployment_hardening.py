"""Tests for deployment hardening:
OPA client, fail-safe evaluation, CORS, and agent execution mode.
"""

import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from neolith_agent.interfaces import InteractionTurn
from neolith_api.core.config import Settings
from neolith_api.governance.evaluator import (
    FakePolicyEvaluator,
    OpaPolicyEvaluator,
    PolicyEvaluationResult,
)
from neolith_api.integrations.agent_client import (
    AgentWorkerClient,
    AgentWorkerUnavailableError,
)
from neolith_api.main import create_app


def test_cors_allowed_origins_parsing() -> None:
    """Verify CORS_ALLOWED_ORIGINS parses comma-separated string cleanly."""
    settings = Settings(
        CORS_ALLOWED_ORIGINS="https://neolith.vercel.app, https://preview.vercel.app , http://localhost:3000",
    )
    expected = [
        "https://neolith.vercel.app",
        "https://preview.vercel.app",
        "http://localhost:3000",
    ]
    assert settings.cors_allowed_origins_list == expected


def test_cors_middleware_headers_applied() -> None:
    """Verify FastAPI application accepts requests from configured CORS origins."""
    settings = Settings(
        CORS_ALLOWED_ORIGINS="https://neolith.vercel.app",
        database_url="sqlite+pysqlite:///:memory:",
    )
    app = create_app(settings=settings)
    client = TestClient(app)

    # Preflight OPTIONS request
    headers = {
        "Origin": "https://neolith.vercel.app",
        "Access-Control-Request-Method": "POST",
    }
    resp = client.options("/api/v1/health", headers=headers)
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "https://neolith.vercel.app"


def test_opa_evaluator_fails_safe_when_unreachable() -> None:
    """Verify OpaPolicyEvaluator returns deterministic DENY when OPA daemon is unreachable."""
    evaluator = OpaPolicyEvaluator(
        opa_url="http://127.0.0.1:59999",  # unreachable port
        timeout_seconds=0.5,
    )
    result = evaluator.evaluate({"tool": {"risk_tier": "R2"}})

    assert result.decision == "deny"
    assert "OPA_SERVICE_UNAVAILABLE" in result.reason_codes
    assert result.risk_tier == "R2"


def test_fake_policy_evaluator_predetermined_response() -> None:
    """Verify FakePolicyEvaluator returns predetermined response without Python policy rules."""
    custom_res = PolicyEvaluationResult(
        decision="review",
        reason_codes=["CUSTOM_REVIEW_SIGNAL"],
        required_approvals=["finance_director"],
        risk_tier="R3",
    )
    evaluator = FakePolicyEvaluator(default_result=custom_res)
    res = evaluator.evaluate({"action": {"operation": "custom_op"}})

    assert res.decision == "review"
    assert res.reason_codes == ["CUSTOM_REVIEW_SIGNAL"]
    assert res.required_approvals == ["finance_director"]


@pytest.mark.asyncio
async def test_agent_worker_client_in_process_mode() -> None:
    """Verify in_process mode executes FinancialAIAgent directly."""
    from datetime import UTC, datetime

    os.environ["NEOLITH_AGENT_EXECUTION_MODE"] = "in_process"
    client = AgentWorkerClient()

    turn = InteractionTurn(
        interaction_id=uuid4(),
        channel="web",
        provider="neolith_web",
        text="What is our Operations Account balance?",
        received_at=datetime.now(UTC),
    )
    response = await client.process_turn(turn)
    assert response is not None
    assert response.status in ("accepted", "proposal_ready", "completed")


@pytest.mark.asyncio
async def test_agent_worker_client_worker_mode_fails_without_silent_fallback() -> None:
    """Verify explicit worker mode raises AgentWorkerUnavailableError when worker is unreachable."""
    from datetime import UTC, datetime

    os.environ["NEOLITH_AGENT_EXECUTION_MODE"] = "worker"
    # Unreachable worker URL
    client = AgentWorkerClient(worker_url="http://127.0.0.1:59998")

    turn = InteractionTurn(
        interaction_id=uuid4(),
        channel="web",
        provider="neolith_web",
        text="What is our Operations Account balance?",
        received_at=datetime.now(UTC),
    )
    with pytest.raises(AgentWorkerUnavailableError) as exc_info:
        await client.process_turn(turn)

    assert "unavailable" in str(exc_info.value).lower()
    # Reset env
    os.environ["NEOLITH_AGENT_EXECUTION_MODE"] = "in_process"


def test_database_url_normalization_postgres() -> None:
    """Verify postgres:// and postgresql:// are normalized to postgresql+psycopg://."""
    s1 = Settings(DATABASE_URL="postgres://user:pass@render.com/db")
    assert s1.database_url == "postgresql+psycopg://user:pass@render.com/db"

    s2 = Settings(DATABASE_URL="postgresql://user:pass@render.com/db")
    assert s2.database_url == "postgresql+psycopg://user:pass@render.com/db"


def test_render_yaml_validity() -> None:
    """Verify render.yaml exists and contains required Blueprint declarations."""
    from pathlib import Path

    import yaml

    repo_root = Path(__file__).resolve().parents[3]
    render_file = repo_root / "render.yaml"
    assert render_file.exists(), "render.yaml must exist at repository root"

    content = yaml.safe_load(render_file.read_text(encoding="utf-8"))
    assert "services" in content
    assert "databases" in content

    web_service = content["services"][0]
    assert web_service["name"] == "neolith-api"
    assert web_service["runtime"] == "docker"
    assert web_service["plan"] == "free"
    assert web_service["healthCheckPath"] == "/api/v1/health"

    env_map = {item["key"]: item.get("value") for item in web_service["envVars"]}
    assert env_map.get("APP_ENV") == "production"
    assert env_map.get("NEOLITH_AGENT_EXECUTION_MODE") == "in_process"
    assert env_map.get("OPA_URL") == "http://127.0.0.1:8181"


def test_start_render_script_syntax() -> None:
    """Verify scripts/start_render.sh is well-formed bash script."""
    from pathlib import Path

    repo_root = Path(__file__).resolve().parents[3]
    script_path = repo_root / "scripts" / "start_render.sh"
    assert script_path.exists(), "scripts/start_render.sh must exist"

    text = script_path.read_text(encoding="utf-8")
    assert "#!/usr/bin/env bash" in text
    assert "set -euo pipefail" in text
    assert "127.0.0.1:8181" in text
    assert "alembic upgrade head" in text
    assert "python -m neolith_api.seed" in text
    assert "exec uvicorn neolith_api.main:app" in text


def test_opa_live_canonical_evaluation(opa_server: str) -> None:
    """Verify live OPA evaluates canonical inputs correctly."""
    evaluator = OpaPolicyEvaluator(
        opa_url=opa_server,
        decision_path="/v1/data/neolith/decision/result",
    )
    # Balanced profile: allow for verified vendor, within threshold
    canonical_input = {
        "action": {
            "action_id": "test-action-01",
            "operation": "pay_invoice",
            "category": "software",
            "amount": "8000.00",
            "currency": "INR",
        },
        "agent": {
            "name": "financial-ai-agent",
            "status": "active",
            "version": "0.1.0",
        },
        "tool": {
            "name": "pay_invoice",
            "status": "active",
            "risk_tier": "R2",
            "protected": True,
        },
        "beneficiary": {
            "verified": True,
        },
        "budget": {
            "remaining": "25000.00",
            "approval_threshold": "15000.00",
        },
        "profile": {
            "style": "balanced",
            "configuration": {},
        },
        "revocation": {
            "emergency_stop_active": False,
        },
    }
    res = evaluator.evaluate(canonical_input)
    assert res.decision == "allow"
    assert "BASE_POLICY_ALLOW" in res.reason_codes
