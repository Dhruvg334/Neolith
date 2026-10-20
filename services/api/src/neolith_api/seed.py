"""Deterministic, repeatable, idempotent seed dataset for Stage 1 Financial Sandbox."""

from datetime import UTC, date, datetime
from decimal import Decimal
from uuid import NAMESPACE_DNS, UUID, uuid5

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from neolith_api.core.models import (
    AgentModel,
    AgentVersionModel,
    BudgetModel,
    SystemStateModel,
    TaskModel,
    ToolModel,
    ToolVersionModel,
    UserModel,
)
from neolith_api.core.security import compute_sha256_prefixed
from neolith_api.financial.models import (
    BeneficiaryModel,
    FinancialAccountModel,
    FinancialTransactionModel,
    InvoiceModel,
)
from neolith_api.financial.tools import FINANCIAL_TOOL_SPECS

SEED_NAMESPACE = uuid5(NAMESPACE_DNS, "neolith.financial.demo.v1")


def deterministic_uuid(key: str) -> UUID:
    """Derive a deterministic UUIDv5 for repeatable seed records."""
    return uuid5(SEED_NAMESPACE, key)


DEMO_ORG_NAME = "Neolith Demo Corp"
DEMO_ACCOUNT_ID = deterministic_uuid("account:operations")
DEMO_USER_ID = deterministic_uuid("user:operator")
DEMO_AGENT_ID = deterministic_uuid("agent:financial-ai-agent")
DEMO_AGENT_VERSION_ID = deterministic_uuid("agent_version:financial-ai-agent:0.1.0")
DEMO_OPENING_TX_ID = deterministic_uuid("tx:opening-balance")
DEMO_SAMPLE_TASK_ID = deterministic_uuid("task:sample-invoice-review")


