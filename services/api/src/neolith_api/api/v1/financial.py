"""Read-only Financial Reference Application API endpoints."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from neolith_api.core.database import get_db_session
from neolith_api.core.errors import NeolithAPIError
from neolith_api.financial.schemas import (
    BeneficiaryResponse,
    FinancialAccountResponse,
    FinancialCategoryBudgetResponse,
    FinancialSummaryResponse,
    FinancialToolMetadataResponse,
    FinancialTransactionResponse,
    InvoiceResponse,
)
from neolith_api.financial.service import (
    build_financial_summary,
    get_financial_account,
    get_invoice_by_id_or_number,
    list_beneficiaries,
    list_financial_accounts,
    list_financial_budgets,
    list_financial_tools,
    list_invoices,
    list_transactions,
)
from neolith_api.seed import seed_demo_data

router = APIRouter(prefix="/financial", tags=["financial"])


class SeedFinancialDemoResponse(BaseModel):
    """Response returned when deterministic demo data is seeded or reset."""

    status: str
    counts: dict[str, int]


@router.get(
    "/accounts",
    response_model=list[FinancialAccountResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listFinancialAccounts",
)
def get_accounts(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[FinancialAccountResponse]:
    """List synthetic treasury and operating accounts for Neolith Demo Corp."""
    return list_financial_accounts(session)


@router.get(
    "/accounts/{account_id}",
    response_model=FinancialAccountResponse,
    status_code=status.HTTP_200_OK,
    operation_id="getFinancialAccount",
)
def get_account(
    account_id: UUID,
    session: Annotated[Session, Depends(get_db_session)],
) -> FinancialAccountResponse:
    """Retrieve a single synthetic financial account by UUID."""
    account = get_financial_account(session, account_id)
    if account is None:
        raise NeolithAPIError(
            status=status.HTTP_404_NOT_FOUND,
            title="Financial account not found",
            detail=f"Financial account '{account_id}' does not exist.",
            reason_code="FINANCIAL_ACCOUNT_NOT_FOUND",
        )
    return account


@router.get(
    "/invoices",
    response_model=list[InvoiceResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listFinancialInvoices",
)
def get_invoices(
    session: Annotated[Session, Depends(get_db_session)],
    status_filter: Annotated[
        str | None,
        Query(alias="status", description="Optional invoice status filter (e.g. unpaid, paid)"),
    ] = None,
) -> list[InvoiceResponse]:
    """List synthetic vendor invoices for Neolith Demo Corp."""
    return list_invoices(session, status_filter=status_filter)


@router.get(
    "/invoices/{invoice_id}",
    response_model=InvoiceResponse,
    status_code=status.HTTP_200_OK,
    operation_id="getFinancialInvoice",
)
def get_invoice(
    invoice_id: str,
    session: Annotated[Session, Depends(get_db_session)],
) -> InvoiceResponse:
    """Retrieve a single synthetic invoice by UUID or invoice_number (e.g. INV-001)."""
    invoice = get_invoice_by_id_or_number(session, invoice_id)
    if invoice is None:
        raise NeolithAPIError(
            status=status.HTTP_404_NOT_FOUND,
            title="Invoice not found",
            detail=f"Invoice '{invoice_id}' does not exist.",
            reason_code="FINANCIAL_INVOICE_NOT_FOUND",
        )
    return invoice


@router.get(
    "/beneficiaries",
    response_model=list[BeneficiaryResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listFinancialBeneficiaries",
)
def get_beneficiaries(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[BeneficiaryResponse]:
    """List synthetic payment beneficiaries and their verification state."""
    return list_beneficiaries(session)


@router.get(
    "/transactions",
    response_model=list[FinancialTransactionResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listFinancialTransactions",
)
def get_transactions(
    session: Annotated[Session, Depends(get_db_session)],
    account_id: Annotated[UUID | None, Query(description="Filter by account UUID")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> list[FinancialTransactionResponse]:
    """List synthetic financial transactions ordered newest first."""
    return list_transactions(session, account_id=account_id, limit=limit)


@router.get(
    "/budgets",
    response_model=list[FinancialCategoryBudgetResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listFinancialBudgets",
)
def get_budgets(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[FinancialCategoryBudgetResponse]:
    """List monthly category budgets with exact Decimal used and available balances."""
    return list_financial_budgets(session)


@router.get(
    "/summary",
    response_model=FinancialSummaryResponse,
    status_code=status.HTTP_200_OK,
    operation_id="getFinancialSummary",
)
def get_summary(
    session: Annotated[Session, Depends(get_db_session)],
) -> FinancialSummaryResponse:
    """Return aggregated financial telemetry for the Neolith Demo Corp sandbox."""
    return build_financial_summary(session)


@router.get(
    "/tools",
    response_model=list[FinancialToolMetadataResponse],
    status_code=status.HTTP_200_OK,
    operation_id="listFinancialTools",
)
def get_tools(
    session: Annotated[Session, Depends(get_db_session)],
) -> list[FinancialToolMetadataResponse]:
    """Return registered Financial Agent tools and their risk/protection metadata."""
    return list_financial_tools(session)


@router.post(
    "/seed",
    response_model=SeedFinancialDemoResponse,
    status_code=status.HTTP_200_OK,
    operation_id="seedFinancialDemoData",
)
def post_seed_demo_data(
    session: Annotated[Session, Depends(get_db_session)],
    reset: Annotated[bool, Query(description="Reset financial sandbox state to baseline")] = False,
) -> SeedFinancialDemoResponse:
    """Idempotently seed or reset the deterministic Financial Reference Application dataset."""
    counts = seed_demo_data(session, reset=reset)
    return SeedFinancialDemoResponse(status="seeded", counts=counts)
