"""Service and repository queries for the Financial Reference Application."""

from decimal import Decimal
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from neolith_api.core.models import BudgetModel, ToolModel, ToolVersionModel
from neolith_api.financial.models import (
    BeneficiaryModel,
    FinancialAccountModel,
    FinancialTransactionModel,
    InvoiceModel,
)
from neolith_api.financial.schemas import (
    BeneficiaryResponse,
    FinancialAccountResponse,
    FinancialCategoryBudgetResponse,
    FinancialSummaryResponse,
    FinancialToolMetadataResponse,
    FinancialTransactionResponse,
    InvoiceResponse,
    format_decimal_amount,
)


def to_account_response(model: FinancialAccountModel) -> FinancialAccountResponse:
    """Convert FinancialAccountModel to FinancialAccountResponse with Decimal formatting."""
    return FinancialAccountResponse(
        id=model.id,
        organisation_name=model.organisation_name,
        name=model.name,
        account_type=model.account_type,
        currency=model.currency,
        available_balance=format_decimal_amount(Decimal(model.available_balance)),
        status=model.status,  # type: ignore[arg-type]
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def to_beneficiary_response(model: BeneficiaryModel) -> BeneficiaryResponse:
    """Convert BeneficiaryModel to BeneficiaryResponse."""
    return BeneficiaryResponse(
        id=model.id,
        name=model.name,
        reference=model.reference,
        status=model.status,  # type: ignore[arg-type]
        verified=model.verified,
        created_at=model.created_at,
    )


def to_invoice_response(model: InvoiceModel) -> InvoiceResponse:
    """Convert InvoiceModel to InvoiceResponse with Decimal formatting."""
    return InvoiceResponse(
        id=model.id,
        invoice_number=model.invoice_number,
        vendor_name=model.vendor_name,
        vendor_id=model.vendor_id,
        category=model.category,
        amount=format_decimal_amount(Decimal(model.amount)),
        currency=model.currency,
        due_date=model.due_date,
        status=model.status,  # type: ignore[arg-type]
        is_verified_vendor=model.is_verified_vendor,
        description=model.description,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def to_transaction_response(
    model: FinancialTransactionModel,
) -> FinancialTransactionResponse:
    """Convert FinancialTransactionModel to FinancialTransactionResponse."""
    return FinancialTransactionResponse(
        id=model.id,
        transaction_type=model.transaction_type,
        account_id=model.account_id,
        invoice_id=model.invoice_id,
        beneficiary_id=model.beneficiary_id,
        category=model.category,
        amount=format_decimal_amount(Decimal(model.amount)),
        currency=model.currency,
        status=model.status,  # type: ignore[arg-type]
        reference=model.reference,
        idempotency_key=model.idempotency_key,
        created_at=model.created_at,
        completed_at=model.completed_at,
    )


def list_financial_accounts(session: Session) -> list[FinancialAccountResponse]:
    """Return all synthetic financial accounts ordered by creation timestamp."""
    stmt = select(FinancialAccountModel).order_by(FinancialAccountModel.created_at.asc())
    rows = session.scalars(stmt).all()
    return [to_account_response(row) for row in rows]


def get_financial_account(session: Session, account_id: UUID) -> FinancialAccountResponse | None:
    """Retrieve a single synthetic financial account by ID."""
    row = session.get(FinancialAccountModel, account_id)
    if row is None:
        return None
    return to_account_response(row)


def list_invoices(session: Session, status_filter: str | None = None) -> list[InvoiceResponse]:
    """Return synthetic vendor invoices ordered by invoice_number."""
    stmt = select(InvoiceModel).order_by(InvoiceModel.invoice_number.asc())
    if status_filter:
        stmt = stmt.where(InvoiceModel.status == status_filter)
    rows = session.scalars(stmt).all()
    return [to_invoice_response(row) for row in rows]


def get_invoice_by_id_or_number(session: Session, invoice_ref: str) -> InvoiceResponse | None:
    """Retrieve a synthetic invoice by UUID or invoice_number (e.g. INV-001)."""
    try:
        parsed_uuid = UUID(invoice_ref)
        row = session.get(InvoiceModel, parsed_uuid)
        if row is not None:
            return to_invoice_response(row)
    except ValueError:
        pass

    stmt = select(InvoiceModel).where(InvoiceModel.invoice_number == invoice_ref)
    row = session.scalars(stmt).first()
    if row is None:
        return None
    return to_invoice_response(row)


def list_beneficiaries(session: Session) -> list[BeneficiaryResponse]:
    """Return synthetic beneficiaries ordered by name."""
    stmt = select(BeneficiaryModel).order_by(BeneficiaryModel.name.asc())
    rows = session.scalars(stmt).all()
    return [to_beneficiary_response(row) for row in rows]


def list_transactions(
    session: Session, account_id: UUID | None = None, limit: int = 50
) -> list[FinancialTransactionResponse]:
    """Return recent financial transactions ordered newest first."""
    stmt = select(FinancialTransactionModel).order_by(FinancialTransactionModel.created_at.desc())
    if account_id is not None:
        stmt = stmt.where(FinancialTransactionModel.account_id == account_id)
    stmt = stmt.limit(limit)
    rows = session.scalars(stmt).all()
    return [to_transaction_response(row) for row in rows]


def list_financial_budgets(session: Session) -> list[FinancialCategoryBudgetResponse]:
    """Return category budgets with exact Decimal used and available amounts."""
    budget_stmt = (
        select(BudgetModel)
        .where(BudgetModel.owner_type == "category")
        .order_by(BudgetModel.owner_id.asc())
    )
    budgets = session.scalars(budget_stmt).all()

    tx_stmt = select(FinancialTransactionModel).where(
        FinancialTransactionModel.status == "completed"
    )
    completed_txs = session.scalars(tx_stmt).all()

    used_by_category: dict[str, Decimal] = {}
    for tx in completed_txs:
        if tx.category and tx.transaction_type in ("invoice_payment", "funds_transfer"):
            current = used_by_category.get(tx.category, Decimal("0.00"))
            used_by_category[tx.category] = current + Decimal(tx.amount)

    results: list[FinancialCategoryBudgetResponse] = []
    for budget in budgets:
        limit_dec = Decimal(budget.limit_amount)
        used_dec = used_by_category.get(budget.owner_id, Decimal("0.00"))
        available_dec = max(Decimal("0.00"), limit_dec - used_dec)
        threshold_str = (
            format_decimal_amount(Decimal(budget.approval_threshold))
            if budget.approval_threshold is not None
            else None
        )
        results.append(
            FinancialCategoryBudgetResponse(
                id=budget.id,
                category=budget.owner_id,
                currency=budget.currency,
                period_type=budget.period_type,
                limit_amount=format_decimal_amount(limit_dec),
                used_amount=format_decimal_amount(used_dec),
                available_amount=format_decimal_amount(available_dec),
                approval_threshold=threshold_str,
                status=budget.status,
            )
        )
    return results


def list_financial_tools(session: Session) -> list[FinancialToolMetadataResponse]:
    """Return registered Financial Agent tools and their active version metadata."""
    stmt = (
        select(ToolModel, ToolVersionModel)
        .join(ToolVersionModel, ToolVersionModel.tool_id == ToolModel.id)
        .order_by(ToolModel.read_only.desc(), ToolModel.name.asc())
    )
    pairs = session.execute(stmt).all()
    results: list[FinancialToolMetadataResponse] = []
    for tool, version in pairs:
        results.append(
            FinancialToolMetadataResponse(
                id=tool.id,
                version_id=version.id,
                name=tool.name,
                version=version.version,
                description=tool.description,
                description_hash=version.description_hash,
                protocol=tool.protocol,
                risk_tier=tool.risk_tier,
                read_only=tool.read_only,
                protected=tool.protected,
                reversibility=tool.reversibility,
                required_capability=tool.required_capability,
                input_schema=version.input_schema,
                output_schema=version.output_schema,
                input_schema_hash=version.input_schema_hash,
                output_schema_hash=version.output_schema_hash,
                endpoint_ref=version.endpoint_ref,
                status=tool.status,
            )
        )
    return results


def build_financial_summary(session: Session) -> FinancialSummaryResponse:
    """Compute the aggregated financial demo summary using exact Decimal arithmetic."""
    accounts = list_financial_accounts(session)
    primary_account = accounts[0] if accounts else None
    organisation_name = (
        primary_account.organisation_name if primary_account else "Neolith Demo Corp"
    )

    total_balance = Decimal("0.00")
    for acc in accounts:
        if acc.status == "active":
            total_balance += Decimal(acc.available_balance)

    unpaid_invoices = list_invoices(session, status_filter="unpaid")
    unpaid_total = Decimal("0.00")
    for inv in unpaid_invoices:
        unpaid_total += Decimal(inv.amount)

    budgets = list_financial_budgets(session)
    recent_txs = list_transactions(session, limit=10)

    return FinancialSummaryResponse(
        organisation_name=organisation_name,
        primary_account=primary_account,
        total_available_balance=format_decimal_amount(total_balance),
        currency="INR",
        unpaid_invoice_count=len(unpaid_invoices),
        unpaid_invoice_value=format_decimal_amount(unpaid_total),
        monthly_budgets=budgets,
        recent_transactions=recent_txs,
    )
