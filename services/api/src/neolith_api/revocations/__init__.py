"""Revocation epoch and runtime containment models (F13, SRS 3.12)."""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

RevocationScopeType = Literal["agent", "task", "tool", "permit", "system"]


class SystemStateSchema(BaseModel):
    """Authoritative global revocation epoch and emergency stop state."""

    revocation_epoch: int = Field(default=0, ge=0)
    emergency_stop_active: bool = False
    updated_at: datetime


class RevocationSchema(BaseModel):
    """Scoped revocation or emergency stop event."""

    id: UUID
    scope_type: RevocationScopeType
    scope_id: str | None = None
    epoch: int = Field(ge=0)
    reason: str
    issued_by: UUID | None = None
    issued_at: datetime