def seed_demo_data(session: Session, *, reset: bool = False) -> dict[str, int]:
    """Populate or refresh the deterministic Financial Reference Application seed dataset.

    Running this function multiple times is idempotent and will never duplicate records.
    When ``reset=True``, existing financial demo records are cleared and recreated cleanly.
    """
    if reset:
        session.execute(delete(FinancialTransactionModel))
        session.execute(delete(InvoiceModel))
        session.execute(delete(BeneficiaryModel))
        session.execute(delete(FinancialAccountModel))
        session.execute(delete(BudgetModel))
        session.execute(delete(TaskModel))
        session.execute(delete(ToolVersionModel))
        session.execute(delete(ToolModel))
        session.execute(delete(AgentVersionModel))
        session.execute(delete(AgentModel))
        session.flush()

    # 1. Singleton System State
    sys_state = session.get(SystemStateModel, True)
    if sys_state is None:
        sys_state = SystemStateModel(
            singleton=True,
            revocation_epoch=0,
            emergency_stop_active=False,
        )
        session.add(sys_state)

    # 2. Default Operator / Treasury User
    user = session.scalars(
        select(UserModel).where(UserModel.email == "operator@neolith.local")
    ).first()
    if user is None:
        user = UserModel(
            id=DEMO_USER_ID,
            email="operator@neolith.local",
            display_name="Treasury Operator (Neolith Demo Corp)",
            role="operator",
            status="active",
        )
        session.add(user)
        session.flush()

    # 3. Financial Agent + Immutable Version Manifest
    agent = session.scalars(
        select(AgentModel).where(AgentModel.name == "financial-ai-agent")
    ).first()
    if agent is None:
        agent = AgentModel(
            id=DEMO_AGENT_ID,
            name="financial-ai-agent",
            description=(
                "Autonomous Financial Operations & Accounts Payable AI Agent for "
                "Neolith Demo Corp. Operates under strict Runtime Gateway governance."
            ),
            owner_user_id=user.id,
            status="active",
        )
        session.add(agent)
        session.flush()

    agent_version = session.scalars(
        select(AgentVersionModel).where(
            AgentVersionModel.agent_id == agent.id,
            AgentVersionModel.version == "0.1.0",
        )
    ).first()
    tool_names = [spec.name for spec in FINANCIAL_TOOL_SPECS]
    model_manifest = {"provider": "mock", "model": "neolith-financial-planner-v1"}
    prompt_manifest = {
        "system_prompt_id": "financial-treasury-v1",
        "governance_mode": "zero_implicit_authority",
    }
    tool_manifest = {"allowed_tools": tool_names}
    artifact_digest = compute_sha256_prefixed(
        {
            "agent": "financial-ai-agent",
            "version": "0.1.0",
            "model_manifest": model_manifest,
            "prompt_manifest": prompt_manifest,
            "tool_manifest": tool_manifest,
        }
    )
    if agent_version is None:
        agent_version = AgentVersionModel(
            id=DEMO_AGENT_VERSION_ID,
            agent_id=agent.id,
            version="0.1.0",
            framework="langgraph",
            model_manifest=model_manifest,
            prompt_manifest=prompt_manifest,
            tool_manifest=tool_manifest,
            artifact_digest=artifact_digest,
            status="active",
        )
        session.add(agent_version)

    # 4. Financial Agent Tools & Pinned Tool Versions
    tools_seeded = 0
    for spec in FINANCIAL_TOOL_SPECS:
        tool = session.scalars(select(ToolModel).where(ToolModel.name == spec.name)).first()
        if tool is None:
            tool = ToolModel(
                id=deterministic_uuid(f"tool:{spec.name}"),
                name=spec.name,
                description=spec.description,
                protocol=spec.protocol,
                risk_tier=spec.risk_tier,
                reversibility=spec.reversibility,
                read_only=spec.read_only,
                protected=spec.protected,
                required_capability=spec.required_capability,
                status="active",
            )
            session.add(tool)
            session.flush()
        else:
            tool.description = spec.description
            tool.risk_tier = spec.risk_tier
            tool.reversibility = spec.reversibility
            tool.read_only = spec.read_only
            tool.protected = spec.protected
            tool.required_capability = spec.required_capability
            tool.status = "active"

        tool_ver = session.scalars(
            select(ToolVersionModel).where(
                ToolVersionModel.tool_id == tool.id,
                ToolVersionModel.version == spec.version,
            )
        ).first()
        if tool_ver is None:
            tool_ver = ToolVersionModel(
                id=deterministic_uuid(f"tool_version:{spec.name}:{spec.version}"),
                tool_id=tool.id,
                version=spec.version,
                description_hash=spec.description_hash,
                input_schema=spec.input_schema,
                output_schema=spec.output_schema,
                input_schema_hash=spec.input_schema_hash,
                output_schema_hash=spec.output_schema_hash,
                endpoint_ref=spec.endpoint_ref,
                status="active",
            )
            session.add(tool_ver)
        tools_seeded += 1

    # 5. Primary Operations Account (100000.00 INR)
    account = session.scalars(
        select(FinancialAccountModel).where(
            FinancialAccountModel.organisation_name == DEMO_ORG_NAME,
            FinancialAccountModel.name == "Operations Account",
        )
    ).first()
    if account is None:
        account = FinancialAccountModel(
            id=DEMO_ACCOUNT_ID,
            organisation_name=DEMO_ORG_NAME,
            name="Operations Account",
            account_type="operating",
            currency="INR",
            available_balance=Decimal("100000.00"),
            status="active",
        )
        session.add(account)
        session.flush()

    # 6. Beneficiaries
    beneficiary_specs = [
        {
            "key": "beneficiary:acme-cloud",
            "name": "Acme Cloud",
            "reference": "BENE-ACME-001",
            "status": "active",
            "verified": True,
        },
        {
            "key": "beneficiary:nova-compute",
            "name": "Nova Compute",
            "reference": "BENE-NOVA-002",
            "status": "active",
            "verified": True,
        },
        {
            "key": "beneficiary:unknown-supplies",
            "name": "Unknown Supplies",
            "reference": "BENE-UNKN-003",
            "status": "pending",
            "verified": False,
        },
    ]
    beneficiaries_by_name: dict[str, BeneficiaryModel] = {}
    for b_spec in beneficiary_specs:
        bene = session.scalars(
            select(BeneficiaryModel).where(BeneficiaryModel.name == str(b_spec["name"]))
        ).first()
        if bene is None:
            bene = BeneficiaryModel(
                id=deterministic_uuid(str(b_spec["key"])),
                name=str(b_spec["name"]),
                reference=str(b_spec["reference"]),
                status=str(b_spec["status"]),
                verified=bool(b_spec["verified"]),
            )
            session.add(bene)
            session.flush()
        else:
            bene.reference = str(b_spec["reference"])
            bene.status = str(b_spec["status"])
            bene.verified = bool(b_spec["verified"])
        beneficiaries_by_name[bene.name] = bene

    # 7. Vendor Invoices (INV-001, INV-002, INV-003)
    invoice_specs = [
        {
            "key": "invoice:INV-001",
            "invoice_number": "INV-001",
            "vendor_name": "Acme Cloud",
            "category": "software",
            "amount": Decimal("8000.00"),
            "currency": "INR",
            "due_date": date(2026, 11, 15),
            "status": "unpaid",
            "is_verified_vendor": True,
            "description": "Monthly enterprise observability & cloud SaaS subscription.",
        },
        {
            "key": "invoice:INV-002",
            "invoice_number": "INV-002",
            "vendor_name": "Nova Compute",
            "category": "infrastructure",
            "amount": Decimal("35000.00"),
            "currency": "INR",
            "due_date": date(2026, 11, 20),
            "status": "unpaid",
            "is_verified_vendor": True,
            "description": "Dedicated GPU inference cluster & Kubernetes node reservation.",
        },
        {
            "key": "invoice:INV-003",
            "invoice_number": "INV-003",
            "vendor_name": "Unknown Supplies",
            "category": "miscellaneous",
            "amount": Decimal("75000.00"),
            "currency": "INR",
            "due_date": date(2026, 11, 25),
            "status": "unpaid",
            "is_verified_vendor": False,
            "description": "Unverified ad-hoc hardware procurement invoice exceeding category cap.",
        },
    ]
    for inv_spec in invoice_specs:
        invoice = session.scalars(
            select(InvoiceModel).where(
                InvoiceModel.invoice_number == str(inv_spec["invoice_number"])
            )
        ).first()
        vendor_bene = beneficiaries_by_name.get(str(inv_spec["vendor_name"]))
        if invoice is None:
            due_date_val = inv_spec["due_date"]
            assert isinstance(due_date_val, date)
            invoice = InvoiceModel(
                id=deterministic_uuid(str(inv_spec["key"])),
                invoice_number=str(inv_spec["invoice_number"]),
                vendor_name=str(inv_spec["vendor_name"]),
                vendor_id=vendor_bene.id if vendor_bene else None,
                category=str(inv_spec["category"]),
                amount=Decimal(str(inv_spec["amount"])),
                currency=str(inv_spec["currency"]),
                due_date=due_date_val,
                status=str(inv_spec["status"]),
                is_verified_vendor=bool(inv_spec["is_verified_vendor"]),
                description=str(inv_spec["description"]),
            )
            session.add(invoice)
        else:
            invoice.vendor_name = str(inv_spec["vendor_name"])
            invoice.vendor_id = vendor_bene.id if vendor_bene else None
            invoice.category = str(inv_spec["category"])
            invoice.amount = Decimal(str(inv_spec["amount"]))
            invoice.currency = str(inv_spec["currency"])
            invoice.is_verified_vendor = bool(inv_spec["is_verified_vendor"])
            invoice.description = str(inv_spec["description"])

    # 8. Monthly Category Budgets
    budget_specs = [
        {
            "key": "budget:category:software:month",
            "category": "software",
            "limit_amount": Decimal("25000.00"),
            "approval_threshold": Decimal("15000.00"),
        },
        {
            "key": "budget:category:infrastructure:month",
            "category": "infrastructure",
            "limit_amount": Decimal("50000.00"),
            "approval_threshold": Decimal("25000.00"),
        },
        {
            "key": "budget:category:miscellaneous:month",
            "category": "miscellaneous",
            "limit_amount": Decimal("10000.00"),
            "approval_threshold": Decimal("5000.00"),
        },
    ]
    for b_item in budget_specs:
        budget = session.scalars(
            select(BudgetModel).where(
                BudgetModel.owner_type == "category",
                BudgetModel.owner_id == str(b_item["category"]),
                BudgetModel.period_type == "month",
            )
        ).first()
        if budget is None:
            budget = BudgetModel(
                id=deterministic_uuid(str(b_item["key"])),
                owner_type="category",
                owner_id=str(b_item["category"]),
                currency="INR",
                limit_amount=Decimal(str(b_item["limit_amount"])),
                approval_threshold=Decimal(str(b_item["approval_threshold"])),
                period_type="month",
                status="active",
            )
            session.add(budget)
        else:
            budget.limit_amount = Decimal(str(b_item["limit_amount"]))
            budget.approval_threshold = Decimal(str(b_item["approval_threshold"]))
            budget.currency = "INR"
            budget.status = "active"

    # 9. Opening Ledger Transaction
    opening_tx = session.scalars(
        select(FinancialTransactionModel).where(
            FinancialTransactionModel.idempotency_key == "seed:opening-credit:operations"
        )
    ).first()
    if opening_tx is None:
        opening_tx = FinancialTransactionModel(
            id=DEMO_OPENING_TX_ID,
            transaction_type="opening_credit",
            account_id=account.id,
            invoice_id=None,
            beneficiary_id=None,
            category="treasury",
            amount=Decimal("100000.00"),
            currency="INR",
            status="completed",
            reference="OPENING-BAL-001 — Treasury Allocation for Neolith Demo Corp",
            idempotency_key="seed:opening-credit:operations",
            completed_at=datetime.now(UTC),
        )
        session.add(opening_tx)

    # 10. Initial Sample Task Record
    sample_task = session.get(TaskModel, DEMO_SAMPLE_TASK_ID)
    if sample_task is None:
        sample_task = TaskModel(
            id=DEMO_SAMPLE_TASK_ID,
            user_id=user.id,
            original_request=(
                "Inspect unpaid vendor invoices (INV-001, INV-002, INV-003) against "
                "Neolith Demo Corp monthly category budgets and verify vendor status."
            ),
            objective="Evaluate accounts payable readiness under policy and budget guardrails.",
            constraints={"currency": "INR", "require_verified_vendor": True},
            state="planning",
            trace_id="trace-seed-demo-001",
        )
        session.add(sample_task)

    session.commit()
    return {
        "accounts": 1,
        "beneficiaries": len(beneficiary_specs),
        "invoices": len(invoice_specs),
        "budgets": len(budget_specs),
        "tools": tools_seeded,
    }


def main() -> None:
    """CLI entrypoint to initialize tables and run deterministic seed data."""
    from neolith_api.core.database import Base, build_engine, build_session_factory

    engine = build_engine()
    Base.metadata.create_all(bind=engine)
    session_factory = build_session_factory(engine)
    with session_factory() as session:
        counts = seed_demo_data(session, reset=False)
        print(f"Seeded Neolith Financial Reference Application: {counts}")


if __name__ == "__main__":
    main()
