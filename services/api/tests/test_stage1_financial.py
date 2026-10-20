"""Comprehensive Stage 1 tests for Core Domain, Financial Sandbox, Simulator, and Contracts."""

from decimal import Decimal
from pathlib import Path
from uuid import uuid4

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine, inspect

from neolith_agent.state import (
    FinancialActionProposal,
    FinancialContext,
    InvoiceSummary,
)
from neolith_api.core.config import Settings
from neolith_api.core.database import initialize_database
from neolith_api.main import create_app
from neolith_api.seed import DEMO_ACCOUNT_ID, seed_demo_data
from neolith_simulator.banking import (
    AddBeneficiarySimulatorRequest,
    CancelPaymentSimulatorRequest,
    PayInvoiceSimulatorRequest,
    PermitRequiredError,
    SimulatedBankingService,
    TransferFundsSimulatorRequest,
)


@pytest.fixture()
def stage1_client() -> TestClient:
    """Create a FastAPI TestClient backed by an in-memory SQLite Stage 1 database."""
    settings = Settings(
        DATABASE_URL="sqlite+pysqlite:///:memory:",
        REDIS_URL="redis://localhost:6379/0",
        OPA_URL="http://localhost:8181",
    )
    app = create_app(settings=settings)
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    # Use StaticPool via initialize_database's build_engine so connections share in-memory DB
    from neolith_api.core.database import build_engine

    shared_engine = build_engine("sqlite+pysqlite:///:memory:")
    factory = initialize_database(shared_engine, seed_if_empty=True)
    app.state.db_engine = shared_engine
    app.state.session_factory = factory
    engine.dispose()
    return TestClient(app)


