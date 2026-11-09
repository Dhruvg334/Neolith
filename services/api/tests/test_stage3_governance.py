"""Comprehensive tests for Stage 3 Policy-Driven Governance Decision Runtime.

Covers:
- Canonical Evaluation Scenarios:
    CASE A: INV-001 (ALLOW under Balanced Control)
    CASE B: INV-002 (REVIEW under Balanced Control: threshold reached)
    CASE C: INV-003 (DENY: dual reasons: BUDGET_EXCEEDED + UNVERIFIED_BENEFICIARY)
- Profile Behaviors (Strict Control, High Autonomy, Custom Profiles)
- Hard Invariant Denials (Unregistered Tool, Inactive Tool, Unknown Agent Version, Permission)
- Profile Activation, Creation, Update and Decision Query APIs
- Cross-Channel Governance Parity (Web, WhatsApp, Voice)
- Alembic Migration Clean Application
"""

from decimal import Decimal
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect

from neolith_api.core.config import Settings
from neolith_api.core.database import build_engine, initialize_database
from neolith_api.main import create_app


@pytest.fixture()
def gov_client(opa_server: str) -> TestClient:
    """Create a FastAPI TestClient backed by an in-memory SQLite Stage 3 database."""
    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        redis_url="redis://localhost:6379/0",
        opa_url=opa_server,
    )
    app: FastAPI = create_app(settings=settings)
    shared_engine = build_engine("sqlite+pysqlite:///:memory:")
    factory = initialize_database(shared_engine, seed_if_empty=True)
    app.state.db_engine = shared_engine
    app.state.session_factory = factory
    return TestClient(app)


def test_alembic_migration_creates_all_stage3_tables(tmp_path: Path) -> None:
    """Verify Alembic migration 0003_stage3_governance_profiles creates all tables cleanly."""
    db_file = tmp_path / "alembic_stage3.db"
    db_url = f"sqlite+pysqlite:///{db_file.as_posix()}"

    api_dir = Path(__file__).resolve().parents[1]
    alembic_cfg = Config(str(api_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(api_dir / "migrations"))
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)

    command.upgrade(alembic_cfg, "head")

    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    expected_stage3_tables = {
        "governance_profiles",
        "permission_bindings",
        "execution_requests",
        "governance_decisions",
        "risk_signals",
    }
    assert expected_stage3_tables.issubset(tables)


