"""Structured workflow state for the primary procurement and financial planning agent (F02)."""

from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

WorkflowNode = Literal[
    "understand_goal",
    "clarify_constraints",
    "retrieve_candidates",
    "compare_candidates",
    "build_plan",
    "propose_action",
    "await_governance",
]

FinancialActionType = Literal[
    "pay_invoice",
    "transfer_funds",
    "add_beneficiary",
    "cancel_payment",
]


class InvoiceSummary(BaseModel):
    """Read-only summary of an unpaid invoice exposed to the Financial Agent."""

    model_config = ConfigDict(extra="forbid")

    invoice_id: UUID
    invoice_number: str
    vendor_name: str
    category: str
    amount: Decimal
    currency: str = "INR"
    due_date: str
    status: str = "unpaid"
    is_verified_vendor: bool


class FinancialContext(BaseModel):
    """Read-only financial sandbox state provided to the Financial Agent during planning."""

    model_config = ConfigDict(extra="forbid")

    account_id: UUID
    available_balance: Decimal
    currency: str = "INR"
    category_budgets: dict[str, Decimal] = Field(default_factory=dict)
    unpaid_invoices: list[InvoiceSummary] = Field(default_factory=list)


class FinancialActionProposal(BaseModel):
    """Candidate financial action proposed by the Financial Agent.

    NOTE: The agent never grants permissions, evaluates policies, or issues permits.
    Fields such as ``permission_granted``, ``policy_allowed``, ``permit_valid``, and
    ``approved`` are strictly forbidden on this contract and belong exclusively to
    Neolith's Runtime Gateway.
    """

    model_config = ConfigDict(extra="forbid")

    action_type: FinancialActionType
    target_id: str
    amount: Decimal | None = None
    currency: str = "INR"
    category: str | None = None
    vendor_name: str | None = None
    justification: str
    evidence_refs: list[str] = Field(default_factory=list)


class ActionProposal(BaseModel):
    """Structured action proposal emitted by the agent (never direct execution)."""

    model_config = ConfigDict(extra="forbid")

    purpose: str
    tool: str
    operation: str
    parameters: dict[str, Any]
    amount: str | None = None
    currency: str | None = None
    evidence_ids: list[str] = Field(default_factory=list)
    expected_governance_checks: list[str] = Field(
        default_factory=lambda: ["permission", "policy", "budget", "risk"]
    )


class AgentWorkflowState(BaseModel):
    """Serializable checkpoint state for a Neolith primary agent task run."""

    model_config = ConfigDict(extra="forbid")

    task_id: UUID
    user_id: UUID
    trace_id: str
    raw_request: str
    extracted_objective: str | None = None
    constraints: dict[str, Any] = Field(default_factory=dict)
    missing_fields: list[str] = Field(default_factory=list)
    candidate_ids: list[str] = Field(default_factory=list)
    recommended_vendor_id: str | None = None
    proposal: ActionProposal | None = None
    financial_context: FinancialContext | None = None
    financial_proposal: FinancialActionProposal | None = None
    current_node: WorkflowNode = "understand_goal"
    tainted_context_detected: bool = False
