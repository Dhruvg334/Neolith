"""Deterministic mock procurement subscription service skeleton (F10, F16)."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel

SimulationMode = Literal["success", "failure", "unknown", "compensated"]


class SimulatedSubscriptionResult(BaseModel):
    """Result returned by the permit-gated procurement simulator."""

    subscription_id: UUID
    action_id: UUID
    permit_id: UUID
    vendor_id: str
    amount: str
    currency: str
    seats: int
    mode: SimulationMode = "success"
