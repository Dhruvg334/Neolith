"""SQLAlchemy 2.0 ORM models for the synthetic financial reference domain."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from neolith_api.core.database import Base
from neolith_api.core.models import utc_now


class FinancialAccountModel(Base):
    """Synthetic operating account for the Financial AI Agent demonstration."""

    __tablename__ = "financial_accounts"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    organisation_name: Mapped[str] = mapped_column(
        String(255), nullable=False, default="Neolith Demo Corp"
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    account_type: Mapped[str] = mapped_column(String(64), nullable=False, default="operating")
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    available_balance: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class BeneficiaryModel(Base):
    """Synthetic vendor/beneficiary record (no real banking or payment credentials)."""

    __tablename__ = "financial_beneficiaries"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    reference: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )


class InvoiceModel(Base):
    """Synthetic vendor invoice for the Financial AI Agent demonstration."""

    __tablename__ = "financial_invoices"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    invoice_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    vendor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    vendor_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("financial_beneficiaries.id"), nullable=True
    )
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="unpaid")
    is_verified_vendor: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now
    )


class FinancialTransactionModel(Base):
    """Synthetic ledger transaction record."""

    __tablename__ = "financial_transactions"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    transaction_type: Mapped[str] = mapped_column(String(64), nullable=False)
    account_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("financial_accounts.id"), nullable=False
    )
    invoice_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("financial_invoices.id"), nullable=True
    )
    beneficiary_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("financial_beneficiaries.id"), nullable=True
    )
    category: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    reference: Mapped[str] = mapped_column(String(128), nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utc_now
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