def test_alembic_migration_creates_all_stage1_tables(tmp_path: Path) -> None:
    """Verify Alembic migration 0001_stage1_core_and_financial creates all 12 tables cleanly."""
    db_file = tmp_path / "alembic_stage1.db"
    db_url = f"sqlite+pysqlite:///{db_file.as_posix()}"

    api_dir = Path(__file__).resolve().parents[1]
    alembic_cfg = Config(str(api_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(api_dir / "migrations"))
    alembic_cfg.set_main_option("sqlalchemy.url", db_url)

    command.upgrade(alembic_cfg, "head")

    engine = create_engine(db_url)
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    expected_tables = {
        "users",
        "agents",
        "agent_versions",
        "tools",
        "tool_versions",
        "tasks",
        "budgets",
        "system_state",
        "financial_accounts",
        "financial_beneficiaries",
        "financial_invoices",
        "financial_transactions",
    }
    assert expected_tables.issubset(tables)
    engine.dispose()


def test_seed_idempotency(stage1_client: TestClient) -> None:
    """1. Seed idempotency: running seed twice does not duplicate financial or registry records."""
    factory = stage1_client.app.state.session_factory  # type: ignore[union-attr]
    with factory() as session:
        first_counts = seed_demo_data(session, reset=False)
        second_counts = seed_demo_data(session, reset=False)

    assert first_counts == second_counts

    # Also test POST /api/v1/financial/seed endpoint idempotency
    res1 = stage1_client.post("/api/v1/financial/seed")
    res2 = stage1_client.post("/api/v1/financial/seed")
    assert res1.status_code == 200
    assert res2.status_code == 200

    accounts = stage1_client.get("/api/v1/financial/accounts").json()
    invoices = stage1_client.get("/api/v1/financial/invoices").json()
    beneficiaries = stage1_client.get("/api/v1/financial/beneficiaries").json()
    budgets = stage1_client.get("/api/v1/financial/budgets").json()
    tools = stage1_client.get("/api/v1/financial/tools").json()

    assert len(accounts) == 1
    assert len(invoices) == 3
    assert len(beneficiaries) == 3
    assert len(budgets) == 3
    assert len(tools) == 9


def test_financial_account_endpoints(stage1_client: TestClient) -> None:
    """2. Financial account endpoints return Operations Account with exact Decimal balance."""
    list_res = stage1_client.get("/api/v1/financial/accounts")
    assert list_res.status_code == 200
    accounts = list_res.json()
    assert len(accounts) == 1

    acc = accounts[0]
    assert acc["id"] == str(DEMO_ACCOUNT_ID)
    assert acc["organisation_name"] == "Neolith Demo Corp"
    assert acc["name"] == "Operations Account"
    assert acc["currency"] == "INR"
    assert acc["available_balance"] == "100000.00"
    assert acc["status"] == "active"

    detail_res = stage1_client.get(f"/api/v1/financial/accounts/{DEMO_ACCOUNT_ID}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["available_balance"] == "100000.00"
    assert detail["currency"] == "INR"

    not_found_res = stage1_client.get(f"/api/v1/financial/accounts/{uuid4()}")
    assert not_found_res.status_code == 404
    assert not_found_res.json()["reason_code"] == "FINANCIAL_ACCOUNT_NOT_FOUND"


def test_invoice_endpoints(stage1_client: TestClient) -> None:
    """3. Invoice endpoints return INV-001, INV-002, INV-003 by number or UUID."""
    res = stage1_client.get("/api/v1/financial/invoices")
    assert res.status_code == 200
    invoices = res.json()
    assert [inv["invoice_number"] for inv in invoices] == ["INV-001", "INV-002", "INV-003"]

    by_num = stage1_client.get("/api/v1/financial/invoices/INV-001")
    assert by_num.status_code == 200
    inv1 = by_num.json()
    assert inv1["vendor_name"] == "Acme Cloud"
    assert inv1["amount"] == "8000.00"
    assert inv1["currency"] == "INR"
    assert inv1["category"] == "software"
    assert inv1["is_verified_vendor"] is True
    assert inv1["status"] == "unpaid"

    by_uuid = stage1_client.get(f"/api/v1/financial/invoices/{inv1['id']}")
    assert by_uuid.status_code == 200
    assert by_uuid.json()["invoice_number"] == "INV-001"

    inv3 = stage1_client.get("/api/v1/financial/invoices/INV-003").json()
    assert inv3["vendor_name"] == "Unknown Supplies"
    assert inv3["amount"] == "75000.00"
    assert inv3["category"] == "miscellaneous"
    assert inv3["is_verified_vendor"] is False

    missing = stage1_client.get("/api/v1/financial/invoices/INV-999")
    assert missing.status_code == 404
    assert missing.json()["reason_code"] == "FINANCIAL_INVOICE_NOT_FOUND"


def test_budget_endpoints(stage1_client: TestClient) -> None:
    """4. Budget endpoints return software, infrastructure, and miscellaneous monthly budgets."""
    res = stage1_client.get("/api/v1/financial/budgets")
    assert res.status_code == 200
    budgets = {b["category"]: b for b in res.json()}
    assert set(budgets.keys()) == {"software", "infrastructure", "miscellaneous"}

    assert budgets["software"]["limit_amount"] == "25000.00"
    assert budgets["software"]["available_amount"] == "25000.00"
    assert budgets["infrastructure"]["limit_amount"] == "50000.00"
    assert budgets["miscellaneous"]["limit_amount"] == "10000.00"


def test_beneficiary_endpoints(stage1_client: TestClient) -> None:
    """5. Beneficiary endpoints return verified and unverified beneficiaries."""
    res = stage1_client.get("/api/v1/financial/beneficiaries")
    assert res.status_code == 200
    by_name = {b["name"]: b for b in res.json()}
    assert by_name["Acme Cloud"]["verified"] is True
    assert by_name["Nova Compute"]["verified"] is True
    assert by_name["Unknown Supplies"]["verified"] is False


def test_financial_summary_endpoint(stage1_client: TestClient) -> None:
    """6. Financial summary endpoint returns balance, unpaid invoice count/value, and budgets."""
    res = stage1_client.get("/api/v1/financial/summary")
    assert res.status_code == 200
    summary = res.json()
    assert summary["organisation_name"] == "Neolith Demo Corp"
    assert summary["total_available_balance"] == "100000.00"
    assert summary["currency"] == "INR"
    assert summary["unpaid_invoice_count"] == 3
    # 8000.00 + 35000.00 + 75000.00 = 118000.00
    assert summary["unpaid_invoice_value"] == "118000.00"
    assert len(summary["monthly_budgets"]) == 3
    assert len(summary["recent_transactions"]) >= 1


def test_financial_tools_endpoint(stage1_client: TestClient) -> None:
    """7. Financial tools endpoint returns read-only and protected tools with risk tiers."""
    res = stage1_client.get("/api/v1/financial/tools")
    assert res.status_code == 200
    tools = res.json()
    assert len(tools) == 9

    read_only_tools = [t for t in tools if t["read_only"]]
    protected_tools = [t for t in tools if t["protected"]]
    assert len(read_only_tools) == 5
    assert len(protected_tools) == 4
    assert all(t["risk_tier"] == "R1" for t in read_only_tools)

    by_name = {t["name"]: t for t in tools}
    assert by_name["pay_invoice"]["risk_tier"] == "R2"
    assert by_name["pay_invoice"]["protected"] is True
    assert by_name["transfer_funds"]["risk_tier"] == "R3"
    assert by_name["add_beneficiary"]["risk_tier"] == "R4"
    assert by_name["cancel_payment"]["risk_tier"] == "R2"


def test_task_endpoints(stage1_client: TestClient) -> None:
    """8. Task endpoints create, list, and retrieve tasks."""
    create_res = stage1_client.post(
        "/api/v1/tasks",
        json={
            "original_request": "Pay invoice INV-001 for Acme Cloud",
            "objective": "Settle software invoice INV-001 within monthly budget",
            "constraints": {"max_amount": "8000.00", "currency": "INR"},
        },
    )
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["original_request"] == "Pay invoice INV-001 for Acme Cloud"
    assert created["state"] == "planning"
    task_id = created["id"]

    list_res = stage1_client.get("/api/v1/tasks")
    assert list_res.status_code == 200
    tasks = list_res.json()
    assert any(t["id"] == task_id for t in tasks)

    detail_res = stage1_client.get(f"/api/v1/tasks/{task_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == task_id

    missing_res = stage1_client.get(f"/api/v1/tasks/{uuid4()}")
    assert missing_res.status_code == 404
    assert missing_res.json()["reason_code"] == "TASK_NOT_FOUND"


def test_registry_endpoints(stage1_client: TestClient) -> None:
    """9. Registry endpoints (/agents, /tools, /budgets) return seeded platform records."""
    agents_res = stage1_client.get("/api/v1/agents")
    assert agents_res.status_code == 200
    agents = agents_res.json()
    assert len(agents) == 1
    assert agents[0]["name"] == "financial-ai-agent"
    assert agents[0]["active_version"] == "0.1.0"
    assert len(agents[0]["allowed_tools"]) == 9

    tools_res = stage1_client.get("/api/v1/tools")
    assert tools_res.status_code == 200
    assert len(tools_res.json()) == 9

    budgets_res = stage1_client.get("/api/v1/budgets")
    assert budgets_res.status_code == 200
    budgets = budgets_res.json()
    assert len(budgets) == 3
    assert {b["owner_id"] for b in budgets} == {"software", "infrastructure", "miscellaneous"}


def test_simulator_read_methods() -> None:
    """10. Simulator read methods return deterministic account, invoice, and budget records."""
    sim = SimulatedBankingService()

    account = sim.get_account_balance()
    assert account.name == "Operations Account"
    assert account.available_balance == "100000.00"
    assert account.currency == "INR"

    txs = sim.list_transactions(limit=10)
    assert len(txs) == 1
    assert txs[0].amount == "100000.00"

    inv1 = sim.get_invoice("INV-001")
    assert inv1.vendor_name == "Acme Cloud"
    assert inv1.amount == "8000.00"
    assert inv1.is_verified_vendor is True

    budgets = sim.get_budget_status("software")
    assert len(budgets) == 1
    assert budgets[0].limit_amount == "25000.00"

    bene = sim.get_beneficiary("Unknown Supplies")
    assert bene.verified is False


def test_no_ungoverned_payment_bypass(stage1_client: TestClient) -> None:
    """11. Verify no public endpoint or simulator call allows ungoverned payment execution."""
    # Verify no direct payment endpoints exist on the public API
    for forbidden_path in [
        "/api/v1/financial/pay",
        "/api/v1/financial/transfer",
        "/api/v1/financial/invoices/INV-001/pay",
        "/api/v1/pay",
    ]:
        resp = stage1_client.post(forbidden_path, json={"invoice_id": "INV-001"})
        assert resp.status_code in (404, 405)

    # Verify creating a task does NOT mutate account balance or mark any invoice paid
    stage1_client.post(
        "/api/v1/tasks",
        json={"original_request": "Pay invoice INV-001 immediately"},
    )
    summary = stage1_client.get("/api/v1/financial/summary").json()
    assert summary["total_available_balance"] == "100000.00"
    assert summary["unpaid_invoice_count"] == 3

    # Verify all 4 protected write operations on SimulatedBankingService raise PermitRequiredError
    sim = SimulatedBankingService()
    with pytest.raises(PermitRequiredError):
        sim.pay_invoice(
            PayInvoiceSimulatorRequest(
                invoice_id="INV-001",
                account_id=DEMO_ACCOUNT_ID,
                amount=Decimal("8000.00"),
            )
        )
    with pytest.raises(PermitRequiredError):
        sim.transfer_funds(
            TransferFundsSimulatorRequest(
                source_account_id=DEMO_ACCOUNT_ID,
                beneficiary_id=uuid4(),
                amount=Decimal("5000.00"),
                category="software",
                reference="TEST-TRANSFER",
            )
        )
    with pytest.raises(PermitRequiredError):
        sim.add_beneficiary(
            AddBeneficiarySimulatorRequest(
                name="Shadow Corp",
                reference="BENE-SHDW",
            )
        )
    with pytest.raises(PermitRequiredError):
        sim.cancel_payment(
            CancelPaymentSimulatorRequest(
                transaction_id=uuid4(),
                reason="Test cancel",
            )
        )

    # Verify FinancialActionProposal contract strictly forbids governance decision fields
    valid_proposal = FinancialActionProposal(
        action_type="pay_invoice",
        target_id="INV-001",
        amount=Decimal("8000.00"),
        currency="INR",
        category="software",
        vendor_name="Acme Cloud",
        justification="Verified SaaS invoice within monthly software budget.",
        evidence_refs=["INV-001"],
    )
    assert valid_proposal.action_type == "pay_invoice"

    for forbidden_field in ("permission_granted", "policy_allowed", "permit_valid", "approved"):
        with pytest.raises(ValidationError):
            FinancialActionProposal.model_validate(
                {
                    "action_type": "pay_invoice",
                    "target_id": "INV-001",
                    "justification": "Attempted self-approval bypass",
                    forbidden_field: True,
                }
            )

    # Verify FinancialContext contract works with Decimal budgets and InvoiceSummary
    ctx = FinancialContext(
        account_id=DEMO_ACCOUNT_ID,
        available_balance=Decimal("100000.00"),
        currency="INR",
        category_budgets={"software": Decimal("25000.00")},
        unpaid_invoices=[
            InvoiceSummary(
                invoice_id=uuid4(),
                invoice_number="INV-001",
                vendor_name="Acme Cloud",
                category="software",
                amount=Decimal("8000.00"),
                currency="INR",
                due_date="2026-11-15",
                status="unpaid",
                is_verified_vendor=True,
            )
        ],
    )
    assert ctx.available_balance == Decimal("100000.00")
