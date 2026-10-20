"""Deterministic simulated banking and accounts-payable service for Stage 1 Financial Sandbox."""

from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal
from uuid import NAMESPACE_DNS, UUID, uuid5

from pydantic import BaseModel, ConfigDict, Field

SIMULATOR_NAMESPACE = uuid5(NAMESPACE_DNS, "neolith.financial.demo.v1")
TWO_PLACES = Decimal("0.01")


def _det_uuid(key: str) -> UUID:
    return uuid5(SIMULATOR_NAMESPACE, key)


def format_money(amount: Decimal) -> str:
    """Format Decimal amount as two-decimal string."""
    return str(amount.quantize(TWO_PLACES, rounding=ROUND_HALF_UP))


class PermitRequiredError(PermissionError):
    """Raised when a protected write operation is invoked without a verified execution permit."""

    def __init__(self, operation: str, reason: str = "EXECUTION_PERMIT_REQUIRED") -> None:
        super().__init__(
            f"Protected financial tool '{operation}' requires a valid Runtime Gateway "
            f"execution permit ({reason}). Direct ungoverned execution is forbidden."
        )
        self.operation = operation
        self.reason_code = reason


class SimulatedAccountRecord(BaseModel):
    """Simulated enterprise operating account."""

    model_config = ConfigDict(extra="forbid")

    account_id: UUID
    organisation_name: str
    name: str
    currency: str = "INR"
    available_balance: str
    status: Literal["active", "frozen", "closed"] = "active"


class SimulatedInvoiceRecord(BaseModel):
    """Simulated vendor invoice."""

    model_config = ConfigDict(extra="forbid")

    invoice_id: UUID
    invoice_number: str
    vendor_name: str
    category: str
    amount: str
    currency: str = "INR"
    due_date: date
    status: Literal["unpaid", "pending_approval", "paid", "cancelled", "overdue"] = "unpaid"
    is_verified_vendor: bool


class SimulatedBeneficiaryRecord(BaseModel):
    """Simulated payment beneficiary."""

    model_config = ConfigDict(extra="forbid")

    beneficiary_id: UUID
    name: str
    reference: str
    status: Literal["active", "pending", "blocked"] = "active"
    verified: bool


class SimulatedTransactionRecord(BaseModel):
    """Simulated ledger transaction."""

    model_config = ConfigDict(extra="forbid")

    transaction_id: UUID
    transaction_type: str
    account_id: UUID
    invoice_id: UUID | None = None
    beneficiary_id: UUID | None = None
    category: str | None = None
    amount: str
    currency: str = "INR"
    status: Literal["pending", "completed", "cancelled", "failed"] = "completed"
    reference: str


class SimulatedBudgetStatusRecord(BaseModel):
    """Simulated monthly category budget status."""

    model_config = ConfigDict(extra="forbid")

    category: str
    currency: str = "INR"
    period_type: str = "month"
    limit_amount: str
    used_amount: str
    available_amount: str
    status: str = "active"


class PayInvoiceSimulatorRequest(BaseModel):
    """Input contract for the protected pay_invoice tool."""

    model_config = ConfigDict(extra="forbid")

    invoice_id: str
    account_id: UUID
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    currency: str = "INR"
    permit_id: UUID | None = None
    permit_token: str | None = None
    idempotency_key: str | None = None


class TransferFundsSimulatorRequest(BaseModel):
    """Input contract for the protected transfer_funds tool."""

    model_config = ConfigDict(extra="forbid")

    source_account_id: UUID
    beneficiary_id: UUID
    amount: Decimal = Field(..., gt=Decimal("0.00"))
    currency: str = "INR"
    category: str
    reference: str
    permit_id: UUID | None = None
    permit_token: str | None = None
    idempotency_key: str | None = None


class AddBeneficiarySimulatorRequest(BaseModel):
    """Input contract for the protected add_beneficiary tool."""

    model_config = ConfigDict(extra="forbid")

    name: str
    reference: str
    verified: bool = False
    permit_id: UUID | None = None
    permit_token: str | None = None


class CancelPaymentSimulatorRequest(BaseModel):
    """Input contract for the protected cancel_payment tool."""

    model_config = ConfigDict(extra="forbid")

    transaction_id: UUID
    reason: str
    permit_id: UUID | None = None
    permit_token: str | None = None