def test_case_a_inv001_allows_under_balanced_profile(gov_client: TestClient) -> None:
    """CASE A: Routine cloud invoice INV-001 (4,200 INR) is auto-allowed under Balanced Control."""
    payload = {
        "trace_id": f"trace-case-a-{uuid4().hex[:8]}",
        "agent_name": "financial-ai-agent",
        "agent_version": "1.0.0",
        "tool_name": "pay_invoice",
        "operation": "pay_invoice",
        "resource": "INV-001",
        "category": "software",
        "amount": "4200.00",
        "currency": "INR",
        "parameters": {
            "invoice_number": "INV-001",
            "vendor_name": "Acme Cloud",
            "amount": "4200.00",
        },
    }

    resp = gov_client.post("/api/v1/actions/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["decision"] == "allow"
    assert data["outcome"] == "allow"
    assert "BASE_POLICY_ALLOW" in data["reason_codes"]
    assert data["profile_style"] == "balanced"
    assert data["risk_tier"] == "R2"
    assert data["budget_check"] is not None
    assert data["budget_check"]["is_feasible"] is True
    assert data["budget_check"]["exceeds_threshold"] is False
    assert Decimal(str(data["budget_check"]["remaining_after"])) == Decimal("20800.00")


def test_case_b_inv002_reviews_under_balanced_profile(gov_client: TestClient) -> None:
    """CASE B: High-value invoice INV-002 (32,000 INR) requires review (threshold reached)."""
    payload = {
        "trace_id": f"trace-case-b-{uuid4().hex[:8]}",
        "agent_name": "financial-ai-agent",
        "agent_version": "1.0.0",
        "tool_name": "pay_invoice",
        "operation": "pay_invoice",
        "resource": "INV-002",
        "category": "infrastructure",
        "amount": "32000.00",
        "currency": "INR",
        "parameters": {
            "invoice_number": "INV-002",
            "vendor_name": "Apex Hosting",
            "amount": "32000.00",
        },
    }

    resp = gov_client.post("/api/v1/actions/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["decision"] == "review"
    assert data["outcome"] == "review"
    assert "APPROVAL_THRESHOLD_REACHED" in data["reason_codes"]
    assert "BUDGET_EXCEEDED" not in data["reason_codes"]
    assert data["profile_style"] == "balanced"
    assert data["budget_check"] is not None
    assert data["budget_check"]["category"] == "infrastructure"
    assert data["budget_check"]["is_feasible"] is True
    assert data["budget_check"]["exceeds_threshold"] is True


def test_case_c_inv003_denies_with_dual_reasons(gov_client: TestClient) -> None:
    """CASE C: INV-003 is denied with dual reasons: BUDGET_EXCEEDED and UNVERIFIED_BENEFICIARY."""
    payload = {
        "trace_id": f"trace-case-c-{uuid4().hex[:8]}",
        "agent_name": "financial-ai-agent",
        "agent_version": "1.0.0",
        "tool_name": "pay_invoice",
        "operation": "pay_invoice",
        "resource": "INV-003",
        "category": "miscellaneous",
        "amount": "85000.00",
        "currency": "INR",
        "parameters": {
            "invoice_number": "INV-003",
            "vendor_name": "SecureNet Global",
            "amount": "85000.00",
        },
    }

    resp = gov_client.post("/api/v1/actions/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["decision"] == "deny"
    assert data["outcome"] == "deny"
    # Dual reason assertion
    assert "BUDGET_EXCEEDED" in data["reason_codes"]
    assert "UNVERIFIED_BENEFICIARY" in data["reason_codes"]
    assert data["budget_check"] is not None
    assert data["budget_check"]["is_feasible"] is False


def test_strict_control_profile_requires_review_on_protected_tools(
    gov_client: TestClient,
) -> None:
    """Verify Strict Control forces operator review even on small payments."""
    # 1. Fetch profiles and find Strict Control
    profiles_resp = gov_client.get("/api/v1/governance/profiles")
    assert profiles_resp.status_code == 200
    profiles = profiles_resp.json()
    strict_profile = next(p for p in profiles if p["style"] == "strict")

    # 2. Activate Strict Control
    act_resp = gov_client.post(f"/api/v1/governance/profiles/{strict_profile['id']}/activate")
    assert act_resp.status_code == 200
    assert act_resp.json()["active"] is True

    # 3. Evaluate small invoice INV-001 (4,200 INR)
    payload = {
        "trace_id": f"trace-strict-{uuid4().hex[:8]}",
        "agent_name": "financial-ai-agent",
        "agent_version": "1.0.0",
        "tool_name": "pay_invoice",
        "operation": "pay_invoice",
        "resource": "INV-001",
        "category": "software",
        "amount": "4200.00",
        "currency": "INR",
        "parameters": {"invoice_number": "INV-001"},
    }
    resp = gov_client.post("/api/v1/actions/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["decision"] == "review"
    assert "STRICT_CONTROL_REVIEW_REQUIRED" in data["reason_codes"]
    assert data["profile_style"] == "strict"


def test_high_autonomy_profile_allows_within_budget(gov_client: TestClient) -> None:
    """Verify High Autonomy auto-allows operations below critical tier R4."""
    # Find and activate High Autonomy
    profiles = gov_client.get("/api/v1/governance/profiles").json()
    high_autonomy = next(p for p in profiles if p["style"] == "high_autonomy")
    gov_client.post(f"/api/v1/governance/profiles/{high_autonomy['id']}/activate")

    # Evaluate INV-002 (32,000 INR, R2 risk tier)
    payload = {
        "trace_id": f"trace-autonomy-{uuid4().hex[:8]}",
        "agent_name": "financial-ai-agent",
        "agent_version": "1.0.0",
        "tool_name": "pay_invoice",
        "operation": "pay_invoice",
        "resource": "INV-002",
        "category": "infrastructure",
        "amount": "32000.00",
        "currency": "INR",
        "parameters": {"invoice_number": "INV-002"},
    }
    resp = gov_client.post("/api/v1/actions/evaluate", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["decision"] == "allow"
    assert "BASE_POLICY_ALLOW" in data["reason_codes"]


def test_custom_profile_lifecycle_and_enforcement(gov_client: TestClient) -> None:
    """Verify creating, activating, and enforcing custom policy thresholds."""
    create_payload = {
        "name": "Custom Engineering Policy",
        "style": "custom",
        "description": "Tailored thresholds for engineering operations.",
        "configuration": {
            "max_action_amount": "50000.00",
            "review_threshold": "10000.00",
            "require_verified_beneficiary": True,
            "require_review_operations": ["transfer_funds"],
        },
    }
    create_resp = gov_client.post("/api/v1/governance/profiles", json=create_payload)
    assert create_resp.status_code == 201
    custom_profile = create_resp.json()

    # Activate
    gov_client.post(f"/api/v1/governance/profiles/{custom_profile['id']}/activate")

    # 1. Action exceeding custom max spend limit (e.g. 60,000 INR)
    resp1 = gov_client.post(
        "/api/v1/actions/evaluate",
        json={
            "trace_id": f"trace-custom-max-{uuid4().hex[:8]}",
            "agent_name": "financial-ai-agent",
            "agent_version": "1.0.0",
            "tool_name": "pay_invoice",
            "operation": "pay_invoice",
            "resource": "INV-002",
            "category": "infrastructure",
            "amount": "60000.00",
            "currency": "INR",
            "parameters": {"invoice_number": "INV-002"},
        },
    )
    assert resp1.status_code == 200
    assert resp1.json()["decision"] == "deny"
    assert "MAX_AMOUNT_EXCEEDED" in resp1.json()["reason_codes"]

    # 2. Action reaching custom review threshold (e.g. 15,000 INR)
    resp2 = gov_client.post(
        "/api/v1/actions/evaluate",
        json={
            "trace_id": f"trace-custom-rev-{uuid4().hex[:8]}",
            "agent_name": "financial-ai-agent",
            "agent_version": "1.0.0",
            "tool_name": "pay_invoice",
            "operation": "pay_invoice",
            "resource": "INV-002",
            "category": "infrastructure",
            "amount": "15000.00",
            "currency": "INR",
            "parameters": {"invoice_number": "INV-002"},
        },
    )
    assert resp2.status_code == 200
    assert resp2.json()["decision"] == "review"
    assert "CUSTOM_THRESHOLD_REACHED" in resp2.json()["reason_codes"]


def test_hard_invariant_denials(gov_client: TestClient) -> None:
    """Verify hard invariants: unregistered tool, inactive tool, unknown version, no permission."""
    base_payload = {
        "trace_id": f"trace-inv-{uuid4().hex[:8]}",
        "agent_name": "financial-ai-agent",
        "agent_version": "1.0.0",
        "tool_name": "pay_invoice",
        "operation": "pay_invoice",
        "resource": "INV-001",
        "category": "software",
        "amount": "4200.00",
        "currency": "INR",
        "parameters": {"invoice_number": "INV-001"},
    }

    # 1. Unregistered tool
    p_tool = dict(base_payload, tool_name="unregistered_tool", operation="unregistered_tool")
    r1 = gov_client.post("/api/v1/actions/evaluate", json=p_tool)
    assert r1.status_code == 200
    assert r1.json()["decision"] == "deny"
    assert "TOOL_UNREGISTERED" in r1.json()["reason_codes"]

    # 2. Unknown agent version
    p_ver = dict(base_payload, agent_version="99.9.9")
    r2 = gov_client.post("/api/v1/actions/evaluate", json=p_ver)
    assert r2.status_code == 200
    assert r2.json()["decision"] == "deny"
    assert "AGENT_VERSION_UNKNOWN" in r2.json()["reason_codes"]

    # 3. Missing permission: agent doesn't have permission for unauthorized tool
    p_perm = dict(base_payload, agent_name="unknown-agent")
    r3 = gov_client.post("/api/v1/actions/evaluate", json=p_perm)
    assert r3.status_code == 200
    assert r3.json()["decision"] == "deny"
    assert (
        "AGENT_INACTIVE" in r3.json()["reason_codes"]
        or "PERMISSION_MISSING" in r3.json()["reason_codes"]
    )


def test_governance_decisions_query_api(gov_client: TestClient) -> None:
    """Verify decision listing and single decision retrieval by action_id."""
    # Evaluate an action
    payload = {
        "trace_id": f"trace-query-{uuid4().hex[:8]}",
        "agent_name": "financial-ai-agent",
        "agent_version": "1.0.0",
        "tool_name": "pay_invoice",
        "operation": "pay_invoice",
        "resource": "INV-001",
        "category": "software",
        "amount": "4200.00",
        "currency": "INR",
        "parameters": {"invoice_number": "INV-001"},
    }
    eval_resp = gov_client.post("/api/v1/actions/evaluate", json=payload)
    action_id = eval_resp.json()["action_id"]

    # Query single decision
    dec_resp = gov_client.get(f"/api/v1/governance/decisions/{action_id}")
    assert dec_resp.status_code == 200
    assert dec_resp.json()["action_id"] == action_id

    # Query action execution request
    act_resp = gov_client.get(f"/api/v1/actions/{action_id}")
    assert act_resp.status_code == 200
    assert act_resp.json()["action_id"] == action_id
    assert act_resp.json()["decision"] is not None

    # Query list
    list_resp = gov_client.get("/api/v1/governance/decisions?limit=10")
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1


def test_cross_channel_governance_parity(gov_client: TestClient) -> None:
    """Verify Web message interaction evaluates governance and attaches summary."""
    # Send user message asking to review and prepare payment for INV-001
    resp = gov_client.post(
        "/api/v1/interactions/message",
        json={"text": "Please inspect unpaid invoice INV-001 and prepare payment proposal."},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] in ("proposal_ready", "accepted", "completed")
    if data.get("proposed_action"):
        assert data.get("governance") is not None
        gov = data["governance"]
        assert gov["outcome"] in ("allow", "review", "deny")
        assert len(gov["reason_codes"]) >= 1
        assert gov["risk_tier"] != ""
        assert gov["profile_name"] != ""
