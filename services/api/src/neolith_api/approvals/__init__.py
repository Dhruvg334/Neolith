"""Human approval models bound to canonical action hashes (F08)."""

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from neolith_api.users import UserRole

ApprovalState = Literal["pending", "approved", "rejected", "expired"]


class ApprovalSchema(BaseModel):
    """Human review record bound to an exact execution request hash."""

    id: UUID
    action_id: UUID
    action_hash: str
    required_role: UserRole = "approver"
    state: ApprovalState = "pending"
    expires_at: datetime
    decided_by: UUID | None = None
    decision_note: str | None = None
    decided_at: datetime | None = None
    created_at: datetime


class ApprovalEnrichedRead(BaseModel):
    """Enriched approval record presenting full financial and governance context."""

    id: UUID
    action_id: UUID
    action_hash: str
    operation: str
    resource: str | None = None
    amount: Decimal | None = None
    currency: str | None = None
    category: str | None = None
    vendor_name: str | None = None
    description: str | None = None
    is_verified_vendor: bool = False
    governance_outcome: str = "review"
    reason_codes: list[str] = Field(default_factory=list)
    required_role: str = "approver"
    state: ApprovalState = "pending"
    expires_at: datetime
    decided_by: UUID | None = None
    decision_note: str | None = None
    decided_at: datetime | None = None
    created_at: datetime


class ApprovalDecisionRequest(BaseModel):
    """Operator decision payload for pending human checkpoint."""

    decision: Literal["approve", "reject"]
    note: str | None = None
    decided_by: str | None = "operator@neolith.local"


class ApprovalDecisionResponse(BaseModel):
    """Result of evaluating human approval decision and subsequent execution."""

    approval: ApprovalEnrichedRead
    permit_id: UUID | None = None
    execution_status: str | None = None
    settlement_tx_id: UUID | None = None
    receipt_id: UUID | None = None
    message: str
