"""Stage 4 tests for Human Approvals (F08), Permits (F09), Settlement (F10), Receipts (F13)."""

from decimal import Decimal
from uuid import UUID

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, sessionmaker

from neolith_api.core.config import Settings
from neolith_api.core.database import build_engine, initialize_database
from neolith_api.financial.models import (
    FinancialAccountModel,
    FinancialTransactionModel,
    InvoiceModel,
)
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


def test_list_approvals_seeded(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure GET /api/v1/approvals lists the seeded pending approval for INV-002."""
    client, _ = app_and_factory
    res = client.get("/api/v1/approvals")
    assert res.status_code == 200
    approvals = res.json()
    assert len(approvals) >= 1

    inv2_appr = next((a for a in approvals if a.get("resource") == "INV-002"), None)
    assert inv2_appr is not None
    assert inv2_appr["state"] == "pending"
    assert inv2_appr["operation"] == "pay_invoice"
    assert Decimal(str(inv2_appr["amount"])) == Decimal("35000.00")
    assert inv2_appr["governance_outcome"] == "review"
    assert "REVIEW_THRESHOLD_EXCEEDED" in inv2_appr["reason_codes"]


def test_get_approval_by_id(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure GET /api/v1/approvals/{id} returns full enriched approval record."""
    client, _ = app_and_factory
    list_res = client.get("/api/v1/approvals")
    approval_id = list_res.json()[0]["id"]

    res = client.get(f"/api/v1/approvals/{approval_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == approval_id
    assert data["state"] == "pending"
    assert "action_hash" in data


def test_decide_approval_approve_and_settlement(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure approving a pending payment executes settlement and records receipts."""
    client, factory = app_and_factory

    # 1. Fetch pending approval for INV-002
    list_res = client.get("/api/v1/approvals?state=pending")
    inv2_appr = next((a for a in list_res.json() if a.get("resource") == "INV-002"), None)
    assert inv2_appr is not None
    approval_id = inv2_appr["id"]

    # Check account balance before approval
    with factory() as session:
        account_before = session.scalars(select(FinancialAccountModel)).first()
        assert account_before is not None
        balance_before = Decimal(str(account_before.available_balance))

    # 2. Submit approval decision
    res = client.post(
        f"/api/v1/approvals/{approval_id}/decision",
        json={
            "decision": "approve",
            "note": "Authorized by treasury director for monthly compute.",
            "decided_by": "operator@neolith.local",
        },
    )
    assert res.status_code == 200
    decision_data = res.json()
    assert decision_data["approval"]["state"] == "approved"
    assert decision_data["permit_id"] is not None
    assert decision_data["execution_status"] == "settled"
    assert decision_data["settlement_tx_id"] is not None

    # 3. Verify database state
    with factory() as session:
        # Invoice should be paid
        inv = session.scalars(
            select(InvoiceModel).where(InvoiceModel.invoice_number == "INV-002")
        ).first()
        assert inv is not None
        assert inv.status == "paid"

        # Account balance should be debited by 35,000 INR
        account_after = session.scalars(select(FinancialAccountModel)).first()
        assert account_after is not None
        balance_after = Decimal(str(account_after.available_balance))
        assert balance_after == balance_before - Decimal("35000.00")

        # Financial transaction should be recorded
        tx = session.get(FinancialTransactionModel, UUID(str(decision_data["settlement_tx_id"])))
        assert tx is not None
        assert tx.status == "completed"
        assert tx.amount == Decimal("35000.00")

        # Execution permit should be consumed
        permit = session.get(ExecutionPermitModel, UUID(str(decision_data["permit_id"])))
        assert permit is not None
        assert permit.state == "consumed"
        assert permit.consumed_at is not None

    # Receipts chain should verify 100% valid
    verify_res = client.get("/api/v1/receipts/verify")
    assert verify_res.status_code == 200
    assert verify_res.json()["valid"] is True


def test_decide_approval_reject(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure rejecting an approval marks it rejected and denies the action without settlement."""
    client, _ = app_and_factory

    # Create a new review action first
    eval_res = client.post(
        "/api/v1/actions/evaluate",
        json={
            "trace_id": "test-reject-trace",
            "agent_name": "financial-ai-agent",
            "agent_version": "1.0.0",
            "tool_name": "pay_invoice",
            "operation": "pay_invoice",
            "resource": "INV-002",
            "category": "infrastructure",
            "amount": 35000.00,
            "parameters": {"invoice_number": "INV-002"},
            "context": {},
        },
    )
    assert eval_res.status_code == 200
    action_id = eval_res.json()["action_id"]

    # Find the corresponding approval
    approvals_res = client.get("/api/v1/approvals?state=pending")
    appr = next((a for a in approvals_res.json() if a["action_id"] == action_id), None)
    assert appr is not None
    approval_id = appr["id"]

    # Submit reject
    res = client.post(
        f"/api/v1/approvals/{approval_id}/decision",
        json={
            "decision": "reject",
            "note": "Budget review required before proceeding.",
            "decided_by": "operator@neolith.local",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["approval"]["state"] == "rejected"
    assert data["permit_id"] is None
    assert data["execution_status"] is None

    # Action should be denied
    action_res = client.get(f"/api/v1/actions/{action_id}")
    assert action_res.status_code == 200
    assert action_res.json()["state"] == "denied"


def test_receipts_endpoints_and_chain_verification(
    app_and_factory: tuple[TestClient, sessionmaker[Session]],
) -> None:
    """Ensure receipt list, detail, and cryptographic hash verification work as specified (F13)."""
    client, _ = app_and_factory

    # 1. Verification
    verify_res = client.get("/api/v1/receipts/verify")
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["valid"] is True
    assert verify_data["total_receipts"] >= 1
    assert verify_data["head_hash"] is not None

    # 2. List
    list_res = client.get("/api/v1/receipts")
    assert list_res.status_code == 200
    receipts = list_res.json()
    assert len(receipts) >= 1
    first_receipt = receipts[0]
    assert "receipt_id" in first_receipt
    assert "chain_index" in first_receipt
    assert "payload_hash" in first_receipt
    assert "receipt_hash" in first_receipt

    # 3. Get single receipt
    detail_res = client.get(f"/api/v1/receipts/{first_receipt['receipt_id']}")
    assert detail_res.status_code == 200
    assert detail_res.json()["receipt_id"] == first_receipt["receipt_id"]
