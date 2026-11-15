"""Stage 5 tests: System Control (Emergency Stop, Revocation Epoch), Agent Quarantine,

Permit Consumption, Effective Permissions, and F15 Evaluation & Assurance Lab.
"""

from uuid import UUID, uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from neolith_api.core.config import Settings
from neolith_api.core.database import build_engine, initialize_database
from neolith_api.core.models import AgentModel
from neolith_api.financial.models import InvoiceModel
from neolith_api.governance.models import ExecutionPermitModel
from neolith_api.main import create_app


@pytest.fixture
def app_and_factory(opa_server: str) -> tuple[TestClient, sessionmaker[Session]]:
    """Create a FastAPI test client configured with an isolated test SQLite DB."""
    settings = Settings(
        database_url="sqlite+pysqlite:///:memory:",
        redis_url="redis://localhost:6379/0",
        opa_url=opa_server,
    )
    app: FastAPI = create_app(settings=settings)
    engine = build_engine("sqlite+pysqlite:///:memory:")
    factory = initialize_database(engine, seed_if_empty=True)
    app.state.db_engine = engine
    app.state.session_factory = factory
    return TestClient(app), factory


def test_system_state_and_emergency_stop_lifecycle(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure system state can be retrieved, emergency stop activated, and restored."""
    client, _ = app_and_factory

    # 1. Check default state
    res = client.get("/api/v1/system/state")
    assert res.status_code == 200
    data = res.json()
    assert data["emergency_stop_active"] is False
    assert data["revocation_epoch"] == 0

    # 2. Trigger emergency stop
    res = client.post("/api/v1/system/emergency-stop")
    assert res.status_code == 200
    stop_data = res.json()
    assert stop_data["emergency_stop_active"] is True
    assert stop_data["revocation_epoch"] == 1

    # 3. Action evaluation during emergency stop must evaluate to DENY
    eval_res = client.post(
        "/api/v1/actions/evaluate",
        json={
            "trace_id": f"trace-test-stop-{uuid4().hex[:8]}",
            "agent_name": "financial-ai-agent",
            "agent_version": "1.0.0",
            "action_type": "pay_invoice",
            "tool_name": "pay_invoice",
            "operation": "pay_invoice",
            "resource": "INV-001",
            "risk_tier": "R2",
            "category": "software",
            "amount": "8000.00",
            "currency": "INR",
            "parameters": {"invoice_id": "INV-001", "invoice_number": "INV-001"},
        },
    )
    assert eval_res.status_code == 200
    assert eval_res.json()["decision"] == "deny"
    assert "EMERGENCY_STOP_ACTIVE" in eval_res.json()["reason_codes"]

    # 4. Restore system
    res = client.post("/api/v1/system/restore")
    assert res.status_code == 200
    restore_data = res.json()
    assert restore_data["emergency_stop_active"] is False
    assert restore_data["revocation_epoch"] == 1


def test_agent_quarantine_and_reactivation(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure agent quarantine causes immediate policy denial and reactivation restores it."""
    client, factory = app_and_factory

    with factory() as session:
        agent = session.scalars(select(AgentModel)).first()
        assert agent is not None
        agent_id = str(agent.id)

    # 1. Quarantine agent
    res = client.post(f"/api/v1/agents/{agent_id}/quarantine")
    assert res.status_code == 200
    assert res.json()["status"] == "quarantined"

    # 2. Action evaluation by quarantined agent must be DENIED
    eval_res = client.post(
        "/api/v1/actions/evaluate",
        json={
            "trace_id": f"trace-test-quarantine-{uuid4().hex[:8]}",
            "agent_name": "financial-ai-agent",
            "agent_version": "1.0.0",
            "action_type": "pay_invoice",
            "tool_name": "pay_invoice",
            "operation": "pay_invoice",
            "resource": "INV-001",
            "risk_tier": "R2",
            "category": "software",
            "amount": "8000.00",
            "currency": "INR",
            "parameters": {"invoice_id": "INV-001", "invoice_number": "INV-001"},
        },
    )
    assert eval_res.status_code == 200
    assert eval_res.json()["decision"] == "deny"
    assert "AGENT_INACTIVE" in eval_res.json()["reason_codes"]

    # 3. Reactivate agent
    res = client.post(f"/api/v1/agents/{agent_id}/activate")
    assert res.status_code == 200
    assert res.json()["status"] == "active"


def test_effective_permissions_endpoint(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure GET /api/v1/permissions/effective returns capability list."""
    client, _ = app_and_factory
    res = client.get("/api/v1/permissions/effective")
    assert res.status_code == 200
    data = res.json()
    assert "financial:pay_invoice" in data["capabilities"]
    assert "financial:read_account" in data["capabilities"]
    assert data["status"] == "active"


def test_permit_consumption_and_replay_rejection(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure POST /api/v1/permits/{id}/consume rejects duplicate consumption (PERMIT_REPLAY)."""
    client, factory = app_and_factory

    # Create an allowed action which issues a permit
    eval_res = client.post(
        "/api/v1/actions/evaluate",
        json={
            "trace_id": f"trace-test-permit-{uuid4().hex[:8]}",
            "agent_name": "financial-ai-agent",
            "agent_version": "1.0.0",
            "action_type": "pay_invoice",
            "tool_name": "pay_invoice",
            "operation": "pay_invoice",
            "resource": "INV-001",
            "risk_tier": "R2",
            "category": "software",
            "amount": "8000.00",
            "currency": "INR",
            "parameters": {"invoice_id": "INV-001", "invoice_number": "INV-001"},
        },
    )
    assert eval_res.status_code == 200
    action_id = eval_res.json()["action_id"]

    with factory() as session:
        permit = session.scalars(
            select(ExecutionPermitModel).where(ExecutionPermitModel.action_id == UUID(action_id))
        ).first()
        assert permit is not None
        permit_id = str(permit.id)

    # Permit was already consumed during automatic settlement
    # Second consumption attempt via API must fail with PERMIT_REPLAY
    res = client.post(f"/api/v1/permits/{permit_id}/consume")
    assert res.status_code == 400
    assert "PERMIT_REPLAY" in res.json()["detail"]


def test_permit_consumption_parameter_mutation_detection(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure consuming a permit with altered parameters fails PARAMETER_HASH_MISMATCH."""
    client, factory = app_and_factory

    eval_res = client.post(
        "/api/v1/actions/evaluate",
        json={
            "trace_id": f"trace-test-mutate-{uuid4().hex[:8]}",
            "agent_name": "financial-ai-agent",
            "agent_version": "1.0.0",
            "action_type": "pay_invoice",
            "tool_name": "pay_invoice",
            "operation": "pay_invoice",
            "resource": "INV-001",
            "risk_tier": "R2",
            "category": "software",
            "amount": "8000.00",
            "currency": "INR",
            "parameters": {"invoice_id": "INV-001", "invoice_number": "INV-001"},
        },
    )
    assert eval_res.status_code == 200
    action_id = eval_res.json()["action_id"]

    with factory() as session:
        permit = session.scalars(
            select(ExecutionPermitModel).where(ExecutionPermitModel.action_id == UUID(action_id))
        ).first()
        assert permit is not None
        # Set permit back to issued state for test
        permit.state = "issued"
        session.commit()
        permit_id = str(permit.id)

    # Attempt consumption with altered parameter payload
    res = client.post(
        f"/api/v1/permits/{permit_id}/consume",
        json={"parameters_override": {"invoice_number": "INV-003", "amount": "75000.00"}},
    )
    assert res.status_code == 400
    assert "PARAMETER_HASH_MISMATCH" in res.json()["detail"]


def test_approvals_shortcut_endpoints(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure POST /api/v1/approvals/{id}/approve and /reject shortcuts work."""
    client, factory = app_and_factory

    # Fetch seeded pending approval (INV-002)
    appr_res = client.get("/api/v1/approvals?state=pending")
    approvals = appr_res.json()
    assert len(approvals) >= 1
    appr_id = approvals[0]["id"]

    # Approve shortcut
    res = client.post(f"/api/v1/approvals/{appr_id}/approve")
    assert res.status_code == 200
    data = res.json()
    assert data["approval"]["state"] == "approved"
    assert data["settlement_tx_id"] is not None

    with factory() as session:
        inv2 = session.scalars(
            select(InvoiceModel).where(InvoiceModel.invoice_number == "INV-002")
        ).first()
        assert inv2 is not None
        assert inv2.status == "paid"


def test_evaluation_assurance_lab_suite(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure F15 Assurance Lab runs all 7 canonical scenarios with 100% pass rate."""
    client, _ = app_and_factory

    # 1. Check scenarios list
    scen_res = client.get("/api/v1/evaluation/scenarios")
    assert scen_res.status_code == 200
    scenarios = scen_res.json()
    assert len(scenarios) == 7

    # 2. Run evaluation suite
    run_res = client.post("/api/v1/evaluation/runs")
    assert run_res.status_code == 200
    run_data = run_res.json()
    for r in run_data.get("results", []):
        if not r.get("passed"):
            print(
                "FAILED SCENARIO:", r.get("external_id"), r.get("failure_reason"), r.get("details")
            )
    assert run_data["state"] == "completed"
    assert run_data["scenarios_total"] == 7
    assert run_data["scenarios_passed"] == 7
    assert run_data["scenarios_failed"] == 0
    assert len(run_data["results"]) == 7

    # Verify every individual scenario passed
    for result in run_data["results"]:
        assert result["passed"] is True, (
            f"Scenario failed: {result['external_id']} - {result['failure_reason']}"
        )

    # 3. List runs
    runs_list = client.get("/api/v1/evaluation/runs")
    assert runs_list.status_code == 200
    assert len(runs_list.json()) >= 1