class SimulatedWriteOperationReceipt(BaseModel):
    """Receipt returned by a permit-verified financial write tool in Stage 2+."""

    model_config = ConfigDict(extra="forbid")

    operation: Literal["pay_invoice", "transfer_funds", "add_beneficiary", "cancel_payment"]
    permit_id: UUID
    status: Literal["completed", "compensated"]
    reference: str


class SimulatedBankingService:
    """Deterministic in-memory banking & accounts-payable simulator for Neolith Demo Corp.

    Read operations (R1) are immediately queryable by the Financial Agent and tests.
    Protected write operations (R2-R4) strictly require a verified Runtime Gateway
    execution permit and reject any direct ungoverned invocation.
    """

    def __init__(self) -> None:
        self._account = SimulatedAccountRecord(
            account_id=_det_uuid("account:operations"),
            organisation_name="Neolith Demo Corp",
            name="Operations Account",
            currency="INR",
            available_balance=format_money(Decimal("100000.00")),
            status="active",
        )
        self._beneficiaries: list[SimulatedBeneficiaryRecord] = [
            SimulatedBeneficiaryRecord(
                beneficiary_id=_det_uuid("beneficiary:acme-cloud"),
                name="Acme Cloud",
                reference="BENE-ACME-001",
                status="active",
                verified=True,
            ),
            SimulatedBeneficiaryRecord(
                beneficiary_id=_det_uuid("beneficiary:nova-compute"),
                name="Nova Compute",
                reference="BENE-NOVA-002",
                status="active",
                verified=True,
            ),
            SimulatedBeneficiaryRecord(
                beneficiary_id=_det_uuid("beneficiary:unknown-supplies"),
                name="Unknown Supplies",
                reference="BENE-UNKN-003",
                status="pending",
                verified=False,
            ),
        ]
        self._invoices: list[SimulatedInvoiceRecord] = [
            SimulatedInvoiceRecord(
                invoice_id=_det_uuid("invoice:INV-001"),
                invoice_number="INV-001",
                vendor_name="Acme Cloud",
                category="software",
                amount=format_money(Decimal("8000.00")),
                currency="INR",
                due_date=date(2026, 11, 15),
                status="unpaid",
                is_verified_vendor=True,
            ),
            SimulatedInvoiceRecord(
                invoice_id=_det_uuid("invoice:INV-002"),
                invoice_number="INV-002",
                vendor_name="Nova Compute",
                category="infrastructure",
                amount=format_money(Decimal("35000.00")),
                currency="INR",
                due_date=date(2026, 11, 20),
                status="unpaid",
                is_verified_vendor=True,
            ),
            SimulatedInvoiceRecord(
                invoice_id=_det_uuid("invoice:INV-003"),
                invoice_number="INV-003",
                vendor_name="Unknown Supplies",
                category="miscellaneous",
                amount=format_money(Decimal("75000.00")),
                currency="INR",
                due_date=date(2026, 11, 25),
                status="unpaid",
                is_verified_vendor=False,
            ),
        ]
        self._budgets: list[SimulatedBudgetStatusRecord] = [
            SimulatedBudgetStatusRecord(
                category="software",
                currency="INR",
                period_type="month",
                limit_amount=format_money(Decimal("25000.00")),
                used_amount=format_money(Decimal("0.00")),
                available_amount=format_money(Decimal("25000.00")),
                status="active",
            ),
            SimulatedBudgetStatusRecord(
                category="infrastructure",
                currency="INR",
                period_type="month",
                limit_amount=format_money(Decimal("50000.00")),
                used_amount=format_money(Decimal("0.00")),
                available_amount=format_money(Decimal("50000.00")),
                status="active",
            ),
            SimulatedBudgetStatusRecord(
                category="miscellaneous",
                currency="INR",
                period_type="month",
                limit_amount=format_money(Decimal("10000.00")),
                used_amount=format_money(Decimal("0.00")),
                available_amount=format_money(Decimal("10000.00")),
                status="active",
            ),
        ]
        self._transactions: list[SimulatedTransactionRecord] = [
            SimulatedTransactionRecord(
                transaction_id=_det_uuid("tx:opening-balance"),
                transaction_type="opening_credit",
                account_id=self._account.account_id,
                category="treasury",
                amount=format_money(Decimal("100000.00")),
                currency="INR",
                status="completed",
                reference="OPENING-BAL-001 — Treasury Allocation for Neolith Demo Corp",
            )
        ]

    # ------------------------------------------------------------------
    # Read-Only Operations (R1 — Safe for Stage 1 Agent Context & UI)
    # ------------------------------------------------------------------

    def get_account_balance(self, account_id: str | UUID | None = None) -> SimulatedAccountRecord:
        """Return the account balance record for Operations Account."""
        if account_id is not None and str(account_id) != str(self._account.account_id):
            raise KeyError(f"Simulated account '{account_id}' not found.")
        return self._account

    def list_transactions(
        self, account_id: str | UUID | None = None, limit: int = 50
    ) -> list[SimulatedTransactionRecord]:
        """List recent ledger transactions."""
        txs = self._transactions
        if account_id is not None:
            txs = [tx for tx in txs if str(tx.account_id) == str(account_id)]
        return txs[:limit]

    def get_invoice(self, invoice_id_or_number: str | UUID) -> SimulatedInvoiceRecord:
        """Retrieve a vendor invoice by UUID or invoice_number (e.g. INV-001)."""
        target = str(invoice_id_or_number)
        for inv in self._invoices:
            if inv.invoice_number == target or str(inv.invoice_id) == target:
                return inv
        raise KeyError(f"Simulated invoice '{invoice_id_or_number}' not found.")

    def get_budget_status(self, category: str | None = None) -> list[SimulatedBudgetStatusRecord]:
        """Retrieve monthly category budget status."""
        if category is None:
            return list(self._budgets)
        filtered = [b for b in self._budgets if b.category == category.lower()]
        if not filtered:
            raise KeyError(f"Simulated budget category '{category}' not found.")
        return filtered

    def get_beneficiary(self, beneficiary_id_or_name: str | UUID) -> SimulatedBeneficiaryRecord:
        """Retrieve a beneficiary by UUID or vendor name."""
        target = str(beneficiary_id_or_name).lower()
        for bene in self._beneficiaries:
            if bene.name.lower() == target or str(bene.beneficiary_id).lower() == target:
                return bene
        raise KeyError(f"Simulated beneficiary '{beneficiary_id_or_name}' not found.")

    # ------------------------------------------------------------------
    # Protected Write Operations (R2-R4 — Strictly Permit-Gated)
    # ------------------------------------------------------------------

    def pay_invoice(self, request: PayInvoiceSimulatorRequest) -> SimulatedWriteOperationReceipt:
        """Protected write stub: requires a verified Runtime Gateway ExecutionPermit."""
        raise PermitRequiredError(
            operation="pay_invoice",
            reason=(
                "EXECUTION_PERMIT_REQUIRED"
                if not request.permit_token
                else "STAGE_2_PERMIT_VERIFIER_REQUIRED"
            ),
        )

    def transfer_funds(
        self, request: TransferFundsSimulatorRequest
    ) -> SimulatedWriteOperationReceipt:
        """Protected write stub: requires a verified Runtime Gateway ExecutionPermit."""
        raise PermitRequiredError(
            operation="transfer_funds",
            reason=(
                "EXECUTION_PERMIT_REQUIRED"
                if not request.permit_token
                else "STAGE_2_PERMIT_VERIFIER_REQUIRED"
            ),
        )

    def add_beneficiary(
        self, request: AddBeneficiarySimulatorRequest
    ) -> SimulatedWriteOperationReceipt:
        """Protected write stub: requires a verified Runtime Gateway ExecutionPermit."""
        raise PermitRequiredError(
            operation="add_beneficiary",
            reason=(
                "EXECUTION_PERMIT_REQUIRED"
                if not request.permit_token
                else "STAGE_2_PERMIT_VERIFIER_REQUIRED"
            ),
        )

    def cancel_payment(
        self, request: CancelPaymentSimulatorRequest
    ) -> SimulatedWriteOperationReceipt:
        """Protected write stub: requires a verified Runtime Gateway ExecutionPermit."""
        raise PermitRequiredError(
            operation="cancel_payment",
            reason=(
                "EXECUTION_PERMIT_REQUIRED"
                if not request.permit_token
                else "STAGE_2_PERMIT_VERIFIER_REQUIRED"
            ),
        )
