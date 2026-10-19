"""Human approval models bound to canonical action hashes (F08)."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

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
