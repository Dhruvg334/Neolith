"""Budget and atomic pre-execution reservation models (F06)."""

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from neolith_api.users import EntityStatus

BudgetOwnerType = Literal["user", "project", "category", "task"]
BudgetPeriodType = Literal["task", "day", "week", "month", "lifetime"]
ReservationState = Literal[
    "pending",
    "reserved",
    "committed",
    "released",
    "expired",
    "reconciliation_required",
]


class BudgetSchema(BaseModel):
    """Authoritative financial or resource budget limit using exact Decimal arithmetic."""

    id: UUID
    owner_type: BudgetOwnerType
    owner_id: str
    currency: str = Field(min_length=3, max_length=3)
    limit_amount: Decimal = Field(ge=Decimal("0.00"))
    approval_threshold: Decimal | None = None
    period_type: BudgetPeriodType
    status: EntityStatus = "active"
    created_at: datetime


class BudgetReservationSchema(BaseModel):
    """Pre-execution atomic budget reservation record."""

    id: UUID
    action_id: UUID
    budget_id: UUID
    amount: Decimal = Field(ge=Decimal("0.00"))
    currency: str = Field(min_length=3, max_length=3)
    state: ReservationState = "pending"
    redis_key: str
    expires_at: datetime
    committed_at: datetime | None = None
    released_at: datetime | None = None
    created_at: datetime
