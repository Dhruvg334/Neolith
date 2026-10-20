"""Pydantic v2 schemas for the Financial Reference Application API."""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field

AccountStatus = Literal["active", "frozen", "closed"]
InvoiceStatus = Literal["unpaid", "pending_approval", "paid", "cancelled", "overdue"]
BeneficiaryStatus = Literal["active", "pending", "inactive", "blocked"]
TransactionStatus = Literal["pending", "completed", "failed", "cancelled"]


def format_decimal_amount(value: Decimal) -> str:
    """Format a Decimal monetary amount as an exact two-decimal string (e.g. '100000.00')."""
    if isinstance(value, float):
        msg = "Monetary values must use Decimal, never float"
        raise TypeError(msg)
    quantized = Decimal(value).quantize(Decimal("0.01"))
    return f"{quantized:.2f}"


class FinancialAccountResponse(BaseModel):
    """Response model for a synthetic financial account."""

    id: UUID
    organisation_name: str
    name: str
    account_type: str
    currency: str
    available_balance: str
    status: AccountStatus
    created_at: datetime
    updated_at: datetime


class BeneficiaryResponse(BaseModel):
    """Response model for a synthetic beneficiary (no sensitive payment credentials)."""

    id: UUID
    name: str
    reference: str
    status: BeneficiaryStatus
    verified: bool
    created_at: datetime


class InvoiceResponse(BaseModel):
    """Response model for a synthetic vendor invoice."""

    id: UUID
    invoice_number: str
    vendor_name: str
    vendor_id: UUID | None = None
    category: str
    amount: str
    currency: str
    due_date: date
    status: InvoiceStatus
    is_verified_vendor: bool
    description: str
    created_at: datetime
    updated_at: datetime


class FinancialTransactionResponse(BaseModel):
    """Response model for a synthetic financial transaction."""

    id: UUID
    transaction_type: str
    account_id: UUID
    invoice_id: UUID | None = None
    beneficiary_id: UUID | None = None
    category: str | None = None
    amount: str
    currency: str
    status: TransactionStatus
    reference: str
    idempotency_key: str | None = None
    created_at: datetime
    completed_at: datetime | None = None


class FinancialCategoryBudgetResponse(BaseModel):
    """Category budget status computed using exact Decimal arithmetic."""

    id: UUID
    category: str
    currency: str
    period_type: str
    limit_amount: str
    used_amount: str
    available_amount: str
    approval_threshold: str | None = None
    status: str


class FinancialToolMetadataResponse(BaseModel):
    """Registered Financial Agent tool definition metadata."""

    id: UUID
    version_id: UUID
    name: str
    version: str
    description: str
    description_hash: str
    protocol: str
    risk_tier: str
    read_only: bool
    protected: bool
    reversibility: str
    required_capability: str
    input_schema: dict[str, Any]
    output_schema: dict[str, Any]
    input_schema_hash: str
    output_schema_hash: str
    endpoint_ref: str
    status: str


class FinancialSummaryResponse(BaseModel):
    """Aggregated financial demo state for the dashboard and agent context."""

    organisation_name: str
    primary_account: FinancialAccountResponse | None = None
    total_available_balance: str
    currency: str = Field(default="INR")
    unpaid_invoice_count: int
    unpaid_invoice_value: str
    monthly_budgets: list[FinancialCategoryBudgetResponse]
    recent_transactions: list[FinancialTransactionResponse]
